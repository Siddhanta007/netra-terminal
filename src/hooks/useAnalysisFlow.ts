// Hook — runs the AI analysis pipeline: NETRA recognition (evaluate-netra) and weapon prediction (predict-weapon), with abort control.

import { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  setIsEvaluating, setNetraOutput, setIsPredictingWeapon, setWeaponPrediction,
  setSysRecommendation, appendStateRecognition,
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

  // STS recommendation — converted to manual callback to save tokens
  const triggerSTSEvaluation = useCallback(() => {
    const cmd = finalCommand || (netraOutput ? netraOutput.cmd : null);
    if (!cmd || (cmd !== 'STRIKE' && cmd !== 'INTERCEPTION')) return;

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    const endpoint = cmd === 'STRIKE'
      ? `${API_BASE}/api/evaluate-strike`
      : `${API_BASE}/api/evaluate-interception`;

    fetch(endpoint, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        preSessionContext: selections.preSessionContext,
        htfStructure: selections.htfStructure,
        marketPulse: selections.marketPulse,
        provider: providerVal,
        llm_config: { ...modelConfig, model_id: modelIdVal },
      }),
    })
      .then((res) => res.json())
      .then((data) => dispatch(setSysRecommendation(data)))
      .catch(console.error);
  }, [finalCommand, netraOutput, getActiveModel, getAuthHeaders, selections, modelConfig, dispatch]);

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
      preSessionContext: selections.preSessionContext || {},
      htfStructure: selections.htfStructure || {},
      marketPulse: selections.marketPulse || {},
      // All analyst notes — every phase note the operator has written.
      // These are the highest-signal human input and must reach the LLM.
      notes: {
        preSessionContext: notes.preSessionContext || '',
        htfStructure:      notes.htfStructure      || '',
        marketPulse:       notes.marketPulse       || '',
        liquidityContext:  notes.liquidityContext  || '',
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
      .then((envelope: { data?: Record<string, unknown>; thinking?: string }) => {
        const result = { ...(envelope?.data ?? envelope), thinking: envelope?.thinking ?? '' };
        dispatch(setNetraOutput(result as Parameters<typeof setNetraOutput>[0]));
        // Record the recognised state into the session path timeline
        const r = result as Record<string, unknown>;
        const rec = r.recognized_state as { state_id?: string } | undefined;
        const stateId = rec?.state_id || (r.state_id as string | undefined);
        if (stateId) dispatch(appendStateRecognition(stateId));
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
  }, [isEvaluating, dispatch, getActiveModel, getAuthHeaders, imageDescription, selections, modelConfig, showToast]);

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
      preSessionContext: selections.preSessionContext,
      htfStructure: selections.htfStructure,
      marketPulse: selections.marketPulse,
      command: finalCommand,
      sts_dims: finalCommand === 'STRIKE' ? strikeSelections : interSelections,
      // Full notes object so weapon agent has all analyst context
      notes: {
        preSessionContext: notes.preSessionContext || '',
        htfStructure:      notes.htfStructure      || '',
        marketPulse:       notes.marketPulse       || '',
        liquidityContext:  notes.liquidityContext  || '',
        command:           notes.command           || '',
        weapon_thought:    notes.weapon_thought    || '',
      },
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
      .then((envelope: { data?: Record<string, unknown>; thinking?: string }) => {
        const data = { ...(envelope?.data ?? envelope), thinking: envelope?.thinking ?? '' };
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
  }, [isPredictingWeapon, dispatch, getActiveModel, getAuthHeaders, selections, finalCommand, strikeSelections, interSelections, notes, netraOutput, modelConfig, imageDescription, showToast]);

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
