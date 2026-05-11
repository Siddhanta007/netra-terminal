import { useState, useEffect, useCallback } from 'react';
import { useNetra } from '../../context/NetraContext';
import { API_BASE } from '../../utils/constants';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DecisionNode {
  predisposition:    'BULLISH' | 'BEARISH' | 'NEUTRAL';
  fact?:             string;
  combination_logic?: string[];
  critical_rules?:   string[];
}

// ─── Static doctrine fallbacks (shown when backend returns old format) ────────

const COMBO_LOGIC: string[] = [
  'Real Bias does not use a decision tree. It uses a majority vote across all four dimensions.',
  'Each dimension casts one vote — Bullish, Bearish, or Neutral. Count the votes.',
  'BULLISH PREDISPOSITION → Majority of dimensions point Bullish.',
  'BEARISH PREDISPOSITION → Majority of dimensions point Bearish.',
  'NEUTRAL PREDISPOSITION → Dimensions are split with no clear majority, or three or more dimensions return Neutral.',
];

const CRITICAL_RULES: string[] = [
  'Rule 1 — Lock and do not revisit. Real Bias is set before open and does not change during the session. If the market moves against the predisposition — that is information for Market Pulse and Liquidity Context to process. Real Bias does not update.',
  'Rule 2 — Predisposition is not a trade signal. A Bullish predisposition does not mean buy at open. It means the pre-market facts favour upward movement. Every downstream tool still needs to confirm before a command is issued.',
  'Rule 3 — Gap and Weekly boundaries transfer automatically. Any gap identified in Dimension 1 and any weekly boundary identified in Dimension 4 are automatically marked as Tier 1 liquidity walls in Liquidity Context. No re-analysis needed.',
  'Rule 4 — Neutral is a valid predisposition. It does not mean do not trade today. It means the pre-market facts offer no directional edge. Setups in either direction carry equal weight.',
];

// ─── Predisposition colours ───────────────────────────────────────────────────

const C = {
  BULLISH: { accent: '#00e5a0', border: 'rgba(0,229,160,0.38)', bg: 'rgba(0,229,160,0.07)', glow: 'rgba(0,229,160,0.14)' },
  BEARISH: { accent: '#ff4d4d', border: 'rgba(255,77,77,0.38)',  bg: 'rgba(255,77,77,0.07)',  glow: 'rgba(255,77,77,0.14)'  },
  NEUTRAL: { accent: '#f5c842', border: 'rgba(245,200,66,0.38)', bg: 'rgba(245,200,66,0.07)', glow: 'rgba(245,200,66,0.14)' },
};

// ─── Expandable doctrine section ──────────────────────────────────────────────

function DocSection({ label, items, accent }: { label: string; items: string[]; accent: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          padding: '6px 14px',
          border: `1px solid ${accent}55`,
          background: open ? `${accent}14` : 'transparent',
          color: '#ffffff',
          cursor: 'pointer',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          transition: 'all 140ms',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ color: accent, fontSize: '8px' }}>{open ? '▼' : '▶'}</span>
        {label}
      </button>

      {open && (
        <div style={{
          marginTop: '8px',
          borderLeft: `2px solid ${accent}55`,
          paddingLeft: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: '8px',
                color: accent, opacity: 0.6, flexShrink: 0, marginTop: '2px', fontWeight: 700,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#dde6f0', lineHeight: 1.7 }}>
                {item}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Doctrine tree panel (mounted only when visible) ─────────────────────────

function DoctrineTreeInline({
  rb, dims,
}: {
  rb: Record<string, string>;
  dims: Array<{ id: string; name: string }>;
}) {
  const [node, setNode]       = useState<DecisionNode | null>(null);
  const [loading, setLoading] = useState(false);

  const allSelected = dims.length > 0 && dims.every(d => !!rb[d.id]);
  const rbKey = JSON.stringify(rb);

  const fetchNode = useCallback(() => {
    if (!allSelected) { setNode(null); return; }
    setLoading(true);
    fetch(`${API_BASE}/api/decision/real-bias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: rbKey,
    })
      .then(r => r.json())
      .then((d: DecisionNode) => setNode(d))
      .catch(() => setNode(null))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rbKey, allSelected]);

  useEffect(() => { fetchNode(); }, [fetchNode]);

  const pred      = (node?.predisposition && C[node.predisposition]) ? node.predisposition : 'NEUTRAL';
  const col       = node ? C[pred] : null;
  const lineColor = col ? col.border : 'rgba(255,255,255,0.08)';
  const centers   = [125, 375, 625, 875];

  const fact       = node?.fact ?? '';
  const comboLogic = (node?.combination_logic?.length ?? 0) > 0 ? node!.combination_logic! : COMBO_LOGIC;
  const critRules  = (node?.critical_rules?.length    ?? 0) > 0 ? node!.critical_rules!    : CRITICAL_RULES;

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.07)',
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: '28px 28px',
      padding: '20px',
    }}>

      {/* Dimension label row */}
      <div style={{ display: 'flex', marginBottom: '8px' }}>
        {dims.map((d, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '7px', fontWeight: 700,
            color: '#4a6070', letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            {d.name}
          </div>
        ))}
      </div>

      {/* Input boxes */}
      <div style={{ display: 'flex' }}>
        {dims.map((d, i) => {
          const val = rb[d.id];
          return (
            <div key={i} style={{
              flex: 1,
              border: `1px solid ${val ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
              padding: '9px 10px',
              textAlign: 'center',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '9px',
              fontWeight: val ? 600 : 400,
              color: val ? '#ffffff' : '#3a4f60',
              marginRight: i < 3 ? '-1px' : 0,
              background: val ? 'rgba(255,255,255,0.04)' : 'transparent',
              minHeight: '36px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {val || '—'}
            </div>
          );
        })}
      </div>

      {/* Converging lines */}
      <svg width="100%" height="64" viewBox="0 0 1000 64" preserveAspectRatio="none" style={{ display: 'block' }}>
        {centers.map((cx, i) => (
          <path key={i} d={`M ${cx} 0 C ${cx} 42 500 34 500 58`}
            fill="none" stroke={lineColor} strokeWidth="1.5" />
        ))}
        <polygon points="494,55 500,64 506,55" fill={col ? col.border : 'rgba(255,255,255,0.08)'} />
      </svg>

      {/* Verdict + fact */}
      {loading ? (
        <div style={{ textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', color: '#4a6070', padding: '14px 0', letterSpacing: '0.14em' }}>
          COMPUTING...
        </div>
      ) : node && col ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            border: `1px solid ${col.border}`,
            background: col.bg,
            boxShadow: `0 0 28px ${col.glow}`,
            padding: '14px 20px',
            textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '17px', fontWeight: 900,
            color: col.accent,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
          }}>
            {node.predisposition} PREDISPOSITION
          </div>
          {fact && (
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#ffffff', lineHeight: 1.75, margin: 0 }}>
              {fact}
            </p>
          )}
        </div>
      ) : (
        <div style={{ border: '1px solid rgba(255,255,255,0.06)', padding: '13px 20px', textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#4a6070' }}>
          Select all four dimensions to compute the decision node
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Phase1Bias() {
  const {
    SYSTEM_DATA, selections, setSelections,
    notes, setNotes,
    highestStep, confirmStep, doResetStep,
    stepTimestamps,
  } = useNetra();

  const [showTree, setShowTree] = useState(false);

  const dims        = SYSTEM_DATA.realBias?.dimensions || [];
  const rb          = (selections.realBias || {}) as Record<string, string>;
  const isLocked    = highestStep > 1;
  const allSelected = dims.length > 0 && dims.every(d => !!rb[d.id]);

  const hasSelections = Object.keys(rb).length > 0;

  const setRb = (key: string, val: string) => {
    if (isLocked) return;
    setSelections({ ...selections, realBias: { ...rb, [key]: val } });
  };

  const handleReset = () => {
    doResetStep(1);
    setShowTree(false);
  };

  return (
    <div className="flex flex-col fade-up phase-theme-1">

      {/* ── DIMENSIONS ── */}
      {dims.map((dim) => (
        <div key={dim.id} className="precision-row">
          <div className="precision-label">{dim.name}</div>
          <div className="precision-selector">
            {(dim.options || []).map(opt => {
              const isSelected = rb[dim.id] === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setRb(dim.id, opt)}
                  disabled={isLocked}
                  className={`precision-opt ${isSelected ? 'selected' : ''} ${isLocked && !isSelected ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* ── DOCTRINE TREE TOGGLE ROW ── */}
      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <button
          onClick={() => setShowTree(s => !s)}
          style={{
            padding: '7px 18px',
            border: `1px solid ${showTree ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.1)'}`,
            background: showTree ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: '#ffffff',
            cursor: 'pointer',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '9px',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            transition: 'all 140ms',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: '8px', opacity: 0.7 }}>{showTree ? '▼' : '▶'}</span>
          Doctrine Tree Analysis
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
          <DocSection label="Combination Logic" items={COMBO_LOGIC}    accent="rgba(255,255,255,0.5)" />
          <DocSection label="Critical Rules"    items={CRITICAL_RULES} accent="rgba(255,255,255,0.5)" />
        </div>
      </div>

      {/* ── DOCTRINE TREE PANEL (toggled) ── */}
      {showTree && (
        <div style={{ marginTop: '8px' }}>
          <DoctrineTreeInline rb={rb} dims={dims} />
        </div>
      )}

      {/* ── NOTES + ACTIONS ── */}
      <div className="flex gap-4 items-start pt-4 mt-2">
        <textarea
          value={notes.realBias || ''}
          onChange={e => setNotes({ ...notes, realBias: e.target.value })}
          placeholder="Pre-market notes — key levels, gap context, weekly context..."
          disabled={isLocked}
          className="flex-1 bg-transparent outline-none resize-none text-[12px] text-[var(--text-2)] placeholder:text-[var(--text-4)] leading-relaxed min-h-[56px]"
        />
        <div className="flex gap-2 shrink-0">
          <button onClick={handleReset} className="btn-reset w-24" disabled={!hasSelections && !isLocked}>Reset</button>
          <button
            onClick={() => confirmStep(1)}
            className={`${isLocked ? 'btn-confirmed' : 'btn-confirm'} w-40`}
            disabled={!(!isLocked && allSelected)}
          >
            {isLocked ? '✓ Confirmed' : 'Confirm Bias'}
          </button>
        </div>
      </div>

      {stepTimestamps.realBias && (
        <div className="text-right text-[9px] font-mono text-[var(--text-4)] opacity-40 mt-1">
          Locked: {stepTimestamps.realBias}
        </div>
      )}

    </div>
  );
}
