// Hook — runs the AI analysis pipeline: NETRA recognition (evaluate-netra) and weapon prediction (predict-weapon), with abort control.

import { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  setIsEvaluating, setNetraOutput, setIsPredictingWeapon, setWeaponPrediction,
  setSysRecommendation,
} from '../store/slices/analysisSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';

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
        provider: providerVal,
        llm_config: { ...modelConfig, model_id: modelIdVal },
      }),
    })
      .then((res) => res.json())
      .then((data) => dispatch(setSysRecommendation(data)))
      .catch(console.error);
  }, [finalCommand, getActiveModel, getAuthHeaders, selections, notes, imageDescription, modelConfig, dispatch, buildMarketPulseDimensions]);

  const triggerNeuralSynthesis = useCallback(() => {
    if (isEvaluating) return;
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
        console.info('[NETRA AI] netraOutput dispatched', result);
        dispatch(setNetraOutput(result as Parameters<typeof setNetraOutput>[0]));
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
  }, [isEvaluating, dispatch, getActiveModel, getAuthHeaders, imageDescription, selections, notes, modelConfig, showToast, buildMarketPulseDimensions]);

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
      strategy_reasoning: netraOutput?.analysis,
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
  }, [isPredictingWeapon, dispatch, getActiveModel, getAuthHeaders, selections, finalCommand, strikeSelections, saturationSelections, interSelections, notes, netraOutput, modelConfig, imageDescription, showToast, buildMarketPulseDimensions]);

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
