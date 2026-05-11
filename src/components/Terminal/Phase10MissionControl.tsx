import { useState } from 'react';
import { useNetra } from '../../context/NetraContext';
import { useReduceFlag } from '../../hooks/useReduceFlag';
import NetraAILabs from '../Templates/NetraAILabs';

// ─── Constants ────────────────────────────────────────────────────────────────

const SEVEN_RULES = [
  'R is fixed before entry. Position size is calculated from R ÷ Stop Distance. Never widen the stop to increase size.',
  'First target on Interception is mandatory. No holding full position past T1. No exceptions.',
  'Breakeven trigger activates on first target body close. Immediately — not before, not after a delay.',
  'Daily loss limit ends the session. No revenge trading. No "one more trade." The S-400 has fired.',
  'Daily target ends the session voluntarily. Profitable sessions that continue after target give back gains.',
  'No re-entry on a failed Interception. The reversal failed. The original edge is gone.',
  'Time Protocol is structural, not situational. Session cutoff and expiry cutoff apply regardless of setup quality.',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <div className="text-center">
        <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase' }}>{label}</span>
        {sub && <span style={{ fontSize: '7px', color: 'var(--text-4)', marginLeft: '8px', opacity: 0.5 }}>{sub}</span>}
      </div>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>{label}</span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 px-2 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono focus:border-[#4169E1] outline-none"
      />
    </div>
  );
}

function NumInput({ label, value, onChange, prefix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>{label}</span>
      <div className="flex items-center gap-1">
        {prefix && <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700 }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-8 w-full px-2 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono tabular-nums focus:border-[#4169E1] outline-none"
          placeholder="0"
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

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
    stepTimestamps,
  } = useNetra();

  const reduceFlag = useReduceFlag();

  // ── Pre-entry state ──
  const [rAmount, setRAmount] = useState('');
  const [dailyLossLimit, setDailyLossLimit] = useState('');
  const [dailyLossHit, setDailyLossHit] = useState(false);
  const [dailyTarget, setDailyTarget] = useState('');
  const [dailyTargetHit, setDailyTargetHit] = useState(false);
  const [openingWindow, setOpeningWindow] = useState('09:20');
  const [sessionCutoff, setSessionCutoff] = useState('14:30');
  const [isExpiryDay, setIsExpiryDay] = useState(false);
  const [expiryCutoff, setExpiryCutoff] = useState('12:00');
  const [t1ExitPct, setT1ExitPct] = useState(finalCommand === 'INTERCEPTION' ? '65' : '50');
  const [stagnationLimit, setStagnationLimit] = useState('5');
  const [breakEvenActivated, setBreakEvenActivated] = useState(false);
  const [reentryStatus, setReentryStatus] = useState<'continued' | 'reversed' | null>(null);
  const [rulesAcknowledged, setRulesAcknowledged] = useState<boolean[]>(new Array(7).fill(false));

  // ── Price calculations ──
  const entry = parseFloat(String(editFormData.entry_price)) || 0;
  const stop  = parseFloat(String(editFormData.stop_loss))   || 0;
  const exit  = parseFloat(String(editFormData.exit_price))  || 0;
  const cost  = parseFloat(String(editFormData.additional_cost)) || 0;
  const r     = parseFloat(rAmount) || 0;

  const isShort     = (finalCommand || '').includes('INTERCEPTION');
  const stopDist    = Math.abs(entry - stop);
  const positionSz  = r > 0 && stopDist > 0 ? Math.floor(r / stopDist) : 0;
  const breakeven   = isShort ? entry - cost : entry + cost;
  const pnl         = exit > 0 ? (isShort ? (entry - exit) - cost : (exit - entry) - cost) : 0;
  const pnlPct      = entry > 0 ? (pnl / entry) * 100 : 0;
  const risk        = stopDist;
  const rrr         = risk > 0 && pnl !== 0 ? Math.abs(pnl / risk) : 0;
  const reducedR    = r > 0 ? r / 2 : 0;

  // ── S-400 active ──
  const s400Active  = dailyLossHit || dailyTargetHit;

  // ── Rules gate ──
  const allRulesAck = rulesAcknowledged.every(Boolean);

  const handleAudit = () => {
    triggerPostTradeAudit({
      context: selections,
      protocol: finalCommand,
      weapon: selectedWeaponId,
      entry, stop, exit,
      pnl: pnl.toFixed(2),
      rrr: rrr.toFixed(2),
      narrative: String(editFormData.notes || ''),
      rating: editFormData.execution_rating || 0,
    });
  };

  const auditScore = auditData?.tactical_score ?? 0;

  return (
    <div className="space-y-6">

      {/* ═══ S-400 KILL SWITCH BANNER ═══ */}
      {s400Active && (
        <div className="flex flex-col gap-1.5 px-5 py-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)' }}>
          <span style={{ fontSize: '10px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            🛑 S-400 ACTIVE — SESSION TERMINATED
          </span>
          <span style={{ fontSize: '10px', color: '#ef4444', opacity: 0.8 }}>
            {dailyLossHit ? 'Daily loss limit hit. No further trades.' : 'Daily target achieved. Session ends voluntarily.'}
          </span>
        </div>
      )}

      {/* ═══ SECTION 1: PRE-ENTRY PROTOCOL ═══ */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <SectionHead label="Pre-Entry Protocol" sub="Complete before placing any order" />

        {/* REDUCE FLAG */}
        {reduceFlag && (
          <div className="flex items-center gap-3 px-4 py-2.5 mb-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)' }}>
            <span style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
              ⚠ REDUCE FLAG — Use Half R this session
            </span>
            {r > 0 && <span style={{ fontSize: '10px', color: '#f59e0b', marginLeft: 'auto' }}>Half R = ₹{reducedR.toFixed(0)}</span>}
          </div>
        )}

        {/* R + POSITION SIZE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <NumInput label={reduceFlag ? 'Full R (will use Half)' : 'Fixed R Per Trade'} value={rAmount} onChange={setRAmount} prefix="₹" />
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>Stop Distance</span>
            <div className="h-8 px-2 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono tabular-nums flex items-center text-[var(--text-3)]">
              {stopDist > 0 ? stopDist.toFixed(2) : '—'}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>Effective R</span>
            <div className="h-8 px-2 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-black tabular-nums flex items-center" style={{ color: reduceFlag ? '#f59e0b' : 'var(--text-1)' }}>
              {r > 0 ? `₹${reduceFlag ? reducedR.toFixed(0) : r.toFixed(0)}` : '—'}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>Position Size</span>
            <div className="h-8 px-2 rounded border text-[13px] font-black tabular-nums flex items-center"
              style={{ background: positionSz > 0 ? 'rgba(65,105,225,0.1)' : 'var(--surface-2)', borderColor: positionSz > 0 ? 'rgba(65,105,225,0.4)' : 'var(--border)', color: positionSz > 0 ? '#4169E1' : 'var(--text-3)' }}>
              {positionSz > 0 ? `${positionSz} units` : '—'}
            </div>
          </div>
        </div>

        {/* DAILY LIMITS */}
        <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3 p-3 rounded" style={{ background: dailyLossHit ? 'rgba(239,68,68,0.07)' : 'var(--surface-2)', border: `1px solid ${dailyLossHit ? 'rgba(239,68,68,0.3)' : 'var(--border)'}` }}>
            <div className="flex-1">
              <div style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '4px' }}>Daily Loss Limit</div>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700 }}>₹</span>
                <input type="number" value={dailyLossLimit} onChange={e => setDailyLossLimit(e.target.value)} className="w-full h-7 px-2 rounded bg-transparent border border-[var(--border)] text-[11px] font-mono outline-none focus:border-[#4169E1]" placeholder="e.g. 3000" />
              </div>
            </div>
            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
              <input type="checkbox" checked={dailyLossHit} onChange={e => setDailyLossHit(e.target.checked)} style={{ accentColor: '#ef4444' }} />
              <span style={{ fontSize: '8px', fontWeight: 700, color: dailyLossHit ? '#ef4444' : 'var(--text-4)', textTransform: 'uppercase' }}>Hit</span>
            </label>
          </div>
          <div className="flex items-center gap-3 p-3 rounded" style={{ background: dailyTargetHit ? 'rgba(16,185,129,0.07)' : 'var(--surface-2)', border: `1px solid ${dailyTargetHit ? 'rgba(16,185,129,0.3)' : 'var(--border)'}` }}>
            <div className="flex-1">
              <div style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5, marginBottom: '4px' }}>Daily Target</div>
              <div className="flex items-center gap-1">
                <span style={{ fontSize: '10px', color: 'var(--text-3)', fontWeight: 700 }}>₹</span>
                <input type="number" value={dailyTarget} onChange={e => setDailyTarget(e.target.value)} className="w-full h-7 px-2 rounded bg-transparent border border-[var(--border)] text-[11px] font-mono outline-none focus:border-[#10b981]" placeholder="e.g. 5000" />
              </div>
            </div>
            <label className="flex items-center gap-2 shrink-0 cursor-pointer">
              <input type="checkbox" checked={dailyTargetHit} onChange={e => setDailyTargetHit(e.target.checked)} style={{ accentColor: '#10b981' }} />
              <span style={{ fontSize: '8px', fontWeight: 700, color: dailyTargetHit ? '#10b981' : 'var(--text-4)', textTransform: 'uppercase' }}>Hit</span>
            </label>
          </div>
        </div>

        {/* TIME PROTOCOL */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <TimeInput label="Opening Window (no entries before)" value={openingWindow} onChange={setOpeningWindow} />
          <TimeInput label="Session Cutoff (no new entries after)" value={sessionCutoff} onChange={setSessionCutoff} />
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.5 }}>Expiry Day</span>
            <label className="flex items-center gap-2 h-8 cursor-pointer">
              <input type="checkbox" checked={isExpiryDay} onChange={e => setIsExpiryDay(e.target.checked)} style={{ accentColor: '#f59e0b' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: isExpiryDay ? '#f59e0b' : 'var(--text-3)' }}>Today is expiry</span>
            </label>
          </div>
          {isExpiryDay && (
            <TimeInput label="Expiry Cutoff" value={expiryCutoff} onChange={setExpiryCutoff} />
          )}
        </div>
      </div>

      {/* ═══ SECTION 2: EXECUTION DATA ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 fade-up items-stretch">

        {/* LEFT: PRICE INPUTS + PnL */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col flex-1">
            <SectionHead label="Execution Data" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-4 border-b border-[var(--border)] mb-4">
              {[
                { label: 'Entry Price', k: 'entry_price' },
                { label: 'Stop Loss', k: 'stop_loss' },
                { label: 'Costs', k: 'additional_cost' },
                { label: 'Exit Price', k: 'exit_price' },
              ].map((f) => (
                <div key={f.k} className="space-y-1.5 flex flex-col">
                  <span className="text-[7px] font-black uppercase tracking-widest pl-1 opacity-60">{f.label}</span>
                  <input
                    type="number"
                    value={String(editFormData[f.k] || '')}
                    onChange={e => setEditFormData({ ...editFormData, [f.k]: e.target.value })}
                    className="w-full h-10 px-3 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-black focus:border-[#4169E1] transition-all outline-none tabular-nums"
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center py-3 border-b border-[var(--border)]">
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Breakeven Threshold</div>
              <div className="text-sm font-black tabular-nums">{breakeven.toFixed(2)}</div>
            </div>
            <div className="flex justify-between items-center py-5 border-b border-[var(--border)]">
              <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Realized Mission PnL</div>
              <div className={`text-3xl font-black tabular-nums ${pnl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 py-5">
              <div className="flex flex-col gap-1">
                <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Performance Yield</span>
                <div className={`text-xl font-black tabular-nums ${pnlPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {pnlPct > 0 ? '+' : ''}{pnlPct.toFixed(2)}%
                </div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Risk Reward (RRR)</span>
                <div className="text-xl font-black text-blue-500 tabular-nums">{rrr.toFixed(2)}R</div>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[8px] font-black uppercase tracking-widest opacity-60">Execution Precision Rating</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setEditFormData({ ...editFormData, execution_rating: n })}
                    className="text-xl transition-colors duration-200"
                    style={{ color: (editFormData.execution_rating as number) >= n ? '#F59E0B' : 'var(--border)' }}
                  >★</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: STOP + TARGET PROTOCOL */}
        <div className="lg:col-span-5 flex flex-col gap-4">

          {/* STOP LOSS PROTOCOL */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <SectionHead label="Stop Loss Protocol" />
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={breakEvenActivated} onChange={e => setBreakEvenActivated(e.target.checked)} style={{ marginTop: '2px', accentColor: '#10b981' }} />
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: breakEvenActivated ? '#10b981' : 'var(--text-2)' }}>Breakeven Triggered</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-4)', marginTop: '2px' }}>First target hit by body close → stop moved to entry</div>
                </div>
              </label>
              {finalCommand === 'STRIKE' && (
                <div className="px-3 py-2 rounded" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-2)', marginBottom: '2px' }}>Trailing Rule (Strike)</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-4)', lineHeight: 1.5 }}>Trail stop to below each confirmed 5M swing low (bull) or high (bear). Body close only — not on wick.</div>
                </div>
              )}
              <div className="px-3 py-2 rounded" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: '9px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>Hard Stop Rule</div>
                <div style={{ fontSize: '9px', color: '#ef4444', opacity: 0.75, lineHeight: 1.5 }}>If price returns to entry candle body after T1 is hit → exit full remaining position immediately. No exceptions.</div>
              </div>
            </div>
          </div>

          {/* TARGET MANAGEMENT */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
            <SectionHead label={`Target Protocol · ${finalCommand || 'N/A'}`} />
            <div className="space-y-3">
              {reduceFlag && (
                <div className="px-3 py-2 rounded" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b' }}>REDUCE FLAG: First target only. Exit full position. No trailing.</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                  T1 Exit {finalCommand === 'INTERCEPTION' ? '(60–75% rec.)' : '(50% rec.)'}
                </span>
                <div className="flex items-center gap-1 flex-1">
                  <input
                    type="number"
                    value={t1ExitPct}
                    onChange={e => setT1ExitPct(e.target.value)}
                    className="w-16 h-7 px-2 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono outline-none focus:border-[#4169E1]"
                  />
                  <span style={{ fontSize: '10px', color: 'var(--text-3)' }}>%</span>
                </div>
              </div>
              {finalCommand === 'INTERCEPTION' ? (
                <div style={{ fontSize: '9px', color: 'var(--text-4)', lineHeight: 1.5 }}>
                  T2: Fixed level — prior structural base or opposing HTF liquidity. No trailing on interception. Define level before entry.
                </div>
              ) : finalCommand === 'STRIKE' ? (
                <div style={{ fontSize: '9px', color: 'var(--text-4)', lineHeight: 1.5 }}>
                  T2: Trail remainder to next external Tier 1/2 liquidity using structural trailing rule.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ SECTION 3: TIME + RE-ENTRY PROTOCOL ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <SectionHead label="Time Protocol" />
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>Stagnation Limit</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={stagnationLimit}
                  onChange={e => setStagnationLimit(e.target.value)}
                  className="w-14 h-7 px-2 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-mono outline-none focus:border-[#4169E1]"
                />
                <span style={{ fontSize: '9px', color: 'var(--text-4)' }}>5M candles</span>
              </div>
            </div>
            <div style={{ fontSize: '9px', color: 'var(--text-4)', lineHeight: 1.6, padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '6px' }}>
              <strong style={{ color: 'var(--text-2)' }}>Opening:</strong> No entries before {openingWindow || '[set above]'}<br />
              <strong style={{ color: 'var(--text-2)' }}>Session Cutoff:</strong> No new entries after {sessionCutoff || '[set above]'}<br />
              {isExpiryDay && <><strong style={{ color: '#f59e0b' }}>Expiry Cutoff:</strong> All entries close by {expiryCutoff}</>}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
          <SectionHead label="Re-entry Protocol" />
          <div className="space-y-3">
            {finalCommand === 'INTERCEPTION' ? (
              <div className="px-3 py-2.5 rounded" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No re-entry — Interception rule. Ever.</span>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '9px', color: 'var(--text-3)', fontWeight: 700, marginBottom: '6px' }}>After stop-out, price action showed:</div>
                {(['continued', 'reversed'] as const).map(opt => (
                  <label key={opt} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="reentry"
                      checked={reentryStatus === opt}
                      onChange={() => setReentryStatus(opt)}
                      style={{ marginTop: '2px', accentColor: opt === 'reversed' ? '#10b981' : '#ef4444' }}
                    />
                    <div>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: reentryStatus === opt ? (opt === 'reversed' ? '#10b981' : '#ef4444') : 'var(--text-2)' }}>
                        {opt === 'continued' ? 'Continued against — NO RE-ENTRY' : 'Reversed after stop — ONE re-entry allowed'}
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--text-4)', marginTop: '2px' }}>
                        {opt === 'continued' ? 'Price continued against the trade after stopping out.' : 'Price reversed direction after the stop was hit.'}
                      </div>
                    </div>
                  </label>
                ))}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ═══ SECTION 4: MISSION DEBRIEF ═══ */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <SectionHead label="Mission Debrief" />
        <div className="flex flex-col gap-3">
          <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-4)', opacity: 0.7 }}>Post-Mission Analysis</div>
          <textarea
            value={String(editFormData.notes || '')}
            onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
            placeholder="Journal post-mission performance and psychological state..."
            className="field-area flex-1 min-h-[80px] border-[var(--accent)]/20 dark:border-white/10"
          />
        </div>
      </div>

      {/* ═══ SECTION 5: SEVEN NON-NEGOTIABLE RULES ═══ */}
      <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <SectionHead label="Seven Non-Negotiable Rules" sub="Acknowledge before committing to journal" />
        <div className="space-y-3">
          {SEVEN_RULES.map((rule, i) => (
            <label key={i} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rulesAcknowledged[i] || false}
                onChange={e => {
                  const next = [...rulesAcknowledged];
                  next[i] = e.target.checked;
                  setRulesAcknowledged(next);
                }}
                style={{ marginTop: '2px', accentColor: '#4169E1', flexShrink: 0 }}
              />
              <span style={{ fontSize: '10px', lineHeight: 1.6, color: rulesAcknowledged[i] ? 'var(--text-2)' : 'var(--text-3)', fontWeight: rulesAcknowledged[i] ? 600 : 400 }}>
                <strong style={{ color: rulesAcknowledged[i] ? '#4169E1' : 'var(--text-4)' }}>Rule {i + 1}.</strong> {rule}
              </span>
            </label>
          ))}
        </div>
        {!allRulesAck && (
          <div className="mt-3 px-3 py-2 rounded" style={{ background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.2)' }}>
            <span style={{ fontSize: '9px', color: 'var(--text-4)' }}>{rulesAcknowledged.filter(Boolean).length}/7 rules acknowledged</span>
          </div>
        )}
      </div>

      {/* ═══ COMMIT ACTION ═══ */}
      <div className="flex gap-3 pb-2">
        <button onClick={() => editStep(7)} className="btn-reset flex-1">Edit</button>
        <button
          onClick={() => confirmStep(7)}
          className={`h-12 flex-[2] text-[10px] font-black uppercase tracking-[0.2em] ${allRulesAck ? 'btn-confirm' : 'btn-reset'}`}
          disabled={!allRulesAck}
          title={!allRulesAck ? 'Acknowledge all seven rules to commit' : ''}
        >
          {allRulesAck ? 'Commit to Journal' : `Acknowledge All Rules (${rulesAcknowledged.filter(Boolean).length}/7)`}
        </button>
      </div>

      {/* ═══ NETRA AI LABS AUDIT ═══ */}
      {highestStep >= 8 && (
        <div className="pt-6 border-t border-[var(--accent)]/20 dark:border-white/20">
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
                  <div className={`text-3xl font-black ${auditScore >= 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                    {auditData?.tactical_score ?? '--'}
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
