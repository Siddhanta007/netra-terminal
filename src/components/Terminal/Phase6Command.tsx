import { useNetra } from '../../context/NetraContext';
import { useReduceFlag } from '../../hooks/useReduceFlag';
import Phase7STS from './Phase7STS';

export default function Phase6Command() {
  const {
    notes, setNotes,
    netraOutput, finalCommand, setFinalCommand,
    commandLocked, setCommandLocked,
    highestStep, confirmStep, editStep,
    stepTimestamps,
    strikeSelections,
    interSelections,
  } = useNetra();

  const reduceFlag = useReduceFlag();
  const recommendedCommand = netraOutput?.cmd || null;

  const handleSelectCommand = (cmd: string) => {
    if (commandLocked) return;
    setFinalCommand(cmd);
  };



  return (
    <div className="flex flex-col fade-up phase-theme-1">



      {/* COMMAND PROTOCOL */}
      <div className="precision-row">
        <div className="precision-label">Command Protocol</div>
        <div className="precision-selector">
          {(['STRIKE', 'INTERCEPTION', 'SATURATION', 'NO ENGAGEMENT'] as const).map(cmd => {
            const isRec = cmd === recommendedCommand;
            const isSelected = cmd === finalCommand;
            return (
              <button
                key={cmd}
                onClick={() => handleSelectCommand(cmd)}
                disabled={commandLocked}
                className={`precision-opt relative ${isSelected ? 'selected' : ''} ${commandLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={{
                  borderColor: isSelected ? (
                    cmd === 'STRIKE' ? '#ffd700' : 
                    cmd === 'INTERCEPTION' ? '#38bdf8' : 
                    cmd === 'SATURATION' ? '#f97316' :
                    '#ef4444'
                  ) : undefined,
                  background: isSelected ? (
                    cmd === 'STRIKE' ? 'rgba(255,215,0,0.14)' : 
                    cmd === 'INTERCEPTION' ? 'rgba(56,189,248,0.14)' : 
                    cmd === 'SATURATION' ? 'rgba(249,115,22,0.14)' :
                    'rgba(239,68,68,0.14)'
                  ) : undefined,
                  color: isSelected ? '#ffffff' : undefined,
                }}
              >
                {cmd}
                {isRec && <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* MISSION MATRIX (STS) */}
      {!finalCommand ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3" style={{ opacity: 0.35 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
          <p className="text-[9px] font-bold uppercase tracking-widest">Awaiting Command Selection — Select a Protocol Above</p>
        </div>
      ) : finalCommand === 'NO ENGAGEMENT' ? (
        <div className="flex items-center justify-center py-10 opacity-30 gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>
          <p className="text-[9px] font-bold uppercase tracking-widest">Observation Mode — No Matrix Parameters Required</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 my-3">
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>STS Execution Tree — {finalCommand}</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <Phase7STS command={finalCommand} isLocked={commandLocked} />
        </>
      )}

      {/* NOTES + ACTIONS */}
      <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border)]">
        <textarea
          value={notes.command || ''}
          onChange={(e) => setNotes({ ...notes, command: e.target.value })}
          placeholder="Record strategic reasoning for protocol selection and matrix alignment..."
          disabled={commandLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => { setCommandLocked(false); editStep(4); }} className="btn-reset w-24" disabled={!commandLocked}>Edit</button>
          <button
            onClick={() => { setCommandLocked(true); confirmStep(4); }}
            className={`${commandLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={commandLocked || !finalCommand}
          >
            {commandLocked ? '✓ Evaluated' : 'Confirm Evaluation'}
          </button>
        </div>
      </div>
      {stepTimestamps.command && (
        <div className="text-right text-[9px] font-mono text-[#ffffff] opacity-80 mt-1">Protocol Lock: {stepTimestamps.command}</div>
      )}

    </div>
  );
}
