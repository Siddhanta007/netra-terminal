import { useState, useEffect } from 'react';
import { useNetra } from '../../../context/NetraContext';
import { useNetraUtils } from '../../../hooks/useNetraUtils';
import { API_BASE } from '../../../utils/constants';

interface DaySummary {
  date: string;
  total: number;
  closed: number;
  wins: number;
  losses: number;
  total_pnl: number | null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AddEntry   { id: number; price: number; stop: number; qty: number; cost: number; time: string; }
interface PartialExit { id: number; qty: number; price: number; time: string; }

interface TradeCard {
  id: string;
  date: string;
  dbId: string | null;
  side: 'BUY' | 'SELL';
  assetSuffix: string;
  entry: string; sl: string; slManual: boolean;
  qty: string; cost: string;
  t1: string; t2: string; t3: string; t4: string;
  addEntries: AddEntry[];
  partialExits: PartialExit[];
  beTriggered: boolean;
  notes: string;
  exitPrice: string;
  entryTime: string;
  exitTime: string;
  closed: boolean;
}

const CARDS_KEY = 'netra_trade_cards_v1';
const todayStr  = () => new Date().toISOString().slice(0, 10);


const fmtDate = (d: string) => {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function mkCard(): TradeCard {
  return {
    id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
    date: todayStr(), dbId: null,
    side: 'BUY', assetSuffix: '',
    entry: '', sl: '', slManual: false,
    qty: '65', cost: '10',
    t1: '', t2: '', t3: '', t4: '',
    addEntries: [], partialExits: [],
    beTriggered: false, notes: '',
    exitPrice: '', entryTime: '', exitTime: '', closed: false,
  };
}

const autoTime = () => new Date().toTimeString().slice(0, 5);

function computeCardStats(card: TradeCard) {
  const baseEntry = parseFloat(card.entry) || 0;
  const baseSl    = parseFloat(card.sl)    || 0;
  const baseQty   = parseFloat(card.qty)   || 0;
  const baseCost  = parseFloat(card.cost)  || 0;
  const entries = [
    ...(baseEntry > 0 && baseQty > 0 ? [{ price: baseEntry, qty: baseQty, cost: baseCost }] : []),
    ...card.addEntries.filter(e => e.price > 0 && e.qty > 0).map(e => ({ price: e.price, qty: e.qty, cost: e.cost })),
  ];
  const entryQty  = entries.reduce((s, e) => s + e.qty, 0);
  const totalCost = entries.reduce((s, e) => s + e.cost, 0);
  const wPrice    = entryQty > 0 ? entries.reduce((s, e) => s + e.price * e.qty, 0) / entryQty : 0;
  const partialQty    = card.partialExits.reduce((s, p) => s + p.qty, 0);
  const remainingQty  = Math.max(entryQty - partialQty, 0);
  const isShort  = card.side === 'SELL';
  const be       = wPrice > 0 ? (isShort ? wPrice - totalCost / (entryQty || 1) : wPrice + totalCost / (entryQty || 1)) : 0;
  const latestSl = card.addEntries.length > 0 ? card.addEntries[card.addEntries.length - 1].stop : baseSl;
  const stopDist = Math.abs(wPrice - (latestSl || baseSl));
  const partialPnL = card.partialExits.reduce((s, p) => s + (isShort ? wPrice - p.price : p.price - wPrice) * p.qty, 0);
  const exitP = parseFloat(card.exitPrice) || 0;
  const finalPnL = exitP > 0 && wPrice > 0
    ? (isShort ? wPrice - exitP : exitP - wPrice) * remainingQty + partialPnL - totalCost
    : null;
  return { wPrice, entryQty, remainingQty, totalCost, be, isShort, latestSl, stopDist, finalPnL };
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const MONO = 'JetBrains Mono, Consolas, monospace';
const bare: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.22)',
  outline: 'none',
  fontFamily: MONO, color: '#e8eaed', width: '100%',
  padding: '4px 6px',
};
const sep = '1px solid rgba(255,255,255,0.07)';

function StatCell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 900, color: color || '#ffffff' }}>{value}</div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px 2px' }}>
      <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.3em', textTransform: 'uppercase', flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}

// ─── TradeCardComponent ───────────────────────────────────────────────────────

function TradeCardComponent({
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

  const buildPayload = (overrides: Partial<TradeCard> = {}) => {
    const c = { ...card, ...overrides };
    return {
      username,
      asset:           [assetPrefix, c.assetSuffix].filter(Boolean).join(' ') || undefined,
      side:            c.side,
      entry_price:     c.entry         || undefined,
      stop_loss:       c.sl            || undefined,
      quantity:        c.qty           || undefined,
      additional_cost: c.cost          || undefined,
      t1: c.t1 || undefined, t2: c.t2 || undefined,
      t3: c.t3 || undefined, t4: c.t4 || undefined,
      exit_price:      c.exitPrice     || undefined,
      notes:           c.notes         || undefined,
      entry_time:      c.entryTime     || undefined,
      exit_time:       c.exitTime      || undefined,
      date:            c.date,
      closed:          c.closed,
      add_entries:     c.addEntries,    // backend computes weighted avg + breakeven
      partial_exits:   c.partialExits,  // backend computes remaining qty + P&L
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

  const lbl = (): React.CSSProperties => ({
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
    <div style={{ border: sep, borderLeft: `2px solid ${accent}`, background: '#07090f', display: 'flex', flexDirection: 'column' }}>

      {/* ── HEADER: trade id + side + instrument + time + remove ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderBottom: sep }}>
        {/* Trade number + DB ID */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0, borderRight: sep, paddingRight: '12px' }}>
          <span style={{ fontFamily: MONO, fontSize: '14px', fontWeight: 900, color: '#4169E1', letterSpacing: '0.08em', lineHeight: 1 }}>T{tradeIndex + 1}</span>
          <span style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.06em', lineHeight: 1 }}>{card.dbId || 'DRAFT'}</span>
        </div>
        <button
          onClick={() => !isLocked && onChange({ side: isBuy ? 'SELL' : 'BUY' })}
          style={{
            background: 'transparent',
            border: `1px solid rgba(255,255,255,0.12)`,
            color: accent, fontFamily: MONO, fontSize: '11px', fontWeight: 900,
            padding: '4px 10px', cursor: 'pointer', letterSpacing: '0.1em', flexShrink: 0,
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
        <button
          onClick={() => !isLocked && onChange({ entryTime: autoTime() })}
          title={card.entryTime ? 'Re-stamp entry time' : 'Stamp entry time'}
          style={{
            flexShrink: 0, fontFamily: MONO, fontSize: '10px', fontWeight: 700,
            padding: '3px 8px', cursor: isLocked ? 'default' : 'pointer',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#ffffff',
            letterSpacing: '0.06em',
          }}
        >
          {card.entryTime || '⏱ time'}
        </button>

        {canRemove && !isLocked && (
          <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '20px', lineHeight: 1, padding: 0, flexShrink: 0 }}>×</button>
        )}
      </div>

      {/* ── SECTION: ENTRY ── */}

      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: sep }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', width: '90px', flexShrink: 0 }}>Entry</span>
        <input type="number" value={card.entry} onChange={e => onChange({ entry: e.target.value })}
          placeholder="0.00" disabled={isLocked}
          style={{ ...bare, flex: 1, fontSize: '16px', fontWeight: 900, textAlign: 'right' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: sep }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', width: '90px', flexShrink: 0 }}>₹ Cost</span>
        <input type="number" value={card.cost} onChange={e => onChange({ cost: e.target.value })}
          placeholder="10" disabled={isLocked}
          style={{ ...bare, flex: 1, fontSize: '16px', fontWeight: 900, textAlign: 'right' }} />
      </div>

      {/* ── SECTION: RISK ── */}

      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: sep }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase', width: '90px', flexShrink: 0 }}>Stop Loss</span>
        <input type="number" value={card.sl} onChange={e => onChange({ sl: e.target.value, slManual: true })}
          placeholder="0.00" disabled={isLocked}
          style={{ ...bare, flex: 1, fontSize: '16px', fontWeight: 900, color: '#ef4444', textAlign: 'right' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: sep }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', width: '90px', flexShrink: 0 }}>Quantity</span>
        <input type="number" value={card.qty} onChange={e => onChange({ qty: e.target.value })}
          placeholder="65" disabled={isLocked}
          style={{ ...bare, flex: 1, fontSize: '16px', fontWeight: 900, textAlign: 'right' }} />
      </div>

      {/* ── SECTION: TARGETS ── */}

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

      {/* ── SECTION: MANAGE ── */}

      {/* ── BREAKEVEN row: left = price, right = button ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: sep }}>
        <div style={{ padding: '14px 16px', borderRight: sep }}>
          <div style={{ fontFamily: MONO, fontSize: '8px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', marginBottom: '4px' }}>BREAKEVEN</div>
          <span style={{ fontSize: '16px', fontWeight: 900, fontFamily: MONO, color: '#e8eaed' }}>
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

      {/* ── EXIT ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px', borderBottom: sep }}>
        <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase', width: '90px', flexShrink: 0 }}>Exit</span>
        <input
          type="number"
          value={card.exitPrice}
          onChange={e => onChange({ exitPrice: e.target.value })}
          placeholder="0.00"
          disabled={isLocked}
          style={{ ...bare, flex: 1, fontSize: '16px', fontWeight: 900, textAlign: 'right' }}
        />
      </div>

      {/* ── NOTES ── */}
      <div style={{ padding: '14px 16px', borderBottom: sep }}>
        <textarea
          value={card.notes}
          onChange={e => !isLocked && onChange({ notes: e.target.value })}
          placeholder="Notes..."
          disabled={isLocked}
          style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', outline: 'none', resize: 'none', fontFamily: MONO, fontSize: '11px', color: '#ffffff', lineHeight: 1.6, minHeight: '60px', padding: '8px 10px' }}
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
          onClick={() => { onChange({ closed: true, exitTime: autoTime() }); saveToDb({ closed: true, exitTime: autoTime() }); }}
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

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Phase10MissionControl() {
  const {
    highestStep,
    rAmount, dailyLossHit, dailyTargetHit,
    session,
  } = useNetra();

  const isFullyLocked = highestStep > 6;
  const assetPrefix   = (session?.assetName || '').trim();
  const { getAuthHeaders } = useNetraUtils();

  const [cards, setCards] = useState<TradeCard[]>(() => {
    try {
      const raw = localStorage.getItem(CARDS_KEY);
      if (raw) return JSON.parse(raw) as TradeCard[];
    } catch { /* ignore */ }
    return [mkCard(), mkCard()];
  });

  const [dbSummary, setDbSummary] = useState<DaySummary | null>(null);

  useEffect(() => {
    localStorage.setItem(CARDS_KEY, JSON.stringify(cards));
  }, [cards]);

  // Fetch today's summary from DB
  useEffect(() => {
    fetch(`${API_BASE}/api/logs/day-summary?date=${todayStr()}`, {
      headers: getAuthHeaders(),
    })
      .then(r => r.json())
      .then((data: DaySummary) => setDbSummary(data))
      .catch(() => { /* silently ignore if server unreachable */ });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updCard = (id: string, updates: Partial<TradeCard>) =>
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));

  const visibleCards = cards.filter(c => c.date === todayStr());

  // Aggregate stats across visible cards with entry data
  const aggStats = visibleCards.reduce((acc, card) => {
    const s = computeCardStats(card);
    if (s.wPrice <= 0) return acc;
    return {
      totalQty:   acc.totalQty   + s.entryQty,
      totalCost:  acc.totalCost  + s.totalCost,
      totalValue: acc.totalValue + s.wPrice * s.entryQty,
      hasShort:   acc.hasShort   || s.isShort,
    };
  }, { totalQty: 0, totalCost: 0, totalValue: 0, hasShort: false });

  const aggWPrice = aggStats.totalQty > 0 ? aggStats.totalValue / aggStats.totalQty : 0;
  const aggBe     = aggWPrice > 0
    ? (aggStats.hasShort ? aggWPrice - aggStats.totalCost / aggStats.totalQty : aggWPrice + aggStats.totalCost / aggStats.totalQty)
    : 0;

  const primary = visibleCards[0] ?? cards[0] ?? mkCard();
  const pStats  = computeCardStats(primary);
  const r       = parseFloat(rAmount) || 0;
  const positionSz = r > 0 && pStats.stopDist > 0 ? Math.floor(r / pStats.stopDist) : 0;

  const s400Active = dailyLossHit || dailyTargetHit;


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

      {/* ── Today's summary bar (DB-sourced) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '10px 20px', border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Today</div>
          <div style={{ fontSize: '12px', fontWeight: 700, fontFamily: MONO, color: '#ffffff' }}>{fmtDate(todayStr())}</div>
        </div>
        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Sessions</div>
          <div style={{ fontSize: '15px', fontWeight: 900, fontFamily: MONO, color: '#ffffff' }}>{dbSummary?.total ?? '—'}</div>
        </div>
        <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />
        <div>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Closed</div>
          <div style={{ fontSize: '15px', fontWeight: 900, fontFamily: MONO, color: '#ffffff' }}>{dbSummary?.closed ?? '—'}</div>
        </div>
        {dbSummary && dbSummary.closed > 0 && (
          <>
            <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />
            <div>
              <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>W / L</div>
              <div style={{ fontSize: '15px', fontWeight: 900, fontFamily: MONO }}>
                <span style={{ color: '#10b981' }}>{dbSummary.wins}</span>
                <span style={{ color: '#ffffff' }}> / </span>
                <span style={{ color: '#ef4444' }}>{dbSummary.losses}</span>
              </div>
            </div>
            {dbSummary.total_pnl !== null && (
              <>
                <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />
                <div>
                  <div style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '2px' }}>Day P&L</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, fontFamily: MONO, color: dbSummary.total_pnl >= 0 ? '#10b981' : '#ef4444' }}>
                    {dbSummary.total_pnl > 0 ? '+' : ''}{dbSummary.total_pnl.toFixed(2)}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* ── Aggregate stats ── */}
      {aggWPrice > 0 && (
        <div className="grid grid-cols-3 gap-3 px-4 py-3 border border-[var(--border)]" style={{ background: 'var(--surface-2)' }}>
          <StatCell label="Breakeven"        value={aggBe > 0 ? aggBe.toFixed(2) : '—'} />
          <StatCell label="Entry Cost"       value={aggWPrice * aggStats.totalQty > 0 ? `₹${(aggWPrice * aggStats.totalQty).toFixed(0)}` : '—'} />
          <StatCell label="Position Size (R)" value={positionSz > 0 ? `${positionSz} units` : '—'} color="#60a5fa" />
        </div>
      )}

      {/* ── Trade cards ── */}
      {visibleCards.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          {visibleCards.map((card, idx) => (
            <TradeCardComponent
              key={card.id}
              card={card}
              tradeIndex={idx}
              assetPrefix={assetPrefix}
              username={session?.userName || ''}
              onChange={updates => updCard(card.id, updates)}
              onRemove={() => setCards(prev => prev.filter(c => c.id !== card.id))}
              canRemove={visibleCards.length > 1}
              isLocked={isFullyLocked}
              getAuthHeaders={getAuthHeaders}
            />
          ))}
        </div>
      ) : (
        <div style={{ padding: '32px', textAlign: 'center', border: '1px dashed var(--border)', color: '#ffffff', fontSize: '12px', fontFamily: MONO, letterSpacing: '0.1em' }}>
          No trades today
        </div>
      )}

      {/* ── Add trade ── */}
      {!isFullyLocked && (
        <button
          onClick={() => setCards(prev => [...prev, mkCard()])}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            width: '100%', padding: '9px 0',
            border: '1px dashed var(--border)', background: 'none', cursor: 'pointer',
            fontSize: '10px', fontWeight: 900, color: '#ffffff',
            letterSpacing: '0.15em', textTransform: 'uppercase',
          }}
        >
          + Add Trade
        </button>
      )}



    </div>
  );
}
