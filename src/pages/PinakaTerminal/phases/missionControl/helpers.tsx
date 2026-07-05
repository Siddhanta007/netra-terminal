// Shared helpers for the Mission Control phase: persistence keys, time stamps,
// the trade-card factory, derived-stat maths, shared styles, and the small
// presentational primitives used across the weapon / trade cards.

import type { CSSProperties } from 'react';
import type { TradeCard } from './types';

// ─── persistence + time ───────────────────────────────────────────────────────

export const CARDS_KEY = 'netra_trade_cards_v1';
export const todayStr  = () => new Date().toISOString().slice(0, 10);
export const autoTime  = () => new Date().toTimeString().slice(0, 5);

/** A fresh, empty trade card stamped for today. */
export function mkCard(): TradeCard {
  return {
    id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    date: todayStr(), dbId: null,
    side: 'BUY', weapon: '', weaponThought: '', weaponNote: '', weaponPrediction: null, assetSuffix: '',
    entry: '', sl: '', slManual: false,
    qty: '65', cost: '10',
    t1: '', t2: '', t3: '', t4: '',
    addEntries: [], partialExits: [],
    beTriggered: false, notes: '',
    exitPrice: '', entryTime: '', exitTime: '', closed: false,
    tradeStatus: '', exitType: '',
  };
}

/**
 * Derives the trade's weighted-average entry, quantities, breakeven, stop
 * distance and realised P&L from its base entry, scale-in entries and partial
 * exits. Pure — safe to call on every render.
 */
export function computeCardStats(card: TradeCard) {
  const baseEntry = parseFloat(card.entry) || 0;
  const baseSl    = parseFloat(card.sl)    || 0;
  const baseQty   = parseFloat(card.qty)   || 0;
  const baseCost  = parseFloat(card.cost)  || 0;
  const entries = [
    ...(baseEntry > 0 && baseQty > 0 ? [{ price: baseEntry, qty: baseQty, cost: baseCost }] : []),
    ...card.addEntries.filter(e => e.price > 0 && e.qty > 0).map(e => ({ price: e.price, qty: e.qty, cost: e.cost })),
  ];
  const entryQty  = entries.reduce((s, e) => s + e.qty, 0);
  const totalCost = entries.reduce((s, e) => s + e.cost, 0);
  const wPrice    = entryQty > 0 ? entries.reduce((s, e) => s + e.price * e.qty, 0) / entryQty : 0;
  const partialQty    = card.partialExits.reduce((s, p) => s + p.qty, 0);
  const remainingQty  = Math.max(entryQty - partialQty, 0);
  const isShort  = card.side === 'SELL';
  const be       = wPrice > 0 ? (isShort ? wPrice - totalCost / (entryQty || 1) : wPrice + totalCost / (entryQty || 1)) : 0;
  const latestSl = card.addEntries.length > 0 ? card.addEntries[card.addEntries.length - 1].stop : baseSl;
  const stopDist = Math.abs(wPrice - (latestSl || baseSl));
  const partialPnL = card.partialExits.reduce((s, p) => s + (isShort ? wPrice - p.price : p.price - wPrice) * p.qty, 0);
  const exitP = parseFloat(card.exitPrice) || 0;
  const finalPnL = exitP > 0 && wPrice > 0
    ? (isShort ? wPrice - exitP : exitP - wPrice) * remainingQty + partialPnL - totalCost
    : null;
  return { wPrice, entryQty, remainingQty, totalCost, be, isShort, latestSl, stopDist, finalPnL };
}

// ─── shared styles ────────────────────────────────────────────────────────────

export const MONO = 'JetBrains Mono, Consolas, monospace';
export const bare: CSSProperties = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.16)',
  borderRadius: '0px',
  outline: 'none',
  fontFamily: MONO, color: '#e8eaed', width: '100%',
  padding: '12px 14px',
};
export const sep  = '1px solid rgba(255,255,255,0.07)';
export const SEP6 = '1px solid rgba(255,255,255,0.06)';
export const BOX_H = '920px';   // match the Maya AI boxes for uniformity

// ─── presentational primitives ────────────────────────────────────────────────

/** A labelled metric in the day-aggregate summary strip. */
export function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 900, color: color || '#ffffff' }}>{value}</div>
    </div>
  );
}

/** A labelled boxed number input — two per row inside the trade card. */
export function Field({ label, value, onChange, disabled, placeholder, color }: {
  label: string; value: string; onChange: (v: string) => void; disabled?: boolean;
  placeholder?: string; color?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 800, color: color || 'rgba(255,255,255,0.55)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{label}</span>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ ...bare, fontSize: '13px', fontWeight: 900, color: color || '#ffffff' }} />
    </div>
  );
}
