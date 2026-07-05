// Phase 7 · TRADING DATA (a.k.a. Mission Control) — the day's trade journal.
// Each trade is a hybrid card: WeaponPanel (entry-model co-pilot) on the left,
// TradeCardComponent (execution record) on the right. Cards persist to
// localStorage and mirror to the backend quick-trade record.
//
// This file is the thin orchestrator; the pieces live in ./missionControl/.

import { useState, useEffect } from 'react';
import { useNetra } from '../../../context/NetraContext';
import { useNetraUtils } from '../../../hooks/useNetraUtils';
import type { TradeCard } from './missionControl/types';
import { CARDS_KEY, todayStr, mkCard, computeCardStats, MONO, StatCell } from './missionControl/helpers';
import UnifiedTradeCard from './missionControl/UnifiedTradeCard';

export default function Phase10MissionControl() {
  const {
    highestStep,
    rAmount, dailyLossHit, dailyTargetHit,
    session,
  } = useNetra();

  const isFullyLocked = highestStep > 6;
  const assetPrefix   = (session?.assetName || '').trim();
  const { getAuthHeaders } = useNetraUtils();

  const [cards, setCards] = useState<TradeCard[]>(() => {
    try {
      const raw = localStorage.getItem(CARDS_KEY);
      if (raw) return JSON.parse(raw) as TradeCard[];
    } catch { /* ignore */ }
    return [mkCard()];
  });

  useEffect(() => {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }, [cards]);

  const updCard = (id: string, updates: Partial<TradeCard>) =>
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

  const visibleCards = cards.filter(c => c.date === todayStr());

  // Aggregate stats across visible cards that have entry data.
  const aggStats = visibleCards.reduce((acc, card) => {
    const s = computeCardStats(card);
    if (s.wPrice <= 0) return acc;
    return {
      totalQty:   acc.totalQty   + s.entryQty,
      totalCost:  acc.totalCost  + s.totalCost,
      totalValue: acc.totalValue + s.wPrice * s.entryQty,
      hasShort:   acc.hasShort   || s.isShort,
    };
  }, { totalQty: 0, totalCost: 0, totalValue: 0, hasShort: false });

  const aggWPrice = aggStats.totalQty > 0 ? aggStats.totalValue / aggStats.totalQty : 0;
  const aggBe     = aggWPrice > 0
    ? (aggStats.hasShort ? aggWPrice - aggStats.totalCost / aggStats.totalQty : aggWPrice + aggStats.totalCost / aggStats.totalQty)
    : 0;

  // Risk-derived position size (R ÷ stop distance) off the primary card.
  const primary = visibleCards[0] ?? cards[0] ?? mkCard();
  const pStats  = computeCardStats(primary);
  const r       = parseFloat(rAmount) || 0;
  const positionSz = r > 0 && pStats.stopDist > 0 ? Math.floor(r / pStats.stopDist) : 0;

  const s400Active = dailyLossHit || dailyTargetHit;

  return (
    <div className="space-y-4 fade-up">

      {/* S-400 KILL SWITCH — daily loss/target limit terminates the session */}
      {s400Active && (
        <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>SESSION TERMINATED</div>
          <div style={{ fontSize: '13px', color: '#ef4444', opacity: 0.8, marginTop: '4px' }}>
            {dailyLossHit ? 'Daily loss limit hit. No further trades.' : 'Daily target achieved. Session ends voluntarily.'}
          </div>
        </div>
      )}

      {/* ── Aggregate stats ── */}
      {aggWPrice > 0 && (
        <div className="grid grid-cols-3 gap-3 px-4 py-3 border border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
          <StatCell label="Breakeven"        value={aggBe > 0 ? aggBe.toFixed(2) : '—'} />
          <StatCell label="Entry Cost"       value={aggWPrice * aggStats.totalQty > 0 ? `₹${(aggWPrice * aggStats.totalQty).toFixed(0)}` : '—'} />
          <StatCell label="Position Size (R)" value={positionSz > 0 ? `${positionSz} units` : '—'} color="#60a5fa" />
        </div>
      )}

      {/* ── Trade cards — each is a unified 3-column panel ── */}
      {visibleCards.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {visibleCards.map((card, idx) => (
            <UnifiedTradeCard
              key={card.id}
              card={card}
              tradeIndex={idx}
              assetPrefix={assetPrefix}
              username={session?.userName || ''}
              onChange={updates => updCard(card.id, updates)}
              onRemove={() => setCards(prev => prev.filter(c => c.id !== card.id))}
              canRemove={visibleCards.length > 1}
              isLocked={isFullyLocked}
              getAuthHeaders={getAuthHeaders}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border)', color: '#ffffff', fontSize: '12px', fontFamily: MONO, letterSpacing: '0.1em' }}>
          No trades today
        </div>
      )}

      {/* ── Add trade ── */}
      {!isFullyLocked && (
        <button
          onClick={() => setCards(prev => [...prev, mkCard()])}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            width: '100%', padding: '9px 0',
            border: '1px dashed var(--border)', background: 'none', cursor: 'pointer',
            fontSize: '10px', fontWeight: 900, color: '#ffffff',
            letterSpacing: '0.15em', textTransform: 'uppercase',
          }}
        >
          + Plan next trade (new weapon)
        </button>
      )}

    </div>
  );
}
