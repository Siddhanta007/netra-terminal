import { useNetra } from '../../../context/NetraContext';
import { useEffect, useState } from 'react';
import { useNetraUtils } from '../../../hooks/useNetraUtils';
import { StrikeSelections, InterSelections, SystemDimension } from '../../../types';
import { API_BASE } from '../../../utils/constants';

export type STSVerdict = 'EXECUTE' | 'WAIT' | 'NO_ENGAGEMENT' | null;

type VerdictResult = { verdict: STSVerdict; weapon: string | null; reason: string };

function useSTSVerdict(command: string, strikeDims: object, interDims: object): VerdictResult {
  const { getAuthHeaders } = useNetraUtils();
  const [result, setResult] = useState<VerdictResult>({ verdict: null, weapon: null, reason: '' });

  useEffect(() => {
    fetch(`${API_BASE}/api/decision/sts-verdict`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ command, strike_dims: strikeDims, inter_dims: interDims }),
    })
      .then(r => r.json())
      .then(setResult)
      .catch(() => {});
  }, [command, JSON.stringify(strikeDims), JSON.stringify(interDims)]);

  return result;
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{
      margin: '16px 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px',
      borderLeft: '3px solid var(--phase-accent)', paddingLeft: '10px',
    }}>
      <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '10px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
    </div>
  );
}

function DimRow({ dim, value, onSelect, isLocked }: { dim: SystemDimension; value: string; onSelect: (v: string) => void; isLocked: boolean }) {
  const opts = dim.opts || dim.options || [];
  return (
    <div className="precision-row">
      <div className="precision-label">{dim.name}</div>
      <div className="precision-selector">
        {opts.map(opt => (
          <button
            key={opt}
            onClick={() => !isLocked && onSelect(opt)}
            disabled={isLocked}
            className={`precision-opt ${value === opt ? 'selected' : ''} ${isLocked && value !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
          >{opt}</button>
        ))}
      </div>
    </div>
  );
}

function Verdict({ verdict, weapon }: { verdict: STSVerdict; weapon: string | null }) {
  if (!verdict) return null;
  const isExecute = verdict === 'EXECUTE';
  const isWait    = verdict === 'WAIT';
  return (
    <div style={{
      marginTop: '16px', padding: '10px 14px',
      background: isExecute ? 'rgba(16,185,129,0.08)' : isWait ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)',
      border: `1px solid ${isExecute ? 'rgba(16,185,129,0.35)' : isWait ? 'rgba(245,158,11,0.35)' : 'rgba(239,68,68,0.35)'}`,
      borderRadius: '4px',
    }}>
      <span style={{
        fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '10px', fontWeight: 900,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        color: isExecute ? '#10b981' : isWait ? '#f59e0b' : '#ef4444',
      }}>
        {isExecute
          ? `✓ EXECUTE${weapon ? ` — ${weapon}` : ''}`
          : isWait
            ? '⏳ WAIT — Conditions not yet confirmed'
            : '⛔ NO ENGAGEMENT'}
      </span>
    </div>
  );
}

// ─── Strike STS ───────────────────────────────────────────────────────────────

const STRIKE_WEAPON_DIMS: Record<string, { d3: SystemDimension; d4: SystemDimension; d5: SystemDimension | null }> = {
  'None (Shallow Pullback)': {
    d3: { id: 'pullbackDepth',        name: 'Pullback Depth',          opts: ['Shallow', 'Deepening'] },
    d4: { id: 'continuationTrigger',  name: 'Continuation Trigger',    opts: ['Clean BOS', 'Weak BOS', 'No BOS', 'Opposite BOS'] },
    d5: null,
  },
  'FVG / OB Present': {
    d3: { id: 'pullbackQuality',      name: 'Pullback Quality',        opts: ['Shallow', 'Clean', 'Deep', 'Structural Damage'] },
    d4: { id: 'zoneReaction',         name: 'Zone Reaction',           opts: ['Rejection', 'Absorption', 'Failure'] },
    d5: { id: 'continuationTrigger',  name: 'Continuation Trigger',    opts: ['Clean BOS', 'Weak BOS', 'No BOS', 'Opposite BOS'] },
  },
  'Compression Visible': {
    d3: { id: 'compressionQuality',    name: 'Compression Structure',   opts: ['Tight', 'Loose'] },
    d4: { id: 'breakoutEnergy',        name: 'Breakout Energy',         opts: ['Impulsive', 'Sustained', 'False'] },
    d5: { id: 'postBreakoutBehaviour', name: 'Post-Breakout Behaviour', opts: ['Hold and Continue', 'Return to Range', 'Break Reversal'] },
  },
  'Acceptance Building': {
    d3: { id: 'boundaryBreakQuality',  name: 'Boundary Break Quality',  opts: ['Clean', 'Weak'] },
    d4: { id: 'acceptanceQuality',     name: 'Acceptance Quality',      opts: ['Strong Acceptance', 'Weak Acceptance', 'Failed Acceptance'] },
    d5: { id: 'entryPattern',          name: 'Entry Pattern',           opts: ['Acceptance Build', 'Reclaim Continuation', 'Neither Yet'] },
  },
};

const DEFAULT_WEAPON_DIMS = STRIKE_WEAPON_DIMS['FVG / OB Present'];

function StrikeTree({ isLocked }: { isLocked: boolean }) {
  const { strikeSelections, setStrikeSelections, SYSTEM_DATA } = useNetra();
  const s    = strikeSelections;
  const dims = SYSTEM_DATA.strikeDimensions || [];
  const d    = (id: string) => dims.find(dim => dim.id === id)!;

  const set = (updates: Partial<StrikeSelections>) => {
    if (isLocked) return;
    setStrikeSelections({ ...s, ...updates } as StrikeSelections);
  };

  const { verdict, weapon } = useSTSVerdict('STRIKE', s, {});
  const weaponDims = STRIKE_WEAPON_DIMS[s.continuationZone] || DEFAULT_WEAPON_DIMS;
  const { d3, d4, d5 } = weaponDims;

  return (
    <div className="flex flex-col">
      {d('impulseQuality') && (
        <DimRow dim={d('impulseQuality')} value={s.impulseQuality || ''} onSelect={v => set({ impulseQuality: v })} isLocked={isLocked} />
      )}
      {d('continuationZone') && (
        <DimRow
          dim={d('continuationZone')}
          value={s.continuationZone || ''}
          onSelect={v => set({
            continuationZone: v,
            pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '',
            compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '',
            boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '',
          })}
          isLocked={isLocked}
        />
      )}
      <DimRow dim={d3} value={s[d3.id as keyof StrikeSelections] || ''} onSelect={v => set({ [d3.id]: v } as Partial<StrikeSelections>)} isLocked={isLocked} />
      <DimRow dim={d4} value={s[d4.id as keyof StrikeSelections] || ''} onSelect={v => set({ [d4.id]: v } as Partial<StrikeSelections>)} isLocked={isLocked} />
      {d5 && (
        <DimRow dim={d5} value={s[d5.id as keyof StrikeSelections] || ''} onSelect={v => set({ [d5.id]: v } as Partial<StrikeSelections>)} isLocked={isLocked} />
      )}
      <Verdict verdict={verdict} weapon={weapon} />
    </div>
  );
}

// ─── Interception STS ─────────────────────────────────────────────────────────

function InterTree({ isLocked }: { isLocked: boolean }) {
  const { interSelections, setInterSelections, SYSTEM_DATA } = useNetra();
  const is   = interSelections;
  const dims = SYSTEM_DATA.interceptionDimensions || [];
  const d    = (id: string) => dims.find(dim => dim.id === id)!;

  const set = (updates: Partial<InterSelections>) => {
    if (isLocked) return;
    setInterSelections({ ...is, ...updates } as InterSelections);
  };

  const { verdict, weapon } = useSTSVerdict('INTERCEPTION', {}, is);

  return (
    <div className="flex flex-col">
      {d('pattern')   && <DimRow dim={d('pattern')}   value={is.pattern   || ''} onSelect={v => set({ pattern: v })}   isLocked={isLocked} />}
      {d('friction')  && <DimRow dim={d('friction')}  value={is.friction  || ''} onSelect={v => set({ friction: v })}  isLocked={isLocked} />}
      {d('sweep')     && <DimRow dim={d('sweep')}     value={is.sweep     || ''} onSelect={v => set({ sweep: v })}     isLocked={isLocked} />}
      {d('response')  && <DimRow dim={d('response')}  value={is.response  || ''} onSelect={v => set({ response: v })}  isLocked={isLocked} />}
      {d('reversion') && <DimRow dim={d('reversion')} value={is.reversion || ''} onSelect={v => set({ reversion: v })} isLocked={isLocked} />}
      {d('flip')      && <DimRow dim={d('flip')}      value={is.flip      || ''} onSelect={v => set({ flip: v })}      isLocked={isLocked} />}
      <Verdict verdict={verdict} weapon={weapon} />
    </div>
  );
}

// ─── Saturation STS ───────────────────────────────────────────────────────────

function SaturationTree({ isLocked }: { isLocked: boolean }) {
  const { saturationSelections, setSaturationSelections, SYSTEM_DATA } = useNetra();
  const dims = (SYSTEM_DATA.saturationDimensions as SystemDimension[]) || [];

  const set = (id: string, val: string) => {
    if (isLocked) return;
    setSaturationSelections({ ...saturationSelections, [id]: val });
  };

  const { verdict, weapon } = useSTSVerdict('SATURATION', {}, saturationSelections);

  return (
    <div className="flex flex-col">
      {dims.map((dim: SystemDimension) => (
        <DimRow
          key={dim.id}
          dim={dim}
          value={saturationSelections[dim.id] || ''}
          onSelect={v => set(dim.id, v)}
          isLocked={isLocked}
        />
      ))}
      <Verdict verdict={verdict} weapon={weapon} />
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

interface Phase7STSProps {
  command: 'STRIKE' | 'INTERCEPTION' | 'SATURATION';
  isLocked: boolean;
}

export default function Phase7STS({ command, isLocked }: Phase7STSProps) {
  if (command === 'STRIKE')       return <StrikeTree isLocked={isLocked} />;
  if (command === 'INTERCEPTION') return <InterTree isLocked={isLocked} />;
  if (command === 'SATURATION')   return <SaturationTree isLocked={isLocked} />;
  return null;
}
