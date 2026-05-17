import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ModelPageData } from '../../utils/modelData';
import { TradeLog } from '../../types';

interface Props {
  model: ModelPageData;
  onBack: () => void;
  fetchLogs: (modelId: string) => void;
  resumeSession: (log: TradeLog) => void;
  forkSession: (log: TradeLog, name: string) => void;
  onView?: (log: TradeLog) => void;
  initializeMission?: () => void;
  deleteTradeLog?: (id: number) => void;
  downloadCSV?: () => void;
  isDownloading?: boolean;
}

function HeptagonCorner({ corner, color, size }: { corner: 'tr' | 'bl'; color: string; size: number }) {
  const radii = [70, 130, 195, 265, 335, 405, 470];
  if (corner === 'tr') {
    return (
      <div style={{ position: 'fixed', top: 0, right: 0, width: size, height: size, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
          {radii.map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => {
              const a = (-90 + k * (360 / 7)) * Math.PI / 180;
              return `${(size + r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
            }).join(' ');
            const sw = [5, 3.5, 2.5, 2, 1.5, 1, 0.7][i];
            const so = [1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.08][i];
            const fills = [`${color}21`, `${color}11`, `${color}07`, 'none', 'none', 'none', 'none'];
            return <polygon key={r} points={pts} stroke={color} strokeWidth={sw} strokeOpacity={so} fill={fills[i]} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
          <circle cx={size} cy={0} r="9" fill={color} fillOpacity="0.9" />
          <circle cx={size} cy={0} r="18" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
          <circle cx={size - 110} cy={110} r="5" fill={color} fillOpacity="0.5" />
        </svg>
      </div>
    );
  }
  return (
    <div style={{ position: 'fixed', bottom: 0, left: 0, width: size, height: size, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
        {radii.map((r, i) => {
          const pts = Array.from({ length: 7 }, (_, k) => {
            const a = (90 + k * (360 / 7)) * Math.PI / 180;
            return `${(r * Math.cos(a)).toFixed(1)},${(size + r * Math.sin(a)).toFixed(1)}`;
          }).join(' ');
          const sw = [5, 3.5, 2.5, 2, 1.5, 1, 0.7][i];
          const so = [1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.08][i];
          const fills = [`${color}21`, `${color}11`, `${color}07`, 'none', 'none', 'none', 'none'];
          return <polygon key={r} points={pts} stroke={color} strokeWidth={sw} strokeOpacity={so} fill={fills[i]} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
        })}
        <circle cx={0} cy={size} r="9" fill={color} fillOpacity="0.9" />
        <circle cx={0} cy={size} r="18" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" />
        <circle cx={110} cy={size - 110} r="5" fill={color} fillOpacity="0.5" />
      </svg>
    </div>
  );
}

function computeStats(logs: TradeLog[]) {
  const total = logs.length;
  const wins = logs.filter(l => l.phase4?.outcome?.toLowerCase() === 'win').length;
  const losses = logs.filter(l => l.phase4?.outcome?.toLowerCase() === 'loss').length;
  const settled = wins + losses;
  const winPct = settled > 0 ? Math.round((wins / settled) * 100) : null;

  let totalPL = 0;
  let hasPL = false;
  logs.forEach(l => {
    const pl = parseFloat(String(l.phase4?.pl ?? ''));
    if (!isNaN(pl)) { totalPL += pl; hasPL = true; }
  });

  // Command-wise profitability
  const cmdMap: Record<string, { wins: number; total: number }> = {};
  logs.forEach(l => {
    const cmd = ((l.phase1?.protocol as string) || (l.session_state?.finalCommand as string) || 'Unknown').toUpperCase();
    if (!cmdMap[cmd]) cmdMap[cmd] = { wins: 0, total: 0 };
    cmdMap[cmd].total++;
    if (l.phase4?.outcome?.toLowerCase() === 'win') cmdMap[cmd].wins++;
  });

  // Top weapon by wins
  const weapMap: Record<string, { wins: number; total: number }> = {};
  logs.forEach(l => {
    const w = (l.phase3?.manual_weapon || l.weapon || '').toUpperCase();
    if (!w) return;
    if (!weapMap[w]) weapMap[w] = { wins: 0, total: 0 };
    weapMap[w].total++;
    if (l.phase4?.outcome?.toLowerCase() === 'win') weapMap[w].wins++;
  });
  const topWeapon = Object.entries(weapMap).sort((a, b) => b[1].wins - a[1].wins)[0] || null;

  return { total, wins, losses, winPct, settled, totalPL, hasPL, cmdMap, topWeapon };
}

function fmtDate(ts: string) {
  try { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); }
  catch { return ts; }
}

function fmtPrice(p: string | number | undefined) {
  if (p === undefined || p === '' || p === null) return '—';
  const n = parseFloat(String(p));
  return isNaN(n) ? '—' : n.toLocaleString('en-IN');
}

function SortIcon({ col, active, dir }: { col: string; active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ opacity: active ? 1 : 0.3, flexShrink: 0 }}>
      {(!active || dir === 'asc') && <path d="M5 2L8 6H2L5 2Z" fill="currentColor" opacity={active && dir === 'asc' ? 1 : 0.4} />}
      {(!active || dir === 'desc') && <path d="M5 8L8 4H2L5 8Z" fill="currentColor" opacity={active && dir === 'desc' ? 1 : 0.4} />}
    </svg>
  );
}

export default function ModelPage({ model, onBack, fetchLogs, resumeSession, forkSession, onView, initializeMission, deleteTradeLog, downloadCSV, isDownloading }: Props) {
  const [slideIdx, setSlideIdx] = useState(0);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterOutcome, setFilterOutcome] = useState('all');
  const [filterWeapon, setFilterWeapon] = useState('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterCommand, setFilterCommand] = useState('all');
  const [filterPL, setFilterPL] = useState('all');
  const tradeLogs = useSelector((s: RootState) => s.logs.tradeLogs);

  useEffect(() => { fetchLogs(model.id); }, [model.id, fetchLogs]);
  useEffect(() => {
    const t = setInterval(() => setSlideIdx(i => (i + 1) % model.slides.length), 6000);
    return () => clearInterval(t);
  }, [model.slides.length]);

  const slide = model.slides[slideIdx];
  const stats = computeStats(tradeLogs);
  const { color } = model;

  // Per-model opaque box fills — hero and stats are intentionally different shades
  const BOX_THEME: Record<string, { hero: { bg: string; border: string }; stats: { bg: string; border: string } }> = {
    pinaka:  { hero: { bg: '#e4e8f0', border: '#c8d0e0' }, stats: { bg: '#ffffff', border: '#d1d5db' } },
    trishul: { hero: { bg: '#ece8df', border: '#d8d0c4' }, stats: { bg: '#ffffff', border: '#d1d5db' } },
  };
  const boxTheme = BOX_THEME[model.id] ?? BOX_THEME.pinaka;

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const allWeapons = Array.from(new Set(tradeLogs.map(l => (l.phase3?.manual_weapon || l.weapon || '').toUpperCase()).filter(Boolean))).sort();
  const allCommands = Array.from(new Set(tradeLogs.map(l => ((l.phase1?.protocol as string) || (l.session_state?.finalCommand as string) || '').toUpperCase()).filter(Boolean))).sort();
  const hasActiveFilter = filterOutcome !== 'all' || filterWeapon !== 'all' || filterCommand !== 'all' || filterPL !== 'all' || search !== '';

  const clearFilters = () => { setFilterOutcome('all'); setFilterWeapon('all'); setFilterCommand('all'); setFilterPL('all'); setSearch(''); };

  const filteredLogs = tradeLogs
    .filter(l => {
      if (search) {
        const s = search.toLowerCase();
        const asset = (l.phase2?.asset_ticker || l.phase1?.asset_ticker || l.asset || '').toLowerCase();
        const weapon = (l.phase3?.manual_weapon || l.weapon || '').toLowerCase();
        const outcome = (l.phase4?.outcome || '').toLowerCase();
        if (!asset.includes(s) && !weapon.includes(s) && !outcome.includes(s) && !fmtDate(l.timestamp).toLowerCase().includes(s) && !(l.name || '').toLowerCase().includes(s)) return false;
      }
      if (filterOutcome !== 'all') {
        const o = (l.phase4?.outcome || '').toLowerCase();
        if (filterOutcome === 'open' && o !== '' && o !== 'open') return false;
        if (filterOutcome === 'open' && o === '' ) { /* keep */ }
        else if (filterOutcome !== 'open' && o !== filterOutcome) return false;
      }
      if (filterWeapon !== 'all') {
        const w = (l.phase3?.manual_weapon || l.weapon || '').toUpperCase();
        if (w !== filterWeapon) return false;
      }
      if (filterCommand !== 'all') {
        const cmd = ((l.phase1?.protocol as string) || (l.session_state?.finalCommand as string) || '').toUpperCase();
        if (cmd !== filterCommand) return false;
      }
      if (filterPL !== 'all') {
        const pl = parseFloat(String(l.phase4?.pl ?? ''));
        if (filterPL === 'profit' && (isNaN(pl) || pl <= 0)) return false;
        if (filterPL === 'loss'   && (isNaN(pl) || pl >= 0)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      let va: string | number = 0, vb: string | number = 0;
      if (sortCol === 'date') { va = new Date(a.timestamp).getTime(); vb = new Date(b.timestamp).getTime(); }
      else if (sortCol === 'asset') { va = a.phase2?.asset_ticker || a.phase1?.asset_ticker || a.asset || ''; vb = b.phase2?.asset_ticker || b.phase1?.asset_ticker || b.asset || ''; }
      else if (sortCol === 'weapon') { va = a.phase3?.manual_weapon || a.weapon || ''; vb = b.phase3?.manual_weapon || b.weapon || ''; }
      else if (sortCol === 'pl') { va = parseFloat(String(a.phase4?.pl || '0')) || 0; vb = parseFloat(String(b.phase4?.pl || '0')) || 0; }
      else if (sortCol === 'result') { va = a.phase4?.outcome || ''; vb = b.phase4?.outcome || ''; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const plColor = stats.totalPL > 0 ? '#10b981' : stats.totalPL < 0 ? '#ef4444' : '#0f172a';
  const cmdEntries = Object.entries(stats.cmdMap);

  return (
    <div style={{ background: '#ffffff', flex: 1, position: 'relative', overflowX: 'hidden' }}>
      <HeptagonCorner corner="tr" color={color} size={580} />
      <HeptagonCorner corner="bl" color={color} size={500} />

      <div style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '40px 48px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '48px', paddingBottom: '28px', borderBottom: `1px solid ${color}35` }}>
          <button
            onClick={onBack}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: 'inherit', padding: 0 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6" /></svg>
            Back
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {initializeMission && (
              <button
                onClick={initializeMission}
                style={{ height: '34px', padding: '0 20px', background: '#4169E1', border: 'none', cursor: 'pointer', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#ffffff', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '8px', transition: 'opacity 150ms' }}
                onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Initialize Mission
              </button>
            )}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', border: `1px solid ${color}38`, padding: '5px 16px', background: `${color}10` }}>
              <div style={{ width: '5px', height: '5px', background: color }} />
              <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.35em', color }}>{model.code} · {model.type}</span>
            </div>
            {model.status === 'planning' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(217,119,6,0.35)', padding: '5px 14px', background: '#ece8df' }}>
                <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#d97706' }}>Planning Phase</span>
              </div>
            )}
            {model.status === 'live' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(16,185,129,0.35)', padding: '5px 14px', background: '#e5ebe5' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#059669' }}>Live</span>
              </div>
            )}
          </div>
        </div>

        {/* ── SECTION 1: HERO SLIDER ── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ border: `1px solid ${boxTheme.hero.border}`, background: boxTheme.hero.bg, minHeight: '520px', display: 'flex', overflow: 'hidden' }}>

            {/* Left — image with diagonal clip */}
            <div style={{ position: 'relative', flexShrink: 0, width: '42%', clipPath: 'polygon(0 0, 100% 0, 88% 100%, 0 100%)', overflow: 'hidden' }}>
              <img src={model.image} alt={model.name} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 70%, transparent 100%)' }} />
              <div style={{ position: 'relative', zIndex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '52px 56px 52px 52px' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: '8px' }}>NETRA MODEL</div>
                <div style={{ fontSize: '88px', fontWeight: 950, letterSpacing: '-0.04em', color: '#ffffff', lineHeight: 0.85, textTransform: 'uppercase', marginBottom: '20px' }}>{model.name}</div>
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
          <div style={{ border: `1px solid ${boxTheme.stats.border}`, background: boxTheme.stats.bg }}>
            {/* Colored accent strip */}
            <div style={{ height: '4px', background: color }} />

            {/* Row 1: Core performance tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${color}22` }}>
              {[
                { label: 'Total Missions', value: stats.total > 0 ? String(stats.total) : '—', sub: null },
                { label: 'Confirmed Wins', value: stats.wins > 0 ? String(stats.wins) : '—', sub: null },
                { label: 'Win Rate', value: stats.winPct !== null ? `${stats.winPct}%` : '—', sub: null },
                { label: 'Confirmed Losses', value: stats.losses > 0 ? String(stats.losses) : '—', sub: null },
                { label: 'Total P&L', value: stats.hasPL ? (stats.totalPL >= 0 ? `+${stats.totalPL.toFixed(0)}` : String(stats.totalPL.toFixed(0))) : '—', sub: null, valueColor: stats.hasPL ? plColor : undefined },
              ].map((s, i, arr) => (
                <div key={s.label} style={{ padding: '32px 28px', borderRight: i < arr.length - 1 ? `1px solid ${color}20` : 'none' }}>
                  <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.5)', marginBottom: '12px' }}>{s.label}</div>
                  <div style={{ fontSize: '42px', fontWeight: 950, color: s.valueColor || (s.value === '—' ? 'rgba(15,23,42,0.2)' : '#0f172a'), letterSpacing: '-0.04em', lineHeight: 1, fontFamily: 'monospace' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Row 2: Command-wise profitability + Top weapon */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${color}20` }}>
              {/* Command breakdown */}
              <div style={{ padding: '24px 28px', borderRight: `1px solid ${color}20` }}>
                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color, marginBottom: '16px' }}>Command-Wise Profitability</div>
                {cmdEntries.length === 0 ? (
                  <span style={{ fontSize: '11px', color: 'rgba(15,23,42,0.3)', fontStyle: 'italic' }}>No data yet</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {cmdEntries.map(([cmd, { wins, total }]) => {
                      const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
                      return (
                        <div key={cmd} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em', color: '#0f172a', minWidth: '110px', textTransform: 'uppercase' }}>{cmd}</span>
                          <div style={{ flex: 1, height: '4px', background: `${color}20`, borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 600ms ease' }} />
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', color: '#0f172a', minWidth: '52px', textAlign: 'right' }}>{pct}% <span style={{ fontSize: '9px', color: 'rgba(15,23,42,0.4)', fontWeight: 600 }}>({wins}/{total})</span></span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top weapon */}
              <div style={{ padding: '24px 28px' }}>
                <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color, marginBottom: '16px' }}>Top Performing Weapon</div>
                {stats.topWeapon ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                      <span style={{ fontSize: '36px', fontWeight: 950, color, letterSpacing: '-0.03em', fontFamily: 'monospace' }}>{stats.topWeapon[0]}</span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981' }}>{stats.topWeapon[1].wins} wins</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ height: '4px', background: `${color}20`, borderRadius: '2px', flex: 1, overflow: 'hidden' }}>
                        <div style={{ width: `${stats.topWeapon[1].total > 0 ? Math.round((stats.topWeapon[1].wins / stats.topWeapon[1].total) * 100) : 0}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, fontFamily: 'monospace', color: 'rgba(15,23,42,0.6)' }}>
                        {stats.topWeapon[1].total > 0 ? Math.round((stats.topWeapon[1].wins / stats.topWeapon[1].total) * 100) : 0}% win rate · {stats.topWeapon[1].total} deployed
                      </span>
                    </div>
                  </div>
                ) : (
                  <span style={{ fontSize: '11px', color: 'rgba(15,23,42,0.3)', fontStyle: 'italic' }}>No data yet</span>
                )}
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
          <div style={{ border: `1px solid ${color}28`, background: '#ffffff' }}>

            {/* Ledger header */}
            <div style={{ padding: '18px 28px', borderBottom: `1px solid ${color}18` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color, flexShrink: 0 }}>Trade Ledger</span>

                {/* Search */}
                <div style={{ flex: 1, position: 'relative' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.35)" strokeWidth="2" style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset, weapon, date..." style={{ width: '100%', height: '30px', paddingLeft: '28px', paddingRight: '10px', border: `1px solid ${color}22`, background: `${color}06`, outline: 'none', fontSize: '11px', color: '#0f172a', fontFamily: 'inherit', boxSizing: 'border-box' }} />
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

                        {/* Result */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.4)', marginBottom: '8px' }}>Result</div>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {(['all', 'win', 'loss', 'open'] as const).map(v => {
                              const ac = v === 'win' ? '#10b981' : v === 'loss' ? '#ef4444' : color;
                              const active = filterOutcome === v;
                              return <button key={v} onClick={() => setFilterOutcome(v)} style={{ height: '24px', padding: '0 10px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${active ? ac : 'rgba(15,23,42,0.15)'}`, background: active ? `${ac}15` : 'transparent', color: active ? ac : 'rgba(15,23,42,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}>{v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}</button>;
                            })}
                          </div>
                        </div>

                        {/* P&L */}
                        <div style={{ marginBottom: '14px' }}>
                          <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.4)', marginBottom: '8px' }}>P&L</div>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {([{ v: 'all', label: 'All' }, { v: 'profit', label: 'Profit' }, { v: 'loss', label: 'Loss' }]).map(({ v, label }) => {
                              const ac = v === 'profit' ? '#10b981' : v === 'loss' ? '#ef4444' : color;
                              const active = filterPL === v;
                              return <button key={v} onClick={() => setFilterPL(v)} style={{ height: '24px', padding: '0 10px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${active ? ac : 'rgba(15,23,42,0.15)'}`, background: active ? `${ac}15` : 'transparent', color: active ? ac : 'rgba(15,23,42,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}>{label}</button>;
                            })}
                          </div>
                        </div>

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

                        {/* Weapon */}
                        {allWeapons.length > 0 && (
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.4)', marginBottom: '8px' }}>Weapon</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {(['all', ...allWeapons]).map(v => {
                                const active = filterWeapon === v;
                                return <button key={v} onClick={() => setFilterWeapon(v)} style={{ height: '24px', padding: '0 10px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${active ? color : 'rgba(15,23,42,0.15)'}`, background: active ? `${color}12` : 'transparent', color: active ? color : 'rgba(15,23,42,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}>{v === 'all' ? 'All' : v}</button>;
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
                    onClick={downloadCSV}
                    disabled={isDownloading || tradeLogs.length === 0}
                    style={{ height: '30px', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '6px', border: `1px solid ${color}38`, background: `${color}08`, color, cursor: tradeLogs.length === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', transition: 'all 150ms', opacity: isDownloading || tradeLogs.length === 0 ? 0.45 : 1, flexShrink: 0 }}
                    onMouseEnter={e => { if (!isDownloading && tradeLogs.length > 0) e.currentTarget.style.background = `${color}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.background = `${color}08`; }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                    {isDownloading ? 'Exporting…' : 'Export CSV'}
                  </button>
                )}

                <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: 'rgba(15,23,42,0.35)', flexShrink: 0 }}>{filteredLogs.length} / {tradeLogs.length}</span>
              </div>
            </div>

            {filteredLogs.length === 0 && tradeLogs.length === 0 ? (
              <div style={{ padding: '80px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', opacity: 0.3 }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>No missions logged yet</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div style={{ padding: '60px 36px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>No records match "{search}"</span>
              </div>
            ) : (
              <>
                {/* Column headers (sortable) */}
                <div style={{ display: 'grid', gridTemplateColumns: '110px 90px 90px 100px 100px 80px 76px 1fr', padding: '10px 28px', borderBottom: `1px solid ${color}20`, gap: '8px', background: `${color}08` }}>
                  {([
                    { key: 'date', label: 'Date' },
                    { key: 'asset', label: 'Asset' },
                    { key: 'weapon', label: 'Weapon' },
                    { key: 'entry', label: 'Entry' },
                    { key: 'exit', label: 'Exit' },
                    { key: 'pl', label: 'P&L' },
                    { key: 'result', label: 'Result' },
                    { key: '', label: '' },
                  ] as { key: string; label: string }[]).map(h => (
                    <button
                      key={h.key || 'actions'}
                      onClick={() => h.key && handleSort(h.key)}
                      style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', padding: 0, cursor: h.key ? 'pointer' : 'default', textAlign: 'left' }}
                    >
                      <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.18em', color: sortCol === h.key ? color : 'rgba(15,23,42,0.45)' }}>{h.label}</span>
                      {h.key && <SortIcon col={h.key} active={sortCol === h.key} dir={sortDir} />}
                    </button>
                  ))}
                </div>

                {filteredLogs.map((log, rowIdx) => {
                  const outcome = log.phase4?.outcome?.toLowerCase() || '';
                  const isWin = outcome === 'win';
                  const isLoss = outcome === 'loss';
                  const accentLine = isWin ? '#10b981' : isLoss ? '#ef4444' : 'transparent';
                  const isExpanded = expandedId === log.id;
                  const hasSession = !!log.session_state;
                  const cmd = (log.phase1?.protocol as string) || (log.session_state?.finalCommand as string) || '';

                  return (
                    <div key={log.id}>
                      {/* Main row */}
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '110px 90px 90px 100px 100px 80px 76px 1fr', padding: '13px 28px', borderBottom: `1px solid ${color}0e`, gap: '8px', alignItems: 'center', borderLeft: `3px solid ${accentLine}`, background: isExpanded ? `${color}08` : (rowIdx % 2 === 0 ? `${color}09` : '#eef0f4'), transition: 'background 150ms', cursor: 'default' }}
                        onMouseEnter={e => { if (!isExpanded) e.currentTarget.style.background = `${color}12`; }}
                        onMouseLeave={e => { if (!isExpanded) e.currentTarget.style.background = rowIdx % 2 === 0 ? `${color}09` : '#eef0f4'; }}
                      >
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>{fmtDate(log.timestamp)}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a' }}>{log.phase2?.asset_ticker || log.phase1?.asset_ticker || log.asset || '—'}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.06em', color }}>{log.phase3?.manual_weapon || log.weapon || '—'}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', fontFamily: 'monospace' }}>{fmtPrice(log.phase2?.entry_price)}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', fontFamily: 'monospace' }}>{fmtPrice(log.phase4?.exit_price)}</span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: isWin ? '#10b981' : isLoss ? '#ef4444' : '#94a3b8', fontFamily: 'monospace' }}>
                          {log.phase4?.pl !== undefined && log.phase4?.pl !== '' ? String(log.phase4.pl) : '—'}
                        </span>
                        <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: isWin ? '#10b981' : isLoss ? '#ef4444' : '#94a3b8' }}>
                          {log.phase4?.outcome || 'Open'}
                        </span>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          {/* View — opens left Operational Ledger pane */}
                          <button
                            onClick={() => { onView?.(log); setExpandedId(isExpanded ? null : log.id); }}
                            style={{ height: '22px', padding: '0 8px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${color}38`, background: isExpanded ? `${color}25` : `${color}10`, color, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                          >
                            {isExpanded ? 'Close' : 'View'}
                          </button>
                          {/* Resume */}
                          {hasSession && (
                            <button
                              onClick={() => resumeSession(log)}
                              style={{ height: '22px', padding: '0 8px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: '1px solid rgba(16,185,129,0.5)', background: 'rgba(16,185,129,0.08)', color: '#059669', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.08)'; }}
                            >
                              Resume
                            </button>
                          )}
                          {/* Fork */}
                          {hasSession && (
                            <button
                              onClick={() => {
                                const name = window.prompt('Fork name:', `FORK_${log.name || log.id}`) ?? '';
                                if (name !== null) forkSession(log, name);
                              }}
                              style={{ height: '22px', padding: '0 8px', fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', border: `1px solid ${color}38`, background: `${color}10`, color, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms' }}
                              onMouseEnter={e => { e.currentTarget.style.background = `${color}25`; }}
                              onMouseLeave={e => { e.currentTarget.style.background = `${color}10`; }}
                            >
                              Fork
                            </button>
                          )}
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
                        <div style={{ padding: '16px 28px 20px 31px', borderBottom: `1px solid ${color}15`, background: `${color}05`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 24px' }}>
                          {[
                            { label: 'Mission Name', value: log.name || '—' },
                            { label: 'Protocol / Command', value: cmd || '—' },
                            { label: 'Mission ID', value: String(log.id) },
                            { label: 'Stop Loss', value: fmtPrice(log.phase2?.stop_loss) },
                            { label: 'Operator', value: log.username || '—' },
                            { label: 'Execution Rating', value: log.phase4?.execution_rating ? `${log.phase4.execution_rating}/10` : '—' },
                            { label: 'Weapon', value: log.phase3?.manual_weapon || log.weapon || '—' },
                            { label: 'Target', value: fmtPrice(log.phase2?.take_profit) },
                          ].map(item => (
                            <div key={item.label}>
                              <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.45)', marginBottom: '4px' }}>{item.label}</div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{item.value}</div>
                            </div>
                          ))}
                          {log.phase4?.user_thought && (
                            <div style={{ gridColumn: '1 / -1' }}>
                              <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.45)', marginBottom: '4px' }}>Operator Notes</div>
                              <div style={{ fontSize: '12px', fontWeight: 500, color: '#334155', lineHeight: 1.6 }}>{log.phase4.user_thought as string}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${color}20`, paddingTop: '24px', marginTop: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color }}>{model.name} · {model.type}</span>
          <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.35)', fontFamily: 'monospace' }}>NETRA v2.0</span>
        </div>

      </div>
    </div>
  );
}
