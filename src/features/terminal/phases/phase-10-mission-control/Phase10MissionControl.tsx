// Phase 7 · TRADING DATA (a.k.a. Mission Control) — the day's trade journal.
// Each trade uses UnifiedTradeCard for entry-model guidance plus execution
// capture. Cards persist to localStorage and mirror to the backend terminal-trade
// record.
//
// This file is the thin orchestrator; the pieces live in ./missionControl/.

import { useState, useEffect, useMemo } from 'react';
import { useNetra } from '@/context/NetraContext';
import { useNetraUtils } from '@/hooks/useNetraUtils';
import type { TradeCard } from './missionControl/types';
import { TERMINAL_STATS_EVENT, localDateStr, mkCard, computeTerminalSessionStats, tradeCardsStorageKey } from './missionControl/helpers';
import UnifiedTradeCard from './missionControl/UnifiedTradeCard';
import { TerminalEmptyState, TerminalStatusBadge } from '@/components/UI/TerminalPrimitives';

export default function Phase10MissionControl() {
  const {
    dailyLossHit, dailyTargetHit,
    session,
    activeSessionId,
  } = useNetra();

  const assetPrefix   = (session?.assetName || '').trim();
  const { getAuthHeaders } = useNetraUtils();
  const cardsStorageKey = useMemo(() => tradeCardsStorageKey(activeSessionId), [activeSessionId]);

  const loadCards = (key: string): TradeCard[] => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as TradeCard[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* ignore */ }
    return [mkCard()];
  };

  const [cards, setCards] = useState<TradeCard[]>(() => loadCards(cardsStorageKey));

  useEffect(() => {
    setCards(loadCards(cardsStorageKey));
  }, [cardsStorageKey]);

  useEffect(() => {
    localStorage.setItem(cardsStorageKey, JSON.stringify(cards));
    window.dispatchEvent(new CustomEvent(TERMINAL_STATS_EVENT, {
      detail: computeTerminalSessionStats(cards),
    }));
  }, [cards, cardsStorageKey]);

  const updCard = (id: string, updates: Partial<TradeCard>) =>
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

  const visibleCards = cards.filter(c => c.date === localDateStr());

  const s400Active = dailyLossHit || dailyTargetHit;

  return (
    <div className="space-y-4 fade-up">

      {/* S-400 KILL SWITCH — daily loss/target limit terminates the session */}
      {s400Active && (
        <div className="terminal-notice is-danger">
          <TerminalStatusBadge tone="danger">SESSION TERMINATED</TerminalStatusBadge>
          <div className="terminal-notice-description">
            {dailyLossHit ? 'Daily loss limit hit. No further trades.' : 'Daily target achieved. Session ends voluntarily.'}
          </div>
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
              terminalSessionId={activeSessionId ? String(activeSessionId) : null}
              onChange={updates => updCard(card.id, updates)}
              onRemove={() => setCards(prev => prev.filter(c => c.id !== card.id))}
              canRemove={visibleCards.length > 1}
              isLocked={false}
              getAuthHeaders={getAuthHeaders}
            />
          ))}
        </div>
      ) : (
        <TerminalEmptyState title="No trades today" description="Plan a trade to begin the execution ledger." />
      )}

      {/* ── Add trade ── */}
      {!s400Active && (
        <button
          onClick={() => setCards(prev => [...prev, mkCard()])}
          className="terminal-add-action"
        >
          + Plan next trade (new weapon)
        </button>
      )}

    </div>
  );
}
