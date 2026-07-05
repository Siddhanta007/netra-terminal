import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNetra } from '../../../../context/NetraContext';
import { WeaponPrediction } from '../../../../types';
import type { TradeCard } from './types';
import { CARDS_KEY, todayStr, mkCard, computeCardStats, autoTime, MONO, StatCell, Field, sep, SEP6, bare } from './helpers';
import { RecognizedState, TransitionBranch } from '../../../../components/Templates/StateGraph';
import { API_BASE } from '../../../../utils/constants';
import { SliderRow } from '../../../../components/Templates/aiLabs/SliderRow';
import { tempColor } from '../../../../components/Templates/aiLabs/helpers';

// ─── Weapon Name Mapping (Child States to Weapon / Identity) ──────────────────
const WEAPON_NAME_MAP: Record<string, string> = {
  // STRIKE
  'NS-03-CS01': 'Astra',
  'NS-03-CS02': 'BrahMos',
  'NS-03-CS03': 'Agni',
  'NS-03-CS04': 'Nirbhay',
  'NS-03-CS05': 'Akash',
  'NS-03-CS06': 'Pralay',
  // INTERCEPTION
  'NS-04-CS01': 'Rafale',
  'NS-04-CS02': 'Su-30 MKI',
  'NS-04-CS03': 'Tejas',
  'NS-04-CS04': 'Mirage-2000',
  'NS-04-CS05': 'MiG-29',
  // SATURATION
  'NS-02-CS01': 'HAL Dhruv',
  'NS-02-CS02': 'HAL Rudra',
  'NS-02-CS03': 'HAL Prachand',
  'NS-02-CS04': 'HAL Cheetah',
  // NO ENGAGEMENT
  'NS-01-CS01': 'Info Void',
  'NS-01-CS02': 'Liq Trap',
  'NS-01-CS03': 'Collapse',
  'NS-01-CS04': 'Constraint',
  'NS-01-CS05': 'Transition',
};

const splitToLines = (s: string | string[] | null | undefined): string[] => {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return s.split('\n').map(l => l.trim()).filter(Boolean);
};

const STATIC_CHILD_STATES: Record<string, Array<{ id: string; name: string; description: string; transitions: string[] }>> = {
  STRIKE: [
    { id: 'NS-03-CS01', name: 'Initiative Relocation', description: 'Trend Expansion. Missile: Astra.', transitions: ['NS-03-CS02', 'NS-03-CS03', 'NS-03-CS04', 'NS-03-CS05', 'NS-03-CS06', 'NS-04'] },
    { id: 'NS-03-CS02', name: 'Reload Relocation', description: 'Pullback Continuation. Missile: BrahMos.', transitions: ['NS-03-CS01', 'NS-03-CS03', 'NS-03-CS04', 'NS-03-CS05', 'NS-01', 'NS-04'] },
    { id: 'NS-03-CS03', name: 'Compression Loading', description: 'Trend Compression. Missile: Agni.', transitions: ['NS-03-CS01', 'NS-03-CS02', 'NS-03-CS05', 'NS-01', 'NS-04'] },
    { id: 'NS-03-CS04', name: 'Accepted Continuation', description: 'Acceptance Continuation. Missile: Nirbhay.', transitions: ['NS-03-CS01', 'NS-03-CS02', 'NS-03-CS05', 'NS-03-CS06', 'NS-01', 'NS-04'] },
    { id: 'NS-03-CS05', name: 'Objective Pursuit', description: 'Objective Driven Continuation. Missile: Akash.', transitions: ['NS-03-CS01', 'NS-03-CS02', 'NS-03-CS04', 'NS-03-CS06', 'NS-04'] },
    { id: 'NS-03-CS06', name: 'Terminal Continuation', description: 'Campaign Exhaustion. Missile: Pralay.', transitions: ['NS-03-CS05', 'NS-01', 'NS-02', 'NS-04'] },
  ],
  INTERCEPTION: [
    { id: 'NS-04-CS01', name: 'Continuation Trap', description: 'Failed Continuation. Aircraft: Rafale.', transitions: ['NS-04-CS03', 'NS-04-CS05', 'NS-03', 'NS-01'] },
    { id: 'NS-04-CS02', name: 'Rejection Trap', description: 'Failed Rejection. Aircraft: Su-30 MKI.', transitions: ['NS-04-CS03', 'NS-04-CS04', 'NS-04-CS05', 'NS-01'] },
    { id: 'NS-04-CS03', name: 'Liquidity Extraction Trap', description: 'Inventory Harvest. Aircraft: Tejas.', transitions: ['NS-04-CS01', 'NS-04-CS02', 'NS-04-CS04', 'NS-04-CS05', 'NS-01'] },
    { id: 'NS-04-CS04', name: 'Narrative Inversion Trap', description: 'Control Transfer Deception. Aircraft: Mirage-2000.', transitions: ['NS-04-CS01', 'NS-04-CS02', 'NS-04-CS03', 'NS-04-CS05', 'NS-01'] },
    { id: 'NS-04-CS05', name: 'Exhaustion Trap', description: 'False Completion. Aircraft: MiG-29.', transitions: ['NS-04-CS01', 'NS-04-CS02', 'NS-04-CS03', 'NS-03', 'NS-01'] },
  ],
  SATURATION: [
    { id: 'NS-02-CS01', name: 'Value Rotation', description: 'Value Rotation. Aircraft: HAL Dhruv.', transitions: ['NS-02-CS02', 'NS-02-CS03', 'NS-02-CS04', 'NS-03', 'NS-04'] },
    { id: 'NS-02-CS02', name: 'Compression Loading', description: 'Contracting Equilibrium. Aircraft: HAL Rudra.', transitions: ['NS-02-CS01', 'NS-02-CS03', 'NS-02-CS04', 'NS-03', 'NS-04'] },
    { id: 'NS-02-CS03', name: 'Boundary Expansion', description: 'Expanding Equilibrium. Aircraft: HAL Prachand.', transitions: ['NS-02-CS01', 'NS-02-CS02', 'NS-02-CS04', 'NS-03', 'NS-04'] },
    { id: 'NS-02-CS04', name: 'Equilibrium Collapse', description: 'Failing Equilibrium. Aircraft: HAL Cheetah.', transitions: ['NS-01', 'NS-03', 'NS-04'] },
  ],
  NO_ENGAGEMENT: [
    { id: 'NS-01-CS01', name: 'Information Void', description: 'The auction fails to communicate a coherent structural narrative.', transitions: ['NS-01-CS02', 'NS-01-CS05', 'NS-02', 'NS-03', 'NS-04'] },
    { id: 'NS-01-CS02', name: 'Liquidity Entrapment', description: 'The auction intentionally harvests liquidity while concealing genuine ownership.', transitions: ['NS-01-CS01', 'NS-01-CS03', 'NS-01-CS05', 'NS-02', 'NS-03', 'NS-04'] },
    { id: 'NS-01-CS03', name: 'Participation Collapse', description: 'The auction can no longer facilitate efficient price discovery.', transitions: ['NS-01-CS01', 'NS-01-CS04', 'NS-02', 'NS-03'] },
    { id: 'NS-01-CS04', name: 'Mechanical Constraint', description: 'External mechanisms dominate auction behaviour.', transitions: ['NS-01-CS01', 'NS-01-CS05', 'NS-02', 'NS-03', 'NS-04'] },
    { id: 'NS-01-CS05', name: 'Structural Transition', description: 'The auction is changing operational identity.', transitions: ['NS-01-CS01', 'NS-02', 'NS-03', 'NS-04'] },
  ],
};

function stanceHex(s?: string): string {
  switch ((s || '').toUpperCase()) {
    case 'ENTER':       return '#22c55e';
    case 'WAIT':        return '#f59e0b';
    case 'STAND_ASIDE': return '#ef4444';
    default:            return '#a78bfa';
  }
}

function stepText(c: unknown): string {
  if (Array.isArray(c) && c[0] && typeof c[0] === 'object' && 'text' in (c[0] as object)) {
    return String((c[0] as { text: string }).text);
  }
  if (typeof c === 'object' && c !== null) return JSON.stringify(c, null, 2);
  return String(c ?? '');
}

function SugRow({ label, value, color = '#e8eaed' }: { label: string; value?: string; color?: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: '10px', padding: '4px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', width: '70px', flexShrink: 0, paddingTop: '2px' }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: '12px', color, lineHeight: 1.55 }}>{value}</span>
    </div>
  );
}

function tacticalHex(v?: string | null): string {
  switch ((v || '').toUpperCase()) {
    case 'STRIKE':        return '#ffd700';
    case 'INTERCEPTION':  return '#38bdf8';
    case 'SATURATION':    return '#f97316';
    case 'WATCH':         return '#a78bfa';
    case 'NO_ENGAGEMENT': return '#ef4444';
    default:              return '#a78bfa';
  }
}

export default function UnifiedTradeCard({
  card, tradeIndex, assetPrefix, username, onChange, onRemove, canRemove, isLocked, getAuthHeaders,
}: {
  card: TradeCard;
  tradeIndex: number;
  assetPrefix: string;
  username: string;
  onChange: (updates: Partial<TradeCard>) => void;
  onRemove: () => void;
  canRemove: boolean;
  isLocked: boolean;
  getAuthHeaders: (extra?: Record<string, string>) => Record<string, string>;
}) {
  const {
    SYSTEM_DATA, triggerWeaponPrediction, stopWeaponPrediction, finalCommand, netraOutput,
    AVAILABLE_MODELS, selectedModel, setSelectedModel, modelConfig, setModelConfig, session
  } = useNetra();

  const type = finalCommand || 'STRIKE';
  const tacticalAccent = tacticalHex(type);

  // ── Database & UI states ──
  const exitTypes = SYSTEM_DATA.exitTypes || [];

  const [addingPos,   setAddingPos]   = useState(false);
  const [subtractPos, setSubtractPos] = useState(false);
  const [newAdd,     setNewAdd]       = useState({ price: '', stop: '', qty: '65', cost: '10' });
  const [newPartial, setNewPartial]   = useState({ qty: '', price: '' });
  const [saving,     setSaving]       = useState(false);
  const [saved,      setSaved]        = useState(false);
  const [saveError,  setSaveError]    = useState('');

  const [thinkOpen, setThinkOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [completeExitOpen, setCompleteExitOpen] = useState(false);

  // ── Auto SL and decision targets calculation ──
  useEffect(() => {
    const price = parseFloat(card.entry);
    if (!price || price <= 0 || card.slManual) return;
    onChange({ sl: (price * 0.95).toFixed(2), t4: (price * 2).toFixed(2) });
  }, [card.entry]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const price = parseFloat(card.entry);
    if (!price || price <= 0) return;
    const t4 = (price * 2).toFixed(2);
    let cancelled = false;
    fetch(`${API_BASE}/api/decision/trade-targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_price: price, side: card.side }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.t1) onChange({ t1: String(data.t1), t2: String(data.t2), t3: String(data.t3), t4 });
        else onChange({ t4 });
      })
      .catch(() => { if (!cancelled) onChange({ t4 }); });
    return () => { cancelled = true; };
  }, [card.entry, card.side]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Retrieve child states ──
  const out = (netraOutput || {}) as Record<string, unknown>;
  const inner = (out.data && typeof out.data === 'object' ? out.data : out) as Record<string, unknown>;
  const childStatesFromOutput = (inner.child_states || []) as Array<{ id: string; name: string; description: string; transitions?: string[] }>;

  const [enrichedChildStates, setEnrichedChildStates] = useState<any[]>([]);

  useEffect(() => {
    const stateId = (inner.recognized_state as any)?.state_id || inner.state_id || (finalCommand === 'STRIKE' ? 'NS-03' : finalCommand === 'INTERCEPTION' ? 'NS-04' : finalCommand === 'SATURATION' ? 'NS-02' : 'NS-01');
    if (!stateId) return;

    let active = true;
    fetch(`${API_BASE}/api/states/${stateId}`)
      .then(r => r.ok ? r.json() : null)
      .then(proj => {
        if (proj && proj.child_states && active) {
          setEnrichedChildStates(proj.child_states);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [inner.recognized_state, inner.state_id, finalCommand]);

  const staticList = STATIC_CHILD_STATES[type] || STATIC_CHILD_STATES['STRIKE'];
  const sourceList = enrichedChildStates.length > 0 ? enrichedChildStates : (childStatesFromOutput.length > 0 ? childStatesFromOutput : staticList);
  const choices = sourceList.map(cs => ({
    id: cs.id,
    displayName: WEAPON_NAME_MAP[cs.id] || cs.name,
    originalName: cs.name,
    description: cs.description || (cs as any).market_name || '',
    transitions: ((cs as any).transitions || []).map((t: any) => {
      if (!t) return null;
      if (typeof t === 'string') return t;
      const rawId = t.child_state_id || t.parent_state_id || t.target || '';
      const match = rawId.match(/^(NS-\d{2}(?:-CS\d{2})?)/);
      return match ? match[1] : null;
    }).filter(Boolean),
    transition_reasons: ((cs as any).transitions || []).reduce((acc: Record<string, string>, t: any) => {
      if (t && typeof t === 'object') {
        const rawId = t.child_state_id || t.parent_state_id || t.target || '';
        const match = rawId.match(/^(NS-\d{2}(?:-CS\d{2})?)/);
        if (match && t.reason) {
          acc[match[1]] = t.reason;
        }
      }
      return acc;
    }, {}),
    entry_logic:  Array.isArray((cs as any).entry_logic)  ? (cs as any).entry_logic  : splitToLines((cs as any).entry_logic),
    stop_logic:   Array.isArray((cs as any).stop_logic)   ? (cs as any).stop_logic   : splitToLines((cs as any).stop_logic),
    target_logic: Array.isArray((cs as any).target_logic) ? (cs as any).target_logic : splitToLines((cs as any).target_logic),
    failure_conditions: (cs as any).failure_conditions || [],
    dimensions: (cs as any).dimensions || [],
    execution_mapping: Array.isArray((cs as any).execution_mapping)
      ? (cs as any).execution_mapping
      : splitToLines((cs as any).execution_mapping),
    observation_mapping: Array.isArray((cs as any).observation_mapping)
      ? (cs as any).observation_mapping
      : splitToLines((cs as any).observation_mapping),
    events: (cs as any).events || []
  }));

  const MANUAL_CHOICE = {
    id: 'MANUAL',
    displayName: 'Custom Override',
    originalName: 'Custom Override',
    description: 'Operator-defined entry — no catalog model fits. Write the strategy you will actually run.',
    transitions: [],
    transition_reasons: {},
    entry_logic: [],
    stop_logic: [],
    target_logic: [],
    failure_conditions: [],
    dimensions: [],
    execution_mapping: [],
    events: []
  };

  const allChoices = [...choices, MANUAL_CHOICE];
  const selected = allChoices.find(w => w.id === card.weapon);
  const isManual = card.weapon === 'MANUAL';

  // Select first weapon by default if none is set
  useEffect(() => {
    if (!card.weapon && choices.length > 0) {
      onChange({ weapon: choices[0].id });
    }
  }, [card.weapon, choices, onChange]);

  // Maya's prediction
  const wp       = (card.weaponPrediction || {}) as WeaponPrediction;
  const aiPick   = (wp.weapon || wp.name || '') as string;
  const hasPred  = !!(wp.stance || wp.name || wp.weapon);
  const stance   = String(wp.stance || '').toUpperCase();
  const sColor   = stanceHex(stance);
  const trace    = (wp.agent_trace as Array<{ agent: string; content: unknown }> | undefined) || [];

  const askMaya = async () => {
    setPredicting(true);
    try {
      const result = await triggerWeaponPrediction(card.weaponThought);
      if (result) onChange({ weaponPrediction: result as WeaponPrediction });
    } finally {
      setPredicting(false);
    }
  };

  const applyPick = () => {
    if (wp.type === 'custom') {
      onChange({ weapon: 'MANUAL', weaponNote: [wp.name, wp.entry, wp.reasoning].filter(Boolean).join(' — ') });
    } else {
      const m = allChoices.find(w =>
        w.id.toLowerCase() === aiPick.toLowerCase() ||
        w.displayName.toLowerCase() === aiPick.toLowerCase() ||
        w.originalName.toLowerCase() === aiPick.toLowerCase()
      );
      onChange({ weapon: m ? m.id : aiPick });
    }
  };

  const buildWeaponTransitionTree = (tId: string, depth = 1, seen = new Set<string>()): TransitionBranch[] => {
    if (depth <= 0 || seen.has(tId)) return [];
    seen.add(tId);

    const item = choices.find(c => c.id === tId);
    if (!item) {
      const isMaster = tId.startsWith('NS-') && !tId.includes('-CS');
      return [{
        target_state: tId,
        target_name: isMaster ? (tId === 'NS-01' ? 'No Engagement' : tId === 'NS-02' ? 'Saturation' : tId === 'NS-03' ? 'Strike' : tId === 'NS-04' ? 'Interception' : tId) : tId,
        target_command: isMaster ? (tId === 'NS-01' ? 'NO_ENGAGEMENT' : tId === 'NS-02' ? 'SATURATION' : tId === 'NS-03' ? 'STRIKE' : tId === 'NS-04' ? 'INTERCEPTION' : null) : type,
        target_posture: isMaster ? (tId === 'NS-01' ? 'STAND_DOWN' : 'ENGAGE') : 'ENGAGE',
        children: []
      }];
    }

    const transitions = item.transitions || [];
    return transitions.map((nextId: string) => {
      const nextCs = choices.find(c => c.id === nextId);
      const isNextMaster = nextId.startsWith('NS-') && !nextId.includes('-CS');
      return {
        target_state: nextId,
        target_name: WEAPON_NAME_MAP[nextId] || (isNextMaster ? (nextId === 'NS-01' ? 'No Engagement' : nextId === 'NS-02' ? 'Saturation' : nextId === 'NS-03' ? 'Strike' : nextId === 'NS-04' ? 'Interception' : nextId) : nextId),
        target_command: isNextMaster ? (nextId === 'NS-01' ? 'NO_ENGAGEMENT' : nextId === 'NS-02' ? 'SATURATION' : nextId === 'NS-03' ? 'STRIKE' : nextId === 'NS-04' ? 'INTERCEPTION' : null) : type,
        target_posture: isNextMaster ? (nextId === 'NS-01' ? 'STAND_DOWN' : 'ENGAGE') : 'ENGAGE',
        children: buildWeaponTransitionTree(nextId, depth - 1, new Set(seen))
      };
    });
  };

  const weaponStateProps: RecognizedState = selected ? {
    state_id: selected.displayName,
    state_name: selected.originalName,
    mode: 'Weapon Path',
    command: type,
    posture: 'ENGAGE',
    meaning: selected.description,
  } : {};

  const weaponTransitions: TransitionBranch[] = selected ? selected.transitions.map((tId: string) => {
    const isMaster = tId.startsWith('NS-') && !tId.includes('-CS');
    return {
      target_state: tId,
      target_name: WEAPON_NAME_MAP[tId] || (isMaster ? (tId === 'NS-01' ? 'No Engagement' : tId === 'NS-02' ? 'Saturation' : tId === 'NS-03' ? 'Strike' : tId === 'NS-04' ? 'Interception' : tId) : tId),
      target_command: isMaster ? (tId === 'NS-01' ? 'NO_ENGAGEMENT' : tId === 'NS-02' ? 'SATURATION' : tId === 'NS-03' ? 'STRIKE' : tId === 'NS-04' ? 'INTERCEPTION' : null) : type,
      target_posture: isMaster ? (tId === 'NS-01' ? 'STAND_DOWN' : 'ENGAGE') : 'ENGAGE',
      children: buildWeaponTransitionTree(tId, 1, new Set([selected.id]))
    };
  }) : [];

  // ── Database Save Payload ──
  const isBuy   = card.side === 'BUY';
  const accent  = isBuy ? '#10b981' : '#ef4444';
  const stats   = computeCardStats(card);
  const fullAsset = [assetPrefix, card.assetSuffix].filter(Boolean).join(' ') || '—';

  const buildPayload = (overrides: Partial<TradeCard> = {}) => {
    const c = { ...card, ...overrides };
    return {
      username,
      asset:           [assetPrefix, c.assetSuffix].filter(Boolean).join(' ') || undefined,
      side:            c.side,
      weapon:          c.weapon         || undefined,
      weapon_thought:  c.weaponThought  || undefined,
      weapon_strategy: c.weaponNote     || undefined,
      entry_price:     c.entry         || undefined,
      stop_loss:       c.sl            || undefined,
      quantity:        c.qty           || undefined,
      additional_cost: c.cost          || undefined,
      t1: c.t1 || undefined, t2: c.t2 || undefined,
      t3: c.t3 || undefined, t4: c.t4 || undefined,
      exit_price:            c.exitPrice     || undefined,
      notes:                 c.notes         || undefined,
      entry_time:            c.entryTime     || undefined,
      exit_time:             c.exitTime      || undefined,
      date:                  c.date,
      closed:                c.closed,
      trade_status:          c.tradeStatus   || undefined,
      exit_type:             c.exitType      || undefined,
      holding_time_minutes:  (() => {
        if (!c.entryTime || !c.exitTime) return undefined;
        const [eh = 0, em = 0] = c.entryTime.split(':').map(Number);
        const [xh = 0, xm = 0] = c.exitTime.split(':').map(Number);
        const mins = (xh * 60 + xm) - (eh * 60 + em);
        return mins > 0 ? mins : undefined;
      })(),
      add_entries:           c.addEntries,
      partial_exits:         c.partialExits,
    };
  };

  const saveToDb = async (overrides: Partial<TradeCard> = {}) => {
    setSaving(true);
    const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
    try {
      if (card.dbId) {
        const res = await fetch(`${API_BASE}/api/quick-trade/${card.dbId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(buildPayload(overrides)),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
      } else {
        const res = await fetch(`${API_BASE}/api/quick-trade`, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildPayload(overrides)),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.id) onChange({ dbId: data.id });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setSaveError(msg);
      setTimeout(() => setSaveError(''), 3000);
    }
    setSaving(false);
  };

  const handleAddPos = () => {
    const price = parseFloat(newAdd.price) || 0;
    const qty   = parseFloat(newAdd.qty)   || 0;
    if (!price || !qty) return;
    onChange({ addEntries: [...card.addEntries, { id: Date.now(), price, stop: parseFloat(newAdd.stop) || 0, qty, cost: parseFloat(newAdd.cost) || 0, time: autoTime() }] });
    setNewAdd({ price: '', stop: '', qty: '65', cost: '10' });
    setAddingPos(false);
  };

  const handleSubtract = () => {
    const qty   = parseFloat(newPartial.qty)   || 0;
    const price = parseFloat(newPartial.price) || 0;
    if (!qty || !price) return;
    onChange({ partialExits: [...card.partialExits, { id: Date.now(), qty, price, time: autoTime() }] });
    setNewPartial({ qty: '', price: '' });
    setSubtractPos(false);
  };

  const handleConfigChange = (key: string, val: number) => {
    if (isLocked) return;
    setModelConfig({
      ...modelConfig,
      [key]: val
    });
  };

  const catHeaderStyle = (title: string): CSSProperties => ({
    fontFamily: MONO,
    fontSize: '11px',
    fontWeight: 900,
    letterSpacing: '0.2em',
    color: '#ffffff',
    textTransform: 'uppercase',
    padding: '8px 12px',
    background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.16) 0%, rgba(0,0,0,0) 100%)',
    borderLeft: '3px solid #38bdf8',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '0px'
  });

  const lbl = (): CSSProperties => ({
    fontFamily: MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', marginBottom: '5px', color: '#ffffff',
  });

  // ── Closed layout ──
  if (card.closed) {
    return (
      <div style={{ border: `1px solid ${tacticalAccent}40`, background: '#05070c', borderRadius: '0px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: sep, background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, color: '#4169E1', letterSpacing: '0.12em', flexShrink: 0 }}>T{tradeIndex + 1}</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', flexShrink: 0 }}>{card.dbId || 'DRAFT'}</span>
          <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, color: accent, letterSpacing: '0.1em' }}>{card.side}</span>
          <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 700, color: '#e8eaed', flex: 1 }}>{fullAsset}</span>
          {card.weapon && (
            <span style={{ fontFamily: MONO, fontSize: '10px', color: '#a78bfa', fontWeight: 800, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.25)', padding: '2px 8px', borderRadius: '0px', marginRight: '6px' }}>
              {WEAPON_NAME_MAP[card.weapon] || card.weapon}
            </span>
          )}
          <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, color: '#22c55e', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)', borderRadius: '0px' }}>✓ CLOSED</span>
          {!isLocked && (
            <button onClick={() => onChange({ closed: false })} style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 800, padding: '4px 10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)', color: '#ffffff', cursor: 'pointer', marginLeft: '6px', borderRadius: '0px' }}>EDIT</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#e8eaed' }}>Entry {stats.wPrice > 0 ? stats.wPrice.toFixed(2) : card.entry}</span>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#ef4444' }}>SL {card.sl}</span>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#e8eaed' }}>{stats.entryQty} lots</span>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#22c55e' }}>Exit @ {card.exitPrice}</span>
            {card.beTriggered && <span style={{ fontFamily: MONO, fontSize: '10px', color: '#10b981', fontWeight: 700 }}>BE Active</span>}
            {card.entryTime && card.exitTime && (() => {
              const [eh = 0, em = 0] = card.entryTime.split(':').map(Number);
              const [xh = 0, xm = 0] = card.exitTime.split(':').map(Number);
              const mins = (xh * 60 + xm) - (eh * 60 + em);
              if (mins <= 0) return null;
              const h = Math.floor(mins / 60), m = mins % 60;
              return <span style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>⏱ {h > 0 ? `${h}h ${m}m` : `${m}m`}</span>;
            })()}
          </div>
          {stats.finalPnL !== null && (
            <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 900, color: stats.finalPnL >= 0 ? '#10b981' : '#ef4444' }}>
              {stats.finalPnL > 0 ? '+' : ''}{stats.finalPnL.toFixed(2)}
            </span>
          )}
        </div>
        {card.notes && (
          <div style={{ padding: '0 16px 12px', fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{card.notes}</div>
        )}
      </div>
    );
  }

  // ── Unified Vertical Layout ──
  return (
    <div style={{
      border: `1px solid ${tacticalAccent}40`,
      background: 'rgba(5, 7, 12, 0.75)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
      borderRadius: '0px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      paddingBottom: '20px'
    }}>

      {/* ── Unified Top Control Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderBottom: sep,
        background: `linear-gradient(90deg, ${tacticalAccent}12 0%, rgba(5,7,12,0.95) 100%)`
      }}>
        <span style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 900, color: tacticalAccent, letterSpacing: '0.2em' }}>T{tradeIndex + 1}</span>
        <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.12)' }} />
        <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>{card.dbId || 'DRAFT'}</span>
        
        {/* Remove Card button */}
        {canRemove && !isLocked && (
          <button
            onClick={onRemove}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '18px', padding: '0 4px', marginLeft: 'auto', outline: 'none' }}
            title="Delete this Trade Card"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── STEP 1: MAYA & WEAPON SELECTION ── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={catHeaderStyle('Phase - 1')}>Phase - 1</div>
        
        {/* Redesigned STEP 1 with a single unified Maya box and horizontal Weapon Slider */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Unified Maya Panel Box */}
          <div style={{
            background: 'rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '16px',
            borderRadius: '0px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            
            {/* Row 1: Input Box Left, Answer Box Right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              
              {/* MAYA Input Channel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>MAYA Input Channel</span>
                <textarea
                  value={card.weaponThought}
                  onChange={e => onChange({ weaponThought: e.target.value })}
                  placeholder="State your analysis or findings on the current chart setup..."
                  disabled={isLocked}
                  style={{
                    fontFamily: MONO,
                    width: '100%',
                    height: '100%',
                    minHeight: '180px',
                    fontSize: '11px',
                    color: '#e8eaed',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '0px',
                    padding: '8px 10px',
                    resize: 'none',
                    lineHeight: 1.55,
                    outline: 'none'
                  }}
                />
              </div>

              {/* Maya Answer Box (Always visible) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Maya Target Inferences</span>
                
                <div style={{
                  border: `1px solid ${hasPred ? sColor : 'rgba(255,255,255,0.12)'}`,
                  borderLeft: `3px solid ${hasPred ? sColor : 'rgba(255,255,255,0.25)'}`,
                  background: hasPred ? `${sColor}06` : 'rgba(255,255,255,0.02)',
                  borderRadius: '0px',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flex: 1,
                  minHeight: '180px',
                  overflowY: 'auto'
                }}>
                  {predicting ? (
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', height: '100%', padding: '20px 0' }}>
                      <div className="animate-spin" style={{ width: '20px', height: '20px', border: '2px solid rgba(167,139,250,0.2)', borderTopColor: '#38bdf8', borderRadius: '50%' }} />
                      <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>MAYA INFERENCING RUNNING…</span>
                    </div>
                  ) : !hasPred ? (
                    <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '100%', padding: '20px 0' }}>
                      <span style={{ fontFamily: MONO, fontSize: '10.5px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Maya Answer Box</span>
                      <span style={{ fontFamily: MONO, fontSize: '9.5px', color: 'rgba(255,255,255,0.3)', textAlign: 'center', maxWidth: '280px' }}>Awaiting Operator Command Trigger. Click "Execute" to run target predictions.</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        {stance && <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, color: sColor, border: `1px solid ${sColor}88`, padding: '1px 5px', borderRadius: '0px' }}>{stance}</span>}
                        <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: '#a78bfa' }}>{aiPick || '—'}</span>
                        <div style={{ flex: 1 }} />
                        {!isLocked && (
                          <button onClick={applyPick} style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: '#05070c', background: '#38bdf8', border: 'none', borderRadius: '0px', padding: '3px 8px', cursor: 'pointer' }}>
                            APPLY
                          </button>
                        )}
                      </div>
                      {stance === 'WAIT' ? (
                        <>
                          <SugRow label="Wait For" value={wp.wait_for} color={sColor} />
                          <SugRow label="Becomes"  value={wp.becomes} />
                        </>
                      ) : (
                        <>
                          <SugRow label="Entry"  value={wp.entry}  color="#86efac" />
                          <SugRow label="Stop"   value={wp.stop}   color="#fca5a5" />
                          <SugRow label="Target" value={wp.target} color="#67e8f9" />
                        </>
                      )}
                      <SugRow label="Expected" value={wp.expected} />
                      {wp.reasoning && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                          <span style={{ fontFamily: MONO, fontSize: '7.5px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Logic Reasoning</span>
                          <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.55, margin: '2px 0 0' }}>{wp.reasoning}</p>
                        </div>
                      )}
                      {wp.thinking && (
                        <div>
                          <button onClick={() => setThinkOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {thinkOpen ? '▾' : '▸'} Deep Reasoning Block
                          </button>
                          {thinkOpen && <p style={{ fontFamily: MONO, fontSize: '10.5px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{wp.thinking}</p>}
                        </div>
                      )}
                      {trace.length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                          <button onClick={() => setTraceOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                            {traceOpen ? '▾' : '▸'} Full Agent Trace ({trace.length})
                          </button>
                          {traceOpen && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                              {trace.map((s, i) => (
                                <div key={i} style={{ borderLeft: '1.5px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                                  <div style={{ fontFamily: MONO, fontSize: '7.5px', fontWeight: 900, color: 'rgba(255,255,255,0.7)' }}>{s.agent}</div>
                                  <p style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{stepText(s.content)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: Model Selection and Action Buttons in one row, hiding Model Configurations params */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              paddingTop: '12px',
              width: '100%'
            }}>
              {/* Model selection dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '150px' }}>
                <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Model Selection</span>
                <select
                  value={selectedModel}
                  onChange={e => setSelectedModel(e.target.value)}
                  disabled={isLocked}
                  style={{
                    fontFamily: MONO, fontSize: '11px', color: '#e8eaed',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.16)',
                    padding: '6px 10px', borderRadius: '0px', outline: 'none', width: '100%',
                    height: '32px'
                  }}
                >
                  {(() => {
                    const allowedModels = session?.allowedModels || [];
                    let filtered = AVAILABLE_MODELS.filter(m => {
                      if (allowedModels.includes('*')) return true;
                      return allowedModels.some(am => m.id.toLowerCase().includes(am.toLowerCase()));
                    });
                    if (filtered.length === 0) {
                      filtered = AVAILABLE_MODELS;
                    }
                    return filtered.map(m => (
                      <option key={m.id} value={m.id} style={{ background: '#05070c', color: '#fff' }}>
                        {m.name}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', width: '220px', flexShrink: 0 }}>
                <button
                  onClick={() => stopWeaponPrediction()}
                  disabled={isLocked || !predicting}
                  style={{
                    flex: 1, height: '32px', fontFamily: MONO, fontSize: '9px', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: '#ffffff', background: predicting ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: predicting ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '0px', cursor: predicting && !isLocked ? 'pointer' : 'default',
                    outline: 'none', transition: 'all 120ms'
                  }}
                >
                  Abort
                </button>
                <button
                  onClick={() => askMaya()}
                  disabled={isLocked || predicting}
                  style={{
                    flex: 1, height: '32px', fontFamily: MONO, fontSize: '9px', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: '#ffffff', background: '#7c5cff', border: 'none',
                    borderRadius: '0px', cursor: isLocked || predicting ? 'default' : 'pointer',
                    outline: 'none', transition: 'all 120ms'
                  }}
                >
                  {predicting ? 'Running…' : 'Execute'}
                </button>
              </div>
            </div>

          </div>

          {/* Row 3: Weapon Slider (Full Width) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'rgba(0,0,0,0.15)',
            border: '1px solid rgba(255,255,255,0.05)',
            padding: '12px',
            borderRadius: '0px',
            marginTop: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: '#a78bfa', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Weapon Slider</span>
              <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>← Scroll Horizontal to View All →</span>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              scrollbarWidth: 'thin'
            }}>
              {allChoices.map(w => {
                const active = card.weapon === w.id;
                const isRec  = !!aiPick && (w.id === aiPick || w.displayName === aiPick || w.originalName === aiPick);
                
                let accentColor = w.id === 'MANUAL' ? '#f59e0b' : tacticalAccent;
                
                return (
                  <button
                    key={w.id}
                    onClick={() => !isLocked && onChange({ weapon: w.id })}
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      padding: '6px 14px',
                      minWidth: '170px',
                      flexShrink: 0,
                      cursor: isLocked ? 'default' : 'pointer',
                      background: active ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      borderTop: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.16)',
                      borderRight: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.16)',
                      borderBottom: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.16)',
                      borderLeft: `3px solid ${active ? '#38bdf8' : accentColor}`,
                      borderRadius: '0px',
                      transition: 'all 120ms',
                      outline: 'none',
                      textAlign: 'left'
                    }}
                    title={`${w.displayName} (${w.originalName})`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
                      <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 900, color: active ? '#38bdf8' : 'rgba(255,255,255,0.45)' }}>
                        {w.id === 'MANUAL' ? 'CUSTOM' : w.id.split('-CS')[1] || w.id}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: '10.5px', fontWeight: 800, color: '#ffffff', marginLeft: 'auto' }}>
                        {w.displayName}
                      </span>
                      {isRec && (
                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 4px #38bdf8', marginLeft: '4px' }} />
                      )}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: '9.5px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '140px' }}>
                      {w.originalName}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          </div>

        </div>

      {/* ── STEP 2: WEAPON DOSSIER & SCORING ── */}
      
      {card.weapon && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={catHeaderStyle('STEP 2 // WEAPON DOSSIER & SCORING')}>STEP 2 // WEAPON DOSSIER & SCORING</div>
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '0px' }}>
            {isManual ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase' }}>✦ Operator Custom Strategy</span>
                <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{MANUAL_CHOICE.description}</p>
                <textarea
                  value={card.weaponNote}
                  onChange={e => onChange({ weaponNote: e.target.value })}
                  placeholder="Record custom setup, targets, and trigger details..."
                  disabled={isLocked}
                  rows={4}
                  style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: '#e8eaed', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 10px', resize: 'vertical', lineHeight: 1.6, outline: 'none', borderRadius: '0px' }}
                />
              </div>
            ) : selected ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Identity header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: MONO, fontSize: '16px', fontWeight: 900, color: '#a78bfa' }}>{selected.displayName}</span>
                    <span style={{ fontFamily: MONO, fontSize: '8.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                      {selected.originalName} ({selected.id})
                    </span>
                  </div>
                  {selected.description && <p style={{ fontFamily: MONO, fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.55, marginTop: '4px', marginBottom: 0 }}>{selected.description}</p>}
                </div>

                {/* Entry/Stop/Target Logic rules */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                  {/* Entry Rules */}
                  <div style={{ borderLeft: '2.5px solid #22c55e', background: 'rgba(34,197,94,0.02)', padding: '6px 10px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: '#86efac', textTransform: 'uppercase' }}>Entry Rules</span>
                    {selected.entry_logic.length > 0 ? (
                      <ul style={{ margin: '4px 0 0', paddingLeft: '8px', listStyleType: 'square' }}>
                        {selected.entry_logic.map((line: string, idx: number) => (
                          <li key={idx} style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>{line}</li>
                        ))}
                      </ul>
                    ) : <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: '2px' }}>None</div>}
                  </div>

                  {/* Stop Rules */}
                  <div style={{ borderLeft: '2.5px solid #ef4444', background: 'rgba(239,68,68,0.02)', padding: '6px 10px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: '#fca5a5', textTransform: 'uppercase' }}>Stop Rules</span>
                    {selected.stop_logic.length > 0 ? (
                      <ul style={{ margin: '4px 0 0', paddingLeft: '8px', listStyleType: 'square' }}>
                        {selected.stop_logic.map((line: string, idx: number) => (
                          <li key={idx} style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>{line}</li>
                        ))}
                      </ul>
                    ) : <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: '2px' }}>None</div>}
                  </div>

                  {/* Target Rules */}
                  <div style={{ borderLeft: '2.5px solid #38bdf8', background: 'rgba(56,189,248,0.02)', padding: '6px 10px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase' }}>Target Rules</span>
                    {selected.target_logic.length > 0 ? (
                      <ul style={{ margin: '4px 0 0', paddingLeft: '8px', listStyleType: 'square' }}>
                        {selected.target_logic.map((line: string, idx: number) => (
                          <li key={idx} style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>{line}</li>
                        ))}
                      </ul>
                    ) : <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: '2px' }}>None</div>}
                  </div>

                  {/* Failure Conditions */}
                  <div style={{ borderLeft: '2.5px solid #f59e0b', background: 'rgba(245,158,11,0.02)', padding: '6px 10px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: '#fcd34d', textTransform: 'uppercase' }}>Failure Conditions</span>
                    {selected.failure_conditions.length > 0 ? (
                      <ul style={{ margin: '4px 0 0', paddingLeft: '8px', listStyleType: 'square' }}>
                        {selected.failure_conditions.map((line: string, idx: number) => (
                          <li key={idx} style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45 }}>{line}</li>
                        ))}
                      </ul>
                    ) : <div style={{ fontFamily: MONO, fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic', marginTop: '2px' }}>None</div>}
                  </div>
                </div>

                {/* Scoring parameters — styled identically to execution inputs */}
                {selected.dimensions && selected.dimensions.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Scoring Parameters</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      {selected.dimensions.map((d: any) => {
                        const curVal = (card as any).weaponSelections?.[d.id] || '';
                        return (
                          <div key={d.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{d.name}</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {(d.outputs || d.options || []).map((opt: string) => {
                                const active = curVal === opt;
                                return (
                                  <button
                                    key={opt} disabled={isLocked}
                                    onClick={() => {
                                      const sel = { ...((card as any).weaponSelections || {}) };
                                      if (active) delete sel[d.id]; else sel[d.id] = opt;
                                      onChange({ weaponSelections: sel });
                                    }}
                                    style={{
                                      fontFamily: MONO, fontSize: '10px', fontWeight: active ? 900 : 700, padding: '6px 14px',
                                      background: active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                                      border: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.16)',
                                      color: active ? '#38bdf8' : '#e8eaed', cursor: isLocked ? 'default' : 'pointer',
                                      borderRadius: '0px', transition: 'all 120ms', outline: 'none'
                                    }}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Target Events — styled identically to execution inputs */}
                {selected.events && selected.events.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '10px' }}>Target Events</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                      {selected.events.map((e: any) => {
                        const curVal = (card as any).weaponSelections?.[e.id] || '';
                        return (
                          <div key={e.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>{e.name}</span>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                              {(e.outputs || e.options || []).map((opt: string) => {
                                const active = curVal === opt;
                                return (
                                  <button
                                    key={opt} disabled={isLocked}
                                    onClick={() => {
                                      const sel = { ...((card as any).weaponSelections || {}) };
                                      if (active) delete sel[e.id]; else sel[e.id] = opt;
                                      onChange({ weaponSelections: sel });
                                    }}
                                    style={{
                                      fontFamily: MONO, fontSize: '10px', fontWeight: active ? 900 : 700, padding: '6px 14px',
                                      background: active ? 'rgba(56,189,248,0.12)' : 'rgba(255,255,255,0.03)',
                                      border: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.16)',
                                      color: active ? '#38bdf8' : '#e8eaed', cursor: isLocked ? 'default' : 'pointer',
                                      borderRadius: '0px', transition: 'all 120ms', outline: 'none'
                                    }}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ── STEP 3: EXECUTION RECORD & MANAGEMENT ── */}
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={catHeaderStyle('STEP 3 // EXECUTION RECORD & MANAGEMENT')}>STEP 3 // EXECUTION RECORD & MANAGEMENT</div>
        
        <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Side + Asset select row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: SEP6, paddingBottom: '12px' }}>
            <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Instrument</span>
            
            <button
              onClick={() => !isLocked && onChange({ side: isBuy ? 'SELL' : 'BUY' })}
              style={{
                background: accent, border: 'none', borderRadius: '0px',
                color: '#05070c', fontFamily: MONO, fontSize: '10px', fontWeight: 900,
                padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.08em', flexShrink: 0,
              }}
            >
              {isBuy ? 'BUY' : 'SELL'}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
              {assetPrefix && (
                <span style={{ fontFamily: MONO, color: '#ffffff', fontSize: '13px', fontWeight: 700 }}>{assetPrefix}</span>
              )}
              <input
                type="text"
                value={card.assetSuffix}
                onChange={e => onChange({ assetSuffix: e.target.value })}
                placeholder="Asset name details (e.g. NIFTY JUN)..."
                disabled={isLocked}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.16)',
                  borderRadius: '0px',
                  outline: 'none',
                  fontFamily: MONO,
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  padding: '8px 10px',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Entry / Qty / Stop / Cost / Entry Time Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
            <Field label="Entry Price" value={card.entry} onChange={v => onChange({ entry: v })} disabled={isLocked} placeholder="0.00" />
            <Field label="Quantity"    value={card.qty}   onChange={v => onChange({ qty: v })}   disabled={isLocked} placeholder="65" />
            <Field label="Stop Loss"   value={card.sl}    onChange={v => onChange({ sl: v, slManual: true })} disabled={isLocked} placeholder="0.00" color="#ef4444" />
            <Field label="Add Cost"    value={card.cost}  onChange={v => onChange({ cost: v })}  disabled={isLocked} placeholder="10" />
            
            {/* Entry time stamp */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Entry Time</span>
              <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                <input
                  type="time"
                  value={card.entryTime}
                  onChange={e => onChange({ entryTime: e.target.value })}
                  disabled={isLocked}
                  style={{
                    fontFamily: MONO, fontSize: '13px', fontWeight: 700,
                    padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.16)', borderRadius: '0px',
                    color: '#ffffff', outline: 'none', colorScheme: 'dark', flex: 1
                  }}
                />
                <button
                  onClick={() => !isLocked && onChange({ entryTime: autoTime() })}
                  title="Stamp current entry time"
                  style={{
                    fontFamily: MONO, fontSize: '13px', fontWeight: 700,
                    padding: '12px 16px', cursor: isLocked ? 'default' : 'pointer',
                    background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '0px',
                    color: '#ffffff'
                  }}
                >
                  ⏱
                </button>
              </div>
            </div>
          </div>

          {/* Targets */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            <span style={{ fontFamily: MONO, fontSize: '7.5px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Take-Profit Targets & Breakeven</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '6px' }}>
              {(['t1', 't2', 't3', 't4'] as const).map((key) => {
                const label = key.toUpperCase();
                const tVal = parseFloat(card[key]) || 0;
                const entryV = parseFloat(card.entry) || 0;
                const slV = parseFloat(card.sl) || 0;
                const qtyV = parseFloat(card.qty) || 0;
                const costV = parseFloat(card.cost) || 0;
                const isShort = card.side === 'SELL';
                const stopDist = isShort ? slV - entryV : entryV - slV;
                const tgtDist = tVal > 0 && entryV > 0 ? (isShort ? entryV - tVal : tVal - entryV) : 0;
                const rr = stopDist > 0 && tgtDist > 0 ? tgtDist / stopDist : 0;
                const profit = tgtDist > 0 && qtyV > 0 ? tgtDist * qtyV - costV : 0;
                return (
                  <div key={key} style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '0px' }}>
                    <div style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>{label}</div>
                    <input
                      type="number" value={card[key]} onChange={e => onChange({ [key]: e.target.value })} placeholder="—" disabled={isLocked}
                      style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: MONO, fontSize: '12px', fontWeight: 900, color: '#e8eaed', width: '100%', padding: '2px 0' }}
                    />
                    {rr > 0 && (
                      <div style={{ marginTop: '2px', borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '2px' }}>
                        <div style={{ fontFamily: MONO, fontSize: '7.5px', color: '#10b981', fontWeight: 700 }}>1:{rr.toFixed(1)}R</div>
                        <div style={{ fontFamily: MONO, fontSize: '7px', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>+₹{profit.toFixed(0)}</div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Breakeven Target Box */}
              <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.06)', padding: '10px 12px', borderRadius: '0px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.45)', fontWeight: 800 }}>BREAKEVEN</div>
                <div style={{ fontFamily: MONO, fontSize: '12px', fontWeight: 900, color: '#10b981', padding: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {stats.be > 0 ? stats.be.toFixed(2) : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Position Management & Exit */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            <span style={{ fontFamily: MONO, fontSize: '7.5px', fontWeight: 900, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Position Management & Exit</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>

              {/* Column 1: Move to BE Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>BE Action</span>
                <button
                  onClick={() => !isLocked && onChange({ beTriggered: !card.beTriggered })}
                  disabled={isLocked}
                  style={{
                    background: card.beTriggered ? '#10b981' : 'rgba(255,255,255,0.03)',
                    border: card.beTriggered ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '0px',
                    outline: 'none',
                    fontFamily: MONO,
                    color: card.beTriggered ? '#05070c' : '#ffffff',
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: isLocked ? 'default' : 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 120ms'
                  }}
                >
                  {card.beTriggered ? '✓ BE Active' : 'Move to BE'}
                </button>
              </div>

              {/* Column 2: Add Position Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Add Action</span>
                <button
                  onClick={() => { setAddingPos(!addingPos); setSubtractPos(false); setCompleteExitOpen(false); }}
                  disabled={isLocked}
                  style={{
                    background: addingPos ? '#ffffff' : 'rgba(255,255,255,0.03)',
                    border: addingPos ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '0px',
                    outline: 'none',
                    fontFamily: MONO,
                    color: addingPos ? '#05070c' : '#ffffff',
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: isLocked ? 'default' : 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 120ms'
                  }}
                >
                  {addingPos ? 'Hide Panel' : 'Add Position'}
                </button>
              </div>

              {/* Column 3: Partial Exit Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Partial Action</span>
                <button
                  onClick={() => { setSubtractPos(!subtractPos); setAddingPos(false); setCompleteExitOpen(false); }}
                  disabled={isLocked}
                  style={{
                    background: subtractPos ? '#ffffff' : 'rgba(255,255,255,0.03)',
                    border: subtractPos ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '0px',
                    outline: 'none',
                    fontFamily: MONO,
                    color: subtractPos ? '#05070c' : '#ffffff',
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: isLocked ? 'default' : 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 120ms'
                  }}
                >
                  {subtractPos ? 'Hide Panel' : 'Partial Exit'}
                </button>
              </div>

              {/* Column 4: Complete Exit Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Complete Exit</span>
                <button
                  onClick={() => { setCompleteExitOpen(!completeExitOpen); setAddingPos(false); setSubtractPos(false); }}
                  disabled={isLocked}
                  style={{
                    background: completeExitOpen || card.exitPrice ? '#ffffff' : 'rgba(255,255,255,0.03)',
                    border: completeExitOpen || card.exitPrice ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.16)',
                    borderRadius: '0px',
                    outline: 'none',
                    fontFamily: MONO,
                    color: completeExitOpen || card.exitPrice ? '#05070c' : '#ffffff',
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: isLocked ? 'default' : 'pointer',
                    textTransform: 'uppercase',
                    transition: 'all 120ms',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {card.exitPrice ? `Exit @ ${card.exitPrice}` : 'Complete Exit'}
                </button>
              </div>

              {/* Column 5: Exit Time + Stamp Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Exit Time</span>
                <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                  <input
                    type="time"
                    value={card.exitTime}
                    onChange={e => onChange({ exitTime: e.target.value })}
                    disabled={isLocked}
                    style={{
                      fontFamily: MONO, fontSize: '13px', fontWeight: 700,
                      padding: '12px 14px', background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.16)', borderRadius: '0px',
                      color: '#ffffff', outline: 'none', colorScheme: 'dark', flex: 1
                    }}
                  />
                  <button
                    onClick={() => !isLocked && onChange({ exitTime: autoTime() })}
                    disabled={isLocked}
                    title="Stamp current exit time"
                    style={{
                      fontFamily: MONO, fontSize: '13px', fontWeight: 700,
                      padding: '12px 16px', cursor: isLocked ? 'default' : 'pointer',
                      background: 'transparent', border: '1px solid rgba(255,255,255,0.16)', borderRadius: '0px',
                      color: '#ffffff'
                    }}
                  >
                    ⏱
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Add position form */}
          {addingPos && (
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Price</span>
                  <input
                    type="number" value={newAdd.price} onChange={e => setNewAdd(p => ({ ...p, price: e.target.value }))} placeholder="0.00"
                    style={{ ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Stop</span>
                  <input
                    type="number" value={newAdd.stop} onChange={e => setNewAdd(p => ({ ...p, stop: e.target.value }))} placeholder="0.00"
                    style={{ ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Qty</span>
                  <input
                    type="number" value={newAdd.qty} onChange={e => setNewAdd(p => ({ ...p, qty: e.target.value }))} placeholder="0"
                    style={{ ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Cost</span>
                  <input
                    type="number" value={newAdd.cost} onChange={e => setNewAdd(p => ({ ...p, cost: e.target.value }))} placeholder="0"
                    style={{ ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff' }}
                  />
                </div>
                <button
                  onClick={handleAddPos}
                  disabled={!newAdd.price || !newAdd.qty}
                  style={{
                    padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff',
                    cursor: (!newAdd.price || !newAdd.qty) ? 'default' : 'pointer',
                    fontFamily: MONO, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '0px'
                  }}
                >
                  Log
                </button>
                <button
                  onClick={() => setAddingPos(false)}
                  style={{
                    padding: '8px 12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
                    cursor: 'pointer', fontFamily: MONO, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '0px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Partial exit form */}
          {subtractPos && (
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Qty to Exit</span>
                  <input
                    type="number" value={newPartial.qty} onChange={e => setNewPartial(p => ({ ...p, qty: e.target.value }))} placeholder="0"
                    style={{ ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Exit Price</span>
                  <input
                    type="number" value={newPartial.price} onChange={e => setNewPartial(p => ({ ...p, price: e.target.value }))} placeholder="0.00"
                    style={{ ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff' }}
                  />
                </div>
                <button
                  onClick={handleSubtract}
                  disabled={!newPartial.qty || !newPartial.price}
                  style={{
                    padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff',
                    cursor: (!newPartial.qty || !newPartial.price) ? 'default' : 'pointer',
                    fontFamily: MONO, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '0px'
                  }}
                >
                  Log Exit
                </button>
                <button
                  onClick={() => setSubtractPos(false)}
                  style={{
                    padding: '8px 12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
                    cursor: 'pointer', fontFamily: MONO, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '0px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Complete exit price input panel */}
          {completeExitOpen && (
            <div style={{ padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Exit Price</span>
                  <input
                    type="number"
                    value={card.exitPrice || ''}
                    onChange={e => onChange({ exitPrice: e.target.value })}
                    placeholder="0.00"
                    disabled={isLocked}
                    style={{
                      ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Exit Type</span>
                  <select
                    value={card.exitType || ''}
                    onChange={e => onChange({ exitType: e.target.value })}
                    disabled={isLocked}
                    style={{
                      ...bare, border: '1px solid rgba(255,255,255,0.35)', fontSize: '13px', fontWeight: 900, color: '#ffffff'
                    }}
                  >
                    <option value="" disabled style={{ background: '#05070c' }}>Select Exit Type</option>
                    {exitTypes.map(t => (
                      <option key={t} value={t} style={{ background: '#05070c', color: '#fff' }}>{t}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => {
                    const xt = card.exitTime || autoTime();
                    onChange({ closed: true, exitTime: xt, tradeStatus: 'Closed' });
                    saveToDb({ closed: true, exitTime: xt, tradeStatus: 'Closed' });
                    setCompleteExitOpen(false);
                  }}
                  disabled={!card.exitPrice || isLocked}
                  style={{
                    padding: '8px 12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.3)', color: '#ffffff',
                    cursor: (!card.exitPrice || isLocked) ? 'default' : 'pointer',
                    fontFamily: MONO, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '0px'
                  }}
                >
                  Log Close
                </button>
                <button
                  onClick={() => setCompleteExitOpen(false)}
                  style={{
                    padding: '8px 12px', background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.35)',
                    cursor: 'pointer', fontFamily: MONO, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', borderRadius: '0px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Position Logs Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '4px' }}>
            <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Position Logs</span>
          </div>

          {/* Scale-ins lists display */}
          {card.addEntries.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(96,165,250,0.02)', border: '1px solid rgba(96,165,250,0.1)', padding: '8px', borderRadius: '0px', marginTop: '4px' }}>
              {card.addEntries.map((e, ei) => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: MONO }}>
                  <span style={{ color: '#60a5fa', fontSize: '8px' }}>ADD-{ei + 1}</span>
                  <span style={{ color: '#ffffff' }}>@ {e.price}</span>
                  {e.stop > 0 && <span style={{ color: '#ef4444' }}>SL {e.stop}</span>}
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{e.qty} lots</span>
                  <span style={{ color: '#60a5fa', fontSize: '9px', marginLeft: 'auto' }}>{e.time}</span>
                  {!isLocked && (
                    <button onClick={() => onChange({ addEntries: card.addEntries.filter(x => x.id !== e.id) })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', padding: 0 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Partial exits list display */}
          {card.partialExits.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.1)', padding: '8px', borderRadius: '0px', marginTop: '4px' }}>
              {card.partialExits.map((p, pi) => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontFamily: MONO }}>
                  <span style={{ color: '#ef4444', fontSize: '8px' }}>EXIT-{pi + 1}</span>
                  <span style={{ color: '#ffffff' }}>exit @ {p.price}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{p.qty} lots</span>
                  <span style={{ color: '#ef4444', fontSize: '9px', marginLeft: 'auto' }}>{p.time}</span>
                  {!isLocked && (
                    <button onClick={() => onChange({ partialExits: card.partialExits.filter(x => x.id !== p.id) })} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', padding: 0 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Execution Journal Notes */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
            <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '6px' }}>Journal Notes</div>
            <textarea
              value={card.notes} onChange={e => !isLocked && onChange({ notes: e.target.value })} placeholder="Execution detail, trigger behavior, operator mindset journal..." disabled={isLocked}
              style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.16)', outline: 'none', resize: 'vertical', fontFamily: MONO, fontSize: '11px', color: '#ffffff', lineHeight: 1.5, minHeight: '80px', padding: '8px 10px', borderRadius: '0px' }}
            />
          </div>

          {/* Action buttons (Explicit save/close only) */}
          <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
            <button
              onClick={() => saveToDb()} disabled={isLocked || saving}
              style={{
                flex: 1, height: '38px', fontFamily: MONO, fontSize: '9.5px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: isLocked ? 'not-allowed' : 'pointer', border: saveError ? '1px solid #ef4444' : saved ? '1px solid #4169E1' : '1px solid rgba(255,255,255,0.3)',
                background: saveError ? 'rgba(239,68,68,0.1)' : saved ? 'rgba(65,105,225,0.15)' : 'transparent', color: '#ffffff', borderRadius: '0px', transition: 'all 150ms', outline: 'none'
              }}
            >
              {saving ? 'Saving…' : saveError ? 'Failed' : saved ? '✓ Saved' : card.dbId ? 'Update' : 'Save Draft'}
            </button>
            <button
              onClick={() => { const xt = card.exitTime || autoTime(); onChange({ closed: true, exitTime: xt, tradeStatus: 'Closed' }); saveToDb({ closed: true, exitTime: xt, tradeStatus: 'Closed' }); }}
              disabled={!card.exitPrice || isLocked}
              style={{
                flex: 1, height: '38px', fontFamily: MONO, fontSize: '9.5px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: card.exitPrice && !isLocked ? 'pointer' : 'not-allowed', border: card.exitPrice ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
                background: card.exitPrice ? 'rgba(239,68,68,0.12)' : 'transparent', color: '#ffffff', opacity: card.exitPrice ? 1 : 0.4, borderRadius: '0px', transition: 'all 150ms', outline: 'none'
              }}
            >
              Close Trade
            </button>
          </div>

        </div>
      </div>

      {/* ── STEP 4: WEAPON TRANSITION MAP ── */}
      {selected && selected.transitions.length > 0 && (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={catHeaderStyle('STEP 4 // WEAPON TRANSITION MAP')}>STEP 4 // WEAPON TRANSITION MAP</div>
          
          <div style={{ background: 'rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.05)', padding: '16px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Structured transition pathway cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selected.transitions.map((tId: string) => {
                const targetName = WEAPON_NAME_MAP[tId] || tId;
                const reason = selected.transition_reasons?.[tId] || 'No transition rationale defined.';
                
                // Color-code target command state types
                let borderLeftColor = '#a78bfa'; // default purple
                if (tId.startsWith('NS-01')) borderLeftColor = '#ef4444'; // no engagement (red)
                if (tId.startsWith('NS-02')) borderLeftColor = '#f97316'; // saturation (orange)
                if (tId.startsWith('NS-03')) borderLeftColor = '#ffd700'; // strike (gold)
                if (tId.startsWith('NS-04')) borderLeftColor = '#38bdf8'; // interception (sky blue)
                
                const isMasterState = tId.startsWith('NS-') && !tId.includes('-CS');
                
                return (
                  <div
                    key={tId}
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderLeft: `3px solid ${borderLeftColor}`,
                      padding: '10px 14px',
                      borderRadius: '0px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.05em' }}>
                        {selected.displayName} <span style={{ color: 'rgba(255,255,255,0.4)', margin: '0 4px' }}>→</span> {targetName}
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: borderLeftColor, background: `${borderLeftColor}12`, border: `1px solid ${borderLeftColor}30`, padding: '2px 6px', borderRadius: '0px' }}>
                        {isMasterState ? 'PARENT COMMAND' : tId}
                      </span>
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.5 }}>
                      {reason}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
