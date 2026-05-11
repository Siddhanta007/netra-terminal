import { useNetra } from '../../context/NetraContext';
import { StrikeSelections, InterSelections, SystemDimension } from '../../types';

// ─── Verdict types ───────────────────────────────────────────────────────────

export type STSVerdict = 'EXECUTE' | 'WAIT' | 'NO_ENGAGEMENT' | null;

// ─── Strike logic ─────────────────────────────────────────────────────────────

export function getStrikeVerdict(s: Partial<StrikeSelections>): STSVerdict {
  if (s.pullbackQuality === 'Structural Damage') return 'NO_ENGAGEMENT';
  if (s.zoneReaction === 'Failure') return 'NO_ENGAGEMENT';
  if (!s.continuationTrigger) return null;
  if (s.continuationTrigger === 'Opposite BOS' || s.continuationTrigger === 'No BOS') return 'NO_ENGAGEMENT';
  if (s.continuationTrigger === 'Weak BOS') return 'WAIT';
  if (s.continuationTrigger === 'Clean BOS') return 'EXECUTE';
  return null;
}

export function getStrikeWeaponRec(s: Partial<StrikeSelections>): string | null {
  if (getStrikeVerdict(s) !== 'EXECUTE') return null;
  if (s.continuationZone === 'None (Shallow Pullback)') return 'TRSH';
  if (s.zoneReaction === 'Rejection') return 'BRAM';
  if (s.zoneReaction === 'Absorption') return 'AGN';
  return null;
}

// ─── Interception logic ───────────────────────────────────────────────────────

export function getInterVerdict(s: Partial<InterSelections>): STSVerdict {
  if (s.sweep === 'None' && s.response === 'Strong Acceptance') return 'NO_ENGAGEMENT';
  if (s.flip === 'Failed Flip') return 'NO_ENGAGEMENT';
  if (!s.reversion || !s.flip) return null;
  if (s.reversion === 'Slow/None' && s.flip === 'No Flip') return 'NO_ENGAGEMENT';
  if (s.reversion === 'Slow/None' || s.flip === 'No Flip') return 'WAIT';
  if ((s.reversion === 'Fast' || s.reversion === 'Moderate') && s.flip === 'Confirmed Flip') return 'EXECUTE';
  return null;
}

export function getInterWeaponRec(s: Partial<InterSelections>): string | null {
  if (getInterVerdict(s) !== 'EXECUTE') return null;
  if (s.pattern === 'Direct') return 'AKA';
  if (s.pattern === 'Layered') return 'TEER';
  if (s.pattern === 'Inducement') return 'PNKA';
  if (s.pattern === 'Hover') return 'PRTH';
  return null;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 mb-2 mt-1">
      <span style={{ fontSize: '7px', fontWeight: 900, color: 'var(--text-4)', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
    </div>
  );
}

function DimRow({ dim, value, onSelect, isLocked }: { dim: SystemDimension; value: string; onSelect: (v: string) => void; isLocked: boolean }) {
  const opts = dim.opts || dim.options || [];
  return (
    <div className="precision-row">
      <div className="precision-label">{dim.name}</div>
      <div className="precision-selector">
        {opts.map(opt => (
          <button
            key={opt}
            onClick={() => !isLocked && onSelect(opt)}
            disabled={isLocked}
            className={`precision-opt ${value === opt ? 'selected' : ''} ${isLocked && value !== opt ? 'opacity-30 cursor-not-allowed' : ''}`}
          >{opt}</button>
        ))}
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

  const zonePresent = s.continuationZone && s.continuationZone !== 'None (Shallow Pullback)';
  const zoneNone = s.continuationZone === 'None (Shallow Pullback)';

  const t2Blocked = s.pullbackQuality === 'Structural Damage' || s.zoneReaction === 'Failure';

  const t3Visible = !t2Blocked && (
    zoneNone ||
    (zonePresent && !!s.zoneReaction && s.zoneReaction !== 'Failure')
  );

  const verdict = getStrikeVerdict(s);
  const weaponRec = getStrikeWeaponRec(s);

  return (
    <div className="flex flex-col">
      {/* T1 */}
      <SectionLabel label="T1 — Impulse Quality" />
      {d('impulseQuality') && (
        <DimRow dim={d('impulseQuality')} value={s.impulseQuality || ''} onSelect={v => set({ impulseQuality: v })} isLocked={isLocked} />
      )}
      {s.impulseQuality === 'Weak' && (
        <div className="px-4 py-2 mb-1" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <span style={{ fontSize: '9px', color: '#f59e0b' }}>Weak impulse — reduced conviction. Proceed with caution.</span>
        </div>
      )}

      {/* T2 */}
      {!!s.impulseQuality && (
        <>
          <Divider />
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
            />
          )}

          {zoneNone && (
            <div className="px-4 py-2 mb-1" style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <span style={{ fontSize: '9px', color: '#10b981' }}>Shallow pullback path — Trishul weapon route active.</span>
            </div>
          )}

          {zonePresent && (
            <>
              {d('pullbackQuality') && (
                <DimRow dim={d('pullbackQuality')} value={s.pullbackQuality || ''} onSelect={v => set({ pullbackQuality: v, zoneReaction: '', continuationTrigger: '' })} isLocked={isLocked} />
              )}
              {s.pullbackQuality === 'Structural Damage' && (
                <div className="px-4 py-2 mb-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⛔ Zone Invalidated — Structural Damage. NO ENGAGEMENT.</span>
                </div>
              )}
              {s.pullbackQuality && s.pullbackQuality !== 'Structural Damage' && d('zoneReaction') && (
                <DimRow dim={d('zoneReaction')} value={s.zoneReaction || ''} onSelect={v => set({ zoneReaction: v, continuationTrigger: '' })} isLocked={isLocked} />
              )}
              {s.zoneReaction === 'Failure' && (
                <div className="px-4 py-2 mb-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⛔ Zone Reaction Failure. NO ENGAGEMENT.</span>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* T3 */}
      {t3Visible && (
        <>
          <Divider />
          <SectionLabel label="T3 — Continuation Trigger" />
          {d('continuationTrigger') && (
            <DimRow dim={d('continuationTrigger')} value={s.continuationTrigger || ''} onSelect={v => set({ continuationTrigger: v })} isLocked={isLocked} />
          )}
        </>
      )}

      {/* Verdict */}
      {verdict && (
        <>
          <Divider />
          {verdict === 'EXECUTE' && (
            <div className="flex flex-col gap-1 px-4 py-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', letterSpacing: '0.2em', textTransform: 'uppercase' }}>✓ EXECUTE — All STS Tiers Cleared</span>
              {weaponRec && <span style={{ fontSize: '10px', color: '#10b981', opacity: 0.8 }}>Weapon Route: <strong>{weaponRec}</strong></span>}
            </div>
          )}
          {verdict === 'WAIT' && (
            <div className="px-4 py-2.5" style={{ background: 'rgba(100,116,139,0.07)', border: '1px solid rgba(100,116,139,0.3)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⏸ WAIT — No Trigger. Monitor for BOS to strengthen.</span>
            </div>
          )}
          {verdict === 'NO_ENGAGEMENT' && !t2Blocked && (
            <div className="px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Structural reversal detected.</span>
            </div>
          )}
        </>
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

  const engine = is.pattern === 'Direct' ? '1 — AAKASH (AKA)'
    : is.pattern === 'Layered' ? '2 — TEER'
    : is.pattern === 'Inducement' ? '3 — PINAKA (PNKA)'
    : is.pattern === 'Hover' ? '4 — PRITHVI (PRTH)' : null;

  const t1Complete = !!is.pattern && !!is.friction;
  const t2NoEngagement = is.sweep === 'None' && is.response === 'Strong Acceptance';
  const t2Complete = !!is.sweep && !!is.response && !t2NoEngagement;

  const verdict = getInterVerdict(is);
  const weaponRec = getInterWeaponRec(is);

  return (
    <div className="flex flex-col">
      {/* T1 */}
      <SectionLabel label="T1 — Approach Pattern & Engine ID" />
      {d('pattern') && (
        <DimRow dim={d('pattern')} value={is.pattern || ''} onSelect={v => set({ pattern: v })} isLocked={isLocked} />
      )}
      {d('friction') && (
        <DimRow dim={d('friction')} value={is.friction || ''} onSelect={v => set({ friction: v })} isLocked={isLocked} />
      )}
      {engine && (
        <div className="px-4 py-2 mb-1" style={{ background: 'rgba(65,105,225,0.07)', border: '1px solid rgba(65,105,225,0.25)' }}>
          <span style={{ fontSize: '9px', color: '#4169E1' }}>Engine Identified: <strong>Engine {engine}</strong></span>
        </div>
      )}

      {/* T2 */}
      {t1Complete && (
        <>
          <Divider />
          <SectionLabel label="T2 — Sweep Confirmation" />
          {d('sweep') && (
            <DimRow dim={d('sweep')} value={is.sweep || ''} onSelect={v => set({ sweep: v })} isLocked={isLocked} />
          )}
          {d('response') && (
            <DimRow dim={d('response')} value={is.response || ''} onSelect={v => set({ response: v })} isLocked={isLocked} />
          )}
          {t2NoEngagement && (
            <div className="px-4 py-2.5 mb-1" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.15em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Strong acceptance without sweep indicates continuation, not a trap.</span>
            </div>
          )}
        </>
      )}

      {/* T3 */}
      {t2Complete && (
        <>
          <Divider />
          <SectionLabel label="T3 — Structural Flip Confirmation" />
          {d('reversion') && (
            <DimRow dim={d('reversion')} value={is.reversion || ''} onSelect={v => set({ reversion: v })} isLocked={isLocked} />
          )}
          {d('flip') && (
            <DimRow dim={d('flip')} value={is.flip || ''} onSelect={v => set({ flip: v })} isLocked={isLocked} />
          )}
        </>
      )}

      {/* Verdict */}
      {verdict && (
        <>
          <Divider />
          {verdict === 'EXECUTE' && (
            <div className="flex flex-col gap-1 px-4 py-3" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#10b981', letterSpacing: '0.2em', textTransform: 'uppercase' }}>✓ EXECUTE — All STS Tiers Cleared</span>
              {weaponRec && <span style={{ fontSize: '10px', color: '#10b981', opacity: 0.8 }}>Weapon Route: <strong>{weaponRec}</strong></span>}
            </div>
          )}
          {verdict === 'WAIT' && (
            <div className="px-4 py-2.5" style={{ background: 'rgba(100,116,139,0.07)', border: '1px solid rgba(100,116,139,0.3)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#64748b', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⏸ WAIT — Structural flip not confirmed. Monitor for confirmation.</span>
            </div>
          )}
          {verdict === 'NO_ENGAGEMENT' && !t2NoEngagement && (
            <div className="px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', letterSpacing: '0.2em', textTransform: 'uppercase' }}>⛔ NO ENGAGEMENT — Structural requirements not met.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

interface Phase7STSProps {
  command: 'STRIKE' | 'INTERCEPTION';
  isLocked: boolean;
}

export default function Phase7STS({ command, isLocked }: Phase7STSProps) {
  return command === 'STRIKE'
    ? <StrikeTree isLocked={isLocked} />
    : <InterTree isLocked={isLocked} />;
}
