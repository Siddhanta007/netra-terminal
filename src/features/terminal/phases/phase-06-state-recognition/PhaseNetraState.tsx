// NETRA State phase — user-owned state selection + forward-transition graph.
// This phase is deliberately independent from P5 AI text. P5 suggests; this
// phase stores the user's chosen state/command.

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNetra } from '@/context/NetraContext';
import StateGraph, { RecognizedState, TransitionBranch } from '@/components/Templates/StateGraph';
import { appendStateRecognition } from '@/store/slices/analysisSlice';
import { tradeCardsStorageKey } from '@/features/terminal/phases/phase-10-mission-control/missionControl/helpers';
import { API_BASE } from '@/utils/constants';

const MONO = 'JetBrains Mono, Consolas, monospace';

interface StateOption { id: string; name: string; mode: string }

function normalizeCommand(value: unknown) {
  if (!value) return null;
  const normalized = String(value).trim().toUpperCase().replace(/_/g, ' ');
  return normalized || null;
}

function commandColor(command: string | null) {
  switch (command) {
    case 'STRIKE': return '#facc15';
    case 'INTERCEPTION': return '#38bdf8';
    case 'SATURATION': return '#fb923c';
    case 'NO ENGAGEMENT': return '#fb7185';
    default: return '#a78bfa';
  }
}

export default function PhaseNetraState() {
  const dispatch = useDispatch();
  const {
    selectedNetraState, setSelectedNetraState,
    recognitionCheckpoints, setRecognitionCheckpoints,
    setFinalCommand, setCommandLocked,
    setSelectedWeaponId, setInterSelections, setStrikeSelections, setSaturationSelections,
    activeSessionId, editStep, saveSession, showToast,
  } = useNetra();

  const commandNodeIndex = recognitionCheckpoints.findIndex(checkpoint => checkpoint.pathConfirmed);
  const commandNode = commandNodeIndex >= 0 ? recognitionCheckpoints[commandNodeIndex] : null;

  const persistPath = (next: typeof recognitionCheckpoints, failureMessage: string, clearDownstream = false) => {
    void saveSession({ silent: true, recognitionCheckpoints: next, highestStep: 4, ...(clearDownstream ? { clearAfter: 'pinaka_state' as const } : {}) }).then(saved => {
      if (!saved) showToast(failureMessage, 'error');
    });
  };

  const resetCommandPath = (clearState = true) => {
    editStep(4);
    setFinalCommand(null);
    if (clearState) setSelectedNetraState(null);
    setSelectedWeaponId(null);
    setCommandLocked(false);
    setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' });
    setStrikeSelections({
      impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '',
      zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '',
      postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '',
    });
    setSaturationSelections({});
    localStorage.removeItem(tradeCardsStorageKey(activeSessionId));
  };

  const confirmCommandNode = async () => {
    if (!commandNode || !commandNode.pathConfirmed || !recognizedState) return;
    const next = recognitionCheckpoints.map((checkpoint, index) => ({
      ...checkpoint,
      commandSelected: index === commandNodeIndex,
    }));
    setRecognitionCheckpoints(next);
    setCommandLocked(false);
    const saved = await saveSession({
      recognitionCheckpoints: next,
      highestStep: 4,
      selectedNetraState,
    });
    if (saved) showToast('Pinaka State confirmed — continue to Command', 'success');
  };

  const editCommandNode = () => {
    if (!commandNode) return;
    const next = recognitionCheckpoints.map((checkpoint, index) => index === commandNodeIndex
      ? { ...checkpoint, commandSelected: false }
      : checkpoint
    );
    setRecognitionCheckpoints(next);
    resetCommandPath(false);
    showToast('Pinaka State reopened; downstream command and weapon data cleared', 'info');
    persistPath(next, 'Pinaka State edit is local but has not reached MongoDB', true);
  };

  const resetCommandNode = () => {
    if (!commandNode) return;
    const next = recognitionCheckpoints.map((checkpoint, index) => index === commandNodeIndex
      ? { ...checkpoint, commandSelected: false, selectedState: null }
      : checkpoint
    );
    setRecognitionCheckpoints(next);
    resetCommandPath();
    showToast('Pinaka State reset', 'info');
    persistPath(next, 'Pinaka State reset is local but has not reached MongoDB', true);
  };

  const inner = (selectedNetraState || {}) as Record<string, unknown>;
  const recognizedState = inner.recognized_state as RecognizedState | undefined;
  const transitions = (inner.possible_transitions || []) as TransitionBranch[];
  const isOverride = !!inner.state_override;
  const selectedCommand = normalizeCommand(
    inner.cmd ?? recognizedState?.command ?? inner.command
  );
  const accent = commandColor(selectedCommand);
  const isLocked = !!commandNode?.commandSelected;
  const canSelect = !!commandNode?.pathConfirmed && !isLocked;

  // ── state catalog for the override picker ──
  const [catalog, setCatalog] = useState<StateOption[]>([]);
  const [switching, setSwitching] = useState(false);
  useEffect(() => {
    fetch(`${API_BASE}/api/states`)
      .then(r => r.ok ? r.json() : { states: [] })
      .then(d => setCatalog(d.states || []))
      .catch(() => {});
  }, []);

  // ── override: fetch the chosen state's projection, replace the recognised state ──
  const selectState = (id: string) => {
    if (!id || !commandNode?.pathConfirmed || commandNode.commandSelected) return;
    setSwitching(true);
    fetch(`${API_BASE}/api/states/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(proj => {
        if (!proj?.recognized_state) return;
        const rec = proj.recognized_state;
        const selectedState = {
          recognized_state: rec,
          possible_transitions: proj.possible_transitions || [],
          child_states: proj.child_states || [],
          state_id: rec.state_id,
          cmd: rec.command,
          posture: rec.posture,
          state_override: true,
        };
        setSelectedNetraState(selectedState);
        setRecognitionCheckpoints(recognitionCheckpoints.map((checkpoint, index) => index === commandNodeIndex
          ? { ...checkpoint, selectedState }
          : checkpoint
        ));
        setFinalCommand(null);
        setCommandLocked(false);
        if (rec.state_id) dispatch(appendStateRecognition(rec.state_id));
      })
      .finally(() => setSwitching(false));
  };

  return (
    <div style={{
      padding: '4px', minHeight: '360px', display: 'flex', flexDirection: 'column', gap: '18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>P6 · State classification</span>
          <span style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Choose the active NETRA state</span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{
          fontFamily: MONO, fontSize: '7px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: isLocked ? '#86efac' : canSelect ? '#cbd5e1' : '#fbbf24',
          border: `1px solid ${isLocked ? '#22c55e55' : canSelect ? '#94a3b855' : '#f59e0b55'}`,
          background: isLocked ? 'rgba(34,197,94,0.08)' : canSelect ? 'rgba(148,163,184,0.06)' : 'rgba(245,158,11,0.08)',
          padding: '5px 8px',
        }}>{isLocked ? 'State locked' : canSelect ? 'Awaiting selection' : 'Complete P5 first'}</span>
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, color: '#cbd5e1', letterSpacing: '0.16em', textTransform: 'uppercase' }}>State library</span>
          <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.4)' }}>Select the state that best matches the completed decision path.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '5px', maxHeight: '174px', overflowY: 'auto', paddingRight: '3px' }}>
        {catalog.map(state => {
          const selected = recognizedState?.state_id === state.id;
          return (
            <button
              key={state.id}
              type="button"
              onClick={() => selectState(state.id)}
              disabled={switching || !canSelect}
              style={{
                minHeight: '48px', padding: '8px 9px', textAlign: 'left',
                cursor: switching ? 'wait' : canSelect ? 'pointer' : 'not-allowed',
                background: selected ? `${accent}12` : 'transparent',
                border: selected ? `1px solid ${accent}` : '1px solid rgba(148,163,184,0.11)',
                borderLeft: selected ? `2px solid ${accent}` : '1px solid rgba(148,163,184,0.11)',
                outline: 'none', fontFamily: MONO, opacity: canSelect ? 1 : 0.56,
                transition: 'border-color 150ms ease, background 150ms ease, transform 150ms ease',
              }}
            >
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 900, color: selected ? accent : '#e2e8f0', letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{state.id}</span>
              <span style={{ display: 'block', marginTop: '4px', fontSize: '8px', fontWeight: 700, color: selected ? '#f8fafc' : 'rgba(226,232,240,0.58)', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'uppercase' }}>{state.name}</span>
              {state.mode && <span style={{ display: 'block', marginTop: '2px', fontSize: '7px', color: 'rgba(148,163,184,0.62)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{state.mode}</span>}
            </button>
          );
        })}
        {catalog.length === 0 && (
          <div style={{ minWidth: '180px', padding: '12px', fontFamily: MONO, fontSize: '8px', color: 'var(--text-4)' }}>{switching ? 'Loading states…' : 'No states available'}</div>
        )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, color: 'rgba(255,255,255,0.48)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>State map</span>
        <div style={{ flex: 1 }} />
        {recognizedState && <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: accent, letterSpacing: '0.12em' }}>{recognizedState.state_id} · {selectedCommand || 'UNASSIGNED'}</span>}
      </div>

      <div style={{ flex: 1, minHeight: '230px', padding: recognizedState ? '2px 0' : '0' }}>
        {recognizedState ? (
          <StateGraph state={recognizedState} transitions={transitions} />
        ) : (
          <div style={{ height: '100%', minHeight: '230px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '9px', padding: '34px', textAlign: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, color: '#94a3b8', letterSpacing: '0.14em', textTransform: 'uppercase' }}>No state selected</span>
            <span style={{ fontFamily: MONO, maxWidth: '360px', fontSize: '9px', lineHeight: 1.6, color: 'rgba(203,213,225,0.48)' }}>Choose an available state from the library to load its recognition logic and forward transition map.</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
        <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.42)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Phase control</span>
        <div style={{ flex: 1 }} />
        <button onClick={editCommandNode} className="btn-edit w-20" disabled={!commandNode?.commandSelected}>Edit</button>
        <button onClick={resetCommandNode} className="btn-reset w-20" disabled={!!commandNode?.commandSelected || !recognizedState}>Reset</button>
        <button
          onClick={confirmCommandNode}
          className={`${commandNode?.commandSelected ? 'btn-confirmed' : 'btn-confirm'} w-40`}
          disabled={!commandNode?.pathConfirmed || !recognizedState || !!commandNode.commandSelected}
        >
          {commandNode?.commandSelected ? '✓ Confirmed' : 'Confirm State'}
        </button>
      </div>
    </div>
  );
}
