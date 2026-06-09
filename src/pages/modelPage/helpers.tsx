// Presentational + stat helpers for the Model showcase page:
// the decorative corner artwork, trade-log aggregate stats, and table formatters.

import { TradeLog } from '../../types';

// Pinaka — scattered rectangles, random positions + 7-color palette
const RECT_TR = [
  { cx: 608, cy: 28,  r: 50, c: '#3b82f6' }, { cx: 544, cy: 8,   r: 33, c: '#f59e0b' },
  { cx: 488, cy: 52,  r: 44, c: '#8b5cf6' }, { cx: 618, cy: 108, r: 38, c: '#10b981' },
  { cx: 412, cy: 18,  r: 26, c: '#6366f1' }, { cx: 558, cy: 125, r: 46, c: '#0ea5e9' },
  { cx: 338, cy: 42,  r: 22, c: '#ef4444' }, { cx: 470, cy: 142, r: 30, c: '#f59e0b' },
  { cx: 615, cy: 188, r: 35, c: '#3b82f6' }, { cx: 280, cy: 75,  r: 20, c: '#8b5cf6' },
  { cx: 390, cy: 112, r: 38, c: '#10b981' }, { cx: 515, cy: 205, r: 24, c: '#6366f1' },
  { cx: 225, cy: 50,  r: 18, c: '#0ea5e9' }, { cx: 450, cy: 228, r: 42, c: '#f59e0b' },
  { cx: 612, cy: 262, r: 28, c: '#ef4444' }, { cx: 335, cy: 182, r: 18, c: '#3b82f6' },
  { cx: 565, cy: 302, r: 22, c: '#8b5cf6' }, { cx: 265, cy: 162, r: 32, c: '#10b981' },
  { cx: 485, cy: 298, r: 20, c: '#6366f1' }, { cx: 395, cy: 272, r: 36, c: '#f59e0b' },
];
const RECT_BL = [
  { cx: 22,  cy: 545, r: 50, c: '#3b82f6' }, { cx: 95,  cy: 560, r: 33, c: '#10b981' },
  { cx: 162, cy: 528, r: 44, c: '#f59e0b' }, { cx: 15,  cy: 478, r: 38, c: '#8b5cf6' },
  { cx: 248, cy: 552, r: 26, c: '#6366f1' }, { cx: 108, cy: 472, r: 46, c: '#0ea5e9' },
  { cx: 325, cy: 530, r: 22, c: '#ef4444' }, { cx: 195, cy: 462, r: 30, c: '#f59e0b' },
  { cx: 20,  cy: 402, r: 35, c: '#3b82f6' }, { cx: 388, cy: 518, r: 20, c: '#8b5cf6' },
  { cx: 132, cy: 388, r: 38, c: '#10b981' }, { cx: 280, cy: 445, r: 24, c: '#6366f1' },
  { cx: 62,  cy: 322, r: 18, c: '#0ea5e9' }, { cx: 218, cy: 355, r: 42, c: '#f59e0b' },
  { cx: 25,  cy: 248, r: 28, c: '#ef4444' }, { cx: 358, cy: 422, r: 18, c: '#3b82f6' },
  { cx: 155, cy: 282, r: 22, c: '#8b5cf6' }, { cx: 328, cy: 335, r: 32, c: '#10b981' },
  { cx: 92,  cy: 222, r: 20, c: '#6366f1' }, { cx: 252, cy: 272, r: 36, c: '#0ea5e9' },
];

// Trishul — same random positions, warm palette
const TC = ['#f59e0b','#ef4444','#f97316','#fbbf24','#ec4899','#a855f7','#f59e0b'];
const TRI_TR = RECT_TR.map((s, i) => ({ ...s, c: TC[i % 7] }));
const TRI_BL = RECT_BL.map((s, i) => ({ ...s, c: TC[i % 7] }));

export function RectangleCorner({ corner }: { corner: 'tr' | 'bl' }) {
  const shapes = corner === 'tr' ? RECT_TR : RECT_BL;
  const S = corner === 'tr' ? 620 : 560;
  return (
    <div style={{ position: 'fixed', top: corner === 'tr' ? 0 : undefined, bottom: corner === 'bl' ? 0 : undefined, right: corner === 'tr' ? 0 : undefined, left: corner === 'bl' ? 0 : undefined, width: S, height: S, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none">
        {shapes.map((s, i) => (
          <rect key={i} x={s.cx - s.r} y={s.cy - s.r} width={s.r * 2} height={s.r * 2}
            fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.55" />
        ))}
      </svg>
    </div>
  );
}

export function TriangleCorner({ corner }: { corner: 'tr' | 'bl' }) {
  const shapes = corner === 'tr' ? TRI_TR : TRI_BL;
  const S = corner === 'tr' ? 620 : 560;
  return (
    <div style={{ position: 'fixed', top: corner === 'tr' ? 0 : undefined, bottom: corner === 'bl' ? 0 : undefined, right: corner === 'tr' ? 0 : undefined, left: corner === 'bl' ? 0 : undefined, width: S, height: S, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} fill="none">
        {shapes.map((s, i) => {
          const pts = Array.from({ length: 3 }, (_, k) => {
            const a = (k * 120 - 90) * Math.PI / 180;
            return `${(s.cx + s.r * Math.cos(a)).toFixed(1)},${(s.cy + s.r * Math.sin(a)).toFixed(1)}`;
          }).join(' ');
          return <polygon key={i} points={pts} fill="none" stroke={s.c} strokeWidth="5.5" strokeOpacity="0.55" />;
        })}
      </svg>
    </div>
  );
}

export function computeStats(logs: TradeLog[]) {
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

export function fmtDate(ts: string) {
  try { return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }); }
  catch { return ts; }
}

export function fmtPrice(p: string | number | undefined) {
  if (p === undefined || p === '' || p === null) return '—';
  const n = parseFloat(String(p));
  return isNaN(n) ? '—' : n.toLocaleString('en-IN');
}

export function SortIcon({ active, dir }: { col: string; active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg width="8" height="8" viewBox="0 0 10 10" fill="none" style={{ opacity: active ? 1 : 0.3, flexShrink: 0 }}>
      {(!active || dir === 'asc') && <path d="M5 2L8 6H2L5 2Z" fill="currentColor" opacity={active && dir === 'asc' ? 1 : 0.4} />}
      {(!active || dir === 'desc') && <path d="M5 8L8 4H2L5 8Z" fill="currentColor" opacity={active && dir === 'desc' ? 1 : 0.4} />}
    </svg>
  );
}
