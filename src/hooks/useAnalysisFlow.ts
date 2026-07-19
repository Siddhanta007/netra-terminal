// Hook — runs the AI analysis pipeline: NETRA recognition (evaluate-netra) and weapon prediction (predict-weapon), with abort control.

import { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  setIsEvaluating, setNetraOutput, setIsPredictingWeapon, setWeaponPrediction,
  setSysRecommendation, appendRecognitionCheckpoint, updateLatestRecognitionCheckpoint,
} from '../store/slices/analysisSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';
import { aiSuggestionText, compactLatestWaitCheckpoint } from '../utils/aiContext';

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
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const recognitionCheckpoints = useSelector((s: RootState) => s.analysis.recognitionCheckpoints);
  const liveMarketContext = useSelector((s: RootState) => s.analysis.liveMarketContext);
  const selectedNetraState = useSelector((s: RootState) => s.analysis.selectedNetraState);
  const sysData = useSelector((s: RootState) => s.model.sysData);

  // Cleanup aborts on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      weaponAbortControllerRef.current?.abort();
    };
  }, []);

  const buildMarketPulseDimensions = useCallback(() => ({
    ...(selections.marketPulse || {}),
    activeLeg: selections.marketPulse?.activeLeg || selections.marketPulse?.auctionActiveLeg || '',
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
    const htfEventIds = new Set(
      (sysData?.htfStructure?.dimensions || []).filter(dimension => dimension.multiselect).map(dimension => dimension.id),
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
    const snapshot = {
      correlated_market_context: liveMarketContext,
      pre_session_context: { dimensions: selections.preSessionContext || {}, note: notes.preSessionContext || '' },
      htf_structure: { dimensions: without(htf, [...htfEventIds]), note: notes.htfStructure || '' },
      htf_events: { dimensions: pick(htf, [...htfEventIds]), note: notes.htfStructure || '' },
      auction_state: { dimensions: pick(marketPulse, ['operationalMarkingIds', 'operationalMarkings', 'auctionState', 'subAuctionState', 'auctionActiveLeg', 'activeLeg']), note: notes.marketPulse || '' },
      price_behaviour: { dimensions: pick(marketPulse, ['activeLegMomentum', 'momentum', 'activeLegResistance', 'resistance']), note: notes.marketPulse || '' },
      liquidity_context: { dimensions: without(liquidity, ['auctionEvent']), note: notes.liquidityContext || '' },
      auction_state_events: { dimensions: pick(liquidity, ['auctionEvent']), note: notes.liquidityContext || '' },
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
  }, [selections, notes, liveMarketContext, sysData, selectedNetraState, finalCommand, strikeSelections, saturationSelections, interSelections, recognitionCheckpoints, netraOutput]);

  // STS recommendation — converted to manual callback to save tokens
  const triggerSTSEvaluation = useCallback(() => {
    const cmd = finalCommand;
    if (!cmd || (cmd !== 'STRIKE' && cmd !== 'INTERCEPTION')) return;

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    const endpoint = cmd === 'STRIKE'
      ? `${API_BASE}/api/evaluate-strike`
      : `${API_BASE}/api/evaluate-interception`;

    fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        phase_0: {
          name: 'Maya Chart Analysis',
          image_description: typeof imageDescription === 'string' ? imageDescription : '',
        },
        phase_1: {
          name: 'Pre-Session Context',
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
        provider: providerVal,
        llm_config: { ...modelConfig, model_id: modelIdVal },
      }),
    })
      .then((res) => res.json())
      .then((data) => dispatch(setSysRecommendation(data)))
      .catch(console.error);
  }, [finalCommand, getActiveModel, getAuthHeaders, selections, notes, imageDescription, modelConfig, dispatch, buildMarketPulseDimensions, buildNamedMarketSnapshot]);

  const triggerNeuralSynthesis = useCallback(() => {
    if (isEvaluating) return;
    const latestCheckpoint = recognitionCheckpoints[recognitionCheckpoints.length - 1];
    if (recognitionCheckpoints.some(checkpoint => checkpoint.wait?.resolutionStatus === 'OPEN')) {
      showToast('Resolve the active WAIT checkpoint before rerunning P5', 'error');
      return;
    }
    if (!checkGuestLimit()) { showToast('Guest limit reached — sign in to continue', 'error'); return; }
    dispatch(setIsEvaluating(true));
    dispatch(setNetraOutput(null));

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    let imageDescStr = '';
    if (typeof imageDescription === 'string') {
      imageDescStr = imageDescription;
    }

    const payload = {
      phase_0: {
        name: 'Maya Chart Analysis',
        image_description: imageDescStr,
      },
      phase_1: {
        name: 'Pre-Session Context',
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
      market_snapshot: buildNamedMarketSnapshot('recognition'),
      provider: providerVal,
      llm_config: { ...modelConfig, model_id: modelIdVal },
      image_description: imageDescStr,
    };

    fetch(`${API_BASE}/api/evaluate-netra`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      signal: abortControllerRef.current.signal,
    })
      .then((res) => { if (!res.ok) throw new Error(); return res.json(); })
      .then((envelope: { status?: string; data?: Record<string, unknown>; thinking?: string; error?: string; raw?: unknown }) => {
        console.info('[NETRA AI] /api/evaluate-netra envelope', envelope);
        const hasData = envelope?.data && Object.keys(envelope.data).length > 0;
        const result = hasData
          ? { ...envelope.data, status: envelope.status, error: envelope.error, thinking: envelope.thinking ?? '' }
          : { ...envelope, thinking: envelope?.thinking ?? '' };
        const rawEligibility = String(result.eligibility_recommendation || '').toUpperCase();
        const eligibility = (['ACTIVE', 'DEVELOPING', 'INSUFFICIENT'].includes(rawEligibility)
          ? rawEligibility
          : '') as 'ACTIVE' | 'DEVELOPING' | 'INSUFFICIENT' | '';
        console.info('[NETRA AI] netraOutput dispatched', result);
        dispatch(setNetraOutput(result as Parameters<typeof setNetraOutput>[0]));
        const checkpoint = {
          output: result as Parameters<typeof setNetraOutput>[0],
          evidence: {
            preSessionContext: { ...(selections.preSessionContext || {}) },
            htfStructure: { ...(selections.htfStructure || {}) },
            marketPulse: { ...(selections.marketPulse || {}) },
            liquidityContext: { ...(selections.liquidityContext || {}) },
          },
          selectedState: null,
          eligibility,
          wait: null,
        };
        if (latestCheckpoint && !latestCheckpoint.output && !latestCheckpoint.wait) {
          dispatch(updateLatestRecognitionCheckpoint(checkpoint));
        } else {
          dispatch(appendRecognitionCheckpoint(checkpoint));
        }
        dispatch(setIsEvaluating(false));
        markGuestAiUsed();
        showToast('Neural Synthesis Complete');
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') { showToast('NETRA Synthesis Stopped', 'info'); return; }
        dispatch(setNetraOutput({ cmd: 'NO ENGAGEMENT', conviction: 'ERROR', size: '0%', synthesis: 'Neural Engine Sync Failure.' }));
        dispatch(setIsEvaluating(false));
        showToast('Neural Engine Sync Failure', 'error');
      });
  }, [isEvaluating, recognitionCheckpoints, dispatch, getActiveModel, getAuthHeaders, imageDescription, selections, notes, modelConfig, showToast, buildMarketPulseDimensions, buildNamedMarketSnapshot]);

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
      phase_0: {
        name: 'Maya Chart Analysis',
        image_description: imageDescription || '',
      },
      phase_1: {
        name: 'Pre-Session Context',
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
  }, [isPredictingWeapon, dispatch, getActiveModel, getAuthHeaders, selections, finalCommand, strikeSelections, saturationSelections, interSelections, notes, netraOutput, modelConfig, imageDescription, showToast, buildMarketPulseDimensions, buildNamedMarketSnapshot]);

  const stopWeaponPrediction = useCallback(() => {
    weaponAbortControllerRef.current?.abort();
    weaponAbortControllerRef.current = null;
    dispatch(setIsPredictingWeapon(false));
  }, [dispatch]);

  return {
    isEvaluating, isPredictingWeapon, weaponPrediction, netraOutput,
    triggerNeuralSynthesis, stopSynthesis,
    triggerWeaponPrediction, stopWeaponPrediction,
    triggerSTSEvaluation,
  };
}
