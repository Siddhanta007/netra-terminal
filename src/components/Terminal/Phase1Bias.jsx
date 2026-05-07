import { useNetra } from '../../context/NetraContext';

export default function Phase1Bias() {
  const {
    SYSTEM_DATA, selections, setSelections, notes, setNotes,
    highestStep, confirmStep, editStep,
  } = useNetra();
  
  const biasData = SYSTEM_DATA.bias;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up">
      <div className="lg:col-span-7 flex flex-col gap-4">
        <section>
          <div className="flex flex-col gap-6">
            {biasData && biasData.dimensions && biasData.dimensions.map((dim) => (
              <div key={dim.id} className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-3)]">{dim.name}</div>
                  {selections.bias?.[dim.id] && (
                    <div className="text-[8px] font-bold text-[var(--accent)] uppercase tracking-widest animate-in fade-in">Selection Active</div>
                  )}
                </div>
                <div className="tactical-selector">
                  {dim.options.map(opt => {
                    const isSelected = selections.bias?.[dim.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelections({ ...selections, bias: { ...(selections.bias || {}), [dim.id]: opt } })}
                        className={`tactical-opt ${isSelected ? 'selected' : ''}`}
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
      <div className="lg:col-span-5 flex flex-col gap-6">
        <div style={{ marginBottom: '0px' }}>
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Phase 1: Tactical Context</div>
          <h2 style={{ fontSize: '22px', fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1 }}>1H Bias Context</h2>
        </div>
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="label">Context Notes</div>
          <textarea 
            value={notes.bias || ''} 
            onChange={e => setNotes({ ...notes, bias: e.target.value })} 
            placeholder="Analyst thought..." 
            className="field-area flex-1 min-h-[120px]" 
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '8px' }}>
          <button onClick={() => editStep(1)} className="btn-reset flex-1"   disabled={highestStep <= 1}>Edit</button>
          <button onClick={() => confirmStep(1)} className={`${highestStep > 1 ? 'btn-confirmed' : 'btn-confirm'} flex-1`}   disabled={highestStep > 1}>{highestStep > 1 ? '✓ Next' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
