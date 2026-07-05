import { useState, useEffect } from 'react';
import { useNetra } from '../../../context/NetraContext';
import { useReduceFlag } from '../../../hooks/useReduceFlag';
import Phase7STS from './Phase7STS';
import { StrikeSelections, InterSelections } from '../../../types';

// ─── Component 1: Command Marking (Tier 3 — 5M chart) ─────────────────────────

function CommandMarkingChecklist({
  checked, toggle, marks,
}: {
  checked: Record<string, boolean>;
  toggle: (id: string) => void;
  marks: { id: string; label: string }[];
}) {
  const [open, setOpen] = useState(true);
  const done  = marks.filter(m => checked[m.id]).length;
  const total = marks.length;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px',
          borderLeft: '3px solid var(--phase-accent)', paddingLeft: '10px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
          Component 1 — Command Marking
        </span>
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

// ─── Component 3: Command Event (Multiselect checklist) ──────────────────────────

interface CommandEventOption {
  id: string;
  name: string;
  outputs: string[];
}

function CommandEventRow({
  event,
  selectedValues,
  onChange,
  isLocked,
}: {
  event: CommandEventOption;
  selectedValues: string[];
  onChange: (newVals: string[]) => void;
  isLocked: boolean;
}) {
  const toggleOption = (opt: string) => {
    if (isLocked) return;
    if (opt === 'Unknown' || opt === 'No Significant Event') {
      if (selectedValues.includes(opt)) {
        onChange([]);
      } else {
        onChange([opt]);
      }
    } else {
      let next = selectedValues.filter(v => v !== 'Unknown' && v !== 'No Significant Event');
      if (next.includes(opt)) {
        next = next.filter(v => v !== opt);
      } else {
        next.push(opt);
      }
      onChange(next);
    }
  };

  return (
    <div className="precision-row flex items-center" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '10px', marginBottom: '10px' }}>
      <div className="precision-label" style={{ minWidth: '140px' }}>{event.name}</div>
      <div className="precision-selector flex-1 flex flex-wrap gap-1.5">
        {(event.outputs || []).map(opt => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => toggleOption(opt)}
              disabled={isLocked}
              className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
              style={{ padding: '4px 8px', fontSize: '9px' }}
            >
              {opt}
            </button>
          );
        })}
      </div>
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
    strikeSelections, setStrikeSelections,
    interSelections, setInterSelections,
    saturationSelections, setSaturationSelections,
    confirmStep, editStep,
    stepTimestamps,
  } = useNetra();

  const executionMarks = SYSTEM_DATA.executionMarks || [];
  const [emChecked, setEmChecked] = useState<Record<string, boolean>>({});
  const toggleEm = (id: string) => setEmChecked(c => ({ ...c, [id]: !c[id] }));

  // ── Auto-sync finalCommand from P6's recognised state ──
  const commandFromP6 = (netraOutput as Record<string, unknown>)?.cmd as string | null | undefined;
  useEffect(() => {
    if (!commandLocked && commandFromP6 && commandFromP6 !== finalCommand) {
      setFinalCommand(commandFromP6);
    }
  }, [commandFromP6, commandLocked]);

  // Derive active command state's events
  const out = (netraOutput || {}) as Record<string, unknown>;
  const inner = (out.data && typeof out.data === 'object' ? out.data : out) as Record<string, unknown>;
  const recognizedState = inner.recognized_state as any | undefined;
  const events = (recognizedState?.events || []) as CommandEventOption[];

  const handleEventChange = (eventId: string, newVals: string[]) => {
    if (commandLocked) return;
    const valString = newVals.join(', ');
    if (finalCommand === 'STRIKE') {
      setStrikeSelections({ ...strikeSelections, [eventId]: valString } as StrikeSelections);
    } else if (finalCommand === 'INTERCEPTION') {
      setInterSelections({ ...interSelections, [eventId]: valString } as InterSelections);
    } else if (finalCommand === 'SATURATION') {
      setSaturationSelections({ ...saturationSelections, [eventId]: valString });
    }
  };

  const getSelectedEventValues = (eventId: string): string[] => {
    let str = '';
    if (finalCommand === 'STRIKE') {
      str = strikeSelections[eventId] || '';
    } else if (finalCommand === 'INTERCEPTION') {
      str = interSelections[eventId] || '';
    } else if (finalCommand === 'SATURATION') {
      str = saturationSelections[eventId] || '';
    }
    return str ? str.split(', ') : [];
  };

  return (
    <div className="flex flex-col fade-up phase-theme-2">

      {/* ── Active Command Badge (read-only — command is set in P6) ── */}
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}>
          Active Command
        </span>
        {finalCommand ? (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 800,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: finalCommand === 'NO ENGAGEMENT' ? '#ef4444'
                 : finalCommand === 'STRIKE'        ? '#ffd700'
                 : finalCommand === 'INTERCEPTION'  ? '#38bdf8'
                 : '#f97316',
            border: '1px solid currentColor', padding: '4px 14px',
          }}>
            {finalCommand}
          </span>
        ) : (
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic' }}>
            Run Analyse in P6 first
          </span>
        )}
      </div>

      {/* ── Component 1: Command Marking ── */}
      {finalCommand && finalCommand !== 'NO ENGAGEMENT' && (
        <CommandMarkingChecklist checked={emChecked} toggle={toggleEm} marks={executionMarks} />
      )}

      {/* ── Component 2: Command Dimension (STS Tree) ── */}
      {!finalCommand ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '10px', opacity: 0.3 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" strokeLinecap="round" /></svg>
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Select a command to load the execution tree</span>
        </div>
      ) : finalCommand === 'NO ENGAGEMENT' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 0', gap: '10px', opacity: 0.3 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M4.93 4.93l14.14 14.14" /></svg>
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Observation Mode — No Matrix Parameters Required</span>
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            margin: '4px 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px',
            borderLeft: '3px solid var(--phase-accent)', paddingLeft: '10px',
          }}>
            <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
              Component 2 — Command Dimension
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <Phase7STS command={finalCommand as 'STRIKE' | 'INTERCEPTION' | 'SATURATION'} isLocked={commandLocked} />
        </div>
      )}

      {/* ── Component 3: Command Event ── */}
      {finalCommand && finalCommand !== 'NO ENGAGEMENT' && events.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{
            margin: '4px 0 12px 0', display: 'flex', alignItems: 'center', gap: '10px',
            borderLeft: '3px solid var(--phase-accent)', paddingLeft: '10px',
          }}>
            <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
              Component 3 — Command Event
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {events.map(ev => (
              <CommandEventRow
                key={ev.id}
                event={ev}
                selectedValues={getSelectedEventValues(ev.id)}
                onChange={newVals => handleEventChange(ev.id, newVals)}
                isLocked={commandLocked}
              />
            ))}
          </div>
        </div>
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
