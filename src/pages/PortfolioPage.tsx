import { useEffect, useMemo, useState } from 'react';
import { useNetra } from '../context/NetraContext';
import { TradeLog } from '../types';
import Footer from '../components/Layout/Footer';
import { PageGraphics } from '../components/UI/PageGraphics';

const MONO = 'JetBrains Mono, Consolas, monospace';
const ORANGE = '#f59e0b';

type RangeKey = 'today' | 'week' | 'month' | '3month' | 'all';

const RANGES: Array<{ key: RangeKey; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: '1 Week' },
  { key: 'month', label: '1 Month' },
  { key: '3month', label: '3 Months' },
  { key: 'all', label: 'All' },
];

function logOperator(log: TradeLog) {
  return log.created_by || log.username || (log.phase1?.username as string | undefined) || 'Unknown';
}

function logModel(log: TradeLog) {
  return (log.model_id || log.phase1?.model_id || 'pinaka').toString().toLowerCase();
}

function logAsset(log: TradeLog) {
  return log.phase2?.asset_ticker || log.phase1?.asset_ticker || log.asset || log.assetName || '—';
}

function logWeapon(log: TradeLog) {
  return log.phase3?.manual_weapon || log.phase1?.weapon || log.weapon || '—';
}

function logOutcome(log: TradeLog) {
  return (log.phase4?.outcome || '').toString();
}

function logPnl(log: TradeLog) {
  const canonical = log.phase_9?.trade_1 as Record<string, any> | undefined;
  const raw = log.phase4?.pl ?? log.phase3?.pnl ?? log.phase9?.[0]?.pl ?? canonical?.stats?.pnl ?? 0;
  const parsed = parseFloat(String(raw));
  return Number.isFinite(parsed) ? parsed : 0;
}

function logR(log: TradeLog) {
  const raw = log.phase4?.r_multiple ?? log.phase3?.r_multiple ?? (log as unknown as { r_multiple?: string | number }).r_multiple ?? 0;
  const parsed = parseFloat(String(raw));
  return Number.isFinite(parsed) ? parsed : 0;
}

function isClosed(log: TradeLog) {
  const canonical = log.phase_9?.trade_1 as Record<string, any> | undefined;
  return Boolean(log.closed || logOutcome(log) || log.phase3?.exit_price || log.phase4?.exit_price || log.phase9?.[0]?.exit_price || canonical?.trade?.exit?.price);
}

function inRange(timestamp: string | undefined, range: RangeKey) {
  if (range === 'all') return true;
  if (!timestamp) return false;

  const date = timestamp.slice(0, 10);
  const todayIso = new Date().toISOString().slice(0, 10);
  if (range === 'today') return date === todayIso;

  const days = range === 'week' ? 7 : range === 'month' ? 30 : 90;
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(end.getDate() - days);
  const current = new Date(timestamp);
  return current >= start && current <= end;
}

function formatDate(timestamp: string | undefined) {
  if (!timestamp) return '—';
  return timestamp.slice(0, 10);
}

function money(value: number) {
  const sign = value > 0 ? '+' : value < 0 ? '-' : '';
  return `${sign}₹${Math.abs(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function summarize(logs: TradeLog[]) {
  const closed = logs.filter(isClosed);
  const wins = closed.filter(t => logOutcome(t).toLowerCase().includes('win')).length;
  const losses = closed.filter(t => logOutcome(t).toLowerCase().includes('loss')).length;
  const pnl = closed.reduce((sum, t) => sum + logPnl(t), 0);
  const r = closed.reduce((sum, t) => sum + logR(t), 0);
  const settled = wins + losses;
  return {
    total: logs.length,
    closed: closed.length,
    open: logs.length - closed.length,
    wins,
    losses,
    winRate: settled ? Math.round((wins / settled) * 100) : 0,
    pnl,
    r,
  };
}

function groupBy(logs: TradeLog[], keyFn: (log: TradeLog) => string) {
  const groups = new Map<string, TradeLog[]>();
  logs.forEach(log => {
    const key = keyFn(log) || 'Unknown';
    groups.set(key, [...(groups.get(key) || []), log]);
  });
  return Array.from(groups.entries())
    .map(([key, items]) => ({ key, items, stats: summarize(items) }))
    .sort((a, b) => b.stats.total - a.stats.total);
}

function StatBlock({ title, items }: { title: string; items: Array<{ label: string; value: string | number; tone?: string }> }) {
  return (
    <div style={{ padding: '28px 30px', minHeight: '168px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.22em' }}>{title}</span>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, gap: '24px' }}>
        {items.map(item => (
          <div key={item.label}>
            <div style={{ fontFamily: MONO, fontSize: '36px', fontWeight: 950, color: item.tone || '#0f172a', letterSpacing: '-0.045em', lineHeight: 1 }}>{item.value}</div>
            <div style={{ marginTop: '10px', fontSize: '10px', fontWeight: 800, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { tradeLogs, fetchLogs, session, resumeSession } = useNetra();
  const username = session?.userName || '';
  const [range, setRange] = useState<RangeKey>('all');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedModel, setSelectedModel] = useState('all');

  useEffect(() => {
    fetchLogs('all');
  }, [fetchLogs]);

  useEffect(() => {
    if (username && !selectedUser) setSelectedUser(username);
  }, [username, selectedUser]);

  const users = useMemo(() => Array.from(new Set(tradeLogs.map(logOperator).filter(Boolean))).sort(), [tradeLogs]);
  const models = useMemo(() => Array.from(new Set(tradeLogs.map(logModel).filter(Boolean))).sort(), [tradeLogs]);

  const scopedLogs = useMemo(() => tradeLogs.filter(log => {
    if (selectedUser !== 'all' && logOperator(log).toLowerCase() !== selectedUser.toLowerCase()) return false;
    if (selectedModel !== 'all' && logModel(log) !== selectedModel) return false;
    return inRange(log.timestamp, range);
  }), [tradeLogs, selectedUser, selectedModel, range]);

  const totals = summarize(scopedLogs);
  const modelGroups = groupBy(scopedLogs, logModel);
  const userGroups = groupBy(scopedLogs, logOperator);
  const dayGroups = groupBy(scopedLogs, log => formatDate(log.timestamp)).slice(0, 8);
  const recent = [...scopedLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 18);

  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 56px)', background: '#eef0f5', color: '#0f172a', overflowY: 'auto', position: 'relative' }}>
      <PageGraphics variant="portfolio" opacity={0.98} />
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 48px 0', display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '24px', alignItems: 'flex-end', paddingBottom: '20px' }}>
          <div>
            <div style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: '12px' }}>Cross-Model Portfolio</div>
            <h1 style={{ fontSize: '44px', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, textTransform: 'uppercase', margin: 0, color: ORANGE }}>
              Portfolio
            </h1>
          </div>
          <div style={{ maxWidth: '420px', fontSize: '13px', lineHeight: 1.8, color: '#475569', fontWeight: 600 }}>
            Total trades across permitted users and models, filtered by date, user, or model.
          </div>
        </div>

        <div style={{ background: '#f6f0e8', border: '1px solid rgba(15,23,42,0.08)' }}>
          <div style={{ padding: '0 28px', borderBottom: '1px solid rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex' }}>
              {RANGES.map(item => (
                <button key={item.key} onClick={() => setRange(item.key)} style={{ height: '44px', padding: '0 18px', background: 'none', border: 'none', borderBottom: range === item.key ? `2px solid ${ORANGE}` : '2px solid transparent', fontSize: '9px', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.15em', color: range === item.key ? ORANGE : 'rgba(15,23,42,0.42)', cursor: 'pointer', fontFamily: 'inherit', marginBottom: '-1px' }}>
                  {item.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select value={selectedUser} onChange={e => setSelectedUser(e.target.value)} style={{ height: '30px', minWidth: '132px', border: `1px solid ${ORANGE}40`, background: 'rgba(255,255,255,0.42)', color: '#0f172a', fontSize: '9px', fontWeight: 800, padding: '0 10px', outline: 'none' }}>
                <option value="all">All Users</option>
                {users.map(u => <option key={u} value={u}>{u}{u === username ? ' (you)' : ''}</option>)}
              </select>
              <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} style={{ height: '30px', minWidth: '128px', border: `1px solid ${ORANGE}40`, background: 'rgba(255,255,255,0.42)', color: '#0f172a', fontSize: '9px', fontWeight: 800, padding: '0 10px', outline: 'none', textTransform: 'uppercase' }}>
                <option value="all">All Models</option>
                {models.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
              </select>
              <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 800, color: 'rgba(15,23,42,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{scopedLogs.length} / {tradeLogs.length}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 0, borderTop: '1px solid rgba(15,23,42,0.08)' }}>
            <div style={{ borderRight: '1px solid rgba(15,23,42,0.08)' }}>
              <StatBlock
                title="Trade Volume"
                items={[
                  { label: 'Total', value: totals.total },
                  { label: 'Closed', value: totals.closed },
                  { label: 'Open', value: totals.open },
                ]}
              />
            </div>
            <div style={{ borderRight: '1px solid rgba(15,23,42,0.08)' }}>
              <StatBlock
                title="Performance"
                items={[
                  { label: 'Net P&L', value: money(totals.pnl), tone: totals.pnl >= 0 ? '#047857' : '#b91c1c' },
                  { label: 'Win Rate', value: `${totals.winRate}%` },
                  { label: 'Total R', value: `${totals.r >= 0 ? '+' : ''}${totals.r.toFixed(2)}R`, tone: totals.r >= 0 ? '#047857' : '#b91c1c' },
                ]}
              />
            </div>
            <StatBlock
              title="Allocation"
              items={[
                { label: 'Models', value: modelGroups.length },
                { label: 'Users', value: userGroups.length },
                { label: 'Days', value: dayGroups.length },
              ]}
            />
          </div>

          <BreakdownMatrix
            modelGroups={modelGroups}
            userGroups={userGroups}
            dayGroups={dayGroups}
          />
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid rgba(15,23,42,0.08)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 28px', borderBottom: `1px solid ${ORANGE}24`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '8px', fontWeight: 950, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Whole Trade Ledger</span>
            <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 800, color: 'rgba(15,23,42,0.35)', textTransform: 'uppercase' }}>Latest {recent.length} records</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: MONO, fontSize: '10px' }}>
              <thead>
                <tr style={{ background: `${ORANGE}0d`, borderBottom: `1px solid ${ORANGE}24` }}>
                  {['Date', 'Model', 'User', 'Asset', 'Weapon', 'P&L', 'R', 'Outcome', ''].map(h => (
                    <th key={h} style={{ padding: '12px 18px', color: 'rgba(15,23,42,0.46)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.length ? recent.map(log => {
                  const pnl = logPnl(log);
                  const r = logR(log);
                  const outcome = logOutcome(log) || (isClosed(log) ? 'Closed' : 'Open');
                  const isWin = outcome.toLowerCase().includes('win');
                  const isLoss = outcome.toLowerCase().includes('loss');
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                      <td style={{ padding: '13px 18px', color: '#475569', fontWeight: 800 }}>{formatDate(log.timestamp)}</td>
                      <td style={{ padding: '13px 18px', color: ORANGE, fontWeight: 900, textTransform: 'uppercase' }}>{logModel(log)}</td>
                      <td style={{ padding: '13px 18px', color: '#475569', fontWeight: 800 }}>{logOperator(log)}</td>
                      <td style={{ padding: '13px 18px', color: '#0f172a', fontWeight: 900 }}>{logAsset(log)}</td>
                      <td style={{ padding: '13px 18px', color: '#475569', fontWeight: 800 }}>{logWeapon(log)}</td>
                      <td style={{ padding: '13px 18px', color: pnl >= 0 ? '#10b981' : '#ef4444', fontWeight: 950 }}>{money(pnl)}</td>
                      <td style={{ padding: '13px 18px', color: r >= 0 ? '#10b981' : '#ef4444', fontWeight: 950 }}>{r >= 0 ? '+' : ''}{r.toFixed(2)}R</td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ padding: '4px 8px', border: `1px solid ${isWin ? '#10b981' : isLoss ? '#ef4444' : ORANGE}`, color: isWin ? '#10b981' : isLoss ? '#ef4444' : ORANGE, fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '8px' }}>{outcome}</span>
                      </td>
                      <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => resumeSession(log)}
                          style={{ height: '26px', padding: '0 10px', border: '1px solid rgba(15,23,42,0.18)', background: '#ffffff', color: '#0f172a', fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' }}
                        >
                          Open Terminal
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={9} style={{ padding: '44px', textAlign: 'center', color: 'rgba(15,23,42,0.35)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.16em' }}>No trades in selected scope</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer accentColor={ORANGE} />
    </div>
  );
}

function BreakdownMatrix({
  modelGroups,
  userGroups,
  dayGroups,
}: {
  modelGroups: ReturnType<typeof groupBy>;
  userGroups: ReturnType<typeof groupBy>;
  dayGroups: ReturnType<typeof groupBy>;
}) {
  const columns = [
    { title: 'Model Wise', groups: modelGroups },
    { title: 'User Wise', groups: userGroups },
    { title: 'Date Wise', groups: dayGroups },
  ];

  return (
    <div style={{ borderTop: '1px solid rgba(15,23,42,0.08)', overflow: 'hidden' }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(15,23,42,0.08)', fontSize: '8px', fontWeight: 950, color: '#7c6b58', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Breakdown</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        {columns.map((column, index) => (
          <div key={column.title} style={{ borderRight: index < columns.length - 1 ? '1px solid rgba(15,23,42,0.08)' : 'none' }}>
            <div style={{ padding: '14px 20px', background: '#efe7dc', borderBottom: '1px solid rgba(15,23,42,0.08)', fontSize: '9px', fontWeight: 900, color: '#6b5f52', textTransform: 'uppercase', letterSpacing: '0.16em' }}>{column.title}</div>
            <div>
              {column.groups.length ? column.groups.slice(0, 6).map(group => (
                <div key={group.key} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
                    <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 950, color: '#0f172a', textTransform: 'uppercase' }}>{group.key}</span>
                    <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 950, color: group.stats.pnl >= 0 ? '#047857' : '#b91c1c' }}>{money(group.stats.pnl)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '8px', fontWeight: 850, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    <span>{group.stats.total} trades</span>
                    <span>{group.stats.winRate}% win</span>
                    <span>{group.stats.open} open</span>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '28px 20px', color: 'rgba(15,23,42,0.35)', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.14em' }}>No data</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
