import { useNetra } from '../../context/NetraContext';
import ReactMarkdown from 'react-markdown';


export default function Phase5Netra() {
  const {
    SYSTEM_DATA, selections, notes, setNotes,
    highestStep, confirmStep, editStep,
    finalCommand, setFinalCommand,
    commandLocked, setCommandLocked,
    netraOutput, isEvaluating, sysRecommendation,
    interSelections, setInterSelections,
    strikeSelections, setStrikeSelections,
    showToast, getNCSBreakdown, triggerNeuralSynthesis, stopSynthesis,
  } = useNetra();
  const sysData = SYSTEM_DATA;
  const currCommand = finalCommand || (netraOutput ? netraOutput.cmd : null);
  const recommendedCommand = netraOutput ? netraOutput.cmd : null;
  const sysOutput = netraOutput;

  if (!sysData || !sysData.strikeDimensions) return null;

  return (
      <div className="space-y-8 animate-in zoom-in-95 fade-in duration-500">

        {/* ═══ BOX 1: NETRA LABS HUB ═══ */}
        <div className="p-8 md:p-12 rounded-2xl premium-shadow" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
          <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-mono text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-3)' }}>NETRA LABS</h3>
            <div className="flex items-center gap-3">
              <span className="text-[9px] px-3 py-1 rounded-lg tracking-widest font-semibold" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>NETRA 2.5 ACTIVE</span>
              <span className="text-[9px] px-3 py-1 rounded-lg tracking-widest font-semibold" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>MISSION EVALUATION</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-10">
            {/* LEFT: NETRA's Analysis Report */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              <div className="flex items-start justify-between">
                <div>
                   <h2 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--text-1)' }}>NETRA's analysis</h2>
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-60" style={{ color: 'var(--text-3)' }}>Doctrine & Context Synthesis</p>
                </div>
                <div className="flex gap-4">
                  {netraOutput && (
                    <div className="text-right">
                      <div className="text-[9px] font-bold uppercase tracking-widest mb-1 opacity-50">Conviction</div>
                      <div className={`text-xl font-black ${sysOutput.conviction === 'HIGH' ? 'text-green-500' : sysOutput.conviction === 'MED' ? 'text-amber-500' : 'text-slate-400'}`}>
                          {sysOutput.conviction}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* THE CORE NETRA SYNTHESIS BOX */}
              <div className="p-6 rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-bg)]/30 min-h-[400px] flex flex-col relative overflow-hidden">
                {isEvaluating ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)] animate-spin"></div>
                    <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse" style={{ color: 'var(--accent)' }}>NETRA is Analysing...</span>
                  </div>
                ) : netraOutput ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none text-[var(--text-2)] leading-relaxed markdown-content w-full h-full overflow-y-auto custom-scrollbar pr-4">
                     {/* Structure the AI output for clarity */}
                     <div className="mb-6 pb-4 border-b border-[var(--accent-border)]/30">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--accent)] mb-2 block">Tactical Recommendation</span>
                        <div className="text-xl font-black uppercase tracking-tight text-[var(--text-1)]">
                           {sysOutput.cmd} protocol suggested
                        </div>
                     </div>
                     <ReactMarkdown children={sysOutput.analysis} />
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center opacity-40">
                    <div className="w-14 h-14 rounded-full bg-[var(--surface-3)] flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <p className="text-[11px] font-semibold text-[var(--text-3)] max-w-xs">
                      Operational Analysis Standby. Use "Analyse" to initiate tactical synthesis.
                    </p>
                  </div>
                )}
              </div>

              {/* LEFT SIDE CONTROLS */}
              <div className="flex gap-2">
                <button 
                  onClick={stopSynthesis}
                  className="btn-reset flex-1"
                  disabled={!isEvaluating}
                >
                  STOP
                </button>
                <button 
                  onClick={triggerNeuralSynthesis} 
                  className="btn-confirm flex-1 flex items-center justify-center gap-2"
                  disabled={isEvaluating}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                  {isEvaluating ? 'ANALYSING...' : 'Analyse with NETRA'}
                </button>
              </div>

            </div>

            {/* RIGHT: Command Selection + NETRA Control */}
            <div className="lg:col-span-5 lg:pl-8 border-t lg:border-t-0 lg:border-l border-[var(--border)] flex flex-col gap-6">
              <div>
                <h3 className="text-[9px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }}>Command Selection</h3>
                <div className="flex flex-col gap-2">
                  {["STRIKE", "INTERCEPTION", "NO ENGAGEMENT"].map(cmd => {
                    const isRecommended = cmd === recommendedCommand;
                    const isSelected = cmd === currCommand;

                    return (
                      <button
                        key={cmd}
                        onClick={() => {
                          setFinalCommand(cmd);
                          setCommandLocked(false);
                        }}
                        className={`p-4 text-left border rounded-xl transition-all duration-300 relative ${isSelected
                            ? 'border-[var(--accent)] bg-[var(--accent-bg)] text-[var(--accent)] glow-active'
                            : 'border-[var(--border)] hover:border-[var(--border-strong)] text-[var(--text-3)] hover:bg-[var(--surface-2)]'
                          }`}
                      >
                        {isRecommended && (
                          <div className="absolute top-1/2 -translate-y-1/2 right-4 text-[9px] font-bold tracking-widest bg-blue-600 px-2.5 py-1 text-white rounded-full uppercase shadow-sm animate-pulse">
                            SYS REC
                          </div>
                        )}
                        <h4 className="font-sans text-lg font-black tracking-tight uppercase">
                          {cmd}
                        </h4>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-3 min-h-0">
                <label className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>Tactical Auditor Notes</label>
                <textarea
                  value={notes.command || ''}
                  onChange={e => setNotes({ ...notes, command: e.target.value })}
                  placeholder="Record your audit of the mission context..."
                  className="field-area flex-1 min-h-[100px] text-xs"
                  disabled={commandLocked}
                />
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setCommandLocked(false)} className="btn-reset"   disabled={!commandLocked}>Edit</button>
                  <button onClick={() => setCommandLocked(true)} className={`${commandLocked ? 'btn-confirmed' : 'btn-confirm'}`}   disabled={commandLocked || !currCommand}>{commandLocked ? '✓ Confirm' : 'Confirm'}</button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* NO ENGAGEMENT inline */}
        {currCommand === 'NO ENGAGEMENT' && commandLocked && (
          <div className="p-12 rounded-2xl premium-shadow text-center animate-in fade-in duration-500" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-[var(--red)] font-sans text-sm font-bold uppercase tracking-widest py-4 px-6 border border-[var(--red)] bg-[var(--red-bg)] rounded-xl inline-block">
              Stand Down — No Execution Parameters Required
            </div>
            {highestStep <= 5 && (
              <div className="mt-8">
                <button
                  onClick={() => confirmStep(5)}
                  className="btn-confirm max-w-sm mx-auto" style={{ width: '100%' }}
                >
                  Conclude Session
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ BOX 2: STS DIMENSIONS (STRIKE/INTERCEPTION ONLY) ═══ */}
        {currCommand && currCommand !== 'NO ENGAGEMENT' && commandLocked && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <section>
              <div className="modern-container">
                <label className="modern-label" style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', pb: '12px' }}>STS Dimensions Matrix</label>
                <div className="grid lg:grid-cols-2 gap-x-10 gap-y-8">
                  {(currCommand === 'STRIKE' ? sysData.strikeDimensions : sysData.interceptionDimensions).map((dim, idx) => (
                    <div key={dim.id} className="modern-row" style={{ marginBottom: 0 }}>
                      <label className="modern-label" style={{ fontSize: '9px', opacity: 0.8 }}>{dim.name}</label>
                      <div className="modern-selector">
                        {dim.opts.map(opt => {
                          const sel = currCommand === 'STRIKE' ? strikeSelections : interSelections;
                          const setSel = currCommand === 'STRIKE' ? setStrikeSelections : setInterSelections;
                          const isSelected = sel[dim.id] === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => setSel(prev => ({ ...prev, [dim.id]: opt }))}
                              className={`modern-opt ${isSelected ? 'selected' : ''}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>

            <div className="lg:col-span-5 flex flex-col pt-1">
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Phase 5: Matrix</div>
                <h2 style={{ fontSize: '22px', fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1.1 }}>STS Evaluation</h2>
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
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginTop: '8px' }}>
                <button onClick={() => editStep(5)} className="btn-reset flex-1"   disabled={highestStep <= 5}>Edit</button>
                <button onClick={() => confirmStep(5)} className={`${highestStep > 5 ? 'btn-confirmed' : 'btn-confirm'} flex-1`}   disabled={highestStep > 5}>{highestStep > 5 ? '✓ Next' : 'Next'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
