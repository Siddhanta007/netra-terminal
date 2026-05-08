import { useNetra } from '../../context/NetraContext';

/**
 * Phase 6: Mission Matrix & Command - Unified Strategic Evaluation.
 * Combines Protocol Selection (Slider) and Mission Matrix (STS dimensions) into a single high-fidelity interface.
 * Leverages the new global '--tactical-text' CSS variable for modular color control.
 */
export default function Phase6Command() {
  const {
    SYSTEM_DATA,
    notes, setNotes,
    recommendedCommand, finalCommand, setFinalCommand,
    commandLocked, setCommandLocked,
    highestStep, confirmStep, editStep,
    stepTimestamps,
    strikeSelections, setStrikeSelections,
    interSelections, setInterSelections
  } = useNetra();

  const handleSelectCommand = (cmd) => {
    if (commandLocked) return;
    setFinalCommand(cmd);
  };

  // Determine which STS dimensions to show based on selected command
  const dimensions = finalCommand === 'STRIKE' ? (SYSTEM_DATA.strikeDimensions || []) : (SYSTEM_DATA.interceptionDimensions || []);
  const currentSelections = finalCommand === 'STRIKE' ? strikeSelections : interSelections;
  const setCurrentSelections = finalCommand === 'STRIKE' ? setStrikeSelections : setInterSelections;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up items-stretch phase-theme-1">
      
      {/* LEFT: STRATEGIC EVALUATION (COMMAND + MATRIX) */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        <section className="flex flex-col h-full">
          {/* SINGLE UNIFIED TACTICAL BOX */}
          <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col flex-1 min-h-[500px]">
            
            {/* COMMAND SLIDER - Top Section */}
            <div className="pb-8 border-b border-[var(--border)]/30 mb-8">
              <div className="label mb-4 tracking-[0.3em]">Command Protocol</div>
              <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {["STRIKE", "INTERCEPTION", "NO ENGAGEMENT"].map(cmd => {
                  const isRec = cmd === recommendedCommand;
                  const isSelected = cmd === finalCommand;
                  return (
                    <button
                      key={cmd}
                      onClick={() => handleSelectCommand(cmd)}
                      disabled={commandLocked}
                      className={`flex-shrink-0 min-w-[180px] p-4 text-left border transition-all duration-200 relative rounded-xl ${isSelected
                        ? 'border-[#4169E1] bg-[#4169E1]/5 glow-active'
                        : 'border-[var(--border)] hover:border-[#4169E1]/50 bg-[var(--surface-2)]/50'
                      } ${commandLocked && !isSelected ? 'opacity-30' : ''}`}
                    >
                      <div className="space-y-0.5">
                        <h4 className={`text-xs font-black tracking-tight uppercase leading-none ${isSelected ? 'text-[var(--tactical-text)]' : 'text-[var(--tactical-text)] opacity-60'}`}>
                          {cmd}
                        </h4>
                        <div className={`text-[7px] uppercase tracking-widest font-bold mt-1 ${isSelected ? 'text-[var(--tactical-text)] opacity-80' : 'text-[var(--tactical-text)] opacity-40'}`}>
                          {cmd === 'STRIKE' ? 'Offensive' : cmd === 'INTERCEPTION' ? 'Counter' : 'Observation'}
                        </div>
                      </div>
                      {isRec && <div className="absolute top-2 right-3 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MISSION MATRIX - Bottom Section */}
            <div className="flex-1 flex flex-col">
              <div className="label mb-6 tracking-[0.3em]">Mission Matrix (STS)</div>
              
              {finalCommand === 'NO ENGAGEMENT' ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-30">
                   <div className="w-10 h-10 rounded-full border border-[var(--border)] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>
                   </div>
                   <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-1)] dark:text-white">
                      Observation Mode — No Matrix Parameters Required
                   </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {dimensions.map((dim) => (
                    <div key={dim.id} className="precision-row border-b border-[var(--border)]/10 last:border-0 py-2">
                      <div className="precision-label min-w-[140px]">
                        {dim.name}
                      </div>
                      <div className="precision-selector">
                        {dim.opts.map(opt => {
                          const isSelected = currentSelections[dim.id] === opt;
                          return (
                            <button
                              key={opt}
                              disabled={commandLocked}
                              onClick={() => setCurrentSelections(prev => ({ ...prev, [dim.id]: opt }))}
                              className={`precision-opt ${isSelected ? 'selected' : ''} ${commandLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT: COMMAND CONTEXT */}
      <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
        <div className="space-y-6">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">Command Center</div>
            <h2 className="text-[20px] font-black tracking-tight text-[var(--text-1)] uppercase leading-none">Mission Evaluation</h2>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-40 mt-2" style={{ color: 'var(--text-3)' }}>Doctrine Selection & Matrix Mapping</p>
          </div>

          <div className="flex-1 flex flex-col gap-3 min-h-0">
            <div className="label" style={{ color: 'var(--text-4)' }}>Tactical Evaluation Notes</div>
            <textarea
              value={notes.command || ''}
              onChange={(e) => setNotes({ ...notes, command: e.target.value })}
              placeholder="Record strategic reasoning for protocol selection and matrix alignment..."
              disabled={commandLocked}
              className="field-area flex-1 min-h-[240px]"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-6 border-t border-[var(--border)]/30">
          <div className="flex gap-2">
            <button onClick={() => { setCommandLocked(false); editStep(5); }} className="btn-reset flex-1" disabled={!commandLocked}>Edit</button>
            <button 
              onClick={() => { setCommandLocked(true); confirmStep(5); }} 
              className={`${commandLocked ? 'btn-confirmed' : 'btn-confirm'} flex-1`} 
              disabled={commandLocked || !finalCommand}
            >
              {commandLocked ? '✓ Evaluated' : 'Confirm Evaluation'}
            </button>
          </div>
          {stepTimestamps.command && (
             <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40">Protocol Lock: {stepTimestamps.command}</div>
          )}
        </div>
      </div>
    </div>
  );
}
