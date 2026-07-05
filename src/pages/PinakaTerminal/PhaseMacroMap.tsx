// Macro Mapping phase — strategic chart marks plus the HTF risk gate (CONTINUE/REDUCE/STOP).

import { useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import { useHTFGate } from '../../hooks/useReduceFlag';

// ─── Strategic Marking ───────────────────────────────────────────────────────

const STRATEGIC_MARKS = [
  { id: 'structuralBoundaries', label: 'Category 1 — Structural Boundaries (Weekly High/Low, Significant Swings)', tier: 'T1' },
  { id: 'structuralLiquidity',  label: 'Category 2 — Structural Liquidity (Equal High/Low Clusters, Nearest Swings)', tier: 'T2' },
  { id: 'structuralImbalance',  label: 'Category 3 — Structural Imbalance (Fresh HTF Fair Value Gaps)', tier: 'T2' },
  { id: 'structuralEvents',     label: 'Category 4 — Structural Events (BOS, CHoCH)', tier: 'T2' },
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
      display: 'flex', flexDirection: 'column',
      border: '1px solid var(--border-strong)',
      marginBottom: '4px',
    }}>
      {STRATEGIC_MARKS.map((m, i) => {
        const isDone = !!checked[m.id];
        const isLastRow = i === STRATEGIC_MARKS.length - 1;
        return (
          <div
            key={m.id}
            onClick={e => { e.stopPropagation(); onToggle(m.id); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '12px 16px', cursor: 'pointer',
              background: isDone ? 'var(--phase-accent-bg)' : 'transparent',
              borderBottom: isLastRow ? 'none' : '1px solid var(--border)',
              transition: 'background 120ms',
            }}
          >
            <div style={{
              width: '12px', height: '12px', flexShrink: 0,
              border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
              background: isDone ? 'var(--phase-accent)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'border-color 100ms, background 100ms',
            }}>
              {isDone && <span style={{ fontSize: '8px', color: 'white', fontWeight: 900, lineHeight: 1 }}>✓</span>}
            </div>
            <span style={{
              ...MONO, fontSize: '10px', fontWeight: 600, flex: 1, lineHeight: 1.4,
              color: isDone ? 'var(--text-3)' : 'var(--text-1)',
              textDecoration: isDone ? 'line-through' : 'none',
              textDecorationColor: 'var(--text-4)',
            }}>
              {m.label}
            </span>
            <span style={{ ...MONO, fontSize: '8px', fontWeight: 800, letterSpacing: '0.1em', color: isDone ? 'var(--phase-accent)' : 'var(--text-4)', flexShrink: 0 }}>
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

  const dims     = SYSTEM_DATA.preSessionContext?.dimensions || [];
  const rb       = (selections.preSessionContext || {}) as Record<string, string>;
  const isLocked = highestStep > 1;

  const setRb = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, preSessionContext: { ...rb, [key]: val } });
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
  const dims = (SYSTEM_DATA.htfStructure?.dimensions || []).filter(dim => !dim.multiselect);

  const toggleHtf = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, htfStructure: { ...htf, [key]: val } });
  };

  const stopReason = htf.structuralContinuity === 'Broken Continuity'
    ? 'Structural continuity is broken. Price has violated HTF structure — no valid trade environment exists.'
    : htf.anchorCondition === 'Anchor Failure'
    ? 'Anchor has failed. Foundational structural origin has failed — no valid trade environment exists.'
    : htf.protectionCondition === 'Protection Failure'
    ? 'Protection has failed. Defended structural boundary has failed — no valid trade environment exists.'
    : 'Late maturity + deep rotation + near destination forms a terminal squeeze. Continuation probability is too low.';

  return (
    <div className="flex flex-col phase-theme-1">
      {dims.map((dim) => {
        return (
          <div key={dim.id} className="precision-row flex items-center">
            <div className="precision-label">{dim.name}</div>
            <div className="precision-selector flex-1">
              {(dim.options || []).map(opt => {
                const isSelected = htf[dim.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => toggleHtf(dim.id, opt)}
                    disabled={isLocked}
                    className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >{opt}</button>
                );
              })}
            </div>
            {dim.id === 'legMaturity' && (
              <div className="flex gap-2 ml-4">
                <input type="text" placeholder="Avg No Of Legs" value={htf['avgNoOfLegs'] || ''} onChange={e => toggleHtf('avgNoOfLegs', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
                <input type="text" placeholder="Current Leg No" value={htf['currentLegNo'] || ''} onChange={e => toggleHtf('currentLegNo', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
              </div>
            )}
            {dim.id === 'rotationDepth' && (
              <div className="flex gap-2 ml-4">
                <input type="text" placeholder="Avg" value={htf['avgRotation'] || ''} onChange={e => toggleHtf('avgRotation', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-16 outline-none focus:border-[var(--accent)]" />
                <input type="text" placeholder="curr" value={htf['currRotation'] || ''} onChange={e => toggleHtf('currRotation', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-16 outline-none focus:border-[var(--accent)]" />
              </div>
            )}
            {dim.id === 'structuralCompression' && (
              <div className="flex gap-2 ml-4">
                <input type="text" placeholder="Avg Height" value={htf['avgHeight'] || ''} onChange={e => toggleHtf('avgHeight', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-20 outline-none focus:border-[var(--accent)]" />
                <input type="text" placeholder="Current Height" value={htf['currentHeight'] || ''} onChange={e => toggleHtf('currentHeight', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
              </div>
            )}
          </div>
        );
      })}

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

// ─── Component 4: HTF Events ───────────────────────────────────────────────

export function HTFEvents() {
  const { SYSTEM_DATA, selections, setSelections, highestStep } = useNetra();

  const isLocked = highestStep > 2;
  const htf  = (selections.htfStructure || {}) as Record<string, string>;
  const dims = (SYSTEM_DATA.htfStructure?.dimensions || []).filter(dim => dim.multiselect);

  const toggleHtf = (key: string, val: string) => {
    if (isLocked) return;
    const currentVal = htf[key] || '';
    let selectedVals = currentVal ? currentVal.split(', ') : [];
    if (val === 'No Significant Event') {
      selectedVals = ['No Significant Event'];
    } else {
      selectedVals = selectedVals.filter(v => v !== 'No Significant Event');
      if (selectedVals.includes(val)) {
        selectedVals = selectedVals.filter(v => v !== val);
      } else {
        selectedVals.push(val);
      }
    }
    const newVal = selectedVals.join(', ');
    setSelections({ ...selections, htfStructure: { ...htf, [key]: newVal } });
  };

  return (
    <div className="flex flex-col phase-theme-1">
      {dims.map((dim) => {
        const selectedVals = htf[dim.id] ? String(htf[dim.id]).split(', ') : [];
        return (
          <div key={dim.id} className="precision-row flex items-center">
            <div className="precision-label">{dim.name}</div>
            <div className="precision-selector flex-1">
              {(dim.options || []).map(opt => {
                const isSelected = selectedVals.includes(opt);
                return (
                  <button
                    key={opt}
                    onClick={() => toggleHtf(dim.id, opt)}
                    disabled={isLocked}
                    className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >{opt}</button>
                );
              })}
            </div>
          </div>
        );
      })}
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

  const biasDims = SYSTEM_DATA.preSessionContext?.dimensions || [];
  const rb       = (selections.preSessionContext || {}) as Record<string, string>;
  const allBias  = biasDims.length > 0 && biasDims.every(d => !!rb[d.id]);
  const hasData  = Object.keys(rb).length > 0;
  const canConfirm = !isLocked;

  const handleEdit  = () => { setEditing(false); editStep(1); };
  const handleReset = () => {
    if (isLocked) return;
    setSelections({ ...selections, preSessionContext: {} });
    setNotes({ ...notes, preSessionContext: '' });
  };

  return (
    <>
      <div style={{ borderTop: '1px solid var(--border-strong)', margin: '16px 0 0 0' }} />
      <div className="flex gap-4 items-start pt-4">
        <textarea
          value={notes.preSessionContext || ''}
          onChange={e => setNotes({ ...notes, preSessionContext: e.target.value })}
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
      {stepTimestamps.preSessionContext && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Locked: {stepTimestamps.preSessionContext}
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
  const canConfirm = !isLocked;
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
