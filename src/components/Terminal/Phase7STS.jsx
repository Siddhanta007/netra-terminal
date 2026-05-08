import { useNetra } from '../../context/NetraContext';

/**
 * Phase 7: Mission Matrix - Structural, Tactical, and Strategic (STS) Evaluation.
 */
export default function Phase7STS() {
  const {
    SYSTEM_DATA,
    notes, setNotes,
    finalCommand, commandLocked,
    highestStep, confirmStep, editStep,
    strikeSelections, setStrikeSelections,
    interSelections, setInterSelections,
    stepTimestamps
  } = useNetra();

  // If no engagement, this phase is bypassed (handled in App.jsx or here)
  if (finalCommand === 'NO ENGAGEMENT') {
     return (
        <div className="p-12 rounded-2xl premium-shadow text-center animate-in fade-in duration-500" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-[var(--red)] font-sans text-sm font-bold uppercase tracking-widest py-4 px-6 border border-[var(--red)] bg-[var(--red-bg)] rounded-xl inline-block">
            Stand Down — No Execution Parameters Required
          </div>
          {highestStep === 7 && (
            <div className="mt-8">
              <button onClick={() => confirmStep(7)} className="btn-confirm max-w-sm mx-auto w-full">Finalize Mission</button>
            </div>
          )}
        </div>
     );
  }

  const dimensions = finalCommand === 'STRIKE' ? SYSTEM_DATA.strikeDimensions : SYSTEM_DATA.interceptionDimensions;
  const selections = finalCommand === 'STRIKE' ? strikeSelections : interSelections;
  const setSelections = finalCommand === 'STRIKE' ? setStrikeSelections : setInterSelections;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up phase-theme-1">
      {/* LEFT: Precision Selectors */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <section>
          <div className="precision-container">
            {dimensions.map((dim) => (
              <div key={dim.id} className="precision-row">
                <div className="precision-label">{dim.name}</div>
                <div className="precision-selector">
                  {dim.opts.map(opt => {
                    const isSelected = selections[dim.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelections(prev => ({ ...prev, [dim.id]: opt }))}
                        className={`precision-opt ${isSelected ? 'selected' : ''}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RIGHT: STS Notes & Final Confirmation */}
      <div className="lg:col-span-5 flex flex-col pt-1">
        <div className="mb-4">
          <div className="phase-heading" style={{ marginBottom: '4px' }}>Mission Matrix</div>
          <h2 className="phase-subheading" style={{ lineHeight: 1.1 }}>STS Evaluation</h2>
        </div>
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="label">STS Logic Notes</div>
          <textarea
            value={notes.sts || ''}
            onChange={e => setNotes({ ...notes, sts: e.target.value })}
            placeholder="Record tactical reasoning for structural and trigger selections..."
            className="field-area flex-1 min-h-[120px]"
          />
        </div>
        <div className="flex gap-2 pt-4">
          <button onClick={() => editStep(7)} className="btn-reset flex-1" disabled={highestStep <= 7}>Edit</button>
          <button onClick={() => confirmStep(6)} className={`${highestStep > 6 ? 'btn-confirmed' : 'btn-confirm'} flex-1`} disabled={highestStep > 6}>
            {highestStep > 6 ? '✓ Complete' : 'Finalize Mission Matrix'}
          </button>
        </div>
        {stepTimestamps.matrix && (
          <div className="text-right text-[10px] font-mono text-[var(--text-4)] mt-4">Mission Finalized at {stepTimestamps.matrix}</div>
        )}
      </div>
    </div>
  );
}
