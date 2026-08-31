// Hook — runs the active H2 hypothesis and Weapon Suggestion workflows with abort control.

import { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  setIsEvaluating, setNetraOutput, setIsPredictingWeapon, setWeaponPrediction,
  appendRecognitionCheckpoint, updateLatestRecognitionCheckpoint,
  setFinalCommand, setNotes,
} from '../store/slices/analysisSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';
import { aiSuggestionText, compactLatestWaitCheckpoint } from '../utils/aiContext';
import { buildAgentWorkflowRequest } from '../utils/agentWorkflowRequest';
import { getEditableHypothesisText } from '../utils/hypothesisText';
import { waitForNextPaint } from '../utils/waitForNextPaint';

export function useAnalysisFlow() {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, showToast, getActiveModel, checkGuestLimit, markGuestAiUsed } = useNetraUtils();

  const abortControllerRef = useRef<AbortController | null>(null);
  const weaponAbortControllerRef = useRef<AbortController | null>(null);

  const isEvaluating = useSelector((s: RootState) => s.analysis.isEvaluating);
  const isPredictingWeapon = useSelector((s: RootState) => s.analysis.isPredictingWeapon);
  const weaponPrediction = useSelector((s: RootState) => s.analysis.weaponPrediction);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const finalCommand = useSelector((s: RootState) => s.analysis.finalCommand);
  const strikeSelections = useSelector((s: RootState) => s.analysis.strikeSelections);
  const interSelections = useSelector((s: RootState) => s.analysis.interSelections);
  const saturationSelections = useSelector((s: RootState) => s.analysis.saturationSelections);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const recognitionCheckpoints = useSelector((s: RootState) => s.analysis.recognitionCheckpoints);
  const liveMarketContext = useSelector((s: RootState) => s.analysis.liveMarketContext);
  const selectedNetraState = useSelector((s: RootState) => s.analysis.selectedNetraState);
  const sysData = useSelector((s: RootState) => s.model.sysData);
  const h1Hypothesis = useSelector((s: RootState) => s.analysis.h1Hypothesis);
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);
  const session = useSelector((s: RootState) => s.session.session);

  // Cleanup aborts on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      weaponAbortControllerRef.current?.abort();
    };
  }, []);

  const buildMarketPulseDimensions = useCallback(() => ({
    ...(selections.marketPulse || {}),
    ...(selections.liquidityContext || {}),
  }), [selections.marketPulse, selections.liquidityContext]);

  // Stable named records for AI. The server adapts this to any legacy prompt
  // shape, but the terminal never needs to reason in display-phase numbers.
  const buildNamedMarketSnapshot = useCallback((scope: 'recognition' | 'downstream' = 'recognition') => {
    const marketPulse = selections.marketPulse || {};
    const liquidity = selections.liquidityContext || {};
    const htf = selections.htfStructure || {};
    const pick = (source: Record<string, string>, keys: string[]) => Object.fromEntries(
      Object.entries(source).filter(([key]) => keys.includes(key)),
    );
    const without = (source: Record<string, string>, keys: string[]) => Object.fromEntries(
      Object.entries(source).filter(([key]) => !keys.includes(key)),
    );
    const htfDimensions = (sysData?.hypothesisH1?.dimensions || [])
      .filter(component => component.selectionTarget !== 'preSessionContext')
      .flatMap(dimension => dimension.dimensions || [dimension]);
    const htfEventIds = new Set(
      htfDimensions.filter(dimension => dimension.multiselect).map(dimension => dimension.id),
    );
    const selectedStateBody = (selectedNetraState || {}) as Record<string, unknown>;
    const recognizedState = ((selectedStateBody.recognized_state || selectedStateBody) as Record<string, unknown>);
    const stateDimensionIds = new Set(
      (Array.isArray(recognizedState.dimensions) ? recognizedState.dimensions : [])
        .map(item => (item as Record<string, unknown>).id)
        .filter((id): id is string => typeof id === 'string'),
    );
    const stateEventIds = new Set(
      (Array.isArray(recognizedState.events) ? recognizedState.events : [])
        .map(item => (item as Record<string, unknown>).id)
        .filter((id): id is string => typeof id === 'string'),
    );
    const commandSelections = finalCommand === 'STRIKE'
      ? strikeSelections
      : finalCommand === 'SATURATION'
        ? saturationSelections
        : interSelections;
    const hasStateSchema = stateDimensionIds.size > 0 || stateEventIds.size > 0;
    const stateDimensions = Object.fromEntries(Object.entries(commandSelections || {}).filter(
      ([key, value]) => !!value && (!hasStateSchema || stateDimensionIds.has(key)),
    ));
    const stateEvents = Object.fromEntries(Object.entries(commandSelections || {}).filter(
      ([key, value]) => !!value && stateEventIds.has(key),
    ));
    const waitCheckpoints = compactLatestWaitCheckpoint(recognitionCheckpoints);
    const marketPulseRecords = Object.fromEntries(
      (sysData?.marketPulse?.dimensions || [])
        .filter(component => !!component.recordKey)
        .map(component => {
          const includedComponents = [
            component,
            ...(sysData?.marketPulse?.dimensions || []).filter(candidate => component.includeComponentIds?.includes(candidate.id)),
          ];
          const source = component.selectionTarget === 'liquidityContext' ? liquidity : marketPulse;
          const keys = includedComponents.flatMap(included => [
            ...(included.selectionIdKey ? [included.selectionIdKey] : []),
            ...(included.selectionValueKey ? [included.selectionValueKey] : []),
            ...(included.dimensions || []).flatMap(dimension => [dimension.id, ...(dimension.selectionAliases || [])]),
          ]);
          return [
            component.recordKey,
            {
              dimensions: pick(source, keys),
              note: component.selectionTarget === 'liquidityContext' ? notes.liquidityContext || '' : notes.marketPulse || '',
            },
          ];
        }),
    );
    const snapshot = {
      correlated_market_context: liveMarketContext,
      pre_session_context: { dimensions: selections.preSessionContext || {}, note: notes.preSessionContext || '' },
      htf_structure: { dimensions: without(htf, [...htfEventIds]), note: notes.htfStructure || '' },
      htf_events: { dimensions: pick(htf, [...htfEventIds]), note: notes.htfStructure || '' },
      hypothesis_h1: h1Hypothesis?.status === 'CONFIRMED' ? {
        hypothesis_id: h1Hypothesis.hypothesis_id,
        revision: h1Hypothesis.revision,
        status: h1Hypothesis.status,
        claim: h1Hypothesis.claim,
        structural_view: h1Hypothesis.structural_view,
        objective: h1Hypothesis.objective,
        pullback_magnet: h1Hypothesis.pullback_magnet,
        expected_path: h1Hypothesis.expected_path,
        confirmation_conditions: h1Hypothesis.confirmation_conditions,
        invalidation_conditions: h1Hypothesis.invalidation_conditions,
        handoff: h1Hypothesis.handoff,
        confidence: h1Hypothesis.confidence,
        evidence_summary: {
          supporting_count: h1Hypothesis.evidence.supporting.length,
          contradicting_count: h1Hypothesis.evidence.contradicting.length,
          missing: h1Hypothesis.evidence.missing,
        },
      } : null,
      ...marketPulseRecords,
      previous_ai_suggestion: aiSuggestionText(netraOutput) || null,
      wait: waitCheckpoints.length ? { checkpoints: waitCheckpoints } : null,
    };
    if (scope === 'recognition') return snapshot;
    const compactState = selectedNetraState ? {
      state_id: String(recognizedState.state_id || ''),
      state_name: String(recognizedState.state_name || recognizedState.name || ''),
      command: finalCommand || String(recognizedState.command || ''),
    } : null;
    return {
      ...snapshot,
      pinaka_state: compactState,
      state_dimensions: finalCommand ? { command: finalCommand, dimensions: stateDimensions, note: notes.command || '' } : null,
      state_events: finalCommand ? { command: finalCommand, dimensions: stateEvents, note: notes.command || '' } : null,
    };
  }, [selections, notes, liveMarketContext, sysData, selectedNetraState, finalCommand, strikeSelections, saturationSelections, interSelections, recognitionCheckpoints, netraOutput, h1Hypothesis]);

  const triggerNeuralSynthesis = useCallback(async () => {
    if (isEvaluating) return;
    const latestCheckpoint = recognitionCheckpoints[recognitionCheckpoints.length - 1];
    if (recognitionCheckpoints.some(checkpoint => checkpoint.wait?.resolutionStatus === 'OPEN')) {
      showToast('Resolve the active WAIT checkpoint before rerunning P5', 'error');
      return;
    }
    if (!checkGuestLimit()) { showToast('Guest limit reached — sign in to continue', 'error'); return; }
    dispatch(setIsEvaluating(true));
    dispatch(setNetraOutput(null));
    await waitForNextPaint();

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    const payload = buildAgentWorkflowRequest({
      sessionId: activeSessionId,
      provider: providerVal,
      modelId: modelIdVal,
      modelConfig,
    });

    fetch(`${API_BASE}/api/hypotheses/h2/generate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      signal: abortControllerRef.current.signal,
    })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((envelope: { status?: string; data?: Record<string, unknown>; thinking?: string; error?: string; raw?: unknown }) => {
        console.info('[NETRA AI] /api/hypotheses/h2/generate envelope', envelope);
        const hypothesis = envelope?.data?.hypothesis as Record<string, unknown> | undefined;
        if (!hypothesis) throw new Error(envelope?.error || 'Maya returned no H2 proposal');
        const h2Status = String(hypothesis.status || '').toUpperCase();
        const editableHypothesis = getEditableHypothesisText(hypothesis);
        const result = {
          ...hypothesis,
          cmd: String(hypothesis.command || ''),
          analysis: editableHypothesis,
          eligibility_recommendation: ['WAITING', 'CONFLICTED'].includes(h2Status) ? 'DEVELOPING' : h2Status === 'INSUFFICIENT' ? 'INSUFFICIENT' : 'ACTIVE',
          agent_trace: envelope.data?.agent_trace || [],
          status: envelope.status,
        };
        const rawEligibility = String(result.eligibility_recommendation || '').toUpperCase();
        const eligibility = (['ACTIVE', 'DEVELOPING', 'INSUFFICIENT'].includes(rawEligibility)
          ? rawEligibility
          : '') as 'ACTIVE' | 'DEVELOPING' | 'INSUFFICIENT' | '';
        console.info('[NETRA AI] netraOutput dispatched', result);
        dispatch(setNetraOutput(result as Parameters<typeof setNetraOutput>[0]));
        if (hypothesis.command) dispatch(setFinalCommand(String(hypothesis.command)));
        dispatch(setNotes({ ...notes, command: editableHypothesis }));
        const checkpoint = {
          nodeType: 'AI' as const,
          output: result as Parameters<typeof setNetraOutput>[0],
          evidence: {
            marketPulse: { ...(selections.marketPulse || {}) },
            liquidityContext: { ...(selections.liquidityContext || {}) },
          },
          selectedState: null,
          eligibility,
          wait: null,
          hypothesisText: editableHypothesis,
          hypothesisConfirmed: false,
        };
        if (latestCheckpoint && !latestCheckpoint.output && !latestCheckpoint.wait) {
          dispatch(updateLatestRecognitionCheckpoint(checkpoint));
        } else {
          dispatch(appendRecognitionCheckpoint(checkpoint));
        }
        dispatch(setIsEvaluating(false));
        markGuestAiUsed();
        showToast('Market Pulse Hypothesis proposed');
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') { showToast('NETRA Synthesis Stopped', 'info'); return; }
        dispatch(setNetraOutput({ cmd: 'NO ENGAGEMENT', conviction: 'ERROR', size: '0%', synthesis: 'Neural Engine Sync Failure.' }));
        dispatch(setIsEvaluating(false));
        showToast(`Maya H2 failed: ${err.message || 'Neural engine sync failure'}`, 'error');
      });
  }, [activeSessionId, isEvaluating, recognitionCheckpoints, dispatch, getActiveModel, getAuthHeaders, notes, modelConfig, showToast]);

  const stopSynthesis = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch(setIsEvaluating(false));
  }, [dispatch]);

  const triggerWeaponPrediction = useCallback((thought?: string): Promise<Record<string, unknown> | null> => {
    if (isPredictingWeapon) return Promise.resolve(null);
    if (!checkGuestLimit()) { showToast('Guest limit reached — sign in to continue', 'error'); return Promise.resolve(null); }
    dispatch(setIsPredictingWeapon(true));
    dispatch(setWeaponPrediction(null));

    if (weaponAbortControllerRef.current) weaponAbortControllerRef.current.abort();
    weaponAbortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    const payload = {
      session_id: activeSessionId,
      asset: session?.assetName || '',
      phase_0: {
        name: 'Maya Chart Analysis',
        image_description: imageDescription || '',
      },
      phase_1: {
        name: 'Super HTF Structure',
        dimensions: selections.preSessionContext || {},
        notes: notes.preSessionContext || '',
      },
      phase_2: {
        name: 'HTF Structure',
        dimensions: selections.htfStructure || {},
        notes: notes.htfStructure || '',
      },
      phase_3: {
        name: 'Market Pulse',
        dimensions: buildMarketPulseDimensions(),
        notes: notes.marketPulse || '',
      },
      market_snapshot: buildNamedMarketSnapshot('downstream'),
      command: finalCommand,
      sts_dims: finalCommand === 'STRIKE'
        ? strikeSelections
        : finalCommand === 'SATURATION'
          ? saturationSelections
          : interSelections,
      available_entry_models: Array.isArray((netraOutput as Record<string, unknown> | null)?.child_states)
        ? (netraOutput as Record<string, unknown>).child_states
        : [],
      command_note: notes.command || '',
      weapon_thought: notes.weapon_thought || '',
      trader_thought: thought || undefined,
      provider: providerVal,
      model_config: { ...modelConfig, model_id: modelIdVal },
      image_description: imageDescription,
    };

    return fetch(`${API_BASE}/api/predict-weapon`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      signal: weaponAbortControllerRef.current.signal,
    })
      .then((res) => res.json())
      .then((envelope: { status?: string; data?: Record<string, unknown>; thinking?: string; error?: string }) => {
        console.info('[NETRA AI] /api/predict-weapon envelope', envelope);
        const hasData = envelope?.data && Object.keys(envelope.data).length > 0;
        const data = hasData
          ? { ...envelope.data, status: envelope.status, error: envelope.error, thinking: envelope.thinking ?? '' }
          : { ...envelope, thinking: envelope?.thinking ?? '' };
        console.info('[NETRA AI] weaponPrediction dispatched', data);
        dispatch(setWeaponPrediction(data));   // keeps the shared store in sync (e.g. session snapshot)
        dispatch(setIsPredictingWeapon(false));
        showToast('Weapon Prediction Ready');
        return data;                            // returned so the caller can store it per-trade-card
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') showToast('Prediction Stopped', 'info');
        else showToast('Prediction Failure', 'error');
        dispatch(setIsPredictingWeapon(false));
        return null;
      });
  }, [activeSessionId, isPredictingWeapon, dispatch, getActiveModel, getAuthHeaders, selections, finalCommand, strikeSelections, saturationSelections, interSelections, notes, netraOutput, modelConfig, imageDescription, session?.assetName, showToast, buildMarketPulseDimensions, buildNamedMarketSnapshot]);

  const stopWeaponPrediction = useCallback(() => {
    weaponAbortControllerRef.current?.abort();
    weaponAbortControllerRef.current = null;
    dispatch(setIsPredictingWeapon(false));
  }, [dispatch]);

  return {
    isEvaluating, isPredictingWeapon, weaponPrediction, netraOutput,
    triggerNeuralSynthesis, stopSynthesis,
    triggerWeaponPrediction, stopWeaponPrediction,
  };
}
