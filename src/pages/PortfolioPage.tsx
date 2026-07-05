import { useNetra } from '../context/NetraContext';

const MONO = 'JetBrains Mono, Consolas, monospace';

export default function PortfolioPage() {
  const { tradeLogs, darkMode } = useNetra();

  // Filter closed trades
  const closedTrades = tradeLogs.filter(log => log.closed || log.phase4?.outcome || log.phase3?.exit_price);

  // Compute stats
  const totalTrades = closedTrades.length;
  const wins = closedTrades.filter(t => {
    const outcome = (t.phase4?.outcome || '').toLowerCase();
    return outcome.includes('win') || outcome === 'profit';
  }).length;
  
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
  
  // Calculate total R-multiple
  let totalR = 0;
  let totalPnL = 0;
  closedTrades.forEach(t => {
    if (t.phase3?.pnl) {
      try {
        totalPnL += parseFloat(t.phase3.pnl);
      } catch { /* ignore */ }
    }
    if (t.phase3?.r_multiple) {
      try {
        totalR += parseFloat(t.phase3.r_multiple);
      } catch { /* ignore */ }
    } else if (t.r_multiple) {
      try {
        totalR += parseFloat(t.r_multiple as string);
      } catch { /* ignore */ }
    }
  });

  return (
    <div style={{ flex: 1, minHeight: 'calc(100vh - 56px)', background: '#05070c', color: '#ffffff', padding: '32px', overflowY: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        
        {/* Header Title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '6px', height: '6px', background: '#3b82f6' }} />
            <span style={{ fontFamily: MONO, fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.25em', textTransform: 'uppercase' }}>Operational Ledger</span>
          </div>
          <h1 style={{ fontFamily: MONO, fontSize: '24px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0 }}>
            Operator Portfolio
          </h1>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          
          {/* Card 1: Gained R */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Total R-Multiple</span>
            <div style={{ fontFamily: MONO, fontSize: '28px', fontWeight: 900, color: totalR >= 0 ? '#10b981' : '#ef4444' }}>
              {totalR >= 0 ? '+' : ''}{totalR.toFixed(2)}R
            </div>
          </div>

          {/* Card 2: Net PnL */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Net Profit/Loss</span>
            <div style={{ fontFamily: MONO, fontSize: '28px', fontWeight: 900, color: totalPnL >= 0 ? '#10b981' : '#ef4444' }}>
              {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
          </div>

          {/* Card 3: Win Rate */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Win Rate</span>
            <div style={{ fontFamily: MONO, fontSize: '28px', fontWeight: 900, color: '#3b82f6' }}>
              {winRate}%
            </div>
          </div>

          {/* Card 4: Total Trades */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px', borderRadius: '0px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontFamily: MONO, fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Closed Positions</span>
            <div style={{ fontFamily: MONO, fontSize: '28px', fontWeight: 900, color: '#ffffff' }}>
              {totalTrades}
            </div>
          </div>

        </div>

        {/* Trade Ledger Table */}
        <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0px', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: MONO, fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
              Audit Log Ledger
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontFamily: MONO, fontSize: '11px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>ID</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>ASSET</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>TYPE</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>WEAPON</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>ENTRY</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>EXIT</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>PNL</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>R-MULTIPLE</th>
                  <th style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.4)', fontWeight: 800 }}>OUTCOME</th>
                </tr>
              </thead>
              <tbody>
                {closedTrades.length > 0 ? (
                  closedTrades.map((t, idx) => {
                    const isWin = (t.phase4?.outcome || '').toLowerCase().includes('win');
                    const isLoss = (t.phase4?.outcome || '').toLowerCase().includes('loss');
                    const pnlVal = parseFloat(t.phase3?.pnl || '0');
                    const rMultipleVal = parseFloat(t.phase3?.r_multiple || t.r_multiple || '0');
                    const side = t.phase2?.direction || t.side || 'BUY';

                    return (
                      <tr key={t.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 120ms' }} className="hover:bg-white/[0.02]">
                        <td style={{ padding: '14px 20px', fontWeight: 800 }}>{t.id}</td>
                        <td style={{ padding: '14px 20px', fontWeight: 900 }}>{t.name || t.phase2?.trading_asset || '—'}</td>
                        <td style={{ padding: '14px 20px', color: side === 'SELL' ? '#ef4444' : '#10b981', fontWeight: 900 }}>{side}</td>
                        <td style={{ padding: '14px 20px', color: 'rgba(255,255,255,0.6)' }}>{t.weapon || '—'}</td>
                        <td style={{ padding: '14px 20px' }}>₹{parseFloat(t.phase2?.entry_price || '0').toFixed(2)}</td>
                        <td style={{ padding: '14px 20px' }}>₹{parseFloat(t.phase3?.exit_price || '0').toFixed(2)}</td>
                        <td style={{ padding: '14px 20px', color: pnlVal >= 0 ? '#10b981' : '#ef4444', fontWeight: 900 }}>
                          {pnlVal >= 0 ? '+' : ''}₹{pnlVal.toFixed(0)}
                        </td>
                        <td style={{ padding: '14px 20px', color: rMultipleVal >= 0 ? '#10b981' : '#ef4444', fontWeight: 900 }}>
                          {rMultipleVal >= 0 ? '+' : ''}{rMultipleVal.toFixed(2)}R
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            padding: '3px 8px',
                            background: isWin ? 'rgba(16,185,129,0.1)' : isLoss ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                            border: isWin ? '1px solid #10b981' : isLoss ? '1px solid #ef4444' : '1px solid rgba(255,255,255,0.12)',
                            color: isWin ? '#10b981' : isLoss ? '#ef4444' : '#ffffff',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            fontSize: '9px',
                            letterSpacing: '0.05em'
                          }}>
                            {t.phase4?.outcome || 'Breakeven'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} style={{ padding: '32px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>
                      No closed trade logs detected in system ledger.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
