// TradeCardComponent — right side of the hybrid trade card. Captures the actual
// execution: side, instrument, status, entry/stop/qty/cost, targets, scale-ins,
// partial exits, breakeven, exit, notes — and persists to the backend.

import { useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { useNetra } from '../../../../context/NetraContext';
import { API_BASE } from '../../../../utils/constants';
import type { TradeCard } from './types';
import { computeCardStats, autoTime, MONO, bare, sep, SEP6, BOX_H, Field } from './helpers';

export default function TradeCardComponent({
  card, tradeIndex, assetPrefix, username, onChange, onRemove, canRemove, isLocked, getAuthHeaders,
}: {
  card: TradeCard;
  tradeIndex: number;
  assetPrefix: string;
  username: string;
  onChange: (updates: Partial<TradeCard>) => void;
  onRemove: () => void;
  canRemove: boolean;
  isLocked: boolean;
  getAuthHeaders: (extra?: Record<string, string>) => Record<string, string>;
}) {
  const { SYSTEM_DATA } = useNetra();
  const tradeStatuses = SYSTEM_DATA.tradeStatuses || [];
  const exitTypes     = SYSTEM_DATA.exitTypes     || [];

  const [addingPos,   setAddingPos]   = useState(false);
  const [subtractPos, setSubtractPos] = useState(false);
  const [newAdd,     setNewAdd]       = useState({ price: '', stop: '', qty: '65', cost: '10' });
  const [newPartial, setNewPartial]   = useState({ qty: '', price: '' });
  const [saving,     setSaving]       = useState(false);
  const [saved,      setSaved]        = useState(false);
  const [saveError,  setSaveError]    = useState('');

  const isBuy   = card.side === 'BUY';
  const accent  = isBuy ? '#10b981' : '#ef4444';
  const stats   = computeCardStats(card);
  const fullAsset = [assetPrefix, card.assetSuffix].filter(Boolean).join(' ') || '—';

  // Maps the local card shape onto the backend quick-trade payload.
  const buildPayload = (overrides: Partial<TradeCard> = {}) => {
    const c = { ...card, ...overrides };
    return {
      username,
      asset:           [assetPrefix, c.assetSuffix].filter(Boolean).join(' ') || undefined,
      side:            c.side,
      weapon:          c.weapon         || undefined,
      weapon_thought:  c.weaponThought  || undefined,
      weapon_strategy: c.weaponNote     || undefined,
      entry_price:     c.entry         || undefined,
      stop_loss:       c.sl            || undefined,
      quantity:        c.qty           || undefined,
      additional_cost: c.cost          || undefined,
      t1: c.t1 || undefined, t2: c.t2 || undefined,
      t3: c.t3 || undefined, t4: c.t4 || undefined,
      exit_price:            c.exitPrice     || undefined,
      notes:                 c.notes         || undefined,
      entry_time:            c.entryTime     || undefined,
      exit_time:             c.exitTime      || undefined,
      date:                  c.date,
      closed:                c.closed,
      trade_status:          c.tradeStatus   || undefined,
      exit_type:             c.exitType      || undefined,
      holding_time_minutes:  (() => {
        if (!c.entryTime || !c.exitTime) return undefined;
        const [eh = 0, em = 0] = c.entryTime.split(':').map(Number);
        const [xh = 0, xm = 0] = c.exitTime.split(':').map(Number);
        const mins = (xh * 60 + xm) - (eh * 60 + em);
        return mins > 0 ? mins : undefined;
      })(),
      add_entries:           c.addEntries,
      partial_exits:         c.partialExits,
    };
  };

  const saveToDb = async (overrides: Partial<TradeCard> = {}) => {
    setSaving(true);
    const headers = getAuthHeaders({ 'Content-Type': 'application/json' });
    try {
      if (card.dbId) {
        const res = await fetch(`${API_BASE}/api/quick-trade/${card.dbId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(buildPayload(overrides)),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
      } else {
        const res = await fetch(`${API_BASE}/api/quick-trade`, {
          method: 'POST',
          headers,
          body: JSON.stringify(buildPayload(overrides)),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (data?.id) onChange({ dbId: data.id });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setSaveError(msg);
      setTimeout(() => setSaveError(''), 3000);
    }
    setSaving(false);
  };

  // Default Status / Exit Type to the first option once the catalog loads
  useEffect(() => {
    const upd: Partial<TradeCard> = {};
    if (!card.tradeStatus && tradeStatuses.length) upd.tradeStatus = tradeStatuses[0];
    if (!card.exitType && exitTypes.length)        upd.exitType    = exitTypes[0];
    if (Object.keys(upd).length) onChange(upd);
  }, [tradeStatuses.length, exitTypes.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto SL = entry × 0.95 (skip if user manually set it)
  useEffect(() => {
    const price = parseFloat(card.entry);
    if (!price || price <= 0 || card.slManual) return;
    onChange({ sl: (price * 0.95).toFixed(2), t4: (price * 2).toFixed(2) });
  }, [card.entry]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch T1–T3, always set T4 = entry × 2
  useEffect(() => {
    const price = parseFloat(card.entry);
    if (!price || price <= 0) return;
    const t4 = (price * 2).toFixed(2);
    let cancelled = false;
    fetch(`${API_BASE}/api/decision/trade-targets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry_price: price, side: card.side }),
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return;
        if (data.t1) onChange({ t1: String(data.t1), t2: String(data.t2), t3: String(data.t3), t4 });
        else onChange({ t4 });
      })
      .catch(() => { if (!cancelled) onChange({ t4 }); });
    return () => { cancelled = true; };
  }, [card.entry, card.side]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPos = () => {
    const price = parseFloat(newAdd.price) || 0;
    const qty   = parseFloat(newAdd.qty)   || 0;
    if (!price || !qty) return;
    onChange({ addEntries: [...card.addEntries, { id: Date.now(), price, stop: parseFloat(newAdd.stop) || 0, qty, cost: parseFloat(newAdd.cost) || 0, time: autoTime() }] });
    setNewAdd({ price: '', stop: '', qty: '65', cost: '10' });
    setAddingPos(false);
  };

  const handleSubtract = () => {
    const qty   = parseFloat(newPartial.qty)   || 0;
    const price = parseFloat(newPartial.price) || 0;
    if (!qty || !price) return;
    onChange({ partialExits: [...card.partialExits, { id: Date.now(), qty, price, time: autoTime() }] });
    setNewPartial({ qty: '', price: '' });
    setSubtractPos(false);
  };

  const lbl = (): CSSProperties => ({
    fontFamily: MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em',
    textTransform: 'uppercase', marginBottom: '5px', color: '#ffffff',
  });

  // ── Closed state ──────────────────────────────────────────────────────────
  if (card.closed) {
    return (
      <div style={{ border: sep, background: '#07090f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: sep }}>
          {/* Trade ID */}
          <span style={{ fontFamily: MONO, fontSize: '10px', fontWeight: 900, color: '#4169E1', letterSpacing: '0.12em', flexShrink: 0 }}>T{tradeIndex + 1}</span>
          <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.08em', flexShrink: 0 }}>{card.dbId || 'DRAFT'}</span>
          <div style={{ width: '1px', height: '12px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />
          <span style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, color: accent, letterSpacing: '0.1em' }}>{card.side}</span>
          <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 700, color: '#e8eaed', flex: 1 }}>{fullAsset}</span>
          <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid rgba(255,255,255,0.12)' }}>✓ CLOSED</span>
          {!isLocked && (
            <button onClick={() => onChange({ closed: false })} className="btn-reset" style={{ fontSize: '10px', padding: '2px 10px' }}>EDIT</button>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#ffffff' }}>Entry {stats.wPrice > 0 ? stats.wPrice.toFixed(2) : card.entry}</span>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#ef4444' }}>SL {card.sl}</span>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#ffffff' }}>{stats.entryQty} lots</span>
            <span style={{ fontFamily: MONO, fontSize: '12px', color: '#ffffff' }}>Exit @ {card.exitPrice}</span>
            {card.beTriggered && <span style={{ fontFamily: MONO, fontSize: '10px', color: '#ffffff', letterSpacing: '0.1em' }}>BE ✓</span>}
            {card.entryTime && card.exitTime && (() => {
              const [eh = 0, em = 0] = card.entryTime.split(':').map(Number);
              const [xh = 0, xm = 0] = card.exitTime.split(':').map(Number);
              const mins = (xh * 60 + xm) - (eh * 60 + em);
              if (mins <= 0) return null;
              const h = Math.floor(mins / 60), m = mins % 60;
              return <span style={{ fontFamily: MONO, fontSize: '10px', color: '#ffffff' }}>⏱ {h > 0 ? `${h}h ${m}m` : `${m}m`}</span>;
            })()}
          </div>
          {stats.finalPnL !== null && (
            <span style={{ fontFamily: MONO, fontSize: '18px', fontWeight: 900, color: stats.finalPnL >= 0 ? '#10b981' : '#ef4444' }}>
              {stats.finalPnL > 0 ? '+' : ''}{stats.finalPnL.toFixed(2)}
            </span>
          )}
        </div>
        {card.notes && (
          <div style={{ padding: '0 16px 10px', fontFamily: MONO, fontSize: '11px', color: '#ffffff', lineHeight: 1.6 }}>{card.notes}</div>
        )}
      </div>
    );
  }

  // ── Open (active) state ───────────────────────────────────────────────────
  return (
    <div style={{ border: sep, background: '#07090f', display: 'flex', flexDirection: 'column', height: BOX_H, overflowY: 'auto' }}>

      {/* ── EXECUTION DATA header (mirrors the Weapon box header) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: SEP6, background: 'rgba(65,105,225,0.06)' }}>
        <span style={{ fontSize: '14px' }}>▦</span>
        <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, letterSpacing: '0.3em', color: '#ffffff', textTransform: 'uppercase' }}>Execution Data</span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 900, color: '#4169E1', letterSpacing: '0.08em' }}>T{tradeIndex + 1}</span>
        <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em' }}>{card.dbId || 'DRAFT'}</span>
        {canRemove && !isLocked && (
          <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '18px', lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        )}
      </div>

      {/* ── side · instrument · time ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderBottom: sep }}>
        <button
          onClick={() => !isLocked && onChange({ side: isBuy ? 'SELL' : 'BUY' })}
          style={{
            background: accent, border: 'none', borderRadius: '4px',
            color: '#07090f', fontFamily: MONO, fontSize: '11px', fontWeight: 900,
            padding: '6px 14px', cursor: 'pointer', letterSpacing: '0.1em', flexShrink: 0,
          }}
        >
          {isBuy ? 'BUY' : 'SELL'}
        </button>
        {assetPrefix && (
          <span style={{ fontFamily: MONO, color: '#ffffff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>{assetPrefix}</span>
        )}
        <input
          type="text"
          value={card.assetSuffix}
          onChange={e => onChange({ assetSuffix: e.target.value })}
          placeholder="asset name..."
          disabled={isLocked}
          style={{ ...bare, flex: 1, fontSize: '13px', fontWeight: 700 }}
        />
        {/* Entry time — typeable for backtesting, or ⏱ stamps the current time live */}
        <input
          type="time"
          value={card.entryTime}
          onChange={e => onChange({ entryTime: e.target.value })}
          disabled={isLocked}
          title="Entry time — set it manually for backtesting"
          style={{
            flexShrink: 0, fontFamily: MONO, fontSize: '11px', fontWeight: 700,
            padding: '5px 8px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.14)', borderRadius: '4px',
            color: '#ffffff', outline: 'none', colorScheme: 'dark',
          }}
        />
        <button
          onClick={() => !isLocked && onChange({ entryTime: autoTime() })}
          title="Stamp current time (live)"
          style={{
            flexShrink: 0, fontFamily: MONO, fontSize: '13px', fontWeight: 700,
            padding: '4px 9px', cursor: isLocked ? 'default' : 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '4px',
            color: '#ffffff',
          }}
        >
          ⏱
        </button>
      </div>

      {/* ── TRADE STATUS — label left, dropdown right ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: sep }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}>Status</span>
        <div style={{ flex: 1 }} />
        <select
          value={card.tradeStatus}
          onChange={e => !isLocked && onChange({ tradeStatus: e.target.value })}
          disabled={isLocked}
          style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.22)', padding: '6px 10px', cursor: isLocked ? 'default' : 'pointer', minWidth: '150px' }}
        >
          {tradeStatuses.map(s => <option key={s} value={s} style={{ color: '#000' }}>{s}</option>)}
        </select>
      </div>

      {/* ── ENTRY · QTY · SL · COST — 2×2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px 16px', borderBottom: sep }}>
        <Field label="Entry"  value={card.entry} onChange={v => onChange({ entry: v })} disabled={isLocked} placeholder="0.00" />
        <Field label="Qty"    value={card.qty}   onChange={v => onChange({ qty: v })}   disabled={isLocked} placeholder="65" />
        <Field label="Stop"   value={card.sl}    onChange={v => onChange({ sl: v, slManual: true })} disabled={isLocked} placeholder="0.00" color="#ef4444" />
        <Field label="₹ Cost" value={card.cost}  onChange={v => onChange({ cost: v })}  disabled={isLocked} placeholder="10" />
      </div>

      {/* ── TARGETS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: sep }}>
        {(['t1', 't2', 't3', 't4'] as const).map((key, i) => {
          const label    = key.toUpperCase();
          const tVal     = parseFloat(card[key]) || 0;
          const entryV   = parseFloat(card.entry) || 0;
          const slV      = parseFloat(card.sl)    || 0;
          const qtyV     = parseFloat(card.qty)   || 0;
          const costV    = parseFloat(card.cost)  || 0;
          const isShort  = card.side === 'SELL';
          const stopDist = isShort ? slV - entryV : entryV - slV;
          const tgtDist  = tVal > 0 && entryV > 0 ? (isShort ? entryV - tVal : tVal - entryV) : 0;
          const rr       = stopDist > 0 && tgtDist > 0 ? tgtDist / stopDist : 0;
          const profit   = tgtDist > 0 && qtyV > 0 ? tgtDist * qtyV - costV : 0;
          return (
            <div key={key} style={{ padding: '12px 14px', background: 'transparent', borderRight: i < 3 ? sep : undefined }}>
              <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', marginBottom: '4px' }}>{label}</div>
              <input type="number" value={card[key]} onChange={e => onChange({ [key]: e.target.value })}
                placeholder="—" disabled={isLocked}
                style={{ ...bare, fontSize: '13px', fontWeight: 900, color: '#e8eaed' }} />
              {rr > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: '#ffffff', fontWeight: 700 }}>1:{rr.toFixed(1)}R</div>
                  <div style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>+₹{profit.toFixed(0)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── MANAGE: breakeven (left = price, right = button) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: sep }}>
        <div style={{ padding: '14px 16px', borderRight: sep }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', marginBottom: '4px' }}>BREAKEVEN</div>
          <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: MONO, color: '#10b981' }}>
            {stats.be > 0 ? stats.be.toFixed(2) : '—'}
          </span>
        </div>
        <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            onClick={() => !isLocked && onChange({ beTriggered: !card.beTriggered })}
            disabled={isLocked}
            style={{
              width: '100%', padding: '8px 12px',
              fontFamily: MONO, fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              border: card.beTriggered ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
              background: card.beTriggered ? '#ffffff' : 'transparent',
              color: card.beTriggered ? '#07090f' : '#ffffff',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { if (!isLocked) e.currentTarget.style.background = card.beTriggered ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = card.beTriggered ? '#ffffff' : 'transparent'; }}
          >
            {card.beTriggered ? '✓ BE Active' : 'Move to BE'}
          </button>
        </div>
      </div>

      {/* ── ADD ENTRIES (if any) ── */}
      {card.addEntries.length > 0 && (
        <div style={{ borderBottom: sep }}>
          {card.addEntries.map((e, ei) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 14px', borderBottom: ei < card.addEntries.length - 1 ? sep : undefined, background: 'rgba(96,165,250,0.04)' }}>
              <span style={{ fontSize: '9px', color: '#60a5fa', opacity: 0.7 }}>+{ei + 1}</span>
              <span style={{ fontSize: '13px', fontFamily: MONO, color: '#ffffff', opacity: 1 }}>@ {e.price}</span>
              {e.stop > 0 && <span style={{ fontSize: '13px', fontFamily: MONO, color: '#ef4444' }}>SL {e.stop}</span>}
              <span style={{ fontSize: '13px', fontFamily: MONO, color: '#ffffff', opacity: 0.5 }}>{e.qty} lots</span>
              <span style={{ fontSize: '10px', color: '#60a5fa', fontFamily: MONO, marginLeft: 'auto' }}>{e.time}</span>
              {!isLocked && (
                <button onClick={() => onChange({ addEntries: card.addEntries.filter(x => x.id !== e.id) })}
                  style={{ color: '#ef4444', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── PARTIAL EXITS (if any) ── */}
      {card.partialExits.length > 0 && (
        <div style={{ borderBottom: sep }}>
          {card.partialExits.map((p, pi) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 14px', borderBottom: pi < card.partialExits.length - 1 ? sep : undefined, background: 'rgba(239,68,68,0.04)' }}>
              <span style={{ fontSize: '9px', color: '#ef4444', opacity: 0.7 }}>−{pi + 1}</span>
              <span style={{ fontSize: '13px', fontFamily: MONO, color: '#ffffff', opacity: 1 }}>exit @ {p.price}</span>
              <span style={{ fontSize: '13px', fontFamily: MONO, color: '#ffffff', opacity: 0.5 }}>{p.qty} lots</span>
              <span style={{ fontSize: '10px', color: '#ef4444', fontFamily: MONO, marginLeft: 'auto' }}>{p.time}</span>
              {!isLocked && (
                <button onClick={() => onChange({ partialExits: card.partialExits.filter(x => x.id !== p.id) })}
                  style={{ color: '#ef4444', opacity: 0.4, background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px' }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── ACTION BUTTONS ── */}
      {!isLocked && (
        <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderBottom: sep }}>
          <button
            onClick={() => { setAddingPos(!addingPos); setSubtractPos(false); }}
            style={{
              flex: 1, padding: '9px 0',
              fontFamily: MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer',
              border: addingPos ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
              background: addingPos ? '#ffffff' : 'transparent',
              color: addingPos ? '#07090f' : '#ffffff',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = addingPos ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = addingPos ? '#ffffff' : 'transparent'; }}
          >
            + ADD POSITION
          </button>
          <button
            onClick={() => { setSubtractPos(!subtractPos); setAddingPos(false); }}
            style={{
              flex: 1, padding: '9px 0',
              fontFamily: MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer',
              border: subtractPos ? '1px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
              background: subtractPos ? '#ffffff' : 'transparent',
              color: subtractPos ? '#07090f' : '#ffffff',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = subtractPos ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = subtractPos ? '#ffffff' : 'transparent'; }}
          >
            − PARTIAL EXIT
          </button>
        </div>
      )}

      {/* ── ADD POSITION FORM ── */}
      {addingPos && (
        <div style={{ padding: '12px 14px', background: 'transparent', borderBottom: sep }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {[{ k: 'price', ph: 'Entry Price' }, { k: 'stop', ph: 'New Stop' }, { k: 'qty', ph: 'Qty' }, { k: 'cost', ph: '₹ Cost' }].map(f => (
              <div key={f.k}>
                <div style={lbl()}>{f.ph}</div>
                <input type="number" value={newAdd[f.k as keyof typeof newAdd]}
                  onChange={e => setNewAdd(p => ({ ...p, [f.k]: e.target.value }))}
                  placeholder="0"
                  style={{ width: '80px', height: '34px', padding: '0 8px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#ffffff', fontSize: '13px', fontFamily: MONO, outline: 'none' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAddPos} disabled={!newAdd.price || !newAdd.qty} className="btn-confirm" style={{ height: '32px', padding: '0 18px', fontSize: '11px' }}>Log</button>
            <button onClick={() => setAddingPos(false)} className="btn-reset" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── PARTIAL EXIT FORM ── */}
      {subtractPos && (
        <div style={{ padding: '12px 14px', background: 'transparent', borderBottom: sep }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {[{ k: 'qty', ph: 'Qty to Exit' }, { k: 'price', ph: 'Exit Price' }].map(f => (
              <div key={f.k}>
                <div style={lbl()}>{f.ph}</div>
                <input type="number" value={newPartial[f.k as keyof typeof newPartial]}
                  onChange={e => setNewPartial(p => ({ ...p, [f.k]: e.target.value }))}
                  placeholder="0"
                  style={{ width: '110px', height: '34px', padding: '0 8px', background: 'var(--surface)', border: '1px solid var(--border)', color: '#ffffff', fontSize: '13px', fontFamily: MONO, outline: 'none' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleSubtract} disabled={!newPartial.qty || !newPartial.price} className="btn-confirm" style={{ height: '32px', padding: '0 18px', fontSize: '11px', background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', color: '#ef4444' }}>Log</button>
            <button onClick={() => setSubtractPos(false)} className="btn-reset" style={{ height: '32px', padding: '0 14px', fontSize: '11px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── EXIT — price + (backtest-settable) exit time ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '13px 16px', borderBottom: sep, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}>Exit</span>
        <input
          type="number"
          value={card.exitPrice}
          onChange={e => onChange({ exitPrice: e.target.value })}
          placeholder="0.00"
          disabled={isLocked}
          style={{ ...bare, flex: '1 1 90px', fontSize: '16px', fontWeight: 900, textAlign: 'right' }}
        />
        <input
          type="time"
          value={card.exitTime}
          onChange={e => onChange({ exitTime: e.target.value })}
          disabled={isLocked}
          title="Exit time — set it manually for backtesting"
          style={{
            flexShrink: 0, fontFamily: MONO, fontSize: '11px', fontWeight: 700,
            padding: '5px 8px', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.14)', borderRadius: '4px',
            color: '#ffffff', outline: 'none', colorScheme: 'dark',
          }}
        />
        <button
          onClick={() => !isLocked && onChange({ exitTime: autoTime() })}
          title="Stamp current time (live)"
          style={{
            flexShrink: 0, fontFamily: MONO, fontSize: '13px', fontWeight: 700,
            padding: '4px 9px', cursor: isLocked ? 'default' : 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.14)', borderRadius: '4px',
            color: '#ffffff',
          }}
        >
          ⏱
        </button>
      </div>

      {/* ── EXIT TYPE — label left, dropdown right ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: sep }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}>Exit Type</span>
        <div style={{ flex: 1 }} />
        <select
          value={card.exitType}
          onChange={e => !isLocked && onChange({ exitType: e.target.value })}
          disabled={isLocked}
          style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 700, color: '#ffffff', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.22)', padding: '6px 10px', cursor: isLocked ? 'default' : 'pointer', minWidth: '150px' }}
        >
          {exitTypes.map(t => <option key={t} value={t} style={{ color: '#000' }}>{t}</option>)}
        </select>
      </div>

      {/* ── NOTES ── */}
      <div style={{ padding: '14px 16px', borderBottom: sep }}>
        <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>Notes</div>
        <textarea
          value={card.notes}
          onChange={e => !isLocked && onChange({ notes: e.target.value })}
          placeholder="Trade notes — execution, management, what you saw…"
          disabled={isLocked}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none', resize: 'vertical', fontFamily: MONO, fontSize: '12px', color: '#ffffff', lineHeight: 1.7, minHeight: '110px', padding: '10px 12px' }}
        />
      </div>

      {/* ── SAVE + CLOSE TRADE ── */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px' }}>
        <button
          onClick={() => saveToDb()}
          disabled={isLocked || saving}
          style={{
            flex: 1, height: '42px',
            fontFamily: MONO, fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            border: saveError ? '1px solid #ef4444' : saved ? '1px solid #4169E1' : '1px solid rgba(255,255,255,0.3)',
            background: saveError ? 'rgba(239,68,68,0.1)' : saved ? 'rgba(65,105,225,0.15)' : 'transparent',
            color: '#ffffff',
            transition: 'all 150ms',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', padding: '0 8px',
          }}
          title={saveError || undefined}
          onMouseEnter={e => { if (!isLocked && !saving) e.currentTarget.style.background = saveError ? 'rgba(239,68,68,0.2)' : saved ? 'rgba(65,105,225,0.3)' : 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = saveError ? 'rgba(239,68,68,0.1)' : saved ? 'rgba(65,105,225,0.15)' : 'transparent'; }}
        >
          {saving ? 'Saving…' : saveError ? saveError : saved ? '✓ Saved' : card.dbId ? 'Update' : 'Save'}
        </button>
        <button
          onClick={() => { const xt = card.exitTime || autoTime(); onChange({ closed: true, exitTime: xt, tradeStatus: 'Closed' }); saveToDb({ closed: true, exitTime: xt, tradeStatus: 'Closed' }); }}
          disabled={!card.exitPrice || isLocked}
          style={{
            flex: 1, height: '42px',
            fontFamily: MONO, fontSize: '10px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase',
            cursor: card.exitPrice && !isLocked ? 'pointer' : 'not-allowed',
            border: card.exitPrice ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.15)',
            background: card.exitPrice ? 'rgba(239,68,68,0.12)' : 'transparent',
            color: '#ffffff',
            opacity: card.exitPrice ? 1 : 0.4,
            transition: 'all 150ms',
          }}
          onMouseEnter={e => { if (card.exitPrice && !isLocked) e.currentTarget.style.background = 'rgba(239,68,68,0.28)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = card.exitPrice ? 'rgba(239,68,68,0.12)' : 'transparent'; }}
        >
          Close Trade
        </button>
      </div>

    </div>
  );
}
