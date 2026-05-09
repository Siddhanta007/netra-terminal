import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNetra } from '../../context/NetraContext';

/**
 * NetraAILabs: The definitive master template for all AI-driven mission sections.
 * Contains: 
 * 1. Left (7): Boxed Telemetry Output with an adaptive SVG grid background.
 * 2. Right (5): Modern AI controls with dynamic gradient-filled slider tracks.
 * Pushed further in the direction of 'Modern AI' design with rich visual feedback.
 */
export default function NetraAILabs({ 
  phaseId, 
  phaseNum, 
  title, 
  subheading, 
  showUpload = false,
  isEvaluating,
  output,
  onAnalyse,
  onStop,
  customStatus
}) {
  const {
    selectedModel, setSelectedModel,
    modelConfig, setModelConfig,
    AVAILABLE_MODELS,
    uploadedVisionFiles, setUploadedVisionFiles,
    darkMode
  } = useNetra();

  const [previews, setPreviews] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadedVisionFiles(prev => [...prev, ...files]);
      
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index) => {
    setUploadedVisionFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Dynamic color calculation for Temperature (Blue -> Green -> Yellow -> Red)
  const tempHue = 220 - (modelConfig.temperature * 220);
  const tempColor = `hsl(${tempHue}, 80%, 60%)`;
  const tempPct = modelConfig.temperature * 100;

  // Dynamic color calculation for Penalty (Green -> Yellow -> Red)
  const freqVal = modelConfig.frequency_penalty || 0;
  const freqHue = 120 - ((freqVal / 2) * 120);
  const freqColor = `hsl(${freqHue}, 80%, 60%)`;
  const freqPct = (freqVal / 2) * 100;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 fade-up phase-theme-0 items-stretch`}>
      
      {/* LEFT: MISSION TELEMETRY (AI OUTPUT) */}
      <div className="lg:col-span-7 flex flex-col">
        <section className="flex flex-col h-full">
          
          {/* Added dynamic grid background via data URI SVG (adapts to light/dark via currentColor) */}
          <div 
            className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[11px] text-[var(--text-1)] font-mono whitespace-pre-wrap flex flex-col flex-1 min-h-[400px] relative overflow-hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 30 0 L 0 0 0 30' fill='none' stroke='currentColor' stroke-width='0.5' opacity='0.08'/%3E%3C/svg%3E")`,
              backgroundPosition: 'center'
            }}
          >
            {/* M Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <span className="text-[200px] font-black opacity-[0.03]" style={{ color: darkMode ? '#fff' : '#000', fontFamily: 'sans-serif' }}>M</span>
            </div>

            {isEvaluating ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4169E1] border-r-[#6366F1] animate-spin"></div>
                  <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#10B981] border-l-[#10B981] animate-spin [animation-duration:1.5s] [animation-direction:reverse]"></div>
                </div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-3)]">Extracting Tactical Visuals...</span>
              </div>
            ) : output ? (
              <div className="text-[var(--text-1)] leading-relaxed markdown-content w-full h-full overflow-y-auto custom-scrollbar pr-4 relative z-10">
                 <ReactMarkdown 
                   children={
                     typeof output === 'string' 
                       ? output 
                       : (output.analysis || output.synthesis || output.description || JSON.stringify(output))
                   } 
                 />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 opacity-40">
                <div className="w-14 h-14 rounded-full border border-[var(--border)] flex items-center justify-center relative">
                   <div className="absolute inset-0 rounded-full bg-[#4169E1]/10 animate-ping"></div>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                     <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
                   </svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-3)]">Awaiting Operational Telemetry...</span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* RIGHT: ENGINE CONTROLS & BRANDING */}
      <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
        <div className="space-y-6">
          <div>
            <div className="phase-heading" style={{ marginBottom: '4px' }}>{title}</div>
            <h2 className="text-[22px] font-black tracking-tight uppercase leading-none bg-gradient-to-r from-[var(--text-1)] to-[#4169E1] bg-clip-text text-transparent dark:from-white dark:to-[#6366F1]">
              {subheading}
            </h2>
          </div>

          <div className="flex flex-col gap-5">
            {/* AI CONTROL SUITE (Glassmorphic & Premium) */}
            <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/40 backdrop-blur-md relative overflow-hidden group shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#4169E1]/40 to-transparent"></div>
              
              <div className="space-y-5">
                {/* Model Selector */}
                <div className="space-y-1">
                  <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Intelligence Engine</div>
                  <div className="relative">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full bg-transparent border-b border-[var(--border)] rounded-none text-[11px] p-1 px-0 outline-none appearance-none cursor-pointer focus:border-[#4169E1] transition-colors pr-4"
                    >
                      {AVAILABLE_MODELS.map(m => (
                        <option key={m.id} value={m.id} className="bg-[var(--surface)] text-[var(--text-1)]">{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute right-0 bottom-2 pointer-events-none opacity-40">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                {/* Temperature Slider - With simulated filled track */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Temperature</div>
                    <span className="text-[10px] font-bold transition-colors duration-200" style={{ color: tempColor }}>{modelConfig.temperature.toFixed(2)}</span>
                  </div>
                  <div className="relative flex items-center h-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={modelConfig.temperature} 
                      onChange={(e) => setModelConfig({ ...modelConfig, temperature: parseFloat(e.target.value) })} 
                      className="w-full h-1 rounded-full appearance-none outline-none cursor-pointer transition-all"
                      style={{ 
                        accentColor: tempColor,
                        background: `linear-gradient(to right, ${tempColor} ${tempPct}%, var(--border) ${tempPct}%)`
                      }}
                    />
                  </div>
                </div>

                {/* Penalty Slider - With simulated filled track */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Penalty (Freq)</div>
                    <span className="text-[10px] font-bold transition-colors duration-200" style={{ color: freqColor }}>{(modelConfig.frequency_penalty || 0).toFixed(1)}</span>
                  </div>
                  <div className="relative flex items-center h-4">
                    <input 
                      type="range" 
                      min="0" 
                      max="2" 
                      step="0.1" 
                      value={modelConfig.frequency_penalty || 0} 
                      onChange={(e) => setModelConfig({ ...modelConfig, frequency_penalty: parseFloat(e.target.value) })} 
                      className="w-full h-1 rounded-full appearance-none outline-none cursor-pointer transition-all"
                      style={{ 
                        accentColor: freqColor,
                        background: `linear-gradient(to right, ${freqColor} ${freqPct}%, var(--border) ${freqPct}%)`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* OPTIONAL IMAGE UPLOAD */}
            {showUpload && (
              <div className="space-y-3">
                <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Mission Visuals</div>
                <label className="flex items-center justify-between p-3 px-4 border border-dashed border-[var(--border)] hover:border-[#4169E1]/50 bg-[var(--surface-2)]/30 rounded-lg cursor-pointer transition-all group">
                  <input type="file" multiple className="hidden" onChange={handleFileChange} disabled={isEvaluating} />
                  <div className="flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-[var(--text-3)] group-hover:text-[#4169E1] transition-colors">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                    </svg>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-3)] group-hover:text-[#4169E1] transition-colors">Deploy Visual Assets</span>
                  </div>
                </label>
              </div>
            )}

            {/* Image Previews or Custom Status or Fallback */}
            {previews.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {previews.map((previewUrl, index) => (
                  <div key={index} className="relative w-14 h-14">
                    <img src={previewUrl} className="w-full h-full object-cover rounded-lg border border-[var(--border)]" alt="Preview" />
                    <button 
                      onClick={() => removeFile(index)} 
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 transition-colors"
                      style={{ zIndex: 10 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : customStatus ? customStatus : (
              <div className="text-[10px] text-[var(--text-3)] leading-relaxed italic border-l border-[var(--border)] pl-3">
                Netra AI operates on strict data-driven evaluation. Always cross-verify model outputs with manual structure.
              </div>
            )}
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3 pt-6 border-t border-[var(--border)]/30">
          <div className="flex gap-2">
            <button 
              onClick={onStop} 
              disabled={!isEvaluating}
              className={`flex-1 h-10 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                isEvaluating 
                  ? 'border-rose-500 text-rose-500 hover:bg-rose-500/5' 
                  : 'border-[var(--border)] text-[var(--text-3)] opacity-40 cursor-not-allowed'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
              Stop
            </button>
            <button 
              onClick={onAnalyse} 
              disabled={isEvaluating}
              className={`flex-1 h-10 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-200 active:scale-95 active:opacity-90 flex items-center justify-center gap-2 ${
                !isEvaluating 
                  ? 'bg-gradient-to-r from-[#4169E1] to-[#6366F1] text-white hover:opacity-90 shadow-[0_4px_12px_rgba(65,105,225,0.3)] glow-active' 
                  : 'bg-[var(--surface-2)] text-[var(--text-3)] opacity-40 cursor-not-allowed border border-[var(--border)]'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Analyse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
