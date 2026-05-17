import { useNetra } from '../../context/NetraContext';

function PageCorners() {
  const radii = [80, 150, 220, 295, 370, 445, 520];
  const sw = [5, 3.5, 2.5, 2, 1.5, 1, 0.7];
  const so = [1, 0.7, 0.5, 0.35, 0.22, 0.14, 0.08];
  return (
    <>
      <div style={{ position: 'fixed', top: 0, right: 0, width: '560px', height: '560px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="560" height="560" viewBox="0 0 560 560" fill="none">
          {radii.map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => { const a = (-90 + k * 360 / 7) * Math.PI / 180; return `${(560 + r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`; }).join(' ');
            return <polygon key={r} points={pts} stroke="#2563eb" strokeWidth={sw[i]} strokeOpacity={so[i]} fill={i < 3 ? `rgba(37,99,235,${[0.1, 0.05, 0.02][i]})` : 'none'} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
          <circle cx="560" cy="0" r="9" fill="#2563eb" fillOpacity="0.9" />
          <circle cx="560" cy="0" r="18" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '500px', height: '500px', pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="500" height="500" viewBox="0 0 500 500" fill="none">
          {radii.map((r, i) => {
            const pts = Array.from({ length: 7 }, (_, k) => { const a = (90 + k * 360 / 7) * Math.PI / 180; return `${(r * Math.cos(a)).toFixed(1)},${(500 + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
            return <polygon key={r} points={pts} stroke="#f59e0b" strokeWidth={sw[i]} strokeOpacity={so[i]} fill={i < 3 ? `rgba(245,158,11,${[0.1, 0.05, 0.02][i]})` : 'none'} strokeDasharray={i === 3 || i === 5 ? '10 7' : 'none'} />;
          })}
          <circle cx="0" cy="500" r="9" fill="#f59e0b" fillOpacity="0.9" />
          <circle cx="0" cy="500" r="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.4" />
        </svg>
      </div>
    </>
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

  const statRow = (label: string, value: string, color?: string) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
      <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(15,23,42,0.45)' }}>{label}</span>
      <span style={{ fontSize: '18px', fontWeight: 950, color: color || '#0f172a', fontFamily: 'monospace', letterSpacing: '-0.03em' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ background: '#ffffff', flex: 1, minHeight: '100%', position: 'relative', overflow: 'auto' }}>
      <PageCorners />

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '48px', position: 'relative', zIndex: 1 }}>

        {/* Main opaque box */}
        <div style={{ background: '#f7fbff', border: '1px solid rgba(65,105,225,0.18)' }}>
          <div style={{ height: '4px', background: '#4169E1' }} />
          <div style={{ padding: '40px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '36px', paddingBottom: '28px', borderBottom: '1px solid rgba(65,105,225,0.15)' }}>
              <div style={{ width: '68px', height: '68px', background: '#4169E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>{initial}</span>
              </div>
              <div>
                <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3em', color: '#4169E1', marginBottom: '5px' }}>Operator Profile</div>
                <h2 style={{ fontSize: '32px', fontWeight: 950, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>{session?.userName || 'Operator'}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#10b981' }}>Active · Standard Operator</span>
                </div>
              </div>
            </div>

            {/* 3-column grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>

              {/* Performance */}
              <div style={{ background: '#ffffff', border: '1px solid rgba(65,105,225,0.15)' }}>
                <div style={{ height: '3px', background: '#4169E1' }} />
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                  <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#4169E1' }}>Performance</div>
                </div>
                {statRow('Total Missions', total > 0 ? String(total) : '—')}
                {statRow('Confirmed Wins', wins > 0 ? String(wins) : '—', '#10b981')}
                {statRow('Confirmed Losses', losses > 0 ? String(losses) : '—', '#ef4444')}
                {statRow('Win Rate', winRate !== '—' ? `${winRate}%` : '—', '#4169E1')}
                {statRow('Total P&L', hasPL ? (totalPL >= 0 ? `+${totalPL.toFixed(0)}` : String(totalPL.toFixed(0))) : '—', hasPL ? (totalPL >= 0 ? '#10b981' : '#ef4444') : undefined)}
              </div>

              {/* Model Access */}
              <div style={{ background: '#ffffff', border: '1px solid rgba(65,105,225,0.15)' }}>
                <div style={{ height: '3px', background: '#6366f1' }} />
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                  <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#6366f1' }}>Model Access</div>
                </div>
                {[
                  { id: 'PINAKA', desc: 'AI-Assisted Retail · Strike + Interception', color: '#3b82f6', status: 'Live', statusColor: '#10b981' },
                  { id: 'TRISHUL', desc: 'Quant-Institutional Swing · Planning Phase', color: '#f59e0b', status: 'Planning', statusColor: '#d97706' },
                ].map(m => (
                  <div key={m.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)', borderLeft: `3px solid ${m.color}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.05em' }}>{m.id}</span>
                      <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: m.statusColor }}>{m.status}</span>
                    </div>
                    <div style={{ fontSize: '10px', color: 'rgba(15,23,42,0.45)', fontWeight: 500 }}>{m.desc}</div>
                  </div>
                ))}
                {topWeapon && (
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'rgba(15,23,42,0.45)', marginBottom: '6px' }}>Top Weapon</div>
                    <div style={{ fontSize: '20px', fontWeight: 950, color: '#6366f1', fontFamily: 'monospace', letterSpacing: '-0.02em' }}>{topWeapon[0]}</div>
                    <div style={{ fontSize: '10px', color: 'rgba(15,23,42,0.45)', marginTop: '3px' }}>{topWeapon[1]} missions</div>
                  </div>
                )}
              </div>

              {/* System Status */}
              <div style={{ background: '#ffffff', border: '1px solid rgba(65,105,225,0.15)' }}>
                <div style={{ height: '3px', background: '#10b981' }} />
                <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                  <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.25em', color: '#10b981' }}>System Status</div>
                </div>
                {[
                  { label: 'MAYA Engine', value: 'Online', color: '#10b981' },
                  { label: 'RAG Library', value: 'Synced', color: '#10b981' },
                  { label: 'Doctrine Version', value: 'NETRA v2.0', color: '#0f172a' },
                  { label: 'Last Sync', value: new Date().toLocaleTimeString(), color: '#0f172a' },
                  { label: 'Operator ID', value: session?.userName || '—', color: '#4169E1' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(15,23,42,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(15,23,42,0.45)' }}>{item.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>{item.value}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
