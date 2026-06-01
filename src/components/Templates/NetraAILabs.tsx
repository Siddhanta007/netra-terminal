import { useState, ReactNode, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNetra } from '../../context/NetraContext';
import { setSelectedModel, setModelConfig } from '../../store/slices/modelSlice';
import { RootState, AppDispatch } from '../../store';
import { AIOutput } from '../../types';

// ─── Color helpers ────────────────────────────────────────────────────────────

function convictionHex(val: string | undefined): string {
  if (!val) return 'rgba(255,255,255,0.25)';
  const v = val.toUpperCase();
  if (v === 'HIGH')                  return '#22c55e';
  if (v === 'MED' || v === 'MEDIUM') return '#f59e0b';
  return '#ef4444';
}
function riskHex(val: string | undefined): string {
  if (!val) return 'rgba(255,255,255,0.25)';
  const v = val.toUpperCase();
  if (v === 'LOW')    return '#22c55e';
  if (v === 'MEDIUM') return '#f59e0b';
  return '#ef4444';
}
const CMD_HEX: Record<string, string> = {
  STRIKE:        '#ffd700',
  INTERCEPTION:  '#38bdf8',
  SATURATION:    '#f97316',
  'NO ENGAGEMENT': '#ef4444',
  NO_ENGAGEMENT:   '#ef4444',
};
function cmdHex(label: string): string {
  return CMD_HEX[label.toUpperCase().replace(/_/g, ' ')] || '#4169E1';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const MONO: React.CSSProperties = { fontFamily: 'JetBrains Mono, Consolas, monospace' };

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

function TraceDisplay({ trace }: { trace: Array<{ agent: string; content: string }> }) {
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

function OutputDisplay({ output: rawOutput }: { output: unknown }) {
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

// ─── Morphing line animation ──────────────────────────────────────────────────

function MorphingLine() {
  const svgRef  = useRef<SVGSVGElement>(null);
  const raf     = useRef(0);
  const t       = useRef(0);

  useEffect(() => {
    const N = 60, W = 600, H = 44, mid = H / 2, PERIOD = 110;
    const SHAPES: Array<(p: number) => number> = [
      ()  => 0,
      (p) => -Math.sin(p * Math.PI) * 16,
      (p) => -Math.sin(p * Math.PI * 2) * 14,
      (p) =>  Math.sin(p * Math.PI * 3) * 11,
      (p) => -Math.sin(p * Math.PI * 4) * 9,
    ];
    const COLORS: [number, number, number][] = [
      [255, 255, 255],
      [96,  165, 250],
      [0,   229, 160],
      [167, 139, 250],
      [255, 255, 255],
    ];
    const ease = (x: number) => x < 0.5 ? 2 * x * x : -1 + (4 - 2 * x) * x;
    const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

    const tick = () => {
      t.current++;
      const totalPhase = t.current / PERIOD;
      const shapeIdx   = Math.floor(totalPhase) % SHAPES.length;
      const nextIdx    = (shapeIdx + 1) % SHAPES.length;
      const progress   = ease(totalPhase % 1);
      const cA = COLORS[shapeIdx % COLORS.length];
      const cB = COLORS[nextIdx  % COLORS.length];
      const r  = Math.round(lerp(cA[0], cB[0], progress));
      const g  = Math.round(lerp(cA[1], cB[1], progress));
      const b  = Math.round(lerp(cA[2], cB[2], progress));
      const color = `rgb(${r},${g},${b})`;
      const pts = Array.from({ length: N }, (_, i) => {
        const p  = i / (N - 1);
        const x  = p * W;
        const yA = SHAPES[shapeIdx](p);
        const yB = SHAPES[nextIdx](p);
        const y  = mid + lerp(yA, yB, progress);
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }).join(' ');
      if (svgRef.current) {
        const [glow, line] = svgRef.current.querySelectorAll('path');
        if (glow && line) {
          glow.setAttribute('d', pts);
          glow.setAttribute('stroke', color);
          line.setAttribute('d', pts);
          line.setAttribute('stroke', color);
        }
        // Update drop-shadow color dynamically
        svgRef.current.style.filter = `drop-shadow(0 0 8px rgba(${r},${g},${b},0.9)) drop-shadow(0 0 18px rgba(${r},${g},${b},0.5))`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <svg ref={svgRef} width="100%" height="44" viewBox="0 0 600 44" preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {/* Wide blurred path for the outer glow */}
      <path fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.25" style={{ filter: 'blur(4px)' }} />
      {/* Sharp main line */}
      <path fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.95" />
    </svg>
  );
}

function TerminalScroller() {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => +(e + 0.1).toFixed(1)), 100);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '28px', padding: '0 32px' }}>
      <MorphingLine />
      <div style={{ textAlign: 'center' }}>
        <div style={{ ...MONO, fontSize: '24px', fontWeight: 300, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.05em', lineHeight: 1 }}>
          {elapsed.toFixed(1)}<span style={{ fontSize: '12px', marginLeft: '2px', color: 'rgba(255,255,255,0.2)' }}>s</span>
        </div>
        <div style={{ ...MONO, fontSize: '8px', color: 'rgba(255,255,255,0.18)', letterSpacing: '0.25em', textTransform: 'uppercase', marginTop: '6px' }}>
          Processing
        </div>
      </div>
    </div>
  );
}

// ─── Slider color helpers ─────────────────────────────────────────────────────

function tempColor(v: number): string {
  if (v <= 0.25) return '#22c55e';   // precise — cool green
  if (v <= 0.55) return '#60a5fa';   // balanced — blue
  if (v <= 0.78) return '#f59e0b';   // creative — amber
  return '#ef4444';                   // wild — red
}

function freqColor(v: number): string {
  if (v <= 0.5)  return '#a78bfa';   // low — purple (diverse)
  if (v <= 1.2)  return '#60a5fa';   // medium — blue
  return '#fb7185';                   // high — pink-red
}

// ─── Slider row ───────────────────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, pct, trackColor, onChange }: {
  label: string; value: number; min: number; max: number; step: number; pct: number; trackColor: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.82)' }}>
          {label}
        </span>
        <span style={{ ...MONO, fontSize: '10px', fontWeight: 800, color: trackColor, transition: 'color 300ms' }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div style={{ position: 'relative', height: '14px', display: 'flex', alignItems: 'center', width: '100%' }}>
        {/* Track background */}
        <div style={{ position: 'absolute', left: 0, right: 0, height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '1px' }} />
        {/* Track fill */}
        <div style={{
          position: 'absolute', left: 0, height: '2px',
          background: trackColor, width: `${pct}%`, borderRadius: '1px',
          boxShadow: `0 0 8px ${trackColor}55`,
          transition: 'background 300ms, box-shadow 300ms',
        }} />
        {/* Thumb node */}
        <div style={{
          position: 'absolute',
          left: `calc(${pct}% - 5px)`,
          width: '10px', height: '10px',
          borderRadius: '50%',
          background: trackColor,
          boxShadow: `0 0 10px ${trackColor}90, 0 0 0 2px rgba(7,9,15,0.8)`,
          pointerEvents: 'none', zIndex: 1,
          transition: 'background 300ms, box-shadow 300ms, left 60ms',
        }} />
        {/* Invisible range input on top */}
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface NetraAILabsProps {
  title?: string;
  subheading?: string;
  showUpload?: boolean;
  isEvaluating: boolean;
  output: unknown;
  onAnalyse: () => void;
  onStop: () => void;
  phaseId?: string;
  phaseNum?: number;
  customStatus?: ReactNode;
}

export default function NetraAILabs({
  showUpload = false,
  isEvaluating,
  output,
  onAnalyse,
  onStop,
  customStatus,
}: NetraAILabsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [previews, setPreviews] = useState<string[]>([]);

  const selectedModel  = useSelector((s: RootState) => s.model.selectedModel);
  const modelConfig    = useSelector((s: RootState) => s.model.modelConfig);
  const { AVAILABLE_MODELS, uploadedVisionFiles, setUploadedVisionFiles } = useNetra();

  const currentModelData  = AVAILABLE_MODELS.find(m => m.id === selectedModel);
  const isVisionSupported = currentModelData?.tags?.includes('Vision');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setUploadedVisionFiles([...uploadedVisionFiles, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };
  const removeFile = (index: number) => {
    setUploadedVisionFiles(uploadedVisionFiles.filter((_, i) => i !== index));
    setPreviews(prev => { URL.revokeObjectURL(prev[index]); return prev.filter((_, i) => i !== index); });
  };

  const tempPct  = modelConfig.temperature * 100;
  const freqVal  = modelConfig.frequency_penalty || 0;
  const freqPct  = (freqVal / 2) * 100;
  const tColor   = tempColor(modelConfig.temperature);
  const fColor   = freqColor(freqVal);

  // ── Left panel body ──
  const leftBody = (() => {
    if (isEvaluating) return <TerminalScroller />;
    if (customStatus) return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {customStatus}
        <TraceDisplay trace={((output as Record<string, unknown> | null)?.agent_trace as Array<{ agent: string; content: string }>) || []} />
      </div>
    );
    if (output != null)  return <div style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}><OutputDisplay output={output} /></div>;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', opacity: 0.3 }}>
        {/* Reticle */}
        <div style={{ position: 'relative', width: '36px', height: '36px' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.5)' }} />
          <div style={{ position: 'absolute', inset: '8px', border: '1px solid rgba(255,255,255,0.5)' }} />
        </div>
        <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)' }}>
          AWAITING INPUT
        </span>
      </div>
    );
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 lg:gap-3 gap-3 fade-up items-stretch">

      {/* ── LEFT: Intelligence Output ── */}
      <div className="lg:col-span-7 flex flex-col"
        style={{
          background: '#030608',
          border: '1px solid rgba(255,255,255,0.07)',
          height: '420px',
          overflow: 'hidden',
        }}>

        {/* Output body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {leftBody}
        </div>
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="lg:col-span-5 flex flex-col"
        style={{
          background: '#07090f',
          border: '1px solid rgba(255,255,255,0.07)',
          overflow: 'hidden',
          minHeight: 0,
        }}>

        {/* System label */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ ...MONO, fontSize: '14px', fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase' }}>
            MAYA
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Model selector */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>
              MODEL
            </span>
            {isVisionSupported && (
              <span style={{ ...MONO, fontSize: '7px', fontWeight: 700, letterSpacing: '0.15em', color: '#22c55e' }}>
                ● VISION
              </span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedModel}
              onChange={e => dispatch(setSelectedModel(e.target.value))}
              style={{
                width: '100%', background: 'transparent', border: 'none',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                ...MONO, fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.9)',
                padding: '4px 20px 4px 0', outline: 'none', appearance: 'none', cursor: 'pointer',
              }}
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id} style={{ background: '#07090f', color: 'rgba(255,255,255,0.9)' }}>
                  {m.name}
                </option>
              ))}
            </select>
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5"
              style={{ position: 'absolute', right: 0, bottom: '7px', pointerEvents: 'none' }}>
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Parameters */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <SliderRow
            label="INFERENCE TEMP" value={modelConfig.temperature}
            min={0} max={1} step={0.05} pct={tempPct} trackColor={tColor}
            onChange={v => dispatch(setModelConfig({ ...modelConfig, temperature: v }))}
          />
          <SliderRow
            label="FREQ PENALTY" value={freqVal}
            min={0} max={2} step={0.1} pct={freqPct} trackColor={fColor}
            onChange={v => dispatch(setModelConfig({ ...modelConfig, frequency_penalty: v }))}
          />
        </div>

        {/* Chart upload */}
        {(showUpload || isVisionSupported) && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase', marginBottom: '10px' }}>
              CHART ASSETS
            </div>
            <label style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', border: '1px dashed rgba(255,255,255,0.12)',
              cursor: 'pointer', transition: 'border-color 150ms',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
            >
              <input type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} disabled={isEvaluating} />
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span style={{ ...MONO, fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                ATTACH CHART
              </span>
            </label>
            {previews.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
                {previews.map((url, i) => (
                  <div key={i} style={{ position: 'relative', width: '44px', height: '44px' }}>
                    <img src={url} alt="Chart" style={{ width: '100%', height: '100%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <button
                      onClick={() => removeFile(i)}
                      style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        width: '14px', height: '14px', background: '#ef4444',
                        border: 'none', color: '#fff', fontSize: '10px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Action buttons */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
          <button
            onClick={onStop}
            disabled={!isEvaluating}
            style={{
              flex: 1, height: '36px', background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              ...MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: isEvaluating ? '#ef4444' : 'rgba(255,255,255,0.2)',
              cursor: isEvaluating ? 'pointer' : 'not-allowed',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { if (isEvaluating) e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            ABORT
          </button>
          <button
            onClick={onAnalyse}
            disabled={isEvaluating}
            style={{
              flex: 1, height: '36px',
              background: isEvaluating ? 'rgba(255,255,255,0.04)' : '#4169E1',
              border: 'none',
              ...MONO, fontSize: '9px', fontWeight: 900, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: isEvaluating ? 'rgba(255,255,255,0.2)' : '#fff',
              cursor: isEvaluating ? 'not-allowed' : 'pointer',
              transition: 'all 150ms',
            }}
            onMouseEnter={e => { if (!isEvaluating) e.currentTarget.style.background = '#3558c8'; }}
            onMouseLeave={e => { if (!isEvaluating) e.currentTarget.style.background = '#4169E1'; }}
          >
            EXECUTE
          </button>
        </div>
      </div>
    </div>
  );
}
