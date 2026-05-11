import { useNetra } from '../../context/NetraContext';
import { useReduceFlag } from '../../hooks/useReduceFlag';
import Phase7STS, { getStrikeVerdict, getInterVerdict } from './Phase7STS';

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

  const stsVerdict = finalCommand === 'STRIKE'
    ? getStrikeVerdict(strikeSelections)
    : finalCommand === 'INTERCEPTION'
    ? getInterVerdict(interSelections)
    : 'EXECUTE';

  const stsBlocked = finalCommand !== 'NO ENGAGEMENT' && stsVerdict !== 'EXECUTE';

  return (
    <div className="flex flex-col fade-up phase-theme-1">

      {/* REDUCE FLAG */}
      {reduceFlag && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ⚠ REDUCE FLAG ACTIVE — Half R · First Target Only · No Trailing
          </span>
        </div>
      )}

      {/* COMMAND PROTOCOL */}
      <div className="precision-row">
        <div className="precision-label">Command Protocol</div>
        <div className="precision-selector">
          {(['STRIKE', 'INTERCEPTION', 'NO ENGAGEMENT'] as const).map(cmd => {
            const isRec = cmd === recommendedCommand;
            const isSelected = cmd === finalCommand;
            return (
              <button
                key={cmd}
                onClick={() => handleSelectCommand(cmd)}
                disabled={commandLocked}
                className={`precision-opt relative ${isSelected ? 'selected' : ''} ${commandLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {cmd}
                {isRec && <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* MISSION MATRIX (STS) */}
      {finalCommand === 'NO ENGAGEMENT' ? (
        <div className="flex items-center justify-center py-10 opacity-30 gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>
          <p className="text-[9px] font-bold uppercase tracking-widest">Observation Mode — No Matrix Parameters Required</p>
        </div>
      ) : (finalCommand === 'STRIKE' || finalCommand === 'INTERCEPTION') ? (
        <>
          <div className="flex items-center gap-3 my-3">
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.5 }}>STS Execution Tree — {finalCommand}</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>
          <Phase7STS command={finalCommand} isLocked={commandLocked} />
        </>
      ) : null}

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
          <button onClick={() => { setCommandLocked(false); editStep(5); }} className="btn-reset w-24" disabled={!commandLocked}>Edit</button>
          <button
            onClick={() => { setCommandLocked(true); confirmStep(5); }}
            className={`${commandLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={commandLocked || !finalCommand || stsBlocked}
          >
            {commandLocked ? '✓ Evaluated' : 'Confirm Evaluation'}
          </button>
        </div>
      </div>
      {stepTimestamps.command && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40 mt-1">Protocol Lock: {stepTimestamps.command}</div>
      )}

    </div>
  );
}
