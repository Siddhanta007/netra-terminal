// NetraContext — the single hub the whole terminal reads from. Composes Redux state with the
// analysis / chat / session / vision / audit hooks and exposes them as one `useNetra()` API.

import { createContext, useContext, useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  setHighestStep as setHighestStepAction,
  setSelections as setSelectionsAction,
  setNotes as setNotesAction,
  setFinalCommand as setFinalCommandAction,
  setCommandLocked as setCommandLockedAction,
  setWeaponLocked as setWeaponLockedAction,
  setNetraOutput as setNetraOutputAction,
  setSelectedNetraState as setSelectedNetraStateAction,
  setSysRecommendation as setSysRecommendationAction,
  setInterSelections as setInterSelectionsAction,
  setStrikeSelections as setStrikeSelectionsAction,
  setSaturationSelections as setSaturationSelectionsAction,
  setWaitSelections as setWaitSelectionsAction,
  setRecognitionCheckpoints as setRecognitionCheckpointsAction,
  setSelectedWeaponId as setSelectedWeaponIdAction,
  setStepTimestamps as setStepTimestampsAction,
  setAnalyticsData as setAnalyticsDataAction,
  setWeaponPrediction as setWeaponPredictionAction,
  setRAmount as setRAmountAction,
  setDailyLossLimit as setDailyLossLimitAction,
  setDailyLossHit as setDailyLossHitAction,
  setDailyTarget as setDailyTargetAction,
  setDailyTargetHit as setDailyTargetHitAction,
  setOpeningWindow as setOpeningWindowAction,
  setSessionCutoff as setSessionCutoffAction,
  setIsExpiryDay as setIsExpiryDayAction,
  setExpiryCutoff as setExpiryCutoffAction,
  setRulesAcknowledged as setRulesAcknowledgedAction,
  appendWeaponStage as appendWeaponStageAction,
  setWeaponStageLog as setWeaponStageLogAction,
} from '../store/slices/analysisSlice';
import {
  setAvailableModels as setAvailableModelsAction,
  setSysData as setSysDataAction,
  setSelectedModel as setSelectedModelAction,
  setVisionModel as setVisionModelAction,
  setModelConfig as setModelConfigAction,
  setCurrentModel as setCurrentModelAction,
} from '../store/slices/modelSlice';
import {
  setDarkMode as setDarkModeAction,
  setActiveView as setActiveViewAction,
  setProfileOpen as setProfileOpenAction,
  setMobileMenuOpen as setMobileMenuOpenAction,
  setAiPaneOpen as setAiPaneOpenAction,
  setToast as setToastAction,
  setConfirmModal as setConfirmModalAction,
  setPrepStep as setPrepStepAction,
  setIsLoggerOpen as setIsLoggerOpenAction,
} from '../store/slices/uiSlice';
import {
  setLogSearchTerm as setLogSearchTermAction,
  setLogFilterOutcome as setLogFilterOutcomeAction,
  setLogSortOrder as setLogSortOrderAction,
  setTradeName as setTradeNameAction,
} from '../store/slices/logsSlice';
import {
  setChatHistory as setChatHistoryAction,
  setChatInput as setChatInputAction,
  setIsAiLoading as setIsAiLoadingAction,
  ChatSource,
} from '../store/slices/chatSlice';
import { setSession as setSessionAction, setActiveSessionId as setActiveSessionIdAction } from '../store/slices/sessionSlice';
import { API_BASE, WEIGHTS, SCORES, STEP_NAMES, DEBOUNCE_MS } from '../utils/constants';
import { useNetraUtils } from '../hooks/useNetraUtils';
import { useSessionManager } from '../hooks/useSessionManager';
import { useAnalysisFlow } from '../hooks/useAnalysisFlow';
import { useTradeLogsCrud } from '../hooks/useTradeLogsCrud';
import { useChatPanel } from '../hooks/useChatPanel';
import { useVisionAnalysis } from '../hooks/useVisionAnalysis';
import { useAudit } from '../hooks/useAudit';
import { tradeCardsStorageKey } from '../features/terminal/phases/phase-10-mission-control/missionControl/helpers';
import {
  Selections, Notes, InterSelections, StrikeSelections, SysData,
  AvailableModel, ModelConfig, TradeLog, EditFormData, Toast,
  ConfirmModal, ChatMessage, SessionInput, Session, ActiveView, AuditData,
  NetraOutput, WeaponPrediction, RecognitionCheckpoint,
} from '../types';

// ─── Context Value Type ───────────────────────────────────────────────────────

export interface NetraContextValue {
  // System
  sysData: SysData | null;
  SYSTEM_DATA: SysData;
  // Step state
  highestStep: number;
  setHighestStep: (v: number) => void;
  confirmStep: (step: number) => void;
  editStep: (step: number) => void;
  doResetStep: (step: number) => void;
  confirmMarketPulse: () => void;
  editMarketPulse: () => void;
  stepTimestamps: Record<string, string>;
  setStepTimestamps: (v: Record<string, string>) => void;
  // Mission Control Data
  rAmount: string; setRAmount: (v: string) => void;
  dailyLossLimit: string; setDailyLossLimit: (v: string) => void;
  dailyLossHit: boolean; setDailyLossHit: (v: boolean) => void;
  dailyTarget: string; setDailyTarget: (v: string) => void;
  dailyTargetHit: boolean; setDailyTargetHit: (v: boolean) => void;
  openingWindow: string; setOpeningWindow: (v: string) => void;
  sessionCutoff: string; setSessionCutoff: (v: string) => void;
  isExpiryDay: boolean; setIsExpiryDay: (v: boolean) => void;
  expiryCutoff: string; setExpiryCutoff: (v: string) => void;
  rulesAcknowledged: boolean[]; setRulesAcknowledged: (v: boolean[]) => void;
  // Selections & notes
  selections: Selections;
  setSelections: (v: Selections) => void;
  notes: Notes;
  setNotes: (v: Notes) => void;
  interSelections: InterSelections;
  setInterSelections: (v: InterSelections) => void;
  strikeSelections: StrikeSelections;
  setStrikeSelections: (v: StrikeSelections) => void;
  saturationSelections: Record<string, string>;
  setSaturationSelections: (v: Record<string, string>) => void;
  waitSelections: import('../types').WaitSelections;
  setWaitSelections: (v: import('../types').WaitSelections) => void;
  recognitionCheckpoints: RecognitionCheckpoint[];
  setRecognitionCheckpoints: (v: RecognitionCheckpoint[]) => void;
  // Command flow
  finalCommand: string | null;
  setFinalCommand: (v: string | null) => void;
  commandLocked: boolean;
  setCommandLocked: (v: boolean) => void;
  weaponLocked: boolean;
  setWeaponLocked: (v: boolean) => void;
  selectedWeaponId: string | null;
  setSelectedWeaponId: (v: string | null) => void;
  netraOutput: NetraOutput | null;
  setNetraOutput: (v: NetraOutput | null) => void;
  selectedNetraState: Record<string, unknown> | null;
  setSelectedNetraState: (v: Record<string, unknown> | null) => void;
  sysRecommendation: unknown;
  setSysRecommendation: (v: unknown) => void;
  isEvaluating: boolean;
  // Session
  session: Session | null;
  setSession: (v: Session | null) => void;
  sessionInput: SessionInput;
  setSessionInput: (v: SessionInput) => void;
  prepStep: number;
  setPrepStep: (v: number) => void;
  activeSessionId: number | null;
  setActiveSessionId: (v: number | null) => void;
  activeView: ActiveView;
  setActiveView: (v: ActiveView) => void;
  currentModel: string;
  setCurrentModel: (v: string) => void;
  tradeName: string;
  setTradeName: (v: string) => void;
  handleAuth: () => void;
  initializeMission: () => void;
  isInitializingMission: boolean;
  resumeSession: (log: TradeLog) => void;
  forkSession: (log: TradeLog, newName: string) => Promise<boolean>;
  forkCurrentSession: (phaseNum: number, newName: string, fork?: { recordKey: string; label: string; clearSelectionKeys?: string[] }) => Promise<boolean>;
  loadSessionById: (id: string) => Promise<void>;
  saveSession: (options?: { silent?: boolean; recognitionCheckpoints?: RecognitionCheckpoint[]; highestStep?: number; clearDownstream?: boolean; clearAfter?: 'pre_session' | 'htf' | 'market_pulse' | 'decision_path' | 'pinaka_state' | 'command'; selectedNetraState?: Record<string, unknown> | null; liveMarketContext?: Record<string, unknown> }) => Promise<boolean>;
  resetTerminalState: () => void;
  logout: () => void;
  // Logs
  tradeLogs: TradeLog[];
  fetchLogs: (modelId?: string) => void;
  activeEditLog: TradeLog | null;
  setActiveEditLog: (v: TradeLog | null) => void;
  editFormData: EditFormData;
  setEditFormData: (v: EditFormData) => void;
  logSearchTerm: string;
  setLogSearchTerm: (v: string) => void;
  logFilterOutcome: string;
  setLogFilterOutcome: (v: string) => void;
  logSortOrder: 'ASC' | 'DESC';
  setLogSortOrder: (v: 'ASC' | 'DESC') => void;
  commitTradeLog: (weapon?: string) => void;
  updateTradeLog: (tradeId: number) => void;
  deleteTradeLog: (tradeId: number) => void;
  handleGlobalSave: () => void;
  // AI Chat
  chatHistory: ChatMessage[];
  setChatHistory: (v: ChatMessage[]) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  isAiLoading: boolean;
  setIsAiLoading: (v: boolean) => void;
  sources: ChatSource[];
  toggleSource: (s: ChatSource) => void;
  chatTitle: string;
  startNewChat: (title?: string) => Promise<void>;
  renameChat: (title: string) => Promise<void>;
  summarizeNow: () => void;
  handleSendMessage: () => void;
  // UI state
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  toast: Toast | null;
  setToast: (v: Toast | null) => void;
  confirmModal: ConfirmModal | null;
  setConfirmModal: (v: ConfirmModal | null) => void;
  analyticsData: unknown;
  fetchAnalytics: (modelId?: string) => void;
  isLoggerOpen: boolean;
  setIsLoggerOpen: (v: boolean) => void;
  isAiPaneOpen: boolean;
  setIsAiPaneOpen: (v: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (v: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (v: boolean) => void;
  isLoggingIn: boolean;
  toggleTradeData: () => void;
  toggleAnalyst: () => void;
  // Utilities
  showToast: (msg: string, type?: Toast['type']) => void;
  getNCSBreakdown: () => Array<{ dim: string; selection: string; raw: number; weight: number; contrib: number }>;
  triggerNeuralSynthesis: () => void;
  stopSynthesis: () => void;
  triggerWeaponPrediction: (thought?: string) => Promise<Record<string, unknown> | null>;
  stopWeaponPrediction: () => void;
  isPredictingWeapon: boolean;
  weaponPrediction: WeaponPrediction | null;
  weaponStageLog: Array<{ stage: string; ts: string }>;
  appendWeaponStage: (stage: string) => void;
  clearWeaponStageLog: () => void;
  auditData: AuditData | null;
  setAuditData: (v: AuditData | null) => void;
  isAuditing: boolean;
  setIsAuditing: (v: boolean) => void;
  triggerPostTradeAudit: (telemetry: Record<string, unknown>) => void;
  stopPostTradeAudit: () => void;
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  visionModel: string;
  setVisionModel: (v: string) => void;
  AVAILABLE_MODELS: AvailableModel[];
  modelConfig: ModelConfig;
  setModelConfig: (v: ModelConfig) => void;
  imageDescription: string | null;
  setImageDescription: (v: string | null) => void;
  uploadAndDescribeImage: () => void;
  isUploadingImage: boolean;
  uploadedVisionFiles: File[];
  setUploadedVisionFiles: (f: File[]) => void;
  stopVisualAnalysis: () => void;
}

const NetraContext = createContext<NetraContextValue | null>(null);

const EMPTY_SYS_DATA: SysData = {
  weapons: { strike: [], interception: [], saturation: [] },
  preSessionContext: { dimensions: [] },
  htfStructure: { dimensions: [] },
  marketPulse: { dimensions: [] },
  liquidityContext: { dimensions: [] },
  strikeDimensions: [],
  interceptionDimensions: [],
  saturationDimensions: [],
  marketPulseExtras: { operationalMarks: [], activeLegOptions: {}, subAuctionOptions: {} },
  executionMarks: [],
  weaponStages: [],
  tradeStatuses: [],
  exitTypes: [
    'Target 1 Hit',
    'Target 2 Hit',
    'Target 3 Hit',
    'Target 4 Hit',
    'Stop Loss Hit',
    'Breakeven Exit',
    'Manual Exit',
    'Time-Based Exit',
    'Partial Profit Exit',
    'Trailing Stop Exit',
    'Setup Invalidated',
  ],
};

export function NetraProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const { showToast, getAuthHeaders } = useNetraUtils();

  // Domain hooks
  const session_ = useSessionManager();
  const analysis_ = useAnalysisFlow();
  const logs_ = useTradeLogsCrud();
  const chat_ = useChatPanel();
  const audit_ = useAudit();

  // Vision hook needs uploadedVisionFiles from chat panel
  const vision_ = useVisionAnalysis(chat_.uploadedVisionFiles, chat_.setUploadedVisionFiles);

  // ─── Redux selectors ───────────────────────────────────────────────
  const sysData = useSelector((s: RootState) => s.model.sysData);
  const availableModels = useSelector((s: RootState) => s.model.availableModels);
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const finalCommand = useSelector((s: RootState) => s.analysis.finalCommand);
  const commandLocked = useSelector((s: RootState) => s.analysis.commandLocked);
  const weaponLocked = useSelector((s: RootState) => s.analysis.weaponLocked);
  const sysRecommendation = useSelector((s: RootState) => s.analysis.sysRecommendation);
  const interSelections = useSelector((s: RootState) => s.analysis.interSelections);
  const strikeSelections = useSelector((s: RootState) => s.analysis.strikeSelections);
  const saturationSelections = useSelector((s: RootState) => s.analysis.saturationSelections);
  const waitSelections = useSelector((s: RootState) => s.analysis.waitSelections);
  const recognitionCheckpoints = useSelector((s: RootState) => s.analysis.recognitionCheckpoints);
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
  const selectedNetraState = useSelector((s: RootState) => s.analysis.selectedNetraState);
  const weaponStageLog = useSelector((s: RootState) => s.analysis.weaponStageLog);
  const stepTimestamps = useSelector((s: RootState) => s.analysis.stepTimestamps);
  const analyticsData = useSelector((s: RootState) => s.analysis.analyticsData);
  const rAmount = useSelector((s: RootState) => s.analysis.rAmount);
  const dailyLossLimit = useSelector((s: RootState) => s.analysis.dailyLossLimit);
  const dailyLossHit = useSelector((s: RootState) => s.analysis.dailyLossHit);
  const dailyTarget = useSelector((s: RootState) => s.analysis.dailyTarget);
  const dailyTargetHit = useSelector((s: RootState) => s.analysis.dailyTargetHit);
  const openingWindow = useSelector((s: RootState) => s.analysis.openingWindow);
  const sessionCutoff = useSelector((s: RootState) => s.analysis.sessionCutoff);
  const isExpiryDay = useSelector((s: RootState) => s.analysis.isExpiryDay);
  const expiryCutoff = useSelector((s: RootState) => s.analysis.expiryCutoff);
  const rulesAcknowledged = useSelector((s: RootState) => s.analysis.rulesAcknowledged);
  const isLoggerOpen = useSelector((s: RootState) => s.ui.isLoggerOpen);
  const isAiPaneOpen = useSelector((s: RootState) => s.ui.isAiPaneOpen);
  const isProfileOpen = useSelector((s: RootState) => s.ui.isProfileOpen);
  const isMobileMenuOpen = useSelector((s: RootState) => s.ui.isMobileMenuOpen);
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const toast = useSelector((s: RootState) => s.ui.toast);
  const confirmModal = useSelector((s: RootState) => s.ui.confirmModal);
  const prepStep = useSelector((s: RootState) => s.ui.prepStep);
  const activeView = useSelector((s: RootState) => s.ui.activeView);
  const logSearchTerm = useSelector((s: RootState) => s.logs.logSearchTerm);
  const logFilterOutcome = useSelector((s: RootState) => s.logs.logFilterOutcome);
  const logSortOrder = useSelector((s: RootState) => s.logs.logSortOrder);
  const tradeName = useSelector((s: RootState) => s.logs.tradeName);
  const selectedModel = useSelector((s: RootState) => s.model.selectedModel);
  const visionModel = useSelector((s: RootState) => s.model.visionModel);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const currentModel = useSelector((s: RootState) => s.model.currentModel);
  const isLoggingIn = useSelector((s: RootState) => s.session.isLoggingIn);

  // ─── Dark mode side-effect ───────────────────────────��─────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // ─── Session workflow persistence ─────────────────────────────────
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const [persistenceRevision, setPersistenceRevision] = useState(0);
  const persistenceClearAfterRef = useRef<null | 'pre_session' | 'htf' | 'market_pulse'>(null);

  useEffect(() => {
    if (activeSessionId && persistenceRevision > 0) {
      const clearAfter = persistenceClearAfterRef.current;
      persistenceClearAfterRef.current = null;
      void session_.saveSession({ silent: true, ...(clearAfter ? { clearAfter } : {}) });
    }
  // The revision changes only after Confirm/Edit dispatches. The effect runs
  // after Redux has re-rendered, so saveSession's snapshot ref is current.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistenceRevision, activeSessionId]);

  // ─── Boot: load models (always) + system data (auth only) ──────────

  // Parses a models_config response (from API or static file) into a flat list.
  const parseModelsConfig = (data: { providers?: Array<{ provider: string; models: Array<{ id: string; name: string; cost: string; tags: string[] }> }>; tactical_provider?: string }) => {
    const flatModels: AvailableModel[] = [];
    (data.providers || []).forEach((provider) => {
      provider.models.forEach((model) => {
        // "Agent" is a capability flag (filters the suggestion box) — not a display label.
        const displayTags = model.tags.filter((t) => t !== 'Agent');
        const tagStr = displayTags.length > 0 ? `, ${displayTags.join(' & ')}` : '';
        flatModels.push({
          name: `${provider.provider} : ${model.name}, ${model.cost} Cost${tagStr}`,
          id:   `${provider.provider.toLowerCase()}|${model.id}`,
          cost: model.cost,
          tags: model.tags,
        });
      });
    });
    return { flatModels, tactical_provider: data.tactical_provider };
  };

  const applyModels = (flatModels: AvailableModel[], _tactical_provider?: string) => {
    dispatch(setAvailableModelsAction(flatModels));
    const isGoogleSelection = selectedModel.toLowerCase().startsWith('google|');
    const isValid = flatModels.some((m) => m.id === selectedModel);
    if ((!isValid || isGoogleSelection) && flatModels.length > 0) {
      const preferred =
        flatModels.find((m) => m.id === 'tiers|free') ||
        flatModels.find((m) => m.id === 'tiers|openrouter-free') ||
        flatModels.find((m) => m.id === 'openrouter|openrouter/free') ||
        flatModels.find((m) => m.id.startsWith('openrouter|')) ||
        flatModels[0];
      dispatch(setSelectedModelAction(preferred.id));
    }
    // Note: tactical_provider ("google", "groq") is the AI provider, NOT the trading model
    // ("pinaka", "trishul"). Do not dispatch setCurrentModelAction here.
  };

  useEffect(() => {
    fetch(`${API_BASE}/api/models`)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((data) => {
        const { flatModels, tactical_provider } = parseModelsConfig(data);
        applyModels(flatModels, tactical_provider);
      })
      .catch(() => {
        // Backend unreachable (e.g. Vercel frontend + separate backend, VITE_API_URL not set).
        // Try loading the bundled static copy shipped with the frontend build.
        fetch('/models_config.json')
          .then((res) => {
            if (!res.ok) throw new Error('static missing');
            return res.json();
          })
          .then((data) => {
            const { flatModels, tactical_provider } = parseModelsConfig(data);
            applyModels(flatModels, tactical_provider);
          })
          .catch(() => {
            // Last resort: nothing available, leave store empty so UI shows a clear error.
            if (import.meta.env.DEV) console.error('Failed to load models from API and static file');
          });
      });

    fetch(`${API_BASE}/api/system-data`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data: SysData) => dispatch(setSysDataAction(data)))
      .catch(() => { if (import.meta.env.DEV) console.error('Engine Offline'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Fetch logs + analytics when session or model changes ──────────
  const session = useSelector((s: RootState) => s.session.session);
  useEffect(() => {
    if (session) {
      logs_.fetchLogs(currentModel);
      fetchAnalytics(currentModel);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, currentModel]);

  // ─── Auto-save log details (debounced) ──────────────────────────���─
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);
  const editFormData = useSelector((s: RootState) => s.logs.editFormData);

  useEffect(() => {
    if (!activeEditLog?.id || Object.keys(editFormData).length === 0) return;
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/logs/${encodeURIComponent(activeEditLog.id)}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(editFormData),
      })
        .then((res) => res.json())
        .then((data: TradeLog) => dispatch({ type: 'logs/setActiveEditLog', payload: data }))
        .catch(() => { });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFormData]);

  // ─── Keyboard shortcuts ───────────────────────────────────��────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey && e.key === 'l') { e.preventDefault(); toggleTradeData(); }
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); toggleAnalyst(); }
      if (e.key === 'Escape' && confirmModal) dispatch(setConfirmModalAction(null));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmModal]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Bi-directional binding: Sidebar → Terminal ────────────────────
  useEffect(() => {
    if (activeSessionId && activeEditLog && activeSessionId === activeEditLog.id) {
      if (editFormData.trade_name && editFormData.trade_name !== tradeName) {
        dispatch(setTradeNameAction(editFormData.trade_name as string));
      }
      if (editFormData.notes && editFormData.notes !== notes.preSessionContext) {
        dispatch(setNotesAction({ ...notes, preSessionContext: editFormData.notes as string }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editFormData, activeSessionId, activeEditLog]);

  // ─── Helpers ───────────────────────────────────────────────────────
  const toggleTradeData = useCallback(() => {
    dispatch(setIsLoggerOpenAction(!isLoggerOpen));
    dispatch(setAiPaneOpenAction(false));
  }, [dispatch, isLoggerOpen]);

  const toggleAnalyst = useCallback(() => {
    dispatch(setAiPaneOpenAction(!isAiPaneOpen));
    dispatch(setIsLoggerOpenAction(false));
  }, [dispatch, isAiPaneOpen]);

  const getNCSBreakdown = useCallback(() =>
    Object.entries(WEIGHTS).map(([key, weight]) => {
      const raw = SCORES[key]?.[selections[key as keyof Selections] as unknown as string] || 0;
      return { dim: key, selection: selections[key as keyof Selections] as unknown as string, raw, weight, contrib: raw * weight };
    }), [selections]);

  const fetchAnalytics = useCallback((modelId = 'pinaka') => {
    fetch(`${API_BASE}/api/analytics?model_id=${modelId}`, { headers: getAuthHeaders() })
      .then((r) => r.json())
      .then((d) => dispatch(setAnalyticsDataAction(d)))
      .catch(() => { });
  }, [dispatch, getAuthHeaders]);

  // ─── Step management ───────────────────────────────────────────────
  // Ref keeps highestStep fresh inside confirmStep without stale closures.
  const highestStepRef = useRef(highestStep);
  highestStepRef.current = highestStep;

  const confirmStep = useCallback((stepLevel: number) => {
    if (highestStepRef.current === stepLevel) {
      persistenceClearAfterRef.current = null;
      dispatch(setHighestStepAction(stepLevel + 1));
      const timestampKey = stepLevel === 4 ? 'command' : STEP_NAMES[stepLevel];
      dispatch(setStepTimestampsAction({ ...stepTimestamps, [timestampKey]: new Date().toLocaleTimeString('en-IN') }));
      setPersistenceRevision(revision => revision + 1);
      showToast(`Step ${stepLevel} confirmed`);
    }
  }, [dispatch, stepTimestamps, showToast]);

  const editStep = useCallback((stepLevel: number) => {
    dispatch(setHighestStepAction(stepLevel));
    if (stepLevel < 4) {
      const nextSelections = { ...selections };
      const nextNotes = { ...notes };
      if (stepLevel <= 1) {
        nextSelections.htfStructure = {};
        nextNotes.htfStructure = '';
      }
      if (stepLevel <= 2) {
        nextSelections.marketPulse = {};
        nextSelections.liquidityContext = {};
        nextNotes.marketPulse = '';
        nextNotes.liquidityContext = '';
      }
      dispatch(setSelectionsAction(nextSelections));
      dispatch(setNotesAction(nextNotes));
      dispatch(setFinalCommandAction(null));
      dispatch(setNetraOutputAction(null));
      dispatch(setSelectedNetraStateAction(null));
      dispatch(setSysRecommendationAction(null));
      dispatch(setSelectedWeaponIdAction(null));
      dispatch(setCommandLockedAction(false));
      dispatch(setWeaponPredictionAction(null));
      dispatch(setRecognitionCheckpointsAction([]));
      dispatch(setWaitSelectionsAction({
        waitingFor: '', referenceLocation: '', requiredResolution: '', developmentStage: '',
        institutionalSignature: '', validityHorizon: '', waitNote: '', resolutionStatus: 'OPEN',
        resolutionEvent: '', resolutionNote: '', openedAt: '', resolvedAt: '',
      }));
      dispatch(setInterSelectionsAction({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }));
      dispatch(setStrikeSelectionsAction({
        impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '',
        zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '',
        postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '',
      }));
      dispatch(setSaturationSelectionsAction({}));
      dispatch(setWeaponStageLogAction([]));
      if (activeSessionId) localStorage.removeItem(tradeCardsStorageKey(activeSessionId));
      const timestampKeys = stepLevel === 1
        ? ['preSessionContext', 'htfStructure', 'marketPulse', 'liquidityContext', 'evaluation', 'command', 'matrix', 'armory', 'control']
        : stepLevel === 2
          ? ['htfStructure', 'marketPulse', 'liquidityContext', 'evaluation', 'command', 'matrix', 'armory', 'control']
          : ['marketPulse', 'liquidityContext', 'evaluation', 'command', 'matrix', 'armory', 'control'];
      dispatch(setStepTimestampsAction(Object.fromEntries(Object.entries(stepTimestamps).filter(([key]) => !timestampKeys.includes(key)))));
    } else if (stepLevel === 4) {
      // P7 command edit should preserve expensive P5/P6 recognition output.
      // Only invalidate downstream weapon/trade guidance that depends on the command matrix.
      const { command: _commandTimestamp, ...restTimestamps } = stepTimestamps;
      dispatch(setStepTimestampsAction(restTimestamps));
      dispatch(setSysRecommendationAction(null));
      dispatch(setSelectedWeaponIdAction(null));
      dispatch(setWeaponPredictionAction(null));
      dispatch(setCommandLockedAction(false));
      dispatch(setWeaponStageLogAction([]));
    }
    // Always unlock weapon; only clear selectedWeaponId when going back past the weapon step
    dispatch(setWeaponLockedAction(false));
    if (stepLevel < 4) {
      persistenceClearAfterRef.current = ({ 1: 'pre_session', 2: 'htf', 3: 'market_pulse' } as const)[stepLevel as 1 | 2 | 3];
      setPersistenceRevision(revision => revision + 1);
    }
  }, [dispatch, stepTimestamps, selections, notes, activeSessionId]);

  const doResetStep = useCallback((stepLevel: number) => {
    const stepKeys = ['preSessionContext', 'htfStructure', 'marketPulse', 'liquidityContext'] as const;
    const key = stepKeys[stepLevel - 1];
    if (key) {
      dispatch(setSelectionsAction({ ...selections, [key]: {} }));
      dispatch(setNotesAction({ ...notes, [key]: '' }));
    }
    dispatch(setHighestStepAction(stepLevel));
    if (stepLevel < 4) {
      dispatch(setFinalCommandAction(null));
      dispatch(setNetraOutputAction(null));
      dispatch(setSelectedNetraStateAction(null));
      dispatch(setSysRecommendationAction(null));
      dispatch(setSelectedWeaponIdAction(null));
    }
    if (stepLevel <= 5) { dispatch(setFinalCommandAction(null)); dispatch(setCommandLockedAction(false)); }
    dispatch(setConfirmModalAction(null));
    if (stepLevel < 4) {
      persistenceClearAfterRef.current = ({ 1: 'pre_session', 2: 'htf', 3: 'market_pulse' } as const)[stepLevel as 1 | 2 | 3];
    } else {
      persistenceClearAfterRef.current = null;
    }
    setPersistenceRevision(revision => revision + 1);
    showToast('Step reset');
  }, [dispatch, selections, notes, showToast]);

  const confirmMarketPulse = useCallback(() => {
    persistenceClearAfterRef.current = null;
    const time = new Date().toLocaleTimeString('en-IN');
    dispatch(setHighestStepAction(4));
    dispatch(setStepTimestampsAction({
      ...stepTimestamps,
      marketPulse: time,
      liquidityContext: time,
    }));
    setPersistenceRevision(revision => revision + 1);
    showToast('Market Pulse confirmed');
  }, [dispatch, stepTimestamps, showToast]);

  const editMarketPulse = useCallback(() => {
    persistenceClearAfterRef.current = 'market_pulse';
    dispatch(setHighestStepAction(3));
    dispatch(setSelectionsAction({ ...selections, marketPulse: {}, liquidityContext: {} }));
    dispatch(setNotesAction({ ...notes, marketPulse: '', liquidityContext: '' }));
    dispatch(setFinalCommandAction(null));
    dispatch(setNetraOutputAction(null));
    dispatch(setSelectedNetraStateAction(null));
    dispatch(setSysRecommendationAction(null));
    dispatch(setSelectedWeaponIdAction(null));
    dispatch(setCommandLockedAction(false));
    dispatch(setWeaponLockedAction(false));
    setPersistenceRevision(revision => revision + 1);
    showToast('Market Pulse reset');
  }, [dispatch, selections, notes, showToast]);

  // ─── Context value ─────────────────────────────────────────────────
  const value: NetraContextValue = {
    // System
    sysData,
    SYSTEM_DATA: sysData || EMPTY_SYS_DATA,
    // Step
    highestStep,
    setHighestStep: (v) => dispatch(setHighestStepAction(v)),
    confirmStep, editStep, doResetStep, confirmMarketPulse, editMarketPulse,
    stepTimestamps,
    setStepTimestamps: (v) => dispatch(setStepTimestampsAction(v)),
    // Selections
    selections,
    setSelections: (v) => dispatch(setSelectionsAction(v)),
    notes,
    setNotes: (v) => dispatch(setNotesAction(v)),
    interSelections,
    setInterSelections: (v) => dispatch(setInterSelectionsAction(v)),
    strikeSelections,
    setStrikeSelections: (v) => dispatch(setStrikeSelectionsAction(v)),
    saturationSelections,
    setSaturationSelections: (v) => dispatch(setSaturationSelectionsAction(v)),
    waitSelections,
    setWaitSelections: (v) => dispatch(setWaitSelectionsAction(v)),
    recognitionCheckpoints,
    setRecognitionCheckpoints: (v) => dispatch(setRecognitionCheckpointsAction(v)),
    // Command
    finalCommand,
    setFinalCommand: (v) => dispatch(setFinalCommandAction(v)),
    commandLocked,
    setCommandLocked: (v) => dispatch(setCommandLockedAction(v)),
    weaponLocked,
    setWeaponLocked: (v) => dispatch(setWeaponLockedAction(v)),
    selectedWeaponId,
    setSelectedWeaponId: (v) => dispatch(setSelectedWeaponIdAction(v)),
    netraOutput: analysis_.netraOutput,
    setNetraOutput: (v) => dispatch(setNetraOutputAction(v)),
    selectedNetraState,
    setSelectedNetraState: (v) => dispatch(setSelectedNetraStateAction(v)),
    sysRecommendation,
    setSysRecommendation: (v) => dispatch(setSysRecommendationAction(v)),
    isEvaluating: analysis_.isEvaluating,
    // Session
    session: session_.session,
    setSession: session_.setSession,
    sessionInput: session_.sessionInput,
    setSessionInput: session_.setSessionInput,
    prepStep,
    setPrepStep: (v) => dispatch(setPrepStepAction(v)),
    activeSessionId: session_.activeSessionId,
    setActiveSessionId: (v) => dispatch(setActiveSessionIdAction(v)),
    activeView,
    setActiveView: (v) => dispatch(setActiveViewAction(v)),
    currentModel,
    setCurrentModel: (v) => dispatch(setCurrentModelAction(v)),
    tradeName,
    setTradeName: (v) => dispatch(setTradeNameAction(v)),
    handleAuth: session_.handleAuth,
    initializeMission: session_.initializeMission,
    isInitializingMission: session_.isInitializingMission,
    resumeSession: session_.resumeSession,
    forkSession: session_.forkSession,
    forkCurrentSession: session_.forkCurrentSession,
    loadSessionById: session_.loadSessionById,
    saveSession: session_.saveSession,
    resetTerminalState: session_.resetTerminalState,
    logout: session_.logout,
    // Logs
    tradeLogs: logs_.tradeLogs,
    fetchLogs: logs_.fetchLogs,
    activeEditLog: logs_.activeEditLog,
    setActiveEditLog: logs_.setActiveEditLog,
    editFormData: logs_.editFormData,
    setEditFormData: logs_.setEditFormData,
    logSearchTerm,
    setLogSearchTerm: (v) => dispatch(setLogSearchTermAction(v)),
    logFilterOutcome,
    setLogFilterOutcome: (v) => dispatch(setLogFilterOutcomeAction(v)),
    logSortOrder,
    setLogSortOrder: (v) => dispatch(setLogSortOrderAction(v)),
    commitTradeLog: logs_.commitTradeLog,
    updateTradeLog: logs_.updateTradeLog,
    deleteTradeLog: logs_.deleteTradeLog,
    handleGlobalSave: logs_.handleGlobalSave,
    // Chat
    chatHistory: chat_.chatHistory,
    setChatHistory: (v) => dispatch(setChatHistoryAction(v)),
    chatInput: chat_.chatInput,
    setChatInput: (v) => dispatch(setChatInputAction(v)),
    isAiLoading: chat_.isAiLoading,
    setIsAiLoading: (v) => dispatch(setIsAiLoadingAction(v)),
    sources: chat_.sources,
    toggleSource: chat_.toggleSource,
    chatTitle: chat_.chatTitle,
    startNewChat: chat_.startNewChat,
    renameChat: chat_.renameChat,
    summarizeNow: chat_.summarizeNow,
    handleSendMessage: chat_.handleSendMessage,
    // UI
    darkMode,
    setDarkMode: (v) => dispatch(setDarkModeAction(v)),
    toast,
    setToast: (v) => dispatch(setToastAction(v)),
    confirmModal,
    setConfirmModal: (v) => dispatch(setConfirmModalAction(v)),
    analyticsData,
    fetchAnalytics,
    isLoggerOpen,
    setIsLoggerOpen: (v) => dispatch(setIsLoggerOpenAction(v)),
    isAiPaneOpen,
    setIsAiPaneOpen: (v) => dispatch(setAiPaneOpenAction(v)),
    isProfileOpen,
    setIsProfileOpen: (v) => dispatch(setProfileOpenAction(v)),
    isMobileMenuOpen,
    setIsMobileMenuOpen: (v) => dispatch(setMobileMenuOpenAction(v)),
    isLoggingIn,
    toggleTradeData, toggleAnalyst,
    // Mission Control Data
    rAmount,
    setRAmount: (v) => dispatch(setRAmountAction(v)),
    dailyLossLimit,
    setDailyLossLimit: (v) => dispatch(setDailyLossLimitAction(v)),
    dailyLossHit,
    setDailyLossHit: (v) => dispatch(setDailyLossHitAction(v)),
    dailyTarget,
    setDailyTarget: (v) => dispatch(setDailyTargetAction(v)),
    dailyTargetHit,
    setDailyTargetHit: (v) => dispatch(setDailyTargetHitAction(v)),
    openingWindow,
    setOpeningWindow: (v) => dispatch(setOpeningWindowAction(v)),
    sessionCutoff,
    setSessionCutoff: (v) => dispatch(setSessionCutoffAction(v)),
    isExpiryDay,
    setIsExpiryDay: (v) => dispatch(setIsExpiryDayAction(v)),
    expiryCutoff,
    setExpiryCutoff: (v) => dispatch(setExpiryCutoffAction(v)),
    rulesAcknowledged,
    setRulesAcknowledged: (v) => dispatch(setRulesAcknowledgedAction(v)),
    // Utilities
    showToast,
    getNCSBreakdown,
    triggerNeuralSynthesis: analysis_.triggerNeuralSynthesis,
    stopSynthesis: analysis_.stopSynthesis,
    triggerWeaponPrediction: analysis_.triggerWeaponPrediction,
    stopWeaponPrediction: analysis_.stopWeaponPrediction,
    isPredictingWeapon: analysis_.isPredictingWeapon,
    weaponPrediction: analysis_.weaponPrediction,
    weaponStageLog,
    appendWeaponStage: (stage: string) => dispatch(appendWeaponStageAction({ stage, ts: new Date().toISOString() })),
    clearWeaponStageLog: () => dispatch(setWeaponStageLogAction([])),
    auditData: audit_.auditData,
    setAuditData: (v) => dispatch({ type: 'logs/setAuditData', payload: v }),
    isAuditing: audit_.isAuditing,
    setIsAuditing: (v) => dispatch({ type: 'logs/setIsAuditing', payload: v }),
    triggerPostTradeAudit: audit_.triggerPostTradeAudit,
    stopPostTradeAudit: audit_.stopPostTradeAudit,
    selectedModel,
    setSelectedModel: (v) => dispatch(setSelectedModelAction(v)),
    visionModel,
    setVisionModel: (v) => dispatch(setVisionModelAction(v)),
    AVAILABLE_MODELS: availableModels,
    modelConfig,
    setModelConfig: (v) => dispatch(setModelConfigAction(v)),
    imageDescription: vision_.imageDescription,
    setImageDescription: vision_.setImageDescription,
    uploadAndDescribeImage: vision_.uploadAndDescribeImage,
    isUploadingImage: vision_.isUploadingImage,
    uploadedVisionFiles: vision_.uploadedVisionFiles,
    setUploadedVisionFiles: vision_.setUploadedVisionFiles,
    stopVisualAnalysis: vision_.stopVisualAnalysis,
  };

  return <NetraContext.Provider value={value}>{children}</NetraContext.Provider>;
}

export const useNetra = (): NetraContextValue => {
  const ctx = useContext(NetraContext);
  if (!ctx) throw new Error('useNetra must be used inside <NetraProvider>');
  return ctx;
};
