/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

import { useNetra } from './context/NetraContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setSelectedModel, setModelConfig } from './store/slices/modelSlice';
import { setIncludeData, setIncludeDoctrine, setChatInput } from './store/slices/chatSlice';
import { setTradeName, setLogSearchTerm, setLogFilterOutcome, setLogSortOrder } from './store/slices/logsSlice';
import { setSessionInput } from './store/slices/sessionSlice';
import { setPrepStep, setActiveView, setIsLoggerOpen } from './store/slices/uiSlice';
import Login from './components/Auth/Login';
import GlobalOverlay from './components/Layout/GlobalOverlay';
import MayaChatPanel from './components/Layout/MayaChatPanel';
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
import MarketTypeSelector from './components/Terminal/MarketTypeSelector';
import ProfilePage from './components/Terminal/ProfilePage';
import NetraTree from './components/Terminal/NetraTree';

// ─── Protocol sub-views ───────────────────────────────────────────────────────

function NoEngagementProtocol() {
  return (
    <div className="flex flex-col items-center justify-center p-16 lg:p-32 rounded-xl relative overflow-hidden group premium-shadow" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="text-[var(--text-1)] font-sans text-4xl lg:text-7xl font-bold tracking-tight uppercase mb-6 text-center relative z-10">Stand Down</div>
      <div className="text-[var(--text-3)] font-sans text-[11px] font-semibold tracking-widest uppercase text-center max-w-2xl leading-relaxed mb-10 relative z-10">
        Capital Preservation Mode <span className="mx-2 text-[var(--border-strong)]">///</span> The system detects conflicting data streams or an absence of structural asymmetry.
      </div>
      <div className="text-red-500 font-sans text-xs font-bold uppercase tracking-widest text-center py-4 px-8 border border-red-500/20 bg-red-500/5 rounded-lg relative z-10">Override Active. Do Not Deploy Capital.</div>
    </div>
  );
}

// Fixed: previously used undefined <WeaponArmory> — Phase9WeaponArmory reads finalCommand from context
function StrikeProtocol() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
      <Phase9WeaponArmory />
    </div>
  );
}

function InterceptionProtocol() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700">
      <Phase9WeaponArmory />
    </div>
  );
}

// ─── Main terminal component ──────────────────────────────────────────────────

export default function NetraTerminal() {
  const {
    session, sysData,
    prepStep, setPrepStep: ctxSetPrepStep,
    activeSessionId, setActiveSessionId,
    activeView, setActiveView: ctxSetActiveView,
    currentModel, setCurrentModel,
    isProfileOpen, setIsProfileOpen,
    isLoggerOpen, setIsLoggerOpen: ctxSetIsLoggerOpen,
    isAiPaneOpen, setIsAiPaneOpen,
    darkMode, setDarkMode,
    toggleTradeData, toggleAnalyst,
    confirmModal,
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
    uploadedVisionFiles, setUploadedVisionFiles,
    logout,
  } = useNetra();

  const dispatch = useDispatch();
  const location = useLocation();

  const toast = useSelector((s: RootState) => s.ui.toast);
  const tradeLogs = useSelector((s: RootState) => s.logs.tradeLogs);
  const logSearchTerm = useSelector((s: RootState) => s.logs.logSearchTerm);
  const logFilterOutcome = useSelector((s: RootState) => s.logs.logFilterOutcome);
  const logSortOrder = useSelector((s: RootState) => s.logs.logSortOrder);
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);
  const editFormData = useSelector((s: RootState) => s.logs.editFormData);
  const sessionInput = useSelector((s: RootState) => s.session.sessionInput);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const finalCommand = useSelector((s: RootState) => s.analysis.finalCommand);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const stepTimestamps = useSelector((s: RootState) => s.analysis.stepTimestamps);
  const interSelections = useSelector((s: RootState) => s.analysis.interSelections);
  const strikeSelections = useSelector((s: RootState) => s.analysis.strikeSelections);
  const weaponLocked = useSelector((s: RootState) => s.analysis.weaponLocked);
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
  const analyticsData = useSelector((s: RootState) => s.analysis.analyticsData) as any;
  const chatHistory = useSelector((s: RootState) => s.chat.chatHistory);
  const chatInput = useSelector((s: RootState) => s.chat.chatInput);
  const selectedModel = useSelector((s: RootState) => s.model.selectedModel);
  const AVAILABLE_MODELS = useSelector((s: RootState) => s.model.availableModels);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const includeData = useSelector((s: RootState) => s.chat.includeData);
  const includeDoctrine = useSelector((s: RootState) => s.chat.includeDoctrine);
  const isAiLoading = useSelector((s: RootState) => s.chat.isAiLoading);
  const isUploadingImage = useSelector((s: RootState) => s.analysis.isUploadingImage);
  const tradeName = useSelector((s: RootState) => s.logs.tradeName);
  const isMobileMenuOpen = useSelector((s: RootState) => s.ui.isMobileMenuOpen);

  const [isDockExpanded, setIsDockExpanded] = useState(true);
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sortCol, setSortCol] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const frameworkRef = useRef<HTMLDivElement>(null);
  const [frameworkIdx, setFrameworkIdx] = useState(0);

  // ─── Sync URL → Redux state (handles back/forward, deep links) ───────────────
  useEffect(() => {
    const p = location.pathname;
    if (p === '/home') { ctxSetPrepStep(1); ctxSetActiveView('terminal'); }
    else if (p.startsWith('/mission/trishul')) { ctxSetPrepStep(2); ctxSetActiveView('trishul'); }
    else if (p.startsWith('/mission')) { ctxSetPrepStep(2); ctxSetActiveView('terminal'); }
    else if (p === '/profile') { ctxSetActiveView('profile'); }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const downloadCSV = () => {
    if (!tradeLogs || tradeLogs.length === 0) { showToast('No records available for export', 'error'); return; }
    setIsDownloading(true);
    try {
      const headers = ['MISSION_ID', 'TIMESTAMP', 'ASSET', 'MISSION_NAME', 'OPERATOR', 'PROTOCOL', 'WEAPON', 'BIAS_SELECT', 'AUCTION_SELECT', 'LIQUIDITY_SELECT', 'BEHAVIOUR_SELECT', 'ENTRY_PRICE', 'STOP_LOSS', 'EXIT_PRICE', 'OUTCOME', 'NET_PL', 'OPERATOR_THOUGHT'];
      const rows = tradeLogs.map(log => [
        log.id, new Date(log.timestamp).toISOString(), log.phase1?.asset_ticker || '—', log.name || 'UNNAMED_MISSION', log.username || 'ANONYMOUS', log.phase1?.protocol || '—', log.weapon || '—',
        Object.values(log.phase1?.realBias || {}).join('|'), Object.values(log.phase1?.htfStructure || {}).join('|'), Object.values(log.phase1?.marketPulse || {}).join('|'), Object.values(log.phase1?.liquidityContext || {}).join('|'),
        log.phase2?.entry_price || '0', log.phase2?.stop_loss || '0', log.phase4?.exit_price || '0', log.phase4?.outcome || 'OPEN', log.phase4?.pl || '0', (String(log.phase4?.user_thought || '')).replace(/"/g, '""'),
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url); link.setAttribute('download', `NETRA_LEDGER_EXPORT_${Date.now()}.csv`); link.style.visibility = 'hidden';
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      showToast('Tactical Ledger Exported Successfully');
    } catch { showToast('Export Protocol Failure', 'error'); }
    finally { setIsDownloading(false); }
  };

  if (!session) return <><Login /><GlobalOverlay /></>;

  if (!sysData) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] flex flex-col items-center justify-center font-sans">
        <h1 className="text-2xl font-bold tracking-tight uppercase mb-6 animate-pulse text-stone-700">Initializing Netra System...</h1>
        <p className="text-stone-400 text-[10px] text-center border-t border-stone-100 pt-4 px-8 mt-4 tracking-widest uppercase">Establishing Secure Connection to Engine</p>
        <GlobalOverlay />
      </div>
    );
  }

  // Redirect root to /home
  if (location.pathname === '/' || location.pathname === '/login') {
    return <Navigate to="/home" replace />;
  }

  // Corner watermark SVG patterns (top-right + bottom-left)
  const _blueOp = darkMode ? '0.25' : '0.13';
  const _amberOp = darkMode ? '0.65' : '0.40';
  const _mkDiamond = (cx: number, cy: number, s: number, color: string, op: string, sw: string) =>
    `<polygon points="${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}" fill="none" stroke="${color}" stroke-width="${sw}" stroke-opacity="${op}"/>`;
  const _trParts: string[] = [];
  const _blParts: string[] = [];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 7; col++) {
      const s = 11, sp = 28;
      const trX = 380 - col * sp - (row % 2 === 0 ? 0 : sp / 2) - 14;
      const trY = row * sp + 14;
      _trParts.push(_mkDiamond(trX, trY, s, '%234169E1', _blueOp, '1'));
      const blX = col * sp + (row % 2 === 0 ? 0 : sp / 2) + 14;
      const blY = 380 - row * sp - 14;
      _blParts.push(_mkDiamond(blX, blY, s, '%234169E1', _blueOp, '1'));
    }
  }
  ([[352,44,30],[306,16,18],[370,108,22],[298,74,13],[334,148,15],[268,38,9]] as [number,number,number][]).forEach(([cx,cy,s]) => {
    _trParts.push(_mkDiamond(cx, cy, s, '%23F59E0B', _amberOp, s > 20 ? '1.8' : '1.3'));
  });
  ([[28,336,30],[74,364,18],[10,272,22],[82,306,13],[46,232,15],[112,342,9]] as [number,number,number][]).forEach(([cx,cy,s]) => {
    _blParts.push(_mkDiamond(cx, cy, s, '%23F59E0B', _amberOp, s > 20 ? '1.8' : '1.3'));
  });
  const _svgWrap = (parts: string[]) =>
    `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='380' height='380'>${parts.join('')}</svg>")`;
  const _cornerBg = `${_svgWrap(_trParts)}, ${_svgWrap(_blParts)}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg)', backgroundImage: _cornerBg, backgroundRepeat: 'no-repeat, no-repeat', backgroundPosition: 'top right, bottom left', backgroundSize: '380px 380px, 380px 380px', overflow: 'hidden', position: 'relative' }}>

      {/* HEADER */}
      <header style={{ height: '64px', position: 'sticky', top: 0, background: darkMode ? '#000' : '#fff', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: darkMode ? '1px solid white' : '1px solid #4169E1', zIndex: 200, flexShrink: 0 }} className="px-6 lg:px-10 flex justify-between items-center maxWidth-100">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="mobile-only" onClick={() => dispatch({ type: 'ui/setMobileMenuOpen', payload: !isMobileMenuOpen })} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: darkMode ? 'white' : '#4169E1' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <button onClick={() => { if (session) { ctxSetPrepStep(1); setActiveSessionId(null); } }} style={{ background: 'none', border: 'none', padding: 0, cursor: session ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '0.1em', color: darkMode ? 'white' : '#4169E1', lineHeight: 1, marginBottom: 0, textTransform: 'uppercase' }}>NETRA</h1>
            </div>
          </button>
          <div className="desktop-only" style={{ width: '1px', height: '24px', background: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(65,105,225,0.3)', margin: '0 4px', opacity: 0.6 }}></div>
          <div className="desktop-only" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {[
              { label: 'Home', active: prepStep === 1 && activeView !== 'profile', action: () => { ctxSetPrepStep(1); ctxSetActiveView('terminal'); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Pinaka', active: prepStep > 1 && (currentModel === 'pinaka' || !currentModel), action: () => { ctxSetActiveView('terminal'); setCurrentModel('pinaka'); ctxSetPrepStep(2); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Trishul', active: prepStep > 1 && currentModel === 'trishul', action: () => { ctxSetActiveView('trishul'); setCurrentModel('trishul'); ctxSetPrepStep(2); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
            ].map((nav) => (
              <button key={nav.label} onClick={nav.action} style={{ padding: '6px 14px', fontSize: '11px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.06em', color: nav.active ? '#4169E1' : (darkMode ? 'white' : '#4169E1'), borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: nav.active ? '2px solid #4169E1' : '2px solid transparent', background: 'none', cursor: 'pointer', transition: 'all 150ms' }}>
                {nav.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: OPERATOR CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button onClick={() => setIsAiPaneOpen(!isAiPaneOpen)} title="Launch NETRA Console" style={{ width: '38px', height: '38px', borderRadius: '16px', background: isAiPaneOpen ? 'linear-gradient(135deg, #4169E1, #6366f1)' : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(65,105,225,0.05)'), border: `1px solid ${isAiPaneOpen ? '#4169E1' : (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(65,105,225,0.2)')}`, color: darkMode ? 'white' : '#4169E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)', boxShadow: isAiPaneOpen ? '0 0 20px rgba(65,105,225,0.4)' : 'none', position: 'relative' }} className="hover:scale-110 active:scale-95 group">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18V9L12 15L20 9V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 15L12 21" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5"/>
              <circle cx="12" cy="5" r="2" fill="currentColor" className={isAiPaneOpen ? 'animate-pulse' : ''}/>
            </svg>
          </button>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setIsProfileOpen(!isProfileOpen)} style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', outline: 'none' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '16px', background: isProfileOpen ? '#4169E1' : (darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(65,105,225,0.05)'), border: `1px solid ${isProfileOpen ? '#4169E1' : (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(65,105,225,0.2)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: darkMode ? 'white' : '#4169E1', transition: 'all 200ms' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, textTransform: 'uppercase' }}>{(session?.userName || 'O')[0]}</span>
              </div>
            </button>
            {isProfileOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 140 }} onClick={() => setIsProfileOpen(false)}></div>
                <div className="animate-in fade-in duration-200 slide-in-from-top-1" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '240px', background: darkMode ? '#050505' : '#FFFFFF', border: darkMode ? '1px solid #222' : '1px solid #DDD', borderRadius: '12px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)', zIndex: 150 }}>
                  <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: darkMode ? '1px solid #111' : '1px solid #EEE' }}>
                    <div style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6 }}>Operator Status</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#4169E1', marginTop: '2px' }}>{session?.userName || 'Operator'}</div>
                  </div>
                  <button onClick={() => { ctxSetActiveView('profile'); setIsProfileOpen(false); }} style={{ width: '100%', padding: '10px', borderRadius: '2px', border: '1px solid #333', background: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#888', marginBottom: '8px' }} className="hover:bg-blue-900 hover:text-white transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>View Profile</span>
                  </button>
                  <button onClick={logout} style={{ width: '100%', padding: '10px', borderRadius: '2px', border: '1px solid #333', background: '#0a0a0a', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#888' }} className="hover:bg-red-900 hover:text-white transition-all">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase' }}>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Light mode' : 'Dark mode'} />
        </div>
      </header>

      {/* MISSION TELEMETRY BAR */}
      {activeSessionId && (
        <div style={{ height: '38px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'stretch', zIndex: 90, animation: 'slide-down 0.4s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }} className="desktop-only">
          {/* LEFT: session identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 24px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4169E1', boxShadow: '0 0 10px rgba(65,105,225,0.6)' }} className="animate-pulse"></div>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#4169E1', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Active Mission</span>
            </div>
            <div style={{ width: '1px', height: '14px', background: 'var(--border)', opacity: 0.5 }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Strategy:</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: 'var(--text-1)', textTransform: 'uppercase' }}>{tradeName || 'Tactical_Alpha'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Asset:</span>
                <span style={{ fontSize: '11px', fontWeight: 950, color: 'var(--accent)', textTransform: 'uppercase' }}>{session?.assetName || activeEditLog?.phase1?.asset_ticker || 'Awaiting_Data'}</span>
              </div>
            </div>
          </div>
          {/* SEPARATOR */}
          <div style={{ width: '1px', background: 'var(--border)', flexShrink: 0 }} />
          {/* RIGHT: phase progress tabs */}
          {prepStep >= 2 && (activeView === 'terminal' || activeView === 'trishul') && (
            <div style={{ display: 'flex', alignItems: 'stretch', flex: 1, overflowX: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              {([
                { id: 'P0', label: 'VISION', step: 0 },
                { id: 'P1', label: 'BIAS', step: 1 },
                { id: 'P2', label: 'AUCTION', step: 2 },
                { id: 'P3', label: 'LIQUIDITY', step: 3 },
                { id: 'P4', label: 'BEHAVIOUR', step: 4 },
                { id: 'P5', label: 'SYNTHESIS', step: 5 },
                { id: 'P6', label: 'COMMAND', step: 5 },
                { id: 'P7', label: 'WEAPON', step: 6 },
                { id: 'P10', label: 'MISSION', step: 7 },
              ] as Array<{ id: string; label: string; step: number }>).map((m) => {
                const isComplete = highestStep > m.step;
                const isCurrent = highestStep === m.step;
                return (
                  <div key={m.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', borderRight: '1px solid var(--border)', flexShrink: 0, borderBottom: isCurrent ? '2px solid var(--accent)' : '2px solid transparent', background: isCurrent ? (darkMode ? 'rgba(65,105,225,0.08)' : 'rgba(65,105,225,0.04)') : 'transparent', transition: 'all 200ms' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: isComplete ? 'var(--green)' : isCurrent ? 'var(--accent)' : 'var(--text-4)', opacity: isCurrent || isComplete ? 1 : 0.35, letterSpacing: '0.05em', whiteSpace: 'nowrap', transition: 'all 200ms' }}>
                      {isComplete ? '✓' : '·'} {m.id}
                    </span>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: isComplete ? 'var(--text-3)' : isCurrent ? 'var(--text-1)' : 'var(--text-4)', opacity: isCurrent || isComplete ? 1 : 0.25, whiteSpace: 'nowrap', transition: 'all 200ms' }}>{m.label}</span>
                  </div>
                );
              })}
            </div>
          )}
          {/* TREE BUTTON — pinned right */}
          <button
            onClick={() => setIsTreeOpen(true)}
            title="NETRA Decision Tree"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 16px', borderTop: 'none', borderRight: 'none', borderBottom: 'none', borderLeft: '1px solid var(--border)', background: isTreeOpen ? (darkMode ? 'rgba(65,105,225,0.15)' : 'rgba(65,105,225,0.08)') : 'transparent', color: '#4169E1', cursor: 'pointer', flexShrink: 0, transition: 'background 150ms' }}
            className="hover:bg-[rgba(65,105,225,0.08)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="4" r="2"/><line x1="12" y1="6" x2="12" y2="10"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><line x1="10.8" y1="10.8" x2="7.2" y2="12.4"/><line x1="13.2" y1="10.8" x2="16.8" y2="12.4"/><line x1="6" y1="16" x2="6" y2="20"/><line x1="18" y1="16" x2="18" y2="20"/></svg>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>Decision Tree</span>
          </button>
        </div>
      )}

      {/* TACTICAL COMMAND DOCK */}
      {prepStep >= 2 && activeSessionId && (activeView === 'terminal' || activeView === 'trishul') && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[110] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
          {!isDockExpanded ? (
            <button onClick={() => setIsDockExpanded(true)} className="w-12 h-12 rounded-full flex items-center justify-center bg-[#4169E1] text-white shadow-[0_0_20px_rgba(65,105,225,0.4)] hover:scale-110 active:scale-95 transition-all group">
              <div className="absolute inset-0 rounded-full animate-ping bg-[#4169E1] opacity-20 group-hover:opacity-40"></div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="relative z-10"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </button>
          ) : (
            <div className="glass-panel animate-in slide-in-from-bottom-4 duration-300" style={{ background: darkMode ? 'rgba(15,20,25,0.9)' : 'rgba(255,255,255,0.95)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', borderRadius: '100px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: darkMode ? '0 20px 50px rgba(0,0,0,0.5),inset 0 1px 1px rgba(255,255,255,0.1)' : '0 10px 30px rgba(0,0,0,0.1),inset 0 1px 1px rgba(255,255,255,0.5)', width: 'max-content', maxWidth: 'calc(100vw - 32px)', height: '52px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => ctxSetIsLoggerOpen(!isLoggerOpen)} title="Trade Data Ledger" style={{ width: '38px', height: '38px', borderRadius: '50%', background: isLoggerOpen ? '#4169E1' : (darkMode ? 'rgba(65,105,225,0.1)' : 'rgba(65,105,225,0.05)'), border: '1px solid rgba(65,105,225,0.3)', color: isLoggerOpen ? 'white' : '#4169E1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', boxShadow: isLoggerOpen ? '0 0 15px rgba(65,105,225,0.4)' : 'none' }} className="hover:scale-110 active:scale-90">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                </button>
              </div>
              <div style={{ width: '1px', height: '24px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', margin: '0 4px' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => { resetTerminalState(); showToast('Mission Scrubbed — State Purged', 'warning'); }} title="Scrub Mission Data" style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(245,158,11,0.4)', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)' }} className="hover:bg-[#f59e0b] hover:text-white hover:rotate-180 active:scale-90">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                </button>
                <button onClick={saveSession} disabled={isAiLoading} title="Save Tactical State" style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: 'white', border: '1px solid rgba(16,185,129,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 15px rgba(16,185,129,0.4)' }} className="hover:scale-110 active:scale-90 hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>
                </button>
                <button onClick={() => { setActiveSessionId(null); dispatch({ type: 'logs/setActiveEditLog', payload: null }); dispatch({ type: 'analysis/setHighestStep', payload: 0 }); dispatch({ type: 'analysis/setWeaponLocked', payload: false }); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); showToast('Protocol Aborted — State Purged'); }} title="Abort Protocol" style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', transition: 'all 0.3s' }} className="hover:bg-[#ef4444] hover:text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <button onClick={() => setIsTreeOpen(true)} title="NETRA Decision Tree" style={{ width: '34px', height: '34px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(65,105,225,0.3)', background: isTreeOpen ? '#4169E1' : 'rgba(65,105,225,0.1)', color: isTreeOpen ? 'white' : '#4169E1', cursor: 'pointer', transition: 'all 0.3s' }} className="hover:bg-[#4169E1] hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="5" r="2"/><line x1="12" y1="7" x2="12" y2="11"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><line x1="10.8" y1="11.6" x2="7.2" y2="12.4"/><line x1="13.2" y1="11.6" x2="16.8" y2="12.4"/><line x1="6" y1="16" x2="6" y2="19"/><line x1="18" y1="16" x2="18" y2="19"/></svg>
                </button>
                <div style={{ width: '1px', height: '24px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', margin: '0 4px' }}></div>
                <button onClick={() => setIsDockExpanded(false)} title="Collapse Dock" style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:text-white dark:hover:text-white">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="relative">
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="relative">

          {/* LEFT SIDEBAR — Operational Ledger */}
          {(activeSessionId || activeEditLog) && (
            <aside className={`sidebar-transition flex flex-col z-[150] ${isLoggerOpen ? 'w-[400px] max-w-[100vw] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full overflow-hidden'}`} style={{ background: darkMode ? '#1C2128' : '#FFFFFF', borderRight: isLoggerOpen ? '1px solid var(--accent)' : 'none', boxShadow: isLoggerOpen ? '40px 0 80px rgba(0,0,0,0.5)' : 'none', position: 'relative', height: '100%', transition: 'all 500ms cubic-bezier(0.23,1,0.32,1)' }}>
              <div style={{ minWidth: '400px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    <span style={{ fontSize: '11px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-1)' }}>Operational Intelligence</span>
                  </div>
                  <button onClick={() => ctxSetIsLoggerOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-3)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 flex flex-col gap-8">
                  {/* Mission Profile */}
                  <div style={{ padding: '16px', borderRadius: '16px', background: darkMode ? 'rgba(255,255,255,0.02)' : '#ffffff', border: '1px solid var(--border)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--accent)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 10px var(--accent)' }}></div>Mission Profile
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                      <div className="flex justify-between items-baseline"><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-4)' }}>Asset Ticker</span><span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-1)' }}>{session?.assetName || activeEditLog?.phase1?.asset_ticker || '—'}</span></div>
                      <div className="flex justify-between items-baseline"><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-4)' }}>Neural Model</span><span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--accent)' }}>{currentModel === 'pinaka' ? 'PINAKA 2.1' : 'TRISHUL 1.0'}</span></div>
                      <div className="flex justify-between items-baseline"><span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-4)' }}>Operation ID</span><span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-1)' }}>{session?.tradeName || activeEditLog?.name || 'UNNAMED_OP'}</span></div>
                    </div>
                  </div>
                  {/* Strategic Analysis Phases */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>Strategic Analysis</div>
                    {([
                      { label: 'Phase 1: Real Bias', val: activeEditLog ? activeEditLog.phase1?.realBias : selections.realBias, note: activeEditLog ? (activeEditLog.phase1 as any)?.realBias_note : notes.realBias, color: '#4169E1' },
                      { label: 'Phase 2: HTF Structure', val: activeEditLog ? activeEditLog.phase1?.htfStructure : selections.htfStructure, note: activeEditLog ? (activeEditLog.phase1 as any)?.htfStructure_note : notes.htfStructure, color: '#6366f1' },
                      { label: 'Phase 3: Market Pulse', val: activeEditLog ? activeEditLog.phase1?.marketPulse : selections.marketPulse, note: activeEditLog ? (activeEditLog.phase1 as any)?.marketPulse_note : notes.marketPulse, color: '#10b981' },
                      { label: 'Phase 4: Liquidity Context', val: activeEditLog ? activeEditLog.phase1?.liquidityContext : selections.liquidityContext, note: activeEditLog ? (activeEditLog.phase1 as any)?.liquidityContext_note : notes.liquidityContext, color: '#f59e0b' },
                    ] as Array<{ label: string; val: Record<string, string> | undefined; note: string | undefined; color: string }>).map((phase, i) => (
                      <div key={i} style={{ padding: '14px', borderRadius: '16px', background: darkMode ? 'rgba(255,255,255,0.01)' : '#ffffff', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 850, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{phase.label}</div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: phase.note ? '10px' : '0' }}>
                          {phase.val && Object.keys(phase.val).length > 0 ? (
                            Object.entries(phase.val).map(([key, value]) => (
                              <div key={key} style={{ padding: '4px 8px', borderRadius: '6px', background: darkMode ? 'rgba(255,255,255,0.03)' : 'var(--bg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                <span style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', opacity: 0.5 }}>{key.replace(/_/g, ' ')}</span>
                                <span style={{ fontSize: '9px', fontWeight: 900, color: phase.color }}>{value}</span>
                              </div>
                            ))
                          ) : (
                            <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-4)', fontStyle: 'italic' }}>Pending Selections...</span>
                          )}
                        </div>
                        {phase.note ? <div style={{ padding: '8px 10px', borderRadius: '8px', background: darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', borderLeft: `2px solid ${phase.color}`, fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.5', fontStyle: 'italic' }}>{phase.note}</div> : <div style={{ fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.4, marginTop: '4px' }}>No phase-specific notes captured.</div>}
                      </div>
                    ))}
                  </div>
                  {/* STS Intelligence */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>STS Intelligence</div>
                    <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(99,102,241,0.03)', border: '1px solid rgba(99,102,241,0.1)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 850, color: '#6366f1', marginBottom: '12px', textTransform: 'uppercase' }}>{finalCommand || netraOutput?.cmd || 'Unspecified Protocol'}</div>
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
                  {/* Engagement Suite */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>Engagement Suite</div>
                    <div style={{ padding: '16px', borderRadius: '16px', background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.1)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase' }}>Weapon Identity</span>
                        <span style={{ fontSize: '12px', fontWeight: 950, color: '#10b981' }}>{selectedWeaponId || activeEditLog?.weapon || 'LOCKED'}</span>
                      </div>
                      {notes.weapon ? <div style={{ fontSize: '11px', color: 'var(--text-2)', lineHeight: '1.5', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.1)', fontStyle: 'italic' }}>{notes.weapon}</div> : <div style={{ fontSize: '10px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.5 }}>No tactical weapon logic defined.</div>}
                    </div>
                  </div>
                  {/* Execution Telemetry */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-3)', paddingLeft: '4px' }}>Execution Telemetry</div>
                    <div style={{ padding: '16px', borderRadius: '12px', background: darkMode ? 'rgba(0,0,0,0.2)' : '#ffffff', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                      <div><div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Entry Threshold</div><div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--text-1)' }}>{String(editFormData.entry_price || '—')}</div></div>
                      <div><div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Risk Stop</div><div style={{ fontSize: '13px', fontWeight: 950, color: '#ef4444' }}>{String(editFormData.stop_loss || '—')}</div></div>
                      <div><div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Add. Overheads</div><div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--text-1)' }}>{String(editFormData.additional_cost || '0.00')}</div></div>
                      <div><div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Breakeven Level</div><div style={{ fontSize: '13px', fontWeight: 950, color: '#f59e0b' }}>{(() => { const e = parseFloat(String(editFormData.entry_price)) || 0; const c = parseFloat(String(editFormData.additional_cost)) || 0; return e > 0 ? (e + c).toFixed(2) : '—'; })()}</div></div>
                      <div style={{ gridColumn: 'span 2', height: '1px', background: 'var(--border)' }}></div>
                      <div><div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '4px' }}>Realized P/L</div><div style={{ fontSize: '13px', fontWeight: 950, color: (parseFloat(String((editFormData as any).pl)) || 0) >= 0 ? '#10b981' : '#ef4444' }}>{String((editFormData as any).pl || '0.00')}</div></div>
                      <div><div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '4px' }}>Net Yield (%)</div><div style={{ fontSize: '13px', fontWeight: 950, color: 'var(--accent)' }}>{(() => { const e = parseFloat(String(editFormData.entry_price)) || 0; const x = parseFloat(String((editFormData as any).exit_price)) || 0; return e > 0 && x > 0 ? (((x - e) / e) * 100).toFixed(2) + '%' : '—'; })()}</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* MAIN TERMINAL CONTAINER */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <main className={prepStep === 1 ? '' : 'terminal-main'} style={{ flex: 1, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

              {activeView === 'profile' ? (
                <ProfilePage />
              ) : prepStep === 1 && !activeSessionId ? (
                /* ── COMMAND DASHBOARD ── */
                <div className="flex-1 overflow-y-auto fade-up" style={{ background: 'var(--bg)', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M56 100L56 66 28 66 0 50 0 16 28 0 56 16 56 50 28 66M28 100 28 66' stroke='white' stroke-opacity='0.045' stroke-width='0.6' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '140px 250px', position: 'relative' }}>
                  {/* ── CORNER: TOP-RIGHT ── */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '540px', height: '320px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <svg width="540" height="320" viewBox="0 0 540 320" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="390,-30 468,15 468,105 390,150 312,105 312,15" fill="none" stroke="#4169E1" strokeOpacity="0.16" strokeWidth="1.5"/>
                      <polygon points="234,-30 312,15 312,105 234,150 156,105 156,15" fill="none" stroke="#4169E1" strokeOpacity="0.07" strokeWidth="1"/>
                      <polygon points="312,105 390,150 390,240 312,285 234,240 234,150" fill="#4169E1" fillOpacity="0.05" stroke="#4169E1" strokeOpacity="0.22" strokeWidth="1.5"/>
                      <polygon points="468,105 546,150 546,240 468,285 390,240 390,150" fill="none" stroke="#4169E1" strokeOpacity="0.09" strokeWidth="1"/>
                      <polygon points="546,150 624,195 624,285 546,330 468,285 468,195" fill="none" stroke="#4169E1" strokeOpacity="0.05" strokeWidth="0.8"/>
                    </svg>
                  </div>
                  {/* ── CORNER: BOTTOM-LEFT ── */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '320px', height: '280px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <svg width="320" height="280" viewBox="0 0 320 280" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="50,140 111,175 111,245 50,280 -11,245 -11,175" fill="#4169E1" fillOpacity="0.04" stroke="#4169E1" strokeOpacity="0.16" strokeWidth="1.5"/>
                      <polygon points="172,140 233,175 233,245 172,280 111,245 111,175" fill="none" stroke="#4169E1" strokeOpacity="0.09" strokeWidth="1"/>
                      <polygon points="-72,140 -11,175 -11,245 -72,280 -133,245 -133,175" fill="none" stroke="#4169E1" strokeOpacity="0.06" strokeWidth="1"/>
                      <polygon points="50,280 111,315 111,385 50,420 -11,385 -11,315" fill="none" stroke="#4169E1" strokeOpacity="0.07" strokeWidth="0.8"/>
                    </svg>
                  </div>
                  <div style={{ maxWidth: '1420px', width: '100%', margin: '0 auto', padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>

                    {/* SYSTEM HEADER */}
                    <div style={{ paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
                      {/* top row: status indicator */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} className="pulse-dot" />
                          <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--text-4)' }}>
                            {session?.userName || 'Operator'} · v2.0 Online
                          </span>
                        </div>
                        {/* STATUS PILLS */}
                        <div style={{ display: 'flex', gap: '1px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          {([
                            { label: 'Neural Core', status: 'ACTIVE', color: '#10b981' },
                            { label: 'Data Link', status: 'SYNCED', color: '#10b981' },
                            { label: 'Engine', status: 'READY', color: '#4169E1' },
                          ] as Array<{ label: string; status: string; color: string }>).map(s => (
                            <div key={s.label} style={{ background: 'var(--surface)', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="mono" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-4)' }}>{s.label}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: s.color, boxShadow: `0 0 4px ${s.color}` }} />
                                <span className="mono" style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.1em', color: s.color }}>{s.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* wordmark */}
                      <h1 style={{ fontSize: '56px', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase', margin: 0, display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ color: 'var(--text-1)' }}>NETRA</span>
                        <span style={{ color: 'var(--accent)' }}>COMMAND</span>
                      </h1>
                      <p style={{ fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.65, fontWeight: 500, marginTop: '10px', maxWidth: '480px' }}>
                        Neural-enhanced tactical execution platform. Multi-phase structural analysis with institutional-grade conviction synthesis.
                      </p>
                    </div>

                    {/* ── CONTENT BOX ── */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,0.013)', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* PERFORMANCE SNAPSHOT — only rendered when trade data exists */}
                    {tradeLogs && tradeLogs.length > 0 && (() => {
                      const wins = tradeLogs.filter(l => l.phase4?.outcome === 'WIN').length;
                      const losses = tradeLogs.filter(l => l.phase4?.outcome === 'LOSS').length;
                      const be = tradeLogs.filter(l => l.phase4?.outcome === 'BE').length;
                      const total = tradeLogs.length;
                      const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : '—';
                      const recent = tradeLogs[0];
                      return (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                            <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--text-4)' }}>Performance Snapshot</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {([
                              { label: 'Total Missions', value: String(total), sub: 'all-time' },
                              { label: 'Win Rate', value: `${wr}%`, sub: `${wins}W · ${losses}L · ${be}BE` },
                              { label: 'Last Asset', value: String(recent?.phase1?.asset_ticker || '—'), sub: String(recent?.phase4?.outcome || 'OPEN') },
                              { label: 'Last Entry', value: String(recent?.phase2?.entry_price || '—'), sub: recent?.name?.substring(0, 14) || '—' },
                            ] as Array<{ label: string; value: string; sub: string }>).map(stat => (
                              <div key={stat.label} style={{ padding: '14px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                                <div className="mono" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-4)', marginBottom: '8px' }}>{stat.label}</div>
                                <div className="tabular" style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1, marginBottom: '4px' }}>{stat.value}</div>
                                <div className="mono" style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-4)', opacity: 0.6 }}>{stat.sub}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* ACTION CARDS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      {/* Initialize Mission */}
                      <button
                        onClick={() => { ctxSetPrepStep(3); dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '' })); }}
                        className="group"
                        style={{ position: 'relative', padding: '20px 22px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 180ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                      >
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 0% 0%, rgba(65,105,225,0.04), transparent 55%)', opacity: 0, transition: 'opacity 200ms' }} className="group-hover:opacity-100" />
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                            </div>
                            <span className="mono" style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-4)' }}>NEW SESSION</span>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--text-1)', marginBottom: '6px' }}>Initialize Mission</h3>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.65 }}>Configure asset parameters and deploy a new tactical analysis session with full neural synthesis.</p>
                          </div>
                        </div>
                      </button>

                      {/* Operational Ledger */}
                      <button
                        onClick={() => ctxSetPrepStep(4)}
                        className="group"
                        style={{ position: 'relative', padding: '20px 22px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', textAlign: 'left', overflow: 'hidden', transition: 'border-color 180ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                      >
                        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 0% 0%, rgba(65,105,225,0.04), transparent 55%)', opacity: 0, transition: 'opacity 200ms' }} className="group-hover:opacity-100" />
                        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                            </div>
                            <span className="mono" style={{ fontSize: '7px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', border: '1px solid var(--border)', padding: '3px 8px', borderRadius: '4px', color: 'var(--text-4)' }}>
                              {(tradeLogs?.length ?? 0).toString()} RECORDS
                            </span>
                          </div>
                          <div>
                            <h3 style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.02em', textTransform: 'uppercase', color: 'var(--text-1)', marginBottom: '6px' }}>Operational Ledger</h3>
                            <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.65 }}>Encrypted mission archives. Review trade history, execution metrics, and performance analytics.</p>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* CONVICTION ARCHITECTURE */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                        <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--text-4)', flexShrink: 0 }}>Conviction Architecture</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        <span className="mono" style={{ fontSize: '7px', color: 'var(--text-4)', opacity: 0.4, letterSpacing: '0.08em' }}>Signal Threshold Model · PINAKA v2.1</span>
                      </div>
                      <div style={{ padding: '16px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '9px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: '180px', height: '100%', background: 'radial-gradient(ellipse at 100% 50%, rgba(65,105,225,0.05), transparent 70%)', pointerEvents: 'none' }} />
                        {([
                          { tier: 'VOID',       fill:  4, color: '#374151', label: 'No structural edge. Observation mode only.' },
                          { tier: 'STRUCTURAL', fill: 28, color: '#1e40af', label: 'Bias present. Insufficient confluence for deployment.' },
                          { tier: 'TACTICAL',   fill: 52, color: '#3B82F6', label: 'Structural alignment confirmed. Entry protocol armed.' },
                          { tier: 'DECISIVE',   fill: 74, color: '#60a5fa', label: 'Full confluence. High-probability setup active.' },
                          { tier: 'ABSOLUTE',   fill: 96, color: '#93c5fd', label: 'Maximum confluence. STS command deployed.' },
                        ] as Array<{ tier: string; fill: number; color: string; label: string }>).map(row => (
                          <div key={row.tier} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <span className="mono" style={{ fontSize: '7px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em', color: row.color, width: '76px', flexShrink: 0 }}>{row.tier}</span>
                            <div style={{ flex: 1, height: '2px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ width: `${row.fill}%`, height: '100%', background: row.color, borderRadius: '99px' }} />
                            </div>
                            <span className="mono" style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-4)', opacity: 0.55, width: '260px', flexShrink: 0 }}>{row.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* PROTOCOL PIPELINE */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                        <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--text-4)', flexShrink: 0 }}>Protocol Pipeline</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      </div>
                      <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                        {([
                          { n: '0', label: 'Vision', desc: 'Market context', color: '#F59E0B' },
                          { n: '1', label: 'Real Bias', desc: 'Pre-market edge', color: '#4169E1' },
                          { n: '2', label: 'HTF Structure', desc: 'Structural gate', color: '#8B5CF6' },
                          { n: '3', label: 'Market Pulse', desc: 'Auction & energy', color: '#10b981' },
                          { n: '4', label: 'Liquidity', desc: 'Wall strength', color: '#EF4444' },
                          { n: '5', label: 'Synthesis', desc: 'Neural fusion', color: '#4169E1' },
                          { n: '6', label: 'Command', desc: 'Strike protocol', color: '#60a5fa' },
                        ] as Array<{ n: string; label: string; desc: string; color: string }>).map((phase, i, arr) => (
                          <div key={phase.n} style={{ flex: 1, padding: '12px 10px', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: phase.color, boxShadow: `0 0 5px ${phase.color}`, flexShrink: 0 }} />
                              <span className="mono" style={{ fontSize: '7px', fontWeight: 700, color: phase.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>P{phase.n}</span>
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--text-1)', lineHeight: 1 }}>{phase.label}</span>
                            <span style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-4)', lineHeight: 1.3 }}>{phase.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TACTICAL FRAMEWORKS */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                        <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--text-4)', flexShrink: 0 }}>Tactical Frameworks</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                        {([
                          {
                            id: 'pinaka', name: 'PINAKA', version: '2.1',
                            desc: 'Multi-phase structural analysis engine. Real Bias → HTF Structure → Market Pulse → Liquidity Context → Neural synthesis.',
                            modules: ['Real Bias', 'HTF Structure', 'Market Pulse', 'Liquidity Context', 'STS Command'],
                            action: () => { setCurrentModel('pinaka'); ctxSetActiveView('terminal'); ctxSetPrepStep(2); }
                          },
                          {
                            id: 'trishul', name: 'TRISHUL', version: '1.0',
                            desc: 'Vision-enhanced neural synthesis with automated mission state sync and conviction scoring.',
                            modules: ['Vision AI', 'Auto-State', 'Neural Synthesis', 'Command Output'],
                            action: () => { ctxSetActiveView('trishul'); if (prepStep === 1) ctxSetPrepStep(2); }
                          },
                        ] as Array<{ id: string; name: string; version: string; desc: string; modules: string[]; action: () => void }>).map(m => (
                          <div
                            key={m.id}
                            onClick={m.action}
                            className="group"
                            style={{ padding: '18px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', transition: 'border-color 180ms' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                          >
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                                  <span style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '-0.01em', textTransform: 'uppercase', color: 'var(--text-1)' }}>{m.name}</span>
                                  <span className="mono" style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', opacity: 0.5 }}>v{m.version}</span>
                                </div>
                                <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: '340px' }}>{m.desc}</p>
                              </div>
                              <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', flexShrink: 0, marginLeft: '12px', transition: 'border-color 180ms, color 180ms' }} className="group-hover:border-[var(--accent)] group-hover:text-[var(--accent)]">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                              {m.modules.map(mod => (
                                <span key={mod} className="mono" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid var(--border)', padding: '3px 7px', borderRadius: '4px', color: 'var(--text-4)' }}>{mod}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* EXECUTION PRINCIPLES */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                        <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--text-4)', flexShrink: 0 }}>Execution Principles</span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {([
                          { n: '01', title: 'Structure First', body: 'Market auction structure is analyzed before any directional bias is established. No context, no conviction.' },
                          { n: '02', title: 'Confluence Over Frequency', body: 'Capital is deployed only at maximum structural confluence. Low-conviction setups are discarded by protocol.' },
                          { n: '03', title: 'Precision Execution', body: 'Entries defined by protocol levels. Exits defined before entry. Discipline is the only repeatable edge.' },
                        ] as Array<{ n: string; title: string; body: string }>).map(p => (
                          <div key={p.n} style={{ padding: '16px 18px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span className="mono" style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--accent)', opacity: 0.18, lineHeight: 1 }}>{p.n}</span>
                            <h4 style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--text-1)', margin: 0 }}>{p.title}</h4>
                            <p style={{ fontSize: '10px', fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.7, margin: 0 }}>{p.body}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* DOCTRINE FOOTER */}
                    <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
                      <p className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-4)', opacity: 0.45, lineHeight: 2 }}>
                        "Precision is the only objective. Discipline is the only tool." — Pinaka Doctrine
                      </p>
                    </div>

                    </div>{/* ── END CONTENT BOX ── */}

                  </div>
                </div>
              ) : prepStep === 3 ? (
                /* MISSION PREPARATION */
                <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-8 animate-in fade-in duration-500 overflow-auto bg-[var(--bg)]">
                  <div className="w-full max-w-[500px] space-y-6 lg:space-y-8">
                    <div className="flex justify-between items-start"><button onClick={() => ctxSetPrepStep(1)} className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#3B82F6] transition-all"><div className="w-6 h-6 rounded-full border border-white/[0.05] flex items-center justify-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg></div>Back to Dashboard</button></div>
                    <div className="text-center"><div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#3B82F6] mb-2">Trade Setup</div><h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase mb-2">Trade Preparation</h2><p className="text-xs opacity-50 font-medium max-w-sm mx-auto">Establish identifiers and select your trading logic for the next session.</p></div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="group"><label className="text-[9px] font-bold uppercase tracking-wider mb-1.5 block opacity-50">Asset Ticker</label><input type="text" value={sessionInput.assetName} onChange={e => dispatch(setSessionInput({ ...sessionInput, assetName: e.target.value }))} placeholder="E.G. NIFTY50" className="w-full bg-[#111622] border border-white/[0.05] rounded-lg py-2.5 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/50 transition-colors"/></div>
                        <div className="group"><label className="text-[9px] font-bold uppercase tracking-wider mb-1.5 block opacity-50">Trade Reference</label><input type="text" value={sessionInput.tradeName} onChange={e => dispatch(setSessionInput({ ...sessionInput, tradeName: e.target.value }))} placeholder="E.G. H1_SWEEP" className="w-full bg-[#111622] border border-white/[0.05] rounded-lg py-2.5 px-4 text-sm font-medium text-white placeholder-gray-700 outline-none focus:border-[#3B82F6]/50 transition-colors"/></div>
                      </div>
                      <MarketTypeSelector />
                      <div className="group"><label className="text-[9px] font-bold uppercase tracking-wider mb-3 block opacity-50">Trading Model Directive</label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {([{ id: 'pinaka', name: 'Pinaka', desc: 'High-Conviction Execution' }, { id: 'trishul', name: 'Trishul', desc: 'Neural Synthesis Engine' }] as Array<{id: string; name: string; desc: string}>).map(m => (
                            <button key={m.id} onClick={() => { dispatch(setSessionInput({ ...sessionInput, modelName: m.id })); setCurrentModel(m.id); }} className={`p-4 rounded-lg border text-left transition-all ${sessionInput.modelName === m.id ? 'border-[#3B82F6] bg-[#1E3A8A]/10' : 'border-white/[0.03] bg-[#111622] hover:border-[#3B82F6]/30'}`}>
                              <div className="flex items-center justify-between mb-2"><div className="text-sm font-bold uppercase tracking-tight">{m.name}</div><div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${sessionInput.modelName === m.id ? 'border-[#3B82F6]' : 'border-gray-600'}`}>{sessionInput.modelName === m.id && <div className="w-2 h-2 rounded-full bg-[#3B82F6]"></div>}</div></div>
                              <div className="text-[10px] font-medium opacity-40 uppercase tracking-wider">{m.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col lg:flex-row gap-3 mt-4">
                        <button onClick={() => ctxSetPrepStep(1)} className="order-2 lg:order-1 flex-1 px-6 py-3 rounded-lg border border-white/[0.05] bg-[#111622] text-xs font-bold uppercase tracking-wider hover:bg-[#1E293B] transition-colors">Cancel</button>
                        <button onClick={initializeMission} className="order-1 lg:order-2 flex-[2] bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-blue-500/10">Initialize Terminal</button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : prepStep === 4 ? (
                /* LEDGER SOURCE SELECTION */
                <div className="flex-1 flex flex-col items-center justify-center p-12 animate-in fade-in zoom-in-95 duration-500 overflow-auto bg-[var(--bg)]">
                  <div className="w-full max-w-[600px] space-y-12">
                    <div className="flex justify-between items-start mb-4"><button onClick={() => ctxSetPrepStep(1)} className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-[#4169E1] transition-all"><div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6"></polyline></svg></div>Back to Command</button></div>
                    <div className="text-center"><div className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#3B82F6] mb-2">Archive Gateway</div><h2 className="text-3xl lg:text-4xl font-black tracking-tight uppercase mb-2">Select Model</h2></div>
                    <div className="grid grid-cols-1 gap-4">
                      {([
                        { id: 'pinaka', name: 'Pinaka Framework', desc: 'View high-conviction trade logs', action: () => { setCurrentModel('pinaka'); ctxSetActiveView('terminal'); ctxSetPrepStep(2); } },
                        { id: 'trishul', name: 'Trishul Synthesis', desc: 'Access neural protocol archives', action: () => { setCurrentModel('trishul'); ctxSetActiveView('trishul'); ctxSetPrepStep(2); } },
                      ] as Array<{id: string; name: string; desc: string; action: () => void}>).map(m => (
                        <button key={m.id} onClick={m.action} className="p-5 rounded-lg border border-white/[0.03] bg-[#111622] flex items-center justify-between group hover:border-[#3B82F6]/30 transition-all text-left">
                          <div><div className="text-lg font-bold uppercase tracking-tight mb-0.5">{m.name}</div><div className="text-[10px] font-medium opacity-40 uppercase tracking-wider">{m.desc}</div></div>
                          <div className="w-8 h-8 rounded-full border border-white/[0.05] flex items-center justify-center group-hover:bg-[#3B82F6] group-hover:border-[#3B82F6] transition-all"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500 group-hover:text-white transition-all"><polyline points="9 18 15 12 9 6"></polyline></svg></div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (!activeSessionId && activeView !== 'trishul') ? (
                /* ── PINAKA MODULE ── */
                <div className="flex-1 overflow-y-auto fade-up" style={{ background: 'var(--bg)', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='100'%3E%3Cpath d='M56 100L56 66 28 66 0 50 0 16 28 0 56 16 56 50 28 66M28 100 28 66' stroke='white' stroke-opacity='0.045' stroke-width='0.6' fill='none'/%3E%3C/svg%3E")`, backgroundSize: '140px 250px', position: 'relative' }}>
                  {/* ── CORNER: TOP-RIGHT ── */}
                  <div style={{ position: 'absolute', top: 0, right: 0, width: '520px', height: '300px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <svg width="520" height="300" viewBox="0 0 520 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="370,-30 448,15 448,105 370,150 292,105 292,15" fill="none" stroke="#10b981" strokeOpacity="0.14" strokeWidth="1.5"/>
                      <polygon points="214,-30 292,15 292,105 214,150 136,105 136,15" fill="none" stroke="#10b981" strokeOpacity="0.06" strokeWidth="1"/>
                      <polygon points="292,105 370,150 370,240 292,285 214,240 214,150" fill="#10b981" fillOpacity="0.04" stroke="#10b981" strokeOpacity="0.18" strokeWidth="1.5"/>
                      <polygon points="448,105 526,150 526,240 448,285 370,240 370,150" fill="none" stroke="#10b981" strokeOpacity="0.08" strokeWidth="1"/>
                      <polygon points="526,150 604,195 604,285 526,330 448,285 448,195" fill="none" stroke="#10b981" strokeOpacity="0.04" strokeWidth="0.8"/>
                    </svg>
                  </div>
                  {/* ── CORNER: BOTTOM-LEFT ── */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, width: '300px', height: '260px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <svg width="300" height="260" viewBox="0 0 300 260" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <polygon points="50,130 111,165 111,235 50,270 -11,235 -11,165" fill="#10b981" fillOpacity="0.04" stroke="#10b981" strokeOpacity="0.15" strokeWidth="1.5"/>
                      <polygon points="172,130 233,165 233,235 172,270 111,235 111,165" fill="none" stroke="#10b981" strokeOpacity="0.08" strokeWidth="1"/>
                      <polygon points="50,260 111,295 111,365 50,400 -11,365 -11,295" fill="none" stroke="#10b981" strokeOpacity="0.06" strokeWidth="0.8"/>
                    </svg>
                  </div>
                  <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>

                    {/* PAGE HEADER */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--border)', gap: '16px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--accent)' }}>Pinaka · v2.1</span>
                          <div style={{ width: '1px', height: '10px', background: 'var(--border)' }} />
                          <span className="mono" style={{ fontSize: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-4)' }}>Multi-Phase Structural Analysis Framework</span>
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase', color: 'var(--text-1)', margin: 0 }}>Mission Ledger</h1>
                        <p style={{ fontSize: '11px', color: 'var(--text-3)', fontWeight: 500, marginTop: '5px' }}>Operational archives · Execution analytics · Protocol performance</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button onClick={downloadCSV} disabled={isDownloading}
                          style={{ height: '34px', padding: '0 14px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: isDownloading ? 0.5 : 1 }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: 'var(--text-3)' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                          <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-2)' }}>Export CSV</span>
                        </button>
                        <button onClick={() => { dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '' })); ctxSetPrepStep(3); }}
                          style={{ height: '34px', padding: '0 16px', background: 'var(--accent)', border: '1px solid var(--accent)', borderRadius: '7px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#fff' }}>New Mission</span>
                        </button>
                      </div>
                    </div>

                    {/* ── CONTENT BOX ── */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: '12px', background: 'rgba(255,255,255,0.013)', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* MARKET REGIME ARCHETYPES */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                      {([
                        {
                          label: 'HTF Trending', code: 'REGIME-A', color: '#10b981',
                          bars: [30, 45, 55, 68, 75, 84, 90],
                          desc: 'Clear directional bias. Auction structure aligned with macro flow. Liquidity pools forming above range.',
                        },
                        {
                          label: 'Range Contraction', code: 'REGIME-B', color: '#4169E1',
                          bars: [52, 48, 54, 50, 47, 53, 49],
                          desc: 'Balanced auction. No dominant order flow. Consolidation prior to next directional expansion.',
                        },
                        {
                          label: 'Liquidity Hunt', code: 'REGIME-C', color: '#F59E0B',
                          bars: [55, 30, 72, 28, 80, 22, 88],
                          desc: 'BSL/SSL clusters targeted. Inducement active. Smart money accumulation or distribution phase.',
                        },
                        {
                          label: 'Late Distribution', code: 'REGIME-D', color: '#EF4444',
                          bars: [88, 74, 62, 48, 36, 24, 14],
                          desc: 'Late-cycle institutional offloading. High-risk environment. Unfavourable reward-to-risk profile.',
                        },
                      ] as Array<{ label: string; code: string; color: string; bars: number[]; desc: string }>).map(regime => (
                        <div key={regime.code} style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span className="mono" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: regime.color, display: 'block', marginBottom: '3px' }}>{regime.code}</span>
                              <span style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', color: 'var(--text-1)' }}>{regime.label}</span>
                            </div>
                            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: regime.color, boxShadow: `0 0 7px ${regime.color}`, flexShrink: 0, marginTop: '2px' }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '24px' }}>
                            {regime.bars.map((h, i) => (
                              <div key={i} style={{ flex: 1, height: `${h}%`, background: regime.color, opacity: 0.2 + (i / regime.bars.length) * 0.5, borderRadius: '1px 1px 0 0' }} />
                            ))}
                          </div>
                          <p style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.65, margin: 0 }}>{regime.desc}</p>
                        </div>
                      ))}
                    </div>

                    {/* ANALYTICS */}
                    {!analyticsData ? (
                      <div style={{ padding: '16px', textAlign: 'center' }}>
                        <span className="mono" style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: 'var(--accent)', opacity: 0.6 }}>Synchronizing analytics...</span>
                      </div>
                    ) : (
                      <>
                        {/* STAT STRIP */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                          {([
                            { label: 'Net P&L', value: `${(analyticsData.total_pnl || 0) >= 0 ? '+' : ''}${analyticsData.total_pnl || '0.00'}`, color: (analyticsData.total_pnl || 0) >= 0 ? 'var(--green)' : 'var(--red)' },
                            { label: 'Win Rate', value: `${analyticsData.win_rate || 0}%`, color: (analyticsData.win_rate || 0) >= 50 ? 'var(--green)' : 'var(--red)' },
                            { label: 'Profit Factor', value: String(analyticsData.profit_factor || '—'), color: 'var(--text-1)' },
                            { label: 'Expectancy', value: String(analyticsData.expectancy || '—'), color: (analyticsData.expectancy || 0) >= 0 ? 'var(--accent)' : 'var(--red)' },
                            { label: 'Total Ops', value: String(analyticsData.total || 0), color: 'var(--text-1)' },
                            { label: 'Avg Winner', value: `+${analyticsData.avg_win || '0.00'}`, color: 'var(--green)' },
                          ] as Array<{ label: string; value: string; color: string }>).map(s => (
                            <div key={s.label} style={{ padding: '12px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                              <div className="mono" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--text-4)', marginBottom: '7px' }}>{s.label}</div>
                              <div className="tabular" style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.03em', color: s.color, lineHeight: 1 }}>{s.value}</div>
                            </div>
                          ))}
                        </div>

                        {/* WEAPON PERFORMANCE BARS */}
                        {Object.keys(analyticsData.by_weapon || {}).length > 0 && (
                          <div style={{ padding: '16px 18px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                              <span className="mono" style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--text-4)', flexShrink: 0 }}>Weapon Efficiency</span>
                              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                              <span className="mono" style={{ fontSize: '7px', color: 'var(--text-4)', opacity: 0.5 }}>Win Rate / Total Engagements</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                              {Object.entries(analyticsData.by_weapon || {}).map(([weapon, data]: [string, any]) => {
                                const pct = data.total ? Math.round((data.wins / data.total) * 100) : 0;
                                const barColor = pct >= 60 ? 'var(--green)' : pct >= 40 ? 'var(--accent)' : 'var(--red)';
                                return (
                                  <div key={weapon}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-2)' }}>{weapon}</span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="mono tabular" style={{ fontSize: '10px', fontWeight: 900, color: barColor }}>{pct}%</span>
                                        <span className="mono" style={{ fontSize: '8px', color: 'var(--text-4)', opacity: 0.7 }}>{data.wins}W · {data.losses}L · {data.total}T</span>
                                      </div>
                                    </div>
                                    <div style={{ height: '3px', background: 'var(--surface-3)', borderRadius: '99px', overflow: 'hidden' }}>
                                      <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: '99px', transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)' }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {/* FRAMEWORK OVERVIEW — SLIDER */}
                    {(() => {
                      const phases = [
                        { n: 'P0', idx: 0, label: 'Vision',    color: '#F59E0B', tag: 'Context Analysis',   desc: 'Establishes macro context and session narrative before phase analysis begins. Sets the directional intent for all downstream phases.' },
                        { n: 'P1', idx: 1, label: 'Real Bias',         color: '#4169E1', tag: 'Pre-Market Edge',      desc: 'Reads pre-market facts — gap, Gift Nifty, previous day profile, weekly context — to establish today\'s directional predisposition before the session opens.' },
                        { n: 'P2', idx: 2, label: 'HTF Structure',     color: '#8B5CF6', tag: 'Structural Gate',     desc: 'Analyses 1H structural continuity, leg maturity, rotation depth, compression, destination and distraction to grant or deny permission to continue.' },
                        { n: 'P3', idx: 3, label: 'Market Pulse',      color: '#10b981', tag: 'Auction & Energy',    desc: 'Reads 15M auction state (Balance / Relocation / Transitional) and measures price behaviour energy in two phases: approach and interaction.' },
                        { n: 'P4', idx: 4, label: 'Liquidity Context', color: '#EF4444', tag: 'Wall Classification',  desc: 'Classifies every meaningful wall by Tier (1/2/3) and Maturity (Fresh/Developing/Mature) to determine Interception or Strike territory.' },
                        { n: 'P5', idx: 5, label: 'Synthesis', color: '#60a5fa', tag: 'Neural Fusion',      desc: 'Neural fusion of all prior phases into a single command directive and STS matrix. The terminal output of the PINAKA protocol.' },
                      ];
                      const CARD_W = 272;
                      const CARD_GAP = 10;
                      const slide = (dir: number) => {
                        const next = Math.max(0, Math.min(phases.length - 1, frameworkIdx + dir));
                        setFrameworkIdx(next);
                        frameworkRef.current?.scrollTo({ left: next * (CARD_W + CARD_GAP), behavior: 'smooth' });
                      };
                      return (
                        <div>
                          {/* header */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                            <span className="mono" style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--text-4)', flexShrink: 0 }}>Framework Architecture</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                            <span className="mono" style={{ fontSize: '7px', color: 'var(--text-4)', opacity: 0.45 }}>{frameworkIdx + 1} / {phases.length}</span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {([[-1, '←'], [1, '→']] as [number, string][]).map(([dir, label]) => {
                                const disabled = dir === -1 ? frameworkIdx === 0 : frameworkIdx === phases.length - 1;
                                return (
                                  <button key={label} onClick={() => slide(dir)} disabled={disabled}
                                    style={{ width: '26px', height: '26px', border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: '5px', cursor: disabled ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.25 : 1, transition: 'border-color 150ms, opacity 150ms', fontFamily: 'inherit' }}
                                    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; }}
                                  >
                                    <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)', lineHeight: 1 }}>{label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* scroll track */}
                          <div ref={frameworkRef} style={{ display: 'flex', gap: `${CARD_GAP}px`, overflowX: 'auto', scrollSnapType: 'x mandatory', scrollBehavior: 'smooth', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
                            {phases.map((p) => {
                              const isActive = frameworkIdx === p.idx;
                              return (
                                <div key={p.n}
                                  onClick={() => { setFrameworkIdx(p.idx); frameworkRef.current?.scrollTo({ left: p.idx * (CARD_W + CARD_GAP), behavior: 'smooth' }); }}
                                  style={{
                                    flexShrink: 0,
                                    width: `${CARD_W}px`,
                                    scrollSnapAlign: 'start',
                                    borderRadius: '8px',
                                    border: `1px solid ${isActive ? p.color : 'var(--border)'}`,
                                    borderTop: `2px solid ${p.color}`,
                                    background: isActive ? `color-mix(in srgb, ${p.color} 5%, var(--surface))` : 'var(--surface)',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    transition: 'border-color 300ms, background 300ms, box-shadow 300ms',
                                    boxShadow: isActive ? `0 0 24px ${p.color}20, 0 4px 20px rgba(0,0,0,0.4)` : '0 2px 8px rgba(0,0,0,0.2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <div style={{ padding: '20px 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', overflow: 'hidden' }}>
                                    {/* large background number */}
                                    <span style={{ position: 'absolute', right: '14px', top: '6px', fontSize: '72px', fontWeight: 950, color: p.color, opacity: 0.055, lineHeight: 1, letterSpacing: '-0.06em', pointerEvents: 'none', userSelect: 'none' }}>{String(p.idx).padStart(2, '0')}</span>
                                    {/* top row */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span className="mono" style={{ fontSize: '7px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: p.color, padding: '3px 8px', border: `1px solid ${p.color}40`, borderRadius: '3px', background: `${p.color}0d` }}>{p.n}</span>
                                      <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
                                    </div>
                                    {/* name + desc */}
                                    <div>
                                      <div style={{ fontSize: '22px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-0.03em', color: 'var(--text-1)', lineHeight: 1, marginBottom: '8px' }}>{p.label}</div>
                                      <p style={{ fontSize: '9.5px', fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.7, margin: 0 }}>{p.desc}</p>
                                    </div>
                                  </div>
                                  {/* footer strip */}
                                  <div style={{ borderTop: `1px solid ${isActive ? p.color + '30' : 'var(--border)'}`, padding: '9px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span className="mono" style={{ fontSize: '7px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: isActive ? p.color : 'var(--text-4)', opacity: isActive ? 0.8 : 0.45 }}>{p.tag}</span>
                                    <div style={{ width: '16px', height: '1px', background: isActive ? p.color : 'var(--border)', opacity: isActive ? 0.6 : 1 }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* dot indicators */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '12px' }}>
                            {phases.map((p) => (
                              <button key={p.n} onClick={() => { setFrameworkIdx(p.idx); frameworkRef.current?.scrollTo({ left: p.idx * (CARD_W + CARD_GAP), behavior: 'smooth' }); }}
                                style={{ width: frameworkIdx === p.idx ? '22px' : '5px', height: '4px', borderRadius: '2px', background: frameworkIdx === p.idx ? p.color : 'var(--border)', border: 'none', cursor: 'pointer', padding: 0, transition: 'all 300ms ease', boxShadow: frameworkIdx === p.idx ? `0 0 8px ${p.color}60` : 'none' }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* LEDGER SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {/* LEDGER CONTROLS */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="mono" style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: 'var(--text-4)' }}>Mission Archive</span>
                          <span className="mono" style={{ fontSize: '8px', fontWeight: 900, padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-4)' }}>{tradeLogs.length}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <div style={{ position: 'relative' }}>
                            <svg style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)', pointerEvents: 'none' }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input type="text" placeholder="Search missions..." value={logSearchTerm} onChange={e => dispatch(setLogSearchTerm(e.target.value))}
                              style={{ height: '30px', paddingLeft: '28px', paddingRight: '10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '11px', color: 'var(--text-1)', outline: 'none', width: '180px', fontFamily: 'inherit' }} />
                          </div>
                          <select value={logFilterOutcome} onChange={e => dispatch(setLogFilterOutcome(e.target.value))}
                            style={{ height: '30px', padding: '0 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)', outline: 'none', cursor: 'pointer' }}>
                            <option value="ALL">All Outcomes</option>
                            <option value="WIN">Win</option>
                            <option value="LOSS">Loss</option>
                            <option value="BREAKEVEN">Breakeven</option>
                          </select>
                        </div>
                      </div>

                      {/* TABLE */}
                      <div style={{ borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '820px' }}>
                            <thead>
                              <tr style={{ background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
                                {([
                                  { label: '#',       key: null,       align: 'left',   w: '44px'  },
                                  { label: 'Mission', key: 'mission',  align: 'left',   w: undefined },
                                  { label: 'Asset',   key: 'asset',    align: 'left',   w: '80px'  },
                                  { label: 'Weapon',  key: 'weapon',   align: 'left',   w: '160px' },
                                  { label: 'Entry',   key: 'entry',    align: 'right',  w: '90px'  },
                                  { label: 'Stop',    key: 'stop',     align: 'right',  w: '90px'  },
                                  { label: 'P & L',  key: 'pl',       align: 'right',  w: '90px'  },
                                  { label: 'Outcome', key: 'outcome',  align: 'center', w: '88px'  },
                                  { label: 'Date',    key: 'date',     align: 'left',   w: '100px' },
                                  { label: '',        key: null,       align: 'right',  w: '108px' },
                                ] as Array<{ label: string; key: string | null; align: string; w?: string }>).map((col, ci) => {
                                  const isActive = col.key && sortCol === col.key;
                                  const isLast = ci === 9;
                                  return (
                                    <th key={ci}
                                      onClick={() => {
                                        if (!col.key) return;
                                        if (sortCol === col.key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
                                        else { setSortCol(col.key); setSortDir('desc'); }
                                      }}
                                      style={{
                                        padding: '9px 12px',
                                        textAlign: col.align as 'left' | 'right' | 'center',
                                        width: col.w,
                                        fontFamily: 'JetBrains Mono, monospace',
                                        fontSize: '7.5px',
                                        fontWeight: isActive ? 800 : 600,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.12em',
                                        color: isActive ? 'var(--text-1)' : 'var(--text-4)',
                                        whiteSpace: 'nowrap',
                                        borderRight: !isLast ? '1px solid var(--border)' : 'none',
                                        cursor: col.key ? 'pointer' : 'default',
                                        userSelect: 'none',
                                        transition: 'color 120ms',
                                      }}
                                      onMouseEnter={e => { if (col.key && !isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-2)'; }}
                                      onMouseLeave={e => { if (col.key && !isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-4)'; }}
                                    >
                                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                        {col.label}
                                        {col.key && (
                                          <span style={{ opacity: isActive ? 1 : 0.3, fontSize: '8px', lineHeight: 1 }}>
                                            {isActive ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                                          </span>
                                        )}
                                      </span>
                                    </th>
                                  );
                                })}
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const filtered = [...tradeLogs].filter(log => {
                                  const id = String(log.id);
                                  const q = logSearchTerm.toLowerCase();
                                  const matches = !q || (log.name || '').toLowerCase().includes(q) || (log.phase1?.asset_ticker || '').toLowerCase().includes(q) || id.includes(q);
                                  return matches && (logFilterOutcome === 'ALL' || log.phase4?.outcome === logFilterOutcome);
                                }).sort((a, b) => {
                                  let va: string | number = 0;
                                  let vb: string | number = 0;
                                  switch (sortCol) {
                                    case 'mission': va = (a.name || '').toLowerCase(); vb = (b.name || '').toLowerCase(); break;
                                    case 'asset':   va = (a.phase1?.asset_ticker || '').toLowerCase(); vb = (b.phase1?.asset_ticker || '').toLowerCase(); break;
                                    case 'weapon':  va = (a.weapon || '').toLowerCase(); vb = (b.weapon || '').toLowerCase(); break;
                                    case 'entry':   va = parseFloat(String(a.phase2?.entry_price || 0)); vb = parseFloat(String(b.phase2?.entry_price || 0)); break;
                                    case 'stop':    va = parseFloat(String(a.phase2?.stop_loss || 0));   vb = parseFloat(String(b.phase2?.stop_loss || 0));   break;
                                    case 'pl':      va = parseFloat(String(a.phase4?.pl || 0));           vb = parseFloat(String(b.phase4?.pl || 0));           break;
                                    case 'outcome': va = (a.phase4?.outcome || 'OPEN').toLowerCase();     vb = (b.phase4?.outcome || 'OPEN').toLowerCase();     break;
                                    default:        va = new Date(a.timestamp).getTime();                 vb = new Date(b.timestamp).getTime();
                                  }
                                  if (va < vb) return sortDir === 'asc' ? -1 : 1;
                                  if (va > vb) return sortDir === 'asc' ? 1 : -1;
                                  return 0;
                                });

                                if (filtered.length === 0) return (
                                  <tr><td colSpan={10} style={{ padding: '52px', textAlign: 'center' }}>
                                    <span className="mono" style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-4)', opacity: 0.4 }}>No matching mission records</span>
                                  </td></tr>
                                );

                                return filtered.map((log, idx) => {
                                  const outcome = log.phase4?.outcome;
                                  const pl = parseFloat(String(log.phase4?.pl || 0));
                                  const plColor = pl > 0 ? 'var(--green)' : pl < 0 ? 'var(--red)' : 'var(--text-4)';
                                  const outcomeColor = outcome === 'WIN' ? 'var(--green)' : outcome === 'LOSS' ? 'var(--red)' : outcome === 'BE' ? 'var(--amber)' : 'var(--text-4)';
                                  const outcomeBg = outcome === 'WIN' ? 'var(--green-bg)' : outcome === 'LOSS' ? 'var(--red-bg)' : outcome === 'BE' ? 'var(--amber-bg)' : 'var(--surface-3)';
                                  const tdBorder = { borderRight: '1px solid var(--border)' };
                                  const tdBase = { padding: '9px 12px' };

                                  return (
                                    <tr key={log.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 60ms' }}
                                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--accent-bg)'; }}
                                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>

                                      {/* # */}
                                      <td style={{ ...tdBase, ...tdBorder }}>
                                        <span className="mono tabular" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-4)' }}>{String(idx + 1).padStart(2, '0')}</span>
                                      </td>

                                      {/* MISSION */}
                                      <td style={{ ...tdBase, ...tdBorder, maxWidth: '180px' }}>
                                        <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.01em', color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.name || 'UNNAMED_OP'}</div>
                                        <div className="mono" style={{ fontSize: '8.5px', color: 'var(--text-4)', marginTop: '1px' }}>{log.username || '—'}</div>
                                      </td>

                                      {/* ASSET */}
                                      <td style={{ ...tdBase, ...tdBorder }}>
                                        <span className="mono" style={{ fontSize: '9.5px', fontWeight: 800, padding: '3px 7px', borderRadius: '4px', background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', letterSpacing: '0.06em', display: 'inline-block' }}>
                                          {log.phase1?.asset_ticker || '—'}
                                        </span>
                                      </td>

                                      {/* WEAPON */}
                                      <td style={{ ...tdBase, ...tdBorder, maxWidth: '160px' }}>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                          {log.weapon || '—'}
                                        </span>
                                      </td>

                                      {/* ENTRY */}
                                      <td style={{ ...tdBase, ...tdBorder, textAlign: 'right' }}>
                                        <span className="mono tabular" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-1)' }}>
                                          {log.phase2?.entry_price ? String(log.phase2.entry_price) : '—'}
                                        </span>
                                      </td>

                                      {/* STOP */}
                                      <td style={{ ...tdBase, ...tdBorder, textAlign: 'right' }}>
                                        <span className="mono tabular" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--red)' }}>
                                          {log.phase2?.stop_loss ? String(log.phase2.stop_loss) : '—'}
                                        </span>
                                      </td>

                                      {/* P&L */}
                                      <td style={{ ...tdBase, ...tdBorder, textAlign: 'right' }}>
                                        <span className="mono tabular" style={{ fontSize: '11px', fontWeight: 800, color: plColor }}>
                                          {pl !== 0 ? `${pl > 0 ? '+' : ''}${pl.toFixed(2)}` : '—'}
                                        </span>
                                      </td>

                                      {/* OUTCOME */}
                                      <td style={{ ...tdBase, ...tdBorder, textAlign: 'center' }}>
                                        {outcome ? (
                                          <span className="mono" style={{ fontSize: '7.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '3px 8px', borderRadius: '4px', background: outcomeBg, color: outcomeColor, border: `1px solid ${outcomeColor}`, display: 'inline-block', opacity: 0.9 }}>
                                            {outcome}
                                          </span>
                                        ) : (
                                          <span className="mono" style={{ fontSize: '7.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', opacity: 0.4 }}>OPEN</span>
                                        )}
                                      </td>

                                      {/* DATE */}
                                      <td style={{ ...tdBase, ...tdBorder }}>
                                        <span className="mono" style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)' }}>
                                          {new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase()}
                                        </span>
                                      </td>

                                      {/* ACTIONS */}
                                      <td style={{ ...tdBase }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                                          <button
                                            onClick={() => { dispatch({ type: 'logs/setActiveEditLog', payload: log }); dispatch({ type: 'logs/setEditFormData', payload: { ...log.phase2, ...log.phase3, ...log.phase4, trade_name: log.name } }); ctxSetIsLoggerOpen(true); }}
                                            title="View Details"
                                            style={{ width: '26px', height: '26px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', transition: 'all 100ms' }}
                                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--accent)'; el.style.color = 'var(--accent)'; }}
                                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-3)'; }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                          </button>
                                          {log.session_state && (
                                            <button onClick={() => resumeSession(log)}
                                              style={{ height: '26px', padding: '0 8px', borderRadius: '5px', border: '1px solid var(--accent)', background: 'var(--accent-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', transition: 'all 100ms' }}
                                              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--accent)'; (el.querySelector('span') as HTMLElement).style.color = '#fff'; }}
                                              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'var(--accent-bg)'; (el.querySelector('span') as HTMLElement).style.color = 'var(--accent)'; }}>
                                              <span className="mono" style={{ fontSize: '7.5px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent)', transition: 'color 100ms' }}>Resume</span>
                                            </button>
                                          )}
                                          <button
                                            onClick={() => { if (window.confirm('Purge this record?')) deleteTradeLog(log.id); }}
                                            title="Delete"
                                            style={{ width: '26px', height: '26px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-3)', transition: 'all 100ms' }}
                                            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--red)'; el.style.color = 'var(--red)'; el.style.background = 'var(--red-bg)'; }}
                                            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-3)'; el.style.background = 'var(--surface-2)'; }}>
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    </div>{/* ── END CONTENT BOX ── */}

                  </div>
                </div>
              ) : activeView === 'trishul' ? (
                /* TRISHUL VIEW */
                <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-700" style={{ paddingBottom: '100px' }}>
                  <div style={{ position: 'relative', width: '320px', height: '320px', marginBottom: '40px' }}><img src="/trishul_logo.png" alt="Trishul Protocol" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,229,255,0.2))' }}/></div>
                  <h2 style={{ fontSize: '32px', fontWeight: 900, letterSpacing: '-0.05em', color: 'var(--text-1)', textTransform: 'uppercase', textAlign: 'center', marginBottom: '12px' }}>Trishul Protocol</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}><div style={{ width: '40px', height: '1px', background: 'var(--border)' }}></div><span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--accent)' }}>Awaiting Activation</span><div style={{ width: '40px', height: '1px', background: 'var(--border)' }}></div></div>
                  <p style={{ fontSize: '12px', color: 'var(--text-3)', maxWidth: '400px', textAlign: 'center', lineHeight: 1.6, fontWeight: 500 }}>The Trishul Multimodal Execution Layer is currently undergoing synthesis.</p>
                </div>
              ) : (
                /* PINAKA EXECUTION VIEW */
                <div className="phase-stack">

                  {/* P0: VISION */}
                  <div className="phase-card" data-phase="0" data-active={highestStep === 0 ? 'true' : undefined}>
                    <div className="phase-card-header">
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P0</span>
                      <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>VISION</span>
                      <div style={{ flex: 1 }} />
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Chart Context Analysis</span>
                    </div>
                    <div className="phase-card-body"><Phase0Vision /></div>
                  </div>

                  {/* P1: BIAS */}
                  {highestStep >= 1 && (
                    <div className="phase-card" data-phase="1" data-active={highestStep === 1 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P1</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>REAL BIAS</span>
                        <div style={{ flex: 1 }} />
                        {stepTimestamps.realBias
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.realBias}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Pre-Market Directional Predisposition</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase1Bias /></div>
                    </div>
                  )}

                  {/* P2: AUCTION */}
                  {highestStep >= 2 && (
                    <div className="phase-card" data-phase="2" data-active={highestStep === 2 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P2</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>HTF STRUCTURE</span>
                        <div style={{ flex: 1 }} />
                        {stepTimestamps.htfStructure
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.htfStructure}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Higher Timeframe Structural Analysis</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase2Auction /></div>
                    </div>
                  )}

                  {/* P3: LIQUIDITY */}
                  {highestStep >= 3 && (
                    <div className="phase-card" data-phase="3" data-active={highestStep === 3 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P3</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MARKET PULSE</span>
                        <div style={{ flex: 1 }} />
                        {stepTimestamps.marketPulse
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.marketPulse}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Auction State & Price Behaviour</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase3Liquidity /></div>
                    </div>
                  )}

                  {/* P4: BEHAVIOUR */}
                  {highestStep >= 4 && (
                    <div className="phase-card" data-phase="4" data-active={highestStep === 4 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P4</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>LIQUIDITY CONTEXT</span>
                        <div style={{ flex: 1 }} />
                        {stepTimestamps.liquidityContext
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.liquidityContext}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Wall Classification & Strength</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase4Behaviour /></div>
                    </div>
                  )}

                  {/* P5: SYNTHESIS */}
                  {highestStep >= 5 && (
                    <div className="phase-card" data-phase="5" data-active={highestStep === 5 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P5</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>SYNTHESIS</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Neural Fusion Output</span>
                      </div>
                      <div className="phase-card-body"><Phase5Synthesis /></div>
                    </div>
                  )}

                  {/* P6: COMMAND */}
                  {highestStep >= 5 && (
                    <div className="phase-card" data-phase="6" data-active={highestStep === 5 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P6</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>COMMAND</span>
                        <div style={{ flex: 1 }} />
                        {stepTimestamps.command
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.command}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Doctrine Selection & STS</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase6Command /></div>
                    </div>
                  )}

                  {/* P7: WEAPON INTEL */}
                  {highestStep >= 6 && (
                    <div className="phase-card" data-phase="7" data-active={highestStep === 6 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P7</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>WEAPON INTEL</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Maya Weapon Recommendation</span>
                      </div>
                      <div className="phase-card-body"><Phase8WeaponIntel /></div>
                    </div>
                  )}

                  {/* P8: WEAPON ARMORY */}
                  {highestStep >= 6 && (
                    <div className="phase-card" data-phase="8" data-active={highestStep === 6 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P8</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>WEAPON ARMORY</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Entry Model Selection</span>
                      </div>
                      <div className="phase-card-body"><Phase9WeaponArmory /></div>
                    </div>
                  )}

                  {/* P10: MISSION CONTROL */}
                  {highestStep >= 7 && (
                    <div className="phase-card" data-phase="9" data-active={highestStep === 7 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P10</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MISSION CONTROL</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Operational Debrief & Audit</span>
                      </div>
                      <div className="phase-card-body"><Phase10MissionControl /></div>
                    </div>
                  )}
                  {highestStep >= 9 && (
                    <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
                      {(finalCommand || netraOutput?.cmd) === 'NO ENGAGEMENT' && <NoEngagementProtocol />}
                      {(finalCommand || netraOutput?.cmd) === 'STRIKE' && <StrikeProtocol />}
                      {(finalCommand || netraOutput?.cmd) === 'INTERCEPTION' && <InterceptionProtocol />}
                    </div>
                  )}
                  <footer className="desktop-only" style={{ width: '100%', background: 'transparent', borderTop: '1px solid var(--border)', padding: '40px 0 60px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5, marginTop: '80px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
                      {[{ n: 'TradingView', u: 'https://in.tradingview.com/chart' }, { n: 'NSE Option Chain', u: 'https://www.nseindia.com/option-chain' }, { n: 'Market News', u: 'https://twitter.com/deitaone' }, { n: 'Economic Calendar', u: 'https://www.investing.com/economic-calendar/' }].map(link => (
                        <a key={link.n} href={link.u} target="_blank" rel="noreferrer" style={{ fontSize: '10px', fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }} className="hover:text-[var(--accent)] transition-all flex items-center gap-1.5">{link.n}<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg></a>
                      ))}
                    </div>
                    <div style={{ fontSize: '9px', fontWeight: 800, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Institutional Terminal v3.1 — <span style={{ color: 'var(--accent)' }}>Synced & Secure</span></div>
                  </footer>
                </div>
              )}
            </main>
          </div>
        </div>

        {/* RIGHT SIDEBAR — Maya Chat Panel */}
        <aside className={`sidebar-transition flex flex-col z-[150] ${isAiPaneOpen ? 'w-[440px] max-w-[100vw] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`} style={{ background: darkMode ? '#12141D' : '#F0F2FF', borderLeft: isAiPaneOpen ? '2px solid var(--accent)' : 'none', boxShadow: isAiPaneOpen ? '-40px 0 80px rgba(0,0,0,0.5)' : 'none', position: 'relative', height: '100%', transition: 'all 500ms cubic-bezier(0.23,1,0.32,1)' }}>
          <div style={{ minWidth: '440px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <MayaChatPanel />
          </div>
        </aside>

        {/* MOBILE SIDEBAR BACKDROP */}
        {(isLoggerOpen || isAiPaneOpen) && (
          <div
            className="md:hidden fixed inset-0 bg-black/60"
            style={{ zIndex: 140 }}
            onClick={() => { ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); }}
          />
        )}
      </div>

      {/* MOBILE MENU OVERLAY */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[110] p-8 flex flex-col items-center justify-center animate-in slide-in-from-top duration-300" style={{ background: 'var(--bg)' }}>
          <button onClick={() => dispatch({ type: 'ui/setMobileMenuOpen', payload: false })} className="absolute top-8 right-8 p-4 text-[var(--text-1)]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
          <div className="flex flex-col gap-10 text-center">
            {([
              { label: 'Home', active: prepStep === 1 && activeView !== 'profile', action: () => { ctxSetPrepStep(1); ctxSetActiveView('terminal'); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Pinaka', active: activeView === 'terminal' && (activeSessionId != null || prepStep === 2), action: () => { ctxSetActiveView('terminal'); ctxSetPrepStep(2); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Trishul', active: activeView === 'trishul', action: () => { ctxSetActiveView('trishul'); ctxSetPrepStep(2); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
            ] as Array<{ label: string; active: boolean; action: () => void }>).map((nav) => (
              <button key={nav.label} onClick={() => { nav.action(); dispatch({ type: 'ui/setMobileMenuOpen', payload: false }); }} className="text-3xl font-black uppercase tracking-widest transition-all" style={{ color: nav.active ? 'var(--accent)' : 'var(--text-1)' }}>{nav.label}</button>
            ))}
          </div>
        </div>
      )}

      <GlobalOverlay />
      <NetraTree open={isTreeOpen} onClose={() => setIsTreeOpen(false)} />
    </div>
  );
}
