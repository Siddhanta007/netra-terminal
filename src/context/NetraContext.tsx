import { createContext, useContext, useEffect, useCallback, useRef } from 'react';
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
  setSysRecommendation as setSysRecommendationAction,
  setInterSelections as setInterSelectionsAction,
  setStrikeSelections as setStrikeSelectionsAction,
  setSaturationSelections as setSaturationSelectionsAction,
  setSelectedWeaponId as setSelectedWeaponIdAction,
  setStepTimestamps as setStepTimestampsAction,
  setAnalyticsData as setAnalyticsDataAction,
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
  setIncludeData as setIncludeDataAction,
  setIncludeDoctrine as setIncludeDoctrineAction,
  setIsAiLoading as setIsAiLoadingAction,
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
import {
  Selections, Notes, InterSelections, StrikeSelections, SysData,
  AvailableModel, ModelConfig, TradeLog, EditFormData, Toast,
  ConfirmModal, ChatMessage, SessionInput, Session, ActiveView, AuditData,
  NetraOutput, WeaponPrediction,
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
  isGuest: boolean;
  handleAuth: () => void;
  handleGuestLogin: () => void;
  initializeMission: () => void;
  resumeSession: (log: TradeLog) => void;
  forkSession: (log: TradeLog, newName: string) => void;
  forkCurrentSession: (phaseNum: number, newName: string) => void;
  loadSessionById: (id: string) => Promise<void>;
  saveSession: () => void;
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
  includeData: boolean;
  setIncludeData: (v: boolean) => void;
  includeDoctrine: boolean;
  setIncludeDoctrine: (v: boolean) => void;
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
  triggerWeaponPrediction: () => void;
  stopWeaponPrediction: () => void;
  isPredictingWeapon: boolean;
  weaponPrediction: WeaponPrediction | null;
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
  realBias: { dimensions: [] },
  htfStructure: { dimensions: [] },
  marketPulse: { dimensions: [] },
  liquidityContext: { dimensions: [] },
  strikeDimensions: [],
  interceptionDimensions: [],
  saturationDimensions: [],
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
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
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

  // ─── Session auto-save ──────────────────────��──────────────────────
  // Deps are explicit so the closure always captures fresh values.
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);

  useEffect(() => {
    if (activeSessionId && highestStep > 1) {
      session_.saveSession();
    }
  // saveSession reads fresh state via internal ref — no stale closure risk.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highestStep, activeSessionId]);

  const isGuest = useSelector((s: RootState) => s.session.isGuest);

  // ─── Boot: load models (always) + system data (auth only) ──────────

  // Parses a models_config response (from API or static file) into a flat list.
  const parseModelsConfig = (data: { providers?: Array<{ provider: string; models: Array<{ id: string; name: string; cost: string; tags: string[] }> }>; tactical_provider?: string }) => {
    const flatModels: AvailableModel[] = [];
    (data.providers || []).forEach((provider) => {
      provider.models.forEach((model) => {
        const tagStr = model.tags.length > 0 ? `, ${model.tags.join(' & ')}` : '';
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
    const isValid = flatModels.some((m) => m.id === selectedModel);
    if (!isValid && flatModels.length > 0) {
      dispatch(setSelectedModelAction(flatModels[0].id));
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

    if (isGuest) return;
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
      if (editFormData.notes && editFormData.notes !== notes.realBias) {
        dispatch(setNotesAction({ ...notes, realBias: editFormData.notes as string }));
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
      dispatch(setHighestStepAction(stepLevel + 1));
      dispatch(setStepTimestampsAction({ ...stepTimestamps, [STEP_NAMES[stepLevel]]: new Date().toLocaleTimeString('en-IN') }));
      showToast(`Step ${stepLevel} confirmed`);
    }
  }, [dispatch, stepTimestamps, showToast]);

  const editStep = useCallback((stepLevel: number) => {
    dispatch(setHighestStepAction(stepLevel));
    if (stepLevel <= 4) {
      dispatch(setFinalCommandAction(null));
      dispatch(setNetraOutputAction(null));
      dispatch(setSysRecommendationAction(null));
      dispatch(setSelectedWeaponIdAction(null));
      dispatch(setCommandLockedAction(false));
    }
    // Always unlock weapon; only clear selectedWeaponId when going back past the weapon step
    dispatch(setWeaponLockedAction(false));
  }, [dispatch]);

  const doResetStep = useCallback((stepLevel: number) => {
    const stepKeys = ['realBias', 'htfStructure', 'marketPulse', 'liquidityContext'] as const;
    const key = stepKeys[stepLevel - 1];
    if (key) {
      dispatch(setSelectionsAction({ ...selections, [key]: {} }));
      dispatch(setNotesAction({ ...notes, [key]: '' }));
    }
    dispatch(setHighestStepAction(stepLevel));
    if (stepLevel <= 4) {
      dispatch(setFinalCommandAction(null));
      dispatch(setNetraOutputAction(null));
      dispatch(setSysRecommendationAction(null));
      dispatch(setSelectedWeaponIdAction(null));
    }
    if (stepLevel <= 5) { dispatch(setFinalCommandAction(null)); dispatch(setCommandLockedAction(false)); }
    dispatch(setConfirmModalAction(null));
    showToast('Step reset');
  }, [dispatch, selections, notes, showToast]);

  const confirmMarketPulse = useCallback(() => {
    const time = new Date().toLocaleTimeString('en-IN');
    dispatch(setHighestStepAction(4));
    dispatch(setStepTimestampsAction({
      ...stepTimestamps,
      marketPulse: time,
      liquidityContext: time,
    }));
    showToast('Market Pulse confirmed');
  }, [dispatch, stepTimestamps, showToast]);

  const editMarketPulse = useCallback(() => {
    dispatch(setHighestStepAction(3));
    dispatch(setSelectionsAction({ ...selections, marketPulse: {}, liquidityContext: {} }));
    dispatch(setNotesAction({ ...notes, marketPulse: '', liquidityContext: '' }));
    dispatch(setFinalCommandAction(null));
    dispatch(setNetraOutputAction(null));
    dispatch(setSysRecommendationAction(null));
    dispatch(setSelectedWeaponIdAction(null));
    dispatch(setCommandLockedAction(false));
    dispatch(setWeaponLockedAction(false));
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
    isGuest,
    handleAuth: session_.handleAuth,
    handleGuestLogin: session_.handleGuestLogin,
    initializeMission: session_.initializeMission,
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
    includeData: chat_.includeData,
    setIncludeData: (v) => dispatch(setIncludeDataAction(v)),
    includeDoctrine: chat_.includeDoctrine,
    setIncludeDoctrine: (v) => dispatch(setIncludeDoctrineAction(v)),
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
