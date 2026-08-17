import { useState, useEffect } from 'react';
import { useNetra } from '@/context/NetraContext';
import { useReduceFlag } from '@/hooks/useReduceFlag';
import { StrikeSelections, InterSelections } from '@/types';
import { API_BASE } from '@/utils/constants';
import { TerminalComponentHeader, TerminalEmptyState } from '@/components/UI/TerminalPrimitives';

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
      <TerminalComponentHeader
        title="Component 1 — Command Marking"
        count={`${done}/${total}`}
        meta="5M"
        collapsible
        open={open}
        onToggle={() => setOpen(value => !value)}
      />

      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          border: '1px solid var(--border-strong)',
          overflow: 'hidden', marginBottom: '12px',
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
                  width: '11px', height: '11px', flexShrink: 0,
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
  outputs?: string[];
  options?: string[];
  opts?: string[];
}

function getOptions(item: CommandEventOption) {
  return item.outputs || item.options || item.opts || [];
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
    <div className="precision-row flex items-center" style={{ paddingBottom: '8px', marginBottom: '8px' }}>
      <div className="precision-label" style={{ minWidth: '140px' }}>{event.name}</div>
      <div className="precision-selector flex-1 flex flex-wrap gap-1.5">
        {getOptions(event).map(opt => {
          const isSelected = selectedValues.includes(opt);
          return (
            <button
              key={opt}
              type="button"
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

function CommandMarkingInfo({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const done = items.filter((_, i) => checked[String(i)]).length;

  return (
    <div style={{ marginBottom: '16px' }}>
      <TerminalComponentHeader title="Component 1 — Command Marking" count={`${done}/${items.length}`} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', border: '1px solid var(--border-strong)', overflow: 'hidden' }}>
        {items.map((item, index) => {
          const id = String(index);
          const isDone = !!checked[id];
          return (
            <button
              key={item}
              onClick={() => setChecked(current => ({ ...current, [id]: !current[id] }))}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                padding: '9px 12px', cursor: 'pointer', background: isDone ? 'var(--phase-accent-bg)' : 'transparent',
                border: 'none', borderBottom: index === items.length - 1 ? 'none' : '1px solid var(--border)',
                fontFamily: 'inherit',
              }}
            >
              <span style={{
                width: '11px', height: '11px', flexShrink: 0,
                border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
                background: isDone ? 'var(--phase-accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {isDone && <span style={{ fontSize: '7px', color: 'white', fontWeight: 900, lineHeight: 1 }}>✓</span>}
              </span>
              <span style={{ fontSize: '9px', fontWeight: 600, color: isDone ? 'var(--text-3)' : 'var(--text-1)', lineHeight: 1.45 }}>{item}</span>
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
    selectedNetraState, finalCommand,
    commandLocked, setCommandLocked,
    strikeSelections, setStrikeSelections,
    interSelections, setInterSelections,
    saturationSelections, setSaturationSelections,
    confirmStep, editStep,
    stepTimestamps, highestStep, saveSession, showToast,
  } = useNetra();

  const executionMarks = SYSTEM_DATA.executionMarks || [];
  const [emChecked, setEmChecked] = useState<Record<string, boolean>>({});
  const toggleEm = (id: string) => setEmChecked(c => ({ ...c, [id]: !c[id] }));
  const [stateDefinition, setStateDefinition] = useState<any | null>(null);
  const isCommandPhaseLocked = commandLocked && highestStep > 4;

  // The confirmed Market Pulse Hypothesis supplies both the command and its
  // state-specific dimension schema. This box only configures that command.
  const stateSelection = (selectedNetraState || {}) as Record<string, unknown>;
  const recognizedState = stateSelection.recognized_state as any | undefined;
  const stateId = (recognizedState?.state_id ?? stateSelection.state_id) as string | undefined;

  // Derive active command state's events
  const activeState = stateDefinition || recognizedState;
  const dimensions = (activeState?.dimensions || []) as CommandEventOption[];
  const events = (activeState?.events || []) as CommandEventOption[];
  const markingItems = (
    (activeState?.recognition_logic as string[] | undefined)
    || (activeState?.doctrine_purpose as string[] | undefined)
    || dimensions.map(dim => dim.name)
    || []
  );

  useEffect(() => {
    if (!stateId || ((recognizedState?.dimensions || []).length && (recognizedState?.events || []).length)) {
      setStateDefinition(null);
      return;
    }

    let cancelled = false;
    fetch(`${API_BASE}/api/states/${encodeURIComponent(stateId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!cancelled) setStateDefinition(data?.recognized_state || null);
      })
      .catch(() => {
        if (!cancelled) setStateDefinition(null);
      });

    return () => { cancelled = true; };
  }, [stateId, recognizedState?.dimensions, recognizedState?.events]);

  const handleStateFieldChange = (eventId: string, newVals: string[]) => {
    if (isCommandPhaseLocked) return;
    const valString = newVals.join(', ');
    if (finalCommand === 'STRIKE') {
      setStrikeSelections({ ...strikeSelections, [eventId]: valString } as StrikeSelections);
    } else if (finalCommand === 'INTERCEPTION') {
      setInterSelections({ ...interSelections, [eventId]: valString } as InterSelections);
    } else if (finalCommand === 'SATURATION') {
      setSaturationSelections({ ...saturationSelections, [eventId]: valString });
    }
  };

  const getSelectedStateFieldValues = (eventId: string): string[] => {
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

  const resetCommandPhase = () => {
    setCommandLocked(false);
    editStep(4);
    setEmChecked({});
    setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' });
    setStrikeSelections({
      impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '',
      zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '',
      postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '',
    });
    setSaturationSelections({});
  };

  const editCommandPhase = () => {
    if (!isCommandPhaseLocked) return;
    setCommandLocked(false);
    editStep(4);
    void saveSession({ silent: true, highestStep: 4, clearAfter: 'command' }).then(saved => {
      if (!saved) showToast('Command edit is local but downstream Mongo data was not cleared', 'error');
    });
  };

  const confirmCommandPhase = async () => {
    if (isCommandPhaseLocked || !finalCommand) return;
    const saved = await saveSession({
      silent: true,
      highestStep: 5,
      stepTimestamps: {
        ...stepTimestamps,
        command: new Date().toLocaleTimeString('en-IN'),
      },
    });
    if (!saved) {
      showToast('Command was not confirmed because MongoDB save failed', 'error');
      return;
    }
    setCommandLocked(true);
    confirmStep(4);
    showToast('Command configuration confirmed and saved', 'success');
  };

  return (
    <div className="flex flex-col fade-up phase-theme-2">

      {/* ── Component 1: Command Marking ── */}
      {finalCommand && (
        markingItems.length > 0
          ? <CommandMarkingInfo items={markingItems} />
          : <CommandMarkingChecklist checked={emChecked} toggle={toggleEm} marks={executionMarks} />
      )}

      {/* ── Component 2: Command Dimensions ── */}
      {!finalCommand ? (
        <TerminalEmptyState title="Command tree unavailable" description="Confirm the Market Pulse Hypothesis to load the execution tree." />
      ) : (
        <div style={{ marginBottom: '16px' }}>
          <TerminalComponentHeader
            title="Component 2 — Command Dimensions"
          />
          {dimensions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {dimensions.map(dim => (
                <CommandEventRow
                  key={dim.id}
                  event={dim}
                  selectedValues={getSelectedStateFieldValues(dim.id)}
                  onChange={newVals => handleStateFieldChange(dim.id, newVals)}
                  isLocked={isCommandPhaseLocked}
                />
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px 0', color: 'var(--text-4)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', textAlign: 'center' }}>
              No dimensions defined for this state
            </div>
          )}
        </div>
      )}

      {/* ── Component 3: Command Event ── */}
      {finalCommand && events.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <TerminalComponentHeader
            title="Component 3 — Command Events"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {events.map(ev => (
              <CommandEventRow
                key={ev.id}
                event={ev}
                selectedValues={getSelectedStateFieldValues(ev.id)}
                onChange={newVals => handleStateFieldChange(ev.id, newVals)}
                isLocked={isCommandPhaseLocked}
              />
            ))}
          </div>
        </div>
      )}

      <div className="terminal-action-bar">
        <div className="terminal-action-buttons">
          <button onClick={editCommandPhase} className="btn-edit w-20" disabled={!isCommandPhaseLocked}>Edit</button>
          <button onClick={resetCommandPhase} className="btn-reset w-20" disabled={isCommandPhaseLocked || !finalCommand}>Reset</button>
          <button
            onClick={confirmCommandPhase}
            className={`${isCommandPhaseLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={isCommandPhaseLocked || !finalCommand}
          >
            {isCommandPhaseLocked ? '✓ Confirmed' : 'Confirm Command'}
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
