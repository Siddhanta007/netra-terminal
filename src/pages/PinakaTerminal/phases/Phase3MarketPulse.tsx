import React, { useEffect, useState } from 'react';
import { useNetra } from '../../../context/NetraContext';
import { useNetraUtils } from '../../../hooks/useNetraUtils';
import { API_BASE } from '../../../utils/constants';

// ─── Operational Marking checklist ───────────────────────────────────────────

const OPERATIONAL_MARKS = [
  { id: 'range',   label: 'Range / Active Leg' },
  { id: 'struct',  label: 'Internal Structure' },
  { id: 'bos',     label: 'BOS Points' },
  { id: 'session', label: 'Session Levels' },
  { id: 'mmc',     label: 'MMC / Inducement' },
  { id: 'smc',     label: '15M Order Blocks' },
] as const;

const MONO_MP: React.CSSProperties = { fontFamily: 'Space Grotesk, Inter, sans-serif' };

function OperationalMarkingChecklist({
  checked,
  toggle,
}: {
  checked: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const done  = OPERATIONAL_MARKS.filter(m => checked[m.id]).length;
  const total = OPERATIONAL_MARKS.length;

  return (
    <div style={{ marginBottom: '20px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          margin: '0 0 12px 0',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderLeft: '3px solid var(--phase-accent)',
          paddingLeft: '10px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>Component 1 — Operational Marking</span>
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: done === total ? 'var(--phase-accent)' : 'var(--text-3)', letterSpacing: '0.04em', flexShrink: 0 }}>{done}/{total}</span>
          <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '8px', color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>≤ 10 min</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: '9px', color: 'var(--text-4)', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          border: '1px solid var(--border-strong)',
          borderRadius: '0 0 5px 5px',
          marginBottom: '4px', overflow: 'hidden',
        }}>
          {OPERATIONAL_MARKS.map((m, i) => {
            const isDone = !!checked[m.id];
            const isLastRow = i >= 3;
            const isRightEdge = (i + 1) % 3 === 0;
            return (
              <div
                key={m.id}
                onClick={e => { e.stopPropagation(); toggle(m.id); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 10px', cursor: 'pointer',
                  background: isDone ? 'var(--accent-bg)' : 'transparent',
                  borderBottom: isLastRow ? 'none' : '1px solid var(--border)',
                  borderRight: isRightEdge ? 'none' : '1px solid var(--border)',
                  transition: 'background 120ms',
                }}
              >
                <div style={{
                  width: '11px', height: '11px', flexShrink: 0,
                  border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
                  background: isDone ? 'var(--phase-accent)' : 'transparent',
                  borderRadius: '2px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'border-color 100ms, background 100ms',
                }}>
                  {isDone && <span style={{ fontSize: '7px', color: 'white', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{
                  ...MONO_MP, fontSize: '9px', fontWeight: 500, flex: 1, lineHeight: 1.4,
                  color: isDone ? 'var(--text-3)' : 'var(--text-1)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-4)',
                }}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Phase3MarketPulse() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, stepTimestamps,
    confirmMarketPulse,
  } = useNetra();

  const [editing, setEditing] = useState(false);

  const isLocked = highestStep > 3 && !editing;

  // ── A: Auction State & Energy ─────────────────────────────────────────────
  const mp = (selections.marketPulse || {}) as Record<string, string>;
  const auctionState = mp.auctionState || '';
  const balanceType = mp.balanceType || '';
  const activeLeg = mp.activeLeg || '';
  const momentum = mp.momentum || '';
  const resistance = mp.resistance || '';

  const setMp = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, marketPulse: { ...mp, [key]: val } });
  };

  const activeLegOptions = auctionState === 'Balance'
    ? ['Bullish', 'Bearish', 'Unknown']
    : auctionState === 'Transitional'
      ? ['Breaking Leg', 'Opposing Leg', 'Unknown']
      : auctionState === 'Relocation (Against HTF)'
        ? ['Counter-Expansion Leg', 'Recovery Leg', 'Unknown']
        : ['Expansion Leg', 'Pullback Leg', 'Unknown'];

  const showBalanceType = auctionState === 'Balance';
  const showActiveLeg = !!auctionState;

  let showApproach = false;
  if (auctionState === 'Balance') {
    if (activeLeg === 'Bullish' || activeLeg === 'Bearish') showApproach = true;
  } else if (
    auctionState === 'Relocation (In HTF)' ||
    auctionState === 'Relocation (Against HTF)' ||
    auctionState === 'Transitional'
  ) {
    showApproach = true;
  }

  const isCompressionTrap = auctionState === 'Balance' && balanceType === 'Contracting' &&
    (activeLeg === 'Bullish' || activeLeg === 'Bearish');

  // ── B: Liquidity Context (SYSTEM_DATA-driven) ─────────────────────────────
  const liq = (selections.liquidityContext || {}) as Record<string, string>;
  const liqDims = SYSTEM_DATA.liquidityContext?.dimensions || [];
  const setLiq = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, liquidityContext: { ...liq, [key]: val } });
  };
  const allLiqSelected = liqDims.every(d => !!liq[d.id]);

  const objectiveCondition = liq.objectiveCondition || '';
  const liquidityFreshness = liq.liquidityFreshness || '';
  const { getAuthHeaders } = useNetraUtils();
  const [liqGate, setLiqGate] = useState<{ gate: string; reason: string }>({ gate: 'PROCEED', reason: '' });

  const [opChecked, setOpChecked] = useState<Record<string, boolean>>({});
  const toggleOp = (id: string) => setOpChecked(c => ({ ...c, [id]: !c[id] }));

  useEffect(() => {
    if (!objectiveCondition) return;
    fetch(`${API_BASE}/api/decision/liquidity-gate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ tier: objectiveCondition, maturity: liquidityFreshness }),
    })
      .then(r => r.json())
      .then(setLiqGate)
      .catch(() => {});
  }, [objectiveCondition, liquidityFreshness]);

  const isNoEngagement = liqGate.gate === 'NO_ENGAGEMENT';
  const noEngagementReason = liqGate.reason;

  // ── Gate ──────────────────────────────────────────────────────────────────
  const mpOk = !!auctionState && !!activeLeg &&
    (!showBalanceType || !!balanceType) &&
    (!showApproach || (!!momentum && !!resistance));

  const canConfirm = !isLocked && !isNoEngagement && mpOk && allLiqSelected;

  const subLabel = (text: string, first = false) => (
    <div style={{
      margin: first ? '14px 0 12px 0' : '28px 0 12px 0',
      display: 'flex', alignItems: 'center', gap: '10px',
      borderLeft: '3px solid var(--phase-accent)',
      paddingLeft: '10px',
    }}>
      <span style={{ fontFamily: 'Space Grotesk, Inter, sans-serif', fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>{text}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
    </div>
  );

  return (
    <div className="flex flex-col fade-up phase-theme-3">

      {/* ── COMPONENT 1: OPERATIONAL MARKING ── */}
      <OperationalMarkingChecklist checked={opChecked} toggle={toggleOp} />

      {/* ── COMPONENT 2: AUCTION STATE ── */}
      {subLabel('Component 2 — Auction State')}

      <div className="precision-row">
        <div className="precision-label">Auction State</div>
        <div className="precision-selector">
          {['Balance', 'Relocation (In HTF)', 'Relocation (Against HTF)', 'Transitional', 'Unknown'].map(opt => (
            <button
              key={opt}
              onClick={() => {
                if (isLocked) return;
                const newMp: Record<string, string> = { ...mp, auctionState: opt };
                if (opt !== 'Balance') newMp.balanceType = '';
                setSelections({ ...selections, marketPulse: newMp });
              }}
              disabled={isLocked}
              className={`precision-opt ${auctionState === opt ? 'selected' : ''} ${isLocked && auctionState !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
            >{opt}</button>
          ))}
        </div>
      </div>

      {showBalanceType && (
        <div className="precision-row">
          <div className="precision-label">Balance Type</div>
          <div className="precision-selector">
            {['Stable', 'Skewed', 'Contracting', 'Expanding', 'Unknown'].map(opt => (
              <button key={opt} onClick={() => setMp('balanceType', opt)} disabled={isLocked}
                className={`precision-opt ${balanceType === opt ? 'selected' : ''} ${isLocked && balanceType !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {showBalanceType && balanceType === 'Skewed' && (
        <div className="precision-row">
          <div className="precision-label">Direction</div>
          <div className="precision-selector">
            {['Upward', 'Downward', 'Unknown'].map(opt => (
              <button key={opt} onClick={() => setMp('skewedDirection', opt)} disabled={isLocked}
                className={`precision-opt ${mp.skewedDirection === opt ? 'selected' : ''} ${isLocked && mp.skewedDirection !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {showActiveLeg && (
        <div className="precision-row">
          <div className="precision-label">Active Leg</div>
          <div className="precision-selector">
            {activeLegOptions.map(opt => (
              <button key={opt} onClick={() => setMp('activeLeg', opt)} disabled={isLocked}
                className={`precision-opt ${activeLeg === opt ? 'selected' : ''} ${isLocked && activeLeg !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPONENT 3: PRICE BEHAVIOUR ── */}
      {subLabel('Component 3 — Price Behaviour')}
      <div className="precision-row">
        <div className="precision-label">Momentum</div>
        <div className="precision-selector">
          {['Impulsive', 'Sustained', 'Opposed', 'Stalling', 'Unknown'].map(opt => (
            <button key={opt} onClick={() => setMp('momentum', opt)} disabled={isLocked}
              className={`precision-opt ${momentum === opt ? 'selected' : ''} ${isLocked && momentum !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
            >{opt}</button>
          ))}
        </div>
      </div>
      <div className="precision-row">
        <div className="precision-label">Resistance</div>
        <div className="precision-selector">
          {['Weak', 'Moderate', 'Strong', 'Dominant', 'Unknown'].map(opt => (
            <button key={opt} onClick={() => setMp('resistance', opt)} disabled={isLocked}
              className={`precision-opt ${resistance === opt ? 'selected' : ''} ${isLocked && resistance !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
            >{opt}</button>
          ))}
        </div>
      </div>

      {isCompressionTrap && (
        <div className="flex items-center gap-2 mt-3 px-4 py-3" style={{ background: 'var(--red-bg)', border: '1px solid var(--red)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--red)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ COMPRESSION TRAP — NO TRADE ZONE</span>
        </div>
      )}

      {/* ── COMPONENT 3: LIQUIDITY CONTEXT ── */}
      {liqDims.length > 0 && (
        <>
          {subLabel('Component 4 — Liquidity Context')}

          {liqDims.map((dim) => (
            <div key={dim.id} className="precision-row">
              <div className="precision-label">{dim.name}</div>
              <div className="precision-selector">
                {(dim.options || []).map(opt => {
                  const isSelected = liq[dim.id] === opt;
                  return (
                    <button key={opt} onClick={() => setLiq(dim.id, opt)} disabled={isLocked}
                      className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >{opt}</button>
                  );
                })}
              </div>
            </div>
          ))}

          {isNoEngagement && !isLocked && (
            <div className="flex flex-col gap-1.5 px-4 py-3 mt-3" style={{ background: 'var(--red-bg)', border: '1px solid var(--red)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--red)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Liquidity Context Invalid</span>
              <span style={{ fontSize: '10px', color: 'var(--red)', lineHeight: 1.5 }}>{noEngagementReason}</span>
            </div>
          )}
        </>
      )}

      {/* ── OBSERVATIONS + ACTIONS ── */}
      <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border-strong)]">
        <textarea
          value={notes.marketPulse || ''}
          onChange={e => setNotes({ ...notes, marketPulse: e.target.value })}
          placeholder="Record observations — auction state, energy quality, price behaviour, liquidity context..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[52px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setEditing(true)} className="btn-edit w-20" disabled={!isLocked}>Edit</button>
          <button onClick={() => { if (!isLocked) setSelections({ ...selections, marketPulse: {} }); }} className="btn-reset w-20" disabled={isLocked || Object.keys(mp).length === 0}>Reset</button>
          <button
            onClick={() => { if (editing) { setEditing(false); } else { confirmMarketPulse(); } }}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={!canConfirm}
          >
            {isLocked ? '✓ Confirmed' : editing ? 'Save' : 'Confirm Pulse'}
          </button>
        </div>
      </div>
      {stepTimestamps.marketPulse && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Locked: {stepTimestamps.marketPulse}
        </div>
      )}
    </div>
  );
}
