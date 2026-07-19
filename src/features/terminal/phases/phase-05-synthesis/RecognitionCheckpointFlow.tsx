import { Fragment, useState } from 'react';
import NetraAILabs from '@/components/Templates/NetraAILabs';
import { useNetra } from '@/context/NetraContext';
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

export default function RecognitionCheckpointFlow() {
  const {
    SYSTEM_DATA, selections,
    recognitionCheckpoints, setRecognitionCheckpoints,
    waitSelections, setWaitSelections,
    activeSessionId, editStep,
    setFinalCommand, setNetraOutput, setSelectedNetraState, setSelectedWeaponId, setCommandLocked,
    setInterSelections, setStrikeSelections, setSaturationSelections,
    saveSession, showToast,
    triggerNeuralSynthesis, stopSynthesis, isEvaluating,
  } = useNetra();

  const dimensions = SYSTEM_DATA.waitCheckpoint?.dimensions || FALLBACK_DIMENSIONS;
  const resolutionEvents = SYSTEM_DATA.waitCheckpoint?.resolutionEvents || FALLBACK_RESOLUTIONS;
  const [waitEditing, setWaitEditing] = useState(false);

  const lastIndex = recognitionCheckpoints.length - 1;
  const activeWaitIndex = recognitionCheckpoints.findIndex(checkpoint => checkpoint.wait?.resolutionStatus === 'OPEN');
  const activeWait = activeWaitIndex >= 0 ? recognitionCheckpoints[activeWaitIndex].wait : null;
  const commandNodeIndex = recognitionCheckpoints.findIndex(checkpoint => checkpoint.nodeType === 'COMMAND');
  const commandNode = commandNodeIndex >= 0 ? recognitionCheckpoints[commandNodeIndex] : null;
  const isLocked = !!commandNode?.pathConfirmed;
  const waitHasData = dimensions.some(dimension => !!waitSelections[dimension.id]) || !!waitSelections.waitNote;

  const evidenceSnapshot = () => ({
    preSessionContext: { ...(selections.preSessionContext || {}) },
    htfStructure: { ...(selections.htfStructure || {}) },
    marketPulse: { ...(selections.marketPulse || {}) },
    liquidityContext: { ...(selections.liquidityContext || {}) },
  });

  const persistPath = (next: RecognitionCheckpoint[], failureMessage: string, clearDownstream = false) => {
    void saveSession({ silent: true, recognitionCheckpoints: next, highestStep: 4, ...(clearDownstream ? { clearAfter: 'decision_path' as const } : {}) }).then(saved => {
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
      .map(checkpoint => ({ ...checkpoint, pathConfirmed: false, commandSelected: false }));
    const clearedLastIndex = cleared.length - 1;
    const clearedLast = clearedLastIndex >= 0 ? cleared[clearedLastIndex] : null;
    let withWait: RecognitionCheckpoint[];

    if (clearedLast && !clearedLast.wait) {
      withWait = cleared.map((checkpoint, index) => index === clearedLastIndex
        ? { ...checkpoint, eligibility: 'DEVELOPING' as const, pathConfirmed: false, commandSelected: false, wait }
        : checkpoint
      );
    } else {
      const waitSequence = cleared.length + 1;
      const precedingAi = newAiCheckpoint(waitSequence);
      withWait = [...cleared, {
        ...precedingAi,
        eligibility: 'DEVELOPING',
        wait,
      }];
    }

    const next = [...withWait, newAiCheckpoint(withWait.length + 1)];
    setRecognitionCheckpoints(next);
    setWaitSelections(wait);
    setWaitEditing(true);
    resetCommandPath();
    showToast('WAIT, Resolver and next AI node added');
    persistPath(next, 'The WAIT branch is local but has not reached MongoDB', true);
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

  const confirmDecisionPath = async () => {
    if (activeWait) return;
    const checkpoints = recognitionCheckpoints.length > 0
      ? recognitionCheckpoints
      : [newAiCheckpoint(1)];
    const base = checkpoints.map(checkpoint => ({
      ...checkpoint,
      pathConfirmed: false,
      commandSelected: false,
    }));
    const next: RecognitionCheckpoint[] = commandNodeIndex >= 0
      ? base.map((checkpoint, index) => index === commandNodeIndex
        ? { ...checkpoint, pathConfirmed: true }
        : checkpoint
      )
      : [...base, {
          id: `command-${Date.now()}-${base.length + 1}`,
          sequence: base.length + 1,
          createdAt: new Date().toISOString(),
          nodeType: 'COMMAND',
          output: null,
          evidence: evidenceSnapshot(),
          selectedState: null,
          eligibility: '',
          wait: null,
          pathConfirmed: true,
          commandSelected: false,
        }];
    setRecognitionCheckpoints(next);
    setWaitEditing(false);
    const saved = await saveSession({ recognitionCheckpoints: next, highestStep: 4 });
    if (saved) showToast('Decision confirmed — continue to Pinaka State', 'success');
  };

  const editDecisionPath = () => {
    if (!commandNode || commandNodeIndex < 0 || !isLocked) return;
    const next = recognitionCheckpoints.map((checkpoint, index) => index === commandNodeIndex
      ? { ...checkpoint, pathConfirmed: false, commandSelected: false, selectedState: null }
      : checkpoint
    );
    setRecognitionCheckpoints(next);
    resetCommandPath();
    showToast('Decision path reopened', 'info');
    persistPath(next, 'Decision-path edit is local but has not reached MongoDB', true);
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
    showToast('WAIT resolved — the next AI box is available', 'success');
    persistPath(next, 'WAIT resolution is local but has not reached MongoDB');
  };

  const removeWait = (checkpointIndex: number, clearDownstream = false) => {
    const checkpoint = recognitionCheckpoints[checkpointIndex];
    if (!checkpoint?.wait) return;

    let next = checkpoint.output
      ? recognitionCheckpoints.map((item, index) => index === checkpointIndex
        ? { ...item, eligibility: '' as const, commandSelected: false, wait: null }
        : item
      )
      : recognitionCheckpoints.filter((_, index) => index !== checkpointIndex);

    const following = recognitionCheckpoints[checkpointIndex + 1];
    if (following?.nodeType === 'AI' && !following.output && !following.wait) {
      next = next.filter(item => item.id !== following.id);
    }

    setRecognitionCheckpoints(next);
    if (checkpointIndex === activeWaitIndex) {
      setWaitSelections(EMPTY_WAIT);
      setWaitEditing(false);
    }
    if (clearDownstream) resetCommandPath();
    showToast('WAIT branch removed', 'info');
    persistPath(next, 'WAIT removal is local but has not reached MongoDB', clearDownstream);
  };

  const resetDecisionPath = () => {
    if (isLocked || recognitionCheckpoints.length === 0) return;
    const next: RecognitionCheckpoint[] = [];
    setRecognitionCheckpoints(next);
    setWaitSelections(EMPTY_WAIT);
    setWaitEditing(false);
    setNetraOutput(null);
    resetCommandPath();
    showToast('Decision Path reset', 'info');
    persistPath(next, 'Decision-path reset is local but has not reached MongoDB', true);
  };

  const resetWaitDefinition = () => {
    const next = { ...waitSelections, waitNote: '' };
    dimensions.forEach(dimension => { next[dimension.id] = ''; });
    setWaitSelections(next);
  };

  const renderWaitBranch = (checkpoint: RecognitionCheckpoint, checkpointIndex: number, waitNumber: number) => {
    const wait = checkpoint.wait;
    if (!wait) return null;
    const isActive = wait.resolutionStatus === 'OPEN' && checkpointIndex === activeWaitIndex;
    const isResolved = wait.resolutionStatus === 'RESOLVED';
    const isEditing = isActive && waitEditing;
    const resolution = isActive ? waitSelections : wait;
    const resolutionHasData = !!resolution.resolutionEvent || !!resolution.resolutionNote;

    return (
      <Fragment key={`${checkpoint.id}-wait-branch`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid rgba(245,158,11,0.42)', background: 'rgba(245,158,11,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{`WAIT — ${waitNumber}${isResolved ? ' · Confirmed' : ''}`}</div>
            <div style={{ flex: 1 }} />
            <button onClick={() => removeWait(checkpointIndex)} className="btn-reset" aria-label="Remove WAIT branch">×</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {dimensions.map(dimension => (
              <div key={dimension.id} className="precision-row flex items-start" style={{ paddingBottom: '10px', marginBottom: '10px' }}>
                <div className="precision-label" style={{ minWidth: '180px', paddingTop: '6px' }}>{dimension.name}</div>
                <div className="precision-selector flex-1 flex flex-wrap gap-1.5">
                  {(dimension.options || []).map(option => {
                    const value = isEditing ? waitSelections[dimension.id] : wait[dimension.id];
                    const selected = value === option;
                    return (
                      <button key={option} type="button" className={`precision-opt ${selected ? 'selected' : ''}`} onClick={() => {
                        if (isEditing) setWaitSelections({ ...waitSelections, [dimension.id]: selected ? '' : option });
                      }} aria-disabled={!isEditing} style={{ padding: '5px 9px', fontSize: '9px', cursor: isEditing ? 'pointer' : 'default' }}>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border-strong)]">
            <textarea value={(isEditing ? waitSelections.waitNote : wait.waitNote) || ''} onChange={event => {
              if (isEditing) setWaitSelections({ ...waitSelections, waitNote: event.target.value });
            }} disabled={!isEditing} placeholder="Record the WAIT condition or any additional context..." className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[52px]" />
            <div className="flex gap-2 shrink-0">
              <button onClick={() => { setWaitSelections({ ...wait, resolutionEvent: '', resolutionNote: '' }); setWaitEditing(true); }} className="btn-edit w-20" disabled={!isActive || waitEditing}>Edit</button>
              <button onClick={resetWaitDefinition} className="btn-reset w-20" disabled={!isEditing || !waitHasData}>Reset</button>
              <button onClick={saveWaitEdits} className={`${isEditing ? 'btn-confirm' : 'btn-confirmed'} w-40`} disabled={!isEditing}>{isEditing ? 'Confirm WAIT' : '✓ Confirmed'}</button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{`Resolver — WAIT ${waitNumber}${isResolved ? ' · Resolved' : ''}`}</div>
          <div className="precision-row flex items-start" style={{ paddingBottom: '10px' }}>
            <div className="precision-label" style={{ minWidth: '180px', paddingTop: '6px' }}>Resolution Event</div>
            <div className="precision-selector flex-1 flex flex-wrap gap-1.5">
              {resolutionEvents.map(event => {
                const selected = resolution.resolutionEvent === event;
                return (
                  <button key={event} type="button" className={`precision-opt ${selected ? 'selected' : ''}`} onClick={() => {
                    if (isActive && !waitEditing) setWaitSelections({ ...waitSelections, resolutionEvent: selected ? '' : event });
                  }} disabled={!isActive || waitEditing} style={{ padding: '5px 9px', fontSize: '9px' }}>{event}</button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border-strong)]">
            <textarea value={resolution.resolutionNote || ''} onChange={event => {
              if (isActive && !waitEditing) setWaitSelections({ ...waitSelections, resolutionNote: event.target.value });
            }} disabled={!isActive || waitEditing} placeholder="Record any additional resolution context..." className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[52px]" />
            <div className="flex gap-2 shrink-0">
              <button className="btn-edit w-20" disabled>Edit</button>
              <button onClick={() => setWaitSelections({ ...waitSelections, resolutionEvent: '', resolutionNote: '' })} className="btn-reset w-20" disabled={!isActive || waitEditing || !resolutionHasData}>Reset</button>
              <button onClick={resolveWait} disabled={!isActive || waitEditing || !waitSelections.resolutionEvent} className={`${isResolved ? 'btn-confirmed' : 'btn-confirm'} w-40`}>{isResolved ? '✓ Resolved' : 'Resolve WAIT'}</button>
            </div>
          </div>
        </div>
      </Fragment>
    );
  };

  const renderAiNode = (checkpoint: RecognitionCheckpoint, checkpointIndex: number, aiNumber: number) => {
    const isAiNode = checkpoint.nodeType === 'AI' || !!checkpoint.output || (!checkpoint.wait && checkpoint.nodeType !== 'COMMAND');
    if (!isAiNode) return null;
    const isPending = !checkpoint.output && !checkpoint.wait;
    const canRun = isPending && checkpointIndex === lastIndex && !activeWait;
    return (
      <div key={`${checkpoint.id}-ai`} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontSize: '8px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>AI Box — {aiNumber}</div>
        <NetraAILabs phaseId={`recognition-${checkpoint.sequence}`} phaseNum={5} title={`AI Box ${aiNumber}`} subheading={`MAYA — Recognition Suggestion ${aiNumber}`} showUpload={false} isEvaluating={isEvaluating && canRun} output={checkpoint.output} onAnalyse={triggerNeuralSynthesis} onStop={stopSynthesis} analyseDisabled={!canRun} analyseDisabledReason={activeWait ? 'Resolve the active WAIT first.' : checkpoint.output ? 'Choose the next node below.' : 'Only the latest AI box can run.'} />
      </div>
    );
  };

  const pathNodes: RecognitionCheckpoint[] = recognitionCheckpoints.length > 0
    ? recognitionCheckpoints
    : [{
        id: 'initial-suggestion', sequence: 1, createdAt: '', nodeType: 'AI', output: null,
        evidence: evidenceSnapshot(), selectedState: null, eligibility: '', wait: null,
        commandSelected: false,
      }];

  let aiNumber = 0;
  let waitNumber = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {pathNodes.map((checkpoint, index) => {
          const actualIndex = recognitionCheckpoints.length > 0 ? index : -1;
          const hasAiNode = checkpoint.nodeType === 'AI' || !!checkpoint.output || (!checkpoint.wait && checkpoint.nodeType !== 'COMMAND');
          if (hasAiNode) aiNumber += 1;
          if (checkpoint.wait) waitNumber += 1;
          return (
            <div key={checkpoint.id} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {hasAiNode && renderAiNode(checkpoint, actualIndex, aiNumber)}
              {checkpoint.wait && renderWaitBranch(checkpoint, actualIndex, waitNumber)}
            </div>
          );
        })}

        {!isLocked && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <button onClick={addWaitBranch} disabled={!!activeWait} className="btn-edit" style={{ minWidth: '140px', color: '#f59e0b', borderColor: '#f59e0b' }}>+ WAIT Node</button>
          </div>
        )}

        <div className="flex gap-2 shrink-0 justify-end pt-4 mt-2 border-t border-[var(--border-strong)]">
          <button onClick={editDecisionPath} className="btn-edit w-20" disabled={!isLocked}>Edit</button>
          <button onClick={resetDecisionPath} className="btn-reset w-20" disabled={isLocked || recognitionCheckpoints.length === 0}>Reset</button>
          <button
            onClick={confirmDecisionPath}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={isLocked || !!activeWait}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
