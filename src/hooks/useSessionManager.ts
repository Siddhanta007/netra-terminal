// Hook — trade-session lifecycle: create, load, fork, persist and reset a session and its full analysis state.

import { useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { setSession, setActiveSessionId, setIsLoggingIn, setSessionInput } from '../store/slices/sessionSlice';
import { setPrepStep, setActiveView, setIsLoggerOpen, setAiPaneOpen, setMobileMenuOpen } from '../store/slices/uiSlice';
import {
  setHighestStep, setSelections, setNotes, setInterSelections, setStrikeSelections, setSaturationSelections,
  setWaitSelections,
  setRecognitionCheckpoints,
  setFinalCommand, setNetraOutput, setSelectedNetraState, setSysRecommendation, setSelectedWeaponId,
  setCommandLocked, setWeaponLocked, setStepTimestamps, setImageDescription,
  setWeaponPrediction, setStateTimeline,
  setLiveMarketContext,
  setH1Hypothesis,
  setH1Proposal,
} from '../store/slices/analysisSlice';
import { setTradeName, setActiveEditLog, setEditFormData, setAuditData, setIsAuditing } from '../store/slices/logsSlice';
import { registerSession, updateSession, setActiveRegistryId } from '../store/slices/sessionRegistrySlice';
import { saveState } from '../utils/storage';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';
import { TradeLog, SessionMeta, TradePhase2, TradePhase3, TradePhase4, TradePhase8, TradePhase9Card, TradePhase1, WaitSelections, RecognitionCheckpoint, H1Hypothesis, H2Hypothesis } from '../types';
import { buildPhase9TradeBlock, buildTradeMetadata } from '../types/tradeStorageSchema';
import { tradeCardsStorageKey } from '../features/terminal/phases/phase-10-mission-control/missionControl/helpers';
import { buildForkName } from '../utils/forkNaming';
import { aiSuggestionText, compactLatestWaitCheckpoint } from '../utils/aiContext';

type SessionClearBoundary = 'pre_session' | 'htf' | 'market_pulse' | 'decision_path' | 'pinaka_state' | 'command';

interface SaveSessionOptions {
  silent?: boolean;
  recognitionCheckpoints?: RecognitionCheckpoint[];
  highestStep?: number;
  stepTimestamps?: Record<string, string>;
  clearDownstream?: boolean;
  clearAfter?: SessionClearBoundary;
  preserveH1Proposal?: boolean;
  reopenH2?: boolean;
  selectedNetraState?: Record<string, unknown> | null;
  liveMarketContext?: Record<string, unknown>;
}

function rememberServerRevision(
  log: TradeLog,
  sessionRef: { current: string | null },
  revisionRef: { current: number },
) {
  sessionRef.current = String(log.id);
  revisionRef.current = Number(log.state_revision ?? 0);
}

function firstTradeCard(log: TradeLog): Record<string, any> | null {
  if (log.phase_9?.trade_1) {
    const block = log.phase_9.trade_1 as Record<string, any>;
    const trade = (block.trade || {}) as Record<string, any>;
    const entry = (trade.entry || {}) as Record<string, any>;
    const exit = (trade.exit || {}) as Record<string, any>;
    const stats = (block.stats || {}) as Record<string, any>;
    return {
      asset: trade.execution_instrument,
      entry_price: entry.price,
      stop_loss: entry.stop_loss,
      exit_price: exit.price,
      outcome: stats.outcome,
    };
  }
  return (log.phase9?.[0] as Record<string, any> | undefined) || null;
}

function normalizeH2Checkpoints(checkpoints: RecognitionCheckpoint[], fallbackOutput: RecognitionCheckpoint['output']): RecognitionCheckpoint[] {
  if (checkpoints.length === 0 && fallbackOutput) {
    return [{
      id: `recognition-restored-${Date.now()}`,
      sequence: 1,
      createdAt: new Date().toISOString(),
      nodeType: 'AI',
      output: fallbackOutput,
      evidence: { marketPulse: {}, liquidityContext: {} },
      selectedState: null,
      eligibility: '',
      wait: null,
      pathConfirmed: false,
      commandSelected: false,
    }];
  }
  const legacyCommand = checkpoints.find(checkpoint => checkpoint.nodeType === 'COMMAND');
  if (!legacyCommand) return checkpoints;
  const proposalIndex = checkpoints.reduce(
    (latest, checkpoint, index) => checkpoint.output ? index : latest,
    -1,
  );
  return checkpoints
    .filter(checkpoint => checkpoint.nodeType !== 'COMMAND')
    .map((checkpoint, index) => index === proposalIndex
      ? {
          ...checkpoint,
          pathConfirmed: !!legacyCommand.pathConfirmed,
          commandSelected: !!legacyCommand.commandSelected,
          selectedState: legacyCommand.selectedState || checkpoint.selectedState,
        }
      : checkpoint
    );
}

// Resolve session fields from new phase structure (primary) or old session_state blob (fallback)
function resolveLogState(log: TradeLog) {
  const s = log.session_state;
  const firstTrade = firstTradeCard(log);
  const p2 = log.phase2 as TradePhase2 | undefined;
  const p3 = log.phase3 as TradePhase3 | undefined;
  const p4 = log.phase4 as TradePhase4 | undefined;
  const p8 = log.phase8 as TradePhase8 | undefined;
  const netraOut = (log.phase5 ?? s?.netraOutput ?? null) as RecognitionCheckpoint['output'];
  const h2Current = (log.hypothesis_chain?.h2?.current?.status === 'CONFIRMED'
    ? log.hypothesis_chain.h2.current
    : null) as H2Hypothesis | null;
  const h2Proposal = (log.hypothesis_chain?.h2?.proposal
    ?? (s as Record<string, unknown> | undefined)?.hypothesisH2Proposal
    ?? null) as H2Hypothesis | null;
  const finalCmd = (h2Current?.command ?? h2Proposal?.command
    ?? (log.phase6 as Record<string,unknown> | undefined)?.command
    ?? s?.finalCommand ?? null) as string | null;
  const selectedNetraState = ((log.phase6 as Record<string, unknown> | undefined)?.selected_state as Record<string, unknown> | undefined)
    ?? ((s as Record<string, unknown> | undefined)?.selectedNetraState as Record<string, unknown> | undefined)
    ?? null;
  const dims = p8?.dimensions ?? {};
  return {
    highestStep:   (log.highestStep  ?? s?.highestStep  ?? 1) as number,
    stepTimestamps:(log.stepTimestamps ?? s?.stepTimestamps ?? {}) as Record<string, string>,
    preSessionContext: p2?.selections ?? (s?.selections?.preSessionContext ?? (s?.selections as any)?.realBias ?? {}) as Record<string,string>,
    htfStructure:  p3?.selections ?? (s?.selections?.htfStructure ?? {}) as Record<string,string>,
    marketPulse:   p4?.marketPulse ?? (s?.selections?.marketPulse ?? {}) as Record<string,string>,
    liquidityCtx:  p4?.liquidityContext ?? (s?.selections?.liquidityContext ?? {}) as Record<string,string>,
    note2:  p2?.note ?? s?.notes?.preSessionContext ?? (s?.notes as any)?.realBias ?? '',
    note3:  p3?.note ?? s?.notes?.htfStructure ?? '',
    note4mp:p4?.marketPulse_note ?? s?.notes?.marketPulse ?? '',
    note4lq:p4?.liquidityContext_note ?? s?.notes?.liquidityContext ?? '',
    noteCommand: h2Current?.hypothesis ?? h2Proposal?.hypothesis ?? s?.notes?.command ?? '',
    netraOut,
    sysRec:    ((log.phase6 as Record<string,unknown> | undefined)?.recommendation ?? s?.sysRecommendation ?? null),
    selectedNetraState,
    finalCmd,
    wpPred:    (log.phase7 ?? s?.weaponPrediction ?? null),
    weaponId:  (p8?.weapon_id ?? s?.selectedWeaponId ?? null) as string | null,
    strikeSel: finalCmd === 'STRIKE'       ? dims : (s?.strikeSelections ?? {}),
    interSel:  finalCmd === 'INTERCEPTION' ? dims : (s?.interSelections  ?? {}),
    saturationSel: finalCmd === 'SATURATION' ? dims : ((s as Record<string, any> | undefined)?.saturationSelections ?? {}),
    waitSel: (((log.phase6 as Record<string, unknown> | undefined)?.wait as WaitSelections | undefined)
      ?? ((s as Record<string, unknown> | undefined)?.waitSelections as WaitSelections | undefined)
      ?? {}),
    recognitionCheckpoints: normalizeH2Checkpoints((((log.phase6 as Record<string, unknown> | undefined)?.recognition_checkpoints as RecognitionCheckpoint[] | undefined)
      ?? ((s as Record<string, unknown> | undefined)?.recognitionCheckpoints as RecognitionCheckpoint[] | undefined)
      ?? []), netraOut),
    imgDesc:   ((log.phase1 as TradePhase1 | undefined)?.image_description ?? (s as Record<string,unknown> | undefined)?.imageDescription ?? null) as string | null,
    audit:     (log.phase10 ?? (s as Record<string,unknown> | undefined)?.auditData ?? null),
    assetName: (log.assetName ?? s?.assetName ?? (firstTrade as TradePhase9Card | undefined)?.asset ?? '') as string,
    stateTimeline: ((log as Record<string, unknown>).state_timeline ?? []) as Array<{ state_id: string; ts: string }>,
    h1Proposal: (log.hypothesis_chain?.h1?.proposal
      ?? (log.hypothesis_chain?.h1?.current?.status !== 'CONFIRMED' ? log.hypothesis_chain?.h1?.current : null)
      ?? s?.hypothesisH1Proposal
      ?? (s?.hypothesisH1?.status !== 'CONFIRMED' ? s?.hypothesisH1 : null)
      ?? null) as H1Hypothesis | null,
    h1Hypothesis: (
      log.hypothesis_chain?.h1?.current?.status === 'CONFIRMED'
        ? log.hypothesis_chain.h1.current
        : s?.hypothesisH1?.status === 'CONFIRMED'
          ? s.hypothesisH1
          : null
    ) as H1Hypothesis | null,
    h2Confirmed: !!h2Current,
  };
}

export function useSessionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isInitializingMission, setIsInitializingMission] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const initializationInFlightRef = useRef(false);
  const { getAuthHeaders, showToast } = useNetraUtils();

  const session = useSelector((s: RootState) => s.session.session);
  const sessionInput = useSelector((s: RootState) => s.session.sessionInput);
  const currentModel = useSelector((s: RootState) => s.model.currentModel);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);

  // Ref keeps a fresh copy of all session state so saveSession() always reads
  // current values without a stale closure, regardless of dependency arrays.
  const analysisRef = useRef({
    highestStep: 1,
    selections: { preSessionContext: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} },
    notes: { preSessionContext: '', htfStructure: '', marketPulse: '', liquidityContext: '' },
    interSelections: { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' },
    strikeSelections: { impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' },
    saturationSelections: {} as Record<string, string>,
    waitSelections: {} as WaitSelections,
    recognitionCheckpoints: [] as RecognitionCheckpoint[],
    finalCommand: null as string | null,
    netraOutput: null as RootState['analysis']['netraOutput'],
    selectedNetraState: null as RootState['analysis']['selectedNetraState'],
    sysRecommendation: null as unknown,
    weaponPrediction: null as RootState['analysis']['weaponPrediction'],
    selectedWeaponId: null as string | null,
    stepTimestamps: {} as Record<string, string>,
    tradeName: '',
    activeSessionId: null as string | null,
    assetName: '',
    imageDescription: null as string | null,
    auditData: null as RootState['logs']['auditData'],
    stateTimeline: [] as Array<{ state_id: string; ts: string }>,
    liveMarketContext: {} as Record<string, unknown>,
    h1Hypothesis: null as H1Hypothesis | null,
    h1Proposal: null as H1Hypothesis | null,
  });
  const saveQueueRef = useRef<Promise<boolean>>(Promise.resolve(true));
  const revisionSessionIdRef = useRef<string | null>(null);
  const stateRevisionRef = useRef(0);

  // Keep ref in sync with selectors on every render
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const interSelections = useSelector((s: RootState) => s.analysis.interSelections);
  const strikeSelections = useSelector((s: RootState) => s.analysis.strikeSelections);
  const saturationSelections = useSelector((s: RootState) => s.analysis.saturationSelections);
  const waitSelections = useSelector((s: RootState) => s.analysis.waitSelections);
  const recognitionCheckpoints = useSelector((s: RootState) => s.analysis.recognitionCheckpoints);
  const finalCommand = useSelector((s: RootState) => s.analysis.finalCommand);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const selectedNetraState = useSelector((s: RootState) => s.analysis.selectedNetraState);
  const sysRecommendation = useSelector((s: RootState) => s.analysis.sysRecommendation);
  const weaponPrediction = useSelector((s: RootState) => s.analysis.weaponPrediction);
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
  const stepTimestamps = useSelector((s: RootState) => s.analysis.stepTimestamps);
  const tradeName = useSelector((s: RootState) => s.logs.tradeName);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const auditData = useSelector((s: RootState) => s.logs.auditData);
  const stateTimeline = useSelector((s: RootState) => s.analysis.stateTimeline);
  const liveMarketContext = useSelector((s: RootState) => s.analysis.liveMarketContext);
  const h1Hypothesis = useSelector((s: RootState) => s.analysis.h1Hypothesis);
  const h1Proposal = useSelector((s: RootState) => s.analysis.h1Proposal);
  const sysData = useSelector((s: RootState) => s.model.sysData);

  analysisRef.current = {
    highestStep, selections, notes, interSelections, strikeSelections, saturationSelections, waitSelections, recognitionCheckpoints,
    finalCommand, netraOutput, selectedNetraState, sysRecommendation, weaponPrediction,
    selectedWeaponId, stepTimestamps, tradeName, activeSessionId,
    assetName: session?.assetName || '', imageDescription, auditData, stateTimeline, liveMarketContext, h1Hypothesis, h1Proposal,
  };

  const resetTerminalState = useCallback(() => {
    dispatch(setHighestStep(1));
    dispatch(setCommandLocked(false));
    dispatch(setWeaponLocked(false));
    dispatch(setSelections({ preSessionContext: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} }));
    dispatch(setNotes({ preSessionContext: '', htfStructure: '', marketPulse: '', liquidityContext: '' }));
    dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
    dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }));
    dispatch(setSaturationSelections({}));
    dispatch(setWaitSelections({
      waitingFor: '', referenceLocation: '', requiredResolution: '', developmentStage: '',
      institutionalSignature: '', validityHorizon: '', resolutionStatus: 'OPEN',
      waitNote: '', resolutionEvent: '', resolutionNote: '', openedAt: '', resolvedAt: '',
    }));
    dispatch(setRecognitionCheckpoints([]));
    dispatch(setFinalCommand(null));
    dispatch(setNetraOutput(null));
    dispatch(setSelectedNetraState(null));
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
    dispatch(setLiveMarketContext({}));
    dispatch(setH1Hypothesis(null));
    dispatch(setH1Proposal(null));
  }, [dispatch]);

  const buildSessionMeta = useCallback((log: TradeLog, parentId: string | null = null, forkPoint: number | string | null = null): SessionMeta => ({
    id: String(log.id),
    name: log.name || String(log.id),
    parentId: (log as any).branch?.parent_session_id ?? parentId,
    forkPoint: (log as any).branch?.fork?.record_key ?? forkPoint,
    rootId: (log as any).branch?.root_session_id ?? String(log.id),
    fork: (log as any).branch?.fork ? {
      recordKey: (log as any).branch.fork.record_key,
      label: (log as any).branch.fork.label,
      createdAt: (log as any).branch.fork.created_at,
    } : null,
    weapon: log.session_state?.selectedWeaponId || log.weapon || null,
    command: (log.session_state?.finalCommand as SessionMeta['command']) ?? null,
    status: 'active',
    pnl: null,
    timestamp: log.timestamp || new Date().toISOString(),
  }), []);

  const loadSessionById = useCallback(async (id: string) => {
    setIsLoadingSession(true);
    try {
      const res = await fetch(`${API_BASE}/api/logs/${encodeURIComponent(id)}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Not found');
      const log: TradeLog = await res.json();
      rememberServerRevision(log, revisionSessionIdRef, stateRevisionRef);

      const r = resolveLogState(log);
      dispatch(setHighestStep(r.highestStep));
      dispatch(setSelections({ preSessionContext: r.preSessionContext, htfStructure: r.htfStructure, marketPulse: r.marketPulse, liquidityContext: r.liquidityCtx }));
      dispatch(setNotes({ preSessionContext: r.note2, htfStructure: r.note3, marketPulse: r.note4mp, liquidityContext: r.note4lq, command: r.noteCommand }));
      dispatch(setStrikeSelections(r.strikeSel as Parameters<typeof setStrikeSelections>[0]));
      dispatch(setInterSelections(r.interSel   as Parameters<typeof setInterSelections>[0]));
      dispatch(setSaturationSelections(r.saturationSel));
      dispatch(setWaitSelections(r.waitSel));
      dispatch(setRecognitionCheckpoints(r.recognitionCheckpoints));
      dispatch(setFinalCommand(r.finalCmd));
      dispatch(setCommandLocked(r.h2Confirmed));
      dispatch(setNetraOutput(r.netraOut as Parameters<typeof setNetraOutput>[0] | null));
      dispatch(setSelectedNetraState(r.selectedNetraState));
      dispatch(setSysRecommendation(r.sysRec));
      dispatch(setWeaponPrediction(r.wpPred as Parameters<typeof setWeaponPrediction>[0] | null));
      dispatch(setSelectedWeaponId(r.weaponId));
      dispatch(setWeaponLocked(Boolean(r.weaponId)));
      dispatch(setStepTimestamps(r.stepTimestamps));
      dispatch(setTradeName(log.name || ''));
      if (r.imgDesc) dispatch(setImageDescription(r.imgDesc));
      if (r.audit)   dispatch(setAuditData(r.audit as Parameters<typeof setAuditData>[0]));
      dispatch(setStateTimeline(r.stateTimeline));
      dispatch(setH1Hypothesis(r.h1Hypothesis));
      dispatch(setH1Proposal(r.h1Proposal));
      dispatch(setSession({ ...(session || {}), userName: session?.userName || 'User', assetName: r.assetName, tradeName: log.name || '' }));
      dispatch(setActiveSessionId(log.id));
      saveState('activeSessionId', log.id);
      dispatch(setActiveView('terminal'));
      dispatch(setActiveEditLog(log));
      const firstTrade = firstTradeCard(log);
      dispatch(setEditFormData({ entry_price: firstTrade?.entry_price, stop_loss: firstTrade?.stop_loss, exit_price: firstTrade?.exit_price, outcome: firstTrade?.outcome, trade_name: log.name }));
      dispatch(setIsLoggerOpen(true));
      dispatch(setPrepStep(2));
      dispatch(setActiveRegistryId(id));
      showToast(`Switched: ${log.name || id}`);
      navigate('/mission/pinaka');
    } catch {
      showToast('Failed to load session', 'error');
    } finally {
      setIsLoadingSession(false);
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
      .then((data: {
        user: string;
        display_name?: string;
        email?: string;
        phone?: string;
        broker?: string;
        role: string;
        groups?: Array<{ group_key: string; group_name: string; role: string; permissions?: Record<string, unknown> }>;
        allowed_models: string[];
        allowed_pages: string[];
        allowed_teams?: string[];
        access_token: string;
      }) => {
        const sessObj = {
          userName: data.user,
          assetName: null,
          tradeName: null,
          displayName: data.display_name || data.user,
          email: data.email || '',
          phone: data.phone || '',
          broker: data.broker || '',
          role: data.role,
          groups: data.groups || [],
          allowedModels: data.allowed_models,
          allowedPages: data.allowed_pages,
          allowedTeams: data.allowed_teams || [],
        };
        localStorage.setItem('netra_token', data.access_token);
        localStorage.setItem('netra_session', JSON.stringify(sessObj));
        dispatch(setSession(sessObj));
        dispatch(setPrepStep(1));
        const requestedPath = window.location.pathname;
        navigate(requestedPath === '/' || requestedPath === '/login' ? '/home' : requestedPath, { replace: true });
      })
      .catch((err: Error) => showToast(err.message, 'error'))
      .finally(() => dispatch(setIsLoggingIn(false)));
  }, [dispatch, getAuthHeaders, sessionInput, navigate, showToast]);

  const initializeMission = useCallback(() => {
    if (initializationInFlightRef.current) return;
    if (!sessionInput.tradeName || !sessionInput.assetName) {
      showToast('Trade Info Required', 'error');
      return;
    }
    initializationInFlightRef.current = true;
    setIsInitializingMission(true);
    resetTerminalState();
    const payload = {
      model_id: currentModel,
      username: session?.userName || 'Unknown',
      preSessionContext: '-', htfStructure: '-', marketPulse: '-', liquidityContext: '-',
      weapon: 'INITIALIZING',
      protocol: sessionInput.modelName === 'trishul' ? 'TRISHUL' : 'PINAKA',
      trade_name: sessionInput.tradeName,
      asset_ticker: sessionInput.assetName,
      asset_class: sessionInput.assetClass || 'Index',
      session_state: {
        highestStep: 1,
        selections: { preSessionContext: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} },
        notes: { preSessionContext: '', htfStructure: '', marketPulse: '', liquidityContext: '' },
        interSelections: { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' },
        strikeSelections: { impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' },
        finalCommand: null, netraOutput: null, sysRecommendation: null,
        selectedNetraState: null,
        selectedWeaponId: null, stepTimestamps: {},
        tradeName: sessionInput.tradeName, assetName: sessionInput.assetName,
        assetClass: sessionInput.assetClass || 'Index',
      },
    };
    fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then((res) => { if (!res.ok) throw new Error('Schema Validation Failed'); return res.json(); })
      .then((data: TradeLog) => {
        rememberServerRevision(data, revisionSessionIdRef, stateRevisionRef);
        dispatch(setActiveSessionId(data.id));
        dispatch(setTradeName(data.name));
        dispatch(setSession({ ...session!, assetName: sessionInput.assetName, tradeName: sessionInput.tradeName }));
        dispatch(setIsLoggerOpen(true));
        dispatch(setAiPaneOpen(false));
        dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '', assetClass: 'Index' }));
        dispatch(setPrepStep(2));
        dispatch(setActiveView(sessionInput.modelName === 'trishul' ? 'trishul' : 'terminal'));
        dispatch(registerSession(buildSessionMeta(data, null, null)));
        dispatch(setActiveRegistryId(String(data.id)));
        showToast('Mission Initialized');
        navigate(sessionInput.modelName === 'trishul' ? '/mission/trishul' : '/mission/pinaka');
      })
      .catch((err: Error) => showToast(`Persistence Failure: ${err.message}`, 'error'))
      .finally(() => {
        initializationInFlightRef.current = false;
        setIsInitializingMission(false);
      });
  }, [dispatch, getAuthHeaders, sessionInput, session, currentModel, resetTerminalState, navigate, showToast, buildSessionMeta]);

  const resumeSession = useCallback((log: TradeLog) => {
    rememberServerRevision(log, revisionSessionIdRef, stateRevisionRef);
    const r = resolveLogState(log);
    dispatch(setHighestStep(r.highestStep));
    dispatch(setSelections({ preSessionContext: r.preSessionContext, htfStructure: r.htfStructure, marketPulse: r.marketPulse, liquidityContext: r.liquidityCtx }));
    dispatch(setNotes({ preSessionContext: r.note2, htfStructure: r.note3, marketPulse: r.note4mp, liquidityContext: r.note4lq, command: r.noteCommand }));
    dispatch(setStrikeSelections(r.strikeSel as Parameters<typeof setStrikeSelections>[0]));
    dispatch(setInterSelections(r.interSel   as Parameters<typeof setInterSelections>[0]));
    dispatch(setSaturationSelections(r.saturationSel));
    dispatch(setWaitSelections(r.waitSel));
    dispatch(setRecognitionCheckpoints(r.recognitionCheckpoints));
    dispatch(setFinalCommand(r.finalCmd));
    dispatch(setCommandLocked(r.h2Confirmed));
    dispatch(setNetraOutput(r.netraOut as Parameters<typeof setNetraOutput>[0] | null));
    dispatch(setSelectedNetraState(r.selectedNetraState));
    dispatch(setSysRecommendation(r.sysRec));
    dispatch(setWeaponPrediction(r.wpPred as Parameters<typeof setWeaponPrediction>[0] | null));
    dispatch(setSelectedWeaponId(r.weaponId));
    dispatch(setWeaponLocked(Boolean(r.weaponId)));
    dispatch(setStepTimestamps(r.stepTimestamps));
    dispatch(setTradeName(log.name || ''));
    if (r.imgDesc) dispatch(setImageDescription(r.imgDesc));
    if (r.audit)   dispatch(setAuditData(r.audit as Parameters<typeof setAuditData>[0]));
    dispatch(setStateTimeline(r.stateTimeline));
    dispatch(setH1Hypothesis(r.h1Hypothesis));
    dispatch(setH1Proposal(r.h1Proposal));
    if (window.innerWidth < 1024) dispatch(setIsLoggerOpen(false));
    dispatch(setSession({ ...(session || {}), userName: session?.userName || 'User', assetName: r.assetName, tradeName: log.name || '' }));
    dispatch(setActiveSessionId(log.id));
    saveState('activeSessionId', log.id);
    dispatch(setActiveView('terminal'));
    dispatch(setActiveEditLog(log));
    const firstTrade = firstTradeCard(log);
    dispatch(setEditFormData({ entry_price: firstTrade?.entry_price, stop_loss: firstTrade?.stop_loss, exit_price: firstTrade?.exit_price, outcome: firstTrade?.outcome, trade_name: log.name }));
    dispatch(setIsLoggerOpen(true));
    dispatch(setPrepStep(2));
    dispatch(registerSession(buildSessionMeta(log, null, null)));
    dispatch(setActiveRegistryId(String(log.id)));
    showToast(`Resumed: ${log.name || log.id}`);
    navigate('/mission/pinaka');
  }, [dispatch, session, navigate, showToast, buildSessionMeta]);

  const forkSession = useCallback((log: TradeLog, newName: string): Promise<boolean> => {
    const r = resolveLogState(log);
    const finalName = newName || buildForkName(log.name, 'Manual Branch');
    const payload = {
      model_id: log.model_id || currentModel,
      username: session?.userName || 'Unknown',
      weapon: log.weapon || 'FORKED',
      protocol: 'PINAKA',
      trade_name: finalName,
      asset_ticker: r.assetName,
      branch: {
        parent_session_id: String(log.id),
        root_session_id: (log as any).branch?.root_session_id || String(log.id),
        fork: { record_key: 'manual_branch', label: 'Manual branch', created_at: new Date().toISOString() },
      },
    };
    return fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then((res) => { if (!res.ok) throw new Error('Failed to fork session'); return res.json(); })
      .then((data: TradeLog) => {
        rememberServerRevision(data, revisionSessionIdRef, stateRevisionRef);
        dispatch(setHighestStep(r.highestStep));
        dispatch(setSelections({ preSessionContext: r.preSessionContext, htfStructure: r.htfStructure, marketPulse: r.marketPulse, liquidityContext: r.liquidityCtx }));
        dispatch(setNotes({ preSessionContext: r.note2, htfStructure: r.note3, marketPulse: r.note4mp, liquidityContext: r.note4lq, command: r.noteCommand }));
        dispatch(setStrikeSelections(r.strikeSel as Parameters<typeof setStrikeSelections>[0]));
        dispatch(setInterSelections(r.interSel   as Parameters<typeof setInterSelections>[0]));
        dispatch(setSaturationSelections(r.saturationSel));
        dispatch(setWaitSelections(r.waitSel));
        dispatch(setRecognitionCheckpoints(r.recognitionCheckpoints));
        dispatch(setFinalCommand(r.finalCmd));
        dispatch(setCommandLocked(r.h2Confirmed));
        dispatch(setNetraOutput(r.netraOut as Parameters<typeof setNetraOutput>[0] | null));
        dispatch(setSelectedNetraState(r.selectedNetraState));
        dispatch(setSysRecommendation(r.sysRec));
        dispatch(setWeaponPrediction(r.wpPred as Parameters<typeof setWeaponPrediction>[0] | null));
        dispatch(setSelectedWeaponId(r.weaponId));
        dispatch(setWeaponLocked(Boolean(r.weaponId)));
        dispatch(setStepTimestamps(r.stepTimestamps));
        if (r.imgDesc) dispatch(setImageDescription(r.imgDesc));
        if (r.audit)   dispatch(setAuditData(r.audit as Parameters<typeof setAuditData>[0]));
        dispatch(setStateTimeline(r.stateTimeline));
        dispatch(setH1Hypothesis(r.h1Hypothesis));
        dispatch(setH1Proposal(r.h1Proposal));
        dispatch(setTradeName(data.name));
        dispatch(setActiveSessionId(data.id));
        saveState('activeSessionId', data.id);
        dispatch(setSession({ ...(session || {}), userName: session?.userName || 'User', assetName: r.assetName, tradeName: data.name }));
        dispatch(setActiveView('terminal'));
        dispatch(setActiveEditLog(data));
        const firstTrade = firstTradeCard(log);
        dispatch(setEditFormData({ entry_price: firstTrade?.entry_price, stop_loss: firstTrade?.stop_loss, trade_name: data.name }));
        dispatch(setIsLoggerOpen(true));
        dispatch(setPrepStep(2));
        dispatch(registerSession(buildSessionMeta(log, null, null)));
        dispatch(registerSession(buildSessionMeta(data, String(log.id), null)));
        dispatch(setActiveRegistryId(String(data.id)));
        showToast(`Forked: ${data.name}`);
        navigate('/mission/pinaka');
        return true;
      })
      .catch((err: Error) => {
        showToast(`Fork Failure: ${err.message}`, 'error');
        return false;
      });
  }, [dispatch, session, currentModel, navigate, showToast, getAuthHeaders, buildSessionMeta]);

  const forkCurrentSession = useCallback((phaseNum: number, newName: string, forkOverride?: { recordKey: string; label: string; clearSelectionKeys?: string[] }): Promise<boolean> => {
    const snap = analysisRef.current;
    if (!snap.activeSessionId) return Promise.resolve(false);
    
    const defaultName = buildForkName(snap.tradeName, forkOverride?.label || `Phase ${phaseNum}`);
    const finalName = newName || defaultName;
    
    const payload = {
      model_id: currentModel,
      username: session?.userName || 'Unknown',
      preSessionContext: snap.selections.preSessionContext ? 'FILLED' : '-',
      htfStructure: snap.selections.htfStructure ? 'FILLED' : '-',
      marketPulse: snap.selections.marketPulse ? 'FILLED' : '-',
      liquidityContext: snap.selections.liquidityContext ? 'FILLED' : '-',
      weapon: snap.selectedWeaponId || 'FORKED',
      protocol: 'PINAKA',
      trade_name: finalName,
      asset_ticker: snap.assetName || '',
      branch: {
        parent_session_id: String(snap.activeSessionId),
        root_session_id: (activeEditLog as any)?.branch?.root_session_id || String(snap.activeSessionId),
        fork: {
          record_key: forkOverride?.recordKey || ({ 1: 'pre_session_context', 2: 'htf_structure', 3: 'auction_state_events', 4: 'command_dimensions', 5: 'state_dimensions', 6: 'trade_execution' } as Record<number, string>)[phaseNum] || 'market_snapshot',
          label: forkOverride?.label || `Fork at ${({ 1: 'Super HTF Structure', 2: 'HTF Structure', 3: 'Auction State Events', 4: 'Command Dimensions', 5: 'State Dimensions', 6: 'Trade Execution' } as Record<number, string>)[phaseNum] || 'Market Snapshot'}`,
          clear_selection_keys: forkOverride?.clearSelectionKeys || [],
          created_at: new Date().toISOString(),
        },
      },
      session_state: {
        highestStep: phaseNum,
        selections: snap.selections,
        notes: snap.notes,
        interSelections: snap.interSelections,
        strikeSelections: snap.strikeSelections,
        finalCommand: snap.finalCommand,
        netraOutput: snap.netraOutput,
        sysRecommendation: snap.sysRecommendation,
        selectedNetraState: snap.selectedNetraState,
        recognitionCheckpoints: snap.recognitionCheckpoints,
        hypothesisH1: snap.h1Hypothesis,
        hypothesisH1Proposal: snap.h1Proposal,
        selectedWeaponId: snap.selectedWeaponId,
        stepTimestamps: snap.stepTimestamps,
        tradeName: `${snap.tradeName || 'FORKED'}_P${phaseNum}_FORK`,
        assetName: snap.assetName,
      },
    };

    return fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then((res) => { if (!res.ok) throw new Error('Failed to fork session'); return res.json(); })
      .then((data: TradeLog) => {
        rememberServerRevision(data, revisionSessionIdRef, stateRevisionRef);
        dispatch(setHighestStep(phaseNum));
        dispatch(setSelections(snap.selections));
        dispatch(setNotes(snap.notes));
        dispatch(setInterSelections(snap.interSelections));
        dispatch(setStrikeSelections(snap.strikeSelections));
        dispatch(setSaturationSelections(snap.saturationSelections));
        dispatch(setWaitSelections(snap.waitSelections));
        dispatch(setRecognitionCheckpoints(snap.recognitionCheckpoints));
        dispatch(setH1Hypothesis(snap.h1Hypothesis));
        dispatch(setH1Proposal(snap.h1Proposal));
        dispatch(setFinalCommand(snap.finalCommand));
        dispatch(setNetraOutput(snap.netraOutput));
        dispatch(setSelectedNetraState(snap.selectedNetraState));
        dispatch(setSysRecommendation(snap.sysRecommendation));
        dispatch(setWeaponPrediction(snap.weaponPrediction));
        dispatch(setSelectedWeaponId(snap.selectedWeaponId));
        dispatch(setWeaponLocked(Boolean(snap.selectedWeaponId)));
        if (snap.imageDescription) dispatch(setImageDescription(snap.imageDescription));
        if (snap.auditData) dispatch(setAuditData(snap.auditData));
        dispatch(setStepTimestamps(snap.stepTimestamps));
        dispatch(setTradeName(data.name));
        dispatch(setActiveSessionId(data.id));
        saveState('activeSessionId', data.id);
        dispatch(setSession({ ...(session || {}), userName: session?.userName || 'User', assetName: payload.asset_ticker, tradeName: data.name }));
        dispatch(setActiveView('terminal'));
        dispatch(setActiveEditLog(data));
        dispatch(setEditFormData({ ...data.phase2, ...data.phase3, ...data.phase4, trade_name: data.name }));

        // Clear the data for the forked phase so the user starts it fresh
        const ts = { ...snap.stepTimestamps };
        const forkKey = forkOverride?.recordKey;
        const emptyWait: WaitSelections = {
          waitingFor: '', referenceLocation: '', requiredResolution: '', developmentStage: '',
          institutionalSignature: '', validityHorizon: '', resolutionStatus: 'OPEN',
          waitNote: '', resolutionEvent: '', resolutionNote: '', openedAt: '', resolvedAt: '',
        };
        const clearExecutionPath = () => {
          dispatch(setFinalCommand(null));
          dispatch(setNetraOutput(null));
          dispatch(setSelectedNetraState(null));
          dispatch(setSysRecommendation(null));
          dispatch(setRecognitionCheckpoints([]));
          dispatch(setWaitSelections(emptyWait));
          dispatch(setCommandLocked(false));
          dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
          dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }));
          dispatch(setSaturationSelections({}));
          dispatch(setWeaponPrediction(null));
          dispatch(setSelectedWeaponId(null));
          dispatch(setWeaponLocked(false));
          dispatch(setAuditData(null));
        };

        if (forkKey === 'hypothesis_h1') {
          dispatch(setSelections({ ...snap.selections, marketPulse: {}, liquidityContext: {} }));
          dispatch(setNotes({ ...snap.notes, marketPulse: '', liquidityContext: '', command: '' }));
          dispatch(setH1Hypothesis(null));
          dispatch(setH1Proposal(null));
          clearExecutionPath();
          for (const key of ['hypothesisH1', 'marketPulse', 'liquidityContext', 'evaluation', 'command', 'matrix', 'armory', 'control']) delete ts[key];
        } else if (forkKey === 'hypothesis_h2') {
          dispatch(setNotes({ ...snap.notes, command: '' }));
          clearExecutionPath();
          for (const key of ['hypothesisH2', 'evaluation', 'command', 'matrix', 'armory', 'control']) delete ts[key];
        } else if (phaseNum === 1) {
          dispatch(setSelections({ ...snap.selections, preSessionContext: {} }));
          dispatch(setNotes({ ...snap.notes, preSessionContext: '' }));
          delete ts.preSessionContext;
        } else if (phaseNum === 2) {
          const htfEventsFork = forkOverride?.recordKey === 'htf_events';
          const inheritedHtf = htfEventsFork
            ? Object.fromEntries(Object.entries(snap.selections.htfStructure || {}).filter(([key]) => !forkOverride?.clearSelectionKeys?.includes(key)))
            : {};
          dispatch(setSelections({ ...snap.selections, htfStructure: inheritedHtf, marketPulse: {}, liquidityContext: {} }));
          if (!htfEventsFork) dispatch(setNotes({ ...snap.notes, htfStructure: '' }));
          dispatch(setNotes({ ...snap.notes, marketPulse: '', liquidityContext: '', ...(htfEventsFork ? {} : { htfStructure: '' }) }));
          dispatch(setFinalCommand(null));
          dispatch(setNetraOutput(null));
          dispatch(setSelectedNetraState(null));
          dispatch(setSysRecommendation(null));
          dispatch(setCommandLocked(false));
          dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
          dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }));
          dispatch(setSelectedWeaponId(null));
          dispatch(setWeaponLocked(false));
          dispatch(setH1Hypothesis(null));
          dispatch(setH1Proposal(null));
          delete ts.hypothesisH1;
          delete ts.htfStructure;
          delete ts.marketPulse;
          delete ts.liquidityContext;
        } else if (phaseNum === 3) {
          const marketForkKey = forkOverride?.recordKey;
          const marketComponents = sysData?.marketPulse?.dimensions || [];
          const forkIndex = marketComponents.findIndex(component => component.recordKey === marketForkKey);
          const upstreamComponents = forkIndex >= 0 ? marketComponents.slice(0, forkIndex) : [];
          const configuredKeys = (target: 'marketPulse' | 'liquidityContext') => new Set(
            upstreamComponents
              .filter(component => (component.selectionTarget === 'liquidityContext' ? 'liquidityContext' : 'marketPulse') === target)
              .flatMap(component => [
                ...(component.selectionIdKey ? [component.selectionIdKey] : []),
                ...(component.selectionValueKey ? [component.selectionValueKey] : []),
                ...(component.dimensions || []).flatMap(dimension => [dimension.id, ...(dimension.selectionAliases || [])]),
              ]),
          );
          const inheritedMarketKeys = configuredKeys('marketPulse');
          const inheritedLiquidityKeys = configuredKeys('liquidityContext');
          const inheritedMarketPulse = Object.fromEntries(
            Object.entries(snap.selections.marketPulse || {}).filter(([key]) => inheritedMarketKeys.has(key)),
          );
          const inheritedLiquidity = Object.fromEntries(
            Object.entries(snap.selections.liquidityContext || {}).filter(([key]) => inheritedLiquidityKeys.has(key)),
          );
          dispatch(setSelections({
            ...snap.selections,
            marketPulse: inheritedMarketPulse,
            liquidityContext: inheritedLiquidity,
          }));
          dispatch(setNotes({
            ...snap.notes,
            marketPulse: Object.keys(inheritedMarketPulse).length ? snap.notes.marketPulse : '',
            liquidityContext: Object.keys(inheritedLiquidity).length ? snap.notes.liquidityContext : '',
          }));
          dispatch(setFinalCommand(null));
          dispatch(setNetraOutput(null));
          dispatch(setSelectedNetraState(null));
          dispatch(setSysRecommendation(null));
          dispatch(setCommandLocked(false));
          dispatch(setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
          dispatch(setStrikeSelections({ impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }));
          dispatch(setSaturationSelections({}));
          dispatch(setSelectedWeaponId(null));
          dispatch(setWeaponLocked(false));
          delete ts.marketPulse;
          delete ts.liquidityContext;
        } else if (phaseNum === 4) {
          const eventKeys = new Set(forkOverride?.clearSelectionKeys || []);
          const retainUpstreamDimensions = forkOverride?.recordKey === 'state_events';
          const inheritBeforeEvents = <T extends Record<string, string | undefined>>(values: T): T => (
            retainUpstreamDimensions
              ? Object.fromEntries(Object.entries(values).filter(([key]) => !eventKeys.has(key))) as T
              : {} as T
          );
          // Command and Pinaka State are upstream of both matrix fork points.
          // Only the matrix record and everything below it diverge.
          dispatch(setSysRecommendation(null));
          dispatch(setCommandLocked(false));
          dispatch(setInterSelections(inheritBeforeEvents(snap.interSelections)));
          dispatch(setStrikeSelections(inheritBeforeEvents(snap.strikeSelections)));
          dispatch(setSaturationSelections(inheritBeforeEvents(snap.saturationSelections)));
          dispatch(setSelectedWeaponId(null));
          dispatch(setWeaponPrediction(null));
          dispatch(setWeaponLocked(false));
          delete ts.command;
          delete ts.evaluation;
          delete ts.matrix;
          delete ts.armory;
          delete ts.control;
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
        return true;
      })
      .catch((err: Error) => {
        showToast(`Fork Failure: ${err.message}`, 'error');
        return false;
      });
  }, [dispatch, session, currentModel, navigate, showToast, getAuthHeaders, buildSessionMeta, activeEditLog]);

  const saveSession = useCallback(async (options: SaveSessionOptions = {}): Promise<boolean> => {
    const snap = analysisRef.current;
    const sessionId = String(snap.activeSessionId || '').trim();
    if (!sessionId) {
      if (!options.silent) showToast('No active session to save', 'error');
      return false;
    }

    // Read live trade cards from localStorage for phase9
    const phase9 = (() => {
      try {
        const raw = localStorage.getItem(tradeCardsStorageKey(sessionId));
        if (!raw) return null;
        const cards = JSON.parse(raw) as Array<Record<string, unknown>>;
        const active = cards.filter(c => c.entry);
        if (!active.length) return null;
        return active.map((c, i) => ({
          trade_index:           i + 1,
	          asset:                 [snap.assetName, c.assetSuffix].filter(Boolean).join(' ') || null,
	          direction:             c.side,
	          execution_mode:         c.executionMode || 'LIVE',
	          instrument_kind:        c.instrumentKind || 'CONTRACT',
	          underlying_asset:       c.underlyingAsset || snap.assetName || null,
	          underlying_entry_price: (c.instrumentKind || 'CONTRACT') === 'UNDERLYING' ? c.entry || null : c.underlyingEntry || null,
	          underlying_exit_price:  (c.instrumentKind || 'CONTRACT') === 'UNDERLYING' ? c.exitPrice || null : c.underlyingExit || null,
	          entry_price:           c.entry   || null,
          stop_loss:             c.sl      || null,
          quantity:              c.qty     || null,
          additional_cost:       c.cost    || null,
          t1: c.t1 || null, t2: c.t2 || null, t3: c.t3 || null, t4: c.t4 || null,
	          date:                  c.date       || null,
	          entry_time:            c.entryTime  || null,
          exit_date:             c.exitDate   || null,
          exit_time:             c.exitTime   || null,
          be_triggered:          c.beTriggered || false,
          add_entries:           c.addEntries   || [],
          partial_exits:         c.partialExits || [],
          exit_price:            c.exitPrice   || null,
          exit_type:             c.exitType    || null,
          trade_status:          c.tradeStatus || null,
          holding_time_minutes:  (() => {
	            const entryDate = (c.date as string) || new Date().toISOString().slice(0, 10);
	            const exitDate = (c.exitDate as string) || entryDate;
	            const et = c.entryTime as string; const xt = c.exitTime as string;
	            if (!et || !xt) return null;
	            const start = new Date(`${entryDate}T${et}`);
	            const end = new Date(`${exitDate}T${xt}`);
	            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
	            const m = Math.floor((end.getTime() - start.getTime()) / 60000);
            return m > 0 ? m : null;
          })(),
          note:   c.notes  || null,
          closed: c.closed || false,
        }));
      } catch { return null; }
    })();
    const phase_9 = phase9
      ? Object.fromEntries(phase9.map((trade, index) => [
          `trade_${trade.trade_index || index + 1}`,
          buildPhase9TradeBlock({
            weaponId: snap.selectedWeaponId || undefined,
            selectedDimensions: snap.finalCommand === 'STRIKE' ? snap.strikeSelections : snap.interSelections,
            mode: String(trade.execution_mode || 'LIVE'),
            assetClass: String(trade.asset_class || 'Index'),
            instrumentType: String(trade.instrument_kind || 'CONTRACT'),
            thesisAsset: String(trade.underlying_asset || snap.assetName || ''),
            executionInstrument: String(trade.asset || ''),
            side: String(trade.direction || ''),
            entry: {
              date: trade.date,
              time: trade.entry_time,
              price: trade.entry_price,
              stop_loss: trade.stop_loss,
              quantity: trade.quantity,
              additional_cost: trade.additional_cost,
            },
            targets: { t1: trade.t1, t2: trade.t2, t3: trade.t3, t4: trade.t4 },
            managementActions: {
              breakeven_triggered: trade.be_triggered,
              add_entries: trade.add_entries,
              partial_exits: trade.partial_exits,
            },
            exit: {
              date: trade.exit_date,
              time: trade.exit_time,
              price: trade.exit_price,
              type: trade.exit_type,
              status: trade.trade_status,
              closed: trade.closed,
            },
            stats: {
              status: trade.closed ? 'committed' : 'pending_until_commit',
              holding_duration_minutes: trade.holding_time_minutes,
            },
            notes: { user: trade.note },
          }),
        ]))
      : null;

    const clearAfter = options.clearAfter ?? (options.clearDownstream ? 'decision_path' : null);
    const clearDownstream = !!clearAfter;
    const clearPreSession = clearAfter === 'pre_session';
    const clearHtf = clearAfter === 'pre_session';
    const clearHypothesis = clearAfter === 'pre_session' || clearAfter === 'htf';
    const clearMarketPulse = clearHtf || clearAfter === 'htf';
    const clearDecisionPath = clearMarketPulse || clearAfter === 'market_pulse';
    const clearPinakaState = clearDecisionPath || clearAfter === 'decision_path';
    const clearCommand = clearPinakaState || clearAfter === 'pinaka_state';
    const clearWeapon = clearCommand || clearAfter === 'command';
    const persistedCheckpoints = options.recognitionCheckpoints ?? snap.recognitionCheckpoints;
    const persistedTimestamps = clearDownstream
      ? Object.fromEntries(Object.entries(snap.stepTimestamps).filter(([key]) => key !== 'command'))
      : snap.stepTimestamps;

    const record = (dimensions: Record<string, unknown> | null | undefined, note = '', extra: Record<string, unknown> = {}) => {
      const cleanDimensions = dimensions && Object.keys(dimensions).length ? dimensions : {};
      return Object.keys(cleanDimensions).length || note || Object.values(extra).some(value => value !== null && value !== undefined && value !== '')
        ? { dimensions: cleanDimensions, note, ...extra, updated_at: new Date().toISOString() }
        : null;
    };
    const marketPulse = snap.selections.marketPulse || {};
    const liquidity = snap.selections.liquidityContext || {};
    const htf = snap.selections.htfStructure || {};
    const htfDimensions = (sysData?.hypothesisH1?.dimensions || [])
      .filter(component => component.selectionTarget !== 'preSessionContext')
      .flatMap(dimension => dimension.dimensions || [dimension]);
    const htfEventIds = new Set(
      htfDimensions.filter(dimension => dimension.multiselect).map(dimension => dimension.id),
    );
    const htfStructureDimensions = Object.fromEntries(Object.entries(htf).filter(([key]) => !htfEventIds.has(key)));
    const htfEventDimensions = Object.fromEntries(Object.entries(htf).filter(([key]) => htfEventIds.has(key)));
    const marketPulseRecords = Object.fromEntries(
      (sysData?.marketPulse?.dimensions || [])
        .filter(component => !!component.recordKey)
        .map(component => {
          const includedComponents = [
            component,
            ...(sysData?.marketPulse?.dimensions || []).filter(candidate => component.includeComponentIds?.includes(candidate.id)),
          ];
          const source = component.selectionTarget === 'liquidityContext' ? liquidity : marketPulse;
          const keys = new Set(includedComponents.flatMap(included => [
            ...(included.selectionIdKey ? [included.selectionIdKey] : []),
            ...(included.selectionValueKey ? [included.selectionValueKey] : []),
            ...(included.dimensions || []).flatMap(dimension => [dimension.id, ...(dimension.selectionAliases || [])]),
          ]));
          const dimensions = Object.fromEntries(Object.entries(source).filter(([key]) => keys.has(key)));
          const note = component.selectionTarget === 'liquidityContext' ? snap.notes.liquidityContext : snap.notes.marketPulse;
          return [component.recordKey, record(dimensions, note)];
        }),
    );
    const commandDimensions = snap.finalCommand === 'STRIKE'
      ? snap.strikeSelections
      : snap.finalCommand === 'SATURATION'
        ? snap.saturationSelections
        : snap.interSelections;
    const selectedState = Object.prototype.hasOwnProperty.call(options, 'selectedNetraState')
      ? options.selectedNetraState ?? null
      : snap.selectedNetraState;
    const selectedStateBody = (selectedState || {}) as Record<string, unknown>;
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
    const hasStateSchema = stateDimensionIds.size > 0 || stateEventIds.size > 0;
    const stateDimensionSelections = Object.fromEntries(
      Object.entries(commandDimensions || {}).filter(([key, value]) => !!value && (!hasStateSchema || stateDimensionIds.has(key))),
    );
    const stateEventSelections = Object.fromEntries(
      Object.entries(commandDimensions || {}).filter(([key, value]) => stateEventIds.has(key) && !!value),
    );
    const compactWaits = compactLatestWaitCheckpoint(persistedCheckpoints);
    const correlatedContext = options.liveMarketContext ?? snap.liveMarketContext;
    const marketSnapshot: Record<string, unknown> = {
      correlated_market_context: correlatedContext && Object.keys(correlatedContext).length
        ? { ...correlatedContext, updated_at: new Date().toISOString() }
        : null,
      pre_session_context: record(snap.selections.preSessionContext, snap.notes.preSessionContext),
      htf_structure: record(htfStructureDimensions, snap.notes.htfStructure),
      htf_events: record(htfEventDimensions, snap.notes.htfStructure),
      hypothesis_h1: !clearHypothesis && snap.h1Hypothesis?.status === 'CONFIRMED' ? {
        hypothesis_id: snap.h1Hypothesis.hypothesis_id,
        status: snap.h1Hypothesis.status,
        claim: snap.h1Hypothesis.claim,
        structural_view: snap.h1Hypothesis.structural_view,
        objective: snap.h1Hypothesis.objective,
        pullback_magnet: snap.h1Hypothesis.pullback_magnet,
        expected_path: snap.h1Hypothesis.expected_path,
        confirmation_conditions: snap.h1Hypothesis.confirmation_conditions,
        invalidation_conditions: snap.h1Hypothesis.invalidation_conditions,
        handoff: snap.h1Hypothesis.handoff,
        confidence: snap.h1Hypothesis.confidence,
        evidence_summary: {
          supporting_count: snap.h1Hypothesis.evidence.supporting.length,
          contradicting_count: snap.h1Hypothesis.evidence.contradicting.length,
          missing: snap.h1Hypothesis.evidence.missing,
        },
        updated_at: new Date().toISOString(),
      } : null,
      ...marketPulseRecords,
      maya_market_type_selector: snap.netraOutput ? { suggestion: aiSuggestionText(snap.netraOutput), updated_at: new Date().toISOString() } : null,
      wait: compactWaits.length ? { checkpoints: compactWaits, updated_at: new Date().toISOString() } : null,
      pinaka_state: selectedState ? { state: selectedState, command: snap.finalCommand, updated_at: new Date().toISOString() } : null,
      state_dimensions: snap.finalCommand && Object.keys(stateDimensionSelections).length
        ? { command: snap.finalCommand, dimensions: stateDimensionSelections, note: snap.notes.command || '', updated_at: new Date().toISOString() }
        : null,
      state_events: snap.finalCommand && Object.keys(stateEventSelections).length
        ? { command: snap.finalCommand, dimensions: stateEventSelections, note: snap.notes.command || '', updated_at: new Date().toISOString() }
        : null,
      trade_execution: !clearDownstream && phase_9
        ? { trades: phase_9, updated_at: new Date().toISOString() }
        : null,
    };
    if (clearHtf) {
      marketSnapshot.htf_structure = null;
      marketSnapshot.htf_events = null;
      marketSnapshot.hypothesis_h1 = null;
    }
    if (clearMarketPulse) {
      marketSnapshot.auction_state = null;
      marketSnapshot.price_behaviour = null;
      marketSnapshot.liquidity_context = null;
      marketSnapshot.auction_state_events = null;
    }
    if (clearDecisionPath) {
      marketSnapshot.maya_market_type_selector = null;
      marketSnapshot.wait = null;
      marketSnapshot.hypothesis_h2 = null;
    }
    if (clearPinakaState) marketSnapshot.pinaka_state = null;
    if (clearCommand) {
      marketSnapshot.state_dimensions = null;
      marketSnapshot.state_events = null;
    }
    if (clearWeapon) marketSnapshot.trade_execution = null;

    const phase2HasData = Object.keys(snap.selections.preSessionContext || {}).length > 0 || !!snap.notes.preSessionContext;
    const phase3HasData = Object.keys(snap.selections.htfStructure || {}).length > 0 || !!snap.notes.htfStructure;
    const phase4HasData = Object.keys(snap.selections.marketPulse || {}).length > 0
      || Object.keys(snap.selections.liquidityContext || {}).length > 0
      || !!snap.notes.marketPulse
      || !!snap.notes.liquidityContext;

    const payload: Record<string, unknown> = {
      metadata: buildTradeMetadata(session?.userName || 'Unknown', currentModel || 'pinaka', session?.allowedTeams?.[0] || 'default'),
      mutationIntent: clearDownstream ? 'INVALIDATE' : 'SAVE',
      ...(clearAfter ? { clearAfter } : {}),
      highestStep:    options.highestStep ?? snap.highestStep,
      tradeName:      snap.tradeName,
      assetName:      snap.assetName,
      stepTimestamps: options.stepTimestamps ?? persistedTimestamps,
      state_timeline: snap.stateTimeline,
      marketSnapshot,
      ...(clearHypothesis
        ? { hypothesisH1: null, ...(!options.preserveH1Proposal ? { hypothesisH1Proposal: null } : {}) }
        : snap.h1Hypothesis
          ? { hypothesisH1: snap.h1Hypothesis, ...(snap.h1Proposal ? { hypothesisH1Proposal: snap.h1Proposal } : {}) }
          : snap.h1Proposal
            ? { hypothesisH1Proposal: snap.h1Proposal }
            : {}),
      ...(clearDecisionPath
        ? { hypothesisH2: null, hypothesisH2Proposal: null }
        : options.reopenH2
          ? { hypothesisH2: null, hypothesisH2Proposal: snap.netraOutput ?? null }
          : {}),

      phase1: snap.imageDescription
        ? { image_description: snap.imageDescription }
        : undefined,

      phase2: clearPreSession
        ? null
        : phase2HasData
        ? { selections: snap.selections.preSessionContext, note: snap.notes.preSessionContext }
        : undefined,

      phase3: clearHtf
        ? null
        : phase3HasData
        ? { selections: snap.selections.htfStructure, note: snap.notes.htfStructure }
        : undefined,

      phase4: clearMarketPulse
        ? null
        : phase4HasData || clearAfter === 'market_pulse'
        ? {
            marketPulse:          snap.selections.marketPulse,
            liquidityContext:      snap.selections.liquidityContext,
            marketPulse_note:     snap.notes.marketPulse,
            liquidityContext_note: snap.notes.liquidityContext,
          }
        : undefined,
      ...(options.liveMarketContext ? { phaseLiveContext: options.liveMarketContext } : {}),

      phase5: clearDecisionPath ? null : snap.netraOutput ?? undefined,

      phase6: !clearDecisionPath && ((!clearCommand && snap.finalCommand) || persistedCheckpoints.length)
        ? {
            command:        clearCommand ? null : snap.finalCommand,
            hypothesis:     snap.notes.command || null,
            confirmed_at:   clearCommand ? null : snap.stepTimestamps?.command ?? null,
            selected_state: clearPinakaState ? null : selectedState,
            recommendation: clearCommand ? null : snap.sysRecommendation ?? null,
            recognition_checkpoints: persistedCheckpoints,
          }
        : clearDecisionPath ? null : undefined,

      phase7: clearWeapon ? null : snap.weaponPrediction ?? undefined,

      phase8: !clearWeapon && snap.selectedWeaponId
        ? {
            weapon_id:  snap.selectedWeaponId,
            dimensions: snap.finalCommand === 'STRIKE'
              ? snap.strikeSelections
              : snap.finalCommand === 'SATURATION'
                ? snap.saturationSelections
                : snap.interSelections,
          }
        : clearWeapon ? null : undefined,

      phase9: clearWeapon ? null : phase9 ?? undefined,
      phase_9: clearWeapon ? null : phase_9 ?? undefined,

      // phase10 is written separately by useAudit after audit completes
    };

    const persist = async (): Promise<boolean> => {
      try {
        const expectedRevision = revisionSessionIdRef.current === sessionId
          ? stateRevisionRef.current
          : 0;
        const res = await fetch(`${API_BASE}/api/logs/${encodeURIComponent(sessionId)}/state`, {
          method: 'PUT',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ ...payload, expectedRevision }),
        });
        if (!res.ok) {
          const error = await res.json().catch(() => ({}));
          throw new Error(error?.detail || `HTTP ${res.status}`);
        }
        const updated = await res.json() as TradeLog;
        rememberServerRevision(updated, revisionSessionIdRef, stateRevisionRef);
        dispatch(setActiveEditLog(updated));
        if (!options.silent) showToast('Session Saved');
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown persistence error';
        showToast(`Save failed: ${message}`, 'error');
        return false;
      }
    };

    // Confirm/Edit can happen quickly; serialize writes so an older snapshot
    // can never arrive after and overwrite a newer one in MongoDB.
    const queuedSave = saveQueueRef.current.then(persist, persist);
    saveQueueRef.current = queuedSave;
    return queuedSave;
  // analysisRef is a ref — intentionally omitted from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, getAuthHeaders, showToast, session, currentModel, sysData]);

  const logout = useCallback(() => {
    dispatch(setSession(null));
    resetTerminalState();
    localStorage.clear();
    navigate('/login');
  }, [dispatch, resetTerminalState, navigate]);

  const isLoggingIn = useSelector((s: RootState) => s.session.isLoggingIn);
  const activeSessionIdVal = useSelector((s: RootState) => s.session.activeSessionId);

  return {
    session, sessionInput, isLoggingIn, isInitializingMission, isLoadingSession, activeSessionId: activeSessionIdVal,
    handleAuth, initializeMission, resumeSession, forkSession, forkCurrentSession, saveSession, resetTerminalState, logout, loadSessionById,
    setSession: (v: RootState['session']['session']) => dispatch(setSession(v)),
    setSessionInput: (v: RootState['session']['sessionInput']) => dispatch(setSessionInput(v)),
  };
}
