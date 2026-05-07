import { useNetra } from '../../context/NetraContext';

export default function Phase3Liquidity() {
  const {
    SYSTEM_DATA, selections, setSelections, notes, setNotes,
    highestStep, confirmStep, editStep,
  } = useNetra();
  
  const liquidityData = SYSTEM_DATA.liquidity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up">
      <div className="lg:col-span-7 flex flex-col gap-4">
        <section>
          <div className="modern-container">
            {liquidityData && liquidityData.dimensions && liquidityData.dimensions.map((dim) => (
              <div key={dim.id} className="modern-row">
                <label className="modern-label">{dim.name}</label>
                <div className="modern-selector">
                  {dim.options.map(opt => {
                    const isSelected = selections.liquidity?.[dim.id] === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setSelections({ ...selections, liquidity: { ...(selections.liquidity || {}), [dim.id]: opt } })}
                        className={`modern-opt ${isSelected ? 'selected' : ''}`}
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
          <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Phase 3: Tactical Context</div>
          <h2 style={{ fontSize: '22px', fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1 }}>1H Liquidity Context</h2>
        </div>
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="label">Context Notes</div>
          <textarea 
            value={notes.liquidity || ''} 
            onChange={e => setNotes({ ...notes, liquidity: e.target.value })} 
            placeholder="Analyst thought..." 
            className="field-area flex-1 min-h-[120px]" 
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '8px' }}>
          <button onClick={() => editStep(3)} className="btn-reset flex-1"   disabled={highestStep <= 3}>Edit</button>
          <button onClick={() => confirmStep(3)} className={`${highestStep > 3 ? 'btn-confirmed' : 'btn-confirm'} flex-1`}   disabled={highestStep > 3}>{highestStep > 3 ? '✓ Next' : 'Next'}</button>
        </div>
      </div>
    </div>
  );
}
