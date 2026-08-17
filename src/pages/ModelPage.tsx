// ModelPage — the Pinaka/Trishul trading-model showcase page (spec cards + slides).

import { useState, useEffect, useMemo, useRef } from 'react';
import Footer from '../components/Layout/Footer';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ModelPageData } from '../utils/modelData';
import { TradeLog } from '../types';
import { useNetra } from '../context/NetraContext';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from '../hooks/useNetraUtils';
import { fmtDate, SortIcon } from './modelPage/helpers';
import { PageGraphics } from '../components/UI/PageGraphics';
import { buildForkName } from '../utils/forkNaming';

interface Props {
  model: ModelPageData;
  onBack: () => void;
  fetchLogs: (modelId: string) => void;
  resumeSession: (log: TradeLog) => void;
  forkSession: (log: TradeLog, name: string) => Promise<boolean>;
  onView?: (log: TradeLog) => void;
  initializeMission?: () => void;
  deleteTradeLog?: (id: string) => void;
  downloadCSV?: (modelId: string) => void;
  isDownloading?: boolean;
}

export default function ModelPage({ model, onBack, fetchLogs, resumeSession, forkSession, onView, initializeMission, deleteTradeLog, downloadCSV, isDownloading }: Props) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCommand, setFilterCommand] = useState('all');
  const [nameColumnWidth, setNameColumnWidth] = useState(180);
  const nameResizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const tradeLogs = useSelector((s: RootState) => s.logs.tradeLogs);
  const modelTradeLogs = useMemo(() => tradeLogs.filter(log => {
    const storedModel = log.model_id || ((log as unknown as { metadata?: { model_id?: string } }).metadata?.model_id) || 'pinaka';
    return storedModel.toLowerCase() === model.id.toLowerCase();
  }), [tradeLogs, model.id]);
  const { session } = useNetra();
  const { getAuthHeaders } = useNetraUtils();
  const username = session?.userName || '';

  const [dailyStats, setDailyStats]     = useState<Record<string, any> | null>(null);
  const [rangeStats, setRangeStats]     = useState<Record<string, any> | null>(null);
  const [statsTab, setStatsTab]         = useState<'today' | 'week' | 'month' | '3month' | 'all'>('all');
  const [statsDate, setStatsDate]       = useState(new Date().toISOString().slice(0, 10));
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsUser, setStatsUser]       = useState('');

  useEffect(() => { fetchLogs(model.id); }, [model.id, fetchLogs]);
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % model.slides.length), 6000);
    return () => clearInterval(t);
  }, [model.slides.length]);

  const [availableUsers, setAvailableUsers] = useState<string[]>([]);

  // Seed statsUser once session is known; don't override if user manually picked someone
  useEffect(() => {
    if (username && !statsUser) setStatsUser(username);
  }, [username]);

  // Fetch all operators across all models
  useEffect(() => {
    fetch(`${API_BASE}/api/users`, { headers: getAuthHeaders() })
      .then(r => r.json())
      .then((users: string[]) => {
        const merged = Array.from(new Set([...(username ? [username] : []), ...users]));
        setAvailableUsers(merged);
      })
      .catch(() => {
        if (username) setAvailableUsers([username]);
      });
  }, [username, getAuthHeaders]);

  useEffect(() => {
    const target = statsUser || username;
    if (!target) return;
    const controller = new AbortController();
    let current = true;
    setStatsLoading(true);
    const rangeKey = statsTab === 'today' ? 'week' : statsTab;
    const headers = getAuthHeaders();
    Promise.all([
      fetch(`${API_BASE}/api/stats/daily?model_id=${model.id}&username=${encodeURIComponent(target)}&date=${statsDate}`, { headers, signal: controller.signal }).then(r => r.json()),
      fetch(`${API_BASE}/api/stats/range?model_id=${model.id}&username=${encodeURIComponent(target)}&range=${rangeKey}`, { headers, signal: controller.signal }).then(r => r.json()),
    ]).then(([daily, range]) => {
      if (!current) return;
      if (String(daily?.model_id || '').toLowerCase() === model.id.toLowerCase()) setDailyStats(daily);
      if (String(range?.model_id || '').toLowerCase() === model.id.toLowerCase()) setRangeStats(range);
    }).catch(error => {
      if (error?.name !== 'AbortError') console.error(error);
    }).finally(() => {
      if (current) setStatsLoading(false);
    });
    return () => {
      current = false;
      controller.abort();
    };
  }, [model.id, statsUser, username, statsDate, statsTab, getAuthHeaders]);

  const slide = model.slides[slideIdx];
  const { color } = model;

  const BOX_SHADOW = '0 4px 40px rgba(0,0,0,0.08)';
  const HERO_BG = model.id === 'pinaka' ? '#eef2ff' : '#fdf6ee';
  const STATS_BG = '#ffffff';
  const LEDGER_BG = '#f5f4f0';

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const getLogOperator = (log: TradeLog) =>
    log.created_by || log.username || (log.phase1?.username as string | undefined) || '';

  const getLogAsset = (log: TradeLog) => {
    const canonicalTrade = ((log.phase_9 as Record<string, any> | undefined)?.trade_1?.trade || {}) as Record<string, any>;
    return String(
      log.assetName
      || log.phase2?.trading_asset
      || log.phase2?.asset_ticker
      || log.phase1?.assetName
      || log.phase1?.asset_ticker
      || log.asset
      || canonicalTrade.thesis_asset
      || canonicalTrade.execution_instrument
      || '',
    );
  };

  const getSessionCommand = (log: TradeLog) => String(log.phase6?.command || log.session_state?.finalCommand || '—');
  const getSessionStep = (log: TradeLog) => Number(log.highestStep ?? log.session_state?.highestStep ?? 1);
  const getSessionProgress = (log: TradeLog) => {
    const step = getSessionStep(log);
    return ({ 0: 'Chart Analysis', 1: 'Super HTF', 2: 'HTF Mapping', 3: 'Market Pulse', 4: 'Decision Path', 5: 'Trading Data', 6: 'Maya Terminal Audit' } as Record<number, string>)[step] || `Step ${step}`;
  };
  const getBranch = (log: TradeLog) => (log.branch || {}) as Record<string, any>;
  const getForkPoint = (log: TradeLog) => String(getBranch(log).fork?.label || 'Root Session');
  const getSessionStatus = (log: TradeLog) => {
    if (log.auditor || log.phase10) return 'Audited';
    if (getSessionStep(log) >= 5 || (log.phase9?.length || Object.keys(log.phase_9 || {}).length)) return 'Trading Data';
    return 'In Progress';
  };

  const allCommands = Array.from(new Set(modelTradeLogs.map(l => getSessionCommand(l).toUpperCase()).filter(command => command !== '—'))).sort();
  const hasActiveFilter = filterCommand !== 'all' || search !== '';

  const clearFilters = () => { setFilterCommand('all'); setSearch(''); };

  const isWithinSelectedRange = (timestamp?: string) => {
    if (statsTab === 'all') return true;
    if (!timestamp) return false;

    const tradeDate = timestamp.slice(0, 10);
    if (statsTab === 'today') return tradeDate === statsDate;

    const daysByRange = { week: 7, month: 30, '3month': 90 } as const;
    const days = daysByRange[statsTab];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const from = new Date(today);
    from.setDate(today.getDate() - days);
    return new Date(timestamp) >= from && new Date(timestamp) <= today;
  };

  const filteredLogs = modelTradeLogs
    .filter(l => {
      if (search) {
        const s = search.toLowerCase();
        const asset = getLogAsset(l).toLowerCase();
        const command = getSessionCommand(l).toLowerCase();
        const forkPoint = getForkPoint(l).toLowerCase();
        const creator = getLogOperator(l).toLowerCase();
        if (!asset.includes(s) && !command.includes(s) && !forkPoint.includes(s) && !creator.includes(s) && !fmtDate(l.timestamp).toLowerCase().includes(s) && !(l.name || '').toLowerCase().includes(s)) return false;
      }
      const selectedUser = statsUser || username;
      if (selectedUser && selectedUser !== 'all') {
        const creator = getLogOperator(l).toLowerCase();
        if (creator !== selectedUser.toLowerCase()) return false;
      }
      if (!isWithinSelectedRange(l.timestamp)) return false;
      if (filterCommand !== 'all') {
        const cmd = getSessionCommand(l).toUpperCase();
        if (cmd !== filterCommand) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let va: string | number = 0, vb: string | number = 0;
      if (sortCol === 'date') { va = new Date(a.timestamp).getTime(); vb = new Date(b.timestamp).getTime(); }
      else if (sortCol === 'asset') { va = getLogAsset(a); vb = getLogAsset(b); }
      else if (sortCol === 'command') { va = getSessionCommand(a); vb = getSessionCommand(b); }
      else if (sortCol === 'progress') { va = getSessionStep(a); vb = getSessionStep(b); }
      else if (sortCol === 'fork') { va = getForkPoint(a); vb = getForkPoint(b); }
      else if (sortCol === 'branch') { va = getBranch(a).parent_session_id ? 'Fork' : 'Root'; vb = getBranch(b).parent_session_id ? 'Fork' : 'Root'; }
      else if (sortCol === 'status') { va = getSessionStatus(a); vb = getSessionStatus(b); }
      else if (sortCol === 'created_by') { va = getLogOperator(a); vb = getLogOperator(b); }
      else if (sortCol === 'name') { va = a.name || ''; vb = b.name || ''; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const commandCounts = modelTradeLogs.reduce<Record<string, number>>((counts, log) => {
    const command = getSessionCommand(log).toUpperCase();
    if (command !== '—') counts[command] = (counts[command] || 0) + 1;
    return counts;
  }, {});
  const commandEntries = Object.entries(commandCounts).sort((a, b) => b[1] - a[1]);
  const rootSessionCount = modelTradeLogs.filter(log => !getBranch(log).parent_session_id).length;
  const forkedSessionCount = modelTradeLogs.length - rootSessionCount;
  const ledgerGridTemplate = `${nameColumnWidth}px 90px 110px 90px 105px 115px 130px 80px 105px minmax(160px, 1fr)`;
  const ledgerMinWidth = nameColumnWidth + 1077;

  return (
    <div style={{ background: '#eef0f5', flex: 1, position: 'relative', overflowX: 'hidden' }}>
      <PageGraphics variant={model.id === 'pinaka' ? 'model-pinaka' : 'model-trishul'} accent={color} opacity={1} />

      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '40px 48px 0', position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ marginBottom: '48px', paddingBottom: '28px', borderBottom: `1px solid ${color}35` }}>

          {/* Row 1: Back */}
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', padding: 0, marginBottom: '16px' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>

          {/* Row 2: Big model name */}
          <div style={{ marginBottom: '12px' }}>
            <span style={{ fontSize: '80px', fontWeight: 950, color, textTransform: 'uppercase', letterSpacing: '-0.05em', lineHeight: 0.88 }}>{model.name}</span>
          </div>

          {/* Row 3: Subtitle + all boxes */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', letterSpacing: '0.02em' }}>{model.type}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {initializeMission && (
                <button
                  onClick={initializeMission}
                  style={{ height: '34px', padding: '0 20px', background: '#4169E1', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#ffffff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 150ms' }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Start Trading Session
                </button>
              )}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', border: `1px solid ${color}60`, padding: '5px 16px', background: `${color}18` }}>
                <div style={{ width: '5px', height: '5px', background: color }} />
                <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color }}>{model.code} · {model.type}</span>
              </div>
              {model.status === 'planning' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #d9770660', padding: '5px 14px', background: '#ece8df' }}>
                  <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#d97706' }}>In Development</span>
                </div>
              )}
              {model.status === 'live' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid #10b98160', padding: '5px 14px', background: '#d1fae5' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#059669' }}>Live</span>
                </div>
              )}
            </div>
          </div>
        </div>


        {/* ── SECTION 1: HERO SLIDER ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ background: HERO_BG, boxShadow: BOX_SHADOW, minHeight: '520px', display: 'flex', overflow: 'hidden' }}>

            {/* Left — image with diagonal clip */}
            <div style={{ position: 'relative', flexShrink: 0, width: '42%', clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)', overflow: 'hidden' }}>
              <img src={model.image} alt={model.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)' }} />
              <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '52px 56px 52px 52px' }}>
                <div style={{ height: '2px', background: color, width: '56px' }} />
              </div>
            </div>

            {/* Right — slide text */}
            <div style={{ flex: 1, padding: '60px 64px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color: slide.accent, marginBottom: '20px' }}>{slide.label}</div>
                <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 28px 0' }}>{slide.heading}</h2>
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#475569', lineHeight: 1.8, margin: 0, maxWidth: '560px' }}>{slide.body}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '40px' }}>
                {model.slides.map((_, i) => (
                  <button key={i} onClick={() => setSlideIdx(i)} style={{ width: i === slideIdx ? '32px' : '6px', height: '4px', borderRadius: '2px', background: i === slideIdx ? color : `${color}50`, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 400ms ease' }} />
                ))}
                <span style={{ marginLeft: '12px', fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: 'rgba(15,23,42,0.4)', letterSpacing: '0.1em' }}>
                  {String(slideIdx + 1).padStart(2, '0')} / {String(model.slides.length).padStart(2, '0')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 2: STATS + PARAMS ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ background: STATS_BG, boxShadow: BOX_SHADOW }}>
            <div style={{ height: '4px', background: color }} />

            {/* Tab bar */}
            <div style={{ padding: '0 28px', borderBottom: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex' }}>
                {([
                  { key: 'today', label: 'Today' },
                  { key: 'week',  label: '1 Week' },
                  { key: 'month', label: '1 Month' },
                  { key: '3month', label: '3 Months' },
                  { key: 'all', label: 'All' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setStatsTab(tab.key)}
                    style={{ height: '44px', padding: '0 18px', background: 'none', border: 'none', borderBottom: statsTab === tab.key ? `2px solid ${color}` : '2px solid transparent', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: statsTab === tab.key ? color : 'rgba(15,23,42,0.4)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms', marginBottom: '-1px' }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* User selector — always visible */}
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${color}30`, padding: '4px 10px', background: `${color}06` }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  <select
                    value={statsUser}
                    onChange={e => setStatsUser(e.target.value)}
                    style={{ fontSize: '9px', fontWeight: 700, border: 'none', background: 'transparent', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace', outline: 'none', cursor: 'pointer', appearance: 'none', paddingRight: '16px', minWidth: '80px' }}
                  >
                    <option value="all">All</option>
                    {(availableUsers.length > 0 ? availableUsers : (username ? [username] : [])).map(u => (
                      <option key={u} value={u}>{u}{u === username ? ' (you)' : ''}</option>
                    ))}
                  </select>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.4)" strokeWidth="2.5" style={{ pointerEvents: 'none', position: 'absolute', right: '8px' }}><path d="M6 9l6 6 6-6"/></svg>
                </div>
                {statsTab === 'today' && (
                  <input
                    type="date" value={statsDate} onChange={e => setStatsDate(e.target.value)}
                    style={{ fontSize: '9px', fontWeight: 600, border: `1px solid ${color}30`, padding: '4px 10px', color: '#0f172a', fontFamily: 'JetBrains Mono, monospace', outline: 'none', background: `${color}06`, cursor: 'pointer' }}
                  />
                )}
                {statsTab !== 'today' && rangeStats && (
                  <span style={{ fontSize: '9px', fontWeight: 600, fontFamily: 'monospace', color: 'rgba(15,23,42,0.3)' }}>{rangeStats.from_date} → {rangeStats.to_date}</span>
                )}
              </div>
            </div>

            {/* TODAY content */}
            {statsTab === 'today' && (
              !dailyStats ? (
                <div style={{ padding: '40px 28px', textAlign: 'center', color: 'rgba(15,23,42,0.3)', fontSize: '11px' }}>{statsLoading ? 'Loading…' : 'No data'}</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', borderBottom: `1px solid ${color}18` }}>
                    {[
                      { label: 'Sessions',  value: String(dailyStats.total ?? '—') },
                      { label: 'Open',      value: String(dailyStats.open  ?? '—'), color: '#f59e0b' },
                      { label: 'Closed',    value: String(dailyStats.closed ?? '—') },
                      { label: 'Wins',      value: String(dailyStats.wins  ?? '—'), color: '#10b981' },
                      { label: 'Losses',    value: String(dailyStats.losses ?? '—'), color: '#ef4444' },
                      { label: 'Win Rate',  value: dailyStats.win_rate !== null ? `${dailyStats.win_rate}%` : '—', color },
                    ].map((s, i, arr) => (
                      <div key={s.label} style={{ padding: '24px 28px', borderRight: i < arr.length - 1 ? `1px solid ${color}18` : 'none' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.45)', marginBottom: '10px' }}>{s.label}</div>
                        <div style={{ fontSize: '36px', fontWeight: 950, color: s.color || (s.value === '—' ? 'rgba(15,23,42,0.2)' : '#0f172a'), letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'monospace' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: `1px solid ${color}18` }}>
                    <div style={{ padding: '20px 28px', borderRight: `1px solid ${color}18` }}>
                      <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.45)', marginBottom: '8px' }}>Total P&L</div>
                      <div style={{ fontSize: '28px', fontWeight: 950, fontFamily: 'monospace', letterSpacing: '-0.03em', color: dailyStats.total_pnl === null ? 'rgba(15,23,42,0.2)' : dailyStats.total_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                        {dailyStats.total_pnl === null ? '—' : dailyStats.total_pnl >= 0 ? `+₹${dailyStats.total_pnl.toFixed(0)}` : `-₹${Math.abs(dailyStats.total_pnl).toFixed(0)}`}
                      </div>
                    </div>
                    <div style={{ padding: '20px 28px', borderRight: `1px solid ${color}18` }}>
                      <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.45)', marginBottom: '8px' }}>Best Trade</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, fontFamily: 'monospace', color: '#10b981' }}>{dailyStats.best_trade ? `+₹${Number(dailyStats.best_trade.pnl).toFixed(0)}` : '—'}</div>
                      {dailyStats.best_trade?.name && <div style={{ fontSize: '10px', color: 'rgba(15,23,42,0.4)', marginTop: '3px' }}>{dailyStats.best_trade.name}</div>}
                    </div>
                    <div style={{ padding: '20px 28px' }}>
                      <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#f59e0b', marginBottom: '8px' }}>Open Positions</div>
                      {dailyStats.open_trades?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {dailyStats.open_trades.map((t: any) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>{t.asset || '—'}</span>
                              {t.weapon && <span style={{ fontSize: '9px', fontWeight: 800, color, textTransform: 'uppercase' }}>{t.weapon}</span>}
                              {t.direction && <span style={{ fontSize: '9px', color: 'rgba(15,23,42,0.4)', textTransform: 'uppercase' }}>{t.direction}</span>}
                            </div>
                          ))}
                        </div>
                      ) : <span style={{ fontSize: '10px', color: 'rgba(15,23,42,0.3)', fontStyle: 'italic' }}>None</span>}
                    </div>
                  </div>
                </>
              )
            )}

            {/* RANGE content */}
            {statsTab !== 'today' && (
              !rangeStats ? (
                <div style={{ padding: '40px 28px', textAlign: 'center', color: 'rgba(15,23,42,0.3)', fontSize: '11px' }}>{statsLoading ? 'Loading…' : 'No data'}</div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${color}18` }}>
                    {[
                      { label: 'Total',         value: String(rangeStats.total ?? '—') },
                      { label: 'Win Rate',       value: rangeStats.win_rate !== null ? `${rangeStats.win_rate}%` : '—', color },
                      { label: 'Total P&L',      value: rangeStats.total_pnl !== null ? (rangeStats.total_pnl >= 0 ? `+₹${Number(rangeStats.total_pnl).toFixed(0)}` : `-₹${Math.abs(rangeStats.total_pnl).toFixed(0)}`) : '—', color: rangeStats.total_pnl !== null ? (rangeStats.total_pnl >= 0 ? '#10b981' : '#ef4444') : undefined },
                      { label: 'Profit Factor',  value: rangeStats.profit_factor !== null ? String(rangeStats.profit_factor) : '—', color: (rangeStats.profit_factor ?? 0) >= 1 ? '#10b981' : '#ef4444' },
                      { label: 'Streak',         value: rangeStats.streak === 0 ? '—' : rangeStats.streak > 0 ? `${rangeStats.streak}W` : `${Math.abs(rangeStats.streak)}L`, color: rangeStats.streak > 0 ? '#10b981' : rangeStats.streak < 0 ? '#ef4444' : '#94a3b8' },
                    ].map((s, i, arr) => (
                      <div key={s.label} style={{ padding: '24px 28px', borderRight: i < arr.length - 1 ? `1px solid ${color}18` : 'none' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.45)', marginBottom: '10px' }}>{s.label}</div>
                        <div style={{ fontSize: '36px', fontWeight: 950, color: s.color || (s.value === '—' ? 'rgba(15,23,42,0.2)' : '#0f172a'), letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'monospace' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${color}18` }}>
                    {[
                      { label: 'Avg Win',    value: rangeStats.avg_win    !== null ? `₹${Number(rangeStats.avg_win).toFixed(0)}`    : '—', color: '#10b981' },
                      { label: 'Avg Loss',   value: rangeStats.avg_loss   !== null ? `₹${Number(rangeStats.avg_loss).toFixed(0)}`   : '—', color: '#ef4444' },
                      { label: 'Expectancy', value: rangeStats.expectancy !== null ? `₹${Number(rangeStats.expectancy).toFixed(0)}` : '—', color: (rangeStats.expectancy ?? 0) >= 0 ? '#10b981' : '#ef4444' },
                      { label: 'Open Now',   value: String(rangeStats.open ?? '—'), color: '#f59e0b' },
                    ].map((s, i, arr) => (
                      <div key={s.label} style={{ padding: '20px 28px', borderRight: i < arr.length - 1 ? `1px solid ${color}18` : 'none' }}>
                        <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.45)', marginBottom: '8px' }}>{s.label}</div>
                        <div style={{ fontSize: '28px', fontWeight: 950, fontFamily: 'monospace', letterSpacing: '-0.03em', color: s.color || (s.value === '—' ? 'rgba(15,23,42,0.2)' : '#0f172a') }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}

            {/* Row 2: Session command and branch summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${color}20` }}>
              <div style={{ padding: '24px 28px', borderRight: `1px solid ${color}20` }}>
                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color, marginBottom: '16px' }}>Command Distribution</div>
                {commandEntries.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'rgba(15,23,42,0.3)', fontStyle: 'italic' }}>No data yet</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {commandEntries.map(([cmd, total]) => {
                      const pct = modelTradeLogs.length > 0 ? Math.round((total / modelTradeLogs.length) * 100) : 0;
                      return (
                        <div key={cmd} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em', color: '#0f172a', minWidth: '110px', textTransform: 'uppercase' }}>{cmd}</span>
                          <div style={{ flex: 1, height: '4px', background: `${color}20`, borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 600ms ease' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', minWidth: '72px', textAlign: 'right' }}>{total} <span style={{ fontSize: '9px', color: 'rgba(15,23,42,0.4)', fontWeight: 600 }}>sessions</span></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div style={{ padding: '24px 28px' }}>
                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color, marginBottom: '16px' }}>Branch Summary</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '32px' }}>
                  <div><span style={{ fontSize: '36px', fontWeight: 950, color, fontFamily: 'monospace' }}>{rootSessionCount}</span><span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Roots</span></div>
                  <div><span style={{ fontSize: '36px', fontWeight: 950, color, fontFamily: 'monospace' }}>{forkedSessionCount}</span><span style={{ marginLeft: '8px', fontSize: '10px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Forks</span></div>
                </div>
              </div>
            </div>

            {/* Model params grid */}
            <div style={{ padding: '28px 28px' }}>
              <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color, marginBottom: '16px' }}>Model Parameters</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0' }}>
                {model.params.map((p, i) => (
                  <div key={p.label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', padding: '10px 0', borderBottom: `1px solid ${color}20`, gap: '16px', alignItems: 'baseline', gridColumn: undefined }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(15,23,42,0.5)' }}>{p.label}</span>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{p.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: TRADE LEDGER ── */}
        <div>
          <div style={{ background: LEDGER_BG, boxShadow: BOX_SHADOW }}>

            {/* Ledger header */}
            <div style={{ padding: '18px 28px', borderBottom: `1px solid ${color}18` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color, flexShrink: 0 }}>Terminal Sessions</span>

                {/* Search */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="2" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search session, asset, command, fork point..." style={{ width: '100%', height: '30px', paddingLeft: '28px', paddingRight: '10px', border: `1px solid ${color}22`, background: `${color}06`, outline: 'none', fontSize: '11px', color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>

                {/* Filter button + dropdown */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={() => setFilterOpen(o => !o)}
                    style={{ height: '30px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${hasActiveFilter ? color : 'rgba(15,23,42,0.18)'}`, background: hasActiveFilter ? `${color}10` : '#ffffff', color: hasActiveFilter ? color : 'rgba(15,23,42,0.5)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', transition: 'all 150ms' }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
                    Filter
                    {hasActiveFilter && <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: color, flexShrink: 0 }} />}
                  </button>

                  {filterOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 10 }} onClick={() => setFilterOpen(false)} />
                      <div style={{ position: 'absolute', top: '36px', right: 0, width: '280px', background: '#ffffff', border: `1px solid ${color}28`, padding: '16px', zIndex: 20, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>

                        {/* Command */}
                        {allCommands.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.4)', marginBottom: '8px' }}>Command</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(['all', ...allCommands]).map(v => {
                                const active = filterCommand === v;
                                return <button key={v} onClick={() => setFilterCommand(v)} style={{ height: '24px', padding: '0 10px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${active ? color : 'rgba(15,23,42,0.15)'}`, background: active ? `${color}12` : 'transparent', color: active ? color : 'rgba(15,23,42,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}>{v === 'all' ? 'All' : v}</button>;
                              })}
                            </div>
                          </div>
                        )}

	                        {/* Clear */}
                        {hasActiveFilter && (
                          <button onClick={() => { clearFilters(); setFilterOpen(false); }} style={{ width: '100%', height: '28px', marginTop: '4px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.05)', color: '#ef4444', cursor: 'pointer', fontFamily: 'inherit' }}>
                            ✕ Clear All Filters
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Download CSV */}
                {downloadCSV && (
                  <button
                    onClick={() => downloadCSV(model.id)}
                    disabled={isDownloading || modelTradeLogs.length === 0}
                    style={{ height: '30px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${color}38`, background: `${color}08`, color, cursor: modelTradeLogs.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', transition: 'all 150ms', opacity: isDownloading || modelTradeLogs.length === 0 ? 0.45 : 1, flexShrink: 0 }}
                    onMouseEnter={e => { if (!isDownloading && modelTradeLogs.length > 0) e.currentTarget.style.background = `${color}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {isDownloading ? 'Exporting…' : 'Export CSV'}
                  </button>
                )}

                <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: 'rgba(15,23,42,0.35)', flexShrink: 0 }}>{filteredLogs.length} scoped / {modelTradeLogs.length} total</span>
              </div>
            </div>

            {filteredLogs.length === 0 && modelTradeLogs.length === 0 ? (
              <div style={{ padding: '80px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.3 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>No terminal sessions recorded yet</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '60px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>No sessions match the selected scope</span>
              </div>
            ) : (
              <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', scrollbarGutter: 'stable' }}>
                {/* Column headers (sortable) */}
                <div style={{ display: 'grid', gridTemplateColumns: ledgerGridTemplate, minWidth: `${ledgerMinWidth}px`, boxSizing: 'border-box', padding: '10px 28px', borderBottom: `1px solid ${color}20`, gap: '8px', background: `${color}08` }}>
                  {([
                    { key: 'name', label: 'Name' },
                    { key: 'created_by', label: 'Operator' },
                    { key: 'date', label: 'Date' },
                    { key: 'asset', label: 'Asset' },
                    { key: 'command', label: 'Command' },
                    { key: 'progress', label: 'Progress' },
                    { key: 'fork', label: 'Fork Point' },
                    { key: 'branch', label: 'Branch' },
                    { key: 'status', label: 'Status' },
                    { key: '', label: '' },
                  ] as { key: string; label: string }[]).map(h => (
                    <button
                      key={h.key || 'actions'}
                      onClick={() => h.key && handleSort(h.key)}
                      style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: 0, cursor: h.key ? 'pointer' : 'default', textAlign: 'left', minWidth: 0 }}
                    >
                      <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: sortCol === h.key ? color : 'rgba(15,23,42,0.45)' }}>{h.label}</span>
                      {h.key && <SortIcon col={h.key} active={sortCol === h.key} dir={sortDir} />}
                      {h.key === 'name' && (
                        <span
                          role="separator"
                          aria-label="Resize name column"
                          aria-orientation="vertical"
                          title="Drag to resize · Double-click to reset"
                          onClick={event => event.stopPropagation()}
                          onDoubleClick={event => { event.stopPropagation(); setNameColumnWidth(180); }}
                          onPointerDown={event => {
                            event.preventDefault();
                            event.stopPropagation();
                            nameResizeRef.current = { startX: event.clientX, startWidth: nameColumnWidth };
                            event.currentTarget.setPointerCapture(event.pointerId);
                          }}
                          onPointerMove={event => {
                            const resize = nameResizeRef.current;
                            if (!resize) return;
                            setNameColumnWidth(Math.max(100, Math.min(520, resize.startWidth + event.clientX - resize.startX)));
                          }}
                          onPointerUp={event => {
                            nameResizeRef.current = null;
                            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
                          }}
                          onPointerCancel={() => { nameResizeRef.current = null; }}
                          style={{ position: 'absolute', top: '-10px', right: '-5px', bottom: '-10px', width: '10px', cursor: 'col-resize', touchAction: 'none', zIndex: 2 }}
                        >
                          <span style={{ position: 'absolute', top: '3px', bottom: '3px', left: '4px', width: '1px', background: `${color}55` }} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {filteredLogs.map((log, rowIdx) => {
                  const isExpanded = expandedId === log.id;
                  const branch = getBranch(log);
                  const isFork = !!branch.parent_session_id;
                  const accentLine = isFork ? color : 'transparent';
                  const cmd = getSessionCommand(log);
                  const progress = getSessionProgress(log);
                  const status = getSessionStatus(log);

                  return (
                    <div key={log.id}>
                      {/* Main row */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                        style={{ display: 'grid', gridTemplateColumns: ledgerGridTemplate, minWidth: `${ledgerMinWidth}px`, boxSizing: 'border-box', padding: '13px 28px', borderBottom: `1px solid ${color}0e`, gap: '8px', alignItems: 'center', borderLeft: `3px solid ${accentLine}`, background: isExpanded ? `${color}12` : (rowIdx % 2 === 0 ? `${color}0d` : LEDGER_BG), transition: 'background 150ms', cursor: 'pointer' }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = `${color}16`; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = rowIdx % 2 === 0 ? `${color}0d` : LEDGER_BG; }}
                      >
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.name || '—'}>{log.name || '—'}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getLogOperator(log) || '—'}>{getLogOperator(log) || '—'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{fmtDate(log.timestamp)}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getLogAsset(log) || '—'}>{getLogAsset(log) || '—'}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={progress}>{progress}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={getForkPoint(log)}>{getForkPoint(log)}</span>
                        <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: isFork ? color : '#64748b' }} title={isFork ? String(branch.parent_session_id) : 'Root session'}>{isFork ? 'Fork' : 'Root'}</span>
                        <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.06em', color: status === 'Audited' ? '#10b981' : status === 'Trading Data' ? color : '#f59e0b' }}>{status}</span>

                        {/* Action buttons */}
                        <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* Resume */}
                          <button
                            onClick={() => resumeSession(log)}
                            style={{ height: '22px', padding: '0 8px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.08)', color: '#059669', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                          >
                            Resume
                          </button>
                          {/* Fork */}
                          <button
                            onClick={() => {
                              const name = window.prompt('Fork name:', buildForkName(log.name || String(log.id), 'Manual Branch')) ?? '';
                              if (name) void forkSession(log, name);
                            }}
                            style={{ height: '22px', padding: '0 8px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${color}38`, background: `${color}10`, color, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                            onMouseEnter={e => { e.currentTarget.style.background = `${color}25`; }}
                            onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; }}
                          >
                            Fork
                          </button>
                          {/* Delete */}
                          {deleteTradeLog && (
                            <button
                              onClick={() => deleteTradeLog(log.id)}
                              title="Delete"
                              style={{ width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', transition: 'all 150ms', flexShrink: 0 }}
                              onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.06)'; e.currentTarget.style.color = '#ef4444'; }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <div style={{ minWidth: `${ledgerMinWidth}px`, boxSizing: 'border-box', padding: '16px 28px 20px 31px', borderBottom: `1px solid ${color}15`, background: `${color}05`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px' }}>
                          {[
                            { label: 'Session Name', value: log.name || '—' },
                            { label: 'Command', value: cmd },
                            { label: 'Session ID', value: String(log.id) },
                            { label: 'Model', value: log.model_id || model.id },
                            { label: 'Operator', value: getLogOperator(log) || '—' },
                            { label: 'Progress', value: progress },
                            { label: 'Fork Point', value: getForkPoint(log) },
                            { label: 'Branch Type', value: isFork ? 'Forked Session' : 'Root Session' },
                            { label: 'Parent Session ID', value: branch.parent_session_id ? String(branch.parent_session_id) : '—' },
                            { label: 'Root Session ID', value: branch.root_session_id ? String(branch.root_session_id) : String(log.id) },
                            { label: 'Status', value: status },
                            { label: 'Created At', value: log.timestamp || '—' },
                          ].map(item => (
                            <div key={item.label}>
                              <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.45)', marginBottom: '4px' }}>{item.label}</div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
      <Footer accentColor={color} />
    </div>
  );
}
