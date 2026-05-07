import { useNetra } from '../../context/NetraContext';
import WeaponBriefing from './WeaponBriefing';

export default function WeaponArmory({ protocol = 'strike' }) {
  const {
    SYSTEM_DATA, selectedWeaponId, setSelectedWeaponId,
    weaponLocked, setWeaponLocked,
    finalCommand,
    notes, setNotes,
    editFormData, setEditFormData,
    sysRecommendation,
    session,
    activeEditLog,
    commitTradeLog,
    updateTradeLog,
    // NETRA Phase 2
    triggerWeaponPrediction, stopWeaponPrediction, isPredictingWeapon, weaponPrediction,
    auditData, isAuditing, triggerPostTradeAudit,
    selections,
    highestStep, confirmStep, editStep,
  } = useNetra();

  const type = protocol || 'strike';
  const weaponsList = SYSTEM_DATA.weapons ? (SYSTEM_DATA.weapons[type.toLowerCase()] || []) : [];
  const activeWeapon = weaponsList.find(w => w.id === selectedWeaponId);

  // Common button style for all primary actions
  const actionBtnStyle = {
    height: '32px',
    fontSize: '10px',
    fontWeight: '700',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    borderRadius: '6px'
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* ═══ TIER 1: OPERATIONAL SELECTION & ADVICE ═══ */}
      <div className="p-8 md:p-10 rounded-2xl premium-shadow" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-1)' }}>
        <div className="flex justify-between items-center mb-8 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-[var(--accent)] rounded-full"></div>
            <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] font-black text-[var(--accent)]">Netra Labs</h3>
            <div className="flex items-center gap-3">
              <span className="text-[9px] px-3 py-1.5 rounded-lg tracking-widest font-black bg-[var(--accent-bg)] text-[var(--accent)] border border-[var(--accent-border)]/20 uppercase">NETRA Advisor</span>
              <span className="text-[9px] px-3 py-1.5 rounded-lg tracking-widest font-black bg-[var(--surface-2)] text-[var(--text-4)] border border-[var(--border)] uppercase">{protocol} Sector</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-stretch">
          {/* LEFT: Operational Zone */}
          <div className="lg:col-span-7 flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-4)] opacity-50">Weapon Arsenal</h3>
                <div className="h-[1px] flex-1 bg-[var(--border)]"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {weaponsList.map((weapon) => {
                  const isRec = (sysRecommendation && sysRecommendation.rec === weapon.id) || (weaponPrediction && weaponPrediction.weapon === weapon.id);
                  const isSelected = selectedWeaponId === weapon.id;
                  return (
                    <button
                      key={weapon.id}
                      onClick={() => !weaponLocked && setSelectedWeaponId(weapon.id)}
                      disabled={weaponLocked}
                      className={`group p-5 text-left border rounded-2xl transition-all duration-300 relative flex flex-col justify-between h-full ${isSelected
                        ? 'border-blue-600 bg-blue-600/10 text-blue-500 ring-1 ring-blue-600 shadow-lg scale-[1.02]'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-3)]'
                      } ${weaponLocked && !isSelected ? 'opacity-20 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {isRec && (
                        <div className="absolute -top-2.5 -right-1 text-[7px] font-black tracking-widest bg-blue-600 px-3 py-1 uppercase text-white rounded-full shadow-lg z-20">SYS REC</div>
                      )}
                      <div className="space-y-1">
                        <h4 className="font-sans text-xl font-black tracking-tighter uppercase leading-none">{weapon.id}</h4>
                        <div className="text-[8px] uppercase tracking-widest opacity-50 font-black">{weapon.name}</div>
                      </div>
                      <div className={`w-6 h-[2px] mt-4 transition-all ${isSelected ? 'bg-blue-500 w-full' : 'bg-transparent group-hover:bg-[var(--border-strong)]'}`}></div>
                    </button>
                  );
                })}
                <button
                  onClick={() => !weaponLocked && setSelectedWeaponId('MANUAL')}
                  disabled={weaponLocked}
                  className={`group p-5 text-left border rounded-2xl transition-all duration-300 relative flex flex-col justify-between h-full ${selectedWeaponId === 'MANUAL'
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)] ring-1 ring-[var(--accent)] shadow-lg scale-[1.02]'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text-3)]'
                  } ${weaponLocked && selectedWeaponId !== 'MANUAL' ? 'opacity-20 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="space-y-1">
                    <h4 className="font-sans text-xl font-black tracking-tighter uppercase leading-none">MANUAL</h4>
                    <div className="text-[8px] uppercase tracking-widest opacity-50 font-black">Custom</div>
                  </div>
                  <div className={`w-6 h-[2px] mt-4 transition-all ${selectedWeaponId === 'MANUAL' ? 'bg-[var(--accent)] w-full' : 'bg-transparent group-hover:bg-[var(--border-strong)]'}`}></div>
                </button>
              </div>
            </div>

            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex items-center gap-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-4)] opacity-50">Mission Protocol Briefing</h3>
                <div className="h-[1px] flex-1 bg-[var(--border)]"></div>
              </div>
              <div className="bg-[var(--surface-2)]/30 border border-[var(--border)] rounded-3xl p-8 flex-1">
                {selectedWeaponId === 'MANUAL' ? (
                  <div className="h-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0a0c10] rounded-2xl border border-[var(--accent)]/30 group shadow-inner min-h-[240px]">
                    <div className="relative z-10 text-center">
                       <h4 className="text-2xl font-black tracking-tight uppercase text-white italic">Manual Override</h4>
                       <span className="text-[9px] font-black tracking-[0.4em] uppercase text-[var(--accent)] animate-pulse">Operator Engagement Area</span>
                    </div>
                  </div>
                ) : activeWeapon ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-[var(--accent)] tracking-widest opacity-70">Logic Analysis</span>
                        <div className="text-[13px] font-bold text-[var(--text-1)]">{activeWeapon.logic}</div>
                      </div>
                      <div className="space-y-2">
                        <span className="text-[8px] font-black uppercase text-[var(--accent)] tracking-widest opacity-70">Activation</span>
                        <div className="text-[13px] font-bold text-[var(--text-1)]">{activeWeapon.activation}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      {[{l:'Entry',v:activeWeapon.entry,c:'text-blue-400'}, {l:'Stop',v:activeWeapon.stop,c:'text-rose-400'}, {l:'Target',v:activeWeapon.target,c:'text-emerald-400'}, {l:'Misfire',v:activeWeapon.misfire,c:'text-amber-400'}].map((item, idx) => (
                        <div key={idx} className="space-y-2 text-center p-3 bg-[var(--surface-3)]/40 rounded-2xl border border-[var(--border)]/20">
                          <span className="text-[8px] font-black uppercase opacity-60">{item.l}</span>
                          <div className={`text-[10px] font-black ${item.c}`}>{item.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-10 text-center">
                    <span className="text-[12px] uppercase font-black tracking-[0.5em]">Awaiting Selection</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Strategic Advisor */}
          <div className="lg:col-span-5 lg:pl-10 border-t lg:border-t-0 lg:border-l border-[var(--border)] flex flex-col gap-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-3)]">NETRA's Advice</h3>
                {weaponPrediction && (
                  <div className={`text-[8px] font-black px-3 py-1 rounded-full border ${weaponPrediction.predictability === 'HIGH' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'}`}>CONFIDENCE: {weaponPrediction.predictability}</div>
                )}
              </div>
              <div className="p-6 rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-bg)]/20 min-h-[240px] relative overflow-hidden">
                {isPredictingWeapon ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/80 backdrop-blur-sm">
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] animate-pulse text-[var(--accent)]">Synthesizing Protocol...</span>
                  </div>
                ) : weaponPrediction ? (
                  <div className="space-y-4">
                    <p className="text-sm font-bold italic text-[var(--text-1)]">\"{weaponPrediction.plan}\"</p>
                    <p className="text-[12px] leading-relaxed text-[var(--text-2)]">{weaponPrediction.reasoning}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full opacity-30 text-center text-[10px] font-black tracking-widest">AWAITING STS DIMENSIONS</div>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={stopWeaponPrediction} 
                  disabled={!isPredictingWeapon}
                  className="btn-reset flex-1"
                >
                  Stop
                </button>
                <button 
                  onClick={triggerWeaponPrediction} 
                  disabled={isPredictingWeapon || weaponLocked} 
                  className="btn-confirm flex-1"
                >
                  Analyse with NETRA
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-4)] opacity-50">Operator's Thought</h3>
              <textarea
                value={notes.weapon_thought || ''}
                onChange={(e) => setNotes({ ...notes, weapon_thought: e.target.value })}
                placeholder="Capture tactical nuances..."
                disabled={weaponLocked}
                className="w-full h-32 bg-[var(--surface-2)]/50 border border-[var(--border)] rounded-xl p-4 text-xs text-[var(--text-2)] focus:outline-none focus:border-[var(--accent)] resize-none"
              />
            </div>

            <div className="mt-auto pt-6 border-t border-[var(--border)] flex gap-4">
              <button onClick={() => setWeaponLocked(false)} className="btn-reset flex-1" disabled={!weaponLocked}>Edit Selection</button>
              <button onClick={() => setWeaponLocked(true)} className={`${weaponLocked ? 'btn-confirmed' : 'btn-confirm'} flex-1`} disabled={weaponLocked || (selectedWeaponId === 'MANUAL' && !editFormData.manual_weapon)}>{weaponLocked ? '✓ System Armed' : 'Confirm Deployment'}</button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ TIER 2: MISSION CONTROL & PERFORMANCE ═══ */}
      {(weaponLocked || activeEditLog) && (
        <div className="p-8 rounded-2xl premium-shadow animate-in fade-in duration-500" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3 mb-6 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
            <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-1)]">Mission Control & Performance</div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT: Tactical Parameters */}
            <div className="lg:col-span-7">
              <div className="p-6 rounded-2xl bg-[var(--surface-2)]/40 border border-[var(--border)] h-full flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1 h-3 bg-[var(--accent)] rounded-full"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">Tactical Parameters</span>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase text-[var(--text-4)] tracking-widest opacity-60">Target Asset</label>
                    <input type="text" value={editFormData.trading_asset ?? (session?.assetName || '')} onChange={e => setEditFormData({ ...editFormData, trading_asset: e.target.value })} className="w-full h-9 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    {[{l:'Entry',k:'entry_price'}, {l:'Stop',k:'stop_loss'}, {l:'Exit',k:'exit_price'}].map(f => (
                      <div key={f.k} className="space-y-1.5">
                        <label className="text-[8px] font-black uppercase text-[var(--text-4)] tracking-widest opacity-60">{f.l}</label>
                        <input type="number" value={editFormData[f.k] || ''} onChange={e => setEditFormData({ ...editFormData, [f.k]: e.target.value })} className="w-full h-9 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold" />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-[var(--text-4)] tracking-widest opacity-60">Protocol</label>
                      <select value={editFormData.buying_type || 'Market'} onChange={e => setEditFormData({ ...editFormData, buying_type: e.target.value })} className="w-full h-9 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-black appearance-none">
                        <option value="Market">Market</option>
                        <option value="Limit">Limit</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase text-[var(--text-4)] tracking-widest opacity-60">Costs</label>
                      <input type="number" value={editFormData.additional_cost || ''} onChange={e => setEditFormData({ ...editFormData, additional_cost: e.target.value })} className="w-full h-9 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-bold" />
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--surface-3)]/40 border border-[var(--border)] border-dashed flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-4)]">Breakeven</span>
                    <span className="text-base font-black text-amber-500">
                      {((parseFloat(editFormData.entry_price) || 0) + (parseFloat(editFormData.additional_cost) || 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-[var(--border)]/50 flex justify-between items-center">
                  <label className="text-[9px] font-black uppercase text-[var(--text-4)] tracking-widest">Precision</label>
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setEditFormData({...editFormData, execution_rating: n})} className="text-xl" style={{ color: editFormData.execution_rating >= n ? '#F59E0B' : 'var(--border)' }}>★</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: HUD & User Review */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              {/* Performance HUD */}
              <div className="grid grid-cols-3 gap-3">
                {(() => {
                  const entry = parseFloat(editFormData.entry_price) || 0;
                  const stop = parseFloat(editFormData.stop_loss) || 0;
                  const cost = parseFloat(editFormData.additional_cost) || 0;
                  const exit = parseFloat(editFormData.exit_price) || 0;
                  const pnl = exit > 0 ? exit - (entry + cost) : 0;
                  const pnlP = (entry + cost) > 0 ? (pnl / (entry + cost)) * 100 : 0;
                  const risk = Math.abs(entry - stop);
                  const rrr = risk > 0 ? pnl / risk : 0;
                  const isWin = pnl > 0;

                  return (
                    <>
                      <div className="text-center p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <div className="text-[7px] font-black uppercase text-[var(--text-4)] mb-0.5 tracking-widest opacity-60">Net P/L</div>
                        <div className={`text-[13px] font-black ${isWin ? 'text-emerald-500' : pnl < 0 ? 'text-rose-500' : 'text-[var(--text-1)]'}`}>{pnl.toFixed(1)}</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <div className="text-[7px] font-black uppercase text-[var(--text-4)] mb-0.5 tracking-widest opacity-60">Return %</div>
                        <div className={`text-[13px] font-black ${isWin ? 'text-emerald-500' : pnl < 0 ? 'text-rose-500' : 'text-[var(--text-1)]'}`}>{pnlP.toFixed(1)}%</div>
                      </div>
                      <div className="text-center p-2 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                        <div className="text-[7px] font-black uppercase text-[var(--text-4)] mb-0.5 tracking-widest opacity-60">Risk Reward</div>
                        <div className={`text-[13px] font-black ${rrr >= 2 ? 'text-emerald-500' : rrr > 0 ? 'text-amber-500' : 'text-[var(--text-4)]'}`}>{rrr.toFixed(1)}</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="p-6 rounded-2xl bg-[var(--surface-2)]/40 border border-[var(--border)] flex-1 flex flex-col space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-2)]">User Review</span>
                </div>
                <textarea value={editFormData.notes || ''} onChange={e => setEditFormData({...editFormData, notes: e.target.value})} placeholder="Journal post-trade debrief..." className="w-full flex-1 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-medium focus:outline-none resize-none shadow-inner" />
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button onClick={() => editStep(6)} className="btn-reset flex-1" disabled={highestStep <= 6}>Edit</button>
                  <button onClick={() => confirmStep(6)} className={`${highestStep > 6 ? 'btn-confirmed' : 'btn-confirm'} flex-1`} disabled={highestStep > 6}>{highestStep > 6 ? '✓ Confirmed' : 'Next'}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TIER 3: NETRA STRATEGIC REVIEW (STRATEGIC AUDIT FRAMEWORK) ═══ */}
      {(weaponLocked || activeEditLog) && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-1)]">NETRA Strategic Review</div>
          </div>

          <div className="p-8 rounded-2xl bg-[var(--surface-2)]/60 border border-[var(--border)] shadow-xl">
            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-6">
                <div className="min-h-[320px] rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 p-8 relative overflow-hidden shadow-inner">
                  {isAuditing ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--surface)]/90 backdrop-blur-sm z-10">
                      <div className="w-10 h-10 rounded-full border-2 border-[var(--accent)]/10 border-t-[var(--accent)] animate-spin"></div>
                      <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--accent)] animate-pulse">Consulting Neural Context...</span>
                    </div>
                  ) : auditData ? (
                    <div className="space-y-8 animate-in fade-in duration-700">
                      {/* Pillars Dashboard */}
                      <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                        {auditData.pillars && Object.entries(auditData.pillars).map(([key, data]) => (
                          <div key={key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-4)] opacity-70">{key}</span>
                              <span className="text-[10px] font-black text-[var(--accent)]">{data.score}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-[var(--surface-3)] rounded-full overflow-hidden">
                              <div className="h-full bg-[var(--accent)] transition-all duration-1000" style={{ width: `${data.score}%` }}></div>
                            </div>
                            <p className="text-[10px] text-[var(--text-3)] leading-relaxed font-medium">{data.critique}</p>
                          </div>
                        ))}
                      </div>

                      {/* Tactical Drift Box */}
                      {auditData.tactical_drift && (
                        <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                          <span className="text-[8px] font-black uppercase text-amber-500 tracking-widest block mb-1">Tactical Drift Analysis</span>
                          <p className="text-[12px] font-bold text-[var(--text-1)] italic">"{auditData.tactical_drift}"</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <span className="text-[8px] font-black uppercase text-emerald-500 tracking-widest block">Tactical Gains</span>
                          <div className="space-y-2">
                            {auditData.positives?.map((p, i) => (
                              <div key={i} className="text-[11px] font-bold text-[var(--text-2)] flex items-start gap-2 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10"><span className="text-emerald-500 mt-0.5">✓</span> {p}</div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest block">Strategic Gaps</span>
                          <div className="space-y-2">
                            {auditData.negatives?.map((n, i) => (
                              <div key={i} className="text-[11px] font-bold text-[var(--text-2)] flex items-start gap-2 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10"><span className="text-rose-500 mt-0.5">!</span> {n}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-5 opacity-20 h-full py-12 text-center">
                      <div className="w-16 h-16 rounded-full bg-[var(--surface-3)] flex items-center justify-center border border-[var(--border)] shadow-inner">
                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                      </div>
                      <p className="text-[10px] font-black tracking-[0.3em] uppercase">Awaiting Strategic Synthesis</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-6">
                {auditData && (
                  <div className="p-5 rounded-xl bg-[var(--accent-bg)]/10 border border-[var(--accent-border)]/20 shadow-sm">
                    <span className="text-[8px] font-black uppercase text-[var(--accent)] tracking-widest block mb-2">Neural Recommendation</span>
                    <p className="text-[12px] font-bold text-[var(--text-1)] leading-relaxed">{auditData.next_mission_advice}</p>
                  </div>
                )}
                <div className="p-6 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm flex flex-col items-center justify-center gap-3">
                  <span className="text-[8px] font-black uppercase text-[var(--text-4)] tracking-widest">Tactical Score</span>
                  <div className={`text-4xl font-black ${auditData?.tactical_score >= 80 ? 'text-emerald-500' : auditData?.tactical_score >= 60 ? 'text-amber-500' : auditData ? 'text-rose-500' : 'text-[var(--text-4)] opacity-20'}`}>
                    {auditData?.tactical_score || '--'}
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {/* TODO: stopAudit */}}
                      disabled={!isAuditing}
                      className="btn-reset flex-1"
                    >
                      STOP
                    </button>
                    <button 
                      onClick={() => {
                        const entry = parseFloat(editFormData.entry_price) || 0;
                        const stop = parseFloat(editFormData.stop_loss) || 0;
                        const exit = parseFloat(editFormData.exit_price) || 0;
                        const cost = parseFloat(editFormData.additional_cost) || 0;
                        const pnl = exit > 0 ? exit - (entry + cost) : 0;
                        const risk = Math.abs(entry - stop);
                        const rrr = risk > 0 ? pnl / risk : 0;
                        triggerPostTradeAudit({
                          context: selections, protocol: finalCommand, weapon: selectedWeaponId,
                          entry, stop, exit, pnl: pnl.toFixed(2), rrr: rrr.toFixed(2),
                          narrative: editFormData.notes || '', rating: editFormData.execution_rating || 0
                        });
                      }}
                      disabled={isAuditing}
                      className="btn-confirm flex-[2] flex items-center justify-center gap-2"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                      {isAuditing ? 'Consulting...' : auditData ? 'Update Audit' : 'Initiate NETRA Audit'}
                    </button>
                  </div>

                  <button 
                    onClick={() => activeEditLog ? updateTradeLog(activeEditLog.id) : commitTradeLog()}
                    className={`w-full btn-confirm text-white shadow-lg transition-all active:scale-95 ${((parseFloat(editFormData.exit_price)||0) - ((parseFloat(editFormData.entry_price)||0) + (parseFloat(editFormData.additional_cost)||0))) > 0 ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}
                    style={{ border: 'none', color: '#fff' }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                      {activeEditLog ? 'COMMIT MISSION' : 'Save Trade log'}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
