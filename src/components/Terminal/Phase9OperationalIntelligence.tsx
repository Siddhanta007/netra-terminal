import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNetra } from '../../context/NetraContext';
import { setRulesAcknowledged } from '../../store/slices/analysisSlice';

// Sub-components copied from App.tsx
function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-1)', opacity: 0.7 }}>{label}</span>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 px-2 rounded-none bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[var(--text-1)] font-mono focus:border-[#4169E1] outline-none"
      />
    </div>
  );
}

function NumInput({ label, value, onChange, prefix }: { label: string; value: string; onChange: (v: string) => void; prefix?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-1)', opacity: 0.7 }}>{label}</span>
      <div className="flex items-center gap-1">
        {prefix && <span style={{ fontSize: '12px', color: 'var(--text-1)', fontWeight: 700 }}>{prefix}</span>}
        <input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-8 w-full px-2 rounded-none bg-[var(--surface-2)] border border-[var(--border)] text-[13px] text-[var(--text-1)] font-mono tabular-nums focus:border-[#4169E1] outline-none"
          placeholder="0"
        />
      </div>
    </div>
  );
}

export default function Phase9OperationalIntelligence() {
  const dispatch = useDispatch();
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    rAmount,
    dailyLossLimit,
    dailyTarget,
    openingWindow,
    sessionCutoff,
    isExpiryDay,
    expiryCutoff,
    rulesAcknowledged,
  } = useNetra();

  return (
    <div className="p-4 rounded-none border border-[var(--border)] bg-[var(--surface)] space-y-6">
      <div className="flex justify-between items-center pb-3 border-b border-[var(--border)]">
        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Operational Intelligence</div>
        <div style={{ fontSize: '11px', fontWeight: 900, color: '#4169E1', fontFamily: 'JetBrains Mono, monospace' }}>
          {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
        </div>
      </div>
      {/* PRE-TRADE DATA */}
      <div className="space-y-3">
        <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pre-Trade Data</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumInput label="Fixed R Per Trade" value={rAmount} onChange={v => dispatch({ type: 'analysis/setRAmount', payload: v })} prefix="₹" />
        </div>
      </div>

      {/* PRE-ENTRY PROTOCOL */}
      <div className="space-y-3">
        <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pre-Entry Protocol</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumInput label="Daily Loss Limit" value={dailyLossLimit} onChange={v => dispatch({ type: 'analysis/setDailyLossLimit', payload: v })} prefix="₹" />
          <NumInput label="Daily Target" value={dailyTarget} onChange={v => dispatch({ type: 'analysis/setDailyTarget', payload: v })} prefix="₹" />
          <TimeInput label="Opening Window" value={openingWindow} onChange={v => dispatch({ type: 'analysis/setOpeningWindow', payload: v })} />
          <TimeInput label="Session Cutoff" value={sessionCutoff} onChange={v => dispatch({ type: 'analysis/setSessionCutoff', payload: v })} />
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-1)', opacity: 0.7 }}>Expiry Day</span>
            <label className="flex items-center gap-2 h-8 cursor-pointer">
              <input type="checkbox" checked={isExpiryDay} onChange={e => dispatch({ type: 'analysis/setIsExpiryDay', payload: e.target.checked })} style={{ accentColor: '#f59e0b' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: isExpiryDay ? '#f59e0b' : 'var(--text-1)' }}>Today is expiry</span>
            </label>
          </div>
          {isExpiryDay && (
            <TimeInput label="Expiry Cutoff" value={expiryCutoff} onChange={v => dispatch({ type: 'analysis/setExpiryCutoff', payload: v })} />
          )}
        </div>
      </div>

      {/* SEVEN RULES */}
      <div className="space-y-3">
        <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div style={{ fontSize: '10px', fontWeight: 900, color: 'var(--text-1)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Seven Rules ({rulesAcknowledged.filter(Boolean).length}/7)
          </div>
          <button className="text-[10px] font-black uppercase tracking-widest text-[#4169E1]">
            {isExpanded ? 'Hide' : 'Show'}
          </button>
        </div>
        {isExpanded && (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {[
              'R is fixed before entry. Position size is calculated from R ÷ Stop Distance. Never widen the stop to increase size.',
              'First target on Interception is mandatory. No holding full position past T1. No exceptions.',
              'Breakeven trigger activates on first target body close. Immediately — not before, not after a delay.',
              'Daily loss limit ends the session. No revenge trading. No "one more trade." The S-400 has fired.',
              'Daily target ends the session voluntarily. Profitable sessions that continue after target give back gains.',
              'No re-entry on a failed Interception. The reversal failed. The original edge is gone.',
              'Time Protocol is structural, not situational. Session cutoff and expiry cutoff apply regardless of setup quality.',
            ].map((rule, i) => (
              <div
                key={i}
                className="p-2 border-l-4 transition-all duration-200 cursor-pointer flex items-start gap-3"
                style={{
                  background: rulesAcknowledged[i] ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                  borderLeftColor: rulesAcknowledged[i] ? '#10b981' : 'var(--border)',
                  borderTopColor: 'var(--border)',
                  borderRightColor: 'var(--border)',
                  borderBottomColor: 'var(--border)',
                  borderWidth: '1px 1px 1px 4px',
                  borderStyle: 'solid',
                  borderColor: rulesAcknowledged[i] ? '#10b981' : 'var(--border)',
                }}
                onClick={() => {
                  const next = [...rulesAcknowledged];
                  next[i] = !rulesAcknowledged[i];
                  dispatch(setRulesAcknowledged(next));
                }}
              >
                <input
                  type="checkbox"
                  checked={rulesAcknowledged[i] || false}
                  readOnly
                  style={{ marginTop: '2px', accentColor: '#10b981', flexShrink: 0 }}
                />
                <span style={{ fontSize: '11px', lineHeight: 1.5, color: '#ffffff' }}>
                  <strong style={{ color: rulesAcknowledged[i] ? '#10b981' : '#ffffff', marginRight: '4px' }}>Rule {i + 1}.</strong> {rule}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
