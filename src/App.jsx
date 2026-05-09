import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNetra } from './context/NetraContext';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedModel, setModelConfig } from './store/slices/modelSlice';
import { setIncludeData, setIncludeDoctrine, setChatInput } from './store/slices/chatSlice';
import { setTradeName, setLogSearchTerm, setLogFilterOutcome, setLogSortOrder } from './store/slices/logsSlice';
import { setSessionInput } from './store/slices/sessionSlice';
import Login from './components/Auth/Login';
import GlobalOverlay from './components/Layout/GlobalOverlay';
import Phase0Vision from './components/Terminal/Phase0Vision';
import Phase1Bias from './components/Terminal/Phase1Bias';
import Phase2Auction from './components/Terminal/Phase2Auction';
import Phase3Liquidity from './components/Terminal/Phase3Liquidity';
import Phase4Behaviour from './components/Terminal/Phase4Behaviour';
import Phase5Synthesis from './components/Terminal/Phase5Synthesis';
import Phase6Command from './components/Terminal/Phase6Command';
import Phase8WeaponIntel from './components/Terminal/Phase8WeaponIntel';
import Phase9WeaponArmory from './components/Terminal/Phase9WeaponArmory';
import Phase10MissionControl from './components/Terminal/Phase10MissionControl';

const MessageContent = ({ text }) => {
  if (typeof text !== 'string') text = JSON.stringify(text);
  
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const match = text.match(thinkRegex);
  
  if (match) {
    const thinking = match[1];
    const response = text.replace(thinkRegex, '').trim();
    
    return (
      <>
        <details className="mb-2 bg-white/5 rounded-lg p-2 border border-white/10">
          <summary className="text-xs font-bold text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors">
            Thoughts
          </summary>
          <div className="mt-1 text-xs text-white/70 whitespace-pre-wrap">
            {thinking}
          </div>
        </details>
        <ReactMarkdown children={response} />
      </>
    );
  }
  
  return <ReactMarkdown children={text} />;
};
import MarketTypeSelector from './components/Terminal/MarketTypeSelector';
import ProfilePage from './components/Terminal/ProfilePage';

// Protocol sub-views (small, kept inline)
function NoEngagementProtocol() {
  return (
    <div className="flex flex-col items-center justify-center p-16 lg:p-32 rounded-xl relative overflow-hidden group premium-shadow" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="text-[var(--text-1)] font-sans text-4xl lg:text-7xl font-bold tracking-tight uppercase mb-6 text-center relative z-10">
        Stand Down
      </div>
      <div className="text-[var(--text-3)] font-sans text-[11px] font-semibold tracking-widest uppercase text-center max-w-2xl leading-relaxed mb-10 relative z-10">
        Capital Preservation Mode <span className="mx-2 text-[var(--border-strong)]">///</span> The system detects conflicting data streams or an absence of structural asymmetry.
      </div>
      <div className="text-red-500 font-sans text-xs font-bold uppercase tracking-widest text-center py-4 px-8 border border-red-500/20 bg-red-500/5 rounded-lg relative z-10">
        Override Active. Do Not Deploy Capital.
      </div>
    </div>
  );
}

function StrikeProtocol() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
      <WeaponArmory protocol="STRIKE" />
    </div>
  );
}

function InterceptionProtocol() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
      <WeaponArmory protocol="INTERCEPTION" />
    </div>
  );
}

export default function NetraTerminal() {
  const chatContainerRef = useRef(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const {
    session, setSession, sysData,
    prepStep, setPrepStep,
    activeSessionId, setActiveSessionId,
    activeView, setActiveView,
    currentModel, setCurrentModel,
    isProfileOpen, setIsProfileOpen,
    isLoggerOpen, setIsLoggerOpen,
    isAiPaneOpen, setIsAiPaneOpen,
    darkMode, setDarkMode,
    toggleTradeData, toggleAnalyst,
    confirmModal, setConfirmModal,
    commitTradeLog, updateTradeLog, deleteTradeLog,
    resumeSession, resetTerminalState,
    initializeMission, handleGlobalSave,
    saveSession,
    confirmStep, editStep, doResetStep,
    fetchAnalytics,
    showToast,
    handleSendMessage,
    getNCSBreakdown,
    uploadAndDescribeImage,
    uploadedVisionFiles, setUploadedVisionFiles
  } = useNetra();

  const toast = useSelector(state => state.ui.toast);
  const tradeLogs = useSelector(state => state.logs.tradeLogs);
  const logSearchTerm = useSelector(state => state.logs.logSearchTerm);
  const logFilterOutcome = useSelector(state => state.logs.logFilterOutcome);
  const logSortOrder = useSelector(state => state.logs.logSortOrder);
  const activeEditLog = useSelector(state => state.logs.activeEditLog);
  const editFormData = useSelector(state => state.logs.editFormData);
  const sessionInput = useSelector(state => state.session.sessionInput);
  const selections = useSelector(state => state.analysis.selections);
  const notes = useSelector(state => state.analysis.notes);
  const finalCommand = useSelector(state => state.analysis.finalCommand);
  const netraOutput = useSelector(state => state.analysis.netraOutput);
  const highestStep = useSelector(state => state.analysis.highestStep);
  const stepTimestamps = useSelector(state => state.analysis.stepTimestamps);
  const interSelections = useSelector(state => state.analysis.interSelections);
  const strikeSelections = useSelector(state => state.analysis.strikeSelections);
  const weaponLocked = useSelector(state => state.analysis.weaponLocked);
  const selectedWeaponId = useSelector(state => state.analysis.selectedWeaponId);
  const analyticsData = useSelector(state => state.analysis.analyticsData);
  const chatHistory = useSelector(state => state.chat.chatHistory);
  const chatInput = useSelector(state => state.chat.chatInput);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const selectedModel = useSelector(state => state.model.selectedModel);
  const AVAILABLE_MODELS = useSelector(state => state.model.availableModels);
  const modelConfig = useSelector(state => state.model.modelConfig);
  const includeData = useSelector(state => state.chat.includeData);
  const includeDoctrine = useSelector(state => state.chat.includeDoctrine);
  const isAiLoading = useSelector(state => state.chat.isAiLoading);
  const isUploadingImage = useSelector(state => state.analysis.isUploadingImage);
  const tradeName = useSelector(state => state.logs.tradeName);
  const dispatch = useDispatch();

  const [isDockExpanded, setIsDockExpanded] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadCSV = () => {
    if (!tradeLogs || tradeLogs.length === 0) {
      showToast('No records available for export', 'error');
      return;
    }
    
    setIsDownloading(true);
    try {
      // Precise Header Definition
      const headers = [
        'MISSION_ID', 'TIMESTAMP', 'ASSET', 'MISSION_NAME', 'OPERATOR', 'PROTOCOL', 'WEAPON', 
        'BIAS_SELECT', 'AUCTION_SELECT', 'LIQUIDITY_SELECT', 'BEHAVIOUR_SELECT', 
        'ENTRY_PRICE', 'STOP_LOSS', 'EXIT_PRICE', 'OUTCOME', 'NET_PL', 'OPERATOR_THOUGHT'
      ];
      
      // Data Mapping Logic
      const rows = tradeLogs.map(log => [
        log.id,
        new Date(log.timestamp).toISOString(),
        log.phase1?.asset_ticker || '—',
        log.name || 'UNNAMED_MISSION',
        log.username || 'ANONYMOUS',
        log.phase1?.protocol || '—',
        log.weapon || '—',
        Object.values(log.phase1?.bias || {}).join('|'),
        Object.values(log.phase1?.auction || {}).join('|'),
        Object.values(log.phase1?.liquidity || {}).join('|'),
        Object.values(log.phase1?.behaviour || {}).join('|'),
        log.phase2?.entry_price || '0',
        log.phase2?.stop_loss || '0',
        log.phase4?.exit_price || '0',
        log.phase4?.outcome || 'OPEN',
        log.phase4?.pl || '0',
        (log.phase4?.user_thought || '').replace(/"/g, '""')
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `NETRA_LEDGER_EXPORT_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Tactical Ledger Exported Successfully');
    } catch (err) {
      showToast('Export Protocol Failure', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  // Auto-open logs when a session starts - DISABLED as per mission requirements
  /*
  useEffect(() => {
    if (activeSessionId || activeEditLog) {
      setIsLoggerOpen(true);
    }
  }, [activeSessionId, activeEditLog, setIsLoggerOpen]);
  */

  if (!session) return <Login />;

  if (!sysData) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] flex flex-col items-center justify-center font-sans">
        <h1 className="text-2xl font-bold tracking-tight uppercase mb-6 animate-pulse text-stone-700">Initializing Netra System...</h1>
        <p className="text-stone-400 text-[10px] text-center border-t border-stone-100 pt-4 px-8 mt-4 tracking-widest uppercase">Establishing Secure Connection to Engine</p>
        <GlobalOverlay />
      </div>
    );
  }

return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>

      <header style={{ height: '64px', position: 'sticky', top: 0, background: darkMode ? '#000' : '#fff', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: darkMode ? '1px solid white' : '1px solid #4169E1', zIndex: 200, flexShrink: 0 }} className="px-6 lg:px-10 flex justify-between items-center maxWidth-100">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: darkMode ? 'white' : '#4169E1' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          <button
            onClick={() => { if (session) { setPrepStep(1); setActiveSessionId(null); } }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: session ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ 
                fontSize: '20px', 
                fontWeight: 950, 
                letterSpacing: '0.1em', 
                color: darkMode ? 'white' : '#4169E1',
                lineHeight: 1, 
                marginBottom: 0,
                textTransform: 'uppercase'
              }}>NETRA</h1>
            </div>
          </button>

          <div className="desktop-only" style={{ width: '1px', height: '24px', background: darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(65, 105, 225, 0.3)', margin: '0 4px', opacity: 0.6 }}></div>

          <div className="desktop-only" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[
              { label: 'Home', active: prepStep === 1 && activeView !== 'profile', action: () => { setPrepStep(1); setActiveView('terminal'); setActiveSessionId(null); setIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Pinaka', active: prepStep > 1 && (currentModel === 'pinaka' || !currentModel), action: () => { setActiveView('terminal'); setCurrentModel('pinaka'); setPrepStep(2); setActiveSessionId(null); setIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Trishul', active: prepStep > 1 && currentModel === 'trishul', action: () => { setActiveView('trishul'); setCurrentModel('trishul'); setPrepStep(2); setActiveSessionId(null); setIsLoggerOpen(false); setIsAiPaneOpen(false); } }
            ].map((nav, i) => (
              <button
                key={nav.label}
                onClick={nav.action}
                style={{
                  padding: '6px 14px',
                  fontSize: '11px',
                  fontWeight: 850,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: nav.active ? '#4169E1' : (darkMode ? 'white' : '#4169E1'),
                  borderTop: 'none',
                  borderLeft: 'none',
                  borderRight: 'none',
                  borderBottom: nav.active ? '2px solid #4169E1' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  transition: 'all 150ms'
                }}
              >
                {nav.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* RIGHT SIDE: OPERATOR CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* GLOBAL CHART UPLOAD */}


          {/* QUICK NETRA CHAT (Blue Elite) */}
          <button
            onClick={() => setIsAiPaneOpen(!isAiPaneOpen)}
            title="Launch NETRA Console"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '16px',
              background: isAiPaneOpen ? 'linear-gradient(135deg, #4169E1, #6366f1)' : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(65, 105, 225, 0.05)'),
              border: `1px solid ${isAiPaneOpen ? '#4169E1' : (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(65, 105, 225, 0.2)')}`,
              color: darkMode ? 'white' : '#4169E1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isAiPaneOpen ? '0 0 20px rgba(65, 105, 225, 0.4)' : 'none',
              position: 'relative'
            }}
            className="hover:scale-110 active:scale-95 group"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18V9L12 15L20 9V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15L12 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
              <circle cx="12" cy="5" r="2" fill="currentColor" className={isAiPaneOpen ? "animate-pulse" : ""}/>
            </svg>
          </button>

          {/* Profile Dropdown (Unified Style) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}
            >
              <div style={{ 
                width: '38px', 
                height: '38px', 
                borderRadius: '16px', 
                background: isProfileOpen ? '#4169E1' : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(65, 105, 225, 0.05)'), 
                border: `1px solid ${isProfileOpen ? '#4169E1' : (darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(65, 105, 225, 0.2)')}`,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: darkMode ? 'white' : '#4169E1',
                transition: 'all 200ms' 
              }}>
                <span style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>
                  {(session?.userName || 'O')[0]}
                </span>
              </div>
            </button>

            {isProfileOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 140 }} onClick={() => setIsProfileOpen(false)}></div>
                <div 
                  className="animate-in fade-in duration-200 slide-in-from-top-1"
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '12px',
                    width: '240px',
                    background: darkMode ? '#050505' : '#FFFFFF',
                    border: darkMode ? '1px solid #222' : '1px solid #DDD',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    zIndex: 150
                  }}
                >
                  <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: darkMode ? '1px solid #111' : '1px solid #EEE' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Operator Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#4169E1', marginTop: '2px' }}>{session?.userName || 'Operator'}</div>
                  </div>
                  
                  <button onClick={() => {
                    setActiveView('profile');
                    setIsProfileOpen(false);
                  }} style={{ width: '100%', padding: '10px', borderRadius: '2px', border: '1px solid #333', background: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#888', marginBottom: '8px' }} className="hover:bg-blue-900 hover:text-white transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>View Profile</span>
                  </button>

                  <button onClick={() => {
                    setSession(null);
                    setPrepStep(0);
                    resetTerminalState();
                    localStorage.clear();
                  }} style={{ width: '100%', padding: '10px', borderRadius: '2px', border: '1px solid #333', background: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#888' }} className="hover:bg-red-900 hover:text-white transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
                    <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Theme Toggle */}
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light mode' : 'Dark mode'} />
        </div>
      </header>

      {/* SUB-HEADER: MISSION TELEMETRY BAR (Persistently visible when active) */}
      {activeSessionId && (
        <div 
          style={{ 
            height: '38px', 
            background: 'var(--surface)', 
            borderBottom: '1px solid var(--border)', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 40px',
            gap: '24px',
            zIndex: 90,
            animation: 'slide-down 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="desktop-only"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4169E1', boxShadow: '0 0 10px rgba(65, 105, 225, 0.6)' }} className="animate-pulse"></div>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#4169E1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Active Mission</span>
          </div>
          <div style={{ width: '1px', height: '14px', background: 'var(--border)', opacity: 0.5 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategy:</span>
              <span style={{ fontSize: '11px', fontWeight: 950, color: 'var(--text-1)', textTransform: 'uppercase' }}>{tradeName || 'Tactical_Alpha'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset:</span>
              <span style={{ fontSize: '11px', fontWeight: 950, color: 'var(--accent)', textTransform: 'uppercase' }}>{session?.assetName || activeEditLog?.phase1?.asset_ticker || 'Awaiting_Data'}</span>
            </div>
          </div>
        </div>
      )}

      {/* TACTICAL COMMAND DOCK — Unified Control Hub */}
      {prepStep >= 2 && activeSessionId && (activeView === 'terminal' || activeView === 'trishul') && (
        <div 
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        >
          {!isDockExpanded ? (
            <button
              onClick={() => setIsDockExpanded(true)}
              className="w-12 h-12 rounded-full flex items-center justify-center bg-[#4169E1] text-white shadow-[0_0_20px_rgba(65,105,225,0.4)] hover:scale-110 active:scale-95 transition-all group"
            >
              <div className="absolute inset-0 rounded-full animate-ping bg-[#4169E1] opacity-20 group-hover:opacity-40"></div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </button>
          ) : (
            <div 
              className="glass-panel animate-in slide-in-from-bottom-4 duration-300"
              style={{ 
                background: darkMode ? 'rgba(15, 20, 25, 0.9)' : 'rgba(255, 255, 255, 0.95)', 
                backdropFilter: 'blur(32px)', 
                WebkitBackdropFilter: 'blur(32px)',
                border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.08)', 
                borderRadius: '100px', 
                padding: '6px 10px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                boxShadow: darkMode 
                  ? '0 20px 50px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)' 
                  : '0 10px 30px rgba(0,0,0,0.1), inset 0 1px 1px rgba(255,255,255,0.5)',
                width: 'max-content',
                maxWidth: 'calc(100vw - 32px)',
                height: '52px'
              }}
            >
              {/* TELEMETRY BUTTONS */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button 
                  onClick={() => setIsLoggerOpen(!isLoggerOpen)}
                  title="Trade Data Ledger"
                  style={{ 
                    width: '38px', 
                    height: '38px', 
                    borderRadius: '50%', 
                    background: isLoggerOpen ? '#4169E1' : (darkMode ? 'rgba(65, 105, 225, 0.1)' : 'rgba(65, 105, 225, 0.05)'), 
                    border: '1px solid rgba(65, 105, 225, 0.3)', 
                    color: isLoggerOpen ? 'white' : '#4169E1', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isLoggerOpen ? '0 0 15px rgba(65, 105, 225, 0.4)' : 'none'
                  }}
                  className="hover:scale-110 active:scale-90"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                </button>
              </div>

              <div style={{ width: '1px', height: '24px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', margin: '0 4px' }}></div>

              {/* MISSION CONTROLS */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => {
                    resetTerminalState();
                    showToast('Mission Scrubbed — State Purged', 'warning');
                  }} 
                  title="Scrub Mission Data"
                  style={{ 
                    width: '34px', 
                    height: '34px', 
                    borderRadius: '50%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '1px solid rgba(245, 158, 11, 0.4)', 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    color: '#f59e0b', 
                    cursor: 'pointer', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                  }}
                  className="hover:bg-[#f59e0b] hover:text-white hover:rotate-180 active:scale-90"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
                </button>
                
                <button 
                  onClick={saveSession}
                  disabled={isAiLoading}
                  title="Save Tactical State"
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '50%', 
                    background: '#10b981', 
                    color: 'white', 
                    border: '1px solid rgba(16, 185, 129, 0.6)', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                    boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                  }}
                  className="hover:scale-110 active:scale-90 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5" /></svg>
                </button>

                <button 
                  onClick={() => {
                    setActiveSessionId(null);
                    setActiveEditLog(null);
                    setHighestStep(0);
                    setWeaponLocked(false);
                    setIsLoggerOpen(false);
                    setIsAiPaneOpen(false);
                    showToast('Protocol Aborted — State Purged');
                  }} 
                  title="Abort Protocol"
                  style={{ 
                    width: '34px', 
                    height: '34px', 
                    borderRadius: '50%',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    border: '1px solid rgba(239, 68, 68, 0.3)', 
                    background: 'rgba(239, 68, 68, 0.1)', 
                    color: '#ef4444', 
                    cursor: 'pointer', 
                    transition: 'all 0.3s' 
                  }}
                  className="hover:bg-[#ef4444] hover:text-white"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>

                <div style={{ width: '1px', height: '24px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', margin: '0 4px' }}></div>

                <button 
                  onClick={() => setIsDockExpanded(false)}
                  title="Collapse Dock"
                  style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'all 0.2s' }}
                  className="hover:text-white dark:hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 17 18 12 13 7" /><polyline points="6 17 11 12 6 7" /></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="relative">

        {/* Global Sidebar Backdrop REMOVED — Scrolling Unlocked */}

        {/* TACTICAL WORKSPACE — Dual Sidebar Architecture */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="relative">
          
          {/* LEFT SIDEBAR — Operational Ledger (Floating Glass Overlay) */}
          {(activeSessionId || activeEditLog) && (
            <aside
              className={`sidebar-transition flex flex-col z-[150] ${isLoggerOpen ? 'w-[400px] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full overflow-hidden'}`}
              style={{
                background: darkMode
                  ? '#1C2128' 
                  : '#FFFFFF',
                borderRight: isLoggerOpen ? '1px solid var(--accent)' : 'none',
                boxShadow: isLoggerOpen ? '40px 0 80px rgba(0,0,0,0.5)' : 'none',
                position: 'relative',
                height: '100%',
                transition: 'all 500ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <div style={{ minWidth: '400px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Sidebar Header */}
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  <span style={{ fontSize: '11px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-1)' }}>Operational Intelligence</span>
                </div>
                <button onClick={() => setIsLoggerOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              </div>

              {/* Sidebar Content (Total Tactical Intelligence) */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-8">
                
                {/* 1. MISSION PROFILE */}
                <div style={{ padding: '16px', borderRadius: '16px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#ffffff', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}></div>
                    Mission Profile
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-4)' }}>Asset Ticker</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-1)' }}>{session?.assetName || activeEditLog?.phase1?.asset_ticker || '—'}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-4)' }}>Neural Model</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)' }}>{currentModel === 'pinaka' ? 'PINAKA 2.1' : 'TRISHUL 1.0'}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-4)' }}>Operation ID</span>
                      <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-1)' }}>{session?.tradeName || activeEditLog?.name || 'UNNAMED_OP'}</span>
                    </div>
                  </div>
                </div>

                {/* 2. STRATEGIC ANALYSIS (PHASES 1-4) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>Strategic Analysis</div>
                  
                  {[
                    { label: 'Phase 1: Bias', val: activeEditLog ? activeEditLog.phase1?.bias : selections.bias, note: activeEditLog ? activeEditLog.phase1?.bias_note : notes.bias, color: '#4169E1' },
                    { label: 'Phase 2: Auction', val: activeEditLog ? activeEditLog.phase1?.auction : selections.auction, note: activeEditLog ? activeEditLog.phase1?.auction_note : notes.auction, color: '#6366f1' },
                    { label: 'Phase 3: Liquidity', val: activeEditLog ? activeEditLog.phase1?.liquidity : selections.liquidity, note: activeEditLog ? activeEditLog.phase1?.liquidity_note : notes.liquidity, color: '#10b981' },
                    { label: 'Phase 4: Behaviour', val: activeEditLog ? activeEditLog.phase1?.behaviour : selections.behaviour, note: activeEditLog ? activeEditLog.phase1?.behaviour_note : notes.behaviour, color: '#f59e0b' },
                  ].map((phase, i) => (
                    <div key={i} style={{ padding: '14px', borderRadius: '16px', background: darkMode ? 'rgba(255,255,255,0.01)' : '#ffffff', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 850, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{phase.label}</div>
                      </div>
                      
                      {/* Selections */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: phase.note ? '10px' : '0' }}>
                        {phase.val && Object.keys(phase.val).length > 0 ? (
                          Object.entries(phase.val).map(([key, value]) => (
                            <div key={key} style={{ padding: '4px 8px', borderRadius: '6px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'var(--bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', opacity: 0.5 }}>{key.replace(/_/g, ' ')}</span>
                              <span style={{ fontSize: '9px', fontWeight: 900, color: phase.color }}>{value}</span>
                            </div>
                          ))
                        ) : (
                          <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-4)', fontStyle: 'italic opacity-40' }}>Pending Selections...</span>
                        )}
                      </div>

                      {/* Notes for this Phase */}
                      {phase.note ? (
                        <div style={{ padding: '8px 10px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderLeft: `2px solid ${phase.color}`, fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.5', fontStyle: 'italic' }}>
                          {phase.note}
                        </div>
                      ) : (
                        <div style={{ fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.4, marginTop: '4px' }}>No phase-specific notes captured.</div>
                      )}
                    </div>
                  ))}
                </div>

                {/* 3. STS INTELLIGENCE (INTERCEPTION / STRIKE) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>STS Intelligence</div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                    <div style={{ fontSize: '10px', fontWeight: 850, color: '#6366f1', marginBottom: '12px', textTransform: 'uppercase' }}>
                      {finalCommand || (netraOutput?.cmd) || 'Unspecified Protocol'}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                      {Object.entries(finalCommand === 'INTERCEPTION' ? interSelections : (finalCommand === 'STRIKE' ? strikeSelections : {})).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', opacity: 0.6 }}>{k}</span>
                          <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)' }}>{v || '—'}</span>
                        </div>
                      ))}
                      {!finalCommand && <div style={{ gridColumn: 'span 2', fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic' }}>Awaiting Protocol Confirmation...</div>}
                    </div>
                  </div>
                </div>

                {/* 4. ENGAGEMENT SUITE (WEAPON & LOGIC) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>Engagement Suite</div>
                  <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Weapon Identity</span>
                      <span style={{ fontSize: '12px', fontWeight: 950, color: '#10b981' }}>{selectedWeaponId || activeEditLog?.weapon || 'LOCKED'}</span>
                    </div>
                    {notes.weapon ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.1)', fontStyle: 'italic' }}>
                        {notes.weapon}
                      </div>
                    ) : (
                      <div style={{ fontSize: '10px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.5 }}>No tactical weapon logic defined.</div>
                    )}
                  </div>
                </div>

                {/* 5. EXECUTION TELEMETRY */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>Execution Telemetry</div>
                  <div style={{ padding: '16px', borderRadius: '12px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#ffffff', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Entry Threshold</div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--text-1)' }}>{editFormData.entry_price || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Risk Stop</div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: '#ef4444' }}>{editFormData.stop_loss || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Add. Overheads</div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--text-1)' }}>{editFormData.additional_cost || '0.00'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Breakeven Level</div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: '#f59e0b' }}>
                        {(() => {
                          const entry = parseFloat(editFormData.entry_price) || 0;
                          const cost = parseFloat(editFormData.additional_cost) || 0;
                          return entry > 0 ? (entry + cost).toFixed(2) : '—';
                        })()}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2', height: '1px', background: 'var(--border)' }}></div>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Realized P/L</div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: (parseFloat(editFormData.pl) || 0) >= 0 ? '#10b981' : '#ef4444' }}>{editFormData.pl || '0.00'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '4px' }}>Net Yield (%)</div>
                      <div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--accent)' }}>
                        {(() => {
                          const entry = parseFloat(editFormData.entry_price) || 0;
                          const exit = parseFloat(editFormData.exit_price) || 0;
                          return entry > 0 && exit > 0 ? (((exit - entry) / entry) * 100).toFixed(2) + '%' : '—';
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. OPERATOR SYNTHESIS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>Operator Synthesis</div>
                  <div style={{ padding: '16px', borderRadius: '12px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#ffffff', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '8px' }}>User Thought Process</div>
                    {editFormData.user_thought ? (
                      <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.6' }}>{editFormData.user_thought}</div>
                    ) : (
                      <div style={{ fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.4 }}>No strategic thoughts logged for this op.</div>
                    )}
                    
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '8px' }}>Operational Notes</div>
                      {editFormData.notes ? (
                        <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.6' }}>{editFormData.notes}</div>
                      ) : (
                        <div style={{ fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.4 }}>No final operational notes.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              </div>
        </aside>
          )}

          {/* MAIN TERMINAL CONTAINER */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <main 
              style={{ 
                flex: 1, 
                width: '100%', 
                margin: '0 auto', 
                padding: prepStep === 1 ? '0' : '24px 40px', 
                display: 'flex', 
                flexDirection: 'column', 
                overflow: 'auto',
                background: darkMode 
                  ? 'radial-gradient(circle at 50% 50%, rgba(65, 105, 225, 0.05) 0%, transparent 80%)' 
                  : 'radial-gradient(circle at 50% 50%, rgba(65, 105, 225, 0.03) 0%, transparent 80%)',
                filter: 'none' // Ensure no blur is applied to main console
              }}
            >
            {activeView === 'profile' ? (
              <ProfilePage />
            ) : prepStep === 1 && !activeSessionId ? (
              /* CENTRAL COMMAND HUB (HOME) */
              <div className="flex-1 flex flex-col animate-in fade-in duration-700" style={{ position: 'relative', background: 'var(--bg)', overflow: 'hidden' }}>
                {/* Hero Background - Fixed relative to the Command Hub container */}
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("/terminal_hero.png")', backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.25, filter: 'grayscale(0.5) brightness(0.8)', zIndex: 0 }}></div>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 40% 40%, transparent 20%, var(--bg) 90%)', zIndex: 1 }}></div>

                {/* Scrollable Content Layer */}
                <div className="relative z-10 flex-1 flex flex-col p-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto w-full">
                    {/* Hero Text */}
                    <div className="mb-16">
                      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '8px' }}>System v1.02 Online</div>
                      <h1 style={{ fontSize: '64px', fontWeight: 950, letterSpacing: '-0.05em', color: 'var(--text-1)', lineHeight: 0.9, marginBottom: '16px' }}>CENTRAL<br />COMMAND</h1>
                      <p style={{ fontSize: '16px', color: 'var(--text-2)', maxWidth: '450px', lineHeight: 1.6 }}>The primary multimodal gateway for tactical execution and operational archives. Precision is the only objective.</p>
                    </div>

                    {/* Navigation Hub */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
                      {[
                        { title: 'Initialize Mission', desc: 'Secure operational entry for fresh tactical session', step: 3, icon: 'M12 5v14M5 12h14', status: 'READY' },
                        { title: 'Operational Ledger', desc: 'Access encrypted historical archives and performance data', step: 4, icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', status: 'SYNCED' }
                      ].map((card, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (card.step) {
                              setPrepStep(card.step);
                              if (card.step === 3) {
                                dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '' }));
                              }
                            }
                          }}
                          className="group relative p-8 rounded-[16px] border-2 border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl hover:shadow-[0_20px_50px_rgba(65,105,225,0.15)] hover:-translate-y-1 transition-all text-left flex flex-col h-56 overflow-hidden"
                        >
                          {/* Accent Glow */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-[#4169E1]/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>

                          <div className="flex items-start justify-between mb-auto">
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(65, 105, 225, 0.05)', border: '1px solid rgba(65, 105, 225, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4169E1' }}>
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d={card.icon}></path></svg>
                            </div>
                            <div className="px-3 py-1 rounded-full bg-white text-[8px] font-black tracking-[0.2em] text-black transition-all">
                              STATUS: {card.status}
                            </div>
                          </div>

                          {/* Institutional Narrative Section */}
                          <div>
                            <h3 style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.02em', color: 'var(--text-1)', marginBottom: '6px' }}>{card.title}</h3>
                            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', opacity: 0.7, lineHeight: 1.5, maxWidth: '240px' }}>{card.desc}</p>
                          </div>

                          {/* Tactical Motorsport Stripes (Racing Signature: Blue & Technical Grey) */}
                          <div className="absolute top-0 right-0 w-48 h-48 overflow-hidden pointer-events-none">
                            <div className="absolute -top-10 right-0 w-[8px] h-64 bg-[var(--accent)] rotate-[45deg]"></div>
                            <div className="absolute -top-10 right-9 w-[8px] h-64 bg-gray-400/40 rotate-[45deg]"></div>
                          </div>

                          {/* Decorative barcode-style element for institutional feel */}
                          <div className="absolute bottom-8 right-8 flex gap-0.5 opacity-10 group-hover:opacity-30 transition-opacity">
                            {[...Array(6)].map((_, i) => <div key={i} className="w-[1px] h-3 bg-gray-900" style={{ opacity: Math.random() }}></div>)}
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Models Available Section */}
                    <div className="mb-24">
                      <div style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--text-4)', marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        Models Available
                        <div className="flex-1 h-[1px]" style={{ background: 'var(--border)', opacity: 0.3 }}></div>
                      </div>

                      <div className="space-y-8">
                        {[
                          { id: 'pinaka', name: 'Pinaka Framework', desc: 'Advanced high-conviction execution engine with multi-modal bias analysis and liquidity tracking.', color: '#4169E1', action: () => { setCurrentModel('pinaka'); setActiveView('terminal'); setPrepStep(2); } },
                          { id: 'trishul', name: 'Trishul Framework', desc: 'Neural conviction analysis and automated mission state synchronization with high-performance operational ledger.', color: '#4169E1', action: () => { setActiveView('trishul'); setActiveSessionId('dummy_trishul'); if (prepStep === 1) setPrepStep(2); } }
                        ].map((m) => (
                          <div
                            key={m.id}
                            className="w-full relative p-12 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-lg flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-[#4169E1]/30 transition-all overflow-hidden"
                          >
                            {/* Tactical Stripes */}
                            <div className="absolute top-0 right-0 w-48 h-48 overflow-hidden pointer-events-none">
                              <div className="absolute -top-10 right-0 w-[8px] h-64 bg-[var(--accent)] rotate-[45deg]"></div>
                              <div className="absolute -top-10 right-9 w-[8px] h-64 bg-gray-400/40 rotate-[45deg]"></div>
                            </div>
                            <div className="flex-1 relative z-10">
                              <h4 className="text-3xl font-black mb-4 tracking-tight" style={{ color: 'var(--text-1)' }}>{m.name}</h4>
                              <p className="max-w-xl text-base opacity-60 font-medium leading-relaxed">{m.desc}</p>
                            </div>
                            <button
                              onClick={m.action}
                              className="relative z-10 px-10 py-5 rounded-full border-2 border-[#4169E1] text-[#4169E1] font-black uppercase text-sm tracking-widest hover:bg-[#4169E1] hover:text-white transition-all whitespace-nowrap"
                            >
                              Explore Model
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>


                    {/* Institutional Narrative Section */}
                    <div className="mb-32">
                      <div className="max-w-4xl">
                        <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.2em', marginBottom: '24px' }}>Operational Philosophy</div>
                        <p style={{ fontSize: '36px', fontWeight: 900, color: 'var(--text-1)', lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: '32px' }}>
                          Precision is the only objective. Discipline is the only tool. Execute with zero sentiment.
                          <span style={{ color: 'var(--text-3)' }}> The Pinaka system is designed for high-conviction market capture—system over instinct.</span>
                        </p>
                      </div>
                    </div>

                    {/* Upcoming R&D Technical Feed */}
                    <div className="pb-40 border-t border-[var(--border)] pt-20">
                      <div style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', letterSpacing: '0.2em', marginBottom: '40px' }}>Upcoming R&D / Roadmap</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                          { unit: 'Module 07', name: 'Portfolio Tracker', tech: 'Real-time equity synchronization and risk-weighting analysis.' },
                          { unit: 'Protocol X', name: 'Neural Models v3', tech: 'Dynamic conviction adjustment based on multi-timeframe regime analysis.' },
                          { unit: 'Core 2.0', name: 'AI Integration', tech: 'LLM-powered post-trade analysis and tactical journaling synthesis.' }
                        ].map((rd, i) => (
                          <div key={i}>
                            <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)', marginBottom: '8px', fontFamily: 'JetBrains Mono' }}>[ {rd.unit} ]</div>
                            <div style={{ fontSize: '20px', fontWeight: 950, color: 'var(--text-1)', marginBottom: '12px', trackingTight: '-0.02em' }}>{rd.name}</div>
                            <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6, fontWeight: 500 }}>{rd.tech}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : prepStep === 3 ? (
              /* PHASE 3: FULL PAGE MISSION PREPARATION */
              <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 animate-in fade-in duration-500 overflow-auto bg-[var(--bg)]">
                <div className="w-full max-w-[500px] space-y-6 lg:space-y-8">
                  <div className="flex justify-between items-start">
                    <button
                      onClick={() => setPrepStep(1)}
                      className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#3B82F6] transition-all"
                    >
                      <div className="w-6 h-6 rounded-full border border-white/[0.05] flex items-center justify-center group-hover:border-[#3B82F6]/20 group-hover:bg-[#3B82F6]/5 transition-all">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </div>
                      Back to Dashboard
                    </button>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#3B82F6] mb-2">Trade Setup</div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase mb-2">Trade Preparation</h2>
                    <p className="text-xs opacity-50 font-medium max-w-sm mx-auto">Establish identifiers and select your trading logic for the next session.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="group">
                        <label className="text-[9px] font-bold uppercase tracking-wider mb-1.5 block opacity-50 group-focus-within:opacity-100 transition-opacity">Asset Ticker</label>
                        <input
                          type="text"
                          value={sessionInput.assetName}
                          onChange={e => setSessionInput({ ...sessionInput, assetName: e.target.value })}
                          placeholder="E.G. NIFTY50"
                          className="w-full bg-[#111622] border border-white/[0.05] rounded-lg py-2.5 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/50 transition-colors"
                        />
                      </div>
                      <div className="group">
                        <label className="text-[9px] font-bold uppercase tracking-wider mb-1.5 block opacity-50 group-focus-within:opacity-100 transition-opacity">Trade Reference</label>
                        <input
                          type="text"
                          value={sessionInput.tradeName}
                          onChange={e => dispatch(setSessionInput({ ...sessionInput, tradeName: e.target.value }))}
                          placeholder="E.G. H1_SWEEP"
                          className="w-full bg-[#111622] border border-white/[0.05] rounded-lg py-2.5 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/50 transition-colors"
                        />
                      </div>
                    </div>

                    <MarketTypeSelector />

                    <div className="group">
                      <label className="text-[9px] font-bold uppercase tracking-wider mb-3 block opacity-50 group-focus-within:opacity-100 transition-opacity">Trading Model Directive</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { id: 'pinaka', name: 'Pinaka', desc: 'High-Conviction Execution' },
                          { id: 'trishul', name: 'Trishul', desc: 'Neural Synthesis Engine' }
                        ].map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSessionInput({ ...sessionInput, modelName: m.id }); setCurrentModel(m.id); }}
                            className={`p-4 rounded-lg border text-left transition-all ${sessionInput.modelName === m.id ? 'border-[#3B82F6] bg-[#1E3A8A]/10' : 'border-white/[0.03] bg-[#111622] hover:border-[#3B82F6]/30'}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-sm font-bold uppercase tracking-tight">{m.name}</div>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${sessionInput.modelName === m.id ? 'border-[#3B82F6]' : 'border-gray-600'}`}>
                                {sessionInput.modelName === m.id && <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>}
                              </div>
                            </div>
                            <div className="text-[10px] font-medium opacity-40 uppercase tracking-wider">{m.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-3 mt-4">
                      <button
                        onClick={() => setPrepStep(1)}
                        className="order-2 lg:order-1 flex-1 px-6 py-3 rounded-lg border border-white/[0.05] bg-[#111622] text-xs font-bold uppercase tracking-wider hover:bg-[#1E293B] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={initializeMission}
                        className="order-1 lg:order-2 flex-[2] bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/10"
                      >
                        Initialize Terminal
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : prepStep === 4 ? (
              /* PHASE 4: LEDGER SOURCE SELECTION */
              <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in fade-in zoom-in-95 duration-500 overflow-auto bg-[var(--bg)]">
                <div className="w-full max-w-[600px] space-y-12">
                  <div className="flex justify-between items-start mb-4">
                    <button
                      onClick={() => setPrepStep(1)}
                      className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-[#4169E1] transition-all"
                    >
                      <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center group-hover:border-[#4169E1]/20 group-hover:bg-blue-50 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg>
                      </div>
                      Back to Command
                    </button>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#3B82F6] mb-2">Archive Gateway</div>
                    <h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase mb-2">Select Model</h2>
                    <p className="text-xs opacity-50 font-medium max-w-sm mx-auto">Choose the model framework to view historical records and performance telemetry.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      { id: 'pinaka', name: 'Pinaka Framework', desc: 'View high-conviction trade logs', action: () => { setCurrentModel('pinaka'); setActiveView('terminal'); setPrepStep(2); } },
                      { id: 'trishul', name: 'Trishul Synthesis', desc: 'Access neural protocol archives', action: () => { setCurrentModel('trishul'); setActiveView('trishul'); setPrepStep(2); } }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={m.action}
                        className="p-5 rounded-lg border border-white/[0.03] bg-[#111622] flex items-center justify-between group hover:border-[#3B82F6]/30 transition-all text-left"
                      >
                        <div>
                          <div className="text-lg font-bold uppercase tracking-tight mb-0.5">{m.name}</div>
                          <div className="text-[10px] font-medium opacity-40 uppercase tracking-wider">{m.desc}</div>
                        </div>
                        <div className="w-8 h-8 rounded-full border border-white/[0.05] flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:border-[#3B82F6] transition-all">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500 group-hover:text-white transition-all"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (!activeSessionId && activeView !== 'trishul') ? (
              /* DASHBOARD VIEW OR SETUP VIEW */
              <div className="flex-1 flex flex-col animate-in fade-in duration-700" style={{ position: 'relative', background: 'var(--bg)', overflow: 'hidden' }}>

                {/* DIVINE HERO BACKGROUND - Fixed Full-Page Layer */}
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundImage: 'url("/pinaka_hero.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.1,
                    filter: 'grayscale(1) brightness(0.5)',
                    zIndex: 0
                  }}
                ></div>
                <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(circle at 50% 50%, transparent 20%, var(--bg) 95%)', zIndex: 1 }}></div>

                {/* Scrollable Content Layer */}
                <div className="relative z-10 flex-1 flex flex-col p-6 lg:p-12 overflow-y-auto custom-scrollbar">
                  <div className="max-w-7xl mx-auto w-full space-y-10 lg:space-y-16">

                    {/* Header: Institutional Identity */}
                    <div className="flex justify-between items-end">
                      <div>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.4em', marginBottom: '8px' }}>Alpha v1.02 // Mission Terminal</div>
                        <h1 style={{ fontWeight: 950, letterSpacing: '-0.05em', color: 'var(--text-1)', lineHeight: 0.9 }} className="text-4xl lg:text-7xl">PINAKA<br />MODULE</h1>
                      </div>
                      <div className="text-right pb-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)] mb-2">Terminal Frequency</div>
                        <div className="flex items-center gap-1.5 justify-end">
                          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="w-1 h-3 bg-[var(--accent)]/30 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 bg-[var(--accent)] animate-pulse" style={{ animationDelay: `${i * 150}ms`, height: `${30 + Math.random() * 70}%` }}></div>
                          </div>)}
                        </div>
                      </div>
                    </div>


                    {/* FLOATING PERFORMANCE TELEMETRY — Expanded Real-Data HUB */}
                    {currentModel === 'trishul' ? (
                      <div className="w-full py-12 border-y border-[var(--border)] border-dashed text-center">
                        <div className="text-sm font-black uppercase tracking-[0.4em] opacity-30 text-[var(--text-1)]">Neural Synthesis Pipeline Active...</div>
                      </div>
                    ) : !analyticsData ? (
                      <div className="w-full h-24 flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-[var(--accent)] animate-pulse">Synchronizing Data...</div>
                    ) : (
                      <div className="space-y-12">
                        {/* Phase 1: Primary Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-4)] mb-4">Net Performance</div>
                            <div className="text-5xl font-black tracking-tighter" style={{ color: (analyticsData.total_pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {analyticsData.total_pnl >= 0 ? '+' : ''}{analyticsData.total_pnl || '0.00'}
                            </div>
                          </div>

                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-4)] mb-4">Win Prob</div>
                            <div className="text-5xl font-black tracking-tighter" style={{ color: analyticsData.win_rate >= 50 ? 'var(--green)' : 'var(--red)' }}>{analyticsData.win_rate}%</div>
                          </div>

                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-4)] mb-4">Profit Factor</div>
                            <div className="text-5xl font-black tracking-tighter text-[var(--text-1)]">{analyticsData.profit_factor || '0.00'}</div>
                          </div>

                          <div>
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-4)] mb-4">Expectancy</div>
                            <div className="text-4xl lg:text-5xl font-black tracking-tighter" style={{ color: (analyticsData.expectancy || 0) >= 0 ? 'var(--accent)' : 'var(--red)' }}>
                              {analyticsData.expectancy || '0.00'}
                            </div>
                          </div>
                        </div>

                        {/* Phase 2: Breakdown & Precision */}
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                          <div className="lg:col-span-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-4)] mb-6">Operations Archive</div>
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-1)]">
                                <span className="opacity-40 uppercase tracking-widest">Total Ops</span>
                                <span>{analyticsData.total}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-1)]">
                                <span className="opacity-40 uppercase tracking-widest">Reviewed</span>
                                <span>{analyticsData.reviewed}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-1)]">
                                <span className="opacity-40 uppercase tracking-widest">Avg Winner</span>
                                <span className="text-green-500">+{analyticsData.avg_win}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs font-bold text-[var(--text-1)]">
                                <span className="opacity-40 uppercase tracking-widest">Avg Loser</span>
                                <span className="text-red-500">-{analyticsData.avg_loss}</span>
                              </div>
                            </div>
                          </div>

                          <div className="lg:col-span-3">
                            <div className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-4)] mb-8">Weaponized Precision</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                              {Object.entries(analyticsData.by_weapon || {}).slice(0, 3).map(([weapon, data]) => {
                                const pct = data.total ? Math.round((data.wins / data.total) * 100) : 0;
                                return (
                                  <div key={weapon} className="space-y-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-1)]">
                                      <span className="opacity-60">{weapon}</span>
                                      <span>{pct}% EFF</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[var(--text-1)]/10 rounded-full overflow-hidden">
                                      <div className="h-full bg-[var(--accent)] rounded-full shadow-[0_0_8px_var(--accent)]" style={{ width: `${pct}%` }}></div>
                                    </div>
                                    <div className="flex gap-4 text-[8px] font-black uppercase text-[var(--text-4)] tracking-tighter">
                                      <span>T: {data.total}</span>
                                      <span className="text-green-500/60">W: {data.wins}</span>
                                      <span className="text-red-500/60">L: {data.losses}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BOTTOM SECTION: INSTITUTIONAL TRADE LEDGER */}
                    <div className="w-full flex-1 min-h-0 flex flex-col space-y-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h2 className="text-2xl font-black tracking-tighter text-[var(--text-1)] uppercase">Trade Ledger</h2>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={downloadCSV}
                            disabled={isDownloading}
                            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
                            className="px-6 py-3.5 rounded-2xl text-[var(--text-1)] text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-50"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            Export CSV
                          </button>
                          <button
                            onClick={() => setPrepStep(3)}
                            className="px-6 py-3.5 rounded-2xl bg-gray-900 border border-white text-white text-[10px] font-black uppercase tracking-[0.1em] flex items-center gap-2 hover:bg-[#4169E1] transition-all shadow-xl shadow-gray-900/10 active:scale-95"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Initialize Log
                          </button>
                        </div>
                      </div>

                      {/* TACTICAL FILTER INTERFACE */}
                      <div className="p-4 rounded-2xl bg-[var(--surface-2)]/50 backdrop-blur-md border border-[var(--border)] flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full md:w-auto">
                          <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-4)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                          <input
                            type="text"
                            placeholder="Search archives by ID, Asset, or Mission name..."
                            value={logSearchTerm}
                            onChange={(e) => dispatch(setLogSearchTerm(e.target.value))}
                            className="w-full pl-11 pr-4 py-3 bg-[var(--surface)]/50 border border-[var(--border)] rounded-xl text-[11px] font-black uppercase tracking-wider text-[var(--text-1)] placeholder:text-[var(--text-4)] focus:border-[var(--accent)] outline-none transition-all"
                          />
                        </div>

                        <div className="flex gap-3 w-full md:w-auto">
                          <select
                            value={logFilterOutcome}
                            onChange={(e) => dispatch(setLogFilterOutcome(e.target.value))}
                            className="flex-1 md:flex-none px-4 py-3 bg-[var(--surface)]/50 border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest text-[var(--text-2)] focus:border-[var(--accent)] outline-none cursor-pointer"
                          >
                            <option value="ALL">All Outcomes</option>
                            <option value="WIN">Win Only</option>
                            <option value="LOSS">Loss Only</option>
                            <option value="BREAKEVEN">Breakeven</option>
                          </select>

                          <select
                            value={logSortOrder}
                            onChange={(e) => dispatch(setLogSortOrder(e.target.value))}
                            className="flex-1 md:flex-none px-4 py-3 bg-[var(--surface)]/50 border border-[var(--border)] rounded-xl text-[9px] font-black uppercase tracking-widest text-[var(--accent)] focus:border-[var(--accent)] outline-none cursor-pointer"
                          >
                            <option value="DESC">Newest First</option>
                            <option value="ASC">Oldest First</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex-1 min-h-0 flex flex-col rounded-[16px] border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">

                        {/* MOBILE CARD VIEW */}
                        <div className="mobile-only flex-1 overflow-auto p-4 space-y-4 custom-scrollbar">
                          {(() => {
                            const filteredLogs = [...tradeLogs].filter(log => {
                              const matchesSearch = !logSearchTerm ||
                                (log.name || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                                (log.phase1?.asset_ticker || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                                (log.username || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                                log.id.includes(logSearchTerm);
                              const matchesOutcome = logFilterOutcome === 'ALL' || log.phase4?.outcome === logFilterOutcome;
                              return matchesSearch && matchesOutcome;
                            }).sort((a, b) => {
                              const timeA = new Date(a.timestamp).getTime();
                              const timeB = new Date(b.timestamp).getTime();
                              return logSortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
                            });

                            if (filteredLogs.length === 0) {
                              return <div className="py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No matching mission records</div>;
                            }

                            return filteredLogs.map((log) => (
                              <div key={log.id} className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] space-y-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="text-[10px] font-mono font-bold text-[var(--accent)]/60 mb-1">{log.id.slice(0, 8)}</div>
                                    <div className="text-sm font-black text-[var(--text-1)] uppercase tracking-tight">{log.name || 'UNNAMED_OP'}</div>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-3)] text-[9px] font-black text-[var(--text-1)] tracking-widest">{log.phase1?.asset_ticker || 'N/A'}</span>
                                </div>

                                <div className="flex justify-between items-center">
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div className="text-[9px] font-bold text-[var(--text-4)] uppercase">{new Date(log.timestamp).toLocaleDateString()}</div>
                                    <div className="text-[8px] font-black text-[var(--accent)]/50 uppercase mt-1">Operator: {log.username || 'System'}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${log.phase4?.outcome === 'WIN' ? 'bg-green-500 shadow-green-200' : log.phase4?.outcome === 'LOSS' ? 'bg-red-500 shadow-red-200' : 'bg-gray-500 shadow-gray-200'}`}></div>
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${log.phase4?.outcome === 'WIN' ? 'text-green-600' : log.phase4?.outcome === 'LOSS' ? 'text-red-600' : 'text-gray-400'}`}>
                                      {log.phase4?.outcome || 'PENDING'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex gap-2 pt-2 border-t border-[var(--border)]/50">
                                  <button
                                    onClick={() => {
                                      setActiveEditLog(log);
                                      setEditFormData({ ...log.phase2, ...log.phase3, ...log.phase4, trade_name: log.name });
                                      setIsLoggerOpen(true);
                                    }}
                                    className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[10px] font-black uppercase text-[var(--text-3)]"
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                                    Analyze
                                  </button>
                                  {log.session_state && (
                                    <button onClick={() => resumeSession(log)} className="flex-1 h-10 rounded-xl bg-[var(--accent)] text-white text-[10px] font-black uppercase tracking-widest">Resume</button>
                                  )}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* Independent Scroll Table (DESKTOP) */}
                        <div className="desktop-only flex-1 overflow-auto custom-scrollbar">
                          <table className="w-full border-collapse">
                            <thead className="sticky top-0 bg-[var(--surface)]/80 backdrop-blur-md z-20 border-b border-[var(--border)]">
                              <tr>
                                <th className="px-8 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Op-ID</th>
                                <th className="px-8 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Reference Name</th>
                                <th className="px-8 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Asset</th>
                                <th className="px-8 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Operator</th>
                                <th className="px-8 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Timestamp</th>
                                <th className="px-8 py-5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const filteredLogs = [...tradeLogs].filter(log => {
                                  const matchesSearch = !logSearchTerm ||
                                    (log.name || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                                    (log.phase1?.asset_ticker || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                                    (log.username || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                                    log.id.includes(logSearchTerm);
                                  const matchesOutcome = logFilterOutcome === 'ALL' || log.phase4?.outcome === logFilterOutcome;
                                  return matchesSearch && matchesOutcome;
                                }).sort((a, b) => {
                                  const timeA = new Date(a.timestamp).getTime();
                                  const timeB = new Date(b.timestamp).getTime();
                                  return logSortOrder === 'DESC' ? timeB - timeA : timeA - timeB;
                                });

                                if (filteredLogs.length === 0) {
                                  return (
                                    <tr>
                                      <td colSpan="6" className="px-8 py-20 text-center opacity-30 text-[10px] font-black uppercase tracking-widest">No matching mission records</td>
                                    </tr>
                                  );
                                }

                                return filteredLogs.map((log) => (
                                  <tr key={log.id} className="group border-b border-[var(--border)] hover:bg-[var(--accent)]/[0.04] transition-colors">
                                    <td className="px-8 py-3 text-[10px] font-mono font-bold text-[var(--accent)]/60">{log.id.slice(0, 8)}</td>
                                    <td className="px-8 py-3 text-sm font-black text-[var(--text-1)] uppercase tracking-tight">{log.name || 'UNNAMED_OP'}</td>
                                    <td className="px-8 py-3">
                                      <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-3)] text-[10px] font-black text-[var(--text-1)] tracking-widest">{log.phase1?.asset_ticker || 'N/A'}</span>
                                    </td>
                                    <td className="px-8 py-3 text-[10px] font-black text-[var(--accent)]/70 uppercase">{log.username || 'System'}</td>
                                    <td className="px-8 py-3 text-[10px] font-bold text-[var(--text-4)] uppercase">{new Date(log.timestamp).toLocaleDateString()}</td>
                                    <td className="px-8 py-3">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${log.phase4?.outcome === 'WIN' ? 'bg-green-500 shadow-green-200' : log.phase4?.outcome === 'LOSS' ? 'bg-red-500 shadow-red-200' : 'bg-gray-500 shadow-gray-200'}`}></div>
                                        <span className={`text-[9px] font-black uppercase tracking-widest ${log.phase4?.outcome === 'WIN' ? 'text-green-600' : log.phase4?.outcome === 'LOSS' ? 'text-red-600' : 'text-gray-400'}`}>
                                          {log.phase4?.outcome || 'ARCHIVED'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-8 py-3">
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => {
                                            setActiveEditLog(log);
                                            setEditFormData({ ...log.phase2, ...log.phase3, ...log.phase4, trade_name: log.name });
                                            setIsLoggerOpen(true);
                                          }}
                                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-3)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm group/btn"
                                          title="Expand Analysis"
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                                        </button>
                                        {log.session_state && (
                                          <button onClick={() => resumeSession(log)} className="h-8 px-4 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[9px] font-black uppercase text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all shadow-sm">Resume</button>
                                        )}
                                        <button onClick={() => confirm('Purge record?') && deleteTradeLog(log.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--text-3)] hover:bg-red-500 hover:text-white transition-all shadow-sm group/del">
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover/del:scale-110"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ));
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeView === 'trishul' ? (
              /* TRISHUL COMING SOON VIEW */
              <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700" style={{ paddingBottom: '100px' }}>
                <div style={{ position: 'relative', width: '320px', height: '320px', marginBottom: '40px' }}>
                  {/* Glass Background behind logo */}
                  <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 50%, rgba(0,229,255,0.05) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                  <img
                    src="/trishul_logo.png"
                    alt="Trishul Protocol"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.2))' }}
                  />
                </div>
                <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-1)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>Trishul Protocol</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <div style={{ width: '40px', height: '1px', background: 'var(--border)' }}></div>
                  <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)' }}>Awaiting Activation</span>
                  <div style={{ width: '40px', height: '1px', background: 'var(--border)' }}></div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-3)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6, fontWeight: 500 }}>
                  The Trishul Multimodal Execution Layer is currently undergoing synthesis.
                  Next-generation cross-asset synchronization and high-frequency delta hedging modules are scheduled for upcoming release.
                </p>
                <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                  <div style={{ padding: '8px 16px', borderRadius: '100px', border: '1px solid var(--green)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--green-bg)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }}></div>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--green)' }}>Phase: Laboratory</span>
                  </div>
                </div>
              </div>
            ) : (
              /* EXECUTION (PINAKA) VIEW */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '60px' }}>

                <div>
                  <Phase0Vision />
                </div>

                <hr className="step-divider" />

                {highestStep >= 1 && (
                  <div>
                    {<Phase1Bias />}
                    {stepTimestamps.bias && (
                      <div style={{ textAlign: 'right', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-4)', marginTop: '12px' }}>Locked at {stepTimestamps.bias}</div>
                    )}
                  </div>
                )}

                {highestStep >= 2 && <hr className="step-divider" />}

                {highestStep >= 2 && (
                  <div>
                    {<Phase2Auction />}
                    {stepTimestamps.auction && (
                      <div style={{ textAlign: 'right', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-4)', marginTop: '12px' }}>Locked at {stepTimestamps.auction}</div>
                    )}
                  </div>
                )}

                {highestStep > 2 && <hr className="step-divider" />}

                {highestStep >= 3 && (
                  <div>
                    {<Phase3Liquidity />}
                    {stepTimestamps.liquidity && (
                      <div style={{ textAlign: 'right', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-4)', marginTop: '12px' }}>Locked at {stepTimestamps.liquidity}</div>
                    )}
                  </div>
                )}

                {highestStep > 3 && <hr className="step-divider" />}

                {highestStep >= 4 && (
                  <div>
                    {<Phase4Behaviour />}
                    {stepTimestamps.behaviour && (
                      <div style={{ textAlign: 'right', fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-4)', marginTop: '12px' }}>Locked at {stepTimestamps.behaviour}</div>
                    )}
                  </div>
                )}

                {highestStep > 4 && <hr className="step-divider" />}

                {highestStep >= 5 && <Phase5Synthesis />}

                {highestStep >= 5 && <hr className="step-divider" />}

                {highestStep >= 5 && <Phase6Command />}

                {highestStep > 5 && <hr className="step-divider" />}

                {highestStep >= 6 && <Phase8WeaponIntel />}

                {highestStep >= 6 && <hr className="step-divider" />}

                {highestStep >= 6 && <Phase9WeaponArmory />}

                {highestStep > 6 && <hr className="step-divider" />}

                {highestStep >= 7 && <Phase10MissionControl />}

                {highestStep > 7 && <hr className="step-divider" />}

                {highestStep >= 9 && (
                  <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
                    {(finalCommand || (netraOutput ? netraOutput.cmd : null)) === 'NO ENGAGEMENT' && <NoEngagementProtocol />}
                    {(finalCommand || (netraOutput ? netraOutput.cmd : null)) === 'STRIKE' && <StrikeProtocol />}
                    {(finalCommand || (netraOutput ? netraOutput.cmd : null)) === 'INTERCEPTION' && <InterceptionProtocol />}
                  </div>
                )}

                {/* NON-STICKY FOOTER (Moves with content) */}
                <footer className="desktop-only" style={{
                  width: '100%',
                  background: 'transparent',
                  borderTop: '1px solid var(--border)',
                  padding: '40px 0 60px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: 0.5,
                  marginTop: '80px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
                    {[
                      { n: 'TradingView', u: 'https://in.tradingview.com/chart' },
                      { n: 'NSE Option Chain', u: 'https://www.nseindia.com/option-chain' },
                      { n: 'Market News', u: 'https://twitter.com/deitaone' },
                      { n: 'Economic Calendar', u: 'https://www.investing.com/economic-calendar/' }
                    ].map(link => (
                      <a
                        key={link.n}
                        href={link.u}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
                        className="hover:text-[var(--accent)] transition-all flex items-center gap-1.5"
                      >
                        {link.n}
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" /></svg>
                      </a>
                    ))}
                  </div>
                  <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Institutional Terminal v3.1 — <span style={{ color: 'var(--accent)' }}>Synced & Secure</span>
                  </div>
                </footer>
              </div>
            )}
          </main>
        </div>
      </div>

        {/* RIGHT SIDEBAR — NETRA Synthesis (Floating Glass Overlay) */}
        <aside
          className={`sidebar-transition flex flex-col z-[150] ${isAiPaneOpen ? 'w-[440px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`}
              style={{
                background: darkMode
                  ? '#12141D' 
                  : '#F0F2FF',
                borderLeft: isAiPaneOpen ? '2px solid var(--accent)' : 'none',
                boxShadow: isAiPaneOpen ? '-40px 0 80px rgba(0,0,0,0.5)' : 'none',
                position: 'relative',
                height: '100%',
                transition: 'all 500ms cubic-bezier(0.23, 1, 0.32, 1)',
              }}
            >
              <div style={{ minWidth: '440px', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Sidebar Content (NETRA) */}
              <div className="flex-1 flex flex-col h-full relative">
                {/* ELEVATED CHAT HISTORY */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 relative" style={{ background: darkMode ? 'transparent' : '#f8f9fa' }}>
                  {/* Floating Close Button */}
                  <button onClick={() => setIsAiPaneOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', color: 'var(--text-3)', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20 }} className="hover:bg-red-500/20 hover:text-red-500 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>

                  {/* Maya Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                    <span style={{ 
                      fontSize: '48px', 
                      fontFamily: "'Dancing Script', 'Brush Script MT', cursive", 
                      color: darkMode ? '#fff' : '#000',
                      opacity: 0.05,
                      transform: 'rotate(-10deg)',
                      letterSpacing: '2px'
                    }}>
                      maya
                    </span>
                  </div>

                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} w-full`}>
                      <div 
                        style={{ 
                          maxWidth: '85%', 
                          padding: '12px 16px',
                          borderRadius: msg.role === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                          fontSize: '13px',
                          lineHeight: '1.6',
                          background: msg.role === 'user' 
                            ? (darkMode ? '#4169E1' : '#4169E1') 
                            : (darkMode ? 'rgba(255,255,255,0.05)' : '#FFFFFF'),
                          color: msg.role === 'user' ? '#FFFFFF' : 'var(--text-1)',
                          boxShadow: msg.role === 'user' ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                          border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.05)',
                        }}
                        className="animate-in fade-in slide-in-from-bottom-1 duration-300 markdown-content"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '9px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, color: msg.role === 'user' ? '#EBF0FF' : 'var(--text-3)' }}>
                          {msg.role === 'user' ? 'Operator' : 'MAYA'}
                        </div>
                        <div className="prose prose-sm dark:prose-invert max-w-none text-inherit">
                          <MessageContent text={msg.text} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px 20px 20px 4px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }} className="animate-pulse">
                        <div className="flex gap-1.5">
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* MULTIMODAL TACTICAL INPUT */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02] flex flex-col">
                  <div 
                    style={{ 
                      background: darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      borderRadius: '24px', 
                      padding: '4px',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    className="group focus-within:border-indigo-500/50 transition-all"
                  >
                    {isConfigOpen && (
                      <div className="w-full bg-white/[0.01] border-b border-white/10 p-4 space-y-4 rounded-t-[24px] animate-in slide-in-from-top duration-300">
                        {/* Model Selector */}
                        <div className="space-y-1">
                          <div style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Intelligence Model</div>
                          <select
                            value={selectedModel}
                            onChange={(e) => dispatch(setSelectedModel(e.target.value))}
                            style={{
                              width: '100%',
                              background: darkMode ? 'rgba(255,255,255,0.05)' : '#F9F9F9',
                              border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #DDD',
                              borderRadius: '8px',
                              padding: '6px',
                              fontSize: '11px',
                              color: 'var(--text-1)',
                              outline: 'none'
                            }}
                          >
                            {AVAILABLE_MODELS.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        <details className="mt-2">
                          <summary className="text-xs font-bold text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors list-none flex items-center gap-1">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                            Advanced Parameters
                          </summary>
                          <div className="mt-2 space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                            {/* Row 1: Temp & Penalty */}
                            <div className="grid grid-cols-2 gap-4">
                              {/* Temperature */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Temp</span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{modelConfig.temperature.toFixed(2)}</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.05" value={modelConfig.temperature} onChange={(e) => dispatch(setModelConfig({ ...modelConfig, temperature: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: '#4169E1' }} />
                              </div>

                              {/* Penalty */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Penalty</span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{(modelConfig.frequency_penalty || 0).toFixed(1)}</span>
                                </div>
                                <input type="range" min="0" max="2" step="0.1" value={modelConfig.frequency_penalty || 0} onChange={(e) => dispatch(setModelConfig({ ...modelConfig, frequency_penalty: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: '#4169E1' }} />
                              </div>
                            </div>

                            {/* Row 2: Top P & Max Tokens */}
                            <div className="grid grid-cols-2 gap-4">
                              {/* Top P */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Top P</span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{(modelConfig.top_p || 1.0).toFixed(2)}</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.05" value={modelConfig.top_p || 1.0} onChange={(e) => dispatch(setModelConfig({ ...modelConfig, top_p: parseFloat(e.target.value) }))} style={{ width: '100%', accentColor: '#4169E1' }} />
                              </div>

                              {/* Max Tokens */}
                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Max Tokens</span>
                                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{modelConfig.max_tokens || 2048}</span>
                                </div>
                                <input type="range" min="1" max="4096" step="1" value={modelConfig.max_tokens || 2048} onChange={(e) => dispatch(setModelConfig({ ...modelConfig, max_tokens: parseInt(e.target.value) }))} style={{ width: '100%', accentColor: '#4169E1' }} />
                              </div>
                            </div>

                            {/* Row 3: Seed */}
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Seed</span>
                                <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{modelConfig.seed || 42}</span>
                              </div>
                              <input type="number" value={modelConfig.seed || 42} onChange={(e) => dispatch(setModelConfig({ ...modelConfig, seed: parseInt(e.target.value) }))} style={{ width: '100%', background: darkMode ? '#050505' : '#F9F9F9', border: darkMode ? '1px solid #222' : '1px solid #DDD', borderRadius: '4px', padding: '4px', fontSize: '11px', color: 'var(--text-1)' }} />
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                    <textarea
                      value={chatInput}
                      onChange={(e) => dispatch(setChatInput(e.target.value))}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      placeholder="Synthesize tactical query..."
                      style={{ 
                        width: '100%', 
                        background: 'transparent', 
                        border: 'none', 
                        padding: '12px 14px', 
                        fontSize: '13.5px', 
                        color: 'var(--text-1)', 
                        outline: 'none', 
                        resize: 'none', 
                        height: '70px'
                      }}
                      className="custom-scrollbar"
                    />
                    
                    <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {/* Stealth AI Controls (Popover) */}
                        <button 
                          onClick={() => setIsConfigOpen(!isConfigOpen)}
                          className={`w-[34px] h-[34px] rounded-[10px] ${isConfigOpen ? 'bg-indigo-500/20 text-indigo-500' : 'bg-white/5 text-[var(--text-3)]'} border border-white/10 flex items-center justify-center cursor-pointer hover:bg-indigo-500/20 hover:text-indigo-500 transition-all`}
                          title="Model Configuration"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 12h6"/></svg>
                        </button>

                        <div className="relative">
                          <label 
                            title="Upload Intelligence (Image/Data)"
                            style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isUploadingImage ? 'wait' : 'pointer' }}
                            className={`hover:bg-indigo-500/20 hover:text-indigo-500 transition-all ${isUploadingImage ? 'opacity-50 animate-pulse' : ''}`}
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setUploadedVisionFiles([e.target.files[0]]);
                                }
                              }} 
                              disabled={isUploadingImage} 
                            />
                            {uploadedVisionFiles && uploadedVisionFiles.length > 0 ? (
                              <img src={URL.createObjectURL(uploadedVisionFiles[0])} className="w-full h-full object-cover rounded-[10px]" alt="Preview" />
                            ) : (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            )}
                          </label>
                          {uploadedVisionFiles && uploadedVisionFiles.length > 0 && (
                            <button 
                              onClick={() => setUploadedVisionFiles([])} 
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                              style={{ zIndex: 10 }}
                            >
                              ×
                            </button>
                          )}
                        </div>

                        <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }}></div>

                        {/* CONTEXT TOGGLES (INSIDE BOX) */}
                        <button 
                          onClick={() => dispatch(setIncludeData(!includeData))} 
                          style={{ 
                            height: '34px',
                            padding: '0 12px', 
                            borderRadius: '10px', 
                            fontSize: '9px', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em',
                            background: includeData ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: `1px solid ${includeData ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                            color: includeData ? '#818cf8' : 'var(--text-4)',
                            cursor: 'pointer'
                          }}
                          className="transition-all hover:border-indigo-500/50"
                        >
                          Data
                        </button>
                        <button 
                          onClick={() => dispatch(setIncludeDoctrine(!includeDoctrine))} 
                          style={{ 
                            height: '34px',
                            padding: '0 12px', 
                            borderRadius: '10px', 
                            fontSize: '9px', 
                            fontWeight: 900, 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.08em',
                            background: includeDoctrine ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                            border: `1px solid ${includeDoctrine ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                            color: includeDoctrine ? '#818cf8' : 'var(--text-4)',
                            cursor: 'pointer'
                          }}
                          className="transition-all hover:border-indigo-500/50"
                        >
                          Doctrine
                        </button>
                      </div>

                      <button 
                        onClick={handleSendMessage} 
                        disabled={!chatInput.trim() || isAiLoading} 
                        style={{ 
                          height: '36px', 
                          padding: '0 18px', 
                          background: '#4f46e5', 
                          color: 'white', 
                          borderRadius: '10px', 
                          border: 'none', 
                          fontSize: '11px', 
                          fontWeight: 900, 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.05em',
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '8px',
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)'
                        }}
                        className="hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:grayscale transition-all"
                      >
                        {isAiLoading ? 'Sourcing...' : (
                          <>
                            Send
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>



      {/* MOBILE PAGES MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[110] p-8 flex flex-col items-center justify-center animate-in slide-in-from-top duration-300"
          style={{ background: 'var(--bg)' }}
        >
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute top-8 right-8 p-4 text-[var(--text-1)]"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
          <div className="flex flex-col gap-10 text-center">
            {[
              { label: 'Home', active: prepStep === 1 && activeView !== 'profile', action: () => { setPrepStep(1); setActiveView('terminal'); setActiveSessionId(null); setIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Pinaka', active: activeView === 'terminal' && (activeSessionId || prepStep === 2), action: () => { setActiveView('terminal'); setPrepStep(2); setActiveSessionId(null); setIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Trishul', active: activeView === 'trishul', action: () => { setActiveView('trishul'); setPrepStep(2); setActiveSessionId(null); setIsLoggerOpen(false); setIsAiPaneOpen(false); } }
            ].map((nav) => (
              <button
                key={nav.label}
                onClick={() => { nav.action(); setIsMobileMenuOpen(false); }}
                className="text-3xl font-black uppercase tracking-widest transition-all"
                style={{ color: nav.active ? 'var(--accent)' : 'var(--text-1)' }}
              >
                {nav.label}
              </button>
            ))}
          </div>
        </div>
      )}



      <GlobalOverlay />
    </div>
  );
}
