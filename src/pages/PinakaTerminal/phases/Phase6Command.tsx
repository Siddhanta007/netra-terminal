import { useState } from 'react';
import { useNetra } from '../../../context/NetraContext';
import { useReduceFlag } from '../../../hooks/useReduceFlag';
import Phase7STS from './Phase7STS';

// ─── Execution Mapping checklist (Tier 3 — 5M chart) ─────────────────────────

function ExecutionMarkingChecklist({
  checked, toggle, marks,
}: {
  checked: Record<string, boolean>;
  toggle: (id: string) => void;
  marks: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const done  = marks.filter(m => checked[m.id]).length;
  const total = marks.length;

  return (
    <div style={{ marginBottom: '4px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px',
          borderLeft: '3px solid var(--phase-accent)', paddingLeft: '10px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>Component 1 — Execution Marking</span>
        <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: done === total ? 'var(--phase-accent)' : 'var(--text-3)', letterSpacing: '0.04em', flexShrink: 0 }}>{done}/{total}</span>
        <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '8px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>5M</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '9px', color: 'var(--text-4)', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          border: '1px solid var(--border-strong)',
          borderRadius: '4px', overflow: 'hidden', marginBottom: '12px',
        }}>
          {marks.map((m, i) => {
            const isDone = !!checked[m.id];
            const isLastRow = i >= 3;
            const isRightEdge = (i + 1) % 3 === 0;
            return (
              <div
                key={m.id}
                onClick={e => { e.stopPropagation(); toggle(m.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', cursor: 'pointer',
                  background: isDone ? 'var(--phase-accent-bg)' : 'transparent',
                  borderBottom: isLastRow ? 'none' : '1px solid var(--border)',
                  borderRight: isRightEdge ? 'none' : '1px solid var(--border)',
                  transition: 'background 120ms',
                }}
              >
                <div style={{
                  width: '11px', height: '11px', flexShrink: 0, borderRadius: '2px',
                  border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
                  background: isDone ? 'var(--phase-accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 100ms',
                }}>
                  {isDone && <span style={{ fontSize: '7px', color: 'white', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{
                  fontFamily: 'Space Grotesk, Inter, sans-serif',
                  fontSize: '9px', fontWeight: 500, flex: 1, lineHeight: 1.4,
                  color: isDone ? 'var(--text-3)' : 'var(--text-1)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-4)',
                }}>{m.label}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Phase6Command() {
  const {
    SYSTEM_DATA,
    notes, setNotes,
    netraOutput, finalCommand, setFinalCommand,
    commandLocked, setCommandLocked,
    confirmStep, editStep,
    stepTimestamps,
  } = useNetra();

  const executionMarks = SYSTEM_DATA.executionMarks || [];

  const reduceFlag = useReduceFlag();
  const recommendedCommand = netraOutput?.cmd || null;

  const [emChecked, setEmChecked] = useState<Record<string, boolean>>({});
  const toggleEm = (id: string) => setEmChecked(c => ({ ...c, [id]: !c[id] }));

  const handleSelect = (cmd: string) => {
    if (commandLocked) return;
    setFinalCommand(cmd);
  };

  return (
    <div className="flex flex-col fade-up phase-theme-2">

      {/* ── Command Selection ── */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ marginBottom: '8px', paddingLeft: '2px' }}>
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Command Protocol</span>
        </div>
        <div className="precision-selector">
          {(['STRIKE', 'INTERCEPTION', 'SATURATION', 'NO ENGAGEMENT'] as const).map(cmd => {
            const isRec = cmd === recommendedCommand;
            const isSelected = cmd === finalCommand;
            return (
              <button
                key={cmd}
                onClick={() => handleSelect(cmd)}
                disabled={commandLocked}
                className={`precision-opt relative ${isSelected ? 'selected' : ''} ${commandLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={{ minWidth: '100px', height: '34px', letterSpacing: '0.1em' }}
              >
                {cmd}
                {isRec && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--phase-accent)] shadow-[0_0_6px_var(--phase-accent)]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Component 2: Execution Marking (only after command, not NO ENGAGEMENT) ── */}
      {finalCommand && finalCommand !== 'NO ENGAGEMENT' && (
        <ExecutionMarkingChecklist checked={emChecked} toggle={toggleEm} marks={executionMarks} />
      )}

      {/* ── Component 3: STS Execution Tree ── */}
      {!finalCommand ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px', opacity: 0.3 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Select a command to load the STS tree</span>
        </div>
      ) : finalCommand === 'NO ENGAGEMENT' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '10px', opacity: 0.3 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Observation Mode — No Matrix Parameters Required</span>
        </div>
      ) : (
        <>
          <div style={{
            margin: '20px 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px',
            borderLeft: '3px solid var(--phase-accent)', paddingLeft: '10px',
          }}>
            <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>Component 2 — Execution Dimensions</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <Phase7STS command={finalCommand as 'STRIKE' | 'INTERCEPTION' | 'SATURATION'} isLocked={commandLocked} />
        </>
      )}

      {/* ── Notes + Actions ── */}
      <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border-strong)]">
        <textarea
          value={notes.command || ''}
          onChange={e => setNotes({ ...notes, command: e.target.value })}
          placeholder="Record strategic reasoning for protocol selection and matrix alignment..."
          disabled={commandLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => { setCommandLocked(false); editStep(4); }} className="btn-edit w-20" disabled={!commandLocked}>Edit</button>
          <button
            onClick={() => { setCommandLocked(true); confirmStep(4); }}
            className={`${commandLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={commandLocked}
          >
            {commandLocked ? '✓ Command Locked' : 'Confirm Command'}
          </button>
        </div>
      </div>
      {stepTimestamps.command && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Locked: {stepTimestamps.command}
        </div>
      )}

    </div>
  );
}
