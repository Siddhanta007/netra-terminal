// Macro Mapping phase — strategic chart marks plus the HTF risk gate (CONTINUE/REDUCE/STOP).

import { useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import { useHTFGate } from '../../hooks/useReduceFlag';

// ─── Strategic Marking ───────────────────────────────────────────────────────

const STRATEGIC_MARKS = [
  { id: 'whl',    label: 'Weekly High & Low',       tier: 'T1' },
  { id: 'pdhl',   label: 'Previous Day High & Low', tier: 'T1' },
  { id: 'yclose', label: "Yesterday's Close",        tier: 'T1' },
  { id: 'gap',    label: 'Gap Zone',                tier: 'T1' },
  { id: 'shl1h',  label: '1H Swing High & Low',     tier: 'T2' },
  { id: 'eqhl',   label: '1H Equal Highs / Lows',   tier: 'T2' },
  { id: 'htfdst', label: '1H HTF Destination',       tier: 'T2' },
  { id: 'imb',    label: '1H Unfilled Imbalance',   tier: 'T2' },
  { id: 'disp',   label: '1H Displacement Origin',  tier: 'T2' },
] as const;

const MONO: React.CSSProperties = { fontFamily: 'Space Grotesk, Inter, sans-serif' };

export const STRATEGIC_MARKS_TOTAL = STRATEGIC_MARKS.length;

export function StrategicMarkingChecklist({
  open,
  checked,
  onToggle,
}: {
  open: boolean;
  checked: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  if (!open) return null;
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      border: '1px solid var(--border-strong)',
      marginBottom: '4px',
    }}>
      {STRATEGIC_MARKS.map((m, i) => {
        const isDone = !!checked[m.id];
        const isLastRow = i >= 6;
        const isRightEdge = (i + 1) % 3 === 0;
        return (
          <div
            key={m.id}
            onClick={e => { e.stopPropagation(); onToggle(m.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 12px', cursor: 'pointer',
              background: isDone ? 'var(--phase-accent-bg)' : 'transparent',
              borderBottom: isLastRow ? 'none' : '1px solid var(--border)',
              borderRight: isRightEdge ? 'none' : '1px solid var(--border)',
              transition: 'background 120ms',
            }}
          >
            <div style={{
              width: '11px', height: '11px', flexShrink: 0,
              border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
              background: isDone ? 'var(--phase-accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 100ms, background 100ms',
            }}>
              {isDone && <span style={{ fontSize: '7px', color: 'white', fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{
              ...MONO, fontSize: '9px', fontWeight: 500, flex: 1, lineHeight: 1.4,
              color: isDone ? 'var(--text-3)' : 'var(--text-1)',
              textDecoration: isDone ? 'line-through' : 'none',
              textDecorationColor: 'var(--text-4)',
            }}>
              {m.label}
            </span>
            <span style={{ ...MONO, fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em', color: isDone ? 'var(--phase-accent)' : 'var(--text-4)', flexShrink: 0 }}>
              {m.tier}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Component 2: Bias ───────────────────────────────────────────────────────

export function BiasDimensions() {
  const { SYSTEM_DATA, selections, setSelections, highestStep } = useNetra();

  const dims     = SYSTEM_DATA.realBias?.dimensions || [];
  const rb       = (selections.realBias || {}) as Record<string, string>;
  const isLocked = highestStep > 1;

  const setRb = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, realBias: { ...rb, [key]: val } });
  };

  return (
    <div className="flex flex-col phase-theme-1">
      {dims.map((dim) => (
        <div key={dim.id} className="precision-row">
          <div className="precision-label">{dim.name}</div>
          <div className="precision-selector">
            {(dim.options || []).map(opt => {
              const isSelected = rb[dim.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setRb(dim.id, opt)}
                  disabled={isLocked}
                  className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Component 3: HTF Structure ──────────────────────────────────────────────

export function HTFDimensions() {
  const { SYSTEM_DATA, selections, setSelections, highestStep } = useNetra();

  const htfGate  = useHTFGate();
  const isStop   = htfGate === 'STOP';
  const isLocked = highestStep > 2;

  const htf  = (selections.htfStructure || {}) as Record<string, string>;
  const dims = SYSTEM_DATA.htfStructure?.dimensions || [];

  const setHtf = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, htfStructure: { ...htf, [key]: val } });
  };

  const stopReason = htf.continuity === 'Broken'
    ? 'Structural continuity is broken. Price has violated HTF structure — no valid trade environment exists.'
    : 'Late maturity + deep rotation + near destination forms a terminal squeeze. Continuation probability is too low.';

  return (
    <div className="flex flex-col phase-theme-1">
      {dims.map((dim) => (
        <div key={dim.id} className="precision-row flex items-center">
          <div className="precision-label">{dim.name}</div>
          <div className="precision-selector flex-1">
            {(dim.options || []).map(opt => {
              const isSelected = htf[dim.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setHtf(dim.id, opt)}
                  disabled={isLocked}
                  className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                >{opt}</button>
              );
            })}
          </div>
          {dim.id === 'maturity' && (
            <div className="flex gap-2 ml-4">
              <input type="text" placeholder="Avg No Of Legs" value={htf['avgNoOfLegs'] || ''} onChange={e => setHtf('avgNoOfLegs', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="Current Leg No" value={htf['currentLegNo'] || ''} onChange={e => setHtf('currentLegNo', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
          {dim.id === 'rotation' && (
            <div className="flex gap-2 ml-4">
              <input type="text" placeholder="Avg" value={htf['avgRotation'] || ''} onChange={e => setHtf('avgRotation', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-16 outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="curr" value={htf['currRotation'] || ''} onChange={e => setHtf('currRotation', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-16 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
          {dim.id === 'compression' && (
            <div className="flex gap-2 ml-4">
              <input type="text" placeholder="Avg Height" value={htf['avgHeight'] || ''} onChange={e => setHtf('avgHeight', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-20 outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="Current Height" value={htf['currentHeight'] || ''} onChange={e => setHtf('currentHeight', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
          {dim.name === 'HTF Imbalance' && (
            <div className="flex gap-2 ml-4">
              <input type="text" placeholder="Filling %" value={htf['fillingPercentage'] || ''} onChange={e => setHtf('fillingPercentage', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-28 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
        </div>
      ))}

      {isStop && !isLocked && (
        <div className="flex flex-col gap-1.5 px-4 py-3 mt-3" style={{ background: 'var(--red-bg)', border: '1px solid var(--red)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--red)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Session Ends Here</span>
          <span style={{ fontSize: '10px', color: 'var(--red)', lineHeight: 1.5 }}>{stopReason}</span>
          <span style={{ fontSize: '9px', color: 'var(--red)', opacity: 0.6, marginTop: '4px' }}>Chart closes. No further analysis permitted for this session.</span>
        </div>
      )}
    </div>
  );
}

// ─── Pre-Session Context footer ──────────────────────────────────────────────

export function PreSessionActions() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, confirmStep, editStep,
    stepTimestamps,
  } = useNetra();

  const [editing, setEditing] = useState(false);
  const isLocked = highestStep > 1 && !editing;

  const biasDims = SYSTEM_DATA.realBias?.dimensions || [];
  const rb       = (selections.realBias || {}) as Record<string, string>;
  const allBias  = biasDims.length > 0 && biasDims.every(d => !!rb[d.id]);
  const hasData  = Object.keys(rb).length > 0;
  const canConfirm = !isLocked && allBias;

  const handleEdit  = () => { setEditing(false); editStep(1); };
  const handleReset = () => {
    if (isLocked) return;
    setSelections({ ...selections, realBias: {} });
    setNotes({ ...notes, realBias: '' });
  };

  return (
    <>
      <div style={{ borderTop: '1px solid var(--border-strong)', margin: '16px 0 0 0' }} />
      <div className="flex gap-4 items-start pt-4">
        <textarea
          value={notes.realBias || ''}
          onChange={e => setNotes({ ...notes, realBias: e.target.value })}
          placeholder="Pre-session notes — directional bias, correlated market, displacement context..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[44px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={handleEdit} className="btn-edit w-20" disabled={!isLocked}>Edit</button>
          <button onClick={handleReset} className="btn-reset w-20" disabled={isLocked || !hasData}>Reset</button>
          <button
            onClick={() => confirmStep(1)}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-36`}
            disabled={!canConfirm}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm Context'}
          </button>
        </div>
      </div>
      {stepTimestamps.realBias && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Locked: {stepTimestamps.realBias}
        </div>
      )}
    </>
  );
}

// ─── Macro Mapping footer: HTF-only confirm ───────────────────────────────────

export function MacroMappingActions() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, confirmStep, editStep,
    stepTimestamps,
  } = useNetra();

  const [editing, setEditing] = useState(false);

  const htfGate  = useHTFGate();
  const isStop   = htfGate === 'STOP';
  const isLocked = highestStep > 2 && !editing;

  const htfDims    = SYSTEM_DATA.htfStructure?.dimensions || [];
  const htf        = (selections.htfStructure || {}) as Record<string, string>;
  const allHTF     = htfDims.length === 0 || htfDims.every(d => !!htf[d.id]);
  const hasAnyData = Object.keys(htf).length > 0;
  const canConfirm = !isLocked && !isStop && allHTF;
  const lockedAt   = stepTimestamps.htfStructure;

  const handleEdit  = () => { setEditing(false); editStep(2); };
  const handleReset = () => {
    if (isLocked) return;
    setSelections({ ...selections, htfStructure: {} });
  };
  const handleConfirm = () => { confirmStep(1); confirmStep(2); };

  return (
    <>
      <div style={{ borderTop: '1px solid var(--border-strong)', margin: '16px 0 0 0' }} />
      <div className="flex gap-4 items-start pt-4">
        <textarea
          value={notes.htfStructure || ''}
          onChange={e => setNotes({ ...notes, htfStructure: e.target.value })}
          placeholder="HTF structure notes — structural context, leg maturity, compression state..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[44px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={handleEdit} className="btn-edit w-20" disabled={!isLocked}>Edit</button>
          <button onClick={handleReset} className="btn-reset w-20" disabled={isLocked || !hasAnyData}>Reset</button>
          <button
            onClick={handleConfirm}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-36`}
            disabled={!canConfirm}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm HTF'}
          </button>
        </div>
      </div>
      {lockedAt && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Locked: {lockedAt}
        </div>
      )}
    </>
  );
}
