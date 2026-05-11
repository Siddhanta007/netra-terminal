import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { setSession, setActiveSessionId, setIsLoggingIn, setSessionInput } from '../store/slices/sessionSlice';
import { setPrepStep, setActiveView, setIsLoggerOpen, setAiPaneOpen, setMobileMenuOpen } from '../store/slices/uiSlice';
import {
  setHighestStep, setSelections, setNotes, setInterSelections, setStrikeSelections,
  setFinalCommand, setNetraOutput, setSysRecommendation, setSelectedWeaponId,
  setCommandLocked, setWeaponLocked, setStepTimestamps, setImageDescription,
  setWeaponPrediction,
} from '../store/slices/analysisSlice';
import { setTradeName, setActiveEditLog, setEditFormData, setAuditData, setIsAuditing } from '../store/slices/logsSlice';
import { saveState } from '../utils/storage';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';
import { TradeLog } from '../types';

export function useSessionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { getAuthHeaders, showToast } = useNetraUtils();

  const session = useSelector((s: RootState) => s.session.session);
  const sessionInput = useSelector((s: RootState) => s.session.sessionInput);
  const currentModel = useSelector((s: RootState) => s.model.currentModel);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);

  // Ref keeps a fresh copy of all session state so saveSession() always reads
  // current values without a stale closure, regardless of dependency arrays.
  const analysisRef = useRef({
    highestStep: 1,
    selections: { realBias: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} },
    notes: { realBias: '', htfStructure: '', marketPulse: '', liquidityContext: '' },
    interSelections: { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' },
    strikeSelections: { impulseQuality: '', continuationZone: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '' },
    finalCommand: null as string | null,
    netraOutput: null as RootState['analysis']['netraOutput'],
    sysRecommendation: null as unknown,
    selectedWeaponId: null as string | null,
    stepTimestamps: {} as Record<string, string>,
    tradeName: '',
    activeSessionId: null as number | null,
    assetName: '',
  });

  // Keep ref in sync with selectors on every render
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const interSelections = useSelector((s: RootState) => s.analysis.interSelections);
  const strikeSelections = useSelector((s: RootState) => s.analysis.strikeSelections);
  const finalCommand = useSelector((s: RootState) => s.analysis.finalCommand);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const sysRecommendation = useSelector((s: RootState) => s.analysis.sysRecommendation);
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
  const stepTimestamps = useSelector((s: RootState) => s.analysis.stepTimestamps);
  const tradeName = useSelector((s: RootState) => s.logs.tradeName);

  analysisRef.current = {
    highestStep, selections, notes, interSelections, strikeSelections,
    finalCommand, netraOutput, sysRecommendation, selectedWeaponId,
    stepTimestamps, tradeName, activeSessionId, assetName: session?.assetName || '',
  };

  const resetTerminalState = useCallback(() => {
    dispatch(setHighestStep(1));
    dispatch(setCommandLocked(false));
    dispatch(setWeaponLocked(false));
    dispatch(setSelections({ realBias: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} }));
    dispatch(setNotes({ realBias: '', htfStructure: '', marketPulse: '', liquidityContext: '' }));
    dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
    dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '' }));
    dispatch(setFinalCommand(null));
    dispatch(setNetraOutput(null));
    dispatch(setSysRecommendation(null));
    dispatch(setSelectedWeaponId(null));
    dispatch(setStepTimestamps({}));
    dispatch(setTradeName(''));
    dispatch(setEditFormData({}));
    dispatch(setAuditData(null));
    dispatch(setIsAuditing(false));
    dispatch(setImageDescription(null));
    dispatch(setWeaponPrediction(null));
  }, [dispatch]);

  const handleAuth = useCallback(() => {
    dispatch(setIsLoggingIn(true));
    fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username: sessionInput.userName, password: sessionInput.password }),
    })
      .then((res) => { if (res.ok) return res.json(); throw new Error('Invalid credentials'); })
      .then((data: { user: string }) => {
        dispatch(setSession({ userName: data.user, assetName: null, tradeName: null }));
        dispatch(setPrepStep(1));
        navigate('/home');
      })
      .catch((err: Error) => showToast(err.message, 'error'))
      .finally(() => dispatch(setIsLoggingIn(false)));
  }, [dispatch, getAuthHeaders, sessionInput, navigate, showToast]);

  const initializeMission = useCallback(() => {
    if (!sessionInput.tradeName || !sessionInput.assetName) {
      showToast('Trade Info Required', 'error');
      return;
    }
    resetTerminalState();
    const payload = {
      model_id: currentModel,
      username: session?.userName || 'Unknown',
      realBias: '-', htfStructure: '-', marketPulse: '-', liquidityContext: '-',
      weapon: 'INITIALIZING',
      protocol: sessionInput.modelName === 'trishul' ? 'TRISHUL' : 'PINAKA',
      trade_name: sessionInput.tradeName,
      asset_ticker: sessionInput.assetName,
      session_state: {
        highestStep: 1,
        selections: { realBias: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} },
        notes: { realBias: '', htfStructure: '', marketPulse: '', liquidityContext: '' },
        interSelections: { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' },
        strikeSelections: { impulseQuality: '', continuationZone: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '' },
        finalCommand: null, netraOutput: null, sysRecommendation: null,
        selectedWeaponId: null, stepTimestamps: {},
        tradeName: sessionInput.tradeName, assetName: sessionInput.assetName,
      },
    };
    fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then((res) => { if (!res.ok) throw new Error('Schema Validation Failed'); return res.json(); })
      .then((data: TradeLog) => {
        dispatch(setActiveSessionId(data.id));
        dispatch(setTradeName(data.name));
        dispatch(setSession({ ...session!, assetName: sessionInput.assetName, tradeName: sessionInput.tradeName }));
        dispatch(setIsLoggerOpen(true));
        dispatch(setAiPaneOpen(false));
        dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '' }));
        dispatch(setPrepStep(2));
        dispatch(setActiveView(sessionInput.modelName === 'trishul' ? 'trishul' : 'terminal'));
        showToast('Mission Initialized');
        navigate(sessionInput.modelName === 'trishul' ? '/mission/trishul' : '/mission/pinaka');
      })
      .catch((err: Error) => showToast(`Persistence Failure: ${err.message}`, 'error'));
  }, [dispatch, getAuthHeaders, sessionInput, session, currentModel, resetTerminalState, navigate, showToast]);

  const resumeSession = useCallback((log: TradeLog) => {
    if (!log?.session_state) return;
    const state = log.session_state;
    dispatch(setHighestStep(state.highestStep || 1));
    dispatch(setSelections(state.selections || { realBias: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} }));
    dispatch(setNotes(state.notes || { realBias: '', htfStructure: '', marketPulse: '', liquidityContext: '' }));
    dispatch(setInterSelections(state.interSelections || { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
    dispatch(setStrikeSelections(state.strikeSelections || { impulseQuality: '', continuationZone: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '' }));
    dispatch(setFinalCommand(state.finalCommand || null));
    dispatch(setNetraOutput(state.netraOutput || null));
    dispatch(setSysRecommendation(state.sysRecommendation || null));
    dispatch(setSelectedWeaponId(state.selectedWeaponId || null));
    dispatch(setStepTimestamps(state.stepTimestamps || {}));
    dispatch(setTradeName(log.name || state.tradeName || ''));
    const assetName = log.phase2?.trading_asset || state.assetName || log.phase1?.asset_ticker || '';
    if (window.innerWidth < 1024) dispatch(setIsLoggerOpen(false));
    dispatch(setSession({ userName: session?.userName || 'User', assetName: assetName as string, tradeName: log.name || state.tradeName || '' }));
    dispatch(setActiveSessionId(log.id));
    saveState('activeSessionId', log.id);
    dispatch(setActiveView('terminal'));
    dispatch(setActiveEditLog(log));
    dispatch(setEditFormData({ ...log.phase2, ...log.phase3, ...log.phase4, trade_name: log.name }));
    dispatch(setIsLoggerOpen(true));
    dispatch(setPrepStep(2));
    showToast(`Resumed: ${state.tradeName || log.id}`);
    navigate('/mission/pinaka');
  }, [dispatch, session, navigate, showToast]);

  const saveSession = useCallback(() => {
    const snap = analysisRef.current;
    if (!snap.activeSessionId) return;
    fetch(`${API_BASE}/api/logs/${encodeURIComponent(snap.activeSessionId)}/state`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        highestStep: snap.highestStep,
        selections: snap.selections,
        notes: snap.notes,
        interSelections: snap.interSelections,
        strikeSelections: snap.strikeSelections,
        finalCommand: snap.finalCommand,
        netraOutput: snap.netraOutput,
        sysRecommendation: snap.sysRecommendation,
        selectedWeaponId: snap.selectedWeaponId,
        stepTimestamps: snap.stepTimestamps,
        tradeName: snap.tradeName,
        assetName: snap.assetName,
      }),
    })
      .then(() => showToast('Session Saved'))
      .catch(() => showToast('Save failed', 'error'));
  // analysisRef is a ref — intentionally omitted from deps (always current)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAuthHeaders, showToast]);

  const logout = useCallback(() => {
    dispatch(setSession(null));
    resetTerminalState();
    localStorage.clear();
    navigate('/login');
  }, [dispatch, resetTerminalState, navigate]);

  const isLoggingIn = useSelector((s: RootState) => s.session.isLoggingIn);
  const activeSessionIdVal = useSelector((s: RootState) => s.session.activeSessionId);

  return {
    session, sessionInput, isLoggingIn, activeSessionId: activeSessionIdVal,
    handleAuth, initializeMission, resumeSession, saveSession, resetTerminalState, logout,
    setSession: (v: RootState['session']['session']) => dispatch(setSession(v)),
    setSessionInput: (v: RootState['session']['sessionInput']) => dispatch(setSessionInput(v)),
  };
}
