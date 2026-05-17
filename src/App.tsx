/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Navigate } from 'react-router-dom';

import { useNetra } from './context/NetraContext';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { setSelectedModel, setModelConfig } from './store/slices/modelSlice';
import { setIncludeData, setIncludeDoctrine, setChatInput } from './store/slices/chatSlice';
import { setTradeName, setLogSearchTerm, setLogFilterOutcome, setLogSortOrder } from './store/slices/logsSlice';
import { setSessionInput } from './store/slices/sessionSlice';
import { setPrepStep, setActiveView, setIsLoggerOpen } from './store/slices/uiSlice';
import { setRulesAcknowledged } from './store/slices/analysisSlice';
import Login from './components/Auth/Login';
import GlobalOverlay from './components/Layout/GlobalOverlay';
import MayaChatPanel from './components/Layout/MayaChatPanel';
import Phase0Vision from './components/Terminal/Phase0Vision';
import Phase1Bias from './components/Terminal/Phase1Bias';
import Phase2Auction from './components/Terminal/Phase2Auction';
import Phase3MarketPulse from './components/Terminal/Phase3MarketPulse';
import Phase5Synthesis from './components/Terminal/Phase5Synthesis';
import Phase6Command from './components/Terminal/Phase6Command';
import Phase8WeaponIntel from './components/Terminal/Phase8WeaponIntel';
import Phase9WeaponArmory from './components/Terminal/Phase9WeaponArmory';
import Phase10MissionControl from './components/Terminal/Phase10MissionControl';
import Phase11MayaAudit from './components/Terminal/Phase11MayaAudit';

import Phase9OperationalIntelligence from './components/Terminal/Phase9OperationalIntelligence';
import MarketTypeSelector from './components/Terminal/MarketTypeSelector';
import ProfilePage from './components/Terminal/ProfilePage';
import AboutPage from './components/About/AboutPage';
import ForkButton from './components/UI/ForkButton';
import ModelPage from './components/ModelPage/ModelPage';
import { MODEL_DATA } from './utils/modelData';

// ─── Protocol sub-views ───────────────────────────────────────────────────────

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffffff', opacity: 0.7 }}>{label}</span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 px-2 rounded-none bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[#ffffff] font-mono focus:border-[#4169E1] outline-none"
      />
    </div>
  );
}

function NumInput({ label, value, onChange, prefix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#ffffff', opacity: 0.7 }}>{label}</span>
      <div className="flex items-center gap-1">
        {prefix && <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: 700 }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-8 w-full px-2 rounded-none bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[#ffffff] font-mono tabular-nums focus:border-[#4169E1] outline-none"
          placeholder="0"
        />
      </div>
    </div>
  );
}

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

// ─── Shared page corners (blue TR + amber BL heptagonal) ─────────────────────
function PageCorners() {
  const radii = [80, 150, 220, 295, 370, 445, 520];
  const strokeWidths = [5, 3.5, 2.5, 2, 1.5, 1, 0.7];
  const strokeOpacities = [1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.08];
  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: '560px', height: '560px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="560" height="560" viewBox="0 0 560 560" fill="none">
          {radii.map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => { const a = (-90 + k * 360 / 7) * Math.PI / 180; return `${(560 + r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
            return <polygon key={r} points={pts} stroke="#2563eb" strokeWidth={strokeWidths[i]} strokeOpacity={strokeOpacities[i]} fill={i < 3 ? `rgba(37,99,235,${[0.1,0.05,0.02][i]})` : 'none'} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
          <circle cx="560" cy="0" r="9" fill="#2563eb" fillOpacity="0.9" />
          <circle cx="560" cy="0" r="18" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '500px', height: '500px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
          {radii.map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => { const a = (90 + k * 360 / 7) * Math.PI / 180; return `${(r * Math.cos(a)).toFixed(1)},${(500 + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
            return <polygon key={r} points={pts} stroke="#f59e0b" strokeWidth={strokeWidths[i]} strokeOpacity={strokeOpacities[i]} fill={i < 3 ? `rgba(245,158,11,${[0.1,0.05,0.02][i]})` : 'none'} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
          <circle cx="0" cy="500" r="9" fill="#f59e0b" fillOpacity="0.9" />
          <circle cx="0" cy="500" r="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </div>
    </>
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
    commitTradeLog, updateTradeLog, deleteTradeLog, fetchLogs,
    resumeSession, forkSession, forkCurrentSession, resetTerminalState,
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
    tradeName,
    isGuest,
  } = useNetra();

  const dispatch = useDispatch();
  const location = useLocation();

  const [forkModalState, setForkModalState] = useState<{
    isOpen: boolean;
    log?: any;
    phaseNum?: number;
    defaultName: string;
  }>({ isOpen: false, defaultName: '' });
  const [forkInputName, setForkInputName] = useState('');

  const handleConfirmFork = () => {
    const name = forkInputName || forkModalState.defaultName;
    if (forkModalState.log) {
      forkSession(forkModalState.log, name);
    } else if (forkModalState.phaseNum !== undefined) {
      forkCurrentSession(forkModalState.phaseNum, name);
    }
    setForkModalState({ ...forkModalState, isOpen: false });
  };

  const toast = useSelector((s: RootState) => s.ui.toast);
  const tradeLogs = useSelector((s: RootState) => s.logs.tradeLogs);
  const logSearchTerm = useSelector((s: RootState) => s.logs.logSearchTerm);
  const logFilterOutcome = useSelector((s: RootState) => s.logs.logFilterOutcome);
  const logSortOrder = useSelector((s: RootState) => s.logs.logSortOrder);
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);
  const editFormData = useSelector((s: RootState) => s.logs.editFormData);
  const sessionInput = useSelector((s: RootState) => s.session.sessionInput);
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
  const isMobileMenuOpen = useSelector((s: RootState) => s.ui.isMobileMenuOpen);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);
  const [isLeftPaneOpen, setIsLeftPaneOpen] = useState(true);
  const [sortCol, setSortCol] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const frameworkRef = useRef<HTMLDivElement>(null);
  const [frameworkIdx, setFrameworkIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [modelSlideIdx, setModelSlideIdx] = useState(0);

  // ─── Auto dark mode: terminal = dark, everything else = light ───────────────
  const isTerminalView = !!(activeSessionId && prepStep >= 2 && (activeView === 'terminal' || activeView === 'trishul'));
  useEffect(() => {
    setDarkMode(isTerminalView);
  }, [isTerminalView]);

  // ─── Home page carousel auto-advance ─────────────────────────────────────────
  useEffect(() => {
    if (prepStep !== 1) return;
    const id = setInterval(() => setSlideIdx(i => (i + 1) % 4), 5000);
    return () => clearInterval(id);
  }, [prepStep]);


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

  if (!sysData && !isGuest) {
    return (
      <div style={{ minHeight: '100vh', background: 'hsl(224,30%,6%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', overflow: 'hidden', position: 'relative' }}>
        {/* Ambient grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(65,105,225,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(65,105,225,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

        {/* Spinner rings */}
        <div style={{ position: 'relative', width: 160, height: 160, marginBottom: 36 }}>
          <svg viewBox="0 0 160 160" width="160" height="160" style={{ position: 'absolute', inset: 0 }}>
            {/* outer ring CW */}
            <circle className="netra-ring-cw" cx="80" cy="80" r="74" fill="none" stroke="rgba(65,105,225,0.25)" strokeWidth="1" strokeDasharray="12 8" />
            <circle className="netra-ring-cw" cx="80" cy="80" r="74" fill="none" stroke="#4169E1" strokeWidth="1.5" strokeDasharray="40 428" strokeLinecap="round" />
            {/* middle ring CCW */}
            <circle className="netra-ring-ccw" cx="80" cy="80" r="58" fill="none" stroke="rgba(65,105,225,0.15)" strokeWidth="1" strokeDasharray="6 10" />
            <circle className="netra-ring-ccw" cx="80" cy="80" r="58" fill="none" stroke="#4169E1" strokeWidth="1" strokeDasharray="20 345" strokeLinecap="round" />
            {/* inner breathing ring */}
            <circle className="netra-breathe" cx="80" cy="80" r="42" fill="none" stroke="rgba(65,105,225,0.3)" strokeWidth="1" />
            {/* scan arm */}
            <g className="netra-scan-arm">
              <line x1="80" y1="80" x2="80" y2="10" stroke="#4169E1" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
              <circle cx="80" cy="10" r="2.5" fill="#4169E1" opacity="0.9" />
              <line x1="80" y1="80" x2="80" y2="10" stroke="url(#scanGrad)" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            {/* center dot */}
            <circle className="netra-breathe" cx="80" cy="80" r="4" fill="#4169E1" opacity="0.8" />
            {/* tick marks */}
            {[0,90,180,270].map(angle => {
              const rad = (angle * Math.PI) / 180;
              const x1 = 80 + 70 * Math.sin(rad); const y1 = 80 - 70 * Math.cos(rad);
              const x2 = 80 + 78 * Math.sin(rad); const y2 = 80 - 78 * Math.cos(rad);
              return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(65,105,225,0.5)" strokeWidth="1.5" />;
            })}
            <defs>
              <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4169E1" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#4169E1" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          {/* NETRA text in center */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.25em', color: '#4169E1', textTransform: 'uppercase' }}>NETRA</span>
          </div>
        </div>

        {/* Status lines */}
        <div className="netra-boot-in" style={{ textAlign: 'center', animationDelay: '100ms' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.3em', color: 'rgba(65,105,225,0.9)', textTransform: 'uppercase', marginBottom: 10 }}>
            INITIALIZING EXECUTION ENGINE<span className="netra-blink" style={{ color: '#4169E1' }}>_</span>
          </div>
        </div>
        <div className="netra-boot-in" style={{ display: 'flex', flexDirection: 'column', gap: 4, textAlign: 'center', animationDelay: '300ms' }}>
          {['Connecting to intelligence layer', 'Loading tactical configuration', 'Calibrating weapon systems'].map((line, i) => (
            <div key={i} className="netra-boot-in" style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(100,120,200,0.5)', textTransform: 'uppercase', animationDelay: `${400 + i * 120}ms` }}>
              <span style={{ color: 'rgba(65,105,225,0.4)', marginRight: 8 }}>›</span>{line}
            </div>
          ))}
        </div>
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

      {/* HEADER — dark in terminal, light everywhere else */}
      <header style={{ height: '56px', position: 'sticky', top: 0, background: darkMode ? '#0a0a0f' : '#ffffff', borderBottom: darkMode ? '1px solid rgba(65,105,225,0.3)' : '1px solid rgba(65,105,225,0.22)', zIndex: 200, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', transition: 'background 300ms, border-color 300ms' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="mobile-only" onClick={() => dispatch({ type: 'ui/setMobileMenuOpen', payload: !isMobileMenuOpen })} style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: '#4169E1' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          {/* Logo */}
          <button onClick={() => { if (session) { ctxSetPrepStep(1); setActiveSessionId(null); } }} style={{ background: 'none', border: 'none', padding: '0 4px', cursor: session ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '16px', fontWeight: 950, letterSpacing: '0.14em', color: darkMode ? '#ffffff' : '#0f172a', lineHeight: 1, margin: 0, textTransform: 'uppercase', transition: 'color 300ms' }}>NETRA</h1>
          </button>

          {/* Divider */}
          <div className="desktop-only" style={{ width: '1px', height: '20px', background: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(65,105,225,0.2)', margin: '0 6px' }} />

          {/* Nav */}
          <div className="desktop-only" style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {[
              { label: 'Home', active: prepStep === 1 && activeView !== 'profile' && activeView !== 'about', action: () => { ctxSetPrepStep(1); ctxSetActiveView('terminal'); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Pinaka', active: prepStep === 5 && currentModel === 'pinaka', action: () => { setCurrentModel('pinaka'); setActiveSessionId(null); ctxSetPrepStep(5); ctxSetActiveView('terminal'); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Trishul', active: prepStep === 5 && currentModel === 'trishul', action: () => { setCurrentModel('trishul'); setActiveSessionId(null); ctxSetPrepStep(5); ctxSetActiveView('trishul'); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'About', active: activeView === 'about', action: () => { ctxSetActiveView('about'); setActiveSessionId(null); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
            ].map(nav => (
              <button key={nav.label} onClick={nav.action} style={{ padding: '5px 14px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: nav.active ? '#4169E1' : (darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(15,23,42,0.45)'), border: 'none', borderBottom: nav.active ? '2px solid #4169E1' : '2px solid transparent', background: nav.active ? (darkMode ? 'rgba(65,105,225,0.12)' : 'rgba(65,105,225,0.05)') : 'none', cursor: 'pointer', transition: 'all 150ms', height: '56px' }}>
                {nav.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: OPERATOR CONTROLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

          {/* MAYA toggle */}
          <button
            onClick={() => setIsAiPaneOpen(!isAiPaneOpen)}
            title="Maya AI"
            style={{ height: '34px', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '7px', background: isAiPaneOpen ? '#4169E1' : (darkMode ? 'rgba(65,105,225,0.1)' : 'rgba(65,105,225,0.06)'), border: `1px solid ${isAiPaneOpen ? '#4169E1' : (darkMode ? 'rgba(65,105,225,0.3)' : 'rgba(65,105,225,0.22)')}`, color: isAiPaneOpen ? '#ffffff' : '#4169E1', cursor: 'pointer', transition: 'all 200ms', fontFamily: 'inherit' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M4 18V9L12 15L20 9V18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="5" r="2" fill="currentColor"/>
            </svg>
            <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Maya</span>
            {isAiPaneOpen && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ffffff', opacity: 0.8 }} className="animate-pulse" />}
          </button>

          {/* Demo badge */}
          {isGuest && (
            <div style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f59e0b', boxShadow: '0 0 6px #f59e0b' }} />
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#f59e0b' }}>Demo</span>
            </div>
          )}

          {/* Profile */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              style={{ height: '34px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', background: isProfileOpen ? '#4169E1' : (darkMode ? 'rgba(65,105,225,0.1)' : 'rgba(65,105,225,0.06)'), border: `1px solid ${isProfileOpen ? '#4169E1' : (darkMode ? 'rgba(65,105,225,0.3)' : 'rgba(65,105,225,0.22)')}`, cursor: 'pointer', outline: 'none', transition: 'all 200ms' }}
            >
              <div style={{ width: '22px', height: '22px', background: isProfileOpen ? 'rgba(255,255,255,0.25)' : '#4169E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#ffffff' }}>{(session?.userName || 'O')[0]}</span>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: isProfileOpen ? '#ffffff' : (darkMode ? 'rgba(255,255,255,0.8)' : '#0f172a') }} className="desktop-only">{session?.userName || 'Operator'}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isProfileOpen ? '#ffffff' : (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(15,23,42,0.4)')} strokeWidth="2.5" className="desktop-only"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {isProfileOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 140 }} onClick={() => setIsProfileOpen(false)} />
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '220px', background: darkMode ? '#0d0d14' : '#ffffff', border: darkMode ? '1px solid rgba(65,105,225,0.25)' : '1px solid rgba(65,105,225,0.2)', zIndex: 150 }}>
                  <div style={{ height: '3px', background: '#4169E1' }} />
                  <div style={{ padding: '16px 20px', borderBottom: darkMode ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,23,42,0.08)' }}>
                    <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(15,23,42,0.4)', marginBottom: '4px' }}>Operator</div>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: darkMode ? '#ffffff' : '#0f172a', letterSpacing: '-0.01em' }}>{session?.userName || 'Operator'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                      <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#10b981' }}>Active</span>
                    </div>
                  </div>
                  <div style={{ padding: '6px' }}>
                    <button
                      onClick={() => { ctxSetActiveView('profile'); setIsProfileOpen(false); }}
                      style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = darkMode ? 'rgba(65,105,225,0.12)' : 'rgba(65,105,225,0.06)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4169E1" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: darkMode ? 'rgba(255,255,255,0.8)' : '#0f172a' }}>View Profile</span>
                    </button>
                    <button
                      onClick={logout}
                      style={{ width: '100%', padding: '10px 14px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                      <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#ef4444' }}>Log Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* MISSION TELEMETRY SUB-HEADER */}
      {activeSessionId && (
        <div style={{ height: '36px', background: darkMode ? '#0d1117' : '#f8fafc', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)'}`, display: 'flex', alignItems: 'stretch', zIndex: 90, animation: 'slide-down 0.4s cubic-bezier(0.4,0,0.2,1)', flexShrink: 0 }} className="desktop-only">

          {/* LEFT: session identity — clean inline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', flexShrink: 0, borderRight: `1px solid ${darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)'}` }}>
            <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 5px rgba(16,185,129,0.8)' }} className="animate-pulse" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#4169E1', textTransform: 'uppercase', letterSpacing: '0.14em', fontFamily: 'JetBrains Mono, monospace' }}>
              {session?.assetName || activeEditLog?.phase1?.asset_ticker || '—'}
            </span>
            <div style={{ width: '1px', height: '12px', background: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)' }} />
            <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono, monospace', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tradeName || '—'}
            </span>
          </div>

          {/* CENTRE: phase steps — inline text breadcrumb */}
          {prepStep >= 2 && (activeView === 'terminal' || activeView === 'trishul') && (
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflowX: 'auto', padding: '0 12px', scrollbarWidth: 'none' } as React.CSSProperties}>
              {([
                { label: 'Vision', step: 0 },
                { label: 'Bias', step: 1 },
                { label: 'HTF', step: 2 },
                { label: 'Pulse', step: 3 },
                { label: 'Synthesis', step: 4 },
                { label: 'Command', step: 5 },
                { label: 'Intel', step: 6 },
                { label: 'Armory', step: 7 },
                { label: 'Control', step: 8 },
                { label: 'Audit', step: 9 },
              ] as Array<{ label: string; step: number }>).map((m, idx, arr) => {
                const isComplete = highestStep > m.step;
                const isCurrent = highestStep === m.step;
                return (
                  <React.Fragment key={m.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '0 7px', height: '100%', borderBottom: isCurrent ? '2px solid #4169E1' : '2px solid transparent', flexShrink: 0, transition: 'border-color 200ms' }}>
                      {isComplete && (
                        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3.5"><path d="M20 6L9 17l-5-5"/></svg>
                      )}
                      <span style={{ fontSize: '8px', fontWeight: isCurrent ? 900 : 600, color: isComplete ? '#10b981' : isCurrent ? '#4169E1' : (darkMode ? 'rgba(255,255,255,0.22)' : 'rgba(15,23,42,0.22)'), textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap', transition: 'color 200ms' }}>
                        {m.label}
                      </span>
                    </div>
                    {idx < arr.length - 1 && (
                      <span style={{ fontSize: '9px', color: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)', flexShrink: 0, userSelect: 'none', lineHeight: 1 }}>›</span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}

          <div style={{ width: '1px', background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.08)', flexShrink: 0 }} />

          {/* RIGHT: mission controls */}
          {prepStep >= 2 && (activeView === 'terminal' || activeView === 'trishul') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 14px', flexShrink: 0 }}>

              {/* Ledger toggle */}
              <button
                onClick={() => ctxSetIsLoggerOpen(!isLoggerOpen)}
                title="Operational Ledger"
                style={{ height: '26px', padding: '0 10px', display: 'flex', alignItems: 'center', gap: '5px', background: isLoggerOpen ? 'rgba(65,105,225,0.12)' : 'transparent', border: `1px solid ${isLoggerOpen ? 'rgba(65,105,225,0.4)' : 'var(--border)'}`, color: isLoggerOpen ? '#4169E1' : 'var(--text-3)', cursor: 'pointer', transition: 'all 150ms', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!isLoggerOpen) { e.currentTarget.style.borderColor = 'rgba(65,105,225,0.35)'; e.currentTarget.style.color = '#4169E1'; } }}
                onMouseLeave={e => { if (!isLoggerOpen) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; } }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ledger</span>
              </button>

              <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />

              {/* Scrub — icon only */}
              <button
                onClick={() => { resetTerminalState(); showToast('Mission Scrubbed — State Purged', 'warning'); }}
                title="Scrub mission data"
                style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)'; e.currentTarget.style.color = '#f59e0b'; e.currentTarget.style.background = 'rgba(245,158,11,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              </button>

              {/* Commit — primary action */}
              <button
                onClick={() => commitTradeLog()}
                disabled={isAiLoading}
                title="Commit & Vectorize"
                style={{ height: '26px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '5px', background: '#10b981', border: 'none', color: '#ffffff', cursor: isAiLoading ? 'not-allowed' : 'pointer', opacity: isAiLoading ? 0.5 : 1, transition: 'all 150ms', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!isAiLoading) e.currentTarget.style.background = '#059669'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
                <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Commit</span>
              </button>

              {/* Abort — icon only */}
              <button
                onClick={() => { setActiveSessionId(null); dispatch({ type: 'logs/setActiveEditLog', payload: null }); dispatch({ type: 'analysis/setHighestStep', payload: 0 }); dispatch({ type: 'analysis/setWeaponLocked', payload: false }); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); showToast('Protocol Aborted — State Purged'); }}
                title="Abort protocol"
                style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', transition: 'all 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>

            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="relative">
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }} className="relative">

          {/* LEFT SIDEBAR — Operational Ledger */}
          {(activeSessionId || activeEditLog) && (
            <aside className={`sidebar-transition flex flex-col z-[150] ${isLoggerOpen ? 'w-[400px] max-w-[100vw] opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-full overflow-hidden'}`} style={{ background: darkMode ? '#1C2128' : '#FFFFFF', borderRight: isLoggerOpen ? '1px solid rgba(65,105,225,0.18)' : 'none', boxShadow: isLoggerOpen ? '20px 0 60px rgba(0,0,0,0.3)' : 'none', position: 'relative', height: '100%', transition: 'all 500ms cubic-bezier(0.23,1,0.32,1)' }}>
              <div style={{ minWidth: '400px', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ borderBottom: '1px solid var(--border)' }}>
                  <div style={{ height: '3px', background: 'linear-gradient(90deg, #4169E1, #7c3aed)' }} />
                  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#4169E1' }}>Netra Ledger</span>
                      <span style={{ fontSize: '13px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-1)', lineHeight: 1 }}>Operational Intelligence</span>
                    </div>
                    <button onClick={() => ctxSetIsLoggerOpen(false)} style={{ width: '28px', height: '28px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-3)'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-1">
                  {/* Seven Rules — collapsible */}
                  <div style={{ marginBottom: '8px', border: '1px solid var(--border)' }}>
                    <button
                      onClick={() => setIsRulesExpanded(v => !v)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', border: 'none', cursor: 'pointer', color: 'var(--text-1)' }}
                    >
                      <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4169E1' }}>The Seven Rules</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: isRulesExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', color: 'var(--text-4)' }}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                    {isRulesExpanded && (
                      <div style={{ padding: '8px 10px 12px 10px', display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)' }}>
                        {[
                          'R is fixed before entry. Position size is calculated from R ÷ Stop Distance. Never widen the stop to increase size.',
                          'First target on Interception is mandatory. No holding full position past T1. No exceptions.',
                          'Breakeven trigger activates on first target body close. Immediately — not before, not after a delay.',
                          'Daily loss limit ends the session. No revenge trading. No "one more trade." The S-400 has fired.',
                          'Daily target ends the session voluntarily. Profitable sessions that continue after target give back gains.',
                          'No re-entry on a failed Interception. The reversal failed. The original edge is gone.',
                          'Time Protocol is structural, not situational. Session cutoff and expiry cutoff apply regardless of setup quality.',
                        ].map((rule, i) => (
                          <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '10px', color: 'var(--text-2)', lineHeight: 1.55 }}>
                            <span style={{ color: '#4169E1', fontWeight: 900, flexShrink: 0, fontSize: '9px' }}>{i + 1}.</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selection tree — one row per dimension selected */}
                  {([
                    { phase: '00 · REAL BIAS',         color: '#4169E1', val: activeEditLog ? activeEditLog.phase1?.realBias        : selections.realBias },
                    { phase: '01 · HTF STRUCTURE',     color: '#6366f1', val: activeEditLog ? activeEditLog.phase1?.htfStructure    : selections.htfStructure },
                    { phase: '02 · MARKET PULSE',      color: '#0ea5e9', val: activeEditLog ? activeEditLog.phase1?.marketPulse     : selections.marketPulse },
                    { phase: '03 · LIQUIDITY CONTEXT', color: '#f59e0b', val: activeEditLog ? activeEditLog.phase1?.liquidityContext : selections.liquidityContext },
                  ] as Array<{ phase: string; color: string; val: Record<string, string> | undefined }>).map((p, i) => {
                    const entries = p.val ? Object.entries(p.val).filter(([, v]) => !!v) : [];
                    return (
                      <div key={i}>
                        <div style={{ fontSize: '8px', fontWeight: 900, color: p.color, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 4px 4px 4px', opacity: 0.9 }}>{p.phase}</div>
                        {entries.length > 0 ? entries.map(([key, value]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 8px', borderLeft: `2px solid ${p.color}30` }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)', fontFamily: 'monospace' }}>{String(value)}</span>
                          </div>
                        )) : (
                          <div style={{ padding: '3px 8px', borderLeft: `2px solid ${p.color}20`, fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.5 }}>pending</div>
                        )}
                      </div>
                    );
                  })}

                  {/* Command */}
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 4px 4px 4px', color: finalCommand === 'STRIKE' ? '#ffd700' : finalCommand === 'INTERCEPTION' ? '#38bdf8' : finalCommand === 'SATURATION' ? '#f97316' : finalCommand === 'NO ENGAGEMENT' ? '#ef4444' : '#ffffff', opacity: 0.9 }}>04 · COMMAND</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 8px', borderLeft: `2px solid rgba(255,255,255,0.12)` }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Protocol</span>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)', fontFamily: 'monospace' }}>{finalCommand || '—'}</span>
                    </div>
                  </div>

                  {/* STS selections */}
                  {finalCommand && finalCommand !== 'NO ENGAGEMENT' && (() => {
                    const stsEntries = Object.entries(
                      finalCommand === 'INTERCEPTION' ? interSelections : finalCommand === 'STRIKE' ? strikeSelections : {}
                    ).filter(([, v]) => !!v);
                    const stsColor = finalCommand === 'STRIKE' ? '#ffd700' : finalCommand === 'INTERCEPTION' ? '#38bdf8' : '#f97316';
                    return (
                      <div>
                        <div style={{ fontSize: '8px', fontWeight: 900, color: stsColor, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 4px 4px 4px', opacity: 0.9 }}>STS · EXECUTION TREE</div>
                        {stsEntries.length > 0 ? stsEntries.map(([key, value]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 8px', borderLeft: `2px solid ${stsColor}30` }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)', fontFamily: 'monospace' }}>{String(value)}</span>
                          </div>
                        )) : (
                          <div style={{ padding: '3px 8px', borderLeft: `2px solid ${stsColor}20`, fontSize: '9px', color: 'var(--text-4)', fontStyle: 'italic', opacity: 0.5 }}>pending</div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Weapon */}
                  <div style={{ marginTop: '8px', paddingBottom: '20px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 900, color: '#10b981', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '10px 4px 4px 4px', opacity: 0.9 }}>05 · WEAPON</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '3px 8px', borderLeft: '2px solid rgba(16,185,129,0.3)' }}>
                      <span style={{ fontSize: '9px', color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Identity</span>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#10b981', fontFamily: 'monospace' }}>{selectedWeaponId || activeEditLog?.weapon || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* MAIN TERMINAL CONTAINER */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
            <main className={prepStep === 1 || prepStep === 5 || prepStep === 3 || prepStep === 4 || activeView === 'profile' || activeView === 'about' ? '' : 'terminal-main'} style={{ flex: 1, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>

              {activeView === 'about' ? (
                <AboutPage />
              ) : activeView === 'profile' ? (
                <ProfilePage />
              ) : prepStep === 1 && !activeSessionId ? (
                /* ── COMMAND DASHBOARD ── */
                <div className="flex-1 overflow-y-auto" style={{ background: '#ffffff', position: 'relative' }}>

                  {/* ── CORNER: TOP-RIGHT — Heptagonal ── */}
                  {/* ── CORNER: TOP-RIGHT — Scattered heptagons ── */}
                  <div style={{ position: 'fixed', top: 0, right: 0, width: '620px', height: '620px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <svg width="620" height="620" viewBox="0 0 620 620" fill="none">
                      {([
                        { cx: 598, cy: 22,  r: 52, color: '#2563eb' },
                        { cx: 508, cy: 15,  r: 40, color: '#7c3aed' },
                        { cx: 618, cy: 100, r: 44, color: '#d97706' },
                        { cx: 428, cy: 32,  r: 34, color: '#2563eb' },
                        { cx: 532, cy: 102, r: 46, color: '#7c3aed' },
                        { cx: 358, cy: 12,  r: 28, color: '#d97706' },
                        { cx: 455, cy: 118, r: 32, color: '#2563eb' },
                        { cx: 615, cy: 178, r: 36, color: '#7c3aed' },
                        { cx: 372, cy: 98,  r: 26, color: '#d97706' },
                        { cx: 525, cy: 182, r: 38, color: '#2563eb' },
                        { cx: 298, cy: 55,  r: 24, color: '#7c3aed' },
                        { cx: 442, cy: 198, r: 30, color: '#d97706' },
                        { cx: 615, cy: 252, r: 32, color: '#2563eb' },
                        { cx: 348, cy: 168, r: 24, color: '#7c3aed' },
                        { cx: 272, cy: 132, r: 20, color: '#2563eb' },
                        { cx: 498, cy: 258, r: 28, color: '#d97706' },
                        { cx: 388, cy: 248, r: 24, color: '#7c3aed' },
                        { cx: 228, cy: 88,  r: 18, color: '#2563eb' },
                        { cx: 445, cy: 308, r: 26, color: '#d97706' },
                        { cx: 322, cy: 295, r: 20, color: '#7c3aed' },
                      ] as {cx:number;cy:number;r:number;color:string}[]).map((s, i) => {
                        const pts = Array.from({ length: 6 }, (_, k) => {
                          const a = (k * 60 - 90) * Math.PI / 180;
                          return `${(s.cx + s.r * Math.cos(a)).toFixed(1)},${(s.cy + s.r * Math.sin(a)).toFixed(1)}`;
                        }).join(' ');
                        return <polygon key={i} points={pts} fill="none" stroke={s.color} strokeWidth="4" strokeOpacity="0.4" />;
                      })}
                    </svg>
                  </div>

                  {/* ── CORNER: BOTTOM-LEFT — Scattered heptagons ── */}
                  <div style={{ position: 'fixed', bottom: 0, left: 0, width: '560px', height: '560px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
                    <svg width="560" height="560" viewBox="0 0 560 560" fill="none">
                      {([
                        { cx: 18,  cy: 538, r: 52, color: '#2563eb' },
                        { cx: 112, cy: 552, r: 40, color: '#059669' },
                        { cx: 8,   cy: 452, r: 44, color: '#d97706' },
                        { cx: 188, cy: 522, r: 34, color: '#2563eb' },
                        { cx: 98,  cy: 455, r: 46, color: '#059669' },
                        { cx: 205, cy: 445, r: 28, color: '#d97706' },
                        { cx: 18,  cy: 375, r: 32, color: '#2563eb' },
                        { cx: 148, cy: 372, r: 36, color: '#059669' },
                        { cx: 282, cy: 505, r: 26, color: '#d97706' },
                        { cx: 68,  cy: 292, r: 38, color: '#2563eb' },
                        { cx: 258, cy: 415, r: 24, color: '#059669' },
                        { cx: 178, cy: 302, r: 30, color: '#d97706' },
                        { cx: 335, cy: 455, r: 22, color: '#2563eb' },
                        { cx: 15,  cy: 218, r: 28, color: '#059669' },
                        { cx: 145, cy: 225, r: 22, color: '#d97706' },
                        { cx: 285, cy: 332, r: 24, color: '#2563eb' },
                        { cx: 75,  cy: 172, r: 20, color: '#059669' },
                        { cx: 225, cy: 205, r: 20, color: '#d97706' },
                        { cx: 355, cy: 372, r: 20, color: '#2563eb' },
                        { cx: 165, cy: 138, r: 18, color: '#059669' },
                      ] as {cx:number;cy:number;r:number;color:string}[]).map((s, i) => {
                        const pts = Array.from({ length: 6 }, (_, k) => {
                          const a = (k * 60 - 90) * Math.PI / 180;
                          return `${(s.cx + s.r * Math.cos(a)).toFixed(1)},${(s.cy + s.r * Math.sin(a)).toFixed(1)}`;
                        }).join(' ');
                        return <polygon key={i} points={pts} fill="none" stroke={s.color} strokeWidth="4" strokeOpacity="0.4" />;
                      })}
                    </svg>
                  </div>

                  <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '48px 48px 80px', display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', zIndex: 1 }}>

                    {/* HEADER */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingBottom: '36px', borderBottom: '2px solid rgba(37,99,235,0.18)', marginBottom: '48px' }}>
                      <div className="home-slide-up" style={{ animationDelay: '0ms' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#2563eb', marginBottom: '12px' }}>
                          {session?.userName || 'Operator'} · {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()} · v2.0
                        </div>
                        <h1 style={{ fontSize: '80px', fontWeight: 950, letterSpacing: '-0.05em', lineHeight: 0.88, textTransform: 'uppercase', margin: 0 }}>
                          <span style={{ color: '#0f172a' }}>NETRA</span><br />
                          <span style={{ color: '#2563eb' }}>COMMAND</span>
                        </h1>
                      </div>
                      <div className="home-fade" style={{ textAlign: 'right', paddingBottom: '6px', animationDelay: '200ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} className="pulse-dot" />
                          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#10b981' }}>System Online</span>
                        </div>
                      </div>
                    </div>

                    {/* AUTO-SLIDING CAROUSEL */}
                    {(() => {
                      const slides = [
                        { label: 'On discipline', quote: 'Structure before direction. Conviction before entry. The market does not reward eagerness — it punishes it.', accent: '#2563eb', bg: '#e4e8f0', image: '/image_1.avif' },
                        { label: 'On patience', quote: 'The edge is not in the setup. It is in the patience to wait for one that is undeniable. Most sessions end without a trade. That is the correct outcome.', accent: '#059669', bg: '#e5ebe5', image: '/image_2.jpg' },
                        { label: 'On capital', quote: 'Capital lost cannot analyse. Capital preserved can deploy again. Survival is the precondition for every future trade.', accent: '#d97706', bg: '#ece8df', image: '/image_3.jpg' },
                        { label: 'On confluence', quote: 'One signal is noise. Two signals are coincidence. Five aligned structural signals is a command. Deploy only at command level.', accent: '#7c3aed', bg: '#e9e6ee', image: '/image_4.jpg' },
                      ];
                      const slide = slides[slideIdx];
                      return (
                        <div style={{ position: 'relative', marginBottom: '48px' }}>
                          <div style={{ width: '100%', minHeight: '520px', display: 'flex', overflow: 'hidden', background: slide.bg, transition: 'background 500ms ease' }}>

                            {/* LEFT — image */}
                            <div style={{ width: '42%', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                              <img
                                src={slide.image}
                                alt={slide.label}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', transition: 'opacity 400ms ease' }}
                              />
                              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)' }} />
                            </div>

                            {/* RIGHT — quote */}
                            <div style={{ flex: 1, padding: '72px 72px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
                              {/* Ghost number */}
                              <div style={{ fontSize: '120px', fontWeight: 950, color: slide.accent, opacity: 0.12, position: 'absolute', right: '40px', top: '20px', lineHeight: 1, fontFamily: 'monospace', userSelect: 'none' }}>
                                {String(slideIdx + 1).padStart(2, '0')}
                              </div>
                              <div>
                                <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: slide.accent, marginBottom: '28px' }}>{slide.label}</div>
                                <p style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4, margin: 0, letterSpacing: '-0.02em' }}>
                                  "{slide.quote}"
                                </p>
                              </div>
                              {/* Dots */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '40px' }}>
                                {slides.map((_, i) => (
                                  <button
                                    key={i}
                                    onClick={() => setSlideIdx(i)}
                                    style={{ width: i === slideIdx ? '28px' : '6px', height: '4px', borderRadius: '2px', background: i === slideIdx ? slide.accent : `${slide.accent}40`, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 400ms ease' }}
                                  />
                                ))}
                              </div>
                            </div>

                          </div>
                        </div>
                      );
                    })()}

                    {/* ── BOX 1: WHAT THIS IS ── */}
                    <div className="home-slide-up" style={{ animationDelay: '150ms', marginBottom: '20px' }}>
                      <div style={{ background: '#ece5e6', padding: '56px 60px' }}>
                        <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#e11d48', marginBottom: '32px' }}>The system</div>
                        <p style={{ fontSize: '26px', fontWeight: 700, color: '#0f172a', lineHeight: 1.45, margin: '0 0 28px 0', letterSpacing: '-0.02em', maxWidth: '820px' }}>
                          NETRA is not a signal generator. It is a <span style={{ color: '#e11d48' }}>decision enforcement system</span> — a structured process that removes emotion and forces every assumption about the market to be verified before capital is deployed.
                        </p>
                        <p style={{ fontSize: '15px', fontWeight: 500, color: '#475569', lineHeight: 1.75, margin: 0, maxWidth: '700px' }}>
                          Every session begins with a hypothesis. Every hypothesis is tested against a sequence of structural gates. Setups that clear every gate reach execution. Setups that do not are observations — and observations are not losses.
                        </p>
                      </div>
                    </div>

                    {/* ── MODEL OVERVIEW ── */}
                    {(() => {
                      const models = [
                        {
                          id: 'pinaka',
                          idx: '01 / 02',
                          code: 'MDL-01',
                          name: 'PINAKA',
                          color: '#3b82f6',
                          image: '/pinaka.avif',
                          type: 'AI-Assisted Retail Model',
                          philosophy: 'Retail precision built on institutional logic. Every entry is verified through a structural sequence — no assumptions, no shortcuts, no emotional overrides.',
                          detail: 'Pinaka is an AI-assisted retail trading model built on institutional price action. It operates across two protocols — Strike and Interception. Strike engages post-BOS continuation setups. Interception engages post-sweep reversal setups. Maya, the AI engine, supports every session with structural context and bias validation.',
                          stats: [
                            { label: 'Protocols', value: 'Strike · Interception' },
                            { label: 'Strike Weapons', value: 'TRSH · BRAM · AGN' },
                            { label: 'Interception Weapons', value: 'AKA · TEER · PNKA · PRTH' },
                            { label: 'AI Engine', value: 'Maya — RAG-backed, multi-modal' },
                            { label: 'Status', value: 'Live — v2.0' },
                          ],
                        },
                        {
                          id: 'trishul',
                          idx: '02 / 02',
                          code: 'MDL-02',
                          name: 'TRISHUL',
                          color: '#f59e0b',
                          image: '/trishul.avif',
                          type: 'Quant-Institutional Swing Model',
                          philosophy: 'Where quantitative logic meets institutional price action — designed for short-term equity swing trading with AI-assisted validation.',
                          detail: 'Trishul is a planned hybrid model combining quantitative stock screening with institutional price action entry logic. It targets equities for short-term swing trades — buy-side only. The model is currently in research and planning phase. Deployment is planned once the quantitative screening layer is validated against sufficient historical data.',
                          stats: [
                            { label: 'Asset Class', value: 'Equities — Long only' },
                            { label: 'Hold Period', value: 'Short-term swing · 1–5 sessions' },
                            { label: 'Approach', value: 'Quant filter + Institutional PA entry' },
                            { label: 'Direction', value: 'Buy-side only · No shorts' },
                            { label: 'Status', value: '🔬 Planning Phase — Not deployed' },
                          ],
                        },
                      ];

                      const m = models[modelSlideIdx % 2];

                      return (
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
                            <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: '#2563eb' }}>Trading Models</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(37,99,235,0.15)' }} />
                            <span style={{ fontSize: '8px', fontWeight: 700, fontFamily: 'monospace', color: 'rgba(15,23,42,0.5)', letterSpacing: '0.15em' }}>{m.idx}</span>
                          </div>

                          <div style={{ background: '#ffffff', boxShadow: '0 4px 40px rgba(0,0,0,0.08)', minHeight: '560px', display: 'flex', overflow: 'hidden' }}>

                            {/* LEFT — Model image panel */}
                            <div style={{ position: 'relative', flexShrink: 0, width: '44%', clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)', overflow: 'hidden' }}>
                              {/* Full-bleed model image */}
                              <img
                                src={m.image}
                                alt={m.name}
                                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
                              />
                              {/* Gradient overlay so text stays readable */}
                              <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)` }} />

                              {/* Text over image */}
                              <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 52px 52px 52px' }}>
                                <div>
                                  {/* Model code badge */}
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', border: `1px solid ${m.color}cc`, background: `${m.color}22`, padding: '5px 14px', marginBottom: '40px' }}>
                                    <div style={{ width: '5px', height: '5px', background: m.color }} />
                                    <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: m.color }}>{m.code} · {m.type}</span>
                                  </div>

                                  <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: '10px' }}>NETRA MODEL</div>
                                  <div style={{ fontSize: '80px', fontWeight: 950, letterSpacing: '-0.04em', color: '#ffffff', lineHeight: 0.85, textTransform: 'uppercase', marginBottom: '28px' }}>{m.name}</div>

                                  <div style={{ height: '2px', background: m.color, width: '48px', marginBottom: '28px' }} />

                                  <p style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.8)', lineHeight: 1.75, margin: 0, fontStyle: 'italic', maxWidth: '280px' }}>
                                    "{m.philosophy}"
                                  </p>
                                </div>

                                {/* Ghost number */}
                                <div style={{ fontSize: '120px', fontWeight: 950, fontFamily: 'monospace', color: '#ffffff', opacity: 0.08, lineHeight: 1, userSelect: 'none' }}>
                                  {String((modelSlideIdx % 2) + 1).padStart(2, '0')}
                                </div>
                              </div>
                            </div>

                            {/* RIGHT — Detail panel */}
                            <div style={{ flex: 1, padding: '60px 60px 60px 68px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                              <div>
                                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: m.color, marginBottom: '20px' }}>Model Architecture</div>
                                <p style={{ fontSize: '16px', fontWeight: 500, color: '#334155', lineHeight: 1.8, margin: '0 0 48px 0' }}>{m.detail}</p>

                                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: m.color, marginBottom: '20px' }}>Model Parameters</div>
                                <div style={{ borderTop: `1px solid ${m.color}22` }}>
                                  {m.stats.map((s, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', padding: '13px 0', borderBottom: `1px solid ${m.color}18`, gap: '24px', alignItems: 'baseline' }}>
                                      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.45)' }}>{s.label}</span>
                                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>{s.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Navigation */}
                              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '36px', borderTop: `1px solid ${m.color}22`, marginTop: '32px', gap: '0' }}>
                                <button
                                  onClick={() => setModelSlideIdx(i => (i - 1 + 2) % 2)}
                                  style={{ height: '40px', paddingInline: '20px', border: `1px solid ${m.color}33`, borderRight: 'none', background: 'transparent', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', transition: 'background 150ms' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.06)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                                  Prev
                                </button>
                                <button
                                  onClick={() => setModelSlideIdx(i => (i + 1) % 2)}
                                  style={{ height: '40px', paddingInline: '20px', border: `1px solid ${m.color}33`, background: 'transparent', cursor: 'pointer', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', transition: 'background 150ms' }}
                                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(15,23,42,0.06)')}
                                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                >
                                  Next
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                </button>
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                                  {[0, 1].map(i => (
                                    <button key={i} onClick={() => setModelSlideIdx(i)} style={{ width: i === modelSlideIdx % 2 ? '28px' : '6px', height: '4px', border: 'none', borderRadius: '2px', background: i === modelSlideIdx % 2 ? m.color : 'rgba(15,23,42,0.15)', cursor: 'pointer', padding: 0, transition: 'all 350ms ease' }} />
                                  ))}
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <button
                                    onClick={() => { setCurrentModel(m.id); ctxSetPrepStep(5); }}
                                    style={{ height: '36px', paddingInline: '20px', background: m.color, border: 'none', cursor: 'pointer', color: '#ffffff', fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 150ms' }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                  >
                                    View Model
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                  </button>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '6px', height: '6px', background: m.color }} />
                                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.25em', color: m.color }}>{m.name} · {m.type}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* ── BOX 2: THREE PILLARS ── */}
                    <div className="home-slide-up" style={{ animationDelay: '220ms', marginBottom: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: '#ece8df' }}>
                        {([
                          { n: '01', title: 'Read the market first.', body: 'No directional bias is valid without structural confirmation. The market\'s current state — whether it is in balance, relocation, or transition — determines which trades are even available today.' },
                          { n: '02', title: 'Risk is decided at the start.', body: 'R is fixed before entry. Position size is derived from it. The stop is never moved to save a trade. When the stop is hit, the analysis was wrong. That is the correct conclusion every time.' },
                          { n: '03', title: 'No trade is a trade.', body: 'A session that ends with no execution but full capital is a successful session. Low-conviction setups are not small trades — they are full-size losses waiting. Patience is the only edge that compounds.' },
                        ] as Array<{ n: string; title: string; body: string }>).map((p, i, arr) => (
                          <div key={p.n} className="home-reveal" style={{ animationDelay: `${280 + i * 80}ms`, padding: '44px 40px', borderRight: i < arr.length - 1 ? '1px solid rgba(217,119,6,0.15)' : 'none' }}>
                            <div style={{ fontSize: '48px', fontWeight: 950, letterSpacing: '-0.05em', color: '#d97706', opacity: 0.2, lineHeight: 1, marginBottom: '24px', fontFamily: 'monospace' }}>{p.n}</div>
                            <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.25, marginBottom: '16px' }}>{p.title}</div>
                            <div style={{ fontSize: '12px', fontWeight: 500, color: '#475569', lineHeight: 1.75 }}>{p.body}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* ── BOX 3: LARGE QUOTE ── */}
                    <div className="home-slide-up" style={{ animationDelay: '300ms', marginBottom: '48px' }}>
                      <div style={{ background: '#e4eae8', padding: '64px 60px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ fontSize: '200px', fontWeight: 950, color: '#0d9488', opacity: 0.07, position: 'absolute', right: '-20px', bottom: '-40px', lineHeight: 1, fontFamily: 'monospace', userSelect: 'none', letterSpacing: '-0.05em' }}>"</div>
                        <div style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#0d9488', marginBottom: '28px' }}>Trading is a discipline problem, not an information problem</div>
                        <p style={{ fontSize: '32px', fontWeight: 700, color: '#0f172a', lineHeight: 1.35, margin: '0 0 32px 0', letterSpacing: '-0.03em', maxWidth: '860px' }}>
                          The analyst who waits for the right setup and misses it loses nothing. The analyst who forces an entry where none exists loses capital, confidence, and the ability to see the next real setup clearly.
                        </p>
                        <div style={{ height: '2px', background: '#0d9488', width: '64px' }} />
                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', marginBottom: '1px', overflow: 'hidden', gap: '2px', background: 'rgba(15,23,42,0.06)' }}>
                      {/* Initialize Mission */}
                      <button
                        onClick={() => { ctxSetPrepStep(3); dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '' })); }}
                        style={{ padding: '48px 52px', background: '#f5f3ff', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 200ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#ede9fe'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#f5f3ff'; }}
                      >
                        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#2563eb', marginBottom: '20px' }}>New Session</div>
                        <div style={{ fontSize: '40px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1, marginBottom: '16px' }}>Initialize<br />Mission</div>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65, maxWidth: '440px' }}>
                          Deploy a full multi-phase structural analysis session. Real Bias → HTF Structure → Market Pulse → Liquidity → Command → Weapon → Mission Control.
                        </div>
                        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
                          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Begin</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      </button>

                      {/* Operational Ledger */}
                      <button
                        onClick={() => ctxSetPrepStep(4)}
                        style={{ padding: '48px 40px', background: '#fff7ed', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 200ms' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fed7aa'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff7ed'; }}
                      >
                        <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#2563eb', marginBottom: '20px' }}>Archive</div>
                        <div style={{ fontSize: '40px', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '-0.03em', color: '#0f172a', lineHeight: 1, marginBottom: '16px' }}>Mission<br />Ledger</div>
                        <div style={{ fontSize: '13px', color: '#475569', lineHeight: 1.65 }}>
                          {(tradeLogs?.length ?? 0) > 0
                            ? `${tradeLogs!.length} missions on record.`
                            : 'No missions logged yet.'}
                        </div>
                        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb' }}>
                          <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase' }}>View</span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </div>
                      </button>
                    </div>

                    {/* FOOTER LINE */}
                    <div style={{ borderTop: '1px solid rgba(109,40,217,0.12)', paddingTop: '24px', marginTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2563eb' }}>
                        Precision is the only objective. Discipline is the only tool.
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#2563eb', fontFamily: 'monospace' }}>
                        NETRA v2.0
                      </span>
                    </div>

                  </div>
                </div>
              ) : prepStep === 3 ? (
                /* INITIALIZE MISSION */
                <div style={{ flex: 1, background: '#ffffff', position: 'relative', overflow: 'auto' }}>
                  <PageCorners />
                  <div style={{ maxWidth: '560px', margin: '0 auto', padding: '64px 24px', position: 'relative', zIndex: 1 }}>
                  <div style={{ background: '#eff6ff', border: '1px solid rgba(65,105,225,0.18)' }}>
                    <div style={{ height: '4px', background: '#4169E1' }} />
                    <div style={{ padding: '36px 40px' }}>

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div>
                          <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#4169E1', marginBottom: '6px' }}>Trade Setup</div>
                          <h2 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Initialize Mission</h2>
                        </div>
                        <button onClick={() => ctxSetPrepStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.4)', fontSize: '18px', padding: '0', lineHeight: 1, fontFamily: 'inherit' }}>✕</button>
                      </div>

                      {/* Asset + Reference */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                        {[
                          { label: 'Asset Ticker', key: 'assetName', placeholder: 'E.G. NIFTY50' },
                          { label: 'Trade Reference', key: 'tradeName', placeholder: 'E.G. H1_SWEEP' },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.5)', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                            <input
                              type="text"
                              value={(sessionInput as any)[f.key]}
                              onChange={e => dispatch(setSessionInput({ ...sessionInput, [f.key]: e.target.value }))}
                              placeholder={f.placeholder}
                              style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid rgba(15,23,42,0.15)', background: '#f8fafc', fontSize: '12px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Market Type */}
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.5)', display: 'block', marginBottom: '10px' }}>Market Environment</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                          {(['TRENDING', 'RANGING', 'VOLATILE'] as const).map(t => {
                            const active = sessionInput.marketType === t;
                            return (
                              <button key={t} onClick={() => dispatch(setSessionInput({ ...sessionInput, marketType: t }))}
                                style={{ padding: '14px 10px', border: `1px solid ${active ? '#4169E1' : 'rgba(15,23,42,0.12)'}`, background: active ? '#eff6ff' : '#f8fafc', color: active ? '#4169E1' : 'rgba(15,23,42,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'all 150ms', borderLeft: active ? '3px solid #4169E1' : '3px solid transparent' }}>
                                {t}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Model */}
                      <div style={{ marginBottom: '28px' }}>
                        <label style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.5)', display: 'block', marginBottom: '10px' }}>Trading Model</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                          {([{ id: 'pinaka', name: 'Pinaka', desc: 'Strike · Interception', color: '#3b82f6' }, { id: 'trishul', name: 'Trishul', desc: 'Quant · Swing', color: '#f59e0b' }]).map(m => {
                            const active = sessionInput.modelName === m.id;
                            return (
                              <button key={m.id} onClick={() => { dispatch(setSessionInput({ ...sessionInput, modelName: m.id })); setCurrentModel(m.id); }}
                                style={{ padding: '16px', border: `1px solid ${active ? m.color : 'rgba(15,23,42,0.12)'}`, background: active ? `${m.color}0f` : '#f8fafc', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 150ms', borderLeft: `4px solid ${m.color}` }}>
                                <div style={{ fontSize: '13px', fontWeight: 900, color: active ? m.color : '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{m.name}</div>
                                <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.desc}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={() => ctxSetPrepStep(1)} style={{ flex: 1, height: '42px', border: '1px solid rgba(15,23,42,0.15)', background: '#ffffff', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#475569', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                        <button onClick={initializeMission} style={{ flex: 2, height: '42px', border: 'none', background: '#4169E1', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#ffffff', cursor: 'pointer', fontFamily: 'inherit' }}>Initialize Terminal</button>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ) : prepStep === 4 ? (
                /* ARCHIVE GATEWAY */
                <div style={{ flex: 1, background: '#ffffff', position: 'relative', overflow: 'auto' }}>
                  <PageCorners />
                  <div style={{ maxWidth: '480px', margin: '0 auto', padding: '64px 24px', position: 'relative', zIndex: 1 }}>
                  <div style={{ background: '#eff6ff', border: '1px solid rgba(65,105,225,0.18)' }}>
                    <div style={{ height: '4px', background: '#4169E1' }} />
                    <div style={{ padding: '36px 40px' }}>

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
                        <div>
                          <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#4169E1', marginBottom: '6px' }}>Archive Gateway</div>
                          <h2 style={{ fontSize: '22px', fontWeight: 950, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>Select Model</h2>
                        </div>
                        <button onClick={() => ctxSetPrepStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(15,23,42,0.4)', fontSize: '18px', padding: 0, lineHeight: 1, fontFamily: 'inherit' }}>✕</button>
                      </div>

                      {/* Model cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {([
                          { id: 'pinaka', name: 'Pinaka', sub: 'AI-Assisted Retail · Strike + Interception', color: '#3b82f6', action: () => { setCurrentModel('pinaka'); setActiveSessionId(null); ctxSetPrepStep(5); } },
                          { id: 'trishul', name: 'Trishul', sub: 'Quant-Institutional Swing · Planning Phase', color: '#f59e0b', action: () => { setCurrentModel('trishul'); setActiveSessionId(null); ctxSetPrepStep(5); } },
                        ] as Array<{id: string; name: string; sub: string; color: string; action: () => void}>).map(m => (
                          <button key={m.id} onClick={m.action}
                            style={{ padding: '20px 20px 20px 24px', border: '1px solid rgba(15,23,42,0.1)', background: '#f8fafc', borderLeft: `4px solid ${m.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'all 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.borderColor = `${m.color}60`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = 'rgba(15,23,42,0.1)'; e.currentTarget.style.borderLeftColor = m.color; }}
                          >
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{m.name}</div>
                              <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(15,23,42,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.sub}</div>
                            </div>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.3)" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ) : prepStep === 5 ? (
                /* ── MODEL DETAIL PAGE ── */
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <ModelPage
                    model={MODEL_DATA[currentModel || 'pinaka']}
                    onBack={() => ctxSetPrepStep(1)}
                    fetchLogs={fetchLogs}
                    resumeSession={resumeSession}
                    forkSession={forkSession}
                    onView={log => { dispatch({ type: 'logs/setActiveEditLog', payload: log }); ctxSetIsLoggerOpen(true); }}
                    initializeMission={() => { dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '', modelName: currentModel || 'pinaka' })); ctxSetPrepStep(3); }}
                    deleteTradeLog={deleteTradeLog}
                    downloadCSV={downloadCSV}
                    isDownloading={isDownloading}
                  />
                </div>
              ) : (!activeSessionId && activeView !== 'trishul') ? (
                /* ── MODEL PAGE (no active session) ── */
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <ModelPage
                    model={MODEL_DATA[currentModel || 'pinaka']}
                    onBack={() => ctxSetPrepStep(1)}
                    fetchLogs={fetchLogs}
                    resumeSession={resumeSession}
                    forkSession={forkSession}
                    onView={log => { dispatch({ type: 'logs/setActiveEditLog', payload: log }); ctxSetIsLoggerOpen(true); }}
                    initializeMission={() => { dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '', modelName: currentModel || 'pinaka' })); ctxSetPrepStep(3); }}
                    deleteTradeLog={deleteTradeLog}
                    downloadCSV={downloadCSV}
                    isDownloading={isDownloading}
                  />
                </div>
              ) : activeView === 'trishul' ? (
                /* ── TRISHUL MODEL PAGE ── */
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <ModelPage
                    model={MODEL_DATA['trishul']}
                    onBack={() => ctxSetPrepStep(1)}
                    fetchLogs={fetchLogs}
                    resumeSession={resumeSession}
                    forkSession={forkSession}
                    onView={log => { dispatch({ type: 'logs/setActiveEditLog', payload: log }); ctxSetIsLoggerOpen(true); }}
                    initializeMission={() => { dispatch(setSessionInput({ ...sessionInput, assetName: '', tradeName: '', modelName: 'trishul' })); ctxSetPrepStep(3); }}
                    deleteTradeLog={deleteTradeLog}
                    downloadCSV={downloadCSV}
                    isDownloading={isDownloading}
                  />
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
                      <ForkButton onClick={() => {
                        setForkModalState({ isOpen: true, phaseNum: 0, defaultName: `FORK_${tradeName || 'Trade'}_P0` });
                        setForkInputName(`FORK_${tradeName || 'Trade'}_P0`);
                      }} size="sm" style={{ marginRight: '8px' }} />
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
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>BIAS</span>
                        <div style={{ flex: 1 }} />
                        <ForkButton onClick={() => {
                          setForkModalState({ isOpen: true, phaseNum: 1, defaultName: `FORK_${tradeName || 'Trade'}_P1` });
                          setForkInputName(`FORK_${tradeName || 'Trade'}_P1`);
                        }} size="sm" style={{ marginRight: '8px' }} />
                        {stepTimestamps.realBias
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.realBias}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Pre-Market Directional Predisposition</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase1Bias /></div>
                    </div>
                  )}

                  {/* P2: HTF STRUCTURE */}
                  {highestStep >= 2 && (
                    <div className="phase-card" data-phase="2" data-active={highestStep === 2 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P2</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>HTF STRUCTURE</span>
                        <div style={{ flex: 1 }} />
                        <ForkButton onClick={() => {
                          setForkModalState({ isOpen: true, phaseNum: 2, defaultName: `FORK_${tradeName || 'Trade'}_P2` });
                          setForkInputName(`FORK_${tradeName || 'Trade'}_P2`);
                        }} size="sm" style={{ marginRight: '8px' }} />
                        {stepTimestamps.htfStructure
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.htfStructure}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Higher Timeframe Structural Analysis</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase2Auction /></div>
                    </div>
                  )}

                  {/* P3: MARKET PULSE (Auction & Energy + Liquidity Context combined) */}
                  {highestStep >= 3 && (
                    <div className="phase-card" data-phase="3" data-active={highestStep === 3 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P3</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MARKET PULSE</span>
                        <div style={{ flex: 1 }} />
                        <ForkButton onClick={() => {
                          setForkModalState({ isOpen: true, phaseNum: 3, defaultName: `FORK_${tradeName || 'Trade'}_P3` });
                          setForkInputName(`FORK_${tradeName || 'Trade'}_P3`);
                        }} size="sm" style={{ marginRight: '8px' }} />
                        {stepTimestamps.marketPulse
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.marketPulse}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Auction State · Price Behaviour · Liquidity Context</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase3MarketPulse /></div>
                    </div>
                  )}

                  {/* P4: BEHAVIOUR */}
                  {/* P5: SYNTHESIS */}
                  {highestStep >= 4 && (
                    <div className="phase-card" data-phase="5" data-active={highestStep === 4 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P4</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>SYNTHESIS</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Neural Fusion Output</span>
                      </div>
                      <div className="phase-card-body"><Phase5Synthesis /></div>
                    </div>
                  )}

                  {/* P6: COMMAND */}
                  {highestStep >= 4 && (
                    <div className="phase-card" data-phase="6" data-active={highestStep === 4 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P5</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>COMMAND</span>
                        <div style={{ flex: 1 }} />
                        <ForkButton onClick={() => {
                          setForkModalState({ isOpen: true, phaseNum: 4, defaultName: `FORK_${tradeName || 'Trade'}_P4` });
                          setForkInputName(`FORK_${tradeName || 'Trade'}_P4`);
                        }} size="sm" style={{ marginRight: '8px' }} />
                        {stepTimestamps.command
                          ? <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, color: 'var(--green)', letterSpacing: '0.1em' }}>✓ LOCKED · {stepTimestamps.command}</span>
                          : <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Doctrine Selection & STS</span>
                        }
                      </div>
                      <div className="phase-card-body"><Phase6Command /></div>
                    </div>
                  )}

                  {/* P7: WEAPON INTEL */}
                  {highestStep >= 5 && (
                    <div className="phase-card" data-phase="7" data-active={highestStep === 5 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P6</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MISSION INTEL</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Maya Weapon Recommendation</span>
                      </div>
                      <div className="phase-card-body"><Phase8WeaponIntel /></div>
                    </div>
                  )}

                  {/* P8: WEAPON ARMORY */}
                  {highestStep >= 5 && (
                    <div className="phase-card" data-phase="8" data-active={highestStep === 5 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P7</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>WEAPON ARMORY</span>
                        <div style={{ flex: 1 }} />
                        <ForkButton onClick={() => {
                          setForkModalState({ isOpen: true, phaseNum: 5, defaultName: `FORK_${tradeName || 'Trade'}_P5` });
                          setForkInputName(`FORK_${tradeName || 'Trade'}_P5`);
                        }} size="sm" style={{ marginRight: '8px' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Entry Model Selection</span>
                      </div>
                      <div className="phase-card-body"><Phase9WeaponArmory /></div>
                    </div>
                  )}



                  {/* P10: MISSION CONTROL */}
                  {highestStep >= 6 && (
                    <div className="phase-card" data-phase="9" data-active={highestStep === 6 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P8</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MISSION CONTROL</span>
                        <div style={{ flex: 1 }} />
                        <ForkButton onClick={() => {
                          setForkModalState({ isOpen: true, phaseNum: 6, defaultName: `FORK_${tradeName || 'Trade'}_P6` });
                          setForkInputName(`FORK_${tradeName || 'Trade'}_P6`);
                        }} size="sm" style={{ marginRight: '8px' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Operational Debrief & Audit</span>
                      </div>
                      <div className="phase-card-body"><Phase10MissionControl /></div>
                    </div>
                  )}
                  {/* P11: MAYA AUDIT */}
                  {highestStep >= 7 && (
                    <div className="phase-card" data-phase="10" data-active={highestStep === 7 ? 'true' : undefined}>
                      <div className="phase-card-header">
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.25em' }}>P9</span>
                        <div style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>MAYA AUDIT</span>
                        <div style={{ flex: 1 }} />
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', color: 'var(--text-4)', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.4 }}>Strategic Evaluation</span>
                      </div>
                      <div className="phase-card-body"><Phase11MayaAudit /></div>
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
        <aside className={`sidebar-transition flex flex-col z-[150] ${isAiPaneOpen ? 'w-[440px] max-w-[100vw] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-full overflow-hidden'}`} style={{ background: darkMode ? '#12141D' : '#F0F2FF', borderLeft: isAiPaneOpen ? '1px solid rgba(65,105,225,0.18)' : 'none', boxShadow: isAiPaneOpen ? '-20px 0 60px rgba(0,0,0,0.3)' : 'none', position: 'relative', height: '100%', transition: 'all 500ms cubic-bezier(0.23,1,0.32,1)' }}>
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
              { label: 'Pinaka', active: prepStep === 5 && currentModel === 'pinaka', action: () => { setCurrentModel('pinaka'); setActiveSessionId(null); ctxSetPrepStep(5); ctxSetActiveView('terminal'); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
              { label: 'Trishul', active: prepStep === 5 && currentModel === 'trishul', action: () => { setCurrentModel('trishul'); setActiveSessionId(null); ctxSetPrepStep(5); ctxSetActiveView('trishul'); ctxSetIsLoggerOpen(false); setIsAiPaneOpen(false); } },
            ] as Array<{ label: string; active: boolean; action: () => void }>).map((nav) => (
              <button key={nav.label} onClick={() => { nav.action(); dispatch({ type: 'ui/setMobileMenuOpen', payload: false }); }} className="text-3xl font-black uppercase tracking-widest transition-all" style={{ color: nav.active ? 'var(--accent)' : 'var(--text-1)' }}>{nav.label}</button>
            ))}
          </div>
        </div>
      )}

      {forkModalState.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '24px', width: '320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-1)' }}>Fork Session</div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)' }}>Enter new trade name for the fork:</div>
            <input 
              type="text" 
              value={forkInputName} 
              onChange={e => setForkInputName(e.target.value)} 
              placeholder={forkModalState.defaultName}
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px', color: 'var(--text-1)', fontSize: '12px', outline: 'none' }}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmFork();
                if (e.key === 'Escape') setForkModalState({ ...forkModalState, isOpen: false });
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button 
                onClick={() => setForkModalState({ ...forkModalState, isOpen: false })}
                style={{ height: '28px', padding: '0 12px', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-3)' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmFork}
                style={{ height: '28px', padding: '0 12px', borderRadius: '4px', border: '1px solid var(--accent)', background: 'var(--accent-bg)', cursor: 'pointer', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--accent)' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <GlobalOverlay />
    </div>
  );
}
