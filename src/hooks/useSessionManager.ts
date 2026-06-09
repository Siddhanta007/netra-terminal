// Hook — trade-session lifecycle: create, load, fork, persist and reset a session and its full analysis state.

import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { setSession, setActiveSessionId, setIsLoggingIn, setSessionInput, setIsGuest } from '../store/slices/sessionSlice';
import { setPrepStep, setActiveView, setIsLoggerOpen, setAiPaneOpen, setMobileMenuOpen } from '../store/slices/uiSlice';
import {
  setHighestStep, setSelections, setNotes, setInterSelections, setStrikeSelections,
  setFinalCommand, setNetraOutput, setSysRecommendation, setSelectedWeaponId,
  setCommandLocked, setWeaponLocked, setStepTimestamps, setImageDescription,
  setWeaponPrediction, setStateTimeline,
} from '../store/slices/analysisSlice';
import { setTradeName, setActiveEditLog, setEditFormData, setAuditData, setIsAuditing } from '../store/slices/logsSlice';
import { registerSession, updateSession, setActiveRegistryId } from '../store/slices/sessionRegistrySlice';
import { saveState } from '../utils/storage';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';
import { TradeLog, SessionMeta, TradePhase2, TradePhase3, TradePhase4, TradePhase8, TradePhase9Card, TradePhase1 } from '../types';

// Resolve session fields from new phase structure (primary) or old session_state blob (fallback)
function resolveLogState(log: TradeLog) {
  const s = log.session_state;
  const p2 = log.phase2 as TradePhase2 | undefined;
  const p3 = log.phase3 as TradePhase3 | undefined;
  const p4 = log.phase4 as TradePhase4 | undefined;
  const p8 = log.phase8 as TradePhase8 | undefined;
  const finalCmd = ((log.phase6 as Record<string,unknown> | undefined)?.command as string ?? s?.finalCommand ?? null);
  const dims = p8?.dimensions ?? {};
  return {
    highestStep:   (log.highestStep  ?? s?.highestStep  ?? 1) as number,
    stepTimestamps:(log.stepTimestamps ?? s?.stepTimestamps ?? {}) as Record<string, string>,
    realBias:      p2?.selections ?? (s?.selections?.realBias ?? {}) as Record<string,string>,
    htfStructure:  p3?.selections ?? (s?.selections?.htfStructure ?? {}) as Record<string,string>,
    marketPulse:   p4?.marketPulse ?? (s?.selections?.marketPulse ?? {}) as Record<string,string>,
    liquidityCtx:  p4?.liquidityContext ?? (s?.selections?.liquidityContext ?? {}) as Record<string,string>,
    note2:  p2?.note ?? s?.notes?.realBias ?? '',
    note3:  p3?.note ?? s?.notes?.htfStructure ?? '',
    note4mp:p4?.marketPulse_note ?? s?.notes?.marketPulse ?? '',
    note4lq:p4?.liquidityContext_note ?? s?.notes?.liquidityContext ?? '',
    netraOut:  (log.phase5 ?? s?.netraOutput ?? null),
    sysRec:    ((log.phase6 as Record<string,unknown> | undefined)?.recommendation ?? s?.sysRecommendation ?? null),
    finalCmd,
    wpPred:    (log.phase7 ?? s?.weaponPrediction ?? null),
    weaponId:  (p8?.weapon_id ?? s?.selectedWeaponId ?? null) as string | null,
    strikeSel: finalCmd === 'STRIKE'       ? dims : (s?.strikeSelections ?? {}),
    interSel:  finalCmd === 'INTERCEPTION' ? dims : (s?.interSelections  ?? {}),
    imgDesc:   ((log.phase1 as TradePhase1 | undefined)?.image_description ?? (s as Record<string,unknown> | undefined)?.imageDescription ?? null) as string | null,
    audit:     (log.phase10 ?? (s as Record<string,unknown> | undefined)?.auditData ?? null),
    assetName: (log.assetName ?? s?.assetName ?? (log.phase9?.[0] as TradePhase9Card | undefined)?.asset ?? '') as string,
    stateTimeline: ((log as Record<string, unknown>).state_timeline ?? []) as Array<{ state_id: string; ts: string }>,
  };
}

export function useSessionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { getAuthHeaders, showToast } = useNetraUtils();

  const session = useSelector((s: RootState) => s.session.session);
  const sessionInput = useSelector((s: RootState) => s.session.sessionInput);
  const isGuest = useSelector((s: RootState) => s.session.isGuest);
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
    strikeSelections: { impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' },
    finalCommand: null as string | null,
    netraOutput: null as RootState['analysis']['netraOutput'],
    sysRecommendation: null as unknown,
    weaponPrediction: null as RootState['analysis']['weaponPrediction'],
    selectedWeaponId: null as string | null,
    stepTimestamps: {} as Record<string, string>,
    tradeName: '',
    activeSessionId: null as number | null,
    assetName: '',
    imageDescription: null as string | null,
    auditData: null as RootState['logs']['auditData'],
    stateTimeline: [] as Array<{ state_id: string; ts: string }>,
  });

  // Keep ref in sync with selectors on every render
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const interSelections = useSelector((s: RootState) => s.analysis.interSelections);
  const strikeSelections = useSelector((s: RootState) => s.analysis.strikeSelections);
  const finalCommand = useSelector((s: RootState) => s.analysis.finalCommand);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const sysRecommendation = useSelector((s: RootState) => s.analysis.sysRecommendation);
  const weaponPrediction = useSelector((s: RootState) => s.analysis.weaponPrediction);
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
  const stepTimestamps = useSelector((s: RootState) => s.analysis.stepTimestamps);
  const tradeName = useSelector((s: RootState) => s.logs.tradeName);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const auditData = useSelector((s: RootState) => s.logs.auditData);
  const stateTimeline = useSelector((s: RootState) => s.analysis.stateTimeline);

  analysisRef.current = {
    highestStep, selections, notes, interSelections, strikeSelections,
    finalCommand, netraOutput, sysRecommendation, weaponPrediction,
    selectedWeaponId, stepTimestamps, tradeName, activeSessionId,
    assetName: session?.assetName || '', imageDescription, auditData, stateTimeline,
  };

  const resetTerminalState = useCallback(() => {
    dispatch(setHighestStep(1));
    dispatch(setCommandLocked(false));
    dispatch(setWeaponLocked(false));
    dispatch(setSelections({ realBias: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} }));
    dispatch(setNotes({ realBias: '', htfStructure: '', marketPulse: '', liquidityContext: '' }));
    dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
    dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }));
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
    dispatch(setStateTimeline([]));
  }, [dispatch]);

  const buildSessionMeta = useCallback((log: TradeLog, parentId: string | null = null, forkPoint: number | null = null): SessionMeta => ({
    id: String(log.id),
    name: log.name || String(log.id),
    parentId,
    forkPoint,
    weapon: log.session_state?.selectedWeaponId || log.weapon || null,
    command: (log.session_state?.finalCommand as SessionMeta['command']) ?? null,
    status: 'active',
    pnl: null,
    timestamp: log.timestamp || new Date().toISOString(),
  }), []);

  const loadSessionById = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/logs/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Not found');
      const log: TradeLog = await res.json();

      const r = resolveLogState(log);
      dispatch(setHighestStep(r.highestStep));
      dispatch(setSelections({ realBias: r.realBias, htfStructure: r.htfStructure, marketPulse: r.marketPulse, liquidityContext: r.liquidityCtx }));
      dispatch(setNotes({ realBias: r.note2, htfStructure: r.note3, marketPulse: r.note4mp, liquidityContext: r.note4lq }));
      dispatch(setStrikeSelections(r.strikeSel as Parameters<typeof setStrikeSelections>[0]));
      dispatch(setInterSelections(r.interSel   as Parameters<typeof setInterSelections>[0]));
      dispatch(setFinalCommand(r.finalCmd));
      dispatch(setNetraOutput(r.netraOut as Parameters<typeof setNetraOutput>[0] | null));
      dispatch(setSysRecommendation(r.sysRec));
      dispatch(setWeaponPrediction(r.wpPred as Parameters<typeof setWeaponPrediction>[0] | null));
      dispatch(setSelectedWeaponId(r.weaponId));
      dispatch(setStepTimestamps(r.stepTimestamps));
      dispatch(setTradeName(log.name || ''));
      if (r.imgDesc) dispatch(setImageDescription(r.imgDesc));
      if (r.audit)   dispatch(setAuditData(r.audit as Parameters<typeof setAuditData>[0]));
      dispatch(setStateTimeline(r.stateTimeline));
      dispatch(setSession({ userName: session?.userName || 'User', assetName: r.assetName, tradeName: log.name || '' }));
      dispatch(setActiveSessionId(log.id));
      saveState('activeSessionId', log.id);
      dispatch(setActiveView('terminal'));
      dispatch(setActiveEditLog(log));
      dispatch(setEditFormData({ entry_price: log.phase9?.[0]?.entry_price, stop_loss: log.phase9?.[0]?.stop_loss, exit_price: log.phase9?.[0]?.exit_price, outcome: log.phase9?.[0]?.outcome, trade_name: log.name }));
      dispatch(setIsLoggerOpen(true));
      dispatch(setPrepStep(2));
      dispatch(setActiveRegistryId(id));
      showToast(`Switched: ${log.name || id}`);
      navigate('/mission/pinaka');
    } catch {
      showToast('Failed to load session', 'error');
    }
  }, [dispatch, getAuthHeaders, session, navigate, showToast]);

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

  const handleGuestLogin = useCallback(() => {
    dispatch(setIsGuest(true));
    dispatch(setSession({ userName: 'Guest', assetName: null, tradeName: null }));
    dispatch(setPrepStep(1));
    navigate('/home');
  }, [dispatch, navigate]);

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
        strikeSelections: { impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' },
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
        dispatch(registerSession(buildSessionMeta(data, null, null)));
        dispatch(setActiveRegistryId(String(data.id)));
        showToast('Mission Initialized');
        navigate(sessionInput.modelName === 'trishul' ? '/mission/trishul' : '/mission/pinaka');
      })
      .catch((err: Error) => showToast(`Persistence Failure: ${err.message}`, 'error'));
  }, [dispatch, getAuthHeaders, sessionInput, session, currentModel, resetTerminalState, navigate, showToast, buildSessionMeta]);

  const resumeSession = useCallback((log: TradeLog) => {
    const r = resolveLogState(log);
    dispatch(setHighestStep(r.highestStep));
    dispatch(setSelections({ realBias: r.realBias, htfStructure: r.htfStructure, marketPulse: r.marketPulse, liquidityContext: r.liquidityCtx }));
    dispatch(setNotes({ realBias: r.note2, htfStructure: r.note3, marketPulse: r.note4mp, liquidityContext: r.note4lq }));
    dispatch(setStrikeSelections(r.strikeSel as Parameters<typeof setStrikeSelections>[0]));
    dispatch(setInterSelections(r.interSel   as Parameters<typeof setInterSelections>[0]));
    dispatch(setFinalCommand(r.finalCmd));
    dispatch(setNetraOutput(r.netraOut as Parameters<typeof setNetraOutput>[0] | null));
    dispatch(setSysRecommendation(r.sysRec));
    dispatch(setWeaponPrediction(r.wpPred as Parameters<typeof setWeaponPrediction>[0] | null));
    dispatch(setSelectedWeaponId(r.weaponId));
    dispatch(setStepTimestamps(r.stepTimestamps));
    dispatch(setTradeName(log.name || ''));
    if (r.imgDesc) dispatch(setImageDescription(r.imgDesc));
    if (r.audit)   dispatch(setAuditData(r.audit as Parameters<typeof setAuditData>[0]));
    dispatch(setStateTimeline(r.stateTimeline));
    if (window.innerWidth < 1024) dispatch(setIsLoggerOpen(false));
    dispatch(setSession({ userName: session?.userName || 'User', assetName: r.assetName, tradeName: log.name || '' }));
    dispatch(setActiveSessionId(log.id));
    saveState('activeSessionId', log.id);
    dispatch(setActiveView('terminal'));
    dispatch(setActiveEditLog(log));
    dispatch(setEditFormData({ entry_price: log.phase9?.[0]?.entry_price, stop_loss: log.phase9?.[0]?.stop_loss, exit_price: log.phase9?.[0]?.exit_price, outcome: log.phase9?.[0]?.outcome, trade_name: log.name }));
    dispatch(setIsLoggerOpen(true));
    dispatch(setPrepStep(2));
    dispatch(registerSession(buildSessionMeta(log, null, null)));
    dispatch(setActiveRegistryId(String(log.id)));
    showToast(`Resumed: ${log.name || log.id}`);
    navigate('/mission/pinaka');
  }, [dispatch, session, navigate, showToast, buildSessionMeta]);

  const forkSession = useCallback((log: TradeLog, newName: string) => {
    if (isGuest) { showToast('Demo mode — fork disabled', 'error'); return; }
    const r = resolveLogState(log);
    const finalName = newName || `FORK_${log.name || 'Trade'}`;
    const payload = {
      model_id: log.model_id || currentModel,
      username: session?.userName || 'Unknown',
      weapon: log.weapon || 'FORKED',
      protocol: 'PINAKA',
      trade_name: finalName,
      asset_ticker: r.assetName,
    };
    fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then((res) => { if (!res.ok) throw new Error('Failed to fork session'); return res.json(); })
      .then((data: TradeLog) => {
        dispatch(setHighestStep(r.highestStep));
        dispatch(setSelections({ realBias: r.realBias, htfStructure: r.htfStructure, marketPulse: r.marketPulse, liquidityContext: r.liquidityCtx }));
        dispatch(setNotes({ realBias: r.note2, htfStructure: r.note3, marketPulse: r.note4mp, liquidityContext: r.note4lq }));
        dispatch(setStrikeSelections(r.strikeSel as Parameters<typeof setStrikeSelections>[0]));
        dispatch(setInterSelections(r.interSel   as Parameters<typeof setInterSelections>[0]));
        dispatch(setFinalCommand(r.finalCmd));
        dispatch(setNetraOutput(r.netraOut as Parameters<typeof setNetraOutput>[0] | null));
        dispatch(setSysRecommendation(r.sysRec));
        dispatch(setWeaponPrediction(r.wpPred as Parameters<typeof setWeaponPrediction>[0] | null));
        dispatch(setSelectedWeaponId(r.weaponId));
        dispatch(setStepTimestamps(r.stepTimestamps));
        if (r.imgDesc) dispatch(setImageDescription(r.imgDesc));
        if (r.audit)   dispatch(setAuditData(r.audit as Parameters<typeof setAuditData>[0]));
      dispatch(setStateTimeline(r.stateTimeline));
        dispatch(setTradeName(data.name));
        dispatch(setActiveSessionId(data.id));
        saveState('activeSessionId', data.id);
        dispatch(setSession({ userName: session?.userName || 'User', assetName: r.assetName, tradeName: data.name }));
        dispatch(setActiveView('terminal'));
        dispatch(setActiveEditLog(data));
        dispatch(setEditFormData({ entry_price: log.phase9?.[0]?.entry_price, stop_loss: log.phase9?.[0]?.stop_loss, trade_name: data.name }));
        dispatch(setIsLoggerOpen(true));
        dispatch(setPrepStep(2));
        dispatch(registerSession(buildSessionMeta(log, null, null)));
        dispatch(registerSession(buildSessionMeta(data, String(log.id), null)));
        dispatch(setActiveRegistryId(String(data.id)));
        showToast(`Forked: ${data.name}`);
        navigate('/mission/pinaka');
      })
      .catch((err: Error) => showToast(`Fork Failure: ${err.message}`, 'error'));
  }, [dispatch, session, isGuest, currentModel, navigate, showToast, getAuthHeaders, buildSessionMeta]);

  const forkCurrentSession = useCallback((phaseNum: number, newName: string) => {
    if (isGuest) { showToast('Demo mode — fork disabled', 'error'); return; }
    const snap = analysisRef.current;
    if (!snap.activeSessionId) return;
    
    const defaultName = `FORK_${snap.tradeName || 'Trade'}_P${phaseNum}`;
    const finalName = newName || defaultName;
    
    const payload = {
      model_id: currentModel,
      username: session?.userName || 'Unknown',
      realBias: snap.selections.realBias ? 'FILLED' : '-',
      htfStructure: snap.selections.htfStructure ? 'FILLED' : '-',
      marketPulse: snap.selections.marketPulse ? 'FILLED' : '-',
      liquidityContext: snap.selections.liquidityContext ? 'FILLED' : '-',
      weapon: snap.selectedWeaponId || 'FORKED',
      protocol: 'PINAKA',
      trade_name: finalName,
      asset_ticker: snap.assetName || '',
      session_state: {
        highestStep: phaseNum,
        selections: snap.selections,
        notes: snap.notes,
        interSelections: snap.interSelections,
        strikeSelections: snap.strikeSelections,
        finalCommand: snap.finalCommand,
        netraOutput: snap.netraOutput,
        sysRecommendation: snap.sysRecommendation,
        selectedWeaponId: snap.selectedWeaponId,
        stepTimestamps: snap.stepTimestamps,
        tradeName: `${snap.tradeName || 'FORKED'}_P${phaseNum}_FORK`,
        assetName: snap.assetName,
      },
    };

    fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then((res) => { if (!res.ok) throw new Error('Failed to fork session'); return res.json(); })
      .then((data: TradeLog) => {
        dispatch(setHighestStep(phaseNum));
        dispatch(setSelections(snap.selections));
        dispatch(setNotes(snap.notes));
        dispatch(setInterSelections(snap.interSelections));
        dispatch(setStrikeSelections(snap.strikeSelections));
        dispatch(setFinalCommand(snap.finalCommand));
        dispatch(setNetraOutput(snap.netraOutput));
        dispatch(setSysRecommendation(snap.sysRecommendation));
        dispatch(setWeaponPrediction(snap.weaponPrediction));
        dispatch(setSelectedWeaponId(snap.selectedWeaponId));
        if (snap.imageDescription) dispatch(setImageDescription(snap.imageDescription));
        if (snap.auditData) dispatch(setAuditData(snap.auditData));
        dispatch(setStepTimestamps(snap.stepTimestamps));
        dispatch(setTradeName(data.name));
        dispatch(setActiveSessionId(data.id));
        saveState('activeSessionId', data.id);
        dispatch(setSession({ userName: session?.userName || 'User', assetName: payload.asset_ticker, tradeName: data.name }));
        dispatch(setActiveView('terminal'));
        dispatch(setActiveEditLog(data));
        dispatch(setEditFormData({ ...data.phase2, ...data.phase3, ...data.phase4, trade_name: data.name }));

        // Clear the data for the forked phase so the user starts it fresh
        const ts = { ...snap.stepTimestamps };
        if (phaseNum === 1) {
          dispatch(setSelections({ ...snap.selections, realBias: {} }));
          dispatch(setNotes({ ...snap.notes, realBias: '' }));
          delete ts.realBias;
        } else if (phaseNum === 2) {
          dispatch(setSelections({ ...snap.selections, htfStructure: {} }));
          dispatch(setNotes({ ...snap.notes, htfStructure: '' }));
          delete ts.htfStructure;
        } else if (phaseNum === 3) {
          dispatch(setSelections({ ...snap.selections, marketPulse: {}, liquidityContext: {} }));
          dispatch(setNotes({ ...snap.notes, marketPulse: '', liquidityContext: '' }));
          dispatch(setFinalCommand(null));
          dispatch(setNetraOutput(null));
          dispatch(setSysRecommendation(null));
          dispatch(setCommandLocked(false));
          dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
          dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }));
          delete ts.marketPulse;
          delete ts.liquidityContext;
        } else if (phaseNum === 4) {
          dispatch(setFinalCommand(null));
          dispatch(setNetraOutput(null));
          dispatch(setSysRecommendation(null));
          dispatch(setCommandLocked(false));
          dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
          dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }));
          dispatch(setSelectedWeaponId(null));
          dispatch(setWeaponLocked(false));
          delete ts.evaluation;
          delete ts.matrix;
        } else if (phaseNum === 5) {
          dispatch(setSelectedWeaponId(null));
          dispatch(setWeaponLocked(false));
          dispatch(setNotes({ ...snap.notes, weapon_thought: '' }));
          delete ts.armory;
        } else if (phaseNum === 6) {
          dispatch(setEditFormData({}));
          delete ts.control;
        }
        dispatch(setStepTimestamps(ts));

        // Register parent + forked child in session tree
        const parentMeta: SessionMeta = {
          id: String(snap.activeSessionId),
          name: snap.tradeName || String(snap.activeSessionId),
          parentId: null, forkPoint: null,
          weapon: snap.selectedWeaponId, command: snap.finalCommand as SessionMeta['command'],
          status: 'open', pnl: null, timestamp: new Date().toISOString(),
        };
        dispatch(registerSession(parentMeta));
        dispatch(registerSession(buildSessionMeta(data, String(snap.activeSessionId), phaseNum)));
        dispatch(setActiveRegistryId(String(data.id)));

        showToast(`Forked at Phase ${phaseNum}: ${data.name}`);
        navigate('/mission/pinaka');
      })
      .catch((err: Error) => showToast(`Fork Failure: ${err.message}`, 'error'));
  }, [dispatch, session, currentModel, navigate, showToast, getAuthHeaders, buildSessionMeta]);

  const saveSession = useCallback(() => {
    const snap = analysisRef.current;
    if (!snap.activeSessionId) return;

    // Read live trade cards from localStorage for phase9
    const phase9 = (() => {
      try {
        const raw = localStorage.getItem('netra_trade_cards_v1');
        if (!raw) return null;
        const cards = JSON.parse(raw) as Array<Record<string, unknown>>;
        const active = cards.filter(c => c.entry);
        if (!active.length) return null;
        return active.map((c, i) => ({
          trade_index:           i + 1,
          asset:                 [snap.assetName, c.assetSuffix].filter(Boolean).join(' ') || null,
          direction:             c.side,
          entry_price:           c.entry   || null,
          stop_loss:             c.sl      || null,
          quantity:              c.qty     || null,
          additional_cost:       c.cost    || null,
          t1: c.t1 || null, t2: c.t2 || null, t3: c.t3 || null, t4: c.t4 || null,
          entry_time:            c.entryTime  || null,
          exit_time:             c.exitTime   || null,
          add_entries:           c.addEntries   || [],
          partial_exits:         c.partialExits || [],
          exit_price:            c.exitPrice   || null,
          exit_type:             c.exitType    || null,
          trade_status:          c.tradeStatus || null,
          holding_time_minutes:  (() => {
            const et = c.entryTime as string; const xt = c.exitTime as string;
            if (!et || !xt) return null;
            const [eh = 0, em = 0] = et.split(':').map(Number);
            const [xh = 0, xm = 0] = xt.split(':').map(Number);
            const m = (xh * 60 + xm) - (eh * 60 + em);
            return m > 0 ? m : null;
          })(),
          note:   c.notes  || null,
          closed: c.closed || false,
        }));
      } catch { return null; }
    })();

    const payload = {
      highestStep:    snap.highestStep,
      tradeName:      snap.tradeName,
      assetName:      snap.assetName,
      stepTimestamps: snap.stepTimestamps,
      state_timeline: snap.stateTimeline,

      phase1: snap.imageDescription
        ? { image_description: snap.imageDescription }
        : null,

      phase2: snap.selections.realBias
        ? { selections: snap.selections.realBias, note: snap.notes.realBias }
        : null,

      phase3: snap.selections.htfStructure
        ? { selections: snap.selections.htfStructure, note: snap.notes.htfStructure }
        : null,

      phase4: (snap.selections.marketPulse || snap.selections.liquidityContext)
        ? {
            marketPulse:          snap.selections.marketPulse,
            liquidityContext:      snap.selections.liquidityContext,
            marketPulse_note:     snap.notes.marketPulse,
            liquidityContext_note: snap.notes.liquidityContext,
          }
        : null,

      phase5: snap.netraOutput ?? null,

      phase6: snap.finalCommand
        ? {
            command:        snap.finalCommand,
            confirmed_at:   snap.stepTimestamps?.command ?? null,
            recommendation: snap.sysRecommendation ?? null,
          }
        : null,

      phase7: snap.weaponPrediction ?? null,

      phase8: snap.selectedWeaponId
        ? {
            weapon_id:  snap.selectedWeaponId,
            dimensions: snap.finalCommand === 'STRIKE'
              ? snap.strikeSelections
              : snap.interSelections,
          }
        : null,

      phase9,

      // phase10 is written separately by useAudit after audit completes
    };

    fetch(`${API_BASE}/api/logs/${encodeURIComponent(snap.activeSessionId)}/state`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then(() => showToast('Session Saved'))
      .catch(() => showToast('Save failed', 'error'));
  // analysisRef is a ref — intentionally omitted from deps
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
    session, sessionInput, isLoggingIn, isGuest, activeSessionId: activeSessionIdVal,
    handleAuth, handleGuestLogin, initializeMission, resumeSession, forkSession, forkCurrentSession, saveSession, resetTerminalState, logout, loadSessionById,
    setSession: (v: RootState['session']['session']) => dispatch(setSession(v)),
    setSessionInput: (v: RootState['session']['sessionInput']) => dispatch(setSessionInput(v)),
  };
}
