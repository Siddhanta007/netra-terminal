import { useNetra } from '../../context/NetraContext';

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
              fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.55" />
          ))}
        </svg>
      </div>
      <div style={{ position: 'fixed', bottom: 0, left: 0, width: 560, height: 560, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <svg width="560" height="560" viewBox="0 0 560 560" fill="none">
          {DIAMOND_BL.map((s, i) => (
            <polygon key={i}
              points={`${s.cx},${s.cy - s.r} ${s.cx + s.r},${s.cy} ${s.cx},${s.cy + s.r} ${s.cx - s.r},${s.cy}`}
              fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.55" />
          ))}
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
        <div style={{ background: '#f7fbff', boxShadow: '0 4px 40px rgba(0,0,0,0.08)' }}>
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
