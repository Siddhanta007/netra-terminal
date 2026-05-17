import { useState, useEffect } from 'react';
import { useNetra } from '../../context/NetraContext';
import { useReduceFlag } from '../../hooks/useReduceFlag';
import { API_BASE } from '../../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TradeRow {
  id: string;
  side: 'BUY' | 'SELL';
  assetSuffix: string;
  entry: string;
  sl: string;
  qty: string;
  cost: string;
  t1: string;
  t2: string;
  t3: string;
}

interface AddEntry {
  id: number;
  price: number;
  stop: number;
  qty: number;
  cost: number;
  time: string;
}

const mkRow = (): TradeRow => ({
  id: `r${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
  side: 'BUY',
  assetSuffix: '',
  entry: '',
  sl: '',
  qty: '65',
  cost: '10',
  t1: '',
  t2: '',
  t3: '',
});

const autoTime = () => new Date().toTimeString().slice(0, 5);

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHead({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
      <div className="text-center">
        <span style={{ fontSize: '10px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.3em', textTransform: 'uppercase' }}>{label}</span>
        {sub && <span style={{ fontSize: '10px', color: '#ffffff', marginLeft: '8px', opacity: 0.45 }}>{sub}</span>}
      </div>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

function SubLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', opacity: 0.4, letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px' }}>
      {text}
    </div>
  );
}

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', opacity: 0.5, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 900, color: color || '#ffffff', fontFamily: 'monospace' }}>{value}</span>
    </div>
  );
}

// ─── TradeRowInput ────────────────────────────────────────────────────────────

function TradeRowInput({ row, assetPrefix, onChange, onRemove, canRemove }: {
  row: TradeRow;
  assetPrefix: string;
  onChange: (r: TradeRow) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const isBuy = row.side === 'BUY';
  const accent = isBuy ? '#10b981' : '#ef4444';

  const upd = (k: keyof TradeRow, v: string) => {
    onChange({ ...row, [k]: v });
  };

  useEffect(() => {
    const price = parseFloat(row.entry);
    if (!price || price <= 0) return;
    fetch(`${API_BASE}/api/decision/trade-targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_price: price, side: row.side }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.t1) onChange({ ...row, t1: String(data.t1), t2: String(data.t2), t3: String(data.t3) });
      })
      .catch(() => {});
  }, [row.entry, row.side]); // eslint-disable-line react-hooks/exhaustive-deps

  const bare: React.CSSProperties = {
    background: 'none', border: 'none', outline: 'none',
    fontFamily: 'monospace', color: '#ffffff',
  };
  const col = (text: string, clr?: string): React.CSSProperties => ({
    fontSize: '7px', fontWeight: 900, letterSpacing: '0.2em',
    textTransform: 'uppercase', marginBottom: '3px',
    color: clr ?? '#ffffff', opacity: clr ? 0.5 : 0.22,
  });

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderLeft: `2px solid ${accent}66` }}>

      {/* PRIMARY ROW */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', gap: '0' }}>

        {/* Direction toggle */}
        <button
          onClick={() => upd('side', isBuy ? 'SELL' : 'BUY')}
          style={{
            flexShrink: 0, marginRight: '14px',
            padding: '4px 10px',
            background: isBuy ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${accent}33`,
            cursor: 'pointer',
            fontSize: '10px', fontWeight: 900, fontFamily: 'monospace',
            color: accent, letterSpacing: '0.1em',
          }}
        >
          {row.side}
        </button>

        {/* Instrument */}
        <div style={{ flex: '1 1 130px', minWidth: 0, marginRight: '14px' }}>
          <div style={col('INSTRUMENT')}>INSTRUMENT</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            {assetPrefix && (
              <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#ffffff', opacity: 0.2, flexShrink: 0 }}>
                {assetPrefix}
              </span>
            )}
            <input
              type="text"
              value={row.assetSuffix}
              onChange={e => upd('assetSuffix', e.target.value)}
              placeholder="23500 CE"
              style={{ ...bare, flex: 1, minWidth: 0, fontSize: '14px', fontWeight: 700 }}
            />
          </div>
        </div>

        {/* Entry */}
        <div style={{ marginRight: '14px', minWidth: '84px', textAlign: 'right' }}>
          <div style={{ ...col('ENTRY'), textAlign: 'right' }}>ENTRY</div>
          <input
            type="number"
            value={row.entry}
            onChange={e => upd('entry', e.target.value)}
            placeholder="0.00"
            style={{ ...bare, width: '84px', textAlign: 'right', fontSize: '17px', fontWeight: 900 }}
          />
        </div>

        {/* Stop */}
        <div style={{ marginRight: '12px', minWidth: '84px', textAlign: 'right' }}>
          <div style={{ ...col('STOP', '#ef4444'), textAlign: 'right' }}>STOP</div>
          <input
            type="number"
            value={row.sl}
            onChange={e => upd('sl', e.target.value)}
            placeholder="0.00"
            style={{ ...bare, width: '84px', textAlign: 'right', fontSize: '17px', fontWeight: 900, color: '#fca5a5' }}
          />
        </div>

        {canRemove
          ? <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', opacity: 0.18, fontSize: '18px', lineHeight: 1, padding: '0 4px', flexShrink: 0 }}>×</button>
          : <div style={{ width: '22px', flexShrink: 0 }} />
        }
      </div>

      {/* SECONDARY ROW — lots · cost · targets */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '5px 14px 8px 42px',
        borderTop: '1px solid rgba(255,255,255,0.04)',
        gap: '0',
      }}>
        <div style={{ marginRight: '20px' }}>
          <div style={col('LOTS')}>LOTS</div>
          <input type="number" value={row.qty} onChange={e => upd('qty', e.target.value)} placeholder="65"
            style={{ ...bare, width: '52px', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }} />
        </div>
        <div>
          <div style={col('₹ COST')}>₹ COST</div>
          <input type="number" value={row.cost} onChange={e => upd('cost', e.target.value)} placeholder="10"
            style={{ ...bare, width: '52px', fontSize: '13px', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }} />
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '14px' }}>
          <span style={{ fontSize: '7px', color: '#60a5fa', opacity: 0.3, letterSpacing: '0.15em', textTransform: 'uppercase', paddingBottom: '2px' }}>TGT</span>
          {(['t1', 't2', 't3'] as const).map((k, i) => (
            <div key={k} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '7px', color: '#60a5fa', opacity: 0.35, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>T{i + 1}</div>
              <input type="number" value={row[k]} onChange={e => upd(k, e.target.value)} placeholder="—"
                style={{ ...bare, width: '72px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#7dd3fc' }} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Locked row (read-only summary) ──────────────────────────────────────────

function LockedRow({ row, assetPrefix, idx }: { row: TradeRow; assetPrefix: string; idx: number }) {
  const isBuy = row.side === 'BUY';
  const fullAsset = [assetPrefix, row.assetSuffix].filter(Boolean).join(' ');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', borderLeft: `3px solid ${isBuy ? '#10b981' : '#ef4444'}` }}>
      <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', opacity: 0.3, letterSpacing: '0.12em', minWidth: '20px' }}>#{idx + 1}</span>
      <span style={{ fontSize: '10px', fontWeight: 900, color: isBuy ? '#10b981' : '#ef4444', minWidth: '30px' }}>{row.side}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace', flex: 1 }}>{fullAsset || '—'}</span>
      {row.entry && <span style={{ fontSize: '12px', color: '#ffffff', opacity: 0.8, fontFamily: 'monospace' }}>@ {row.entry}</span>}
      {row.sl && <span style={{ fontSize: '12px', color: '#ef4444', fontFamily: 'monospace' }}>SL {row.sl}</span>}
      {row.qty && <span style={{ fontSize: '12px', color: '#ffffff', opacity: 0.55, fontFamily: 'monospace' }}>{row.qty} lots</span>}
      {(row.t1 || row.t2 || row.t3) && (
        <div style={{ display: 'flex', gap: '6px', marginLeft: 'auto' }}>
          {row.t1 && <span style={{ fontSize: '10px', color: '#93c5fd', fontFamily: 'monospace' }}>T1 {row.t1}</span>}
          {row.t2 && <span style={{ fontSize: '10px', color: '#60a5fa', fontFamily: 'monospace' }}>T2 {row.t2}</span>}
          {row.t3 && <span style={{ fontSize: '10px', color: '#3b82f6', fontFamily: 'monospace' }}>T3 {row.t3}</span>}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Phase10MissionControl() {
  const {
    finalCommand, selectedWeaponId,
    editFormData, setEditFormData,
    triggerPostTradeAudit, selections,
    highestStep, confirmStep, stepTimestamps,
    rAmount, dailyLossHit, dailyTargetHit,
    session,
  } = useNetra();

  const reduceFlag = useReduceFlag();
  const isFullyLocked = highestStep > 6;

  // Asset prefix from session (the instrument being analyzed)
  const assetPrefix = (session?.assetName || '').trim();

  // Sub-phase navigation
  const [missionPhase, setMissionPhase] = useState<0 | 1 | 2>(0);

  // ── Phase A: dynamic trade rows ──
  const [tradeRows, setTradeRows] = useState<TradeRow[]>([mkRow()]);

  // ── Phase B: re-entries per row + misc ──
  const [addEntries, setAddEntries] = useState<Record<string, AddEntry[]>>({});
  const [addingFor, setAddingFor] = useState<string | null>(null);
  const [newAdd, setNewAdd] = useState({ price: '', stop: '', qty: '65', cost: '10' });
  const [breakEven, setBreakEven] = useState<Record<string, boolean>>({});
  const [midNotes, setMidNotes] = useState('');

  // ── Phase C: exit per row ──
  const [exitData, setExitData] = useState<Record<string, string>>({});

  const entryLocked = missionPhase >= 1 || isFullyLocked;
  const midLocked   = missionPhase >= 2 || isFullyLocked;
  const r           = parseFloat(rAmount) || 0;
  const s400Active  = dailyLossHit || dailyTargetHit;

  const upd = (k: string, v: unknown) =>
    setEditFormData({ ...editFormData, [k]: v } as typeof editFormData);

  // ── Per-row combined position stats ──
  const rowCombined = (row: TradeRow) => {
    const extras = addEntries[row.id] || [];
    const baseEntry = parseFloat(row.entry) || 0;
    const baseSl    = parseFloat(row.sl)    || 0;
    const baseQty   = parseFloat(row.qty)   || 0;
    const baseCost  = parseFloat(row.cost)  || 0;
    const all = [
      ...(baseEntry > 0 && baseQty > 0 ? [{ price: baseEntry, stop: baseSl, qty: baseQty, cost: baseCost }] : []),
      ...extras.filter(e => e.price > 0 && e.qty > 0).map(e => ({ price: e.price, stop: e.stop, qty: e.qty, cost: e.cost })),
    ];
    const totalQty  = all.reduce((s, e) => s + e.qty, 0);
    const totalCost = all.reduce((s, e) => s + e.cost, 0);
    const wPrice    = totalQty > 0 ? all.reduce((s, e) => s + e.price * e.qty, 0) / totalQty : 0;
    const latestSl  = extras.length > 0 ? extras[extras.length - 1].stop : baseSl;
    const isShort   = row.side === 'SELL';
    const be        = wPrice > 0 ? (isShort ? wPrice - totalCost / (totalQty || 1) : wPrice + totalCost / (totalQty || 1)) : 0;
    const stopDist  = Math.abs(wPrice - latestSl);
    return { totalQty, totalCost, wPrice, latestSl, be, isShort, stopDist };
  };

  // Primary row for legacy editFormData compatibility
  const primary = tradeRows[0];
  const pc       = rowCombined(primary);
  const exitA    = parseFloat(exitData[primary?.id] || '') || parseFloat(String(editFormData.exit_price || '')) || 0;
  const pnlA     = exitA > 0 ? (pc.isShort ? (pc.wPrice - exitA) * pc.totalQty - pc.totalCost : (exitA - pc.wPrice) * pc.totalQty - pc.totalCost) : 0;
  const rrrA     = pc.stopDist > 0 && exitA > 0 ? (pc.isShort ? pc.wPrice - exitA : exitA - pc.wPrice) / pc.stopDist : 0;
  const positionSz = r > 0 && pc.stopDist > 0 ? Math.floor(r / pc.stopDist) : 0;

  // Net PnL across all rows
  const netPnL = tradeRows.reduce((sum, row) => {
    const c    = rowCombined(row);
    const exit = parseFloat(exitData[row.id] || '') || (row.id === primary?.id ? exitA : 0);
    if (!exit || !c.wPrice || !c.totalQty) return sum;
    return sum + (c.isShort ? (c.wPrice - exit) * c.totalQty - c.totalCost : (exit - c.wPrice) * c.totalQty - c.totalCost);
  }, 0);

  // ── Handlers ──

  const handleConfirmEntry = () => {
    const valid = tradeRows.filter(r => r.entry && r.qty);
    if (!valid.length) return;
    const prim = valid[0];
    const fullAsset = [assetPrefix, prim.assetSuffix].filter(Boolean).join(' ');
    setEditFormData({
      ...editFormData,
      trading_asset: fullAsset || editFormData.trading_asset,
      entry_price:     prim.entry,
      stop_loss:       prim.sl,
      quantity:        prim.qty,
      additional_cost: prim.cost,
      entry_time: (editFormData.entry_time as string) || autoTime(),
    } as typeof editFormData);
    setMissionPhase(1);
  };

  const handleAddEntry = (rowId: string) => {
    const price = parseFloat(newAdd.price) || 0;
    const stop  = parseFloat(newAdd.stop)  || 0;
    const qty   = parseFloat(newAdd.qty)   || 0;
    const cost  = parseFloat(newAdd.cost)  || 0;
    if (!price || !qty) return;
    setAddEntries(prev => ({ ...prev, [rowId]: [...(prev[rowId] || []), { id: Date.now(), price, stop, qty, cost, time: autoTime() }] }));
    setNewAdd({ price: '', stop: '', qty: '65', cost: '10' });
    setAddingFor(null);
  };

  const handleConfirmExit = () => {
    const ef = !editFormData.exit_time ? { ...editFormData, exit_time: autoTime() } : editFormData;
    setEditFormData(ef as typeof editFormData);
    confirmStep(6);
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4 fade-up">

      {/* S-400 KILL SWITCH */}
      {s400Active && (
        <div style={{ padding: '16px 20px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.5)' }}>
          <div style={{ fontSize: '13px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.25em', textTransform: 'uppercase' }}>SESSION TERMINATED</div>
          <div style={{ fontSize: '13px', color: '#ef4444', opacity: 0.8, marginTop: '4px' }}>
            {dailyLossHit ? 'Daily loss limit hit. No further trades.' : 'Daily target achieved. Session ends voluntarily.'}
          </div>
        </div>
      )}

      {/* ═══ SUB-PHASE A: ENTRY CAPTURE ═══ */}
      <div className="p-5 border border-[var(--border)] bg-[var(--surface)]">

        {entryLocked ? (
          /* Locked summary */
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '8px' }}>
                ✓ Entry Locked — {tradeRows.filter(r => r.entry).length} position{tradeRows.filter(r => r.entry).length !== 1 ? 's' : ''}
              </div>
              <div className="space-y-1">
                {tradeRows.filter(r => r.entry).map((row, i) => (
                  <LockedRow key={row.id} row={row} assetPrefix={assetPrefix} idx={i} />
                ))}
              </div>
              {!!editFormData.entry_time && (
                <div style={{ fontSize: '11px', color: '#60a5fa', fontFamily: 'monospace', marginTop: '8px' }}>Entry logged {String(editFormData.entry_time)}</div>
              )}
            </div>
            {!isFullyLocked && (
              <button onClick={() => setMissionPhase(0)} className="btn-reset w-20 shrink-0">Edit</button>
            )}
          </div>

        ) : (
          <>
            <SectionHead label="Entry Capture" sub="Pre-Trade" />

            {/* Trade rows */}
            <div className="space-y-1.5 mb-3">
              {tradeRows.map(row => (
                <TradeRowInput
                  key={row.id}
                  row={row}
                  assetPrefix={assetPrefix}
                  onChange={updated => setTradeRows(prev => prev.map(r => r.id === row.id ? updated : r))}
                  onRemove={() => setTradeRows(prev => prev.filter(r => r.id !== row.id))}
                  canRemove={tradeRows.length > 1}
                />
              ))}
            </div>

            {/* Add Trade */}
            <button
              onClick={() => setTradeRows(prev => [...prev, mkRow()])}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                width: '100%', padding: '8px 0', marginBottom: '16px',
                border: '1px dashed var(--border)', background: 'none', cursor: 'pointer',
                fontSize: '10px', fontWeight: 900, color: '#ffffff', opacity: 0.35,
                letterSpacing: '0.15em', textTransform: 'uppercase',
              }}
            >
              + Add Trade
            </button>

            {/* Quick stats on primary row */}
            {pc.wPrice > 0 && pc.latestSl > 0 && (
              <div className="grid grid-cols-3 gap-3 px-4 py-3 mb-4 border border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
                <StatCell label="Breakeven" value={pc.be.toFixed(2)} />
                <StatCell label="Entry Cost" value={pc.wPrice * pc.totalQty > 0 ? `₹${(pc.wPrice * pc.totalQty).toFixed(0)}` : '—'} />
                <StatCell label="Position Size (R)" value={positionSz > 0 ? `${positionSz} units` : '—'} color="#60a5fa" />
              </div>
            )}

            {/* Stop protocol */}
            <div className="flex gap-3 mb-4">
              <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <SubLabel text="Stop Protocol" />
                <div style={{ fontSize: '12px', color: '#ef4444', opacity: 0.85, lineHeight: 1.6 }}>
                  Hard Stop: Price returns to entry candle body after T1 → exit full position immediately.
                </div>
                {finalCommand === 'STRIKE' && (
                  <div style={{ fontSize: '11px', color: '#ffffff', opacity: 0.5, lineHeight: 1.6, marginTop: '4px' }}>
                    Trail: Below each confirmed 5M swing low/high. Body close only.
                  </div>
                )}
              </div>
              {reduceFlag && (
                <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.3)' }}>
                  <SubLabel text="Reduce Flag Active" />
                  <div style={{ fontSize: '12px', fontWeight: 900, color: '#f59e0b', lineHeight: 1.5 }}>
                    First target only. Exit full position. No trailing.
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '16px' }}>
              <span style={{ fontSize: '10px', color: '#93c5fd' }}>Entry time auto-recorded on confirm.</span>
            </div>

            <div className="flex justify-end">
              <button onClick={handleConfirmEntry} disabled={!tradeRows.some(r => r.entry && r.qty)} className="btn-confirm w-48">
                Confirm Entry
              </button>
            </div>
          </>
        )}
      </div>

      {/* ═══ SUB-PHASE B: POSITION MANAGEMENT ═══ */}
      {missionPhase >= 1 && (
        <div className="p-5 border border-[var(--border)] bg-[var(--surface)]">

          {midLocked ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', letterSpacing: '0.25em', textTransform: 'uppercase' }}>✓ Position Closed</span>
                <span style={{ fontSize: '12px', color: '#ffd700', opacity: 0.8, fontFamily: 'monospace' }}>{pc.totalQty} lots @ {pc.wPrice.toFixed(1)}</span>
                {Object.values(breakEven).some(Boolean) && <span style={{ fontSize: '11px', color: '#10b981' }}>BE triggered</span>}
              </div>
              {!isFullyLocked && (
                <button onClick={() => setMissionPhase(1)} className="btn-reset w-20 shrink-0">Edit</button>
              )}
            </div>

          ) : (
            <>
              <SectionHead label="Position Management" sub="In-Trade" />

              {/* Position ledger */}
              <div className="space-y-1 mb-4">
                {tradeRows.filter(r => r.entry).map((row, idx) => {
                  const c        = rowCombined(row);
                  const extras   = addEntries[row.id] || [];
                  const isAdding = addingFor === row.id;
                  return (
                    <div key={row.id}>
                      {/* Base row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', border: '1px solid var(--border)', background: 'var(--surface-2)', borderLeft: `3px solid ${row.side === 'BUY' ? '#10b981' : '#ef4444'}` }}>
                        <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', opacity: 0.3, minWidth: '18px' }}>#{idx + 1}</span>
                        <span style={{ fontSize: '10px', fontWeight: 900, color: row.side === 'BUY' ? '#10b981' : '#ef4444', minWidth: '30px' }}>{row.side}</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace', flex: 1 }}>
                          {[assetPrefix, row.assetSuffix].filter(Boolean).join(' ') || '—'}
                        </span>
                        {c.wPrice > 0 && <span style={{ fontSize: '12px', color: '#ffffff', opacity: 0.8, fontFamily: 'monospace' }}>avg {c.wPrice.toFixed(2)}</span>}
                        {c.latestSl > 0 && <span style={{ fontSize: '12px', color: '#ef4444', fontFamily: 'monospace' }}>SL {c.latestSl}</span>}
                        <span style={{ fontSize: '12px', color: '#ffffff', opacity: 0.55, fontFamily: 'monospace' }}>{c.totalQty} lots</span>
                        {(row.t1 || row.t2 || row.t3) && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            {row.t1 && <span style={{ fontSize: '10px', color: '#93c5fd', fontFamily: 'monospace' }}>T1 {row.t1}</span>}
                            {row.t2 && <span style={{ fontSize: '10px', color: '#60a5fa', fontFamily: 'monospace' }}>T2 {row.t2}</span>}
                            {row.t3 && <span style={{ fontSize: '10px', color: '#3b82f6', fontFamily: 'monospace' }}>T3 {row.t3}</span>}
                          </div>
                        )}
                        {/* Breakeven toggle */}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginLeft: '4px' }}>
                          <input
                            type="checkbox"
                            checked={!!breakEven[row.id]}
                            onChange={e => setBreakEven(prev => ({ ...prev, [row.id]: e.target.checked }))}
                            style={{ accentColor: '#10b981' }}
                          />
                          <span style={{ fontSize: '10px', color: breakEven[row.id] ? '#10b981' : '#ffffff', opacity: breakEven[row.id] ? 1 : 0.4, fontWeight: 700 }}>BE</span>
                        </label>
                        {!isFullyLocked && (
                          <button
                            onClick={() => { setAddingFor(isAdding ? null : row.id); setNewAdd({ price: '', stop: '', qty: '65', cost: '10' }); }}
                            style={{ fontSize: '10px', fontWeight: 900, color: '#60a5fa', opacity: 0.7, background: 'none', border: '1px solid rgba(96,165,250,0.3)', padding: '3px 8px', cursor: 'pointer', letterSpacing: '0.1em', textTransform: 'uppercase' }}
                          >
                            {isAdding ? 'Cancel' : '+ Add'}
                          </button>
                        )}
                      </div>

                      {/* Additional entries */}
                      {extras.map((e, ei) => (
                        <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px 6px 36px', border: '1px solid var(--border)', borderTop: 'none', background: 'rgba(255,255,255,0.02)' }}>
                          <span style={{ fontSize: '9px', color: '#60a5fa', fontFamily: 'monospace', opacity: 0.7 }}>+{ei + 1}</span>
                          <span style={{ fontSize: '12px', color: '#ffffff', fontFamily: 'monospace', opacity: 0.8 }}>@ {e.price}</span>
                          {e.stop > 0 && <span style={{ fontSize: '12px', color: '#ef4444', fontFamily: 'monospace' }}>SL {e.stop}</span>}
                          <span style={{ fontSize: '12px', color: '#ffffff', opacity: 0.5, fontFamily: 'monospace' }}>{e.qty} lots</span>
                          <span style={{ fontSize: '10px', color: '#60a5fa', fontFamily: 'monospace', marginLeft: 'auto' }}>{e.time}</span>
                          {!isFullyLocked && (
                            <button onClick={() => setAddEntries(prev => ({ ...prev, [row.id]: (prev[row.id] || []).filter(x => x.id !== e.id) }))}
                              style={{ fontSize: '11px', color: '#ef4444', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                          )}
                        </div>
                      ))}

                      {/* Inline add-entry form */}
                      {isAdding && (
                        <div style={{ padding: '10px 12px', border: '1px solid rgba(96,165,250,0.3)', borderTop: 'none', background: 'rgba(96,165,250,0.04)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            {[
                              { k: 'price', ph: 'Entry Price' },
                              { k: 'stop',  ph: 'New Stop' },
                              { k: 'qty',   ph: 'Qty' },
                              { k: 'cost',  ph: '₹ Cost' },
                            ].map(f => (
                              <div key={f.k} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                <span style={{ fontSize: '8px', fontWeight: 900, color: '#ffffff', opacity: 0.4, letterSpacing: '0.15em', textTransform: 'uppercase' }}>{f.ph}</span>
                                <input
                                  type="number"
                                  value={newAdd[f.k as keyof typeof newAdd]}
                                  onChange={e => setNewAdd(prev => ({ ...prev, [f.k]: e.target.value }))}
                                  placeholder="0"
                                  style={{ width: '90px', height: '30px', padding: '0 8px', background: 'var(--surface-2)', border: '1px solid var(--border)', color: '#ffffff', fontSize: '12px', fontFamily: 'monospace', outline: 'none' }}
                                  onFocus={e => (e.target.style.borderColor = '#60a5fa')}
                                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                                />
                              </div>
                            ))}
                            <button
                              onClick={() => handleAddEntry(row.id)}
                              disabled={!newAdd.price || !newAdd.qty}
                              className="btn-confirm"
                              style={{ height: '30px', padding: '0 16px', marginTop: '14px', fontSize: '11px' }}
                            >Log</button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Stop rules */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>Hard Stop Rule</div>
                  <div style={{ fontSize: '11px', color: '#ef4444', opacity: 0.75, lineHeight: 1.5 }}>Price returns to entry candle body after T1 → exit full position immediately.</div>
                </div>
                {finalCommand === 'INTERCEPTION' ? (
                  <div style={{ flex: 1, padding: '10px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>No re-entry after stop-out — Interception rule.</div>
                  </div>
                ) : (
                  <div style={{ flex: 1, padding: '10px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', marginBottom: '4px' }}>Re-entry: one allowed after stop-out</div>
                    <div style={{ fontSize: '11px', color: '#ffffff', opacity: 0.55, lineHeight: 1.5 }}>Confirmed BOS in original direction required.</div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <textarea
                value={midNotes}
                onChange={e => setMidNotes(e.target.value)}
                placeholder="Log mid-trade decisions — stop moves, partial exits, command changes..."
                className="w-full bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[48px] mb-4"
              />

              <div className="flex justify-end border-t border-[var(--border)] pt-4">
                <button onClick={() => setMissionPhase(2)} className="btn-confirm w-48">Close Position</button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══ SUB-PHASE C: EXIT DEBRIEF ═══ */}
      {missionPhase >= 2 && (
        <div className="p-5 border border-[var(--border)] bg-[var(--surface)]">
          <SectionHead label="Exit Debrief" sub="Post-Trade" />

          {/* Exit price per row */}
          <div className="space-y-2 mb-5">
            {tradeRows.filter(r => r.entry).map((row, idx) => {
              const c    = rowCombined(row);
              const exit = parseFloat(exitData[row.id] || '') || (row.id === primary?.id ? parseFloat(String(editFormData.exit_price || '')) : 0);
              const pnl  = exit > 0 ? (c.isShort ? (c.wPrice - exit) * c.totalQty - c.totalCost : (exit - c.wPrice) * c.totalQty - c.totalCost) : null;
              return (
                <div key={row.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '1px solid var(--border)', background: 'var(--surface-2)' }}>
                  <span style={{ fontSize: '9px', color: '#ffffff', opacity: 0.3, minWidth: '18px' }}>#{idx + 1}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', fontFamily: 'monospace', flex: 1 }}>
                    {[assetPrefix, row.assetSuffix].filter(Boolean).join(' ') || '—'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#ffffff', opacity: 0.4, fontFamily: 'monospace' }}>avg {c.wPrice.toFixed(2)} · {c.totalQty} lots</span>
                  <input
                    type="number"
                    value={exitData[row.id] ?? (row.id === primary?.id ? String(editFormData.exit_price || '') : '')}
                    onChange={e => {
                      setExitData(prev => ({ ...prev, [row.id]: e.target.value }));
                      if (row.id === primary?.id) upd('exit_price', e.target.value);
                    }}
                    disabled={isFullyLocked}
                    placeholder="Exit price"
                    style={{
                      width: '110px', height: '34px', padding: '0 10px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      color: '#ffffff', fontSize: '13px', fontFamily: 'monospace',
                      outline: 'none', textAlign: 'right', opacity: isFullyLocked ? 0.4 : 1,
                    }}
                    onFocus={e => (e.target.style.borderColor = '#ffd700')}
                    onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                  />
                  {pnl !== null && (
                    <span style={{ fontSize: '14px', fontWeight: 900, fontFamily: 'monospace', color: pnl >= 0 ? '#10b981' : '#ef4444', minWidth: '80px', textAlign: 'right' }}>
                      {pnl > 0 ? '+' : ''}{pnl.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Net PnL + RRR */}
          {tradeRows.some(r => exitData[r.id] || (r.id === primary?.id && exitA > 0)) && (
            <div className="grid grid-cols-3 gap-4 px-4 py-4 mb-5 border border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', opacity: 0.5, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Net PnL</span>
                <span className={`text-3xl font-black tabular-nums ${netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{netPnL > 0 ? '+' : ''}{netPnL.toFixed(2)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', opacity: 0.5, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Yield</span>
                <span className={`text-xl font-black tabular-nums ${pnlA >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {pc.wPrice * pc.totalQty > 0 ? `${((pnlA / (pc.wPrice * pc.totalQty)) * 100).toFixed(2)}%` : '—'}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', opacity: 0.5, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Risk Reward</span>
                <span className="text-xl font-black text-blue-500 tabular-nums">{rrrA.toFixed(2)}R</span>
              </div>
            </div>
          )}

          {/* Execution rating */}
          <div className="flex items-center justify-between py-3 mb-4 border-t border-b border-[var(--border)]">
            <span style={{ fontSize: '11px', fontWeight: 900, color: '#ffffff', opacity: 0.7, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Execution Precision</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => !isFullyLocked && upd('execution_rating', n)} disabled={isFullyLocked}
                  className="text-xl transition-colors duration-200"
                  style={{ color: (editFormData.execution_rating as number) >= n ? '#F59E0B' : 'var(--border)' }}
                >★</button>
              ))}
            </div>
          </div>

          {/* Debrief + submit */}
          <div className="flex gap-4 items-start">
            <div className="flex-1 flex flex-col gap-2">
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mission Debrief</div>
              <textarea
                value={String(editFormData.notes || '')}
                onChange={e => upd('notes', e.target.value)}
                disabled={isFullyLocked}
                placeholder="Journal post-mission performance and psychological state..."
                className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[72px]"
              />
            </div>
            <div className="flex gap-2 shrink-0 pt-6">
              <button
                onClick={handleConfirmExit}
                disabled={!exitA || isFullyLocked}
                className={`w-48 ${isFullyLocked ? 'btn-confirmed' : 'btn-confirm'}`}
              >
                {isFullyLocked ? '✓ Mission Complete' : 'MAYA Audit →'}
              </button>
            </div>
          </div>

          {stepTimestamps.missionControl && (
            <div className="text-right text-[9px] font-mono text-[#ffffff] opacity-40 mt-2">
              Mission Complete: {stepTimestamps.missionControl}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
