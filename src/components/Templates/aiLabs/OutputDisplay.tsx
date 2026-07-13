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

function contentToText(content: unknown): string {
  if (Array.isArray(content)) {
    return content
      .map(block => {
        if (block && typeof block === 'object' && 'text' in block) {
          return String((block as { text?: unknown }).text || '');
        }
        return String(block || '');
      })
      .filter(Boolean)
      .join('\n');
  }
  if (content && typeof content === 'object') return JSON.stringify(content, null, 2);
  return String(content || '');
}

function normalizeForCompare(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function collapseRepeatedText(text: string): string {
  const clean = text.trim();
  if (!clean) return clean;

  const commandLine = '(?:STRIKE|INTERCEPTION|NTERCEPTION|SATURATION|NO_ENGAGEMENT|UNCLEAR)';
  const commandStarts = Array.from(clean.matchAll(new RegExp(`(^|\\n)${commandLine}\\b`, 'g')))
    .map(match => (match.index || 0) + (match[1] ? 1 : 0));
  if (commandStarts.length > 1) {
    const blocks = commandStarts.map((start, index) => {
      const end = commandStarts[index + 1] ?? clean.length;
      return clean.slice(start, end).trim();
    }).filter(Boolean);
    const stripCommand = (block: string) => block
      .replace(new RegExp(`^${commandLine}\\b\\s*`, 'i'), '')
      .trim();

    for (let i = 0; i < blocks.length - 1; i += 1) {
      const currentBody = normalizeForCompare(stripCommand(blocks[i]));
      const nextBody = normalizeForCompare(stripCommand(blocks[i + 1]));
      if (currentBody && currentBody === nextBody) {
        const currentHasTypo = /^NTERCEPTION\b/i.test(blocks[i]);
        return currentHasTypo ? blocks[i + 1].replace(/^NTERCEPTION\b/i, 'INTERCEPTION') : blocks[i].replace(/^NTERCEPTION\b/i, 'INTERCEPTION');
      }
    }
  }

  const lines = clean.split(/\n+/);
  if (lines.length % 2 === 0) {
    const mid = lines.length / 2;
    const first = lines.slice(0, mid).join('\n').trim();
    const second = lines.slice(mid).join('\n').trim();
    if (first && normalizeForCompare(first) === normalizeForCompare(second)) return first;
  }

  const commandMatch = clean.match(/^(STRIKE|INTERCEPTION|SATURATION|NO_ENGAGEMENT|UNCLEAR)\b/im);
  if (commandMatch && commandMatch.index !== undefined && commandMatch.index > 0) {
    const first = clean.slice(0, commandMatch.index).trim();
    const second = clean.slice(commandMatch.index).trim();
    if (first && normalizeForCompare(first) === normalizeForCompare(second)) return first;
  }

  return clean;
}

function probabilityColor(value: number | null): string {
  if (value == null) return '#8d99ae';
  if (value >= 55) return '#d8a15f';
  if (value >= 30) return '#7a8f61';
  return '#8d99ae';
}

function likelihoodColor(value: string): string {
  const normalized = value.toUpperCase();
  if (normalized === 'HIGH') return '#d8a15f';
  if (normalized === 'MEDIUM') return '#7a8f61';
  return '#8d99ae';
}

function RoutePossibilityMap({ output }: { output: Record<string, unknown> }) {
  const rawRoutes = Array.isArray(output.route_probabilities)
    ? output.route_probabilities as Array<Record<string, unknown>>
    : [];
  const transitions = Array.isArray(output.possible_transitions)
    ? output.possible_transitions as Array<Record<string, unknown>>
    : [];

  if (rawRoutes.length === 0 && transitions.length === 0) return null;

  const routes = rawRoutes.length > 0
    ? rawRoutes.map((route) => {
        const probabilityValue = route.probability;
        const hasProbability = probabilityValue !== null && probabilityValue !== undefined && probabilityValue !== '';
        const rawProbability = hasProbability ? Number(probabilityValue) : Number.NaN;
        const probability = Number.isFinite(rawProbability) ? Math.max(0, Math.min(100, Math.round(rawProbability))) : null;
        return {
          key: String(route.command || route.route || route.state || 'ROUTE'),
          label: String(route.command || route.route || route.state || 'ROUTE').replace(/_/g, ' '),
          probability,
          likelihood: String(route.likelihood || '').replace(/_/g, ' '),
          confidence: String(route.confidence || '').replace(/_/g, ' '),
          basis: contentToText(route.basis || route.reason || route.reasoning),
          confirmation: contentToText(route.required_confirmation || route.confirmation || route.trigger),
          stats: '',
        };
      })
    : transitions.map((transition) => {
        const stats = transition.stats as Record<string, unknown> | null;
        const winRate = stats && typeof stats.win_rate === 'number' ? stats.win_rate : null;
        return {
          key: String(transition.target_state || transition.action || transition.condition || 'PATH'),
          label: String(transition.target_command || transition.target_state || transition.action || 'Doctrine Path').replace(/_/g, ' '),
          probability: winRate,
          confidence: stats ? 'OBSERVED' : 'DOCTRINE ONLY',
          basis: contentToText(transition.condition || transition.action),
          confirmation: stats ? `Observed ${stats.count || 0}x · Avg ${stats.avg_r ?? 'n/a'}R` : 'No closed-trade stats yet; use as possible path, not probability.',
          stats: stats ? `${winRate}%` : '',
        };
      });

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.07)',
      background: 'rgba(255,255,255,0.025)',
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ ...MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.24em', color: 'rgba(255,255,255,0.46)', textTransform: 'uppercase' }}>
          Possibility Map
        </span>
        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        <span style={{ ...MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.32)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          possible route evidence
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
        {routes.map((route, idx) => {
          const color = route.probability != null ? probabilityColor(route.probability) : likelihoodColor(route.likelihood || route.confidence);
          const metric = route.probability != null ? `${route.probability}%` : (route.likelihood || 'Possible');
          return (
            <div key={`${route.key}-${idx}`} style={{ display: 'grid', gridTemplateColumns: 'minmax(120px, 0.24fr) minmax(0, 1fr)', gap: '12px', alignItems: 'start' }}>
              <div>
                <div style={{ ...MONO, fontSize: '11px', fontWeight: 900, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {route.label}
                </div>
                <div style={{ ...MONO, fontSize: '20px', fontWeight: 900, color, marginTop: '3px', lineHeight: 1 }}>
                  {metric}
                </div>
                {(route.confidence || route.probability == null) && (
                  <div style={{ ...MONO, fontSize: '8px', fontWeight: 800, color: 'rgba(255,255,255,0.42)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {route.probability != null ? route.confidence : 'NO STATS'}
                  </div>
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ height: '4px', background: 'rgba(255,255,255,0.055)', margin: '2px 0 7px', overflow: 'hidden' }}>
                  <div style={{ width: `${route.probability ?? 100}%`, height: '100%', background: color, opacity: route.probability == null ? 0.35 : 1 }} />
                </div>
                {route.basis && (
                  <p style={{ ...MONO, fontSize: '10.5px', lineHeight: 1.55, color: 'rgba(255,255,255,0.78)', margin: 0 }}>
                    {route.basis}
                  </p>
                )}
                {route.confirmation && (
                  <p style={{ ...MONO, fontSize: '9.5px', lineHeight: 1.45, color: 'rgba(255,255,255,0.45)', margin: '4px 0 0' }}>
                    Confirm: {route.confirmation}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RecognitionSummary({ output }: { output: Record<string, unknown> }) {
  const rec = (output.recognized_state as Record<string, unknown> | undefined) || (
    output.state_id || output.cmd || output.reasoning || output.analysis ? output : undefined
  );
  if (!rec) return null;

  const stateId = (rec.state_id || output.state_id) as string | undefined;
  const stateName = (rec.state_name || rec.name || rec.label) as string | undefined;
  const command = (rec.command || output.cmd) as string | undefined;
  const posture = (rec.posture || output.posture) as string | undefined;
  const mode = (rec.mode || output.mode) as string | undefined;
  const transitions = Array.isArray(output.possible_transitions) ? output.possible_transitions.length : 0;
  const childStates = Array.isArray(output.child_states) ? output.child_states.length : 0;
  const reasoning = (output.reasoning || output.analysis) as string | undefined;

  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.08)',
      borderLeft: '3px solid #c98f55',
      background: 'linear-gradient(135deg, rgba(201,143,85,0.08), rgba(107,143,138,0.04))',
      padding: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
        {stateId && (
          <span style={{ ...MONO, fontSize: '20px', fontWeight: 900, color: '#f4efe6', lineHeight: 1 }}>
            {stateId}
          </span>
        )}
        {stateName && (
          <span style={{ ...MONO, fontSize: '12px', fontWeight: 900, color: '#d8a15f', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {stateName}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(96px, 1fr))', gap: '10px' }}>
        <HudCell label="Command" value={command} color="#d8a15f" />
        <HudCell label="Posture" value={posture} color="#6b8f8a" />
        <HudCell label="Mode" value={mode} color="#8d99ae" />
        <HudCell label="Routes" value={transitions ? String(transitions) : undefined} color="#b7797a" />
        <HudCell label="Weapons" value={childStates ? String(childStates) : undefined} color="#7a8f61" />
      </div>

      {reasoning && (
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
          {reasoning}
        </p>
      )}
    </div>
  );
}

export function TraceDisplay({ trace, hideContent }: { trace: Array<{ agent: string; content: string }>; hideContent?: string }) {
  if (!trace || trace.length === 0) return null;
  const normalizedHide = normalizeForCompare(hideContent || '');
  const visibleTrace = normalizedHide
    ? trace.filter(step => normalizeForCompare(contentToText(step.content)) !== normalizedHide)
    : trace;
  if (visibleTrace.length === 0) return null;
  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.12)' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        <span style={{ ...MONO, fontSize: '8.5px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.52)' }}>
          Agent Trace
        </span>
        <span style={{ ...MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.42)' }}>
          {visibleTrace.length} STEPS
        </span>
      </div>
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {visibleTrace.map((step, idx) => (
          <div key={idx} style={{ borderLeft: '2px solid rgba(255,255,255,0.12)', paddingLeft: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ ...MONO, fontSize: '10px', fontWeight: 900, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {step.agent}
              </span>
              <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.2em' }}>
                STEP {idx + 1}
              </span>
            </div>
            <p style={{ ...MONO, fontSize: '11px', color: 'rgba(255,255,255,0.72)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
              {contentToText(step.content)}
            </p>
          </div>
        ))}
      </div>
    </div>
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

  const rawModelText = collapseRepeatedText(contentToText((output as Record<string, unknown>).raw));
  const recoveredFromMalformedJson = Boolean((output as Record<string, unknown>).recovered_from_malformed_json);
  const errorText = recoveredFromMalformedJson
    ? ''
    : contentToText((output as Record<string, unknown>).error || (output as Record<string, unknown>).parse_error || (output as Record<string, unknown>).repair_error);
  const returnedText = collapseRepeatedText(contentToText(output));
  const baseMainText  = collapseRepeatedText(String(output.analysis || output.reasoning || output.description || output.synthesis || (output as Record<string, unknown>).market_analysis as string || (output as Record<string, unknown>).market_type as string || (output as Record<string, unknown>).summary as string || rawModelText || errorText || ''));
  const command   = output.cmd || output.weapon || null;
  const plan      = output.plan || null;
  const conviction = (output.conviction || output.predictability || null) as string | null;
  const riskLevel  = (output.risk_level || null) as string | null;
  const thinking   = (output.thinking || '') as string;
  const riskAudit  = output.risk_audit as AIOutput['risk_audit'] | null;
  const agentTrace = output.agent_trace || null;
  const hasStructuredRecognition = !!(output as Record<string, unknown>).recognized_state;
  const mainText = hasStructuredRecognition ? '' : baseMainText;
  const hasVisibleContent = Boolean(command || conviction || riskLevel || plan || mainText || errorText || thinking || riskAudit || hasStructuredRecognition || (agentTrace && agentTrace.length));
  const plainAiText = Boolean(
    (output as Record<string, unknown>).manual_selection_required
    || (output as Record<string, unknown>).response_format === 'text'
    || (output as Record<string, unknown>).display_mode === 'text'
  );

  if (plainAiText) {
    const text = mainText || rawModelText || returnedText;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errorText && (
          <div style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.09)', padding: '12px 14px' }}>
            <div style={{ ...MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.22em', color: '#f87171', textTransform: 'uppercase', marginBottom: '8px' }}>
              Parser / Service Error
            </div>
            <p style={{ ...MONO, fontSize: '11px', color: '#fee2e2', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
              {errorText}
            </p>
          </div>
        )}
        {text && (
          <p style={{ ...MONO, fontSize: '12px', color: '#e8eaed', lineHeight: 1.9, margin: 0, whiteSpace: 'pre-wrap' }}>
            {text}
          </p>
        )}
        <ThinkingAccordion thinking={thinking} />
        <TraceDisplay trace={agentTrace || []} hideContent={text} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      <RecognitionSummary output={output as Record<string, unknown>} />

      {errorText && (
        <div style={{ borderLeft: '3px solid #ef4444', background: 'rgba(239,68,68,0.09)', padding: '12px 14px' }}>
          <div style={{ ...MONO, fontSize: '8px', fontWeight: 900, letterSpacing: '0.22em', color: '#f87171', textTransform: 'uppercase', marginBottom: '8px' }}>
            Parser / Service Error
          </div>
          <p style={{ ...MONO, fontSize: '11px', color: '#fee2e2', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
            {errorText}
          </p>
        </div>
      )}

      <RoutePossibilityMap output={output as Record<string, unknown>} />

      {/* ── Command + HUD metrics ── */}
      {!hasStructuredRecognition && (command || conviction || riskLevel) && (
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

      {!recoveredFromMalformedJson && (output as Record<string, unknown>).parse_error && rawModelText && (
        <AccordionShell header="RAW MODEL RESPONSE" badge="PARSE FALLBACK" badgeColor="#d8a15f">
          <pre style={{ ...MONO, fontSize: '11px', color: 'rgba(255,255,255,0.86)', lineHeight: 1.7, margin: 0, padding: '12px 14px', whiteSpace: 'pre-wrap', maxHeight: '260px', overflowY: 'auto' }}>
            {rawModelText}
          </pre>
        </AccordionShell>
      )}

      <ThinkingAccordion thinking={thinking} />
      <AuditAccordion review={riskAudit} label="Risk Audit" />
      <TraceDisplay trace={agentTrace || []} hideContent={mainText || rawModelText} />

      {!hasVisibleContent && (
        <pre style={{ ...MONO, fontSize: '11px', color: 'rgba(255,255,255,0.78)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
          {returnedText || JSON.stringify(output, null, 2)}
        </pre>
      )}
    </div>
  );
}
