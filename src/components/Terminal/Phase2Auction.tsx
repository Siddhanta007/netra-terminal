import { useNetra } from '../../context/NetraContext';
import { useHTFGate } from '../../hooks/useReduceFlag';

export default function Phase2Auction() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, confirmStep, editStep,
    stepTimestamps,
  } = useNetra();

  const htfGate  = useHTFGate();
  const isStop   = htfGate === 'STOP';
  const isLocked = highestStep > 2;

  const htf  = (selections.htfStructure || {}) as Record<string, string>;
  const dims = SYSTEM_DATA.htfStructure?.dimensions || [];

  const setHtf = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, htfStructure: { ...htf, [key]: val } });
  };

  const allSelected = dims.every(d => !!htf[d.id]);
  const canConfirm  = !isLocked && !isStop && allSelected;

  const stopReason = htf.continuity === 'Broken'
    ? 'Structural continuity is broken. Price has violated HTF structure — no valid trade environment exists.'
    : 'Late maturity + deep rotation + near destination forms a terminal squeeze. Continuation probability is too low.';

  return (
    <div className="flex flex-col fade-up phase-theme-2">

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
              <input type="text" placeholder="Avg No Of Legs" value={htf['avgNoOfLegs'] || ''} onChange={e => setHtf('avgNoOfLegs', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded-none text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="Current Leg No" value={htf['currentLegNo'] || ''} onChange={e => setHtf('currentLegNo', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded-none text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
          {dim.id === 'rotation' && (
            <div className="flex gap-2 ml-4">
              <input type="text" placeholder="Avg" value={htf['avgRotation'] || ''} onChange={e => setHtf('avgRotation', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded-none text-[var(--text-1)] w-16 outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="curr" value={htf['currRotation'] || ''} onChange={e => setHtf('currRotation', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded-none text-[var(--text-1)] w-16 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
          {dim.id === 'compression' && (
            <div className="flex gap-2 ml-4">
              <input type="text" placeholder="Avg Height" value={htf['avgHeight'] || ''} onChange={e => setHtf('avgHeight', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded-none text-[var(--text-1)] w-20 outline-none focus:border-[var(--accent)]" />
              <input type="text" placeholder="Current Height" value={htf['currentHeight'] || ''} onChange={e => setHtf('currentHeight', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded-none text-[var(--text-1)] w-24 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
          {dim.name === 'HTF Imbalance' && (
            <div className="flex gap-2 ml-4">
              <input type="text" placeholder="Filling percentage" value={htf['fillingPercentage'] || ''} onChange={e => setHtf('fillingPercentage', e.target.value)} disabled={isLocked} className="px-2 py-1 text-[10px] bg-[var(--surface-2)] border border-[var(--border)] rounded-none text-[var(--text-1)] w-32 outline-none focus:border-[var(--accent)]" />
            </div>
          )}
        </div>
      ))}

      {isStop && !isLocked && (
        <div className="flex flex-col gap-1.5 px-4 py-3 mt-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Session Ends Here</span>
          <span style={{ fontSize: '10px', color: '#ef4444', opacity: 0.75, lineHeight: 1.5 }}>{stopReason}</span>
          <span style={{ fontSize: '9px', color: '#ef4444', opacity: 0.5, marginTop: '4px' }}>Chart closes. No further analysis permitted for this session.</span>
        </div>
      )}

      <div className="flex gap-4 items-start pt-4 mt-2">
        <textarea
          value={notes.htfStructure || ''}
          onChange={e => setNotes({ ...notes, htfStructure: e.target.value })}
          placeholder="Record structural analysis — continuity assessment, leg maturity, rotation depth, liquidity destination..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => editStep(2)} className="btn-reset w-24" disabled={!isLocked}>Edit</button>
          <button
            onClick={() => confirmStep(2)}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={!canConfirm}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm Structure'}
          </button>
        </div>
      </div>

      {stepTimestamps.htfStructure && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40 mt-1">
          Locked: {stepTimestamps.htfStructure}
        </div>
      )}
    </div>
  );
}
