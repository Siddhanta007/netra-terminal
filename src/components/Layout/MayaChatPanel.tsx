import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { useNetra } from '../../context/NetraContext';
import { setChatInput, setIncludeData, setIncludeDoctrine } from '../../store/slices/chatSlice';
import { setSelectedModel, setModelConfig } from '../../store/slices/modelSlice';
import { RootState, AppDispatch } from '../../store';

function MessageContent({ text }: { text: string | unknown }) {
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const match = str.match(thinkRegex);
  if (match) {
    const thinking = match[1];
    const response = str.replace(thinkRegex, '').trim();
    return (
      <>
        <details className="mb-2 bg-white/5 rounded-lg p-2 border border-white/10">
          <summary className="text-xs font-bold text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors">
            Thoughts
          </summary>
          <div className="mt-1 text-xs text-white/70 whitespace-pre-wrap">{thinking}</div>
        </details>
        <ReactMarkdown>{response}</ReactMarkdown>
      </>
    );
  }
  return <ReactMarkdown>{str}</ReactMarkdown>;
}

export default function MayaChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const chatHistory = useSelector((s: RootState) => s.chat.chatHistory);
  const chatInput = useSelector((s: RootState) => s.chat.chatInput);
  const isAiLoading = useSelector((s: RootState) => s.chat.isAiLoading);
  const includeData = useSelector((s: RootState) => s.chat.includeData);
  const includeDoctrine = useSelector((s: RootState) => s.chat.includeDoctrine);
  const selectedModel = useSelector((s: RootState) => s.model.selectedModel);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const AVAILABLE_MODELS = useSelector((s: RootState) => s.model.availableModels);

  const { handleSendMessage, uploadedVisionFiles, setUploadedVisionFiles, setIsAiPaneOpen } = useNetra();

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="flex-1 flex flex-col h-full relative">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[var(--border)] bg-[var(--surface-2)]/50">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-widest text-[var(--text-1)]">MAYA</span>
          <span className="text-[8px] text-[var(--text-3)] font-mono opacity-60">UPLINK</span>
        </div>
        <button
          onClick={() => setIsAiPaneOpen(false)}
          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', color: 'var(--text-3)', cursor: 'pointer', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          className="hover:bg-red-500/20 hover:text-red-500 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-4 relative"
        style={{ background: darkMode ? 'transparent' : '#f8f9fa' }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <span style={{
            fontSize: '48px',
            fontFamily: "'Dancing Script', 'Brush Script MT', cursive",
            color: darkMode ? '#fff' : '#000',
            opacity: 0.05,
            transform: 'rotate(-10deg)',
            letterSpacing: '2px',
          }}>maya</span>
        </div>

        {chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} w-full mb-3`}>
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 20px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #4169E1 0%, #6366F1 100%)'
                  : 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                fontSize: '13px',
                lineHeight: '1.6',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              }}
              className="animate-in fade-in slide-in-from-bottom-1 duration-300 markdown-content"
            >
              <div className="prose prose-sm dark:prose-invert max-w-none text-inherit" style={{ fontFamily: 'inherit' }}>
                <MessageContent text={msg.text} />
              </div>
            </div>
          </div>
        ))}

        {isAiLoading && (
          <div className="flex justify-start">
            <div
              style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '20px 20px 20px 4px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}
              className="animate-pulse"
            >
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-white/5 bg-white/[0.02] flex flex-col">
        <div
          style={{
            background: darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '24px',
            padding: '4px',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.05)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
          className="group focus-within:border-indigo-500/50 transition-all"
        >
          {/* Advanced Parameters Panel */}
          {isConfigOpen && (
            <div className="w-full bg-white/[0.01] border-b border-white/10 p-4 space-y-4 rounded-t-[24px] animate-in slide-in-from-top duration-300">
              <div style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Advanced Parameters</div>
              <div className="space-y-4 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Temp</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{modelConfig.temperature.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={modelConfig.temperature}
                      onChange={(e) => dispatch(setModelConfig({ ...modelConfig, temperature: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#4169E1' }} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Penalty</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{(modelConfig.frequency_penalty || 0).toFixed(1)}</span>
                    </div>
                    <input type="range" min="0" max="2" step="0.1" value={modelConfig.frequency_penalty || 0}
                      onChange={(e) => dispatch(setModelConfig({ ...modelConfig, frequency_penalty: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#4169E1' }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Top P</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{(modelConfig.top_p || 1.0).toFixed(2)}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.05" value={modelConfig.top_p || 1.0}
                      onChange={(e) => dispatch(setModelConfig({ ...modelConfig, top_p: parseFloat(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#4169E1' }} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span style={{ fontSize: '8px', fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase' }}>Max Tokens</span>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1' }}>{modelConfig.max_tokens || 2048}</span>
                    </div>
                    <input type="range" min="1" max="4096" step="1" value={modelConfig.max_tokens || 2048}
                      onChange={(e) => dispatch(setModelConfig({ ...modelConfig, max_tokens: parseInt(e.target.value) }))}
                      style={{ width: '100%', accentColor: '#4169E1' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Image Previews */}
          {uploadedVisionFiles.length > 0 && (
            <div className="flex gap-2 p-2 border-b border-[var(--border)]">
              {uploadedVisionFiles.map((file, idx) => (
                <div key={idx} className="relative w-12 h-12">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover rounded-md" alt="Preview" />
                  <button
                    onClick={() => setUploadedVisionFiles([])}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--surface)] border border-[var(--border)] rounded-full flex items-center justify-center text-[var(--text-1)] text-xs hover:bg-red-500/20 hover:text-red-500 transition-colors"
                  >×</button>
                </div>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            value={chatInput}
            onChange={(e) => dispatch(setChatInput(e.target.value))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="Ask anything about the market..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '12px 14px',
              fontSize: '13px',
              color: 'var(--text-1)',
              outline: 'none',
              resize: 'none',
              height: '60px',
            }}
            className="custom-scrollbar"
          />

          {/* Toolbar */}
          <div className="flex items-center justify-between p-2 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              {/* Config */}
              <button
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className={`w-7 h-7 rounded-sm ${isConfigOpen ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'bg-transparent text-[var(--text-3)] border-[var(--border)]'} border flex items-center justify-center cursor-pointer hover:bg-indigo-500/10 hover:text-indigo-400 transition-all`}
                title="Model Configuration"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 12h6" />
                </svg>
              </button>

              {/* Upload */}
              <label className="w-7 h-7 flex items-center justify-center rounded-sm border border-[var(--border)] cursor-pointer text-[var(--text-3)] hover:text-[var(--text-1)] transition-colors">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) setUploadedVisionFiles([e.target.files[0]]);
                }} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </label>

              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.1)', margin: '0 2px' }} />

              {/* Model Selector */}
              <div className="relative flex items-center gap-1 cursor-pointer text-[11px] font-medium text-[var(--text-2)] hover:text-[var(--text-1)] transition-colors">
                <span>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name.split(',')[0] || 'Select Model'}</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                <select
                  value={selectedModel}
                  onChange={(e) => dispatch(setSelectedModel(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                >
                  {AVAILABLE_MODELS.map(m => (
                    <option key={m.id} value={m.id} className="bg-[var(--surface)] text-[var(--text-1)]">{m.name.split(',')[0]}</option>
                  ))}
                </select>
              </div>

              {/* Include Data */}
              <button
                onClick={() => dispatch(setIncludeData(!includeData))}
                style={{
                  height: '24px', width: '24px', borderRadius: '2px',
                  background: includeData ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  border: `1px solid ${includeData ? '#6366f1' : 'var(--border)'}`,
                  color: includeData ? '#818cf8' : 'var(--text-3)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                className="transition-all hover:border-indigo-500/50"
                title="Include Trade Data"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </button>

              {/* Include Doctrine */}
              <button
                onClick={() => dispatch(setIncludeDoctrine(!includeDoctrine))}
                style={{
                  height: '24px', width: '24px', borderRadius: '2px',
                  background: includeDoctrine ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                  border: `1px solid ${includeDoctrine ? '#6366f1' : 'var(--border)'}`,
                  color: includeDoctrine ? '#818cf8' : 'var(--text-3)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
                className="transition-all hover:border-indigo-500/50"
                title="Include Doctrine"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
                </svg>
              </button>
            </div>

            {/* Send */}
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isAiLoading}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                (!chatInput.trim() || isAiLoading)
                  ? 'bg-[var(--surface-3)] text-[var(--text-3)] cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#4169E1] to-[#6366F1] text-white hover:opacity-90 active:scale-95'
              }`}
            >
              {isAiLoading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
