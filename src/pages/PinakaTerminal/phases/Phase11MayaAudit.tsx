// Maya Audit phase — posts the completed trade for AI post-trade review.

import React from 'react';
import { useNetra } from '../../../context/NetraContext';
import NetraAILabs from '../../../components/Templates/NetraAILabs';

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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* ── Tactical Score ── */}
            <div style={{
              background: 'rgba(0,0,0,0.32)',
              border: '1px solid rgba(255,255,255,0.07)',
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', fontFamily: 'monospace', marginBottom: '6px' }}>
                  TACTICAL AUDIT SCORE
                </div>
                <div style={{
                  fontSize: '44px', fontWeight: 900, fontFamily: 'monospace', lineHeight: 1,
                  color: auditScore >= 80 ? '#22c55e' : auditScore >= 60 ? '#f59e0b' : '#ef4444',
                }}>
                  {auditData?.tactical_score ?? '--'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>RATING</div>
                <div style={{
                  marginTop: '6px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', fontFamily: 'monospace',
                  color: auditScore >= 80 ? '#22c55e' : auditScore >= 60 ? '#f59e0b' : '#ef4444',
                }}>
                  {auditScore >= 80 ? 'ELITE' : auditScore >= 60 ? 'PROFICIENT' : 'NEEDS WORK'}
                </div>
                {/* thin fill bar */}
                <div style={{ marginTop: '8px', width: '80px', height: '3px', background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{
                    height: '100%', width: `${Math.min(auditScore, 100)}%`,
                    background: auditScore >= 80 ? '#22c55e' : auditScore >= 60 ? '#f59e0b' : '#ef4444',
                    transition: 'width 600ms ease',
                  }} />
                </div>
              </div>
            </div>

            {/* ── Strategic Evaluation Pillars ── */}
            {auditData?.pillars && (
              <>
                <div style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', paddingLeft: '2px' }}>
                  STRATEGIC EVALUATION PILLARS
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(auditData.pillars).map(([key, data]) => {
                    const score = typeof data === 'object' && data !== null && 'score' in data ? (data as { score: number; critique: string }).score : 0;
                    const critique = typeof data === 'object' && data !== null && 'critique' in data ? (data as { score: number; critique: string }).critique : '';
                    const pillColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
                    return (
                      <div key={key} style={{
                        background: 'rgba(0,0,0,0.22)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        padding: '14px 16px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 900, letterSpacing: '0.15em', color: '#4169E1', fontFamily: 'monospace', textTransform: 'uppercase' }}>{key}</span>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: pillColor, fontFamily: 'monospace' }}>{score}%</span>
                        </div>
                        <div style={{ height: '2px', background: 'rgba(255,255,255,0.06)', marginBottom: '10px' }}>
                          <div style={{ height: '100%', width: `${Math.min(score, 100)}%`, background: pillColor, transition: 'width 600ms ease' }} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>{critique}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        }
      />
    </div>
  );
}
