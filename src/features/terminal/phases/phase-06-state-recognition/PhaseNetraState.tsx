// User-owned NS hypothesis selection + forward-transition graph, embedded in
// the Market Pulse Hypothesis workflow after Maya/WAIT resolution.

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNetra } from '@/context/NetraContext';
import StateGraph, { RecognizedState, TransitionBranch } from '@/components/Templates/StateGraph';
import { appendStateRecognition } from '@/store/slices/analysisSlice';
import { tradeCardsStorageKey } from '@/features/terminal/phases/phase-10-mission-control/missionControl/helpers';
import { API_BASE } from '@/utils/constants';
import { useNetraUtils } from '@/hooks/useNetraUtils';
import { TerminalEmptyState, TerminalStatusBadge } from '@/components/UI/TerminalPrimitives';
import { ActionSpinner } from '@/components/UI/LoadingSpinners';
import { waitForNextPaint } from '@/utils/waitForNextPaint';

interface StateOption { id: string; name: string; mode: string; command?: string }

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

export default function PhaseNetraState({ embedded = false }: { embedded?: boolean }) {
  const dispatch = useDispatch();
  const { getAuthHeaders } = useNetraUtils();
  const {
    SYSTEM_DATA, selectedNetraState, setSelectedNetraState,
    notes, setNotes,
    recognitionCheckpoints, setRecognitionCheckpoints,
    setFinalCommand, setCommandLocked,
    setSelectedWeaponId, setInterSelections, setStrikeSelections, setSaturationSelections,
    activeSessionId, editStep, saveSession, showToast,
  } = useNetra();

  const candidateIndex = recognitionCheckpoints.reduce(
    (latest, checkpoint, index) => checkpoint.output || checkpoint.selectedState || checkpoint.decisionChoice === 'COMMAND' ? index : latest,
    -1,
  );
  const candidateCheckpoint = candidateIndex >= 0 ? recognitionCheckpoints[candidateIndex] : null;
  const hasOpenWait = recognitionCheckpoints.some(checkpoint => checkpoint.wait?.resolutionStatus === 'OPEN');
  const h2Config = SYSTEM_DATA.hypothesisH2;
  const phaseConfig = SYSTEM_DATA.terminalPhases?.marketPulseSelection;

  const persistPath = (next: typeof recognitionCheckpoints, failureMessage: string, clearDownstream = false) => {
    void saveSession({
      silent: true,
      recognitionCheckpoints: next,
      highestStep: 4,
      ...(clearDownstream ? { clearAfter: 'pinaka_state' as const, reopenH2: true, selectedNetraState: null } : {}),
    }).then(saved => {
      if (!saved) showToast(failureMessage, 'error');
    });
  };

  const resetCommandPath = (clearState = true) => {
    editStep(4);
    if (clearState) {
      setSelectedNetraState(null);
      setFinalCommand(null);
    }
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
    if (!candidateCheckpoint || !recognizedState || hasOpenWait) return;
    if (!activeSessionId || !notes.command?.trim() || !selectedCommand) return;
    try {
      const response = await fetch(`${API_BASE}/api/hypotheses/h2/${encodeURIComponent(activeSessionId)}/confirm`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          state_id: recognizedState.state_id,
          command: selectedCommand,
          hypothesis: notes.command.trim(),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.status !== 'ok') throw new Error(body?.detail || `HTTP ${response.status}`);
      const next = recognitionCheckpoints.map((checkpoint, index) => ({
        ...checkpoint,
        pathConfirmed: index === candidateIndex,
        commandSelected: index === candidateIndex,
        selectedState: index === candidateIndex ? selectedNetraState : checkpoint.selectedState,
      }));
      setRecognitionCheckpoints(next);
      setCommandLocked(false);
      const saved = await saveSession({ recognitionCheckpoints: next, highestStep: 4, selectedNetraState });
      if (saved) showToast('Market Pulse Hypothesis confirmed — continue to Command', 'success');
    } catch (error) {
      showToast(`Hypothesis confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const resetCommandNode = () => {
    if (!candidateCheckpoint) return;
    const next = recognitionCheckpoints.map((checkpoint, index) => index === candidateIndex
      ? { ...checkpoint, pathConfirmed: false, commandSelected: false, selectedState: null }
      : checkpoint
    );
    setRecognitionCheckpoints(next);
    resetCommandPath();
    showToast('Market Pulse Hypothesis selection reset', 'info');
    persistPath(next, 'Hypothesis reset is local but has not reached MongoDB', true);
  };

  const inner = (selectedNetraState || {}) as Record<string, unknown>;
  const recognizedState = inner.recognized_state as RecognizedState | undefined;
  const transitions = (inner.possible_transitions || []) as TransitionBranch[];
  const selectedCommand = normalizeCommand(
    inner.cmd ?? recognizedState?.command ?? inner.command
  );
  const accent = commandColor(selectedCommand);
  const recommendedStateId = String((candidateCheckpoint?.output as Record<string, unknown> | null)?.state_id || '');
  const isLocked = !!candidateCheckpoint?.commandSelected;
  const canSelect = !hasOpenWait && !isLocked;

  // ── state catalog for the override picker ──
  const [catalog, setCatalog] = useState<StateOption[]>([]);
  const [switching, setSwitching] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(true);
  useEffect(() => {
    setCatalogLoading(true);
    fetch(`${API_BASE}/api/states`)
      .then(r => r.ok ? r.json() : { states: [] })
      .then(d => setCatalog(d.states || []))
      .catch(() => {})
      .finally(() => setCatalogLoading(false));
  }, []);

  // ── override: fetch the chosen state's projection, replace the recognised state ──
  const selectState = async (id: string) => {
    if (!id || hasOpenWait || candidateCheckpoint?.commandSelected) return;
    setSwitching(true);
    await waitForNextPaint();
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
        setFinalCommand(normalizeCommand(rec.command));
        if (!notes.command?.trim()) setNotes({ ...notes, command: String(rec.definition || '') });
        if (candidateIndex >= 0) {
          setRecognitionCheckpoints(recognitionCheckpoints.map((checkpoint, index) => index === candidateIndex
            ? { ...checkpoint, selectedState }
            : checkpoint
          ));
        } else {
          setRecognitionCheckpoints([{
            id: `hypothesis-manual-${Date.now()}`,
            sequence: recognitionCheckpoints.length + 1,
            createdAt: new Date().toISOString(),
            nodeType: 'HYPOTHESIS',
            output: null,
            evidence: { marketPulse: {}, liquidityContext: {} },
            selectedState,
            eligibility: 'ACTIVE',
            wait: null,
            pathConfirmed: false,
            commandSelected: false,
          }]);
        }
        setCommandLocked(false);
        if (rec.state_id) dispatch(appendStateRecognition(rec.state_id));
      })
      .finally(() => setSwitching(false));
  };

  return (
    <section className={`market-hypothesis-selector ${embedded ? 'is-embedded' : ''}`}>
      <header className="market-hypothesis-selector-header">
        <div className="market-hypothesis-selector-heading">
          <span className="market-hypothesis-phase">{phaseConfig?.counter || h2Config?.phaseLabel}</span>
          {phaseConfig?.timeframe && <span className="market-hypothesis-timeframe">{phaseConfig.timeframe}</span>}
          <div>
            <h2>{phaseConfig?.title || h2Config?.selectionTitle}</h2>
            <p>{phaseConfig?.subtitle || h2Config?.selectionSubtitle}</p>
          </div>
        </div>
        <TerminalStatusBadge tone={isLocked ? 'success' : canSelect ? 'neutral' : 'warning'}>
          {isLocked ? h2Config?.lockedSelectionLabel : canSelect ? h2Config?.awaitingSelectionLabel : h2Config?.selectionSubtitle}
        </TerminalStatusBadge>
      </header>

      <div className="market-hypothesis-library">
        <div className="market-hypothesis-section-heading">
          <span>{h2Config?.catalogLabel}</span>
          <div />
          {switching
            ? <ActionSpinner compact label="Loading state" />
            : <small>{String(catalog.length).padStart(2, '0')} OPTIONS</small>}
        </div>
        <div className="market-hypothesis-options">
        {catalog.map(state => {
          const selected = recognizedState?.state_id === state.id;
          const optionCommand = normalizeCommand(state.command);
          const optionAccent = commandColor(optionCommand);
          return (
            <button
              key={state.id}
              type="button"
              onClick={() => selectState(state.id)}
              disabled={switching || !canSelect}
              className={`market-hypothesis-option ${selected ? 'is-selected' : ''} ${recommendedStateId === state.id ? 'is-recommended' : ''}`}
              style={{ '--option-accent': optionAccent } as React.CSSProperties}
            >
              <span className="market-hypothesis-option-marker" aria-hidden="true" />
              <span className="market-hypothesis-option-copy">
                <span className="market-hypothesis-option-identity">
                  <strong>{state.id}</strong>
                  {recommendedStateId === state.id && <em>Maya proposal</em>}
                </span>
                <span className="market-hypothesis-option-name">{state.name}</span>
                <span className="market-hypothesis-option-meta">
                  {state.mode && <span>{state.mode}</span>}
                  {optionCommand && <span style={{ color: optionAccent }}>{optionCommand}</span>}
                </span>
              </span>
            </button>
          );
        })}
        {catalog.length === 0 && (
          catalogLoading
            ? <div className="netra-ai-spinner-shell" style={{ minHeight: 110 }}><ActionSpinner compact label="Loading states" /></div>
            : <TerminalEmptyState title="No states available" />
        )}
        </div>
      </div>

      <div className="market-hypothesis-map-heading">
        <span>{h2Config?.mapLabel}</span>
        <div />
        {recognizedState && <strong style={{ color: accent }}>{recognizedState.state_id} · {selectedCommand || 'UNASSIGNED'}</strong>}
      </div>

      <div className={`market-hypothesis-map ${recognizedState ? 'has-selection' : ''}`}>
        {recognizedState ? (
          <StateGraph state={recognizedState} transitions={transitions} label={h2Config?.mapLabel} />
        ) : (
          <TerminalEmptyState title={h2Config?.awaitingSelectionLabel} description={h2Config?.selectionSubtitle} />
        )}
      </div>

      <div className="terminal-action-bar">
        <div className="terminal-action-buttons">
        <button onClick={resetCommandNode} className="btn-reset w-20" disabled={!recognizedState}>Reset</button>
        <button
          onClick={confirmCommandNode}
          className={`${candidateCheckpoint?.commandSelected ? 'btn-confirmed' : 'btn-confirm'} w-40`}
          disabled={!candidateCheckpoint || !recognizedState || hasOpenWait || !notes.command?.trim() || !!candidateCheckpoint.commandSelected}
        >
          {candidateCheckpoint?.commandSelected ? `✓ ${h2Config?.selectionConfirmedLabel}` : h2Config?.selectionConfirmLabel}
        </button>
        </div>
      </div>
    </section>
  );
}
