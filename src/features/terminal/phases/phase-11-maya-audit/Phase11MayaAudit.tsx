// Maya Audit phase — posts the completed trade for AI post-trade review.

import React from 'react';
import { useNetra } from '@/context/NetraContext';
import NetraAILabs from '@/components/Templates/NetraAILabs';
import { computeCardStats, tradeCardsStorageKey } from '../phase-10-mission-control/missionControl/helpers';
import type { TradeCard } from '../phase-10-mission-control/missionControl/types';

type Phase11MayaAuditProps = {
  enabled?: boolean;
};

function readAuditTradeCard(activeSessionId?: string | number | null): TradeCard | null {
  try {
    const raw = localStorage.getItem(tradeCardsStorageKey(activeSessionId));
    if (!raw) return null;
    const cards = JSON.parse(raw) as TradeCard[];
    return cards.findLast(card => card.entryLocked && card.closed) || null;
  } catch {
    return null;
  }
}

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '0.00';
  return value.toFixed(2);
}

function compactSuggestion(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const source = value as Record<string, unknown>;
  const fields = [
    source.stance,
    source.weapon,
    source.name,
    source.plan,
    source.expected,
    source.reasoning,
  ].filter(Boolean).map(String);
  return fields.join('\n').slice(0, 1200);
}

export default function Phase11MayaAudit({ enabled = true }: Phase11MayaAuditProps) {
  const { 
    auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit, 
    weaponPrediction,
    editFormData, finalCommand, selectedWeaponId, activeSessionId
  } = useNetra();
  const handleAudit = () => {
    if (!enabled) return;
    const auditCard = readAuditTradeCard(activeSessionId);
    if (!auditCard) return;
    const cardStats = auditCard ? computeCardStats(auditCard) : null;
    const entry = auditCard ? parseFloat(auditCard.entry) || 0 : parseFloat(String(editFormData.entry_price)) || 0;
    const stop  = auditCard ? parseFloat(auditCard.sl) || 0 : parseFloat(String(editFormData.stop_loss)) || 0;
    const exit  = auditCard ? parseFloat(auditCard.exitPrice) || 0 : parseFloat(String(editFormData.exit_price)) || 0;
    const qty   = cardStats ? cardStats.entryQty : parseFloat(String(editFormData.quantity)) || 0;
    const pnl   = cardStats?.finalPnL ?? 0;
    const rrr   = cardStats?.rMultiple ?? 0;

    triggerPostTradeAudit({
      suggestion: {
        command_route: finalCommand || '',
        child_route: auditCard?.weapon || selectedWeaponId || '',
        maya_suggestion: compactSuggestion(auditCard?.weaponPrediction || weaponPrediction),
      },
      trade: {
        protocol: finalCommand,
        weapon: auditCard?.weapon || selectedWeaponId,
        mode: auditCard?.executionMode || 'LIVE',
        instrument_kind: auditCard?.instrumentKind || 'UNDERLYING',
        underlying_asset: auditCard?.underlyingAsset || '',
        underlying_entry: auditCard?.instrumentKind === 'CONTRACT' ? auditCard?.underlyingEntry || '' : auditCard?.entry || '',
        underlying_exit: auditCard?.instrumentKind === 'CONTRACT' ? auditCard?.underlyingExit || '' : auditCard?.exitPrice || '',
        side: auditCard?.side || '',
        entry,
        stop,
        exit,
        quantity: qty,
        remaining_quantity: auditCard?.closed ? 0 : cardStats?.remainingQty ?? 0,
        average_entry: cardStats?.wPrice ?? entry,
        brokerage: cardStats?.brokerage ?? (parseFloat(String(editFormData.additional_cost)) || 0),
        gross_pnl: money(cardStats?.grossPnL),
        pnl: money(pnl),
        rrr: money(rrr),
        closed: auditCard?.closed || false,
        exit_type: auditCard?.exitType || '',
        add_entries_count: auditCard?.addEntries?.length || 0,
        partial_exits_count: auditCard?.partialExits?.length || 0,
        journal_notes: auditCard?.notes || String(editFormData.notes || ''),
        rating: editFormData.execution_rating || 0,
      },
    });
  };

  const waitingForClosedTrade = !enabled;

  return (
    <div>
      <NetraAILabs
        phaseId="mission_audit"
        phaseNum={9}
        title="NETRA AI LABS"
        subheading="MAYA - Audit Engine"
        showUpload={false}
        isEvaluating={isAuditing}
        output={auditData}
        onAnalyse={handleAudit}
        onStop={stopPostTradeAudit}
        analyseDisabled={waitingForClosedTrade}
        analyseDisabledReason="Close at least one trade before running Maya Audit."
      />
    </div>
  );
}
