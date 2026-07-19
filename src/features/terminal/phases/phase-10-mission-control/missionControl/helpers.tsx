// Shared helpers for the Mission Control phase: persistence keys, time stamps,
// the trade-card factory, derived-stat maths, shared styles, and the small
// presentational primitives used across the weapon / trade cards.

import type { CSSProperties } from 'react';
import type { TradeCard } from './types';

// ─── persistence + time ───────────────────────────────────────────────────────

export const CARDS_KEY = 'netra_trade_cards_v1';
export const TERMINAL_STATS_EVENT = 'netra-terminal-stats-updated';
export const SAVE_TRADE_CARDS_EVENT = 'netra-save-trade-cards';
export interface SaveTradeCardsRequest { tasks: Array<Promise<boolean>> }
export const tradeCardsStorageKey = (terminalSessionId?: string | number | null) =>
  terminalSessionId ? `${CARDS_KEY}:${terminalSessionId}` : `${CARDS_KEY}:draft`;
export const autoTime  = () => new Date().toTimeString().slice(0, 5);
export const localDateStr = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
export const autoTimeSeconds = () => new Date().toTimeString().slice(0, 8);

/** A fresh, empty trade card stamped for today. */
export function mkCard(): TradeCard {
  return {
    id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    date: localDateStr(), dbId: null, learningId: null,
    side: 'BUY', executionMode: 'LIVE', instrumentKind: 'UNDERLYING', weapon: '', weaponThought: '', weaponNote: '', weaponPrediction: null,
    underlyingAsset: '', underlyingEntry: '', underlyingExit: '', assetSuffix: '',
    entry: '', sl: '', slManual: false, entryLocked: false,
    qty: '65', cost: '10',
    t1: '', t2: '', t3: '', t4: '',
    addEntries: [], partialExits: [],
    beTriggered: false, notes: '',
    exitPrice: '', entryTime: '', exitDate: '', exitTime: '', closed: false,
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
  const baseAssetEntry = parseFloat(card.underlyingEntry || '') || 0;
  const entries = [
    ...(baseEntry > 0 && baseQty > 0 ? [{ price: baseEntry, qty: baseQty, cost: baseCost, stop: baseSl, assetEntry: baseAssetEntry }] : []),
    ...card.addEntries.filter(e => e.price > 0 && e.qty > 0).map(e => ({
      price: e.price,
      qty: e.qty,
      cost: e.cost,
      stop: e.stop,
      assetEntry: parseFloat(e.assetEntry || '') || 0,
    })),
  ];
  const entryQty  = entries.reduce((s, e) => s + e.qty, 0);
  const totalCost = entries.reduce((s, e) => s + e.cost, 0);
  const wPrice    = entryQty > 0 ? entries.reduce((s, e) => s + e.price * e.qty, 0) / entryQty : 0;
  const stopQty = entries.reduce((s, e) => s + (e.stop > 0 ? e.qty : 0), 0);
  const avgSl = stopQty > 0 ? entries.reduce((s, e) => s + (e.stop > 0 ? e.stop * e.qty : 0), 0) / stopQty : 0;
  const assetEntryQty = entries.reduce((s, e) => s + (e.assetEntry > 0 ? e.qty : 0), 0);
  const avgAssetEntry = assetEntryQty > 0
    ? entries.reduce((s, e) => s + (e.assetEntry > 0 ? e.assetEntry * e.qty : 0), 0) / assetEntryQty
    : 0;
  const partialQty    = card.partialExits.reduce((s, p) => s + p.qty, 0);
  const remainingQty  = Math.max(entryQty - partialQty, 0);
  const isShort  = card.side === 'SELL';
  const be       = wPrice > 0 ? (isShort ? wPrice - totalCost / (entryQty || 1) : wPrice + totalCost / (entryQty || 1)) : 0;
  const latestSl = card.addEntries.length > 0 ? card.addEntries[card.addEntries.length - 1].stop : baseSl;
  const stopDist = Math.abs(wPrice - (avgSl || latestSl || baseSl));
  const partialPnL = card.partialExits.reduce((s, p) => s + (isShort ? wPrice - p.price : p.price - wPrice) * p.qty, 0);
  const exitP = parseFloat(card.exitPrice) || 0;
  const exitPnL = exitP > 0 && wPrice > 0
    ? (isShort ? wPrice - exitP : exitP - wPrice) * remainingQty
    : 0;
  const hasRealizedExit = wPrice > 0 && (exitP > 0 || card.partialExits.length > 0);
  const grossPnL = hasRealizedExit ? exitPnL + partialPnL : null;
  const finalPnL = grossPnL !== null
    ? grossPnL - totalCost
    : null;
  const riskAmount = stopDist > 0 && entryQty > 0 ? stopDist * entryQty + totalCost : 0;
  const rMultiple = finalPnL !== null && riskAmount > 0 ? finalPnL / riskAmount : null;
  const realizedPoints = grossPnL !== null && entryQty > 0 ? grossPnL / entryQty : null;
  return {
    wPrice,
    avgSl,
    avgAssetEntry,
    entryQty,
    remainingQty,
    totalCost,
    brokerage: totalCost,
    be,
    isShort,
    latestSl,
    stopDist,
    riskAmount,
    grossPnL,
    finalPnL,
    rMultiple,
    realizedPoints,
    partialPnL,
    exitPnL,
  };
}

export function computeTerminalSessionStats(cards: TradeCard[], date = localDateStr()) {
  const dayCards = cards.filter(card => (card.date || date) === date);
  return dayCards.reduce((acc, card) => {
    if (!card.entryLocked) return acc;

    const stats = computeCardStats(card);
    const hasEntry = stats.wPrice > 0 && stats.entryQty > 0;
    if (!hasEntry) return acc;

    const isClosed = Boolean(card.closed && card.exitPrice);
    const finalPnL = typeof stats.finalPnL === 'number' ? stats.finalPnL : 0;
    const bookedPnL = Number(stats.partialPnL || 0);
    const realisedPnL = isClosed ? finalPnL : bookedPnL;
    const exposure = isClosed ? 0 : stats.wPrice * stats.remainingQty;

    acc.total += 1;
    acc.active += isClosed ? 0 : 1;
    acc.closed += isClosed ? 1 : 0;
    acc.realisedPnl += realisedPnL;
    acc.openExposure += exposure;
    acc.brokerage += stats.brokerage || 0;
    acc.remainingQty += isClosed ? 0 : stats.remainingQty;
    if (isClosed && finalPnL > 0) acc.wins += 1;
    if (isClosed && finalPnL < 0) acc.losses += 1;
    return acc;
  }, {
    total: 0,
    active: 0,
    closed: 0,
    wins: 0,
    losses: 0,
    realisedPnl: 0,
    openExposure: 0,
    brokerage: 0,
    remainingQty: 0,
  });
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
      <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, color: color || 'rgba(248,250,252,0.78)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
      <input type="number" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        style={{ ...bare, fontSize: '14px', fontWeight: 900, color: color || '#ffffff', minHeight: '40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.14)' }} />
    </div>
  );
}
