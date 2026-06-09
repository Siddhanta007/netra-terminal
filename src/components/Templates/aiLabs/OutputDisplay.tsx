// Renders the streamed agent output in the left pane of the AI Labs box:
// command badge + HUD metrics, execution plan, analysis body, and the
// collapsible reasoning / audit / agent-trace accordions.

import { useState, ReactNode } from 'react';
import { AIOutput } from '../../../types';
import { MONO, convictionHex, riskHex, cmdHex } from './helpers';

function CmdBadge({ label }: { label: string | undefined }) {
  if (!label) return null;
  const color = cmdHex(label);
  const display = label.replace(/_/g, ' ');
  return (
    <div style={{
      ...MONO,
      display: 'inline-flex', alignItems: 'center',
      borderLeft: `3px solid ${color}`,
      background: `${color}14`,
      padding: '5px 12px 5px 10px',
      fontSize: '10px', fontWeight: 900, letterSpacing: '0.22em',
      color, textTransform: 'uppercase',
      flexShrink: 0,
    }}>
      {display}
    </div>
  );
}

function HudCell({ label, value, color }: { label: string; value: string | undefined; color: string }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
      <span style={{ ...MONO, fontSize: '7px', fontWeight: 700, letterSpacing: '0.28em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ ...MONO, fontSize: '17px', fontWeight: 900, color, lineHeight: 1 }}>
        {value}
      </span>
    </div>
  );
}

function AccordionShell({ header, badge, badgeColor, children }: {
  header: string; badge?: string; badgeColor?: string; children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', background: 'rgba(255,255,255,0.02)', border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
            {header}
          </span>
          {badge && badgeColor && (
            <span style={{ ...MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: badgeColor }}>
              ▶ {badge}
            </span>
          )}
        </div>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.18)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function ThinkingAccordion({ thinking }: { thinking: string }) {
  if (!thinking) return null;
  return (
    <AccordionShell header="REASONING TRACE">
      <div style={{
        padding: '12px 14px', ...MONO, fontSize: '10px', color: 'rgba(255,255,255,0.72)',
        lineHeight: 1.75, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto',
      }}>
        {thinking}
      </div>
    </AccordionShell>
  );
}

function AuditAccordion({ review, label = 'Audit Notes' }: {
  review?: { status?: string; risk_status?: string; critique?: string; risk_critique?: string; suggested_cmd?: string; adjusted_plan?: string } | null;
  label?: string;
}) {
  if (!review) return null;
  const status   = review.status || review.risk_status;
  const critique = review.critique || review.risk_critique;
  const suggested = review.suggested_cmd || review.adjusted_plan;
  const statusColor = status === 'APPROVED' ? '#22c55e' : '#ef4444';
  return (
    <AccordionShell header={label.toUpperCase()} badge={status} badgeColor={status ? statusColor : undefined}>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {critique && (
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.92)', lineHeight: 1.65, margin: 0 }}>
            {critique}
          </p>
        )}
        {suggested && (
          <div style={{ borderLeft: '2px solid rgba(255,255,255,0.15)', paddingLeft: '10px', fontSize: '10px', color: 'rgba(255,255,255,0.78)', ...MONO }}>
            <span style={{ fontWeight: 700 }}>SUGGESTED · </span>{suggested}
          </div>
        )}
      </div>
    </AccordionShell>
  );
}

export function TraceDisplay({ trace }: { trace: Array<{ agent: string; content: string }> }) {
  if (!trace || trace.length === 0) return null;
  return (
    <AccordionShell header={`AGENT TRACE`} badge={`${trace.length} STEPS`} badgeColor="var(--accent)">
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '260px', overflowY: 'auto' }}>
        {trace.map((step, idx) => (
          <div key={idx} style={{ borderLeft: '2px solid rgba(255,255,255,0.08)', paddingLeft: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ ...MONO, fontSize: '9px', fontWeight: 900, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.1em' }}>
                {step.agent}
              </span>
              <span style={{ ...MONO, fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.2em' }}>
                STEP {idx + 1}
              </span>
            </div>
            <p style={{ ...MONO, fontSize: '10px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.65, whiteSpace: 'pre-wrap', margin: 0 }}>
              {Array.isArray(step.content) && (step.content as {type: string; text: string}[])[0]?.type === 'text'
                ? (step.content as {type: string; text: string}[])[0].text
                : typeof step.content === 'object'
                  ? JSON.stringify(step.content, null, 2)
                  : step.content}
            </p>
          </div>
        ))}
      </div>
    </AccordionShell>
  );
}

export function OutputDisplay({ output: rawOutput }: { output: unknown }) {
  if (typeof rawOutput === 'string') {
    return (
      <p style={{ ...MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>
        {rawOutput}
      </p>
    );
  }

  // Some agents (e.g. market_type_selector) return {data: {actual_fields}, agent_trace: [...]}
  // instead of a flat object. Detect and unwrap that pattern here.
  const raw = rawOutput as Record<string, unknown>;
  const nested = raw.data;
  const output = (nested && typeof nested === 'object' && !('status' in raw))
    ? {
        ...(nested as Record<string, unknown>),
        agent_trace: raw.agent_trace ?? (nested as Record<string, unknown>).agent_trace,
        thinking:    raw.thinking    ?? (nested as Record<string, unknown>).thinking ?? '',
      } as AIOutput & { agent_trace?: Array<{ agent: string; content: string }>; market_analysis?: string; market_type?: string; summary?: string }
    : raw as AIOutput & { agent_trace?: Array<{ agent: string; content: string }>; market_analysis?: string; market_type?: string; summary?: string };

  const mainText  = output.analysis || output.reasoning || output.description || output.synthesis || (output as Record<string, unknown>).market_analysis as string || (output as Record<string, unknown>).market_type as string || (output as Record<string, unknown>).summary as string || '';
  const command   = output.cmd || output.weapon || null;
  const plan      = output.plan || null;
  const conviction = (output.conviction || output.predictability || null) as string | null;
  const riskLevel  = (output.risk_level || null) as string | null;
  const thinking   = (output.thinking || '') as string;
  const riskAudit  = output.risk_audit as AIOutput['risk_audit'] | null;
  const agentTrace = output.agent_trace || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* ── Command + HUD metrics ── */}
      {(command || conviction || riskLevel) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {command && <CmdBadge label={command} />}
          <HudCell label="Conviction" value={conviction ?? undefined} color={convictionHex(conviction ?? undefined)} />
          <HudCell label="Risk"       value={riskLevel ?? undefined}  color={riskHex(riskLevel ?? undefined)} />
        </div>
      )}

      {/* ── Execution plan ── */}
      {plan && (
        <div style={{ borderLeft: '2px solid #4169E1', padding: '10px 14px', background: 'rgba(65,105,225,0.07)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ ...MONO, fontSize: '7px', fontWeight: 700, letterSpacing: '0.3em', color: '#6b8cff', textTransform: 'uppercase' }}>
            EXECUTION PLAN
          </span>
          <p style={{ ...MONO, fontSize: '11.5px', color: '#e8eaed', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
            {plan}
          </p>
        </div>
      )}

      {/* ── Main analysis body ── */}
      {mainText && (
        <p style={{ ...MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-wrap' }}>
          {mainText}
        </p>
      )}

      <ThinkingAccordion thinking={thinking} />
      <AuditAccordion review={riskAudit} label="Risk Audit" />
      <TraceDisplay trace={agentTrace || []} />
    </div>
  );
}
