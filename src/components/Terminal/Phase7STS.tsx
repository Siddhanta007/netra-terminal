import { useNetra } from '../../context/NetraContext';
import { useEffect, useState } from 'react';
import { useNetraUtils } from '../../hooks/useNetraUtils';
import { StrikeSelections, InterSelections, SystemDimension } from '../../types';
import { API_BASE } from '../../utils/constants';

export type STSVerdict = 'EXECUTE' | 'WAIT' | 'NO_ENGAGEMENT' | null;

type VerdictResult = { verdict: STSVerdict; weapon: string | null; reason: string };

function useSTSVerdict(command: string, strikeDims: object, interDims: object): VerdictResult {
  const { getAuthHeaders } = useNetraUtils();
  const [result, setResult] = useState<VerdictResult>({ verdict: null, weapon: null, reason: '' });

  useEffect(() => {
    fetch(`${API_BASE}/api/decision/sts-verdict`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ command, strike_dims: strikeDims, inter_dims: interDims }),
    })
      .then(r => r.json())
      .then(setResult)
      .catch(() => {});
  }, [command, JSON.stringify(strikeDims), JSON.stringify(interDims)]);

  return result;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-2 mt-1">
      <span style={{ fontSize: '9px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.2em', textTransform: 'uppercase' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

function DimRow({ dim, value, onSelect, isLocked, accentColor }: { dim: SystemDimension; value: string; onSelect: (v: string) => void; isLocked: boolean; accentColor?: string }) {
  const opts = dim.opts || dim.options || [];
  return (
    <div className="precision-row">
      <div className="precision-label">{dim.name}</div>
      <div className="precision-selector">
        {opts.map(opt => {
          const isSelected = value === opt;
          return (
            <button
              key={opt}
              onClick={() => !isLocked && onSelect(opt)}
              disabled={isLocked}
              className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && value !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
              style={{
                borderColor: isSelected ? accentColor : undefined,
                color: isSelected ? '#ffffff' : undefined,
                background: isSelected ? (
                  accentColor === '#ffd700' ? 'rgba(255,215,0,0.14)' :
                  accentColor === '#38bdf8' ? 'rgba(56,189,248,0.14)' :
                  accentColor === '#f97316' ? 'rgba(249,115,22,0.14)' : undefined
                ) : undefined,
              }}
            >{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: '1px', background: 'var(--border)', margin: '14px 0 12px 0' }} />;
}

// ─── Strike STS Tree ─────────────────────────────────────────────────────────

function StrikeTree({ isLocked }: { isLocked: boolean }) {
  const { strikeSelections, setStrikeSelections, SYSTEM_DATA } = useNetra();
  const s = strikeSelections;
  const dims = SYSTEM_DATA.strikeDimensions || [];

  const d = (id: string) => dims.find(dim => dim.id === id)!;

  const set = (updates: Partial<StrikeSelections>) => {
    if (isLocked) return;
    setStrikeSelections({ ...s, ...updates } as StrikeSelections);
  };

  const zoneNone = s.continuationZone === 'None (Shallow Pullback)';

  const { verdict } = useSTSVerdict('STRIKE', s, {});

  return (
    <div className="flex flex-col">
      {/* T1 */}
      <SectionLabel label="T1 — Impulse Quality" />
      {d('impulseQuality') && (
        <DimRow dim={d('impulseQuality')} value={s.impulseQuality || ''} onSelect={v => set({ impulseQuality: v })} isLocked={isLocked} accentColor="#ffd700" />
      )}
      {s.impulseQuality === 'Weak' && (
        <div className="px-4 py-2 mb-1" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <span style={{ fontSize: '9px', color: '#f59e0b' }}>Weak impulse — reduced conviction. Proceed with caution.</span>
        </div>
      )}

      {/* T2 */}
      <SectionLabel label="T2 — Zone Interaction" />
      {d('continuationZone') && (
        <DimRow
          dim={d('continuationZone')}
          value={s.continuationZone || ''}
          onSelect={v => {
            if (v === 'None (Shallow Pullback)') {
              set({ continuationZone: v, pullbackQuality: '', zoneReaction: '', continuationTrigger: '' });
            } else {
              set({ continuationZone: v, continuationTrigger: '' });
            }
          }}
          isLocked={isLocked}
          accentColor="#ffd700"
        />
      )}
      {zoneNone && (
        <div className="px-4 py-2 mb-1" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <span style={{ fontSize: '9px', color: '#10b981' }}>Shallow pullback path — Trishul weapon route active.</span>
        </div>
      )}
      {d('pullbackQuality') && (
        <DimRow dim={d('pullbackQuality')} value={s.pullbackQuality || ''} onSelect={v => set({ pullbackQuality: v, zoneReaction: '', continuationTrigger: '' })} isLocked={isLocked} accentColor="#ffd700" />
      )}
      {s.pullbackQuality === 'Structural Damage' && (
        <div className="px-4 py-2 mb-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⛔ Zone Invalidated — Structural Damage. NO ENGAGEMENT.</span>
        </div>
      )}
      {d('zoneReaction') && (
        <DimRow dim={d('zoneReaction')} value={s.zoneReaction || ''} onSelect={v => set({ zoneReaction: v, continuationTrigger: '' })} isLocked={isLocked} accentColor="#ffd700" />
      )}
      {s.zoneReaction === 'Failure' && (
        <div className="px-4 py-2 mb-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⛔ Zone Reaction Failure. NO ENGAGEMENT.</span>
        </div>
      )}

      {/* T3 */}
      <SectionLabel label="T3 — Continuation Trigger" />
      {d('continuationTrigger') && (
        <DimRow dim={d('continuationTrigger')} value={s.continuationTrigger || ''} onSelect={v => set({ continuationTrigger: v })} isLocked={isLocked} accentColor="#ffd700" />
      )}

      {verdict && (
        <div className="px-4 py-2 mt-2" style={{ background: verdict === 'EXECUTE' ? 'rgba(16,185,129,0.08)' : verdict === 'WAIT' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${verdict === 'EXECUTE' ? 'rgba(16,185,129,0.3)' : verdict === 'WAIT' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: verdict === 'EXECUTE' ? '#10b981' : verdict === 'WAIT' ? '#f59e0b' : '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{verdict === 'EXECUTE' ? '✓ EXECUTE' : verdict === 'WAIT' ? '⏳ WAIT' : '⛔ NO ENGAGEMENT'}</span>
        </div>
      )}
    </div>
  );
}

// ─── Interception STS Tree ───────────────────────────────────────────────────

function InterTree({ isLocked }: { isLocked: boolean }) {
  const { interSelections, setInterSelections, SYSTEM_DATA } = useNetra();
  const is = interSelections;
  const dims = SYSTEM_DATA.interceptionDimensions || [];

  const d = (id: string) => dims.find(dim => dim.id === id)!;

  const set = (updates: Partial<InterSelections>) => {
    if (isLocked) return;
    setInterSelections({ ...is, ...updates } as InterSelections);
  };



  const t2NoEngagement = is.sweep === 'None' && is.response === 'Strong Acceptance';
  const { verdict } = useSTSVerdict('INTERCEPTION', {}, is);

  const detectedTrapsDim = {
    id: 'detectedTraps',
    name: 'Detected Traps',
    opts: ['None', 'Double Sided Trap', 'Second Attempt Fail', 'Session Liquidity Trap', 'News Spike Trap', 'Dealer Gamma Trap'],
  };

  return (
    <div className="flex flex-col">
      <SectionLabel label="Command Context — Interception" />
      <DimRow dim={detectedTrapsDim} value={is.detectedTraps || ''} onSelect={v => set({ detectedTraps: v })} isLocked={isLocked} accentColor="#38bdf8" />

      {/* T1 */}
      <SectionLabel label="T1 — Approach Pattern & Engine ID" />
      {d('pattern') && (
        <DimRow dim={d('pattern')} value={is.pattern || ''} onSelect={v => set({ pattern: v })} isLocked={isLocked} accentColor="#38bdf8" />
      )}
      {d('friction') && (
        <DimRow dim={d('friction')} value={is.friction || ''} onSelect={v => set({ friction: v })} isLocked={isLocked} accentColor="#38bdf8" />
      )}

      {/* T2 */}
      <SectionLabel label="T2 — Sweep Confirmation" />
      {d('sweep') && (
        <DimRow dim={d('sweep')} value={is.sweep || ''} onSelect={v => set({ sweep: v })} isLocked={isLocked} accentColor="#38bdf8" />
      )}
      {d('response') && (
        <DimRow dim={d('response')} value={is.response || ''} onSelect={v => set({ response: v })} isLocked={isLocked} accentColor="#38bdf8" />
      )}
      {t2NoEngagement && (
        <div className="px-4 py-2.5 mb-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Strong acceptance without sweep indicates continuation, not a trap.</span>
        </div>
      )}

      {/* T3 */}
      <SectionLabel label="T3 — Structural Flip Confirmation" />
      {d('reversion') && (
        <DimRow dim={d('reversion')} value={is.reversion || ''} onSelect={v => set({ reversion: v })} isLocked={isLocked} accentColor="#38bdf8" />
      )}
      {d('flip') && (
        <DimRow dim={d('flip')} value={is.flip || ''} onSelect={v => set({ flip: v })} isLocked={isLocked} accentColor="#38bdf8" />
      )}

      {verdict && (
        <div className="px-4 py-2 mt-2" style={{ background: verdict === 'EXECUTE' ? 'rgba(16,185,129,0.08)' : verdict === 'WAIT' ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${verdict === 'EXECUTE' ? 'rgba(16,185,129,0.3)' : verdict === 'WAIT' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
          <span style={{ fontSize: '9px', fontWeight: 900, color: verdict === 'EXECUTE' ? '#10b981' : verdict === 'WAIT' ? '#f59e0b' : '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>{verdict === 'EXECUTE' ? '✓ EXECUTE' : verdict === 'WAIT' ? '⏳ WAIT' : '⛔ NO ENGAGEMENT'}</span>
        </div>
      )}
    </div>
  );
}

// ─── Saturation STS Tree ───────────────────────────────────────────────────

function SaturationTree({ isLocked }: { isLocked: boolean }) {
  const { saturationSelections, setSaturationSelections, SYSTEM_DATA } = useNetra();
  const dims = (SYSTEM_DATA.saturationDimensions as SystemDimension[]) || [];

  const set = (id: string, val: string) => {
    if (isLocked) return;
    setSaturationSelections({ ...saturationSelections, [id]: val });
  };

  return (
    <div className="flex flex-col">
      {dims.map((dim: SystemDimension) => (
        <DimRow
          key={dim.id}
          dim={dim}
          value={saturationSelections[dim.id] || ''}
          onSelect={v => set(dim.id, v)}
          isLocked={isLocked}
          accentColor="#f97316"
        />
      ))}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Phase7STSProps {
  command: 'STRIKE' | 'INTERCEPTION' | 'SATURATION';
  isLocked: boolean;
}

export default function Phase7STS({ command, isLocked }: Phase7STSProps) {
  if (command === 'STRIKE') return <StrikeTree isLocked={isLocked} />;
  if (command === 'INTERCEPTION') return <InterTree isLocked={isLocked} />;
  if (command === 'SATURATION') return <SaturationTree isLocked={isLocked} />;
  return null;
}
