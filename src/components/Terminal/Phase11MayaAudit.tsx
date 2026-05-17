import React from 'react';
import { useNetra } from '../../context/NetraContext';
import NetraAILabs from '../Templates/NetraAILabs';

export default function Phase11MayaAudit() {
  const { 
    auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit, 
    selections, notes,
    netraOutput, weaponPrediction,
    editFormData, finalCommand, selectedWeaponId
  } = useNetra();
  
  // ── Price calculations (same as Phase 10) ──
  const entry = parseFloat(String(editFormData.entry_price)) || 0;
  const stop  = parseFloat(String(editFormData.stop_loss))   || 0;
  const exit  = parseFloat(String(editFormData.exit_price))  || 0;
  const cost  = parseFloat(String(editFormData.additional_cost)) || 0;
  const qty   = parseFloat(String(editFormData.quantity)) || 0;
  
  const isShort     = (finalCommand || '').includes('INTERCEPTION');
  const stopDist    = Math.abs(entry - stop);
  const activeQty   = qty;
  const pnl         = exit > 0 ? (isShort ? ((entry - exit) * activeQty) - cost : ((exit - entry) * activeQty) - cost) : 0;
  const risk        = stopDist;
  const rrr         = risk > 0 && pnl !== 0 ? Math.abs(pnl / risk) : 0;

  const handleAudit = () => {
    triggerPostTradeAudit({
      context: selections,
      protocol: finalCommand,
      weapon: selectedWeaponId,
      entry, stop, exit,
      quantity: activeQty,
      pnl: pnl.toFixed(2),
      rrr: rrr.toFixed(2),
      narrative: String(editFormData.notes || ''),
      rating: editFormData.execution_rating || 0,
      ai_market_suggestion: netraOutput,
      ai_strategy_suggestion: weaponPrediction,
      notes: notes // fallback for any general notes
    });
  };

  const auditScore = auditData?.tactical_score ?? 0;

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
        customStatus={
          <div className="space-y-6">
            <div className="p-5 rounded-none border border-[var(--accent)] dark:border-white/20 bg-[var(--surface-2)]">
              <div className="text-[11px] font-black uppercase tracking-widest text-[var(--accent)] dark:text-white mb-1">Tactical Audit Score</div>
              <div className={`text-3xl font-black ${auditScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                {auditData?.tactical_score ?? '--'}
              </div>
            </div>
            <div className="label text-[var(--accent)] dark:text-white">Strategic Evaluation Pillars</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {auditData?.pillars && Object.entries(auditData.pillars).map(([key, data]) => (
                <div key={key} className="space-y-2.5 p-5 rounded-none bg-[var(--surface-2)] border border-[var(--accent)]/10 dark:border-white/10">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] font-black uppercase tracking-widest text-blue-500">{key}</span>
                    <span className="text-[12px] font-black text-[#ffffff]">{data.score}%</span>
                  </div>
                  <p className="text-[12px] text-[#ffffff] opacity-70 leading-relaxed italic">{data.critique}</p>
                </div>
              ))}
            </div>
          </div>
        }
      />
    </div>
  );
}
