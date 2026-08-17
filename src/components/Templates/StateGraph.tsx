// Subway-style graph of the recognised NETRA state and its forward transitions (annotated with path stats).

import { useMemo } from 'react';

// ─── Types (loose — backend-driven) ─────────────────────────────────────────

export interface RecognizedState {
  state_id?: string;
  state_name?: string;
  mode?: string;
  command?: string | null;
  posture?: string | null;
  status?: string;
  description?: string;
  meaning?: string;
  definition?: string;
  doctrine_purpose?: string[];
  recognition_logic?: string[];
}

export interface EdgeStats {
  count?: number;
  avg_r?: number | null;
  win_rate?: number | null;
}

export interface TransitionBranch {
  condition?: string;
  action?: string;
  target_state?: string | null;
  target_name?: string | null;
  target_command?: string | null;
  target_posture?: string | null;
  cycle?: boolean;
  stats?: EdgeStats | null;
  children?: TransitionBranch[];
}

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, Consolas, monospace' };

const WEAPON_NAME_MAP: Record<string, string> = {
  // STRIKE
  'NS-03-CS01': 'Astra',
  'NS-03-CS02': 'BrahMos',
  'NS-03-CS03': 'Agni',
  'NS-03-CS04': 'Nirbhay',
  'NS-03-CS05': 'Akash',
  'NS-03-CS06': 'Pralay',
  // INTERCEPTION
  'NS-04-CS01': 'Rafale',
  'NS-04-CS02': 'Su-30 MKI',
  'NS-04-CS03': 'Tejas',
  'NS-04-CS04': 'Mirage-2000',
  'NS-04-CS05': 'MiG-29',
  // SATURATION
  'NS-02-CS01': 'HAL Dhruv',
  'NS-02-CS02': 'HAL Rudra',
  'NS-02-CS03': 'HAL Prachand',
  'NS-02-CS04': 'HAL Cheetah',
  // NO ENGAGEMENT
  'NS-01-CS01': 'Info Void',
  'NS-01-CS02': 'Liq Trap',
  'NS-01-CS03': 'Collapse',
  'NS-01-CS04': 'Constraint',
  'NS-01-CS05': 'Transition',
};

// ─── Colour ──────────────────────────────────────────────────────────────────

// The tactical command (STRIKE / INTERCEPTION / SATURATION / WATCH / NO_ENGAGEMENT)
// — lives in `command` after the states.json routing swap. Drives node/track colour.
function tacticalHex(v?: string | null): string {
  switch ((v || '').toUpperCase()) {
    case 'STRIKE':        return '#ffd700';
    case 'INTERCEPTION':  return '#38bdf8';
    case 'SATURATION':    return '#f97316';
    case 'WATCH':         return '#a78bfa';
    case 'NO_ENGAGEMENT': return '#ef4444';
    default:              return '#64748b';
  }
}
// The engagement posture (ENGAGE / STAND_DOWN / NO_ENGAGEMENT) — lives in `posture`.
function engageHex(v?: string | null): string {
  return v === 'ENGAGE' ? '#22c55e' : v ? '#ef4444' : '#94a3b8';
}

function StateMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="state-hypothesis-metric">
      <span>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  );
}

function StateDetailRows({ title, items }: { title: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <section className="state-hypothesis-detail-section">
      <header>
        <span>{title}</span>
        <small>{String(items.length).padStart(2, '0')}</small>
      </header>
      <div className="state-hypothesis-detail-rows">
        {items.map((item, index) => (
          <div className="state-hypothesis-detail-row" key={`${title}-${index}`}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <p>{item}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Recognized-state hero card (properties) ─────────────────────────────────

function StateHero({ state, label }: { state: RecognizedState; label?: string }) {
  const accent = tacticalHex(state.command);
  const definition = state.definition || state.meaning || state.description;

  return (
    <section
      className="state-hypothesis-card"
      style={{ '--state-accent': accent } as React.CSSProperties}
      aria-label={`Selected market pulse hypothesis ${state.state_id || ''}`}
    >
      <header className="state-hypothesis-header">
        <div className="state-hypothesis-heading">
          <span className="state-hypothesis-eyebrow">{label || 'Market Pulse Hypothesis'}</span>
          <div className="state-hypothesis-identity">
            <strong>{state.state_id || 'NS —'}</strong>
            <div>
              <h3>{state.state_name || 'Unnamed hypothesis'}</h3>
              {state.mode && <span>{state.mode}</span>}
            </div>
          </div>
        </div>
        <span className="state-hypothesis-selected">Selected</span>
      </header>

      <div className="state-hypothesis-metrics">
        <StateMetric label="Command" value={(state.command || '—').replace(/_/g, ' ')} color={accent} />
        <StateMetric label="Posture" value={(state.posture || '—').replace(/_/g, ' ')} color={engageHex(state.posture)} />
        {state.status && (
          <StateMetric label="Status" value={state.status.replace(/_/g, ' ')} color={state.status === 'OK' ? '#86efac' : '#fbbf24'} />
        )}
      </div>

      {definition && (
        <div className="state-hypothesis-definition">
          <span>Hypothesis</span>
          <p>{definition}</p>
        </div>
      )}

      <div className="state-hypothesis-details">
        <StateDetailRows title="Doctrine Purpose" items={state.doctrine_purpose} />
        <StateDetailRows title="Recognition Logic" items={state.recognition_logic} />
      </div>
    </section>
  );
}

// ─── Subway / track map ──────────────────────────────────────────────────────

interface GNode {
  id: string; name: string; posture?: string | null; command?: string | null;
  condition?: string; isRoot?: boolean; isTerminal?: boolean; cycle?: boolean;
  stats?: EdgeStats | null; children: GNode[]; x: number; y: number;
}

const NODE_W = 172;
const NODE_H = 48;
const ROW_H  = 92;    // leaf row pitch — taller = more breathing room
const PAD    = 26;
const V_GAP  = 36;    // vertical drop from the state down to its command node
const CMD_W  = 152;
const CMD_H  = 44;

function toNode(b: TransitionBranch): GNode {
  return {
    id: b.target_state || (b.action || 'END'),
    name: b.target_name || (b.action ? '' : ''),
    posture: b.target_posture,
    command: b.target_command,
    condition: b.condition,
    isTerminal: !b.target_state,
    cycle: b.cycle,
    stats: b.stats,
    children: (b.children || []).map(toNode),
    x: 0, y: 0,
  };
}

function SubwayMap({ state, transitions }: { state: RecognizedState; transitions: TransitionBranch[] }) {
  const { nodes, edges, cmd, width, height } = useMemo(() => {
    const root: GNode = {
      id: state.state_id || '—', name: state.state_name || '', posture: state.posture,
      command: state.command, isRoot: true, children: transitions.map(toNode), x: 0, y: 0,
    };

    // Flexible column pitch: the widest edge label decides the horizontal gap,
    // so the FULL condition text always sits cleanly between a node and its
    // children (no truncation, no overlap).
    const CHAR_W = 6.7, PILL_PAD = 14, CLEAR = 56;
    let maxLabelPx = 0;
    const scanLabels = (n: GNode) => n.children.forEach(c => {
      if (c.condition) maxLabelPx = Math.max(maxLabelPx, c.condition.length * CHAR_W + PILL_PAD);
      scanLabels(c);
    });
    scanLabels(root);
    const colW = Math.max(300, NODE_W + maxLabelPx + CLEAR);

    // Layered left→right layout; leaves stacked, parents centered on children.
    let leaf = 0;
    const assign = (n: GNode, depth: number) => {
      n.x = PAD + depth * colW;
      if (!n.children.length) {
        n.y = PAD + leaf * ROW_H;
        leaf += 1;
      } else {
        n.children.forEach(c => assign(c, depth + 1));
        const ys = n.children.map(c => c.y);
        n.y = (Math.min(...ys) + Math.max(...ys)) / 2;
      }
    };
    assign(root, 0);

    const ns: GNode[] = [];
    const es: { from: GNode; to: GNode }[] = [];
    let maxDepth = 0;
    const walk = (n: GNode, depth: number) => {
      ns.push(n);
      maxDepth = Math.max(maxDepth, depth);
      n.children.forEach(c => { es.push({ from: n, to: c }); walk(c, depth + 1); });
    };
    walk(root, 0);

    // The command hangs vertically below the recognised state (STATE │ COMMAND).
    const cmdValue = state.command || state.posture || null;
    const cmd = cmdValue ? {
      x: root.x + (NODE_W - CMD_W) / 2,
      y: root.y + NODE_H + V_GAP,
      cx: root.x + NODE_W / 2,
      top: root.y + NODE_H,
      value: String(cmdValue).replace(/_/g, ' '),
      color: tacticalHex(state.command),
    } : null;

    const baseH = PAD * 2 + Math.max(leaf, 1) * ROW_H;
    return {
      nodes: ns,
      edges: es,
      cmd,
      width: PAD + (maxDepth + 1) * colW,
      height: Math.max(baseH, cmd ? cmd.y + CMD_H + PAD : 0),
    };
  }, [state, transitions]);

  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '6px' }}>
      <svg width={width} height={height} style={{ display: 'block', minWidth: '100%' }}>
        {/* ── tracks ── */}
        {edges.map((e, i) => {
          const color = e.to.isTerminal ? '#475569' : tacticalHex(e.to.command);
          const x1 = e.from.x + NODE_W, y1 = e.from.y + NODE_H / 2;
          const x2 = e.to.x,            y2 = e.to.y + NODE_H / 2;
          const mx = (x1 + x2) / 2;
          const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
          const cond = e.to.condition;   // full text — the column pitch flexes to fit it
          const ly = (y1 + y2) / 2;
          const pillW = cond ? cond.length * 6.7 + 14 : 0;
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round"
                    opacity={e.to.cycle ? 0.4 : 0.85} strokeDasharray={e.to.cycle ? '4 4' : undefined} />
              {cond && (
                <>
                  <rect x={mx - pillW / 2} y={ly - 19} width={pillW} height={18} rx={4}
                        fill="rgba(3,6,8,0.94)" stroke={`${color}66`} strokeWidth={1} />
                  <text x={mx} y={ly - 6} textAnchor="middle"
                        style={{ ...MONO, fontSize: '11px', fontWeight: 700, fill: '#ffffff' }}>
                    {cond}
                  </text>
                </>
              )}
              {e.to.stats && e.to.stats.count ? (
                <text x={mx} y={ly + 15} textAnchor="middle"
                      style={{ ...MONO, fontSize: '9px', fontWeight: 700,
                               fill: (e.to.stats.avg_r ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {e.to.stats.count}× · {e.to.stats.win_rate}% · {(e.to.stats.avg_r ?? 0) >= 0 ? '+' : ''}{e.to.stats.avg_r}R
                </text>
              ) : null}
            </g>
          );
        })}

        {/* ── vertical command (STATE │ COMMAND) ── */}
        {cmd && (
          <g>
            <line x1={cmd.cx} y1={cmd.top} x2={cmd.cx} y2={cmd.y}
                  stroke={cmd.color} strokeWidth={2.5} strokeLinecap="round" />
            <rect x={cmd.x} y={cmd.y} width={CMD_W} height={CMD_H} rx={5}
                  fill={`${cmd.color}1f`} stroke={cmd.color} strokeWidth={1.5} />
            <text x={cmd.x + CMD_W / 2} y={cmd.y + 16} textAnchor="middle"
                  style={{ ...MONO, fontSize: '7px', fontWeight: 700, letterSpacing: '0.24em', fill: 'rgba(255,255,255,0.55)' }}>
              COMMAND
            </text>
            <text x={cmd.x + CMD_W / 2} y={cmd.y + 33} textAnchor="middle"
                  style={{ ...MONO, fontSize: '13px', fontWeight: 900, fill: cmd.color }}>
              {cmd.value}
            </text>
          </g>
        )}

        {/* ── stations ── */}
        {nodes.map((n, i) => {
          const color = n.isTerminal ? '#64748b' : tacticalHex(n.command);
          return (
            <g key={i}>
              <rect x={n.x} y={n.y} width={NODE_W} height={NODE_H} rx={5}
                    fill={n.isRoot ? `${color}26` : `${color}14`}
                    stroke={color} strokeWidth={n.isRoot ? 2 : 1}
                    strokeDasharray={n.cycle ? '4 3' : undefined} opacity={n.cycle ? 0.65 : 1} />
              {/* station dot on the left edge */}
              <circle cx={n.x} cy={n.y + NODE_H / 2} r={4} fill={color} stroke="#030608" strokeWidth={1.5} />
              {n.isTerminal ? (
                <text x={n.x + 14} y={n.y + NODE_H / 2 + 3.5} style={{ ...MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.14em', fill: color }}>
                  {n.id.toUpperCase()}
                </text>
              ) : (
                <>
                  <text x={n.x + 14} y={n.y + 14} style={{ ...MONO, fontSize: '11px', fontWeight: 900, fill: color }}>
                    {(WEAPON_NAME_MAP[n.id] || n.id)}{n.cycle ? ' ↺' : ''}
                  </text>
                  <text x={n.x + 14} y={n.y + 26} style={{ ...MONO, fontSize: '7.5px', fontWeight: 700, fill: '#e8eaed' }}>
                    {(n.name || '').length > 18 ? `${n.name.slice(0, 17)}…` : n.name}
                  </text>
                  {n.posture && (
                    <text x={n.x + NODE_W - 8} y={n.y + NODE_H / 2 + 3} textAnchor="end"
                          style={{ ...MONO, fontSize: '7px', fontWeight: 800, fill: engageHex(n.posture) }}>
                      {n.posture === 'ENGAGE' ? '▲' : '■'}
                    </text>
                  )}
                </>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Public component ────────────────────────────────────────────────────────

// StateGraph: P6 card — shows the recognised MASTER COMMAND hero only.
// The forward-path subway map has moved to P7 (below the weapon box).
export default function StateGraph({ state, label }: {
  state: RecognizedState;
  label?: string;
  transitions?: TransitionBranch[]; // kept in signature for backward-compat but not rendered here
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <StateHero state={state} label={label} />
    </div>
  );
}

// ─── ForwardPathMap — rendered in P7 below the weapon box ────────────────────
// Exported so Phase6Command can embed it after child-state selection.
export function ForwardPathMap({
  state,
  transitions,
}: {
  state: RecognizedState;
  transitions: TransitionBranch[];
}) {
  if (!transitions?.length) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
          Command Transition Map
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ ...MONO, fontSize: '7px', color: 'rgba(255,255,255,0.3)' }}>▲ engage · ■ stand-down · colour = command</span>
      </div>
      <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)', padding: '8px' }}>
        <SubwayMap state={state} transitions={transitions} />
      </div>
    </div>
  );
}
