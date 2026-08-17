import { Fragment, ReactNode, useEffect, useRef, useState } from 'react';
import NetraAILabs from '@/components/Templates/NetraAILabs';
import MayaHypothesisPanel from '@/components/Templates/MayaHypothesisPanel';
import { TerminalStatusBadge } from '@/components/UI/TerminalPrimitives';
import { useNetra } from '@/context/NetraContext';
import { getEditableHypothesisText } from '@/utils/hypothesisText';
import { RecognitionCheckpoint, SystemDimension, WaitSelections } from '@/types';
import { tradeCardsStorageKey } from '@/features/terminal/phases/phase-10-mission-control/missionControl/helpers';

const FALLBACK_DIMENSIONS: SystemDimension[] = [
  { id: 'waitingFor', name: 'Waiting For', options: ['Objective Reach', 'Objective Interaction', 'Objective Resolution', 'Structural Event', 'Liquidity Event', 'Compression Resolution', 'Expansion Confirmation', 'Acceptance or Rejection', 'Displacement Confirmation', 'Mitigation or Retest', 'Institutional Commitment'] },
  { id: 'referenceLocation', name: 'Reference Location', options: ['HTF Objective', 'Auction Objective', 'Primary Objective', 'Secondary Objective', 'Range Boundary', 'Current Swing', 'Swing Liquidity', 'Liquidity Cluster', 'HTF Reference Liquidity', 'Compression Boundary', 'Displacement Origin', 'Fair Value Gap / Imbalance', 'Equilibrium Region'] },
  { id: 'requiredResolution', name: 'Required Resolution', options: ['Reach', 'Interaction', 'Sweep', 'Acceptance', 'Rejection', 'Absorption', 'Defence', 'Break and Hold', 'Reclaim', 'Expansion Away', 'Failure to Continue', 'Structural Transfer'] },
  { id: 'developmentStage', name: 'Development Stage', options: ['Distant', 'Approaching', 'Testing', 'Interaction Active', 'Resolution Developing', 'Unresolved'] },
  { id: 'institutionalSignature', name: 'Required Institutional Signature', options: ['Displacement', 'Sustained Acceptance', 'Liquidity Absorption', 'Objective Defence', 'Structural Transfer', 'Participation Expansion', 'Controlled Expansion', 'Repricing Failure', 'Repeated Auction Failure'] },
  { id: 'validityHorizon', name: 'Validity Horizon', options: ['Next Auction Event', 'Current Structural Leg', 'Current Objective Interaction', 'Current Session', 'Until Reference Is Invalidated'] },
];

const FALLBACK_RESOLUTIONS = ['Awaited Condition Confirmed', 'Objective Reached', 'Objective Interaction Confirmed', 'Structural Event Confirmed', 'Liquidity Event Confirmed', 'Institutional Signature Confirmed', 'Acceptance Confirmed', 'Rejection Confirmed', 'Sweep Confirmed', 'Break and Hold Confirmed', 'Reclaim Confirmed', 'Expansion Confirmed', 'Opposing Condition Confirmed', 'Reference Invalidated', 'Evidence Deteriorated', 'Validity Horizon Expired', 'Session Ended'];

const EMPTY_WAIT: WaitSelections = {
  waitingFor: '', referenceLocation: '', requiredResolution: '', developmentStage: '',
  institutionalSignature: '', validityHorizon: '', waitNote: '',
  resolutionStatus: 'OPEN', resolutionEvent: '', resolutionNote: '',
  openedAt: '', resolvedAt: '',
};

function withoutWaitCycle(checkpoints: RecognitionCheckpoint[], checkpointIndex: number) {
  const checkpoint = checkpoints[checkpointIndex];
  if (!checkpoint?.wait) return checkpoints;

  const following = checkpoints[checkpointIndex + 1];
  const removeIds = new Set<string>();
  if (!checkpoint.output) removeIds.add(checkpoint.id);
  if (following?.nodeType === 'AI' && !following.output && !following.wait) removeIds.add(following.id);

  return checkpoints
    .filter(item => !removeIds.has(item.id))
    .map(item => item.id === checkpoint.id
      ? {
          ...item,
          eligibility: '' as const,
          wait: null,
          decisionChoice: undefined,
          pathConfirmed: false,
          commandSelected: false,
        }
      : item.decisionChoice === 'WAIT' && !item.wait
        ? { ...item, decisionChoice: undefined }
        : item
    );
}

export default function RecognitionCheckpointFlow({ section = 'maya', mayaFooter }: { section?: 'maya' | 'wait'; mayaFooter?: ReactNode }) {
  const {
    SYSTEM_DATA, selections, netraOutput, selectedNetraState, notes, setNotes,
    recognitionCheckpoints, setRecognitionCheckpoints,
    waitSelections, setWaitSelections,
    activeSessionId, editStep,
    setFinalCommand, setSelectedNetraState, setSelectedWeaponId, setCommandLocked,
    setInterSelections, setStrikeSelections, setSaturationSelections,
    saveSession, showToast,
    triggerNeuralSynthesis, stopSynthesis, isEvaluating,
  } = useNetra();

  const dimensions = SYSTEM_DATA.waitCheckpoint?.dimensions || FALLBACK_DIMENSIONS;
  const h2Config = SYSTEM_DATA.hypothesisH2;
  const resolutionEvents = SYSTEM_DATA.waitCheckpoint?.resolutionEvents || FALLBACK_RESOLUTIONS;
  const [waitEditing, setWaitEditing] = useState(false);
  const pathPersistenceQueue = useRef<Promise<void>>(Promise.resolve());

  const lastIndex = recognitionCheckpoints.reduce(
    (latest, checkpoint, index) => checkpoint.nodeType !== 'COMMAND' && checkpoint.nodeType !== 'HYPOTHESIS' ? index : latest,
    -1,
  );
  const activeWaitIndex = recognitionCheckpoints.findIndex(checkpoint => checkpoint.wait?.resolutionStatus === 'OPEN');
  const activeWait = activeWaitIndex >= 0 ? recognitionCheckpoints[activeWaitIndex].wait : null;
  const isLocked = recognitionCheckpoints.some(checkpoint => checkpoint.commandSelected);
  const waitHasData = dimensions.some(dimension => !!waitSelections[dimension.id]) || !!waitSelections.waitNote;

  // Older/restored sessions can contain the persisted Maya result without a
  // recognition checkpoint. Materialize it once so WAIT and NS selection use
  // the same proposal source instead of remaining disabled.
  useEffect(() => {
    if (!netraOutput || recognitionCheckpoints.some(checkpoint => checkpoint.output)) return;
    const rawEligibility = String(netraOutput.eligibility_recommendation || '').toUpperCase();
    const eligibility = (['ACTIVE', 'DEVELOPING', 'INSUFFICIENT'].includes(rawEligibility)
      ? rawEligibility
      : '') as RecognitionCheckpoint['eligibility'];
    setRecognitionCheckpoints([
      ...recognitionCheckpoints.filter(checkpoint => checkpoint.nodeType !== 'COMMAND'),
      {
        id: `recognition-restored-${Date.now()}`,
        sequence: recognitionCheckpoints.length + 1,
        createdAt: new Date().toISOString(),
        nodeType: 'AI',
        output: netraOutput,
        evidence: {
          marketPulse: { ...(selections.marketPulse || {}) },
          liquidityContext: { ...(selections.liquidityContext || {}) },
        },
        selectedState: selectedNetraState,
        eligibility,
        wait: null,
        hypothesisText: getEditableHypothesisText(netraOutput),
        pathConfirmed: false,
        commandSelected: false,
      },
    ]);
  }, [netraOutput, recognitionCheckpoints, selections.liquidityContext, selections.marketPulse, selectedNetraState, setRecognitionCheckpoints]);

  const evidenceSnapshot = () => ({
    marketPulse: { ...(selections.marketPulse || {}) },
    liquidityContext: { ...(selections.liquidityContext || {}) },
  });

  const persistPath = (next: RecognitionCheckpoint[], failureMessage: string, clearDownstream = false) => {
    pathPersistenceQueue.current = pathPersistenceQueue.current
      .catch(() => undefined)
      .then(async () => {
        const saved = await saveSession({ silent: true, recognitionCheckpoints: next, highestStep: 4, ...(clearDownstream ? { clearAfter: 'decision_path' as const } : {}) });
        if (!saved) showToast(failureMessage, 'error');
      });
  };

  const resetCommandPath = () => {
    editStep(4);
    setFinalCommand(null);
    setSelectedNetraState(null);
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

  const newAiCheckpoint = (sequence: number): RecognitionCheckpoint => ({
    id: `recognition-${Date.now()}-${sequence}`,
    sequence,
    createdAt: new Date().toISOString(),
    nodeType: 'AI',
    output: null,
    evidence: evidenceSnapshot(),
    selectedState: null,
    eligibility: '',
    wait: null,
    pathConfirmed: false,
    commandSelected: false,
  });

  const addWaitBranch = () => {
    if (activeWait) {
      showToast('Resolve or remove the active WAIT first', 'info');
      return;
    }

    const wait: WaitSelections = {
      ...EMPTY_WAIT,
      resolutionStatus: 'OPEN',
      openedAt: new Date().toISOString(),
    };
    const cleared = recognitionCheckpoints
      .filter(checkpoint => checkpoint.nodeType !== 'COMMAND')
      .map(checkpoint => ({ ...checkpoint, pathConfirmed: false, commandSelected: false, decisionChoice: undefined }));
    // WAIT is a downstream branch. Never turn the Maya proposal/H2 editor
    // checkpoint itself into a WAIT node or the main box disappears from the
    // proposal section when the WAIT-only nodes are rendered below it.
    const withWait: RecognitionCheckpoint[] = [...cleared, {
      id: `wait-anchor-${Date.now()}-${cleared.length + 1}`,
      sequence: cleared.length + 1,
      createdAt: new Date().toISOString(),
      nodeType: 'HYPOTHESIS',
      output: null,
      evidence: evidenceSnapshot(),
      selectedState: null,
      eligibility: 'DEVELOPING',
      decisionChoice: 'WAIT',
      wait,
      pathConfirmed: false,
      commandSelected: false,
    }];

    const next = [...withWait, newAiCheckpoint(withWait.length + 1)];
    setRecognitionCheckpoints(next);
    setWaitSelections(wait);
    setWaitEditing(true);
    resetCommandPath();
    showToast('WAIT cycle opened — define the condition, resolve it, then run Maya validation');
    persistPath(next, 'The WAIT branch is local but has not reached MongoDB', true);
  };

  const chooseCommandPath = () => {
    if (activeWait || isLocked) return;
    const base = recognitionCheckpoints.map(checkpoint => ({ ...checkpoint, decisionChoice: undefined }));
    const targetIndex = base.length - 1;
    const next: RecognitionCheckpoint[] = targetIndex >= 0
      ? base.map((checkpoint, index) => index === targetIndex
        ? { ...checkpoint, decisionChoice: 'COMMAND' as const }
        : checkpoint)
      : [{
          id: `hypothesis-route-${Date.now()}`,
          sequence: 1,
          createdAt: new Date().toISOString(),
          nodeType: 'HYPOTHESIS',
          output: null,
          evidence: evidenceSnapshot(),
          selectedState: null,
          eligibility: '',
          wait: null,
          pathConfirmed: false,
          commandSelected: false,
          decisionChoice: 'COMMAND',
        }];
    setRecognitionCheckpoints(next);
    showToast('Command route selected — choose one predefined hypothesis', 'info');
    persistPath(next, 'The command decision is local but has not reached MongoDB');
  };

  const saveWaitEdits = () => {
    if (!activeWait || activeWaitIndex < 0) return;
    const wait: WaitSelections = {
      ...activeWait,
      ...waitSelections,
      resolutionStatus: 'OPEN',
      resolutionEvent: '',
      resolutionNote: '',
      resolvedAt: '',
    };
    const next = recognitionCheckpoints.map((checkpoint, index) => index === activeWaitIndex
      ? { ...checkpoint, wait }
      : checkpoint
    );
    setRecognitionCheckpoints(next);
    setWaitSelections(wait);
    setWaitEditing(false);
    showToast('WAIT confirmed', 'success');
    persistPath(next, 'WAIT confirmation is local but has not reached MongoDB');
  };

  const resolveWait = () => {
    if (!activeWait || activeWaitIndex < 0 || !waitSelections.resolutionEvent) return;
    const wait: WaitSelections = {
      ...activeWait,
      resolutionStatus: 'RESOLVED',
      resolutionEvent: waitSelections.resolutionEvent,
      resolutionNote: waitSelections.resolutionNote,
      resolvedAt: new Date().toISOString(),
    };
    const next = recognitionCheckpoints.map((checkpoint, index) => index === activeWaitIndex
      ? { ...checkpoint, commandSelected: false, wait }
      : checkpoint
    );
    setRecognitionCheckpoints(next);
    setWaitSelections(EMPTY_WAIT);
    setWaitEditing(false);
    showToast('WAIT resolved — Decision Gate reopened; Maya validation is optional', 'success');
    persistPath(next, 'WAIT resolution is local but has not reached MongoDB');
  };

  const removeWait = (checkpointIndex: number) => {
    const checkpoint = recognitionCheckpoints[checkpointIndex];
    if (!checkpoint?.wait) return;

    const next = withoutWaitCycle(recognitionCheckpoints, checkpointIndex);

    setRecognitionCheckpoints(next);
    if (checkpointIndex === activeWaitIndex) {
      setWaitSelections(EMPTY_WAIT);
      setWaitEditing(false);
    }
    showToast('WAIT cycle removed — Decision Gate reopened', 'info');
    persistPath(next, 'WAIT removal is local but has not reached MongoDB');
  };

  const resetWaitDefinition = () => {
    const next = { ...waitSelections, waitNote: '' };
    dimensions.forEach(dimension => { next[dimension.id] = ''; });
    setWaitSelections(next);
  };

  const validationHypothesis = (checkpoint: RecognitionCheckpoint) => String(
    checkpoint.hypothesisText ?? getEditableHypothesisText(checkpoint.output),
  );

  const updateValidationHypothesis = (checkpointIndex: number, value: string) => {
    setNotes({ ...notes, command: value });
    setRecognitionCheckpoints(recognitionCheckpoints.map((checkpoint, index) => index === checkpointIndex
      ? { ...checkpoint, hypothesisText: value }
      : checkpoint
    ));
  };

  const setValidationConfirmation = async (checkpointIndex: number, confirmed: boolean) => {
    const checkpoint = recognitionCheckpoints[checkpointIndex];
    if (!checkpoint) return;
    const text = validationHypothesis(checkpoint).trim();
    if (confirmed && !text) return;

    const next = recognitionCheckpoints.map((item, index) => index === checkpointIndex
      ? { ...item, hypothesisText: text, hypothesisConfirmed: confirmed }
      : item
    );
    setRecognitionCheckpoints(next);
    if (confirmed) {
      setNotes({ ...notes, command: text });
    } else {
      resetCommandPath();
    }
    const saved = await saveSession({
      silent: true,
      recognitionCheckpoints: next,
      highestStep: 4,
      ...(!confirmed ? { clearAfter: 'pinaka_state' as const, reopenH2: true, selectedNetraState: null } : {}),
    });
    if (!saved) {
      showToast('WAIT validation hypothesis has not reached MongoDB', 'error');
      return;
    }
    showToast(confirmed ? 'WAIT validation hypothesis confirmed — Decision Gate reopened' : 'WAIT validation hypothesis reopened', confirmed ? 'success' : 'info');
  };

  const resetValidationHypothesis = (checkpointIndex: number) => {
    const checkpoint = recognitionCheckpoints[checkpointIndex];
    if (!checkpoint) return;
    const generated = getEditableHypothesisText(checkpoint.output);
    const next = recognitionCheckpoints.map((item, index) => index === checkpointIndex
      ? { ...item, hypothesisText: generated, hypothesisConfirmed: false }
      : item
    );
    setNotes({ ...notes, command: generated });
    setRecognitionCheckpoints(next);
    resetCommandPath();
    persistPath(next, 'WAIT validation reset has not reached MongoDB', true);
  };

  const renderValidationHypothesis = (checkpoint: RecognitionCheckpoint, checkpointIndex: number) => {
    const text = validationHypothesis(checkpoint);
    const confirmed = Boolean(checkpoint.hypothesisConfirmed);
    const mappingStatus = String(checkpoint.output?.mapping_status || '').toUpperCase();
    return (
      <MayaHypothesisPanel
        phaseLabel={h2Config?.phaseLabel}
        title="WAIT Validation Hypothesis"
        fieldLabel={h2Config?.editorFieldLabel || 'Validated H2 Hypothesis'}
        value={text}
        placeholder={h2Config?.hypothesisPlaceholder}
        editing={!confirmed}
        awaiting={false}
        tag={mappingStatus || undefined}
        tagColor={mappingStatus === 'CONFLICT' ? '#fbbf24' : mappingStatus === 'CANDIDATE' ? '#93c5fd' : '#86efac'}
        onChange={value => updateValidationHypothesis(checkpointIndex, value)}
        onEdit={() => void setValidationConfirmation(checkpointIndex, false)}
        onReset={() => resetValidationHypothesis(checkpointIndex)}
        onConfirm={() => void setValidationConfirmation(checkpointIndex, true)}
        editDisabled={!confirmed}
        resetDisabled={!text && !checkpoint.output}
        confirmDisabled={confirmed || !text.trim()}
        editLabel="Edit"
        resetLabel="Reset"
        confirmLabel="Confirm"
      />
    );
  };

  const renderWaitBranch = (checkpoint: RecognitionCheckpoint, checkpointIndex: number, waitNumber: number) => {
    const wait = checkpoint.wait;
    if (!wait) return null;
    const isActive = wait.resolutionStatus === 'OPEN' && checkpointIndex === activeWaitIndex;
    const isResolved = wait.resolutionStatus === 'RESOLVED';
    const isEditing = isActive && waitEditing;
    const resolution = isActive ? waitSelections : wait;
    const resolutionHasData = !!resolution.resolutionEvent || !!resolution.resolutionNote;
    const waitConfig = SYSTEM_DATA.waitCheckpoint;

    return (
      <Fragment key={`${checkpoint.id}-wait-branch`}>
        <section className="terminal-wait-section is-definition">
          <div className="terminal-wait-step-header">
            <div className="terminal-step-marker is-warning">01</div>
            <div className="terminal-wait-step-copy">
              <div className="terminal-wait-step-title is-warning">{waitConfig?.definitionTitle}</div>
              <div className="terminal-wait-step-subtitle">{waitConfig?.definitionSubtitle}</div>
            </div>
            <div style={{ flex: 1 }} />
            <TerminalStatusBadge tone={isResolved ? 'success' : 'warning'}>{isResolved ? 'RESOLVED' : isEditing ? 'DEFINING' : 'OPEN'}</TerminalStatusBadge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: '6px 16px 4px', background: 'rgba(255,255,255,0.018)' }}>
            {dimensions.map(dimension => (
              <div key={dimension.id} className="precision-row flex items-start" style={{ padding: '10px 0', margin: 0 }}>
                <div className="precision-label" style={{ minWidth: '190px', paddingTop: 6 }}>{dimension.name}</div>
                <div className="precision-selector flex-1 flex flex-wrap gap-1.5">
                  {(dimension.options || []).map(option => {
                    const value = isEditing ? waitSelections[dimension.id] : wait[dimension.id];
                    const selected = value === option;
                    return (
                      <button key={option} type="button" className={`precision-opt ${selected ? 'selected' : ''}`} onClick={() => {
                        if (isEditing) setWaitSelections({ ...waitSelections, [dimension.id]: selected ? '' : option });
                      }} aria-disabled={!isEditing} style={{ padding: '6px 9px', fontSize: '8px', cursor: isEditing ? 'pointer' : 'default', opacity: !isEditing && !selected ? 0.34 : 1 }}>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="terminal-action-bar" style={{ marginLeft: 16, marginRight: 16 }}>
            <textarea value={(isEditing ? waitSelections.waitNote : wait.waitNote) || ''} onChange={event => {
              if (isEditing) setWaitSelections({ ...waitSelections, waitNote: event.target.value });
            }} disabled={!isEditing} placeholder={waitConfig?.notePlaceholder} className="terminal-note" />
            <div className="terminal-action-buttons">
              <button onClick={() => { setWaitSelections({ ...wait, resolutionEvent: '', resolutionNote: '' }); setWaitEditing(true); }} className="btn-edit w-28" disabled={!isActive || waitEditing}>{waitConfig?.editLabel}</button>
              <button onClick={resetWaitDefinition} className="btn-reset w-20" disabled={!isEditing || !waitHasData}>Reset</button>
              <button onClick={saveWaitEdits} className={`${isEditing ? 'btn-confirm' : 'btn-confirmed'} w-40`} disabled={!isEditing}>{isEditing ? waitConfig?.saveLabel : '✓ WAIT SAVED'}</button>
            </div>
          </div>
        </section>

        <section className={`terminal-wait-section is-resolution ${isResolved ? 'is-resolved' : ''}`}>
          <div className="terminal-wait-step-header">
            <div className={`terminal-step-marker ${isResolved ? 'is-success' : 'is-info'}`}>02</div>
            <div className="terminal-wait-step-copy">
              <div className={`terminal-wait-step-title ${isResolved ? 'is-success' : 'is-info'}`}>{waitConfig?.resolverTitle}</div>
              <div className="terminal-wait-step-subtitle">{waitConfig?.resolverSubtitle}</div>
            </div>
          </div>
          <div className="precision-row flex items-start" style={{ padding: '10px 0', margin: 0 }}>
            <div className="precision-label" style={{ minWidth: '190px', paddingTop: 6 }}>Resolution Event</div>
            <div className="precision-selector flex-1 flex flex-wrap gap-1.5">
              {resolutionEvents.map(event => {
                const selected = resolution.resolutionEvent === event;
                return (
                  <button key={event} type="button" className={`precision-opt ${selected ? 'selected' : ''}`} onClick={() => {
                    if (isActive && !waitEditing) setWaitSelections({ ...waitSelections, resolutionEvent: selected ? '' : event });
                  }} disabled={!isActive || waitEditing} style={{ padding: '6px 9px', fontSize: '8px' }}>{event}</button>
                );
              })}
            </div>
          </div>
          <div className="terminal-action-bar">
            <textarea value={resolution.resolutionNote || ''} onChange={event => {
              if (isActive && !waitEditing) setWaitSelections({ ...waitSelections, resolutionNote: event.target.value });
            }} disabled={!isActive || waitEditing} placeholder={waitConfig?.resolutionNotePlaceholder} className="terminal-note" />
            <div className="terminal-action-buttons">
              <button onClick={() => setWaitSelections({ ...waitSelections, resolutionEvent: '', resolutionNote: '' })} className="btn-reset w-20" disabled={!isActive || waitEditing || !resolutionHasData}>Reset</button>
              <button onClick={resolveWait} disabled={!isActive || waitEditing || !waitSelections.resolutionEvent} className={`${isResolved ? 'btn-confirmed' : 'btn-confirm'} w-40`}>{isResolved ? '✓ RESOLVED' : waitConfig?.resolveLabel}</button>
            </div>
          </div>
        </section>
      </Fragment>
    );
  };

  const renderAiNode = (checkpoint: RecognitionCheckpoint, checkpointIndex: number, aiNumber: number, validation = false, bottomPanel?: ReactNode) => {
    const isAiNode = checkpoint.nodeType === 'AI' || !!checkpoint.output || (!checkpoint.wait && checkpoint.nodeType !== 'COMMAND');
    if (!isAiNode) return null;
    const isPending = !checkpoint.output && !checkpoint.wait;
    const canRun = isPending && checkpointIndex === lastIndex && !activeWait;
    return (
      <div key={`${checkpoint.id}-ai`} className={validation ? 'terminal-wait-validation' : undefined}>
        {validation && (
          <div className="terminal-wait-step-header">
            <div className="terminal-step-marker is-maya">03</div>
            <div className="terminal-wait-step-copy">
              <div className="terminal-wait-step-title is-maya">{SYSTEM_DATA.waitCheckpoint?.validationTitle}</div>
              <div className="terminal-wait-step-subtitle">{SYSTEM_DATA.waitCheckpoint?.validationSubtitle}</div>
            </div>
          </div>
        )}
        <NetraAILabs phaseId={`recognition-${checkpoint.sequence}`} phaseNum={5} title={validation ? `${SYSTEM_DATA.waitCheckpoint?.validationTitle || 'Maya Validation'} ${aiNumber}` : `${h2Config?.aiBoxTitle || ''} ${aiNumber}`} subheading={validation ? (SYSTEM_DATA.waitCheckpoint?.validationSubtitle || '') : `${h2Config?.aiBoxSubtitle || ''} ${aiNumber}`} showUpload={false} isEvaluating={isEvaluating && canRun} output={checkpoint.output} onAnalyse={triggerNeuralSynthesis} onStop={stopSynthesis} analyseDisabled={!canRun} analyseDisabledReason={activeWait ? 'Resolve the active WAIT first.' : checkpoint.output ? 'Choose the next node below.' : 'Only the latest AI box can run.'} bottomPanel={bottomPanel} />
      </div>
    );
  };

  const visibleCheckpoints = recognitionCheckpoints.filter(checkpoint =>
    checkpoint.nodeType !== 'COMMAND' && (checkpoint.nodeType !== 'HYPOTHESIS' || !!checkpoint.wait)
  );
  let waitNumber = 0;

  if (section === 'maya') {
    // The Maya proposal is a stable parent of every WAIT cycle. A manually
    // authored H2 can exist without a persisted AI checkpoint, so use the
    // original proposal when available and otherwise keep the empty Maya box
    // mounted while WAIT is active.
    const initialCheckpoint = recognitionCheckpoints.find(checkpoint =>
      checkpoint.nodeType !== 'COMMAND' && !!checkpoint.output
    ) || {
      id: 'initial-suggestion', sequence: 1, createdAt: '', nodeType: 'AI' as const, output: null,
      evidence: evidenceSnapshot(), selectedState: null, eligibility: '' as const, wait: null,
      commandSelected: false,
    };
    const initialIndex = recognitionCheckpoints.findIndex(item => item.id === initialCheckpoint.id);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {renderAiNode(initialCheckpoint, initialIndex, 1, false, mayaFooter)}
      </div>
    );
  }

  waitNumber = 0;
  const waitNodes = visibleCheckpoints.filter(checkpoint => checkpoint.wait);
  const waitConfig = SYSTEM_DATA.waitCheckpoint;
  const latestCheckpoint = recognitionCheckpoints[recognitionCheckpoints.length - 1];
  const latestWaitIndex = recognitionCheckpoints.reduce(
    (latest, checkpoint, index) => checkpoint.wait ? index : latest,
    -1,
  );
  const latestValidation = latestWaitIndex >= 0 ? recognitionCheckpoints[latestWaitIndex + 1] : null;
  const validationReviewPending = Boolean(
    (latestValidation?.output || latestValidation?.hypothesisText?.trim())
      && !latestValidation.hypothesisConfirmed,
  );
  const decisionBlocked = Boolean(activeWait || validationReviewPending);
  const commandRouteChosen = latestCheckpoint?.decisionChoice === 'COMMAND' || isLocked;
  const mappingConflict = String(netraOutput?.mapping_status || '').toUpperCase() === 'CONFLICT';

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {waitNodes.map(checkpoint => {
        waitNumber += 1;
        const actualIndex = recognitionCheckpoints.findIndex(item => item.id === checkpoint.id);
        const validationCheckpoint = recognitionCheckpoints[actualIndex + 1];
        const waitState = checkpoint.wait?.resolutionStatus === 'RESOLVED' ? 'RESOLVED' : waitEditing && actualIndex === activeWaitIndex ? 'DEFINING' : 'OPEN';
        return (
          <section key={`wait-cycle-${checkpoint.id}`} className="terminal-wait-cycle">
            <header className="terminal-wait-cycle-header">
              <span className="terminal-wait-cycle-title">{`WAIT Cycle ${String(waitNumber).padStart(2, '0')}`}</span>
              <span className="terminal-wait-cycle-path">CONDITION → RESOLUTION → MAYA</span>
              <div style={{ flex: 1 }} />
              <TerminalStatusBadge tone={waitState === 'RESOLVED' ? 'success' : 'warning'}>{waitState}</TerminalStatusBadge>
              <button type="button" onClick={() => removeWait(actualIndex)} className="btn-reset" aria-label="Remove WAIT cycle" title="Remove WAIT cycle" style={{ width: 28, minWidth: 28, height: 28, padding: 0, fontSize: 15 }}>×</button>
            </header>
            {renderWaitBranch(checkpoint, actualIndex, waitNumber)}
            {validationCheckpoint && (validationCheckpoint.output || !validationCheckpoint.wait) && renderAiNode(
              validationCheckpoint,
              actualIndex + 1,
              waitNumber,
              true,
              renderValidationHypothesis(validationCheckpoint, actualIndex + 1),
            )}
          </section>
        );
      })}

      {!isLocked && (
        <section className="terminal-decision-gate">
          <div className="terminal-decision-copy">
            <div className="terminal-decision-heading">
              <span className="terminal-decision-title">{waitConfig?.decisionTitle}</span>
              {mappingConflict && <TerminalStatusBadge tone="warning">CONFLICT · WAIT RECOMMENDED</TerminalStatusBadge>}
              {activeWait && <TerminalStatusBadge tone="warning">RESOLVE ACTIVE WAIT</TerminalStatusBadge>}
              {!activeWait && validationReviewPending && <TerminalStatusBadge tone="info">CONFIRM VALIDATION</TerminalStatusBadge>}
            </div>
            <span className="terminal-decision-description">{waitConfig?.decisionSubtitle}</span>
          </div>
          <button onClick={chooseCommandPath} disabled={commandRouteChosen || decisionBlocked} className="terminal-choice-card is-info">
            <span className="terminal-choice-title">{commandRouteChosen ? `✓ ${waitConfig?.commandSelectedLabel}` : waitConfig?.commandActionLabel}</span>
            <span className="terminal-choice-description">{waitConfig?.commandActionDescription}</span>
          </button>
          <button onClick={addWaitBranch} disabled={decisionBlocked} className="terminal-choice-card is-warning">
            <span className="terminal-choice-title">{waitConfig?.actionLabel}</span>
            <span className="terminal-choice-description">{waitConfig?.actionDescription}</span>
          </button>
        </section>
      )}
    </div>
  );
}
