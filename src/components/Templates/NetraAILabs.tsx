import { useState, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNetra } from '../../context/NetraContext';
import { setSelectedModel, setModelConfig } from '../../store/slices/modelSlice';
import { RootState, AppDispatch } from '../../store';
import { AIOutput } from '../../types';

// ─── helpers ─────────────────────────────────────────────────────────────────

function convictionColor(val: string | undefined): string {
  if (!val) return 'text-[var(--text-3)]';
  const v = val.toUpperCase();
  if (v === 'HIGH') return 'text-emerald-400';
  if (v === 'MED' || v === 'MEDIUM') return 'text-amber-400';
  return 'text-rose-400';
}

function riskColor(val: string | undefined): string {
  if (!val) return 'text-[var(--text-3)]';
  const v = val.toUpperCase();
  if (v === 'LOW') return 'text-emerald-400';
  if (v === 'MEDIUM') return 'text-amber-400';
  return 'text-rose-400';
}

const CMD_COLORS: Record<string, string> = {
  STRIKE: 'bg-blue-500/15 border-blue-500/30 text-blue-400',
  INTERCEPTION: 'bg-violet-500/15 border-violet-500/30 text-violet-400',
  'NO ENGAGEMENT': 'bg-rose-500/15 border-rose-500/30 text-rose-400',
};

function CmdBadge({ label }: { label: string | undefined }) {
  if (!label) return null;
  const cls = CMD_COLORS[label.toUpperCase()] || 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-2)]';
  return (
    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${cls}`}>
      {label}
    </span>
  );
}

function SmallBadge({ label, value, valueClass }: { label: string; value: string | undefined; valueClass: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-3)]">{label}</span>
      <span className={`text-[11px] font-black uppercase ${valueClass}`}>{value}</span>
    </div>
  );
}

function ThinkingAccordion({ thinking }: { thinking: string }) {
  const [open, setOpen] = useState(false);
  if (!thinking) return null;
  return (
    <div className="border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] transition-colors"
      >
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
          REASONING TRACE
        </span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-[var(--text-4)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3 text-[11px] text-[var(--text-2)] leading-relaxed whitespace-pre-wrap font-mono border-t border-[var(--border)] bg-[var(--surface-2)]/30">
          {thinking}
        </div>
      )}
    </div>
  );
}

function AuditAccordion({ review, label = 'Audit Notes' }: {
  review?: { status?: string; risk_status?: string; critique?: string; risk_critique?: string; suggested_cmd?: string; adjusted_plan?: string } | null;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!review) return null;
  const status = review.status || review.risk_status;
  const critique = review.critique || review.risk_critique;
  const suggested = review.suggested_cmd || review.adjusted_plan;
  return (
    <div className="border border-[var(--border)] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)' }}>
            {label.toUpperCase()}
          </span>
          {status && (
            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${status === 'APPROVED' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {status}
            </span>
          )}
        </div>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          className={`text-[var(--text-4)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-2 border-t border-[var(--border)] bg-[var(--surface-2)]/30">
          {critique && <p className="text-[11px] text-[var(--text-1)] leading-relaxed">{critique}</p>}
          {suggested && (
            <p className="text-[10px] text-[var(--text-3)]">
              <span className="font-bold uppercase tracking-wider">Suggested: </span>{suggested}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function OutputDisplay({ output: rawOutput }: { output: unknown }) {
  if (typeof rawOutput === 'string') {
    return <p className="text-[12px] text-[var(--text-1)] leading-[1.8] font-mono">{rawOutput}</p>;
  }
  const output = rawOutput as AIOutput;
  const mainText = output.analysis || output.reasoning || output.description || output.synthesis || '';
  const command = output.cmd || output.weapon || null;
  const plan = output.plan || null;
  const conviction = (output.conviction || output.predictability || null) as string | null;
  const riskLevel = (output.risk_level || null) as string | null;
  const thinking = (output.thinking || '') as string;
  const criticReview = output.critic_review as AIOutput['critic_review'] | null;
  const riskAudit = output.risk_audit as AIOutput['risk_audit'] | null;

  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto custom-scrollbar pr-1">
      {(command || conviction || riskLevel) && (
        <div className="flex flex-wrap items-center gap-3 pb-3 border-b border-[var(--border)]/60">
          {command && <CmdBadge label={command} />}
          <SmallBadge label="Conviction" value={conviction ?? undefined} valueClass={convictionColor(conviction ?? undefined)} />
          <SmallBadge label="Risk" value={riskLevel ?? undefined} valueClass={riskColor(riskLevel ?? undefined)} />
        </div>
      )}
      {plan && (
        <div className="p-3 border-l-2 border-[var(--accent)] pl-4 bg-[var(--surface-2)]/40">
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '6px' }}>EXECUTION PLAN</div>
          <p className="text-[12px] text-[var(--text-1)] leading-relaxed">{plan}</p>
        </div>
      )}
      {mainText && (
        <p className="text-[12px] text-[var(--text-1)] leading-[1.8]">{mainText}</p>
      )}
      <ThinkingAccordion thinking={thinking} />
      <AuditAccordion review={criticReview} label="Critic Review" />
      <AuditAccordion review={riskAudit} label="Risk Audit" />
    </div>
  );
}

// ─── Minimal range slider row ─────────────────────────────────────────────────

function SliderRow({ label, value, min, max, step, pct, onChange }: {
  label: string; value: number; min: number; max: number; step: number; pct: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)' }}>{label}</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', fontWeight: 700, color: 'var(--text-2)' }}>{value.toFixed(2)}</span>
      </div>
      <div className="relative h-[3px] bg-[var(--border)] w-full">
        <div className="absolute left-0 top-0 h-full bg-[var(--accent)]" style={{ width: `${pct}%` }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

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

  const selectedModel = useSelector((s: RootState) => s.model.selectedModel);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const { AVAILABLE_MODELS, uploadedVisionFiles, setUploadedVisionFiles } = useNetra();

  const currentModelData = AVAILABLE_MODELS.find(m => m.id === selectedModel);
  const isVisionSupported = currentModelData?.tags?.includes('Vision');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setUploadedVisionFiles([...uploadedVisionFiles, ...files]);
    setPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
  };

  const removeFile = (index: number) => {
    setUploadedVisionFiles(uploadedVisionFiles.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const tempPct = modelConfig.temperature * 100;
  const freqVal = modelConfig.frequency_penalty || 0;
  const freqPct = (freqVal / 2) * 100;

  // Left panel content
  const leftContent = (() => {
    if (isEvaluating) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 700, letterSpacing: '0.3em', color: 'var(--text-4)', textTransform: 'uppercase' }} className="animate-pulse">
            PROCESSING
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="w-1 h-1 rounded-full bg-[var(--accent)]"
                style={{ animationName: 'pulse', animationDuration: '1.2s', animationDelay: `${i * 0.2}s`, animationIterationCount: 'infinite' }} />
            ))}
          </div>
        </div>
      );
    }
    if (customStatus) return <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">{customStatus}</div>;
    if (output != null) return <OutputDisplay output={output} />;
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 select-none">
        {/* Crosshair reticle */}
        <div className="relative w-10 h-10 opacity-20">
          <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--text-3)]" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--text-3)]" />
          <div className="absolute inset-2 border border-[var(--text-3)]" />
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--text-4)', opacity: 0.4 }}>
          NO CHART DATA
        </span>
      </div>
    );
  })();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 fade-up items-stretch">

      {/* LEFT: ANALYSIS OUTPUT */}
      <div className="lg:col-span-7 flex flex-col">
        <div
          className="flex flex-col flex-1 min-h-[280px] p-5 border border-[var(--border)] bg-[var(--surface)] relative"
          style={{
            backgroundImage: `linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        >
          {/* Override grid with solid bg for content area */}
          <div className="absolute inset-0 bg-[var(--surface)] opacity-90 pointer-events-none" />
          <div className="relative z-10 flex flex-col flex-1">
            {leftContent}
          </div>
        </div>
      </div>

      {/* RIGHT: CONTROLS */}
      <div className="lg:col-span-5 flex flex-col justify-between gap-0">

        {/* Header */}
        <div className="pb-4 border-b border-[var(--border)]">
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: '4px' }}>
            MAYA · ANALYSIS ENGINE
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-1)' }}>
            Visual Intelligence Interface
          </div>
        </div>

        {/* Model selector */}
        <div className="py-4 border-b border-[var(--border)]">
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)' }}>MODEL</span>
            {isVisionSupported && (
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '7px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--green)' }}>
                ● VISION
              </span>
            )}
          </div>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => dispatch(setSelectedModel(e.target.value))}
              className="w-full bg-transparent border-b border-[var(--border)] text-[11px] font-mono p-1 px-0 outline-none appearance-none cursor-pointer focus:border-[var(--accent)] transition-colors pr-4"
              style={{ color: 'var(--text-1)', fontFamily: 'JetBrains Mono, monospace', fontSize: '10px' }}
            >
              {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id} className="bg-[var(--surface)] text-[var(--text-1)]">{m.name}</option>
              ))}
            </select>
            <div className="absolute right-0 bottom-2 pointer-events-none" style={{ color: 'var(--text-4)' }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
        </div>

        {/* Parameters */}
        <div className="py-4 border-b border-[var(--border)] space-y-4">
          <SliderRow
            label="INFERENCE TEMP"
            value={modelConfig.temperature}
            min={0} max={1} step={0.05}
            pct={tempPct}
            onChange={v => dispatch(setModelConfig({ ...modelConfig, temperature: v }))}
          />
          <SliderRow
            label="FREQ PENALTY"
            value={freqVal}
            min={0} max={2} step={0.1}
            pct={freqPct}
            onChange={v => dispatch(setModelConfig({ ...modelConfig, frequency_penalty: v }))}
          />
        </div>

        {/* Chart upload */}
        {(showUpload || isVisionSupported) && (
          <div className="py-4 border-b border-[var(--border)]">
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: '10px' }}>
              CHART ASSETS
            </div>
            <label className="flex items-center gap-3 p-3 border border-dashed border-[var(--border)] hover:border-[var(--accent)] bg-[var(--surface-2)]/30 cursor-pointer transition-colors group">
              <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={isEvaluating} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--text-4)] group-hover:text-[var(--accent)] transition-colors flex-shrink-0">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-4)' }}
                className="group-hover:text-[var(--accent)] transition-colors">
                ATTACH CHART
              </span>
            </label>
            {previews.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {previews.map((url, i) => (
                  <div key={i} className="relative w-12 h-12 group">
                    <img src={url} alt="Chart" className="w-full h-full object-cover border border-[var(--border)]" />
                    <button
                      onClick={() => removeFile(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 flex items-center justify-center text-white text-[10px] hover:bg-rose-600 transition-colors opacity-0 group-hover:opacity-100"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 flex gap-2">
          <button
            onClick={onStop}
            disabled={!isEvaluating}
            className="flex-1 h-9 text-[9px] font-black uppercase tracking-[0.2em] border transition-all duration-150 flex items-center justify-center gap-2"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              borderColor: isEvaluating ? 'var(--red)' : 'var(--border)',
              color: isEvaluating ? 'var(--red)' : 'var(--text-4)',
              opacity: isEvaluating ? 1 : 0.35,
              cursor: isEvaluating ? 'pointer' : 'not-allowed',
              background: 'transparent',
            }}
          >
            ABORT
          </button>
          <button
            onClick={onAnalyse}
            disabled={isEvaluating}
            className="flex-1 h-9 text-[9px] font-black uppercase tracking-[0.2em] transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2"
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              background: isEvaluating ? 'var(--surface-2)' : 'var(--accent)',
              color: isEvaluating ? 'var(--text-4)' : '#fff',
              opacity: isEvaluating ? 0.35 : 1,
              cursor: isEvaluating ? 'not-allowed' : 'pointer',
              border: 'none',
            }}
          >
            EXECUTE
          </button>
        </div>
      </div>
    </div>
  );
}
