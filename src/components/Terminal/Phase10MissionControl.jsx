import { useNetra } from '../../context/NetraContext';
import NetraAILabs from '../Templates/NetraAILabs';

/**
 * Phase 10: Mission Control - Post-execution performance audit.
 * Refined typographic system with theme-aware high-contrast tactical coloring.
 * Updated: 'Commit Mission' button changed to 'Next' to unlock Maya Audit section.
 */
export default function Phase10MissionControl() {
  const {
    session,
    finalCommand, selectedWeaponId,
    notes, setNotes,
    editFormData, setEditFormData,
    commitTradeLog, updateTradeLog,
    activeEditLog,
    auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit,
    selections,
    highestStep, confirmStep, editStep,
    stepTimestamps
  } = useNetra();

  // ── Calculation Logic ──────────────────────────────────────
  const entry = parseFloat(editFormData.entry_price) || 0;
  const stop = parseFloat(editFormData.stop_loss) || 0;
  const exit = parseFloat(editFormData.exit_price) || 0;
  const cost = parseFloat(editFormData.additional_cost) || 0;
  
  const isShort = (finalCommand || '').includes('INTERCEPTION');
  const breakeven = isShort ? entry - cost : entry + cost;
  const pnl = exit > 0 ? (isShort ? (entry - exit) - cost : (exit - entry) - cost) : 0;
  const pnlPct = entry > 0 ? (pnl / entry) * 100 : 0;
  const risk = Math.abs(entry - stop);
  const rrr = (risk > 0 && pnl > 0) ? (pnl / risk) : 0;

  const handleAudit = () => {
    triggerPostTradeAudit({
      context: selections, protocol: finalCommand, weapon: selectedWeaponId,
      entry, stop, exit, pnl: pnl.toFixed(2), rrr: rrr.toFixed(2),
      narrative: editFormData.notes || '', rating: editFormData.execution_rating || 0
    });
  };

  return (
    <div className="space-y-10">
      {/* ═══ TIER 1: MISSION PERFORMANCE & DEBRIEF ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up items-stretch">
        
        {/* LEFT: MISSION TELEMETRY (PROFESSIONAL INSTRUMENT) */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="p-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col flex-1 min-h-[480px]">
            
            {/* INPUT SECTION */}
            <div className="grid grid-cols-4 gap-4 pb-8 border-b border-[var(--border)] mb-8">
               {[
                 { label: 'Entry Price', k: 'entry_price' },
                 { label: 'Stop Loss', k: 'stop_loss' },
                 { label: 'Costs', k: 'additional_cost' },
                 { label: 'Exit Price', k: 'exit_price' }
               ].map((f) => (
                 <div key={f.k} className="space-y-1.5 flex flex-col">
                    <span className="text-[7px] font-black uppercase tracking-widest pl-1 opacity-60">Target {f.label.split(' ')[0]}</span>
                    <input 
                      type="number" 
                      value={editFormData[f.k] || ''} 
                      onChange={e => setEditFormData({ ...editFormData, [f.k]: e.target.value })} 
                      className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-black focus:border-[#4169E1] transition-all outline-none tabular-nums"
                      placeholder="0.00"
                    />
                 </div>
               ))}
            </div>

            {/* PERFORMANCE ANALYSIS ZONE */}
            <div className="flex-1 flex flex-col">
               <div className="flex-1 flex flex-col">
                  {/* Breakeven Row */}
                  <div className="flex justify-between items-center py-4 border-b border-[var(--border)]">
                     <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Breakeven Threshold</div>
                     <div className="text-sm font-black tabular-nums">{breakeven.toFixed(2)}</div>
                  </div>

                  {/* Primary Performance Row */}
                  <div className="flex justify-between items-center py-6 border-b border-[var(--border)]">
                     <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Realized Mission PnL</div>
                     <div className={`text-3xl font-black tabular-nums ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                     </div>
                  </div>

                  {/* Yield & RRR Grid */}
                  <div className="grid grid-cols-2 gap-8 py-6">
                     <div className="flex flex-col gap-1">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Performance Yield</span>
                        <div className={`text-xl font-black tabular-nums ${pnlPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                        </div>
                     </div>
                     <div className="flex flex-col gap-1 items-end">
                        <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Risk Reward (RRR)</span>
                        <div className="text-xl font-black text-blue-500 tabular-nums">
                           {rrr.toFixed(2)}R
                        </div>
                     </div>
                  </div>
               </div>

               {/* PERFORMANCE RATING - CLEAN INTEGRATION */}
               <div className="mt-auto pt-6 border-t border-[var(--border)] flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Execution Precision Rating</span>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button 
                        key={n} 
                        onClick={() => setEditFormData({...editFormData, execution_rating: n})} 
                        className="text-xl transition-colors duration-200" 
                        style={{ color: editFormData.execution_rating >= n ? '#F59E0B' : 'var(--border)' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* RIGHT: MISSION DEBRIEF */}
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <div className="space-y-6">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 mb-1">Mission Control</div>
              <h2 className="text-[22px] font-black tracking-tight text-[var(--text-1)] dark:text-white uppercase leading-none">Operational Audit</h2>
              <p className="text-[9px] font-bold uppercase tracking-widest mt-2 text-[var(--accent)] dark:text-white/40">Performance Journaling</p>
            </div>

            <div className="flex-1 flex flex-col gap-3 min-h-0">
              <div className="label text-[var(--accent)] dark:text-white/60">Mission Debrief Note</div>
              <textarea
                value={editFormData.notes || ''}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                placeholder="Journal post-mission performance and psychological state..."
                className="field-area flex-1 min-h-[220px] border-[var(--accent)]/20 dark:border-white/10"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 border-t border-[var(--accent)]/20 dark:border-white/20">
              <div className="flex gap-2">
                <button onClick={() => editStep(7)} className="btn-reset flex-1">Edit Step</button>
                <button 
                  onClick={() => confirmStep(7)}
                  className="h-12 btn-confirm text-[10px] font-black uppercase tracking-[0.2em] flex-1"
                >
                  Next
                </button>
              </div>
          </div>
        </div>
      </div>

      {/* ═══ TIER 2: INTEGRATED NETRA AI LABS (AUDIT) ═══ */}
      {highestStep >= 8 && (
        <div className="pt-10 border-t border-[var(--accent)]/20 dark:border-white/20">
          <NetraAILabs 
            phaseId="mission_audit"
            phaseNum={10}
            title="NETRA AI LABS"
            subheading="MAYA - Audit Engine"
            showUpload={false}
            isEvaluating={isAuditing}
            output={auditData}
            onAnalyse={handleAudit}
            onStop={stopPostTradeAudit}
            customStatus={
              <div className="space-y-6">
                 <div className="p-5 rounded-xl border border-[var(--accent)] dark:border-white/20 bg-[var(--surface-2)]">
                    <div className="text-[8px] font-black uppercase tracking-widest text-[var(--accent)] dark:text-white/50 mb-1">Tactical Audit Score</div>
                    <div className={`text-3xl font-black ${auditData?.tactical_score >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {auditData?.tactical_score || '--'}
                    </div>
                 </div>
                 
                 <div className="label text-[var(--accent)] dark:text-white/60">Strategic Evaluation Pillars</div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {auditData?.pillars && Object.entries(auditData.pillars).map(([key, data]) => (
                      <div key={key} className="space-y-2.5 p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--accent)]/10 dark:border-white/10">
                         <div className="flex justify-between items-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-blue-500">{key}</span>
                            <span className="text-[10px] font-black text-[var(--text-1)] dark:text-white">{data.score}%</span>
                         </div>
                         <p className="text-[10px] text-[var(--text-3)] leading-relaxed italic">{data.critique}</p>
                      </div>
                    ))}
                 </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
}
