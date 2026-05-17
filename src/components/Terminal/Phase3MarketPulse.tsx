import { useNetra } from '../../context/NetraContext';
import { useEffect, useState } from 'react';
import { useNetraUtils } from '../../hooks/useNetraUtils';
import { API_BASE } from '../../utils/constants';

export default function Phase3MarketPulse() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, stepTimestamps,
    confirmMarketPulse, editMarketPulse,
  } = useNetra();

  const isLocked = highestStep > 3;

  // ── A: Auction State & Energy ─────────────────────────────────────────────
  const mp = (selections.marketPulse || {}) as Record<string, string>;
  const auctionState = mp.auctionState || '';
  const balanceType = mp.balanceType || '';
  const activeLeg = mp.activeLeg || '';
  const displacement = mp.displacement || '';
  const absorption = mp.absorption || '';

  const setMp = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, marketPulse: { ...mp, [key]: val } });
  };

  const activeLegOptions = auctionState === 'Balance'
    ? ['Bullish', 'Bearish']
    : auctionState === 'Transitional'
      ? ['Breaking leg', 'Opposing leg']
      : ['In Expanding leg', 'Pullback leg'];

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

  const tier = liq.tier || '';
  const maturity = liq.maturity || '';
  const { getAuthHeaders } = useNetraUtils();
  const [liqGate, setLiqGate] = useState<{ gate: string; reason: string }>({ gate: 'PROCEED', reason: '' });

  useEffect(() => {
    if (!tier) return;
    fetch(`${API_BASE}/api/decision/liquidity-gate`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ tier, maturity }),
    })
      .then(r => r.json())
      .then(setLiqGate)
      .catch(() => {});
  }, [tier, maturity]);

  const isNoEngagement = liqGate.gate === 'NO_ENGAGEMENT';
  const noEngagementReason = liqGate.reason;

  // ── Gate ──────────────────────────────────────────────────────────────────
  const mpOk = !!auctionState && !!activeLeg &&
    (!showBalanceType || !!balanceType) &&
    (!showApproach || (!!displacement && !!absorption));

  const canConfirm = !isLocked && !isNoEngagement && mpOk && allLiqSelected;

  const subLabel = (text: string) => (
    <div className="flex items-center gap-3 mb-2">
      <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.5 }}>{text}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)', opacity: 0.5 }} />
    </div>
  );

  return (
    <div className="flex flex-col fade-up phase-theme-3">

      {/* ── COMPONENT 1: AUCTION STATE ── */}
      {subLabel('Component 1 — Auction State')}

      <div className="precision-row">
        <div className="precision-label">Auction State</div>
        <div className="precision-selector">
          {['Balance', 'Relocation (In HTF)', 'Relocation (Against HTF)', 'Transitional'].map(opt => (
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
              style={auctionState === opt ? { borderColor: '#3b82f6', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' } : {}}
            >{opt}</button>
          ))}
        </div>
      </div>

      {showBalanceType && (
        <div className="precision-row">
          <div className="precision-label">Balance Type</div>
          <div className="precision-selector">
            {['Stable', 'Skewed', 'Contracting', 'Expanding'].map(opt => (
              <button key={opt} onClick={() => setMp('balanceType', opt)} disabled={isLocked}
                className={`precision-opt ${balanceType === opt ? 'selected' : ''} ${isLocked && balanceType !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={balanceType === opt ? { borderColor: '#3b82f6', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' } : {}}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {showBalanceType && balanceType === 'Skewed' && (
        <div className="precision-row">
          <div className="precision-label">Direction</div>
          <div className="precision-selector">
            {['Upward', 'Downward'].map(opt => (
              <button key={opt} onClick={() => setMp('skewedDirection', opt)} disabled={isLocked}
                className={`precision-opt ${mp.skewedDirection === opt ? 'selected' : ''} ${isLocked && mp.skewedDirection !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={mp.skewedDirection === opt ? { borderColor: '#3b82f6', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' } : {}}
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
                style={activeLeg === opt ? { borderColor: '#3b82f6', background: 'rgba(59,130,246,0.1)', color: '#3b82f6' } : {}}
              >{opt}</button>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPONENT 2: PRICE BEHAVIOUR ── */}
      {showApproach && (
        <>
          <div style={{ height: '1px', background: 'var(--border)', margin: '14px 0 12px 0' }} />
          {subLabel('Component 2 — Price Behaviour · The Approach')}
          <div className="precision-row">
            <div className="precision-label">Displacement</div>
            <div className="precision-selector">
              {['Impulsive', 'Sustained', 'Opposed'].map(opt => (
                <button key={opt} onClick={() => setMp('displacement', opt)} disabled={isLocked}
                  className={`precision-opt ${displacement === opt ? 'selected' : ''} ${isLocked && displacement !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                  style={displacement === opt ? { borderColor: '#f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' } : {}}
                >{opt}</button>
              ))}
            </div>
          </div>
          <div className="precision-row">
            <div className="precision-label">Absorption</div>
            <div className="precision-selector">
              {['Efficient', 'Absorbed', 'Exhausted'].map(opt => (
                <button key={opt} onClick={() => setMp('absorption', opt)} disabled={isLocked}
                  className={`precision-opt ${absorption === opt ? 'selected' : ''} ${isLocked && absorption !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
                  style={absorption === opt ? { borderColor: '#f59e0b', background: 'rgba(245,158,11,0.1)', color: '#f59e0b' } : {}}
                >{opt}</button>
              ))}
            </div>
          </div>
        </>
      )}

      {isCompressionTrap && (
        <div className="flex items-center gap-2 mt-3 px-4 py-3" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.4)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>🛑 COMPRESSION TRAP — NO TRADE ZONE</span>
        </div>
      )}

      {/* ── COMPONENT 3: LIQUIDITY CONTEXT ── */}
      {liqDims.length > 0 && (
        <>
          <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0 14px 0' }} />
          {subLabel('Component 3 — Liquidity Context')}

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
            <div className="flex flex-col gap-1.5 px-4 py-3 mt-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Liquidity Context Invalid</span>
              <span style={{ fontSize: '10px', color: '#ef4444', opacity: 0.75, lineHeight: 1.5 }}>{noEngagementReason}</span>
            </div>
          )}
        </>
      )}

      {/* ── OBSERVATIONS + ACTIONS ── */}
      <div className="flex gap-4 items-start pt-4 mt-2 border-t border-[var(--border)]">
        <textarea
          value={notes.marketPulse || ''}
          onChange={e => setNotes({ ...notes, marketPulse: e.target.value })}
          placeholder="Record observations — auction state, energy quality, price behaviour, liquidity context..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={editMarketPulse} className="btn-reset w-24" disabled={!isLocked}>Edit</button>
          <button
            onClick={confirmMarketPulse}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-48`}
            disabled={!canConfirm}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm Market Pulse'}
          </button>
        </div>
      </div>

      {stepTimestamps.marketPulse && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40 mt-1">
          Locked: {stepTimestamps.marketPulse}
        </div>
      )}
    </div>
  );
}
