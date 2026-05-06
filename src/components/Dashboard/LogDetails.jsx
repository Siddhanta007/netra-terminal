import { useNetra } from '../../context/NetraContext';


export default function LogDetails({ log, onBack }) {
  const {
    editFormData, setEditFormData,
    commitTradeLog, updateTradeLog, deleteTradeLog,
    activeEditLog,
    session,
  } = useNetra();
  if (!log) return null;

  // Compute P&L metrics from form data
  const entry = parseFloat(editFormData.entry_price) || 0;
  const addCost = parseFloat(editFormData.additional_cost) || 0;
  const stop = parseFloat(editFormData.stop_loss) || 0;
  const exit = parseFloat(editFormData.exit_price) || 0;
  const breakeven = entry + addCost;
  const profit = exit > 0 ? exit - breakeven : 0;
  const risk = entry - stop;
  const rrr = profit > 0 && risk > 0 ? (risk / profit).toFixed(2) : 'Nil';
  const plPct = entry > 0 && exit > 0 ? ((profit / entry) * 100).toFixed(2) : '—';
  const isWin = profit > 0;
  const isLoss = profit < 0;

  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">

      {/* Header Card */}
      <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-gray-400 mb-1">Mission Log</div>
            <div className="font-sans text-sm font-bold text-gray-900 uppercase">{log.name || log.id}</div>
            <div className="font-mono text-[9px] font-bold text-gray-300 mt-1">{log.id}</div>
          </div>
          <button
            onClick={() => deleteTradeLog(log.id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all flex-shrink-0"
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-600 border border-gray-100 px-3 py-1 rounded-full bg-white">{log.phase1?.bias}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-blue-700 border border-blue-100 px-3 py-1 rounded-full bg-blue-50">{log.phase1?.weapon}</span>
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 border border-gray-100 px-3 py-1 rounded-full bg-white">{log.phase1?.protocol}</span>
        </div>
        {log.timestamp && (
          <div className="mt-3 text-[9px] text-gray-300 font-mono">Logged: {new Date(log.timestamp).toLocaleString('en-IN')}</div>
        )}
      </div>

      <div className="space-y-4 pb-10">

        {/* Analysis Context — Unified Tactical Matrix */}
        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4 border-b border-gray-50/50 pb-3">Tactical Analysis Matrix</h3>
          
          {/* SYMMETRIC GRID OF SELECTIONS */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {[
              { phase: 'Bias', sel: log.phase1?.bias },
              { phase: 'Auction', sel: log.phase1?.auction },
              { phase: 'Liquidity', sel: log.phase1?.liquidity },
              { phase: 'Behaviour', sel: log.phase1?.behaviour },
              { phase: 'STS Matrix', sel: log._stsData || log.session_state?.interSelections || log.session_state?.strikeSelections },
            ].map(item => {
              const displaySel = typeof item.sel === 'object' && item.sel !== null 
                ? Object.values(item.sel).filter(Boolean).join(', ') 
                : item.sel;
              
              return (
                <div key={item.phase} className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50/80 border border-gray-100 text-center transition-all hover:bg-white hover:shadow-md group">
                  <div className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 group-hover:text-[#4169E1] transition-colors">{item.phase}</div>
                  <div className="text-[11px] font-extrabold text-gray-900 leading-tight">{displaySel || '—'}</div>
                </div>
              );
            })}
          </div>

          {/* EXPANSIVE NARRATIVE INTEL BOX */}
          <div className="space-y-3">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              Analyst Narrative
            </div>
            <div className="p-4 rounded-xl bg-blue-50/30 border border-blue-100/50 min-height-[100px]">
              <div className="text-[11px] text-gray-600 leading-relaxed font-medium">
                {/* Consolidate all phase notes here if available, or show global notes */}
                {[
                  log.phase1?.bias_note && `[BIAS]: ${log.phase1.bias_note}`,
                  log.phase1?.auction_note && `[AUCTION]: ${log.phase1.auction_note}`,
                  log.phase1?.liquidity_note && `[LIQUIDITY]: ${log.phase1.liquidity_note}`,
                  log.phase1?.behaviour_note && `[BEHAVIOUR]: ${log.phase1.behaviour_note}`,
                  !log.phase1?.bias_note && !log.phase1?.auction_note && !log.phase1?.liquidity_note && !log.phase1?.behaviour_note && "No specific phase annotations recorded. Tactical parameters synchronized."
                ].filter(Boolean).map((note, idx) => (
                  <p key={idx} className={idx > 0 ? "mt-2 pt-2 border-t border-blue-100/30" : ""}>{note}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Execution Details */}
        <div className="bg-[var(--surface)] p-5 rounded-2xl border border-[var(--border)] shadow-sm">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">Execution Details</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Asset Analysed</label>
              <div className="field w-full text-xs bg-gray-50 text-gray-500 cursor-not-allowed" style={{ display: 'flex', alignItems: 'center', height: '36px', paddingLeft: '12px' }}>
                {log.asset || '—'}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Trading Instrument</label>
              <input type="text" value={editFormData.trading_asset || ''} onChange={e => setEditFormData({ ...editFormData, trading_asset: e.target.value })} className="field w-full text-xs" placeholder="e.g. NIFTY 25000 CE" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Entry Price</label>
                <input type="number" value={editFormData.entry_price || ''} onChange={e => setEditFormData({ ...editFormData, entry_price: e.target.value })} className="field w-full text-xs" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Additional Cost</label>
                <input type="number" value={editFormData.additional_cost || ''} onChange={e => setEditFormData({ ...editFormData, additional_cost: e.target.value })} className="field w-full text-xs" placeholder="Brokerage, slippage…" />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">Breakeven Cost</label>
              <div className="field w-full text-xs bg-amber-50 font-bold text-amber-700 cursor-default" style={{ display: 'flex', alignItems: 'center', height: '36px', paddingLeft: '12px', border: '1px solid #FDE68A' }}>
                {breakeven > 0 ? breakeven.toFixed(2) : '—'}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Stop Loss</label>
                <input type="number" value={editFormData.stop_loss || ''} onChange={e => setEditFormData({ ...editFormData, stop_loss: e.target.value })} className="field w-full text-xs" placeholder="0.00" />
              </div>
              <div>
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Exit Level</label>
                <input type="number" value={editFormData.exit_price || ''} onChange={e => setEditFormData({ ...editFormData, exit_price: e.target.value })} className="field w-full text-xs" placeholder="0.00" />
              </div>
            </div>
          </div>
        </div>

        {/* P&L Review — auto-calculated */}
        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border)] shadow-sm">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-50 pb-2">P&L Review</h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className={`p-3 rounded-lg border ${isWin ? 'bg-[var(--green-bg)] border-[var(--green)]' : isLoss ? 'bg-[var(--red-bg)] border-[var(--red)]' : 'bg-[var(--surface-2)] border-[var(--border)]'}`}>
              <div className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1">P&L</div>
              <div className={`text-sm font-bold ${isWin ? 'text-[var(--green)]' : isLoss ? 'text-[var(--red)]' : 'text-[var(--text-2)]'}`}>{profit > 0 ? '+' : ''}{profit.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg border bg-[var(--surface-2)] border-[var(--border)]">
              <div className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1">RRR</div>
              <div className="text-sm font-bold text-[var(--text-2)]">{rrr}</div>
            </div>
            <div className={`p-3 rounded-lg border ${isWin ? 'bg-[var(--green-bg)] border-[var(--green)]' : isLoss ? 'bg-[var(--red-bg)] border-[var(--red)]' : 'bg-[var(--surface-2)] border-[var(--border)]'}`}>
              <div className="text-[8px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1">P&L %</div>
              <div className={`text-sm font-bold ${isWin ? 'text-[var(--green)]' : isLoss ? 'text-[var(--red)]' : 'text-[var(--text-2)]'}`}>{plPct !== '—' ? `${plPct}%` : '—'}</div>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Operational Notes</label>
            <textarea value={editFormData.notes || ''} onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })} className="field w-full text-xs py-3 resize-none" style={{ height: '80px' }} placeholder="Post-trade narrative, learnings, observations…" />
          </div>

          {/* Integrated Save Button */}
          <div className="mt-8 pt-8 border-t border-slate-100">
            <button
              onClick={() => updateTradeLog(log.id)}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-emerald-500/10 hover:bg-emerald-700 transition-all active:scale-[0.98]"
            >
              Save Mission Analysis
            </button>
          </div>

          <div className="mt-6">
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Execution Rating</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} className={editFormData.execution_rating >= n ? 'active' : ''} onClick={() => setEditFormData({ ...editFormData, execution_rating: n })}>★</button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-[9px] text-gray-300 text-center uppercase tracking-widest font-semibold mt-2">
          Changes saved automatically
        </div>
      </div>
    </div>
  );
}
