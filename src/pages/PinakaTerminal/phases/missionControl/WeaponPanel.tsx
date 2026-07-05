// WeaponPanel — left rail of the hybrid trade card.
// Flow: trader thought → Maya entry-model suggestion → command-filtered
// selector (child states with weapon names) → transition watch.

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNetra } from '../../../../context/NetraContext';
import { WeaponPrediction } from '../../../../types';
import type { TradeCard } from './types';
import { MONO, sep, SEP6, BOX_H } from './helpers';
import { ForwardPathMap, RecognizedState, TransitionBranch } from '../../../../components/Templates/StateGraph';
import { API_BASE } from '../../../../utils/constants';

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Split a multi-line string into a trimmed line array (new schema stores logic as strings). */
const splitToLines = (s: string | string[] | null | undefined): string[] => {
  if (!s) return [];
  if (Array.isArray(s)) return s;
  return s.split('\n').map(l => l.trim()).filter(Boolean);
};

// ─── Fallback Static child states catalog ─────────────────────────────────────

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

export default function WeaponPanel({ card, onChange, isLocked }: {
  card: TradeCard;
  onChange: (updates: Partial<TradeCard>) => void;
  isLocked: boolean;
}) {
  const {
    SYSTEM_DATA, triggerWeaponPrediction, stopWeaponPrediction, finalCommand, netraOutput
  } = useNetra();

  const type = finalCommand || 'STRIKE';

  // ── Retrieve child states from netraOutput (or fallback to static data) ──
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
    // Normalize transitions: extract target code (e.g. NS-03-CS01) from new child_state_id/parent_state_id objects
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
    // Normalize logic fields: new schema returns strings; old returns arrays
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
  const [thinkOpen, setThinkOpen] = useState(false);
  const [traceOpen, setTraceOpen] = useState(false);
  const [predicting, setPredicting] = useState(false);

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

  const chip = (active: boolean, accent: string): CSSProperties => ({
    fontFamily: MONO, fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em',
    padding: '7px 13px', cursor: isLocked ? 'default' : 'pointer', position: 'relative',
    border: active ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.2)',
    background: active ? `${accent}22` : 'transparent',
    color: active ? accent : '#ffffff',
  });

  // Subway command transition watch metadata
  const recognizedState = inner.recognized_state as RecognizedState | undefined;
  const commandTransitions = (inner.possible_transitions || []) as TransitionBranch[];

  // Helper to build weapon transition tree for the subway map
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, height: BOX_H, overflowY: 'auto', border: sep, background: '#05070c' }}>

      {/* header — weapon + the command it's constrained by */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: SEP6, background: 'rgba(167,139,250,0.06)' }}>
        <span style={{ fontSize: '15px' }}>⚔</span>
        <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, letterSpacing: '0.3em', color: '#ffffff', textTransform: 'uppercase' }}>Weapon</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        {finalCommand && (
          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, letterSpacing: '0.18em', color: '#a78bfa', textTransform: 'uppercase' }}>{finalCommand}</span>
        )}
      </div>

      {/* trader thought → ask Maya */}
      <div style={{ padding: '14px 16px', borderBottom: SEP6, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>
          Your thought
        </span>
        <textarea
          value={card.weaponThought}
          onChange={e => onChange({ weaponThought: e.target.value })}
          placeholder="Your read on this entry before asking Maya…"
          disabled={isLocked}
          rows={2}
          style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: '#e8eaed', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '5px', padding: '9px 10px', resize: 'vertical', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => predicting ? stopWeaponPrediction() : askMaya()}
            disabled={isLocked}
            style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, letterSpacing: '0.16em', textTransform: 'uppercase', color: predicting ? '#ef4444' : '#ffffff', background: predicting ? 'transparent' : '#7c5cff', border: predicting ? '1px solid rgba(239,68,68,0.5)' : 'none', borderRadius: '4px', padding: '8px 14px', cursor: isLocked ? 'not-allowed' : 'pointer', flexShrink: 0 }}>
            {predicting ? 'Abort' : '⚔ Ask Maya'}
          </button>
        </div>

        {/* live spinner */}
        {predicting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 2px' }}>
            <div className="animate-spin" style={{ width: '15px', height: '15px', border: '2px solid rgba(167,139,250,0.25)', borderTopColor: '#a78bfa', borderRadius: '50%' }} />
            <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', color: '#a78bfa', textTransform: 'uppercase' }}>Maya is reasoning…</span>
          </div>
        )}

        {/* Maya's suggestion */}
        {!predicting && hasPred && (
          <div style={{ border: `1px solid ${sColor}44`, borderLeft: `3px solid ${sColor}`, background: `${sColor}10`, borderRadius: '4px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {stance && <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.14em', color: sColor, border: `1px solid ${sColor}`, padding: '2px 7px' }}>{stance.replace('_', ' ')}</span>}
              <span style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 900, color: '#a78bfa' }}>{aiPick || '—'}</span>
              {wp.type === 'custom' && <span style={{ fontFamily: MONO, fontSize: '7px', fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>custom</span>}
              {wp.confidence && <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.55)' }}>{wp.confidence}</span>}
              <div style={{ flex: 1 }} />
              {!isLocked && (
                <button onClick={applyPick} title="Use this entry model"
                  style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.05em', color: sColor, background: `${sColor}1e`, border: `1px solid ${sColor}66`, borderRadius: '3px', padding: '3px 9px', cursor: 'pointer' }}>
                  use
                </button>
              )}
            </div>

            {stance === 'WAIT' ? (
              <>
                <SugRow label="Wait for" value={wp.wait_for} color={sColor} />
                <SugRow label="Becomes"  value={wp.becomes} />
              </>
            ) : (
              <>
                <SugRow label="Entry"  value={wp.entry}  color="#86efac" />
                <SugRow label="Stop"   value={wp.stop}   color="#fca5a5" />
                <SugRow label="Target" value={wp.target} color="#67e8f9" />
              </>
            )}
            <SugRow label="Expect" value={wp.expected} />

            {wp.reasoning && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>Why</span>
                <p style={{ fontFamily: MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.7, margin: '5px 0 0' }}>{wp.reasoning}</p>
              </div>
            )}

            {wp.thinking && (
              <div>
                <button onClick={() => setThinkOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {thinkOpen ? '▾' : '▸'} Maya's thinking
                </button>
                {thinkOpen && <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{wp.thinking}</p>}
              </div>
            )}

            {trace.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '8px' }}>
                <button onClick={() => setTraceOpen(v => !v)} style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  {traceOpen ? '▾' : '▸'} Agent reasoning ({trace.length})
                </button>
                {traceOpen && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                    {trace.map((s, i) => (
                      <div key={i} style={{ borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '9px' }}>
                        <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.14em', color: 'rgba(255,255,255,0.85)', textTransform: 'uppercase' }}>{s.agent}</div>
                        <p style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.62)', lineHeight: 1.65, margin: '3px 0 0', whiteSpace: 'pre-wrap' }}>{stepText(s.content)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* command-filtered weapon selector (child states with weapon names) */}
      <div style={{ padding: '14px 16px', borderBottom: SEP6 }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', marginBottom: '10px' }}>
          Select Active Weapon {finalCommand ? ` · ${type.toLowerCase()}` : ''}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
          {allChoices.map(w => {
            const active = card.weapon === w.id;
            const isRec  = !!aiPick && (w.id === aiPick || w.displayName === aiPick || w.originalName === aiPick);
            const accent = w.id === 'MANUAL' ? '#f59e0b' : '#a78bfa';
            return (
              <button key={w.id} onClick={() => !isLocked && onChange({ weapon: w.id })} disabled={isLocked} title={`${w.displayName} (${w.originalName})`} style={chip(active, accent)}>
                {w.displayName}
                {isRec && <span style={{ position: 'absolute', top: '4px', right: '4px', width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* weapon dossier / child state card details & transition watch */}
      <div style={{ padding: '14px 16px', flex: 1, minHeight: 0 }}>
        {!card.weapon ? (
          <div style={{ fontFamily: MONO, fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', lineHeight: 1.8, textAlign: 'center', padding: '22px 0' }}>
            Pick a weapon to load its dossier and pathways
          </div>
        ) : isManual ? (
          <>
            <div style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, letterSpacing: '0.16em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '8px' }}>✦ Custom Override</div>
            <p style={{ fontFamily: MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.7, margin: '0 0 10px' }}>{MANUAL_CHOICE.description}</p>
            <textarea
              value={card.weaponNote}
              onChange={e => onChange({ weaponNote: e.target.value })}
              placeholder="Your entry strategy — what you'll actually run…"
              disabled={isLocked}
              rows={5}
              style={{ fontFamily: MONO, width: '100%', fontSize: '13px', color: '#e8eaed', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', padding: '10px', resize: 'vertical', lineHeight: 1.7 }}
            />
          </>
        ) : selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. Header & Identity */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 900, color: '#a78bfa', letterSpacing: '0.05em' }}>{selected.displayName}</span>
                <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  {selected.originalName} ({selected.id})
                </span>
              </div>
              {selected.description && <p style={{ fontFamily: MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.7, margin: 0 }}>{selected.description}</p>}
            </div>

            {/* 2. Execution Levels Inputs */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
              <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Execution Levels Setup
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: '#86efac', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Entry Price</div>
                  <input
                    type="text"
                    value={card.entry}
                    onChange={e => onChange({ entry: e.target.value })}
                    placeholder="0.00"
                    disabled={isLocked}
                    style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: '#e8eaed', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '3px', outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: '#fca5a5', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Stop Loss</div>
                  <input
                    type="text"
                    value={card.sl}
                    onChange={e => onChange({ sl: e.target.value, slManual: true })}
                    placeholder="0.00"
                    disabled={isLocked}
                    style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: '#e8eaed', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '3px', outline: 'none' }}
                  />
                </div>
                <div>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: '#93c5fd', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>Target (T1)</div>
                  <input
                    type="text"
                    value={card.t1}
                    onChange={e => onChange({ t1: e.target.value })}
                    placeholder="0.00"
                    disabled={isLocked}
                    style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: '#e8eaed', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px', borderRadius: '3px', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Execution Mapping instructions + text area */}
            {selected.execution_mapping && selected.execution_mapping.length > 0 && (
              <div style={{ borderLeft: '3.5px solid #a78bfa', background: 'rgba(167,139,250,0.03)', padding: '10px 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: '#c084fc', textTransform: 'uppercase', marginBottom: '6px' }}>Execution Mapping Reference</div>
                <ul style={{ margin: 0, paddingLeft: '12px', listStyleType: 'circle', marginBottom: '8px' }}>
                  {selected.execution_mapping.map((line: string, idx: number) => (
                    <li key={idx} style={{ fontFamily: MONO, fontSize: '11px', color: '#e8eaed', lineHeight: 1.5, marginBottom: '4px' }}>{line}</li>
                  ))}
                </ul>
                <div style={{ fontFamily: MONO, fontSize: '8.5px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '4px' }}>Operator Mapping Marks</div>
                <textarea
                  value={card.weaponNote}
                  onChange={e => onChange({ weaponNote: e.target.value })}
                  placeholder="Record structural markings: e.g. Reload Zone: FVG @ 22100, Continuation Trigger: BOS @ 22135..."
                  disabled={isLocked}
                  rows={3}
                  style={{ fontFamily: MONO, width: '100%', fontSize: '12px', color: '#e8eaed', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', resize: 'vertical', lineHeight: 1.5, outline: 'none' }}
                />
              </div>
            )}

            {/* 4. Logic Rules Grid (Entry, Stop, Target, Failure) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Entry Logic */}
              <div style={{ borderLeft: '3.5px solid #22c55e', background: 'rgba(34,197,94,0.03)', padding: '10px 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: '#86efac', textTransform: 'uppercase', marginBottom: '6px' }}>Entry Logic</div>
                {selected.entry_logic.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '12px', listStyleType: 'square' }}>
                    {selected.entry_logic.map((line: string, idx: number) => (
                      <li key={idx} style={{ fontFamily: MONO, fontSize: '11px', color: '#e8eaed', lineHeight: 1.5, marginBottom: '4px' }}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No custom entry logic defined</div>
                )}
              </div>

              {/* Stop Logic */}
              <div style={{ borderLeft: '3.5px solid #ef4444', background: 'rgba(239,68,68,0.03)', padding: '10px 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: '#fca5a5', textTransform: 'uppercase', marginBottom: '6px' }}>Stop Logic</div>
                {selected.stop_logic.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '12px', listStyleType: 'square' }}>
                    {selected.stop_logic.map((line: string, idx: number) => (
                      <li key={idx} style={{ fontFamily: MONO, fontSize: '11px', color: '#e8eaed', lineHeight: 1.5, marginBottom: '4px' }}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No custom stop logic defined</div>
                )}
              </div>

              {/* Target Logic */}
              <div style={{ borderLeft: '3.5px solid #38bdf8', background: 'rgba(56,189,248,0.03)', padding: '10px 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: '#93c5fd', textTransform: 'uppercase', marginBottom: '6px' }}>Target Logic</div>
                {selected.target_logic.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '12px', listStyleType: 'square' }}>
                    {selected.target_logic.map((line: string, idx: number) => (
                      <li key={idx} style={{ fontFamily: MONO, fontSize: '11px', color: '#e8eaed', lineHeight: 1.5, marginBottom: '4px' }}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No custom target logic defined</div>
                )}
              </div>

              {/* Failure Conditions */}
              <div style={{ borderLeft: '3.5px solid #f59e0b', background: 'rgba(245,158,11,0.03)', padding: '10px 12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: '#fcd34d', textTransform: 'uppercase', marginBottom: '6px' }}>Failure Conditions</div>
                {selected.failure_conditions.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '12px', listStyleType: 'square' }}>
                    {selected.failure_conditions.map((line: string, idx: number) => (
                      <li key={idx} style={{ fontFamily: MONO, fontSize: '11px', color: '#e8eaed', lineHeight: 1.5, marginBottom: '4px' }}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <div style={{ fontFamily: MONO, fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>No failure conditions defined</div>
                )}
              </div>
            </div>

            {/* 5. Child Dimensions Selector */}
            {selected.dimensions && selected.dimensions.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Weapon Dimensions Scoring
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.dimensions.map((d: any) => {
                    const curVal = (card as any).weaponSelections?.[d.id] || '';
                    return (
                      <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: '#e8eaed', width: '130px', flexShrink: 0 }}>
                          {d.name}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(d.outputs || d.options || []).map((opt: string) => {
                            const active = curVal === opt;
                            return (
                              <button
                                key={opt}
                                disabled={isLocked}
                                onClick={() => {
                                  const sel = { ...((card as any).weaponSelections || {}) };
                                  if (active) delete sel[d.id]; else sel[d.id] = opt;
                                  onChange({ weaponSelections: sel });
                                }}
                                style={{
                                  fontFamily: MONO, fontSize: '8px', fontWeight: 700, padding: '3px 7px',
                                  background: active ? 'rgba(167,139,250,0.18)' : 'rgba(255,255,255,0.03)',
                                  border: active ? '1px solid #a78bfa' : '1px solid rgba(255,255,255,0.06)',
                                  color: active ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                                  cursor: isLocked ? 'default' : 'pointer',
                                  borderRadius: '2px', transition: 'all 80ms'
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

            {/* 6. Child Events Selector */}
            {selected.events && selected.events.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Weapon Events Tracking
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selected.events.map((e: any) => {
                    const curVal = (card as any).weaponSelections?.[e.id] || '';
                    return (
                      <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: '#e8eaed', width: '130px', flexShrink: 0 }}>
                          {e.name}
                        </span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                          {(e.outputs || e.options || []).map((opt: string) => {
                            const active = curVal === opt;
                            return (
                              <button
                                key={opt}
                                disabled={isLocked}
                                onClick={() => {
                                  const sel = { ...((card as any).weaponSelections || {}) };
                                  if (active) delete sel[e.id]; else sel[e.id] = opt;
                                  onChange({ weaponSelections: sel });
                                }}
                                style={{
                                  fontFamily: MONO, fontSize: '8px', fontWeight: 700, padding: '3px 7px',
                                  background: active ? 'rgba(56,189,248,0.18)' : 'rgba(255,255,255,0.03)',
                                  border: active ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.06)',
                                  color: active ? '#38bdf8' : 'rgba(255,255,255,0.6)',
                                  cursor: isLocked ? 'default' : 'pointer',
                                  borderRadius: '2px', transition: 'all 80ms'
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

            {/* 7. Child State Transition Pathways (subway flow list) */}
            {selected.transitions.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
                  Weapon Transition Pathways
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {selected.transitions.map((tId: string) => {
                    const name = WEAPON_NAME_MAP[tId] || tId;
                    const isMasterState = tId.startsWith('NS-') && !tId.includes('-CS');
                    return (
                      <div
                        key={tId}
                        title={selected.transition_reasons?.[tId] || undefined}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', padding: '4px 8px', borderRadius: '3px', cursor: selected.transition_reasons?.[tId] ? 'help' : 'default' }}
                      >
                        <span style={{ fontSize: '8px', color: '#a78bfa' }}>→</span>
                        <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 700, color: isMasterState ? '#38bdf8' : '#ffffff' }}>
                          {name}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: '7px', color: 'rgba(255,255,255,0.35)' }}>({tId})</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 8. Weapon Transition Map (subway graph) */}
            {weaponStateProps.state_id && weaponTransitions.length > 0 && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', marginTop: '4px' }}>
                <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Weapon Transition Map
                </span>
                <ForwardPathMap state={weaponStateProps} transitions={weaponTransitions} />
              </div>
            )}
          </div>

        ) : (
          <div style={{ fontFamily: MONO, fontSize: '13px', color: '#a78bfa', fontWeight: 800 }}>{card.weapon}</div>
        )}
      </div>
    </div>
  );
}
