import { useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import { useHTFGate } from '../../hooks/useReduceFlag';

// ─── Phase 1 combined read ────────────────────────────────────────────────────

type Phase1Read = 'CLEAN_DRIVE' | 'HIDDEN_WALL' | 'WEAK_DRIVE' | 'DEAD_MARKET' | null;

function getPhase1Read(d: string, a: string): Phase1Read {
  if (!d || !a) return null;
  const eff = a === 'Efficient';
  const abs = a === 'Absorbed';
  if (d === 'Slicing'  && eff) return 'CLEAN_DRIVE';
  if (d === 'Slicing'  && abs) return 'HIDDEN_WALL';
  if (d === 'Constant' && eff) return 'CLEAN_DRIVE';
  if (d === 'Constant' && abs) return 'WEAK_DRIVE';
  if (d === 'Grinding' && eff) return 'WEAK_DRIVE';
  if (d === 'Grinding' && abs) return 'DEAD_MARKET';
  return null;
}

const P1_READ: Record<NonNullable<Phase1Read>, { label: string; color: string; note: string; isOverride: boolean }> = {
  CLEAN_DRIVE:  { label: 'CLEAN DRIVE',                   color: '#10b981', note: 'Energy real and uncontested. Proceed to Phase 2.',                                                     isOverride: false },
  HIDDEN_WALL:  { label: 'HIDDEN WALL — THE MIRAGE ⚠',   color: '#ef4444', note: 'Aggressive move meeting invisible opposition. NO ENGAGEMENT — chart closes.',                        isOverride: true  },
  WEAK_DRIVE:   { label: 'WEAK DRIVE',                    color: '#f59e0b', note: 'Reduced energy. Proceed to Phase 2 with caution. Conviction drops.',                                  isOverride: false },
  DEAD_MARKET:  { label: 'DEAD MARKET ⚠',                color: '#ef4444', note: 'No energy, heavy resistance. NO ENGAGEMENT — chart closes.',                                          isOverride: true  },
};

// ─── Phase 2 combined read ────────────────────────────────────────────────────

type Phase2Read = 'HIGH_CONVICTION' | 'HESITATION' | 'DEAD_TRAP' | 'CLEAN' | 'MODERATE' | 'NO_ENGAGEMENT' | null;

function getPhase2Read(r: string, v: string): Phase2Read {
  if (!r || !v) return null;
  if (r === 'Violent'    && v === 'Immediate') return 'HIGH_CONVICTION';
  if (r === 'Violent'    && v === 'Delayed')   return 'HESITATION';
  if (r === 'Violent'    && v === 'Dead')       return 'DEAD_TRAP';
  if (r === 'Controlled' && v === 'Immediate') return 'CLEAN';
  if (r === 'Controlled' && v === 'Delayed')   return 'MODERATE';
  if (r === 'Grinding'   && v === 'Dead')      return 'NO_ENGAGEMENT';
  return null;
}

const P2_READ: Record<NonNullable<Phase2Read>, { label: string; color: string; note: string; isOverride: boolean }> = {
  HIGH_CONVICTION: { label: 'HIGH CONVICTION',    color: '#10b981', note: 'Maximum reaction quality. Proceed to Liquidity Context at full conviction.',                                isOverride: false },
  HESITATION:      { label: 'STRONG — HESITATION',color: '#f59e0b', note: 'Strong reaction, hesitation visible. Conviction reduces slightly. Proceed to Liquidity Context.',           isOverride: false },
  DEAD_TRAP:       { label: 'DEAD TRAP ⚠',        color: '#ef4444', note: 'Wall reacted but follow-through is absent. NO ENGAGEMENT — chart closes.',                                isOverride: true  },
  CLEAN:           { label: 'CLEAN INTERACTION',  color: '#10b981', note: 'Clean healthy interaction. Proceed to Liquidity Context with normal conviction.',                            isOverride: false },
  MODERATE:        { label: 'MODERATE',           color: '#f59e0b', note: 'Moderate interaction quality. Proceed to Liquidity Context with reduced conviction.',                       isOverride: false },
  NO_ENGAGEMENT:   { label: 'NO ENGAGEMENT ⚠',   color: '#ef4444', note: 'No meaningful wall interaction. NO ENGAGEMENT — chart closes.',                                            isOverride: true  },
};

// ─── Do Not Trade conditions ──────────────────────────────────────────────────

const DO_NOT_TRADE = [
  { id: 'doubleSided',    label: 'Double Sided Liquidity Trap',  desc: 'Both sides being swept simultaneously. No identifiable direction.' },
  { id: 'secondAttempt',  label: 'Second Attempt Failure',       desc: 'Second breakout attempt in progress. Wait for failure to confirm.' },
  { id: 'sessionLiquidity', label: 'Session Liquidity Trap',     desc: 'Session extreme being engineered. Wait for sweep resolution.' },
  { id: 'newsSpike',      label: 'News Spike Trap',              desc: 'External event driving price. Do not trade during or after.' },
  { id: 'dealerGamma',    label: 'Dealer Gamma Trap',            desc: 'Expiry day pin behaviour. Time Velocity unreliable. No entries.' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Phase3MarketPulse() {
  const {
    selections, setSelections,
    notes, setNotes,
    highestStep, confirmStep, editStep,
    stepTimestamps,
  } = useNetra();

  const htfGate = useHTFGate();
  const reduceFlag = htfGate === 'REDUCE';

  const [doNotTradeFlags, setDoNotTradeFlags] = useState<Record<string, boolean>>({
    doubleSided: false, secondAttempt: false, sessionLiquidity: false, newsSpike: false, dealerGamma: false,
  });

  const isLocked = highestStep > 3;
  const mp = selections.marketPulse || {};

  const anyDoNotTrade = Object.values(doNotTradeFlags).some(Boolean);

  // Auction State
  const auctionState = mp.auctionState || '';
  const auctionSubCtx = mp.auctionSubContext || '';
  const needsSubCtx = auctionState === 'Balance' || auctionState === 'Transitional';
  const subCtxOptions: string[] = auctionState === 'Balance'
    ? ['Mid Range', 'Boundary Interaction']
    : auctionState === 'Transitional'
    ? ['Break Confirming', 'Break Rejecting']
    : [];

  const isWait = (auctionState === 'Balance' && auctionSubCtx === 'Mid Range') ||
                 (auctionState === 'Transitional' && auctionSubCtx === 'Break Confirming');

  const auctionResolved = !!(auctionState && (!needsSubCtx || auctionSubCtx));

  // Phase 1
  const displacement = mp.displacement || '';
  const absorption = mp.absorption || '';
  const phase1Read = getPhase1Read(displacement, absorption);
  const phase1Info = phase1Read ? P1_READ[phase1Read] : null;
  const phase1Override = !!phase1Info?.isOverride;

  // Phase 2
  const reaction = mp.reaction || '';
  const timeVelocity = mp.timeVelocity || '';
  const phase2Read = getPhase2Read(reaction, timeVelocity);
  const phase2Info = phase2Read ? P2_READ[phase2Read] : null;
  const phase2Override = !!phase2Info?.isOverride;

  // Visibility
  const showPhase1 = !anyDoNotTrade && auctionResolved && !isWait;
  const showPhase2 = showPhase1 && !!displacement && !!absorption && !phase1Override;

  const canConfirm = !isLocked && !anyDoNotTrade && auctionResolved && !isWait &&
    !!displacement && !!absorption && !phase1Override &&
    !!reaction && !!timeVelocity && !phase2Override;

  const hasAnyOverride = phase1Override || phase2Override;

  const setMp = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, marketPulse: { ...mp, [key]: val } });
  };

  const contextNote = auctionState === 'Relocation (In Bias)'
    ? 'Measuring continuation strength. Is the continuation energy real? Did the pullback zone hold?'
    : auctionState === 'Relocation (Against Bias)'
    ? 'Measuring trap formation quality. Is the counter move aggressive enough to hunt liquidity? Did price react at the liquidity level?'
    : (auctionState === 'Balance' || auctionState === 'Transitional')
    ? 'Measuring boundary interaction quality. Is price approaching with real energy? Did the boundary hold or break?'
    : '';

  return (
    <div className="flex flex-col fade-up phase-theme-3">

      {/* REDUCE FLAG */}
      {reduceFlag && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ⚠ REDUCE FLAG ACTIVE — Half R · First Target Only · No Trailing
          </span>
        </div>
      )}

      {/* ── DO NOT TRADE CONDITIONS ── */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-3">
          <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>Do Not Trade Check</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ fontSize: '8px', color: 'var(--text-4)', opacity: 0.45 }}>Confirm none are active before proceeding</span>
        </div>
        <div className="flex flex-col gap-2">
          {DO_NOT_TRADE.map(cond => (
            <label key={cond.id} className="flex items-start gap-3" style={{ cursor: isLocked ? 'default' : 'pointer', opacity: isLocked ? 0.6 : 1 }}>
              <input
                type="checkbox"
                checked={doNotTradeFlags[cond.id] || false}
                onChange={e => !isLocked && setDoNotTradeFlags(f => ({ ...f, [cond.id]: e.target.checked }))}
                disabled={isLocked}
                style={{ marginTop: '1px', accentColor: '#ef4444', flexShrink: 0, cursor: isLocked ? 'default' : 'pointer' }}
              />
              <div>
                <span style={{ fontSize: '10px', fontWeight: 700, color: doNotTradeFlags[cond.id] ? '#ef4444' : 'var(--text-2)', letterSpacing: '0.03em' }}>{cond.label}</span>
                <span style={{ fontSize: '9px', color: 'var(--text-4)', marginLeft: '8px' }}>{cond.desc}</span>
              </div>
            </label>
          ))}
        </div>
        {anyDoNotTrade && (
          <div className="flex items-center gap-2 mt-3 px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Do Not Trade Condition Active</span>
          </div>
        )}
      </div>

      <div style={{ height: '1px', background: 'var(--border)', marginBottom: '16px' }} />

      {/* ── 3A: AUCTION STATE ── */}
      <div className="flex items-center gap-3 mb-2">
        <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>3A — Auction State (15M)</span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      </div>

      <div className="precision-row">
        <div className="precision-label">Auction State</div>
        <div className="precision-selector">
          {['Balance', 'Relocation (In Bias)', 'Relocation (Against Bias)', 'Transitional'].map(opt => (
            <button
              key={opt}
              onClick={() => { if (isLocked) return; setSelections({ ...selections, marketPulse: { ...mp, auctionState: opt, auctionSubContext: '' } }); }}
              disabled={isLocked}
              className={`precision-opt ${auctionState === opt ? 'selected' : ''} ${isLocked && auctionState !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
            >{opt}</button>
          ))}
        </div>
      </div>

      {/* Sub-context for Balance & Transitional */}
      {auctionState && needsSubCtx && (
        <div className="precision-row">
          <div className="precision-label">{auctionState === 'Balance' ? 'Price Location' : 'Break Status'}</div>
          <div className="precision-selector">
            {subCtxOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setMp('auctionSubContext', opt)}
                disabled={isLocked}
                className={`precision-opt ${auctionSubCtx === opt ? 'selected' : ''} ${isLocked && auctionSubCtx !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {/* WAIT gate */}
      {isWait && (
        <div className="flex flex-col gap-1 px-4 py-3 mt-2" style={{ background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.35)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⏸ WAIT — Do Not Proceed</span>
          <span style={{ fontSize: '10px', color: '#64748b', opacity: 0.75 }}>
            {auctionState === 'Balance'
              ? 'Price is mid-range. Return when price approaches boundary.'
              : 'Break is confirming. Wait for Relocation to establish. Restart from Auction State.'}
          </span>
        </div>
      )}

      {/* ── 3B: PRICE BEHAVIOUR — THE APPROACH ── */}
      {showPhase1 && (
        <>
          <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0 12px 0' }} />
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>3B — Price Behaviour · Phase 1 · The Approach (15M)</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          {contextNote && (
            <div className="precision-row items-start">
              <div className="precision-label" style={{ paddingTop: '6px', opacity: 0.6 }}>Context</div>
              <div className="flex-1 py-1 leading-relaxed" style={{ fontSize: '10px', color: 'var(--text-4)' }}>{contextNote}</div>
            </div>
          )}

          <div className="precision-row">
            <div className="precision-label">Displacement</div>
            <div className="precision-selector">
              {['Slicing', 'Constant', 'Grinding'].map(opt => (
                <button key={opt} onClick={() => setMp('displacement', opt)} disabled={isLocked}
                  className={`precision-opt ${displacement === opt ? 'selected' : ''} ${isLocked && displacement !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div className="precision-row">
            <div className="precision-label">Absorption</div>
            <div className="precision-selector">
              {['Efficient', 'Absorbed'].map(opt => (
                <button key={opt} onClick={() => setMp('absorption', opt)} disabled={isLocked}
                  className={`precision-opt ${absorption === opt ? 'selected' : ''} ${isLocked && absorption !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                >{opt}</button>
              ))}
            </div>
          </div>

          {/* Phase 1 combined read */}
          {phase1Info && (
            <div className="flex flex-col gap-1.5 px-4 py-3 mt-2" style={{ background: `${phase1Info.color}10`, border: `1px solid ${phase1Info.color}40` }}>
              <span style={{ fontSize: '7px', fontWeight: 900, color: phase1Info.color, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>Phase 1 Combined Read</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: phase1Info.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{phase1Info.label}</span>
              <span style={{ fontSize: '10px', color: phase1Info.color, opacity: 0.75, lineHeight: 1.5 }}>{phase1Info.note}</span>
            </div>
          )}
        </>
      )}

      {/* ── 3C: PRICE BEHAVIOUR — THE INTERACTION ── */}
      {showPhase2 && (
        <>
          <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0 12px 0' }} />
          <div className="flex items-center gap-3 mb-2">
            <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>3C — Price Behaviour · Phase 2 · The Interaction (5M-15M)</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <div className="precision-row">
            <div className="precision-label">Reaction</div>
            <div className="precision-selector">
              {['Violent', 'Controlled', 'Grinding'].map(opt => (
                <button key={opt} onClick={() => setMp('reaction', opt)} disabled={isLocked}
                  className={`precision-opt ${reaction === opt ? 'selected' : ''} ${isLocked && reaction !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                >{opt}</button>
              ))}
            </div>
          </div>

          <div className="precision-row">
            <div className="precision-label">Time Velocity</div>
            <div className="precision-selector">
              {['Immediate', 'Delayed', 'Dead'].map(opt => (
                <button key={opt} onClick={() => setMp('timeVelocity', opt)} disabled={isLocked}
                  className={`precision-opt ${timeVelocity === opt ? 'selected' : ''} ${isLocked && timeVelocity !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                >{opt}</button>
              ))}
            </div>
          </div>

          {/* Phase 2 combined read */}
          {phase2Info && (
            <div className="flex flex-col gap-1.5 px-4 py-3 mt-2" style={{ background: `${phase2Info.color}10`, border: `1px solid ${phase2Info.color}40` }}>
              <span style={{ fontSize: '7px', fontWeight: 900, color: phase2Info.color, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>Phase 2 Combined Read</span>
              <span style={{ fontSize: '13px', fontWeight: 900, color: phase2Info.color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{phase2Info.label}</span>
              <span style={{ fontSize: '10px', color: phase2Info.color, opacity: 0.75, lineHeight: 1.5 }}>{phase2Info.note}</span>
            </div>
          )}
        </>
      )}

      {/* Override block — already shown inline above, but add a clear summary if active */}
      {hasAnyOverride && !isLocked && (
        <div className="flex items-center gap-2 px-4 py-3 mt-4" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.4)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ SESSION ENDS HERE — Override condition fired. Chart closes. No further analysis.</span>
        </div>
      )}

      {/* ── NOTES + ACTIONS ── */}
      <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border)]">
        <textarea
          value={notes.marketPulse || ''}
          onChange={e => setNotes({ ...notes, marketPulse: e.target.value })}
          placeholder="Record market pulse observations — auction environment, energy quality, interaction quality, conviction level..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => editStep(3)} className="btn-reset w-24" disabled={!isLocked}>Edit</button>
          <button
            onClick={() => confirmStep(3)}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={isLocked || !canConfirm}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm Pulse'}
          </button>
        </div>
      </div>
      {stepTimestamps.marketPulse && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40 mt-1">Locked: {stepTimestamps.marketPulse}</div>
      )}

    </div>
  );
}
