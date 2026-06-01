import { useState } from 'react';
import { useNetra } from '../context/NetraContext';
import Footer from '../components/Layout/Footer';

const PAGE_BG = '#edf0f6';
const CARD_BG = '#ffffff';
const CARD_BORDER = 'rgba(65,105,225,0.12)';
const CARD_DIVIDER = 'rgba(15,23,42,0.07)';
const BLUE = '#4169E1';

const DIAMOND_SHAPES = [
  { cx: 608, cy: 28,  r: 50, c: '#4169E1' }, { cx: 544, cy: 8,   r: 33, c: '#f59e0b' },
  { cx: 488, cy: 52,  r: 44, c: '#8b5cf6' }, { cx: 618, cy: 108, r: 38, c: '#10b981' },
  { cx: 412, cy: 18,  r: 26, c: '#6366f1' }, { cx: 558, cy: 125, r: 46, c: '#4169E1' },
  { cx: 338, cy: 42,  r: 22, c: '#ef4444' }, { cx: 470, cy: 142, r: 30, c: '#0ea5e9' },
  { cx: 615, cy: 188, r: 35, c: '#f59e0b' }, { cx: 280, cy: 75,  r: 20, c: '#8b5cf6' },
  { cx: 390, cy: 112, r: 38, c: '#4169E1' }, { cx: 515, cy: 205, r: 24, c: '#10b981' },
  { cx: 225, cy: 50,  r: 18, c: '#6366f1' }, { cx: 450, cy: 228, r: 42, c: '#f59e0b' },
  { cx: 612, cy: 262, r: 28, c: '#0ea5e9' }, { cx: 335, cy: 182, r: 18, c: '#4169E1' },
  { cx: 565, cy: 302, r: 22, c: '#ef4444' }, { cx: 265, cy: 162, r: 32, c: '#8b5cf6' },
  { cx: 485, cy: 298, r: 20, c: '#10b981' }, { cx: 395, cy: 272, r: 36, c: '#6366f1' },
];
const DIAMOND_BL = [
  { cx: 22,  cy: 545, r: 50, c: '#4169E1' }, { cx: 95,  cy: 560, r: 33, c: '#10b981' },
  { cx: 162, cy: 528, r: 44, c: '#f59e0b' }, { cx: 15,  cy: 478, r: 38, c: '#8b5cf6' },
  { cx: 248, cy: 552, r: 26, c: '#4169E1' }, { cx: 108, cy: 472, r: 46, c: '#0ea5e9' },
  { cx: 325, cy: 530, r: 22, c: '#ef4444' }, { cx: 195, cy: 462, r: 30, c: '#f59e0b' },
  { cx: 20,  cy: 402, r: 35, c: '#4169E1' }, { cx: 388, cy: 518, r: 20, c: '#8b5cf6' },
  { cx: 132, cy: 388, r: 38, c: '#6366f1' }, { cx: 280, cy: 445, r: 24, c: '#10b981' },
  { cx: 62,  cy: 322, r: 18, c: '#0ea5e9' }, { cx: 218, cy: 355, r: 42, c: '#4169E1' },
  { cx: 25,  cy: 248, r: 28, c: '#ef4444' }, { cx: 358, cy: 422, r: 18, c: '#f59e0b' },
  { cx: 155, cy: 282, r: 22, c: '#8b5cf6' }, { cx: 328, cy: 335, r: 32, c: '#6366f1' },
  { cx: 92,  cy: 222, r: 20, c: '#4169E1' }, { cx: 252, cy: 272, r: 36, c: '#0ea5e9' },
];

function PageCorners() {
  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: 620, height: 620, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="620" height="620" viewBox="0 0 620 620" fill="none">
          {DIAMOND_SHAPES.map((s, i) => (
            <polygon key={i}
              points={`${s.cx},${s.cy - s.r} ${s.cx + s.r},${s.cy} ${s.cx},${s.cy + s.r} ${s.cx - s.r},${s.cy}`}
              fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.45" />
          ))}
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 560, height: 560, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="560" height="560" viewBox="0 0 560 560" fill="none">
          {DIAMOND_BL.map((s, i) => (
            <polygon key={i}
              points={`${s.cx},${s.cy - s.r} ${s.cx + s.r},${s.cy} ${s.cx},${s.cy + s.r} ${s.cx - s.r},${s.cy}`}
              fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.45" />
          ))}
        </svg>
      </div>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}` }}>
      <div style={{ height: '3px', background: BLUE }} />
      <div style={{ padding: '14px 20px', borderBottom: `1px solid ${CARD_DIVIDER}` }}>
        <span style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: BLUE }}>{title}</span>
      </div>
      {children}
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
  const { session, tradeLogs } = useNetra();

  const total = tradeLogs?.length ?? 0;
  const wins = tradeLogs?.filter(l => l.phase4?.outcome?.toLowerCase() === 'win').length ?? 0;
  const losses = tradeLogs?.filter(l => l.phase4?.outcome?.toLowerCase() === 'loss').length ?? 0;
  const settled = wins + losses;
  const winRate = settled > 0 ? ((wins / settled) * 100).toFixed(1) : '—';

  const totalPL = tradeLogs?.reduce((sum, l) => {
    const pl = parseFloat(String(l.phase4?.pl ?? ''));
    return isNaN(pl) ? sum : sum + pl;
  }, 0) ?? 0;
  const hasPL = tradeLogs?.some(l => !isNaN(parseFloat(String(l.phase4?.pl ?? '')))) ?? false;

  const weapMap: Record<string, number> = {};
  tradeLogs?.forEach(l => {
    const w = l.phase3?.manual_weapon || l.weapon || '';
    if (w) weapMap[w] = (weapMap[w] ?? 0) + 1;
  });
  const topWeapon = Object.entries(weapMap).sort((a, b) => b[1] - a[1])[0] ?? null;
  const initial = (session?.userName || 'O')[0].toUpperCase();

  const [profile, setProfile] = useState({ displayName: session?.userName || '', email: '', phone: '', broker: '' });
  const [risk, setRisk] = useState({ dailyTarget: '5000', maxDailyLoss: '3000', riskPerTrade: '1.5', defaultLots: '1' });
  const [prefs, setPrefs] = useState({ segment: 'NSE F&O', expiry: 'Weekly', timezone: 'IST (UTC+5:30)', tradingHours: '09:15 — 15:30' });

  const stats = [
    { label: 'Total Missions', value: total > 0 ? String(total) : '—', color: '#0f172a' },
    { label: 'Confirmed Wins',  value: wins > 0 ? String(wins) : '—', color: '#10b981' },
    { label: 'Confirmed Losses', value: losses > 0 ? String(losses) : '—', color: '#ef4444' },
    { label: 'Win Rate', value: winRate !== '—' ? `${winRate}%` : '—', color: BLUE },
    { label: 'Total P&L', value: hasPL ? (totalPL >= 0 ? `+₹${totalPL.toFixed(0)}` : `-₹${Math.abs(totalPL).toFixed(0)}`) : '—', color: hasPL ? (totalPL >= 0 ? '#10b981' : '#ef4444') : '#0f172a' },
  ];

  return (
    <div style={{ background: PAGE_BG, flex: 1, minHeight: '100%', position: 'relative', overflow: 'auto' }}>
      <PageCorners />

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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ background: CARD_BG, border: `1px solid ${CARD_BORDER}`, padding: '20px 24px' }}>
              <div style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', color: 'rgba(15,23,42,0.4)', marginBottom: '10px' }}>{s.label}</div>
              <div style={{ fontSize: '28px', fontWeight: 950, color: s.color, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '-0.04em', lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <Card title="Operator Settings">
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField label="Display Name" value={profile.displayName} onChange={v => setProfile(p => ({ ...p, displayName: v }))} placeholder="Your name" mono={false} />
                <InputField label="Email Address" value={profile.email} onChange={v => setProfile(p => ({ ...p, email: v }))} placeholder="you@example.com" mono={false} />
                <InputField label="Phone / WhatsApp" value={profile.phone} onChange={v => setProfile(p => ({ ...p, phone: v }))} placeholder="+91 XXXXX XXXXX" />
                <InputField label="Broker / Platform" value={profile.broker} onChange={v => setProfile(p => ({ ...p, broker: v }))} placeholder="Zerodha, Dhan..." mono={false} />
              </div>
              <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '9px 20px', background: BLUE, color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Save Profile
                </button>
              </div>
            </Card>

            <Card title="Risk Parameters">
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <InputField label="Daily P&L Target (₹)" value={risk.dailyTarget} onChange={v => setRisk(p => ({ ...p, dailyTarget: v }))} placeholder="5000" />
                <InputField label="Max Daily Loss (₹)" value={risk.maxDailyLoss} onChange={v => setRisk(p => ({ ...p, maxDailyLoss: v }))} placeholder="3000" />
                <InputField label="Risk Per Trade (%)" value={risk.riskPerTrade} onChange={v => setRisk(p => ({ ...p, riskPerTrade: v }))} placeholder="1.5" />
                <InputField label="Default Lot Size" value={risk.defaultLots} onChange={v => setRisk(p => ({ ...p, defaultLots: v }))} placeholder="1" />
              </div>
              <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '9px 20px', background: BLUE, color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Update Risk
                </button>
              </div>
            </Card>

            <Card title="Trading Preferences">
              <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <SelectField label="Segment" value={prefs.segment} onChange={v => setPrefs(p => ({ ...p, segment: v }))} options={['NSE F&O', 'BSE F&O', 'NSE Equity', 'MCX']} />
                <SelectField label="Expiry Preference" value={prefs.expiry} onChange={v => setPrefs(p => ({ ...p, expiry: v }))} options={['Weekly', 'Monthly', 'Both']} />
                <InputField label="Timezone" value={prefs.timezone} onChange={v => setPrefs(p => ({ ...p, timezone: v }))} placeholder="IST (UTC+5:30)" mono={false} />
                <InputField label="Trading Hours" value={prefs.tradingHours} onChange={v => setPrefs(p => ({ ...p, tradingHours: v }))} placeholder="09:15 — 15:30" />
              </div>
              <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ padding: '9px 20px', background: BLUE, color: '#ffffff', border: 'none', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Save Preferences
                </button>
              </div>
            </Card>

          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <Card title="Model Access">
              <div>
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
                {topWeapon && (
                  <div style={{ padding: '16px 20px', background: PAGE_BG }}>
                    <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.4)', marginBottom: '6px' }}>Most Deployed Weapon</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 950, color: BLUE, fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{topWeapon[0]}</span>
                      <span style={{ fontSize: '10px', color: 'rgba(15,23,42,0.45)' }}>{topWeapon[1]} missions</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="System Status">
              <div>
                {[
                  { label: 'MAYA AI Engine',       value: 'Online',   color: '#10b981', dot: true  },
                  { label: 'RAG Knowledge Library', value: 'Synced',   color: '#10b981', dot: true  },
                  { label: 'LangSmith Tracing',     value: 'Active',   color: '#10b981', dot: true  },
                  { label: 'Doctrine Version',       value: 'NETRA v3.0', color: BLUE,   dot: false },
                  { label: 'Session Operator',       value: session?.userName || '—', color: '#0f172a', dot: false },
                  { label: 'Last Sync',              value: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), color: 'rgba(15,23,42,0.5)', dot: false },
                ].map(item => (
                  <div key={item.label} style={{ padding: '14px 20px', borderBottom: `1px solid ${CARD_DIVIDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(15,23,42,0.45)' }}>{item.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.dot && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: item.color }} />}
                      <span style={{ fontSize: '11px', fontWeight: 700, color: item.color, fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

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

      </div>

      <Footer />
    </div>
  );
}
