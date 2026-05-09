import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { loadState, saveState } from '../utils/storage';
import { useDispatch, useSelector } from 'react-redux';
import { setSysData as setSysDataAction, setAvailableModels as setAvailableModelsAction } from '../store/slices/modelSlice';
import { setHighestStep as setHighestStepAction, setSelections as setSelectionsAction, setNotes as setNotesAction, setFinalCommand as setFinalCommandAction, setCommandLocked as setCommandLockedAction, setWeaponLocked as setWeaponLockedAction, setNetraOutput as setNetraOutputAction, setSysRecommendation as setSysRecommendationAction, setInterSelections as setInterSelectionsAction, setStrikeSelections as setStrikeSelectionsAction, setSelectedWeaponId as setSelectedWeaponIdAction, setIsEvaluating as setIsEvaluatingAction, setIsPredictingWeapon as setIsPredictingWeaponAction, setWeaponPrediction as setWeaponPredictionAction } from '../store/slices/analysisSlice';
import { setAvailableModels as setAvailableModelsRedux, setSelectedModel as setSelectedModelRedux } from '../store/slices/modelSlice';
import { setIsAiLoading as setIsAiLoadingRedux, setChatHistory as setChatHistoryAction, setChatInput as setChatInputAction, setIncludeData as setIncludeDataAction, setIncludeDoctrine as setIncludeDoctrineAction, appendChatMessage } from '../store/slices/chatSlice';
import { setIsUploadingImage as setIsUploadingImageRedux, setImageDescription as setImageDescriptionAction } from '../store/slices/analysisSlice';
import { setTradeName as setTradeNameRedux, setTradeLogs as setTradeLogsRedux, setActiveEditLog as setActiveEditLogRedux, setEditFormData as setEditFormDataRedux, setLogSearchTerm as setLogSearchTermAction, setLogFilterOutcome as setLogFilterOutcomeAction, setLogSortOrder as setLogSortOrderAction, setAuditData as setAuditDataAction, setIsAuditing as setIsAuditingAction } from '../store/slices/logsSlice';
import { setSession as setSessionAction, setActiveSessionId as setActiveSessionIdAction, setIsLoggingIn as setIsLoggingInAction, setSessionInput as setSessionInputAction } from '../store/slices/sessionSlice';
import { setIsLoggerOpen as setIsLoggerOpenAction, setDarkMode as setDarkModeAction, setActiveView as setActiveViewAction, setProfileOpen as setProfileOpenAction, setMobileMenuOpen as setMobileMenuOpenAction, setAiPaneOpen as setAiPaneOpenAction, setToast as setToastAction, setConfirmModal as setConfirmModalAction, setPrepStep as setPrepStepAction } from '../store/slices/uiSlice';
import { setVisionModel as setVisionModelAction, setModelConfig as setModelConfigAction, setCurrentModel as setCurrentModelAction } from '../store/slices/modelSlice';
import { API_BASE, WEIGHTS, SCORES, STEP_NAMES } from '../utils/constants';

const NetraContext = createContext(null);

export function NetraProvider({ children }) {
  const dispatch = useDispatch();
  const abortControllerRef = useRef(null);
  const weaponAbortControllerRef = useRef(null);
  const sysData = useSelector(state => state.model.sysData);
  const availableModels = useSelector(state => state.model.availableModels);
  const highestStep = useSelector(state => state.analysis.highestStep);
  const selections = useSelector(state => state.analysis.selections);
  const notes = useSelector(state => state.analysis.notes);
  const finalCommand = useSelector(state => state.analysis.finalCommand);
  const commandLocked = useSelector(state => state.analysis.commandLocked);
  const weaponLocked = useSelector(state => state.analysis.weaponLocked);
  const netraOutput = useSelector(state => state.analysis.netraOutput);
  const sysRecommendation = useSelector(state => state.analysis.sysRecommendation);
  const interSelections = useSelector(state => state.analysis.interSelections);
  const strikeSelections = useSelector(state => state.analysis.strikeSelections);
  const selectedWeaponId = useSelector(state => state.analysis.selectedWeaponId);
  const isEvaluating = useSelector(state => state.analysis.isEvaluating);
  const isPredictingWeapon = useSelector(state => state.analysis.isPredictingWeapon);
  const weaponPrediction = useSelector(state => state.analysis.weaponPrediction);

  const setSysData = (val) => dispatch(setSysDataAction(val));
  const setAvailableModels = (val) => dispatch(setAvailableModelsAction(val));
  const setHighestStep = (val) => dispatch(setHighestStepAction(val));
  const setSelections = (val) => dispatch(setSelectionsAction(val));
  const setNotes = (val) => dispatch(setNotesAction(val));
  const setFinalCommand = (val) => dispatch(setFinalCommandAction(val));
  const setCommandLocked = (val) => dispatch(setCommandLockedAction(val));
  const setWeaponLocked = (val) => dispatch(setWeaponLockedAction(val));
  const setNetraOutput = (val) => dispatch(setNetraOutputAction(val));
  const setSysRecommendation = (val) => dispatch(setSysRecommendationAction(val));
  const setInterSelections = (val) => dispatch(setInterSelectionsAction(val));
  const setStrikeSelections = (val) => dispatch(setStrikeSelectionsAction(val));
  const setSelectedWeaponId = (val) => dispatch(setSelectedWeaponIdAction(val));
  const setIsEvaluating = (val) => dispatch(setIsEvaluatingAction(val));
  const setIsPredictingWeapon = (val) => dispatch(setIsPredictingWeaponAction(val));
  const setWeaponPrediction = (val) => dispatch(setWeaponPredictionAction(val));

  const isLoggerOpen = useSelector(state => state.ui.isLoggerOpen);
  const tradeLogs = useSelector(state => state.logs.tradeLogs);
  const logSearchTerm = useSelector(state => state.logs.logSearchTerm);
  const logFilterOutcome = useSelector(state => state.logs.logFilterOutcome);
  const logSortOrder = useSelector(state => state.logs.logSortOrder);
  const activeEditLog = useSelector(state => state.logs.activeEditLog);
  const chatHistory = useSelector(state => state.chat.chatHistory);
  const chatInput = useSelector(state => state.chat.chatInput);
  const isAiLoading = useSelector(state => state.chat.isAiLoading);
  const includeData = useSelector(state => state.chat.includeData);
  const includeDoctrine = useSelector(state => state.chat.includeDoctrine);
  const editFormData = useSelector(state => state.logs.editFormData);
  const tradeName = useSelector(state => state.logs.tradeName);
  const activeSessionId = useSelector(state => state.session.activeSessionId);

  const setIsLoggerOpen = (val) => dispatch(setIsLoggerOpenAction(val));
  const setTradeLogs = (val) => dispatch(setTradeLogsRedux(val));
  const setLogSearchTerm = (val) => dispatch(setLogSearchTermAction(val));
  const setLogFilterOutcome = (val) => dispatch(setLogFilterOutcomeAction(val));
  const setLogSortOrder = (val) => dispatch(setLogSortOrderAction(val));
  const setActiveEditLog = (val) => dispatch(setActiveEditLogRedux(val));
  const setChatHistory = (val) => dispatch(setChatHistoryAction(val));
  const setChatInput = (val) => dispatch(setChatInputAction(val));
  const setIsAiLoading = (val) => dispatch(setIsAiLoadingRedux(val));
  const setIncludeData = (val) => dispatch(setIncludeDataAction(val));
  const setIncludeDoctrine = (val) => dispatch(setIncludeDoctrineAction(val));
  const setEditFormData = (val) => dispatch(setEditFormDataRedux(val));
  const setTradeName = (val) => dispatch(setTradeNameRedux(val));
  const setActiveSessionId = (val) => dispatch(setActiveSessionIdAction(val));
  const isLoggingIn = useSelector(state => state.session.isLoggingIn);
  const session = useSelector(state => state.session.session);
  const sessionInput = useSelector(state => state.session.sessionInput);
  const prepStep = useSelector(state => state.ui.prepStep);
  const currentModel = useSelector(state => state.model.currentModel);
  const darkMode = useSelector(state => state.ui.darkMode);
  const stepTimestamps = useSelector(state => state.analysis.stepTimestamps);
  const toast = useSelector(state => state.ui.toast);
  const confirmModal = useSelector(state => state.ui.confirmModal);
  const analyticsData = useSelector(state => state.analysis.analyticsData);
  const activeView = useSelector(state => state.ui.activeView);
  const isProfileOpen = useSelector(state => state.ui.isProfileOpen);
  const isMobileMenuOpen = useSelector(state => state.ui.isMobileMenuOpen);
  const isAiPaneOpen = useSelector(state => state.ui.isAiPaneOpen);
  const selectedModel = useSelector(state => state.model.selectedModel);
  const visionModel = useSelector(state => state.model.visionModel);
  const modelConfig = useSelector(state => state.model.modelConfig);
  const imageDescription = useSelector(state => state.analysis.imageDescription);
  const isUploadingImage = useSelector(state => state.analysis.isUploadingImage);

  const [uploadedVisionFiles, setUploadedVisionFiles] = useState([]);

  const setIsLoggingIn = (val) => dispatch(setIsLoggingInAction(val));
  const setSession = (val) => dispatch(setSessionAction(val));
  const setSessionInput = (val) => dispatch(setSessionInputAction(val));
  const setPrepStep = (val) => dispatch(setPrepStepAction(val));
  const setCurrentModel = (val) => dispatch(setCurrentModelAction(val));
  const setDarkMode = (val) => dispatch(setDarkModeAction(val));
  const setStepTimestamps = (val) => dispatch(setStepTimestampsAction(val));
  const setToast = (val) => dispatch(setToastAction(val));
  const setConfirmModal = (val) => dispatch(setConfirmModalAction(val));
  const setAnalyticsData = (val) => dispatch(setAnalyticsDataAction(val));
  const setActiveView = (val) => dispatch(setActiveViewAction(val));
  const setIsProfileOpen = (val) => dispatch(setProfileOpenAction(val));
  const setIsMobileMenuOpen = (val) => dispatch(setMobileMenuOpenAction(val));
  const setIsAiPaneOpen = (val) => dispatch(setAiPaneOpenAction(val));
  const setSelectedModel = (val) => dispatch(setSelectedModelRedux(val));
  const setVisionModel = (val) => dispatch(setVisionModelAction(val));
  const setModelConfig = (val) => dispatch(setModelConfigAction(val));
  const setImageDescription = (val) => dispatch(setImageDescriptionAction(val));
  const setIsUploadingImage = (val) => dispatch(setIsUploadingImageRedux(val));

  const getAuthHeaders = useCallback((extraHeaders = {}) => {
    const token = import.meta.env.VITE_HF_TOKEN;
    const headers = { ...extraHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Persist to localStorage
  useEffect(() => { saveState('highestStep', highestStep); }, [highestStep]);
  useEffect(() => { saveState('selections', selections); }, [selections]);
  useEffect(() => { saveState('notes', notes); }, [notes]);
  useEffect(() => { saveState('finalCommand', finalCommand); }, [finalCommand]);
  useEffect(() => { saveState('commandLocked', commandLocked); }, [commandLocked]);
  useEffect(() => { saveState('weaponLocked', weaponLocked); }, [weaponLocked]);
  useEffect(() => { saveState('interSelections', interSelections); }, [interSelections]);
  useEffect(() => { saveState('strikeSelections', strikeSelections); }, [strikeSelections]);
  useEffect(() => { saveState('session', session); }, [session]);
  useEffect(() => { saveState('activeSessionId', activeSessionId); }, [activeSessionId]);
  useEffect(() => { saveState('stepTimestamps', stepTimestamps); }, [stepTimestamps]);
  useEffect(() => { saveState('darkMode', darkMode); }, [darkMode]);
  useEffect(() => { saveState('selectedModel', selectedModel); }, [selectedModel]);
  useEffect(() => { saveState('visionModel', visionModel); }, [visionModel]);
  useEffect(() => { saveState('imageDescription', imageDescription); }, [imageDescription]);
  useEffect(() => { saveState('modelConfig', modelConfig); }, [modelConfig]);

  // Helper to get active model and provider safely
  const getActiveModel = useCallback(() => {
    const [provider, model_id] = selectedModel.split('|');
    console.log('getActiveModel trace:', { selectedModel, provider, model_id });
    if (!model_id) {
      const fallback = availableModels[0]?.id || 'google|gemini-3.1-flash';
      const [fProvider, fModelId] = fallback.split('|');
      console.log('getActiveModel fallback used:', { fallback, fProvider, fModelId });
      return { provider: fProvider, model_id: fModelId };
    }
    return { provider, model_id };
  }, [selectedModel, availableModels]);

  // Helper to get active vision model safely
  const getActiveVisionModel = useCallback(() => {
    const [provider, model_id] = visionModel.split('|');
    if (!model_id) {
      const fallback = availableModels[0]?.id || 'google|gemini-3.1-flash-lite';
      const [fProvider, fModelId] = fallback.split('|');
      return { provider: fProvider, model_id: fModelId };
    }
    return { provider, model_id };
  }, [visionModel, availableModels]);

  // Auto-save log details — debounced 1.5s
  useEffect(() => {
    if (!activeEditLog?.id || Object.keys(editFormData).length === 0) return;
    const timer = setTimeout(() => {
      fetch(`${API_BASE}/api/logs/${encodeURIComponent(activeEditLog.id)}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(editFormData)
      }).then(res => res.json()).then(data => setActiveEditLog(data)).catch(() => { });
    }, 1500);
    return () => clearTimeout(timer);
  }, [editFormData]);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // History sync
  useEffect(() => {
    const handlePopState = (e) => {
      if (e.state) {
        if (e.state.prepStep !== undefined) setPrepStep(e.state.prepStep);
        if (e.state.activeView !== undefined) setActiveView(e.state.activeView);
        if (e.state.activeSessionId !== undefined) setActiveSessionId(e.state.activeSessionId);
      }
    };
    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) {
      window.history.replaceState({ prepStep, activeView, activeSessionId }, '', window.location.pathname);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const currentState = window.history.state;
    if (currentState &&
      currentState.prepStep === prepStep &&
      currentState.activeView === activeView &&
      currentState.activeSessionId === activeSessionId) return;
    window.history.pushState({ prepStep, activeView, activeSessionId }, '', window.location.pathname);
  }, [prepStep, activeView, activeSessionId]);

  // Sidebar mutual exclusivity
  const toggleTradeData = () => {
    setIsLoggerOpen(!isLoggerOpen);
    setIsAiPaneOpen(false);
  };
  const toggleAnalyst = () => {
    setIsAiPaneOpen(!isAiPaneOpen);
    setIsLoggerOpen(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isAiLoading) return;

    const userMsg = { role: 'user', text: chatInput };
    dispatch(appendChatMessage(userMsg));
    setChatInput('');
    setIsAiLoading(true);
    dispatch(setIsAiLoadingRedux(true));

    let image_base64 = null;
    let image_type = null;

    if (uploadedVisionFiles.length > 0) {
      const file = uploadedVisionFiles[0];
      image_type = file.type;
      
      const readAsDataURL = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      try {
        const dataUrl = await readAsDataURL(file);
        image_base64 = dataUrl.split(',')[1];
      } catch (e) {
        console.error('Failed to read file as base64:', e);
      }
    }

    try {
      // Build context object
      const contextObj = includeData ? {
        asset: session?.assetName || activeEditLog?.phase1?.asset_ticker,
        selections: selections,
        notes: notes,
        active_log_id: activeEditLog?.id,
        current_step: highestStep,
        image_description: imageDescription
      } : null;

      const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
      console.log('handleSendMessage modelIdVal:', modelIdVal);
      console.log('handleSendMessage modelConfig:', modelConfig);
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          messages: [...chatHistory, userMsg],
          include_doctrine: includeDoctrine,
          context_data: contextObj,
          provider: providerVal,
          llm_config: { ...modelConfig, model_id: modelIdVal },
          image_base64: image_base64,
          image_type: image_type
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Chat Error:', response.status, errorText);
        throw new Error('Neural Link Timeout');
      }
      const data = await response.json();
      
      dispatch(appendChatMessage({ role: 'ai', text: data.text }));
    } catch (err) {
      console.error('Chat fetch error:', err);
      showToast('NETRA Neural Link Interrupted', 'error');
      dispatch(appendChatMessage({ role: 'ai', text: "Protocol error: My neural link to the terminal's core was briefly interrupted. Please retry the transmission." }));
    } finally {
      setIsAiLoading(false);
      dispatch(setIsAiLoadingRedux(false));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.ctrlKey && e.key === 'l') { e.preventDefault(); toggleTradeData(); }
      if (e.ctrlKey && e.key === 'a') { e.preventDefault(); toggleAnalyst(); }
      if (e.key === 'Escape' && confirmModal) { setConfirmModal(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [confirmModal]);

  const getNCSBreakdown = () => {
    return Object.entries(WEIGHTS).map(([key, weight]) => {
      const raw = SCORES[key]?.[selections[key]] || 0;
      return { dim: key, selection: selections[key], raw, weight, contrib: (raw * weight) };
    });
  };

  const fetchAnalytics = (modelId = 'pinaka') => {
    fetch(`${API_BASE}/api/analytics?model_id=${modelId}`, {
      headers: getAuthHeaders()
    })
      .then(r => r.json()).then(d => setAnalyticsData(d)).catch(() => { });
  };

  const handleAuth = () => {
    setIsLoggingIn(true);
    fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ username: sessionInput.userName, password: sessionInput.password })
    })
      .then(res => { if (res.ok) return res.json(); throw new Error('Invalid credentials'); })
      .then(data => {
        setSession({ userName: data.user, assetName: null, tradeName: null });
        fetchAnalytics();
        setPrepStep(1);
      })
      .catch(err => showToast(err.message, 'error'))
      .finally(() => setIsLoggingIn(false));
  };

  const resetTerminalState = () => {
    setHighestStep(1);
    setCommandLocked(false);
    setWeaponLocked(false);
    setSelections({ bias: '', auction: '', liquidity: '', behaviour: '' });
    setNotes({ bias: '', auction: '', liquidity: '', behaviour: '' });
    setInterSelections({ pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' });
    setStrikeSelections({ imbalance: '', pullback: '', trigger: '' });
    setFinalCommand(null);
    setNetraOutput(null);
    setSysRecommendation(null);
    setSelectedWeaponId(null);
    setStepTimestamps({});
    setTradeName('');
    dispatch(setTradeNameRedux(''));
    setEditFormData({});
    setAuditData(null);
    setIsAuditing(false);
  };

  const fetchLogs = (modelId = 'pinaka') => {
    fetch(`${API_BASE}/api/logs?model_id=${modelId}`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json())
      .then(data => {
        setTradeLogs(data);
        dispatch(setTradeLogsRedux(data));
      })
      .catch(() => console.error('Logger offline'));
  };

  useEffect(() => {
    if (session) { fetchLogs(currentModel); fetchAnalytics(currentModel); }
  }, [session, currentModel]);

  const saveSession = useCallback(() => {
    if (!activeSessionId) return;
    const currentState = {
      highestStep, selections, notes, interSelections, strikeSelections,
      finalCommand, netraOutput, sysRecommendation, selectedWeaponId,
      stepTimestamps, tradeName, assetName: session?.assetName || ''
    };
    fetch(`${API_BASE}/api/logs/${encodeURIComponent(activeSessionId)}/state`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(currentState)
    }).then(() => { showToast('Session Saved'); fetchLogs(); })
      .catch(() => showToast('Save failed', 'error'));
  }, [activeSessionId, highestStep, selections, notes, interSelections, strikeSelections, finalCommand, netraOutput, sysRecommendation, selectedWeaponId, stepTimestamps, tradeName, session]);

  useEffect(() => {
    if (activeSessionId && highestStep > 1) saveSession();
  }, [highestStep]);

  const resumeSession = (log) => {
    if (!log || !log.session_state) return;
    const state = log.session_state;
    setHighestStep(state.highestStep || 1);
    setSelections(state.selections || { bias: '', auction: '', liquidity: '', behaviour: '' });
    setNotes(state.notes || { bias: '', auction: '', liquidity: '', behaviour: '' });
    setInterSelections(state.interSelections || { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' });
    setStrikeSelections(state.strikeSelections || { imbalance: '', pullback: '', trigger: '' });
    setFinalCommand(state.finalCommand || null);
    setNetraOutput(state.netraOutput || null);
    setSysRecommendation(state.sysRecommendation || null);
    setSelectedWeaponId(state.selectedWeaponId || null);
    setStepTimestamps(state.stepTimestamps || {});
    const name = log.name || state.tradeName || '';
    setTradeName(name);
    dispatch(setTradeNameRedux(name));
    const assetName = log.phase2?.trading_asset || state.assetName || log.phase1?.asset_ticker || '';
    setNotes(prev => ({ ...prev, ...(state.notes || {}), bias: log.phase3?.notes || state.notes?.bias || '' }));
    if (window.innerWidth < 1024) setIsLoggerOpen(false);
    setSession({ userName: session?.userName || 'User', assetName, tradeName: log.name || state.tradeName || '' });
    setActiveSessionId(log.id);
    saveState('activeSessionId', log.id);
    setActiveView('terminal');
    setActiveEditLog(log);
    setEditFormData({ ...log.phase2, ...log.phase3, ...log.phase4, trade_name: log.name });
    setIsLoggerOpen(true);
    showToast(`Resumed: ${state.tradeName || log.id}`);
  };

  const commitTradeLog = (weapon) => {
    const selNotes = [
      Object.keys(selections.bias || {}).length > 0 && `Bias: ${Object.values(selections.bias).join(', ')}${notes.bias ? ' — ' + notes.bias : ''}`,
      Object.keys(selections.auction || {}).length > 0 && `Auction: ${Object.values(selections.auction).join(', ')}${notes.auction ? ' — ' + notes.auction : ''}`,
      Object.keys(selections.liquidity || {}).length > 0 && `Liquidity: ${Object.values(selections.liquidity).join(', ')}${notes.liquidity ? ' — ' + notes.liquidity : ''}`,
      Object.keys(selections.behaviour || {}).length > 0 && `Behaviour: ${Object.values(selections.behaviour).join(', ')}${notes.behaviour ? ' — ' + notes.behaviour : ''}`,
    ].filter(Boolean).join(' | ');
    const stsData = finalCommand === 'INTERCEPTION'
      ? Object.entries(interSelections).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
      : finalCommand === 'STRIKE'
        ? Object.entries(strikeSelections).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '';
    const finalWeapon = editFormData.manual_weapon || weapon || selectedWeaponId || 'NONE';
    const payload = {
      model_id: currentModel, username: session?.userName || 'Unknown',
      ...selections, bias_note: notes.bias, auction_note: notes.auction,
      liquidity_note: notes.liquidity, behaviour_note: notes.behaviour,
      weapon: finalWeapon, protocol: finalCommand || 'UNKNOWN',
      asset_ticker: editFormData.trading_asset || (session?.assetName || ''),
      trade_name: editFormData.trade_name || `${finalWeapon} [${session?.userName || ''}] ${new Date().toLocaleTimeString('en-IN')}`,
      trading_asset: editFormData.trading_asset, entry_price: editFormData.entry_price,
      stop_loss: editFormData.stop_loss, take_profit: editFormData.take_profit,
      buying_type: editFormData.buying_type, manual_weapon: editFormData.manual_weapon,
      additional_cost: editFormData.additional_cost, notes: editFormData.notes,
      _selNotes: selNotes, _stsData: stsData,
      vision_data: imageDescription,
      market_type_analysis: netraOutput?.analysis || null,
      entry_model_analysis: netraOutput?.reasoning || null,
      audit_data: null
    };
    fetch(`${API_BASE}/api/logs`, {
      method: 'POST', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      fetchLogs();
      setActiveEditLog(data);
      dispatch(setActiveEditLogRedux(data));
      const formData = { ...data.phase2, ...data.phase3, trade_name: data.name, asset_ticker: data.phase2?.asset_ticker || (session?.assetName || ''), notes: data.phase3?.notes || '' };
      setEditFormData(formData);
      dispatch(setEditFormDataRedux(formData));
      setIsLoggerOpen(true);
      setTradeName('');
      dispatch(setTradeNameRedux(''));
      showToast('Mission Log Committed (FIRED)');
    }).catch(() => showToast('Firing Sequence Failure', 'error'));
  };

  const updateTradeLog = (tradeId) => {
    if (!tradeId) return;
    const entry = parseFloat(editFormData.entry_price) || 0;
    const cost = parseFloat(editFormData.additional_cost) || 0;
    const exit = parseFloat(editFormData.exit_price) || 0;
    const be = entry + cost;
    let outcome = 'Breakeven';
    if (exit > be) outcome = 'Win';
    if (exit > 0 && exit < be) outcome = 'Loss';
    if (exit === 0) outcome = 'Open';
    const updatedData = { ...editFormData, outcome, audit_data: auditData, vision_data: imageDescription };
    fetch(`${API_BASE}/api/logs/${encodeURIComponent(tradeId)}`, {
      method: 'PUT', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(updatedData)
    }).then(res => res.json()).then(data => {
      fetchLogs();
      setActiveEditLog(data);
      setEditFormData({ ...data.phase2, ...data.phase3, ...data.phase4, trade_name: data.name });
      showToast('Mission Protocol Updated Successfully');
    });
  };

  const deleteTradeLog = (tradeId) => {
    if (!tradeId) return;
    setConfirmModal({
      title: 'Delete Trade?',
      desc: 'This trade will be permanently removed from the ledger. This cannot be undone.',
      onConfirm: () => {
        fetch(`${API_BASE}/api/logs/${encodeURIComponent(tradeId)}`, { 
          method: 'DELETE',
          headers: getAuthHeaders()
        })
          .then(() => { fetchLogs(); setActiveEditLog(null); setConfirmModal(null); showToast('Trade deleted'); });
      }
    });
  };

  const initializeMission = () => {
    if (!sessionInput.tradeName || !sessionInput.assetName) { showToast('Trade Info Required', 'error'); return; }
    resetTerminalState();
    const payload = {
      model_id: currentModel, username: session?.userName || 'Unknown',
      bias: '-', auction: '-', liquidity: '-', behaviour: '-',
      weapon: 'INITIALIZING',
      protocol: sessionInput.modelName === 'trishul' ? 'TRISHUL' : 'PINAKA',
      trade_name: sessionInput.tradeName, asset_ticker: sessionInput.assetName,
      session_state: {
        highestStep: 1,
        selections: { bias: {}, auction: {}, liquidity: {}, behaviour: {} },
        notes: { bias: '', auction: '', liquidity: '', behaviour: '' },
        interSelections: { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' },
        strikeSelections: { imbalance: '', pullback: '', trigger: '' },
        finalCommand: null, netraOutput: null, sysRecommendation: null,
        selectedWeaponId: null, stepTimestamps: {},
        tradeName: sessionInput.tradeName, assetName: sessionInput.assetName
      }
    };
    fetch(`${API_BASE}/api/logs`, {
      method: 'POST', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(payload)
    }).then(res => { if (!res.ok) throw new Error('Schema Validation Failed'); return res.json(); })
      .then(data => {
        setActiveSessionId(data.id);
        saveState('activeSessionId', data.id);
        setTradeName(data.name);
        setSession(prev => ({ ...prev, assetName: sessionInput.assetName, tradeName: sessionInput.tradeName }));
        setPrepStep(2);
        setActiveView(sessionInput.modelName === 'trishul' ? 'trishul' : 'terminal');
        showToast('Mission Initialized');
        setIsLoggerOpen(true);
        setIsAiPaneOpen(false);
        fetchLogs();
        setSessionInput(prev => ({ ...prev, assetName: '', tradeName: '' }));
      }).catch(() => showToast('Persistence Failure: Check Schema', 'error'));
  };

  // Fetch system data and models
  useEffect(() => {
    fetch(`${API_BASE}/api/system-data`, {
      headers: getAuthHeaders()
    })
      .then(res => res.json()).then(data => setSysData(data))
      .catch(() => console.error('Engine Offline'));

    fetch(`${API_BASE}/api/models`)
      .then(res => res.json())
      .then(data => {
        const flatModels = [];
        (data.providers || []).forEach(provider => {
          provider.models.forEach(model => {
            const tagsStr = model.tags.join(' & ');
            const displayName = `${provider.provider} : ${model.name}, ${model.cost} Cost, ${tagsStr}`;
            flatModels.push({
              name: displayName,
              id: `${provider.provider.toLowerCase()}|${model.id}`,
              cost: model.cost,
              tags: model.tags
            });
          });
        });
        setAvailableModels(flatModels);
        dispatch(setAvailableModelsRedux(flatModels));
        
        const isValid = flatModels.some(m => m.id === selectedModel);
        let nextModel = selectedModel;
        
        if (!isValid) {
          const defaultProvider = data.tactical_provider || 'google';
          const providerObj = data.providers?.find(p => p.provider.toLowerCase() === defaultProvider.toLowerCase());
          if (providerObj && providerObj.models?.length > 0) {
            const defaultId = `${providerObj.provider.toLowerCase()}|${providerObj.models[0].id}`;
            const isValidDefault = flatModels.some(m => m.id === defaultId);
            if (isValidDefault) nextModel = defaultId;
          } else {
            nextModel = flatModels.length > 0 ? flatModels[0].id : selectedModel;
          }
        }
        
        setSelectedModel(nextModel);
      })
      .catch((err) => console.error('Failed to load models', err));
  }, []);

  // Manually triggered Neural Synthesis
  const triggerNeuralSynthesis = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setNetraOutput(null); // Reset previous output

    // Initialize AbortController
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    fetch(`${API_BASE}/api/evaluate-netra`, {
      method: 'POST', 
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }), 
      body: JSON.stringify({ 
        ...selections, 
        provider: providerVal, 
        model_config: { ...modelConfig, model_id: modelIdVal },
        image_description: imageDescription
      }),
      signal: abortControllerRef.current.signal
    }).then(res => { 
        if (!res.ok) throw new Error(); 
        return res.json(); 
      })
      .then(data => { 
        setNetraOutput(data); 
        setIsEvaluating(false); 
        showToast('Neural Synthesis Complete');
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          showToast('NETRA Synthesis Stopped', 'info');
          return;
        }
        setNetraOutput({ cmd: 'NO ENGAGEMENT', conviction: 'ERROR', size: '0%', synthesis: 'Neural Engine Sync Failure. Check System Logs.' });
        setIsEvaluating(false);
        showToast('Neural Engine Sync Failure', 'error');
      });
  };

  const stopSynthesis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsEvaluating(false);
    }
  };

  // NETRA Phase 2: Weapon Prediction
  const triggerWeaponPrediction = () => {
    if (isPredictingWeapon) return;
    setIsPredictingWeapon(true);
    setWeaponPrediction(null);

    if (weaponAbortControllerRef.current) weaponAbortControllerRef.current.abort();
    weaponAbortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    const payload = {
      bias: selections.bias,
      auction: selections.auction,
      liquidity: selections.liquidity,
      behaviour: selections.behaviour,
      command: finalCommand,
      sts_dims: finalCommand === 'STRIKE' ? strikeSelections : interSelections,
      notes: notes.command,
      strategy_reasoning: netraOutput?.analysis, // Pass reasoning from Layer 1
      provider: providerVal,
      model_config: { ...modelConfig, model_id: modelIdVal },
      image_description: imageDescription
    };

    fetch(`${API_BASE}/api/predict-weapon`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
      signal: weaponAbortControllerRef.current.signal
    })
    .then(res => res.json())
    .then(data => {
      setWeaponPrediction(data);
      setIsPredictingWeapon(false);
      showToast('Weapon Prediction Ready');
    })
    .catch(err => {
      if (err.name === 'AbortError') {
        showToast('Prediction Stopped', 'info');
      } else {
        showToast('Prediction Failure', 'error');
      }
      setIsPredictingWeapon(false);
    });
  };

  const stopWeaponPrediction = () => {
    if (weaponAbortControllerRef.current) {
      weaponAbortControllerRef.current.abort();
      weaponAbortControllerRef.current = null;
      setIsPredictingWeapon(false);
    }
  };

  const auditData = useSelector(state => state.logs.auditData);
  const isAuditing = useSelector(state => state.logs.isAuditing);

  const setAuditData = (val) => dispatch(setAuditDataAction(val));
  const setIsAuditing = (val) => dispatch(setIsAuditingAction(val));
  
  const auditAbortControllerRef = useRef(null);

  const triggerPostTradeAudit = (tradeTelemetry) => {
    if (isAuditing) return;
    setIsAuditing(true);
    setAuditData(null);

    if (auditAbortControllerRef.current) auditAbortControllerRef.current.abort();
    auditAbortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    fetch(`${API_BASE}/api/ai/post-trade-audit`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ 
        ...tradeTelemetry, 
        strategy_analysis: netraOutput?.analysis,
        execution_plan: weaponPrediction?.weapon,
        provider: providerVal, 
        model_config: { ...modelConfig, model_id: modelIdVal },
        image_description: imageDescription
      }),
      signal: auditAbortControllerRef.current.signal
    })
    .then(res => res.json())
    .then(data => {
      setAuditData(data);
      setIsAuditing(false);
      showToast('Tactical Audit Complete');
    })
    .catch(err => {
      if (err.name === 'AbortError') {
        showToast('Audit Stopped', 'info');
      } else {
        showToast('Audit Failure', 'error');
      }
      setIsAuditing(false);
    });
  };

  const stopPostTradeAudit = () => {
    if (auditAbortControllerRef.current) {
      auditAbortControllerRef.current.abort();
      auditAbortControllerRef.current = null;
      setIsAuditing(false);
    }
  };




  const [visionAbortController, setVisionAbortController] = useState(null);

  const stopVisualAnalysis = () => {
    if (visionAbortController) {
      visionAbortController.abort();
      setVisionAbortController(null);
    }
    setIsUploadingImage(false);
    showToast('Visual Analysis Aborted', 'warning');
  };

  const uploadAndDescribeImage = async () => {
    if (uploadedVisionFiles.length === 0) return;
    setIsUploadingImage(true);
    dispatch(setIsUploadingImageRedux(true));
    
    const controller = new AbortController();
    setVisionAbortController(controller);

    const formData = new FormData();
    uploadedVisionFiles.forEach(f => formData.append('files', f));
    
    const { provider: providerVal, model_id: modelIdVal } = getActiveVisionModel();
    formData.append('provider', providerVal);
    formData.append('model_config', JSON.stringify({ ...modelConfig, model_id: modelIdVal }));

    try {
      showToast('Analyzing Tactical Visuals...', 'success');
      const response = await fetch(`${API_BASE}/api/ai/describe-image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
        signal: controller.signal
      });
      const data = await response.json();
      if (data.description) {
        setImageDescription(data.description);
        showToast('Visual Analysis Cached', 'success');
        dispatch(appendChatMessage({ role: 'ai', text: `**Visual Analysis Cached:**\n\n${data.description}` }));
      } else {
        showToast(data.error || 'Failed to analyze image', 'error');
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('Visual analysis aborted');
      } else {
        showToast('Connection failed', 'error');
      }
    } finally {
      setIsUploadingImage(false);
      dispatch(setIsUploadingImageRedux(false));
      setVisionAbortController(null);
    }
  };

  // STS recommendation evaluation
  useEffect(() => {
    const cmd = finalCommand || (netraOutput ? netraOutput.cmd : null);
    if (highestStep >= 5 && cmd && (cmd === 'STRIKE' || cmd === 'INTERCEPTION')) {
      const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
      const endpoint = cmd === 'STRIKE' ? `${API_BASE}/api/evaluate-strike` : `${API_BASE}/api/evaluate-interception`;
      fetch(endpoint, {
        method: 'POST', headers: getAuthHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify({ ...selections, provider: providerVal, model_config: { ...modelConfig, model_id: modelIdVal } })
      }).then(res => res.json()).then(data => setSysRecommendation(data)).catch(console.error);
    }
  }, [highestStep, finalCommand, netraOutput, selections]);

  // Bi-directional binding: Sidebar → Terminal state
  useEffect(() => {
    if (activeSessionId && activeEditLog && activeSessionId === activeEditLog.id) {
      if (editFormData.trade_name && editFormData.trade_name !== tradeName) {
        setTradeName(editFormData.trade_name);
        dispatch(setTradeNameRedux(editFormData.trade_name));
      }
      if (editFormData.notes && editFormData.notes !== notes.bias) setNotes(prev => ({ ...prev, bias: editFormData.notes }));
    }
  }, [editFormData, activeSessionId, activeEditLog]);

  const confirmStep = (stepLevel) => {
    if (highestStep === stepLevel) {
      setHighestStep(stepLevel + 1);
      setStepTimestamps(prev => ({ ...prev, [STEP_NAMES[stepLevel]]: new Date().toLocaleTimeString('en-IN') }));
      showToast(`Step ${stepLevel} confirmed`);
    }
  };

  const editStep = (stepLevel) => {
    setHighestStep(stepLevel);
    if (stepLevel <= 4) { setFinalCommand(null); setNetraOutput(null); setSysRecommendation(null); setSelectedWeaponId(null); setCommandLocked(false); }
    if (stepLevel <= 5) { setFinalCommand(null); setCommandLocked(false); }
    if (stepLevel <= 6) { setSelectedWeaponId(null); setWeaponLocked(false); }
    if (stepLevel <= 7) { setWeaponLocked(false); }
  };

  const doResetStep = (stepLevel) => {
    const stepKeys = ['bias', 'auction', 'liquidity', 'behaviour'];
    const key = stepKeys[stepLevel - 1];
    if (key) { setSelections(prev => ({ ...prev, [key]: {} })); setNotes(prev => ({ ...prev, [key]: '' })); }
    setHighestStep(stepLevel);
    if (stepLevel <= 4) { setFinalCommand(null); setNetraOutput(null); setSysRecommendation(null); setSelectedWeaponId(null); }
    if (stepLevel <= 5) { setFinalCommand(null); setCommandLocked(false); }
    setConfirmModal(null);
    showToast('Step reset');
  };

  const handleGlobalSave = () => {
    if (activeEditLog) { updateTradeLog(activeEditLog.id); return; }
    showToast('No active session to save', 'error');
  };

  const value = {
    // System data
    sysData,
    SYSTEM_DATA: sysData || { 
      weapons: { strike: [], interception: [] }, 
      bias: { dimensions: [] }, 
      auction: { dimensions: [] }, 
      liquidity: { dimensions: [] }, 
      behaviour: { dimensions: [] },
      strikeDimensions: [],
      interceptionDimensions: []
    },
    // Step state
    highestStep, setHighestStep, confirmStep, editStep, doResetStep,
    stepTimestamps, setStepTimestamps,
    // Selections & notes
    selections, setSelections,
    notes, setNotes,
    interSelections, setInterSelections,
    strikeSelections, setStrikeSelections,
    // Command flow
    finalCommand, setFinalCommand,
    commandLocked, setCommandLocked,
    weaponLocked, setWeaponLocked,
    selectedWeaponId, setSelectedWeaponId,
    netraOutput, setNetraOutput,
    sysRecommendation, setSysRecommendation,
    isEvaluating,
    // Session
    session, setSession,
    sessionInput, setSessionInput,
    prepStep, setPrepStep,
    activeSessionId, setActiveSessionId,
    activeView, setActiveView,
    currentModel, setCurrentModel,
    tradeName, setTradeName,
    handleAuth, initializeMission, resumeSession, saveSession, resetTerminalState,
    // Logs
    tradeLogs, fetchLogs,
    activeEditLog, setActiveEditLog,
    editFormData, setEditFormData,
    logSearchTerm, setLogSearchTerm,
    logFilterOutcome, setLogFilterOutcome,
    logSortOrder, setLogSortOrder,
    commitTradeLog, updateTradeLog, deleteTradeLog, handleGlobalSave,
    // AI Chat
    chatHistory, setChatHistory, chatInput, setChatInput,
    isAiLoading, setIsAiLoading,
    includeData, setIncludeData,
    includeDoctrine, setIncludeDoctrine,
    handleSendMessage,
    // UI state
    darkMode, setDarkMode,
    toast, setToast,
    confirmModal, setConfirmModal,
    analyticsData, fetchAnalytics,
    isLoggerOpen, setIsLoggerOpen,
    isAiPaneOpen, setIsAiPaneOpen,
    isProfileOpen, setIsProfileOpen,
    isMobileMenuOpen, setIsMobileMenuOpen,
    isLoggingIn,
    toggleTradeData, toggleAnalyst,
    // Utilities
    showToast, getNCSBreakdown, triggerNeuralSynthesis, stopSynthesis,
    triggerWeaponPrediction, stopWeaponPrediction, isPredictingWeapon, weaponPrediction,
    auditData, setAuditData, isAuditing, setIsAuditing, triggerPostTradeAudit, stopPostTradeAudit,
    selectedModel, setSelectedModel,
    visionModel, setVisionModel,
    AVAILABLE_MODELS: availableModels,
    modelConfig, setModelConfig,
    imageDescription, setImageDescription, uploadAndDescribeImage, isUploadingImage,
    uploadedVisionFiles, setUploadedVisionFiles, stopVisualAnalysis
  };

  return <NetraContext.Provider value={value}>{children}</NetraContext.Provider>;
}

export const useNetra = () => {
  const ctx = useContext(NetraContext);
  if (!ctx) throw new Error('useNetra must be used inside <NetraProvider>');
  return ctx;
};
