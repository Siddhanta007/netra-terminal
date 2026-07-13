// User profile page — account details and saved-session overview.

import { useEffect, useState } from 'react';
import { useNetra } from '../context/NetraContext';
import { useNetraUtils } from '../hooks/useNetraUtils';
import Footer from '../components/Layout/Footer';
import { API_BASE } from '../utils/constants';
import { PageGraphics } from '../components/UI/PageGraphics';

const PAGE_BG = '#edf0f6';
const CARD_BG = '#ffffff';
const CARD_BORDER = 'rgba(65,105,225,0.12)';
const CARD_DIVIDER = 'rgba(15,23,42,0.07)';
const BLUE = '#4169E1';

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: '3px', background: BLUE }} />
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${CARD_DIVIDER}`, flexShrink: 0 }}>
        <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: BLUE }}>{title}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}

function ClearanceItem({ label, values }: { label: string; values: string[] }) {
  return (
    <div style={{ padding: '14px 20px', borderBottom: `1px solid ${CARD_DIVIDER}` }}>
      <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.45)', display: 'block', marginBottom: '8px' }}>{label}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {values.length === 0 ? (
          <span style={{ fontSize: '10px', color: 'rgba(15,23,42,0.45)', fontStyle: 'italic' }}>None</span>
        ) : (
          values.map(val => (
            <span key={val} style={{
              fontSize: '9px', fontWeight: 800, fontFamily: 'JetBrains Mono, monospace',
              color: BLUE, background: 'rgba(65, 105, 225, 0.06)',
              border: `1px solid ${CARD_BORDER}`, padding: '4px 10px',
              textTransform: 'uppercase', letterSpacing: '0.04em'
            }}>
              {val}
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, mono = true }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <div>
      <label style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.45)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', background: PAGE_BG, border: `1px solid ${CARD_BORDER}`,
          padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#0f172a',
          fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
          outline: 'none', boxSizing: 'border-box', transition: 'border-color 150ms',
        }}
        onFocus={e => (e.target.style.borderColor = BLUE)}
        onBlur={e => (e.target.style.borderColor = CARD_BORDER)}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.18em', color: 'rgba(15,23,42,0.45)', display: 'block', marginBottom: '6px' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', background: PAGE_BG, border: `1px solid ${CARD_BORDER}`,
          padding: '10px 12px', fontSize: '12px', fontWeight: 600, color: '#0f172a',
          fontFamily: 'JetBrains Mono, monospace', outline: 'none', cursor: 'pointer',
          boxSizing: 'border-box', appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%234169E1' stroke-width='2.5'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
        }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function ProfilePage() {
  const { session, setSession, showToast } = useNetra();
  const { getAuthHeaders } = useNetraUtils();
  const [profile, setProfile] = useState({
    displayName: session?.displayName || session?.userName || '',
    email: session?.email || '',
    phone: session?.phone || '',
    broker: session?.broker || '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [aiUsage, setAiUsage] = useState({
    model_calls: 0,
    retrieval_tokens: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    estimated_cost_usd: null as number | null,
    priced_calls: 0,
    estimated_token_calls: 0,
  });
  const [appStats, setAppStats] = useState({
    trades: 0,
    wins: 0,
    losses: 0,
    breakeven: 0,
    win_rate: null as number | null,
    net_pnl: 0,
    avg_r: null as number | null,
    by_weapon: {} as Record<string, { trades: number; wins: number; losses: number; net_pnl: number; win_rate?: number | null }>,
  });

  useEffect(() => {
    if (!session?.userName) return;
    fetch(`${API_BASE}/api/users/${encodeURIComponent(session.userName)}/profile`, { headers: getAuthHeaders() })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return;
        setProfile({
          displayName: data.display_name || data.displayName || data.username || session.userName,
          email: data.email || '',
          phone: data.phone || '',
          broker: data.broker || '',
        });
        setSession({
          ...session,
          displayName: data.display_name || data.displayName || session.displayName,
          email: data.email || '',
          phone: data.phone || '',
          broker: data.broker || '',
          groups: data.groups || session.groups || [],
          role: data.role || session.role,
          allowedModels: data.allowed_models || session.allowedModels || [],
          allowedPages: data.allowed_pages || session.allowedPages || [],
          allowedTeams: data.allowed_teams || session.allowedTeams || [],
        });
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userName]);

  useEffect(() => {
    if (!session?.userName) return;
    fetch(`${API_BASE}/api/users/${encodeURIComponent(session.userName)}/ai-usage`, { headers: getAuthHeaders() })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (data) setAiUsage({
          model_calls: Number(data.model_calls || 0),
          retrieval_tokens: Number(data.retrieval_tokens || 0),
          input_tokens: Number(data.llm_input_tokens || data.input_tokens || 0),
          output_tokens: Number(data.llm_output_tokens || data.output_tokens || 0),
          total_tokens: Number(data.total_tokens || 0),
          estimated_cost_usd: typeof data.estimated_cost_usd === 'number' ? data.estimated_cost_usd : null,
          priced_calls: Number(data.priced_calls || 0),
          estimated_token_calls: Number(data.estimated_token_calls || 0),
        });
      })
      .catch(() => {});
  }, [getAuthHeaders, session?.userName]);

  useEffect(() => {
    if (!session?.userName) return;
    fetch(`${API_BASE}/api/users/${encodeURIComponent(session.userName)}/stats?model_id=all&range=all`, {
      headers: getAuthHeaders(),
    })
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        const metrics = data?.metrics;
        if (!metrics) return;
        setAppStats({
          trades: Number(metrics.trades || 0),
          wins: Number(metrics.wins || 0),
          losses: Number(metrics.losses || 0),
          breakeven: Number(metrics.breakeven || 0),
          win_rate: typeof metrics.win_rate === 'number' ? metrics.win_rate : null,
          net_pnl: Number(metrics.net_pnl || 0),
          avg_r: typeof metrics.avg_r === 'number' ? metrics.avg_r : null,
          by_weapon: metrics.by_weapon || {},
        });
      })
      .catch(() => {});
  }, [getAuthHeaders, session?.userName]);

  const saveProfile = async () => {
    if (!session?.userName || isSavingProfile) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(session.userName)}/profile`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          display_name: profile.displayName,
          email: profile.email,
          phone: profile.phone,
          broker: profile.broker,
        }),
      });
      if (!res.ok) throw new Error('Profile save failed');
      const data = await res.json();
      setSession({
        ...session,
        displayName: data.display_name || profile.displayName,
        email: data.email || '',
        phone: data.phone || '',
        broker: data.broker || '',
        groups: data.groups || session.groups || [],
        role: data.role || session.role,
        allowedModels: data.allowed_models || session.allowedModels || [],
        allowedPages: data.allowed_pages || session.allowedPages || [],
        allowedTeams: data.allowed_teams || session.allowedTeams || [],
      });
      showToast('Profile saved');
    } catch {
      showToast('Profile save failed', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const total = appStats.trades;
  const wins = appStats.wins;
  const losses = appStats.losses;
  const winRate = appStats.win_rate !== null ? appStats.win_rate.toFixed(1) : '—';
  const totalPL = appStats.net_pnl;
  const hasPL = total > 0;
  const topWeapon = Object.entries(appStats.by_weapon).sort((a, b) => Number(b[1]?.trades || 0) - Number(a[1]?.trades || 0))[0] ?? null;
  const initial = (session?.userName || 'O')[0].toUpperCase();

  const [risk, setRisk] = useState({ dailyTarget: '5000', maxDailyLoss: '3000', riskPerTrade: '1.5', defaultLots: '1' });
  const [prefs, setPrefs] = useState({ segment: 'NSE F&O', expiry: 'Weekly', timezone: 'IST (UTC+5:30)', tradingHours: '09:15 — 15:30' });

  const stats = [
    { label: 'Total Missions', value: total > 0 ? String(total) : '—', color: '#0f172a' },
    { label: 'Confirmed Wins',  value: wins > 0 ? String(wins) : '—', color: '#10b981' },
    { label: 'Confirmed Losses', value: losses > 0 ? String(losses) : '—', color: '#ef4444' },
    { label: 'Win Rate', value: winRate !== '—' ? `${winRate}%` : '—', color: BLUE },
    { label: 'Total P&L', value: hasPL ? (totalPL >= 0 ? `+₹${totalPL.toFixed(0)}` : `-₹${Math.abs(totalPL).toFixed(0)}`) : '—', color: hasPL ? (totalPL >= 0 ? '#10b981' : '#ef4444') : '#0f172a' },
    { label: 'Average R', value: appStats.avg_r !== null ? appStats.avg_r.toFixed(2) : '—', color: '#0f172a' },
    { label: 'Model Calls', value: aiUsage.model_calls > 0 ? String(aiUsage.model_calls) : '—', color: '#8b5cf6' },
    { label: 'AI Tokens', value: aiUsage.total_tokens > 0 ? aiUsage.total_tokens.toLocaleString('en-IN') : '—', color: '#f59e0b' },
    { label: 'RAG Tokens', value: aiUsage.retrieval_tokens > 0 ? aiUsage.retrieval_tokens.toLocaleString('en-IN') : '—', color: '#6366f1' },
    { label: 'AI Cost', value: aiUsage.estimated_cost_usd !== null ? `$${aiUsage.estimated_cost_usd.toFixed(4)}` : '—', color: '#0ea5e9' },
  ];

  return (
    <div style={{ background: PAGE_BG, flex: 1, minHeight: '100%', position: 'relative', overflow: 'auto' }}>
      <PageGraphics variant="profile" opacity={0.96} />

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 48px 0', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: '32px 36px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div style={{ width: '72px', height: '72px', background: BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>{initial}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: BLUE, marginBottom: '6px' }}>Operator Profile</div>
            <h2 style={{ fontSize: '42px', fontWeight: 950, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.04em', margin: 0, lineHeight: 1 }}>
              {session?.userName || 'Operator'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981' }}>Active</span>
              </div>
              <div style={{ width: '1px', height: '12px', background: 'rgba(15,23,42,0.12)' }} />
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.4)' }}>Standard Operator · NETRA v3.0</span>
              <div style={{ width: '1px', height: '12px', background: 'rgba(15,23,42,0.12)' }} />
              <span style={{ fontSize: '9px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.4)' }}>NSE F&O · Intraday</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: '20px 24px' }}>
              <div style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.4)', marginBottom: '10px' }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 950, color: s.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Balanced Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'stretch' }}>

          {/* Row 1: Profile Settings & Clearances */}
          <Card title="Operator Settings">
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
              <InputField label="Display Name" value={profile.displayName} onChange={v => setProfile(p => ({ ...p, displayName: v }))} placeholder="Your name" mono={false} />
              <InputField label="Email Address" value={profile.email} onChange={v => setProfile(p => ({ ...p, email: v }))} placeholder="you@example.com" mono={false} />
              <InputField label="Phone / WhatsApp" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" />
              <InputField label="Broker / Platform" value={profile.broker} onChange={v => setProfile(p => ({ ...p, broker: v }))} placeholder="Zerodha, Dhan..." mono={false} />
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={saveProfile} disabled={isSavingProfile} style={{ padding: '9px 20px', background: isSavingProfile ? 'rgba(65,105,225,0.5)' : BLUE, color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: isSavingProfile ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                {isSavingProfile ? 'Saving' : 'Save Profile'}
              </button>
            </div>
          </Card>

          <Card title="Clearances & Permissions">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', flex: 1 }}>
              <div style={{ flex: 1 }}>
                <ClearanceItem label="Access Clearance Role" values={[session?.role || 'operator']} />
                <ClearanceItem label="Allowed Model Tiers" values={session?.role === 'admin' ? ["*"] : (session?.allowedModels || [])} />
                <ClearanceItem label="Allowed Operations Teams" values={session?.role === 'admin' ? ["*"] : (session?.allowedTeams || [])} />
                <ClearanceItem label="Cleared Console Pages" values={session?.role === 'admin' ? ["home", "pinaka", "trishul", "about", "portfolio"] : (session?.allowedPages || [])} />
              </div>
              <div style={{ padding: '14px 20px', background: 'rgba(16, 185, 129, 0.05)', borderTop: `1px solid ${CARD_DIVIDER}`, display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#10b981', letterSpacing: '0.1em' }}>Permissions Verified &amp; Active</span>
              </div>
            </div>
          </Card>

          {/* Row 2: Risk Parameters & Model Access */}
          <Card title="Risk Parameters">
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
              <InputField label="Daily P&L Target (₹)" value={risk.dailyTarget} onChange={v => setRisk(p => ({ ...p, dailyTarget: v }))} placeholder="5000" />
              <InputField label="Max Daily Loss (₹)" value={risk.maxDailyLoss} onChange={v => setRisk(p => ({ ...p, maxDailyLoss: v }))} placeholder="3000" />
              <InputField label="Risk Per Trade (%)" value={risk.riskPerTrade} onChange={v => setRisk(p => ({ ...p, riskPerTrade: v }))} placeholder="1.5" />
              <InputField label="Default Lot Size" value={risk.defaultLots} onChange={v => setRisk(p => ({ ...p, defaultLots: v }))} placeholder="1" />
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button style={{ padding: '9px 20px', background: BLUE, color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'inherit' }}>
                Update Risk
              </button>
            </div>
          </Card>

          <Card title="Model Access">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
              <div style={{ flex: 1 }}>
                {[
                  { id: 'PINAKA', desc: 'AI-Assisted Retail · Strike + Interception', sub: 'Bias → HTF → Weapon → P&L → Maya', color: '#3b82f6', status: 'Live', statusColor: '#10b981' },
                  { id: 'TRISHUL', desc: 'Quant-Institutional Swing · Planning Phase', sub: 'Multi-day positional with regime detection', color: '#f59e0b', status: 'Planning', statusColor: '#d97706' },
                ].map(m => (
                  <div key={m.id} style={{ padding: '18px 20px', borderBottom: `1px solid ${CARD_DIVIDER}`, borderLeft: `3px solid ${m.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.04em', fontFamily: 'JetBrains Mono, monospace' }}>{m.id}</span>
                      <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: m.statusColor, background: `${m.statusColor}1a`, padding: '3px 8px' }}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(15,23,42,0.65)', marginBottom: '3px' }}>{m.desc}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(15,23,42,0.35)' }}>{m.sub}</div>
                  </div>
                ))}
              </div>
              {topWeapon && (
                <div style={{ padding: '16px 20px', background: PAGE_BG, flexShrink: 0 }}>
                  <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.4)', marginBottom: '6px' }}>Most Deployed Weapon</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '22px', fontWeight: 950, color: BLUE, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{topWeapon[0]}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(15,23,42,0.45)' }}>{topWeapon[1].trades} missions</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Row 3: Trading Preferences & System Status */}
          <Card title="Trading Preferences">
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
              <SelectField label="Segment" value={prefs.segment} onChange={v => setPrefs(p => ({ ...p, segment: v }))} options={['NSE F&O', 'BSE F&O', 'NSE Equity', 'MCX']} />
              <SelectField label="Expiry Preference" value={prefs.expiry} onChange={v => setPrefs(p => ({ ...p, expiry: v }))} options={['Weekly', 'Monthly', 'Both']} />
              <InputField label="Timezone" value={prefs.timezone} onChange={v => setPrefs(p => ({ ...p, timezone: v }))} placeholder="IST (UTC+5:30)" mono={false} />
              <InputField label="Trading Hours" value={prefs.tradingHours} onChange={v => setPrefs(p => ({ ...p, tradingHours: v }))} placeholder="09:15 — 15:30" />
            </div>
            <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
              <button style={{ padding: '9px 20px', background: BLUE, color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'inherit' }}>
                Save Preferences
              </button>
            </div>
          </Card>

          <Card title="System Status">
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1 }}>
              {[
                { label: 'MAYA AI Engine',       value: 'Online',   color: '#10b981', dot: true  },
                { label: 'RAG Knowledge Library', value: 'Synced',   color: '#10b981', dot: true  },
                { label: 'LangSmith Tracing',     value: 'Active',   color: '#10b981', dot: true  },
                { label: 'Doctrine Version',       value: 'NETRA v3.0', color: BLUE,   dot: false },
                { label: 'Session Operator',       value: session?.userName || '—', color: '#0f172a', dot: false },
                { label: 'Last Sync',              value: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), color: 'rgba(15,23,42,0.5)', dot: false },
              ].map(item => (
                <div key={item.label} style={{ padding: '14px 20px', borderBottom: `1px solid ${CARD_DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(15,23,42,0.45)' }}>{item.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {item.dot && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.color }} />}
                    <span style={{ fontSize: '11px', fontWeight: 700, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

        {/* Danger Zone Spans Full Width */}
        <div style={{ marginTop: '20px' }}>
          <Card title="Danger Zone">
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { title: 'Clear Session History', desc: 'Wipe all local session state and cache' },
                { title: 'Reset All Preferences', desc: 'Restore risk params and settings to defaults' },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', border: '1px solid rgba(239,68,68,0.2)', background: PAGE_BG }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', marginBottom: '3px' }}>{item.title}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(15,23,42,0.45)' }}>{item.desc}</div>
                  </div>
                  <button style={{ padding: '7px 14px', background: 'none', color: '#ef4444', border: '1px solid rgba(239,68,68,0.4)', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    {item.title.split(' ')[0]}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>

      <Footer />
    </div>
  );
}
