import { useNetra } from '../../context/NetraContext';

/**
 * ModularPhase: Standardized template for human tactical input (Phases 1-4).
 * Layout: Left (7) Dimensional Selectors | Right (5) Tactical Notes & Navigation
 */
export default function ModularPhase({ phaseId, phaseNum, notesLabel }) {
  const {
    SYSTEM_DATA, selections, setSelections, notes, setNotes,
    highestStep, confirmStep, editStep,
  } = useNetra();
  
  const phaseData = SYSTEM_DATA[phaseId];

  // Dynamic Title Logic from Backend
  const rawTitle = phaseData?.title || '';
  const displayTitle = rawTitle ? rawTitle.replace(/^\d+\.\s*/, '').split('(')[0]?.trim() : '';
  const displaySub = rawTitle ? rawTitle.split('(')[1]?.replace(')', '').trim() : '';

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up phase-theme-1 items-stretch`}>
      
      {/* LEFT: TACTICAL DIMENSIONS (SELECTORS) */}
      <div className="lg:col-span-7 flex flex-col">
        <section className="flex flex-col h-full">
          <div className="precision-container flex-1">
            {phaseData?.dimensions?.map((dim) => (
              <div key={dim.id} className="precision-row">
                <div className="precision-label">{dim.name}</div>
                <div className="precision-selector">
                  {dim.options.map(opt => {
                    const isSelected = selections[phaseId]?.[dim.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelections({ 
                          ...selections, 
                          [phaseId]: { ...(selections[phaseId] || {}), [dim.id]: opt } 
                        })}
                        className={`precision-opt ${isSelected ? 'selected' : ''}`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* RIGHT: COMMAND CONTEXT (NOTES & NAVIGATION) */}
      <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
        <div className="space-y-6">
          <div>
            <h2 className="phase-subheading" style={{ lineHeight: 1.1 }}>{displayTitle}</h2>
            {displaySub && <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1" style={{ color: 'var(--text-3)' }}>{displaySub}</p>}
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="label" style={{ color: 'var(--text-4)' }}>{notesLabel || 'Tactical Notes'}</div>
            <textarea 
              value={notes[phaseId] || ''} 
              onChange={e => setNotes({ ...notes, [phaseId]: e.target.value })} 
              placeholder="Analyst thought..." 
              className="field-area flex-1 min-h-[160px]" 
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={() => editStep(phaseNum)} className="btn-reset flex-1" disabled={highestStep <= phaseNum}>Edit</button>
          <button onClick={() => confirmStep(phaseNum)} className={`${highestStep > phaseNum ? 'btn-confirmed' : 'btn-confirm'} flex-1`} disabled={highestStep > phaseNum}>{highestStep > phaseNum ? '✓ Next' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
