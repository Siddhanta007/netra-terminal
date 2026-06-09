// Subway-style graph of the recognised NETRA state and its forward transitions (annotated with path stats).

import { useState, useMemo } from 'react';

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
  triggering_conditions?: string[];
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

// ─── Colour ──────────────────────────────────────────────────────────────────

function postureHex(posture?: string | null): string {
  switch ((posture || '').toUpperCase()) {
    case 'STRIKE':        return '#ffd700';
    case 'INTERCEPTION':  return '#38bdf8';
    case 'SATURATION':    return '#f97316';
    case 'WATCH':         return '#a78bfa';
    case 'NO_ENGAGEMENT': return '#ef4444';
    default:              return '#64748b';
  }
}
function commandHex(command?: string | null): string {
  return command === 'ENGAGE' ? '#22c55e' : command ? '#ef4444' : '#94a3b8';
}

function Chip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', border: `1px solid ${color}40`, background: `${color}10`, padding: '4px 10px' }}>
      <span style={{ ...MONO, fontSize: '6.5px', fontWeight: 700, letterSpacing: '0.25em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ ...MONO, fontSize: '11px', fontWeight: 900, color, letterSpacing: '0.06em' }}>{value}</span>
    </div>
  );
}

// ─── Recognized-state hero card (properties) ─────────────────────────────────

function StateHero({ state }: { state: RecognizedState }) {
  const [open, setOpen] = useState(false);
  const accent = postureHex(state.posture);

  return (
    <div style={{
      position: 'relative', border: `1px solid ${accent}55`, borderLeft: `3px solid ${accent}`,
      background: `linear-gradient(135deg, ${accent}12 0%, rgba(0,0,0,0.25) 60%)`,
      padding: '16px 18px', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
        <span style={{ ...MONO, fontSize: '30px', fontWeight: 900, color: accent, lineHeight: 1, letterSpacing: '0.04em' }}>{state.state_id}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ ...MONO, fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>{state.state_name}</span>
          <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{state.mode}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
        <Chip label="COMMAND" value={state.command || '—'} color={commandHex(state.command)} />
        <Chip label="POSTURE" value={(state.posture || '—').replace(/_/g, ' ')} color={accent} />
        {state.status && <Chip label="STATUS" value={state.status.replace(/_/g, ' ')} color={state.status === 'OK' ? '#22c55e' : '#f59e0b'} />}
      </div>
      {state.meaning && <p style={{ ...MONO, fontSize: '11px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: '14px 0 0' }}>{state.meaning}</p>}
      {!!state.triggering_conditions?.length && (
        <div style={{ marginTop: '12px' }}>
          <button onClick={() => setOpen(v => !v)} style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            {open ? '▾' : '▸'} Triggering Conditions ({state.triggering_conditions.length})
          </button>
          {open && (
            <ul style={{ margin: '8px 0 0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {state.triggering_conditions.map((c, i) => <li key={i} style={{ ...MONO, fontSize: '10px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>{c}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
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
const COL_W  = 340;   // column pitch — wider so the state and its transitions sit further apart (room for the edge label)
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

    // Layered left→right layout; leaves stacked, parents centered on children.
    let leaf = 0;
    const assign = (n: GNode, depth: number) => {
      n.x = PAD + depth * COL_W;
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
      color: commandHex(state.command),
    } : null;

    const baseH = PAD * 2 + Math.max(leaf, 1) * ROW_H;
    return {
      nodes: ns,
      edges: es,
      cmd,
      width: PAD + (maxDepth + 1) * COL_W,
      height: Math.max(baseH, cmd ? cmd.y + CMD_H + PAD : 0),
    };
  }, [state, transitions]);

  return (
    <div style={{ overflowX: 'auto', overflowY: 'hidden', paddingBottom: '6px' }}>
      <svg width={width} height={height} style={{ display: 'block', minWidth: '100%' }}>
        {/* ── tracks ── */}
        {edges.map((e, i) => {
          const color = e.to.isTerminal ? '#475569' : postureHex(e.to.posture);
          const x1 = e.from.x + NODE_W, y1 = e.from.y + NODE_H / 2;
          const x2 = e.to.x,            y2 = e.to.y + NODE_H / 2;
          const mx = (x1 + x2) / 2;
          const d = `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`;
          const cond = (e.to.condition || '').length > 40 ? `${e.to.condition!.slice(0, 38)}…` : e.to.condition;
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
          const color = n.isTerminal ? '#64748b' : postureHex(n.posture);
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
                    {n.id}{n.cycle ? ' ↺' : ''}
                  </text>
                  <text x={n.x + 14} y={n.y + 26} style={{ ...MONO, fontSize: '7.5px', fontWeight: 700, fill: '#e8eaed' }}>
                    {(n.name || '').length > 18 ? `${n.name.slice(0, 17)}…` : n.name}
                  </text>
                  {n.command && (
                    <text x={n.x + NODE_W - 8} y={n.y + NODE_H / 2 + 3} textAnchor="end"
                          style={{ ...MONO, fontSize: '7px', fontWeight: 800, fill: commandHex(n.command) }}>
                      {n.command === 'ENGAGE' ? '▲' : n.command === 'NO_ENGAGEMENT' || n.command === 'STAND_DOWN' ? '■' : '●'}
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

export default function StateGraph({ state, transitions }: {
  state: RecognizedState;
  transitions: TransitionBranch[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <StateHero state={state} />

      {!!transitions?.length && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>
              Forward Path Map
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ ...MONO, fontSize: '7px', color: 'rgba(255,255,255,0.3)' }}>▲ engage · ■ stand-down · ● watch</span>
          </div>
          <div style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.25)', padding: '8px' }}>
            <SubwayMap state={state} transitions={transitions} />
          </div>
        </div>
      )}
    </div>
  );
}
