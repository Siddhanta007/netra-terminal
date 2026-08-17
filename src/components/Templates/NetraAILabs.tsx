// NetraAILabs — the shared 'Maya AI Labs' box. Model + generation controls on the right,
// streamed agent output (command, plan, reasoning, agent trace) on the left. Reused by every AI phase.
//
// The presentational pieces live in ./aiLabs/ (output renderer, loading animation, slider).

import { useState, ReactNode, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNetra } from '../../context/NetraContext';
import { setSelectedModel, setModelConfig } from '../../store/slices/modelSlice';
import { RootState, AppDispatch } from '../../store';
import { MONO, tempColor, freqColor } from './aiLabs/helpers';
import { OutputDisplay } from './aiLabs/OutputDisplay';
import { TerminalScroller } from './aiLabs/Loading';
import { SliderRow } from './aiLabs/SliderRow';
import { formatAiElapsed, useAiResponseTimer } from './aiLabs/useAiResponseTimer';

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
  analyseDisabled?: boolean;
  analyseDisabledReason?: string;
  showActions?: boolean;
  bottomPanel?: ReactNode;
  controlPanelTop?: ReactNode;
}

export default function NetraAILabs({
  title = 'Netra AI Labs',
  subheading = 'MAYA',
  showUpload = false,
  isEvaluating,
  output,
  onAnalyse,
  onStop,
  customStatus,
  analyseDisabled = false,
  analyseDisabledReason,
  showActions = true,
  bottomPanel,
  controlPanelTop,
  phaseId = 'maya',
}: NetraAILabsProps) {
  const dispatch = useDispatch<AppDispatch>();
  const [previews, setPreviews] = useState<string[]>([]);
  const [paramsOpen, setParamsOpen] = useState(false);   // collapse the sliders by default to save space

  const selectedModel  = useSelector((s: RootState) => s.model.selectedModel);
  const modelConfig    = useSelector((s: RootState) => s.model.modelConfig);
  const { AVAILABLE_MODELS, uploadedVisionFiles, setUploadedVisionFiles, activeSessionId } = useNetra();
  const timerStorageKey = `netra.ai-timing.${activeSessionId || 'no-session'}.${phaseId}`;
  const runTiming = useAiResponseTimer(isEvaluating, output, timerStorageKey);
  const timerLabel = runTiming.status === 'running'
    ? 'ELAPSED'
    : runTiming.status === 'complete'
      ? 'RESPONSE'
      : runTiming.status === 'stopped'
        ? 'STOPPED'
        : 'READY';

  // The suggestion box runs the multi-agent pipeline — only models that reliably
  // follow JSON belong here (tagged "Agent" in models_config.json). The chat box
  // keeps the full list. Free/preview/tiny/reasoning models are filtered out.
  const agentModels = AVAILABLE_MODELS;

  // Never let an agent run on a non-capable model: if the shared selection is
  // something the chat box picked (e.g. a free model), snap it to a capable one.
  useEffect(() => {
    if (agentModels.length && !agentModels.some(m => m.id === selectedModel)) {
      dispatch(setSelectedModel(agentModels[0].id));
    }
  }, [agentModels, selectedModel, dispatch]);

  const currentModelData  = AVAILABLE_MODELS.find(m => m.id === selectedModel);
  const isVisionSupported = currentModelData?.tags?.includes('Vision');
  const executeDisabled = isEvaluating || analyseDisabled;

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
    <div data-loading-owner="local" className="fade-up" style={bottomPanel ? { overflow: 'hidden', border: '1px solid rgba(255,255,255,0.09)', background: '#05080d' } : undefined}>
    <div className={`grid grid-cols-1 lg:grid-cols-12 ${bottomPanel ? 'gap-0' : 'lg:gap-3 gap-3'} items-stretch`}>

      {/* ── LEFT: Intelligence Output ── */}
      <div className="lg:col-span-7 flex flex-col"
        style={{
          background: '#030608',
          border: bottomPanel ? 'none' : '1px solid rgba(255,255,255,0.07)',
          height: '420px',
          overflow: 'hidden',
        }}>

        <div className="terminal-ai-output-header">
          <div className="terminal-ai-output-identity">
            <span className={`terminal-ai-runtime-dot ${runTiming.status === 'running' ? 'is-running' : runTiming.status === 'complete' ? 'is-complete' : ''}`} />
            <div>
              <div className="terminal-ai-output-title">{title}</div>
              <div className="terminal-ai-output-subheading">{subheading}</div>
            </div>
          </div>
          <div className={`terminal-ai-timer is-${runTiming.status}`} role="timer" aria-live="polite">
            <span>{timerLabel}</span>
            <strong>{runTiming.status === 'idle' ? '—' : formatAiElapsed(runTiming.elapsedMs)}</strong>
          </div>
        </div>

        {/* Output body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {leftBody}
        </div>
      </div>

      {/* ── RIGHT: Controls ── */}
      <div className="lg:col-span-5 flex flex-col"
        style={{
          background: '#07090f',
          border: bottomPanel ? 'none' : '1px solid rgba(255,255,255,0.07)',
          borderLeft: bottomPanel ? '1px solid rgba(255,255,255,0.07)' : undefined,
          overflow: 'hidden',
          minHeight: 0,
        }}>

        {/* System label */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <span style={{ ...MONO, fontSize: '14px', fontWeight: 900, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase' }}>
            MAYA
          </span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        {/* Scrollable controls — sections expand on demand so nothing overflows the box */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

          {/* Optional phase-specific input. The shared Maya controls remain unchanged. */}
          {controlPanelTop}

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
                {agentModels.map(m => (
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

          {/* Parameters — collapsible (shows a summary when closed) */}
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <button
              onClick={() => setParamsOpen(v => !v)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.82)', textTransform: 'uppercase' }}>
                Parameters
              </span>
              <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, color: tColor }}>{modelConfig.temperature.toFixed(2)}</span>
              <span style={{ ...MONO, fontSize: '8px', fontWeight: 700, color: fColor }}>· {freqVal.toFixed(1)}</span>
              <div style={{ flex: 1 }} />
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5"
                style={{ transform: paramsOpen ? 'rotate(180deg)' : 'none', transition: 'transform 180ms' }}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {paramsOpen && (
              <div style={{ padding: '2px 16px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
            )}
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
                <input type="file" multiple style={{ display: 'none' }} onChange={handleFileChange} disabled={isEvaluating || analyseDisabled} />
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

        </div>

        {/* Action buttons — pinned at the bottom */}
        {showActions && <div className="terminal-ai-actions">
          <button
            onClick={onStop}
            disabled={!isEvaluating}
            className="btn-reset terminal-ai-action"
          >
            ABORT
          </button>
          <button
            onClick={onAnalyse}
            disabled={executeDisabled}
            title={analyseDisabledReason}
            className="btn-confirm terminal-ai-action"
          >
            EXECUTE
          </button>
        </div>}
      </div>
    </div>
    {bottomPanel && (
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.09)', background: 'var(--surface)' }}>
        {bottomPanel}
      </div>
    )}
    </div>
  );
}
