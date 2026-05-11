import { useNetra } from '../../context/NetraContext';
import { useReduceFlag } from '../../hooks/useReduceFlag';

export default function Phase4Behaviour() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, confirmStep, editStep,
    stepTimestamps,
  } = useNetra();

  const reduceFlag = useReduceFlag();
  const isLocked = highestStep > 4;

  const liq = selections.liquidityContext || {};
  const dims = SYSTEM_DATA.liquidityContext?.dimensions || [];

  const setLiq = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, liquidityContext: { ...liq, [key]: val } });
  };

  const tier = liq.tier || '';
  const maturity = liq.maturity || '';

  const isNoEngagement =
    tier === 'Tier 3 (LTF Walls)' ||
    (tier === 'Tier 2 (MTF Walls)' && maturity === 'Mature');

  const noEngagementReason = tier === 'Tier 3 (LTF Walls)'
    ? 'Tier 3 walls carry insufficient structural authority. Risk-reward is disproportionate at this level.'
    : 'Tier 2 wall with Mature status has no fresh institutional orders remaining. Stop placement risk is extreme.';

  const allSelected = dims.every(d => !!liq[d.id]);
  const canConfirm = !isLocked && !isNoEngagement && allSelected;

  return (
    <div className="flex flex-col fade-up phase-theme-4">

      {/* REDUCE FLAG */}
      {reduceFlag && (
        <div className="flex items-center gap-3 px-4 py-2.5 mb-3" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.35)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#f59e0b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            ⚠ REDUCE FLAG ACTIVE — Half R · First Target Only · No Trailing
          </span>
        </div>
      )}

      {/* DIMENSIONS */}
      {dims.map((dim) => (
        <div key={dim.id} className="precision-row">
          <div className="precision-label">{dim.name}</div>
          <div className="precision-selector">
            {(dim.options || []).map(opt => {
              const isSelected = liq[dim.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setLiq(dim.id, opt)}
                  disabled={isLocked}
                  className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                >{opt}</button>
              );
            })}
          </div>
        </div>
      ))}

      {/* NO ENGAGEMENT GATE */}
      {isNoEngagement && !isLocked && (
        <div className="flex flex-col gap-1.5 px-4 py-3 mt-3" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.4)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Liquidity Context Invalid</span>
          <span style={{ fontSize: '10px', color: '#ef4444', opacity: 0.75, lineHeight: 1.5 }}>{noEngagementReason}</span>
        </div>
      )}

      {/* NOTES + ACTIONS */}
      <div className="flex gap-4 items-start pt-4 mt-2">
        <textarea
          value={notes.liquidityContext || ''}
          onChange={e => setNotes({ ...notes, liquidityContext: e.target.value })}
          placeholder="Record liquidity context — tier quality, zone maturity, nearest structural protection..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => editStep(4)} className="btn-reset w-24" disabled={!isLocked}>Edit</button>
          <button
            onClick={() => confirmStep(4)}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={!canConfirm}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm Liquidity'}
          </button>
        </div>
      </div>
      {stepTimestamps.liquidityContext && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40 mt-1">Locked: {stepTimestamps.liquidityContext}</div>
      )}

    </div>
  );
}
