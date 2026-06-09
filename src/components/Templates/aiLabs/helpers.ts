// Shared colour + style helpers for the Maya AI Labs box.

import type { CSSProperties } from 'react';

export const MONO: CSSProperties = { fontFamily: 'JetBrains Mono, Consolas, monospace' };

// ── output metric colours ──
export function convictionHex(val: string | undefined): string {
  if (!val) return 'rgba(255,255,255,0.25)';
  const v = val.toUpperCase();
  if (v === 'HIGH')                  return '#22c55e';
  if (v === 'MED' || v === 'MEDIUM') return '#f59e0b';
  return '#ef4444';
}
export function riskHex(val: string | undefined): string {
  if (!val) return 'rgba(255,255,255,0.25)';
  const v = val.toUpperCase();
  if (v === 'LOW')    return '#22c55e';
  if (v === 'MEDIUM') return '#f59e0b';
  return '#ef4444';
}

const CMD_HEX: Record<string, string> = {
  STRIKE:        '#ffd700',
  INTERCEPTION:  '#38bdf8',
  SATURATION:    '#f97316',
  'NO ENGAGEMENT': '#ef4444',
  NO_ENGAGEMENT:   '#ef4444',
};
export function cmdHex(label: string): string {
  return CMD_HEX[label.toUpperCase().replace(/_/g, ' ')] || '#4169E1';
}

// ── generation-parameter slider colours ──
export function tempColor(v: number): string {
  if (v <= 0.25) return '#22c55e';   // precise — cool green
  if (v <= 0.55) return '#60a5fa';   // balanced — blue
  if (v <= 0.78) return '#f59e0b';   // creative — amber
  return '#ef4444';                   // wild — red
}
export function freqColor(v: number): string {
  if (v <= 0.5)  return '#a78bfa';   // low — purple (diverse)
  if (v <= 1.2)  return '#60a5fa';   // medium — blue
  return '#fb7185';                   // high — pink-red
}
