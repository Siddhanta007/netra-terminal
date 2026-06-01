import React, { useState } from 'react';
import { SessionMeta } from '../../types';

const LANE_W = 20;   // px per depth column
const ROW_H  = 38;   // px per row
const NODE_R = 4;    // circle radius
const LINE   = 'rgba(255,255,255,0.18)';

const CMD_COLOR: Record<string, string> = {
  STRIKE:        '#ffd700',
  INTERCEPTION:  '#38bdf8',
  SATURATION:    '#f97316',
  NO_ENGAGEMENT: '#ef4444',
};
const STATUS_COLOR: Record<string, string> = {
  active: '#00e5a0',
  open:   '#f59e0b',
  closed: '#6b7280',
};

// ─── Tree flattening ──────────────────────────────────────────────────────────

interface FlatNode {
  session: SessionMeta;
  depth: number;
  isLast: boolean;
  hasChildren: boolean;
  /** parentContinues[l] = true means the ancestor at depth l has more siblings
   *  after the current subtree, so we must draw a continuous vertical line at
   *  column l through this row. */
  parentContinues: boolean[];
  isOrphan: boolean;
}

function flatten(sessions: SessionMeta[]): FlatNode[] {
  const ids = new Set(sessions.map(s => s.id));
  const childMap = new Map<string | null, SessionMeta[]>();

  sessions.forEach(s => {
    // Treat node as root if its parent has been removed from registry
    const key = s.parentId !== null && ids.has(s.parentId) ? s.parentId : null;
    if (!childMap.has(key)) childMap.set(key, []);
    childMap.get(key)!.push(s);
  });

  const flat: FlatNode[] = [];

  function visit(session: SessionMeta, depth: number, pc: boolean[], orphan: boolean) {
    const siblings = childMap.get(
      session.parentId !== null && ids.has(session.parentId) ? session.parentId : null
    ) ?? [];
    const myIdx = siblings.findIndex(s => s.id === session.id);
    const isLast = myIdx < 0 || myIdx === siblings.length - 1;
    const children = childMap.get(session.id) ?? [];

    flat.push({
      session, depth, isLast, isOrphan: orphan,
      hasChildren: children.length > 0,
      parentContinues: pc,
    });

    children.forEach((child, i) =>
      visit(child, depth + 1, [...pc, i < children.length - 1], false)
    );
  }

  (childMap.get(null) ?? []).forEach(root => {
    const isOrphan = root.parentId !== null && !ids.has(root.parentId);
    visit(root, 0, [], isOrphan);
  });

  return flat;
}

// ─── Graph SVG cell ───────────────────────────────────────────────────────────

function GraphSvg({ node }: { node: FlatNode }) {
  const { depth, isLast, hasChildren, parentContinues, session, isOrphan } = node;
  const w   = (depth + 1) * LANE_W;
  const cx  = depth * LANE_W + LANE_W / 2;
  const mid = ROW_H / 2;
  const dotColor = STATUS_COLOR[session.status] ?? '#6b7280';
  const glow = session.status === 'active'
    ? `drop-shadow(0 0 5px ${dotColor})`
    : 'none';

  return (
    <svg
      width={w} height={ROW_H}
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      {/* ── Full-height vertical lines for continuing ancestors (levels 0..D-2) */}
      {parentContinues.slice(0, depth - 1).map((cont, l) =>
        cont ? (
          <line key={l}
            x1={l * LANE_W + LANE_W / 2} y1={0}
            x2={l * LANE_W + LANE_W / 2} y2={ROW_H}
            stroke={LINE} strokeWidth={1.5} strokeDasharray={isOrphan ? '3,3' : undefined}
          />
        ) : null
      )}

      {/* ── Parent connector elbow (level D-1), only for children */}
      {depth > 0 && (() => {
        const px = (depth - 1) * LANE_W + LANE_W / 2;
        return (
          <>
            {/* top half from above */}
            <line x1={px} y1={0} x2={px} y2={mid}
              stroke={LINE} strokeWidth={1.5} />
            {/* horizontal elbow */}
            <line x1={px} y1={mid} x2={cx - NODE_R} y2={mid}
              stroke={LINE} strokeWidth={1.5} />
            {/* bottom half only if more siblings follow */}
            {!isLast && (
              <line x1={px} y1={mid} x2={px} y2={ROW_H}
                stroke={LINE} strokeWidth={1.5} />
            )}
            {/* fork-point label just above the elbow */}
            {session.forkPoint != null && (
              <text
                x={px + 4} y={mid - 4}
                fontSize="6" fill="rgba(255,255,255,0.35)"
                fontFamily="monospace" letterSpacing="0.05em"
              >
                P{session.forkPoint}
              </text>
            )}
          </>
        );
      })()}

      {/* ── Vertical line downward from circle (has children) */}
      {hasChildren && (
        <line x1={cx} y1={mid + NODE_R} x2={cx} y2={ROW_H}
          stroke={LINE} strokeWidth={1.5} />
      )}

      {/* ── The node circle */}
      <circle cx={cx} cy={mid} r={NODE_R} fill={dotColor}
        style={{ filter: glow }} />

      {/* outer ring pulse for active */}
      {session.status === 'active' && (
        <circle cx={cx} cy={mid} r={NODE_R + 2.5}
          fill="none" stroke={dotColor} strokeWidth={0.8} opacity={0.35} />
      )}
    </svg>
  );
}

// ─── Individual row ───────────────────────────────────────────────────────────

interface RowProps {
  node: FlatNode;
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

function SessionRow({ node, activeId, onSelect, onRemove }: RowProps) {
  const [hovered, setHovered] = useState(false);
  const { session } = node;
  const isActive = session.id === activeId;
  const cmdColor = session.command ? (CMD_COLOR[session.command] ?? '#ffffff') : 'rgba(255,255,255,0.25)';
  const pnlNum   = session.pnl ? parseFloat(session.pnl) : null;
  const pnlStr   = pnlNum != null && !isNaN(pnlNum)
    ? (pnlNum >= 0 ? '+₹' : '-₹') + Math.abs(pnlNum).toFixed(0)
    : null;
  const pnlColor = pnlNum != null && pnlNum >= 0 ? '#22c55e' : '#ef4444';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(session.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        height: ROW_H,
        cursor: 'pointer',
        background: isActive
          ? 'rgba(0,229,160,0.07)'
          : hovered
          ? 'rgba(255,255,255,0.03)'
          : 'transparent',
        borderLeft: isActive ? '2px solid #00e5a0' : '2px solid transparent',
        transition: 'background 120ms, border-color 120ms',
        paddingRight: '10px',
        gap: 0,
      }}
    >
      {/* Graph SVG */}
      <GraphSvg node={node} />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingLeft: '6px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
        {/* Row 1: name */}
        <div style={{
          fontSize: '10px',
          fontWeight: isActive ? 900 : 600,
          color: isActive ? '#ffffff' : hovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          letterSpacing: '0.04em',
        }}>
          {session.name}
        </div>

        {/* Row 2: command badge + weapon + fork tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          {session.command && (
            <span style={{
              fontSize: '7px', fontWeight: 900, letterSpacing: '0.15em',
              color: cmdColor, border: `1px solid ${cmdColor}35`,
              padding: '0 3px', lineHeight: '12px',
            }}>
              {session.command === 'INTERCEPTION' ? 'INTER' : session.command === 'NO_ENGAGEMENT' ? 'NO-ENG' : session.command}
            </span>
          )}
          {session.weapon && (
            <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
              {session.weapon}
            </span>
          )}
          {node.isOrphan && (
            <span style={{ fontSize: '7px', color: '#f59e0b', letterSpacing: '0.1em', opacity: 0.7 }}>
              orphaned
            </span>
          )}
        </div>
      </div>

      {/* Right: P&L + remove */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {pnlStr && (
          <span style={{ fontSize: '9px', fontWeight: 900, color: pnlColor, fontFamily: 'monospace' }}>
            {pnlStr}
          </span>
        )}
        {hovered && (
          <button
            onClick={e => { e.stopPropagation(); onRemove(session.id); }}
            title="Remove from tree (does not delete from DB)"
            style={{
              width: '16px', height: '16px', background: 'transparent',
              border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.3)', fontSize: '14px', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 0, transition: 'color 120ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.3)'; }}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────

interface SessionTreeProps {
  sessions: SessionMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
}

export default function SessionTree({ sessions, activeId, onSelect, onRemove }: SessionTreeProps) {
  const flat = flatten(sessions);

  if (flat.length === 0) {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase', lineHeight: 2 }}>
          No sessions yet.<br />Initialize a mission or<br />fork an existing session.
        </p>
      </div>
    );
  }

  // Track root groups to insert dividers between separate trees
  const rows: React.ReactNode[] = [];
  let lastDepth0Id: string | null = null;

  flat.forEach((node, i) => {
    const isNewRoot = node.depth === 0 && i > 0;
    if (isNewRoot) {
      rows.push(
        <div key={`sep-${i}`} style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
      );
    }
    rows.push(
      <SessionRow
        key={node.session.id}
        node={node}
        activeId={activeId}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    );
    if (node.depth === 0) lastDepth0Id = node.session.id;
  });

  void lastDepth0Id;

  return (
    <div style={{ paddingBottom: '12px' }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', padding: '8px 10px 10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {[
          { label: 'active', color: '#00e5a0' },
          { label: 'open',   color: '#f59e0b' },
          { label: 'closed', color: '#6b7280' },
        ].map(l => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: l.color }} />
            {l.label}
          </span>
        ))}
      </div>

      {rows}
    </div>
  );
}
