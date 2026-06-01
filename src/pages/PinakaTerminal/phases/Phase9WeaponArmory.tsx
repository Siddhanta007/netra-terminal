import { useState } from 'react';
import { useNetra } from '../../../context/NetraContext';
import { Weapon, WeaponDimension } from '../../../types';

const MONO: React.CSSProperties = { fontFamily: 'Space Grotesk, Inter, sans-serif' };

// ─── Execution Mapping ────────────────────────────────────────────────────────

function ExecMapSection({ marks, checked, toggle, isLocked }: {
  marks: string[];
  checked: Record<number, boolean>;
  toggle: (i: number) => void;
  isLocked: boolean;
}) {
  const [open, setOpen] = useState(true);
  const done  = marks.filter((_, i) => !!checked[i]).length;
  const total = marks.length;
  const cols  = 3;

  return (
    <div style={{ marginBottom: '4px' }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          margin: '0 0 12px 0',
          display: 'flex', alignItems: 'center', gap: '10px',
          borderLeft: '3px solid var(--phase-accent)',
          paddingLeft: '10px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <span style={{ ...MONO, fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
          Component 1 — Execution Mapping
        </span>
        <span style={{ ...MONO, fontSize: '10px', fontWeight: 700, color: done === total ? 'var(--phase-accent)' : 'var(--text-3)', letterSpacing: '0.04em', flexShrink: 0 }}>
          {done}/{total}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
        <span style={{ fontSize: '10px', color: 'var(--text-4)', flexShrink: 0 }}>{open ? '▾' : '▸'}</span>
      </div>

      {open && (
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
          border: '1px solid var(--border-strong)',
          borderRadius: '0 0 4px 4px', overflow: 'hidden', marginBottom: '12px',
        }}>
          {marks.map((mark, i) => {
            const isDone    = !!checked[i];
            const rowCount  = Math.ceil(marks.length / cols);
            const isLastRow = i >= (rowCount - 1) * cols;
            const isRightEdge = (i + 1) % cols === 0 || i === marks.length - 1;
            return (
              <div
                key={i}
                onClick={() => !isLocked && toggle(i)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: '10px',
                  padding: '11px 12px', cursor: isLocked ? 'default' : 'pointer',
                  background: isDone ? 'var(--phase-accent-bg)' : 'transparent',
                  borderBottom: isLastRow ? 'none' : '1px solid var(--border)',
                  borderRight: isRightEdge ? 'none' : '1px solid var(--border)',
                  transition: 'background 120ms',
                }}
              >
                <div style={{
                  width: '12px', height: '12px', flexShrink: 0, borderRadius: '2px', marginTop: '2px',
                  border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
                  background: isDone ? 'var(--phase-accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 100ms',
                }}>
                  {isDone && <span style={{ fontSize: '8px', color: 'white', fontWeight: 900, lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{
                  ...MONO, fontSize: '12px', fontWeight: 500, flex: 1, lineHeight: 1.55,
                  color: isDone ? 'var(--text-3)' : 'var(--text-1)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-4)',
                }}>{mark}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Weapon Dimensions ────────────────────────────────────────────────────────

function WeaponDimSection({ dims, values, onSelect, isLocked }: {
  dims: WeaponDimension[];
  values: Record<string, string>;
  onSelect: (id: string, v: string) => void;
  isLocked: boolean;
}) {
  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        borderLeft: '3px solid var(--phase-accent)',
        paddingLeft: '10px', marginBottom: '14px',
      }}>
        <span style={{ ...MONO, fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
          Component 2 — Weapon Dimensions
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      </div>
      {dims.map(dim => {
        const selected = values[dim.id];
        const optDesc  = selected ? dim.optDescriptions?.[selected] : undefined;
        return (
          <div key={dim.id} style={{ marginBottom: '18px' }}>
            {dim.description && (
              <p style={{ ...MONO, fontSize: '12px', color: 'var(--text-1)', lineHeight: 1.75, margin: '0 0 8px 0' }}>
                {dim.description}
              </p>
            )}
            {dim.howToMeasure && (
              <p style={{ ...MONO, fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.75, margin: '0 0 10px 0', fontStyle: 'italic' }}>
                {dim.howToMeasure}
              </p>
            )}
            <div className="precision-row" style={{ marginBottom: optDesc ? '8px' : 0 }}>
              <div className="precision-label">{dim.name}</div>
              <div className="precision-selector">
                {dim.opts.map(opt => {
                  const sel = values[dim.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => !isLocked && onSelect(dim.id, opt)}
                      disabled={isLocked}
                      className={`precision-opt ${sel ? 'selected' : ''} ${isLocked && !sel ? 'opacity-30 cursor-not-allowed' : ''}`}
                    >{opt}</button>
                  );
                })}
              </div>
            </div>
            {optDesc && (
              <p style={{ ...MONO, fontSize: '12px', color: 'var(--text-2)', lineHeight: 1.7, margin: '0', paddingLeft: '10px', borderLeft: '2px solid var(--phase-accent)' }}>
                {optDesc}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Inducement Pool Tracker (AAKASH only) ────────────────────────────────────

function InducementPoolTracker({ isLocked }: { isLocked: boolean }) {
  const [poolCount, setPoolCount] = useState(0);
  const [swept, setSwept] = useState<boolean[]>([]);
  const [objectiveSweep, setObjectiveSweep] = useState(false);

  const adjust = (delta: number) => {
    if (isLocked) return;
    const next = Math.min(8, Math.max(0, poolCount + delta));
    setPoolCount(next);
    setSwept(prev => Array.from({ length: next }, (_, i) => prev[i] ?? false));
    if (next === 0) setObjectiveSweep(false);
  };

  const toggle = (i: number) => {
    if (isLocked) return;
    setSwept(prev => {
      const arr = Array.from({ length: poolCount }, (_, j) => prev[j] ?? false);
      if (!arr[i]) {
        arr[i] = true;
      } else {
        for (let j = i; j < poolCount; j++) arr[j] = false;
        setObjectiveSweep(false);
      }
      return arr;
    });
  };

  const sweptCount = Array.from({ length: poolCount }, (_, i) => swept[i] ?? false).filter(Boolean).length;
  const allSwept   = poolCount > 0 && sweptCount === poolCount;

  const status =
    poolCount === 0          ? null
    : allSwept && objectiveSweep ? 'COMPLETE'
    : allSwept               ? 'AWAITING'
    : sweptCount > 0         ? 'IN PROGRESS'
    : 'INCOMPLETE';

  const statusColor =
    status === 'COMPLETE'    ? '#4ade80'
    : status === 'AWAITING'  ? '#67e8f9'
    : status === 'IN PROGRESS' ? '#fbbf24'
    : status === 'INCOMPLETE' ? '#f87171'
    : 'var(--text-4)';

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        borderLeft: '3px solid var(--phase-accent)',
        paddingLeft: '10px', marginBottom: '14px',
      }}>
        <span style={{ ...MONO, fontSize: '11px', fontWeight: 800, color: 'var(--text-1)', letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0 }}>
          Inducement Pool Sweep Verification
        </span>
        {status && (
          <span style={{ ...MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.14em', color: statusColor, textTransform: 'uppercase', flexShrink: 0 }}>
            {status}
          </span>
        )}
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {/* Pool count selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
        <span style={{ ...MONO, fontSize: '11px', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.04em' }}>
          Pools drawn on chart
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => adjust(-1)}
            disabled={isLocked || poolCount === 0}
            style={{
              width: '24px', height: '24px', borderRadius: '2px', flexShrink: 0,
              background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
              color: 'var(--text-1)', fontSize: '15px', lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (isLocked || poolCount === 0) ? 0.3 : 1,
            }}
          >−</button>
          <span style={{ ...MONO, fontSize: '16px', fontWeight: 900, color: 'var(--phase-accent)', minWidth: '22px', textAlign: 'center' }}>
            {poolCount}
          </span>
          <button
            onClick={() => adjust(1)}
            disabled={isLocked || poolCount === 8}
            style={{
              width: '24px', height: '24px', borderRadius: '2px', flexShrink: 0,
              background: 'var(--surface-2)', border: '1px solid var(--border-strong)',
              color: 'var(--text-1)', fontSize: '15px', lineHeight: 1, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              opacity: (isLocked || poolCount === 8) ? 0.3 : 1,
            }}
          >+</button>
        </div>
      </div>

      {/* Sequential pool checks + objective */}
      {poolCount > 0 && (
        <div style={{ border: '1px solid var(--border-strong)', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>

          {Array.from({ length: poolCount }, (_, i) => {
            const isDone   = swept[i] ?? false;
            const canCheck = i === 0 || (swept[i - 1] ?? false);
            return (
              <div
                key={i}
                onClick={() => canCheck && !isLocked && toggle(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '11px 14px',
                  background: isDone ? 'var(--phase-accent-bg)' : 'transparent',
                  borderBottom: '1px solid var(--border)',
                  cursor: canCheck && !isLocked ? 'pointer' : 'default',
                  opacity: !canCheck ? 0.3 : 1,
                  transition: 'background 120ms, opacity 150ms',
                }}
              >
                <div style={{
                  width: '24px', height: '24px', flexShrink: 0, borderRadius: '3px',
                  background: isDone ? 'var(--phase-accent)' : 'var(--surface-2)',
                  border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 120ms',
                }}>
                  <span style={{ ...MONO, fontSize: '10px', fontWeight: 900, color: isDone ? 'white' : 'var(--text-3)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <span style={{
                  ...MONO, flex: 1, fontSize: '12px', fontWeight: 500, lineHeight: 1.4,
                  color: isDone ? 'var(--text-3)' : 'var(--text-1)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  textDecorationColor: 'var(--text-4)',
                }}>
                  Pool {i + 1} — Inducement Swept
                </span>
                <div style={{
                  width: '14px', height: '14px', flexShrink: 0, borderRadius: '2px',
                  border: `1.5px solid ${isDone ? 'var(--phase-accent)' : 'var(--border-strong)'}`,
                  background: isDone ? 'var(--phase-accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isDone && <span style={{ fontSize: '8px', color: 'white', fontWeight: 900 }}>✓</span>}
                </div>
              </div>
            );
          })}

          {/* Objective row — unlocks only after all pools swept */}
          <div
            onClick={() => allSwept && !isLocked && setObjectiveSweep(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '11px 14px',
              background: objectiveSweep ? 'rgba(253, 224, 71, 0.07)' : 'transparent',
              borderTop: '1px solid var(--border-strong)',
              cursor: allSwept && !isLocked ? 'pointer' : 'default',
              opacity: !allSwept ? 0.3 : 1,
              transition: 'background 120ms, opacity 150ms',
            }}
          >
            <div style={{
              width: '24px', height: '24px', flexShrink: 0, borderRadius: '3px',
              background: objectiveSweep ? '#854d0e' : 'var(--surface-2)',
              border: `1.5px solid ${objectiveSweep ? '#fde047' : 'var(--border-strong)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '11px', lineHeight: 1 }}>★</span>
            </div>
            <div style={{ flex: 1 }}>
              <span style={{
                ...MONO, fontSize: '12px', fontWeight: 600,
                color: objectiveSweep ? 'var(--text-3)' : 'var(--text-1)',
                textDecoration: objectiveSweep ? 'line-through' : 'none',
                textDecorationColor: 'var(--text-4)',
              }}>
                Objective — External Wall Swept
              </span>
              {!allSwept && (
                <span style={{ ...MONO, display: 'block', fontSize: '9px', color: 'var(--text-4)', marginTop: '2px', fontStyle: 'italic' }}>
                  Confirm all pools before unlocking
                </span>
              )}
            </div>
            <div style={{
              width: '14px', height: '14px', flexShrink: 0, borderRadius: '2px',
              border: `1.5px solid ${objectiveSweep ? '#fde047' : 'var(--border-strong)'}`,
              background: objectiveSweep ? '#854d0e' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {objectiveSweep && <span style={{ fontSize: '8px', color: '#fde047', fontWeight: 900 }}>✓</span>}
            </div>
          </div>
        </div>
      )}

      {/* Status line */}
      {status && (
        <p style={{ ...MONO, fontSize: '11px', color: statusColor, lineHeight: 1.65, margin: '0 0 2px 0', fontStyle: 'italic' }}>
          {status === 'COMPLETE'     && 'All Inducement Pools swept in sequence before the Objective. Aakash confirmed — proceed to entry.'}
          {status === 'AWAITING'     && `All ${poolCount} pools confirmed swept. Watching for the Objective sweep — do not enter yet.`}
          {status === 'IN PROGRESS'  && `${sweptCount}/${poolCount} pools swept. Sequence still developing — do not enter prematurely.`}
          {status === 'INCOMPLETE'   && 'No pools confirmed. Aakash is not yet valid.'}
        </p>
      )}
    </div>
  );
}

// ─── Entry Protocol ───────────────────────────────────────────────────────────

const ENTRY_COLOUR = {
  Primary:     { bg: '#1a4535', label: '#86efac' },
  Alternative: { bg: '#1a2f52', label: '#93c5fd' },
  Aggressive:  { bg: '#4a2c0a', label: '#fcd34d' },
} as const;

function EntrySection({ weapon }: { weapon: Weapon }) {
  const entries: Array<{ key: 'Primary' | 'Alternative' | 'Aggressive'; desc?: string }> = [
    { key: 'Primary',     desc: weapon.entryPrimary     },
    { key: 'Alternative', desc: weapon.entryAlternative },
    { key: 'Aggressive',  desc: weapon.entryAggressive  },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {entries.map(({ key, desc }) => {
          const col = ENTRY_COLOUR[key];
          return (
            <div key={key} style={{
              padding: '14px 16px', minHeight: '80px',
              background: col.bg, borderRadius: 0,
              display: 'flex', flexDirection: 'column', gap: '8px',
            }}>
              <span style={{ ...MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: col.label }}>
                {key}
              </span>
              {desc && (
                <span style={{ ...MONO, fontSize: '12px', color: '#ffffff', lineHeight: 1.7 }}>{desc}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bottom row — Stop / Targets / Misfire ────────────────────────────────────

function BottomRow({ stop, targetPrimary, targetSecondary, misfireList, misfire }: {
  stop?: string;
  targetPrimary?: string;
  targetSecondary?: string;
  misfireList?: string[];
  misfire?: string;
}) {
  const misfires = misfireList?.length ? misfireList : misfire ? [misfire] : [];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>

      {/* Stop Loss */}
      <div style={{ padding: '14px 16px', minHeight: '80px', background: '#4a1515', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ ...MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#fca5a5' }}>Stop Loss</span>
        <span style={{ ...MONO, fontSize: '12px', color: '#ffffff', lineHeight: 1.7 }}>{stop || '—'}</span>
      </div>

      {/* Targets */}
      <div style={{ padding: '14px 16px', minHeight: '80px', background: '#0f3540', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ ...MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#67e8f9' }}>Targets</span>
        {targetPrimary && (
          <div>
            <span style={{ ...MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#67e8f9', opacity: 0.65, display: 'block', marginBottom: '3px' }}>Primary</span>
            <span style={{ ...MONO, fontSize: '12px', color: '#ffffff', lineHeight: 1.7 }}>{targetPrimary}</span>
          </div>
        )}
        {targetSecondary && (
          <div>
            <span style={{ ...MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#67e8f9', opacity: 0.65, display: 'block', marginBottom: '3px' }}>Secondary</span>
            <span style={{ ...MONO, fontSize: '12px', color: '#ffffff', lineHeight: 1.7 }}>{targetSecondary}</span>
          </div>
        )}
      </div>

      {/* Misfire */}
      <div style={{ padding: '14px 16px', minHeight: '80px', background: '#4a2010', borderRadius: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span style={{ ...MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#fdba74' }}>⚠ Misfire</span>
        {misfires.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <span style={{ ...MONO, fontSize: '11px', color: '#fdba74', flexShrink: 0, marginTop: '2px' }}>—</span>
            <span style={{ ...MONO, fontSize: '12px', color: '#ffffff', lineHeight: 1.65 }}>{m}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ─── Static data ──────────────────────────────────────────────────────────────

const MANUAL_WEAPON: Weapon = {
  id: 'MANUAL',
  name: 'Custom Override',
  logic: 'Operator manual entry. All parameters defined by ground command.',
  activation: 'Manual trigger on tactical confirmation.',
};

// ─── Main export ──────────────────────────────────────────────────────────────

export default function Phase9WeaponArmory() {
  const {
    SYSTEM_DATA, selectedWeaponId, setSelectedWeaponId,
    weaponLocked, setWeaponLocked,
    finalCommand,
    notes, setNotes,
    confirmStep, editStep,
    stepTimestamps,
    weaponPrediction,
  } = useNetra();

  const type         = (finalCommand || 'STRIKE').toLowerCase();
  const weaponsList  = (SYSTEM_DATA.weapons?.[type] || []) as Weapon[];
  const allChoices   = [...weaponsList, MANUAL_WEAPON];
  const activeWeapon = allChoices.find(w => w.id === selectedWeaponId);

  const [execMarks, setExecMarks] = useState<Record<number, boolean>>({});
  const [weaponDims, setWeaponDims] = useState<Record<string, string>>({});

  const handleWeaponSelect = (id: string) => {
    if (weaponLocked) return;
    setSelectedWeaponId(id);
    setExecMarks({});
    setWeaponDims({});
  };

  const marks    = activeWeapon?.executionMarks   || [];
  const wDims    = activeWeapon?.weaponDimensions || [];
  const isManual = activeWeapon?.id === 'MANUAL';

  return (
    <div className="flex flex-col fade-up phase-theme-5">

      {/* ── Weapon selector ── */}
      <div style={{ marginBottom: '4px' }}>
        <div style={{ marginBottom: '8px', paddingLeft: '2px' }}>
          <span style={{ ...MONO, fontSize: '9px', fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Weapon Selection
          </span>
        </div>
        <div className="precision-selector" style={{ flexWrap: 'wrap' }}>
          {allChoices.map(w => {
            const isRec = weaponPrediction?.weapon === w.id;
            const sel   = selectedWeaponId === w.id;
            return (
              <button
                key={w.id}
                onClick={() => handleWeaponSelect(w.id)}
                disabled={weaponLocked}
                className={`precision-opt relative ${sel ? 'selected' : ''} ${weaponLocked && !sel ? 'opacity-30 cursor-not-allowed' : ''}`}
                style={{ minWidth: '86px', height: '32px', letterSpacing: '0.08em' }}
              >
                {w.id}
                {isRec && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--phase-accent)] shadow-[0_0_6px_var(--phase-accent)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Dossier ── */}
      {!activeWeapon ? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '48px 0', gap: '12px', opacity: 0.22,
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span style={{ ...MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
            Select Weapon to Load Dossier
          </span>
        </div>
      ) : isManual ? (
        <div style={{
          marginTop: '20px', padding: '16px',
          background: 'var(--surface-2)', borderRadius: '4px',
          color: 'var(--text-3)', fontSize: '13px',
        }}>
          Manual override — set all parameters in Trading Data.
        </div>
      ) : (
        <>
          {/* Identity */}
          <div style={{ marginTop: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
              <span style={{ ...MONO, fontSize: '18px', fontWeight: 900, color: 'var(--phase-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {activeWeapon.name}
              </span>
              {activeWeapon.type && (
                <span style={{ ...MONO, fontSize: '10px', fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                  {activeWeapon.type}
                </span>
              )}
            </div>
            <p style={{ ...MONO, fontSize: '14px', color: 'var(--text-1)', lineHeight: 1.8, margin: 0 }}>
              {activeWeapon.logic}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', marginTop: '28px' }}>

            {marks.length > 0 && (
              <ExecMapSection
                marks={marks}
                checked={execMarks}
                toggle={i => setExecMarks(m => ({ ...m, [i]: !m[i] }))}
                isLocked={weaponLocked}
              />
            )}

            {activeWeapon.id === 'AAKASH' && (
              <InducementPoolTracker isLocked={weaponLocked} />
            )}

            {wDims.length > 0 && (
              <WeaponDimSection
                dims={wDims}
                values={weaponDims}
                onSelect={(id, v) => setWeaponDims(d => ({ ...d, [id]: v }))}
                isLocked={weaponLocked}
              />
            )}

            <div style={{ borderTop: '1px solid var(--border-strong)' }} />

            <EntrySection weapon={activeWeapon} />

            <BottomRow
              stop={activeWeapon.stop}
              targetPrimary={activeWeapon.targetPrimary}
              targetSecondary={activeWeapon.targetSecondary}
              misfireList={activeWeapon.misfireList}
              misfire={activeWeapon.misfire}
            />

          </div>
        </>
      )}

      {/* ── Notes + Actions ── */}
      <div className="flex gap-4 items-start pt-4 mt-4 border-t border-[var(--border-strong)]">
        <textarea
          value={notes.weapon_thought || ''}
          onChange={e => setNotes({ ...notes, weapon_thought: e.target.value })}
          placeholder="Record tactical reasoning for weapon selection and entry confirmation..."
          disabled={weaponLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[13px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={() => { setWeaponLocked(false); editStep(5); }} className="btn-edit w-20" disabled={!weaponLocked}>Edit</button>
          <button
            onClick={() => { setWeaponLocked(true); confirmStep(5); }}
            className={`${weaponLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={weaponLocked}
          >
            {weaponLocked ? '✓ Weapon Armed' : 'Confirm Weapon'}
          </button>
        </div>
      </div>
      {stepTimestamps.weapon_armory && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] mt-1">
          Armed: {stepTimestamps.weapon_armory}
        </div>
      )}

    </div>
  );
}
