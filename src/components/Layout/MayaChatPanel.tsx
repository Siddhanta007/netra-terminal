// The Maya chat sidebar — markdown messages, model + knowledge-source selectors, and vision attachments.

import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { useNetra } from '../../context/NetraContext';
import { setChatInput, ChatSource } from '../../store/slices/chatSlice';
import { setSelectedModel, setModelConfig } from '../../store/slices/modelSlice';
import { RootState, AppDispatch } from '../../store';

function MessageContent({ text, dark }: { text: string | unknown; dark: boolean }) {
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const match = str.match(thinkRegex);
  if (match) {
    const thinking = match[1];
    const response = str.replace(thinkRegex, '').trim();
    return (
      <>
        <details style={{ marginBottom: '8px', background: dark ? 'rgba(65,105,225,0.08)' : '#eff6ff', border: `1px solid ${dark ? 'rgba(65,105,225,0.2)' : 'rgba(65,105,225,0.2)'}`, padding: '8px 10px' }}>
          <summary style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Thinking</summary>
          <div style={{ marginTop: '6px', fontSize: '11px', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(15,23,42,0.6)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{thinking}</div>
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
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const chatHistory = useSelector((s: RootState) => s.chat.chatHistory);
  const chatInput = useSelector((s: RootState) => s.chat.chatInput);
  const isAiLoading = useSelector((s: RootState) => s.chat.isAiLoading);
  const sources = useSelector((s: RootState) => s.chat.sources);
  const selectedModel = useSelector((s: RootState) => s.model.selectedModel);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  const AVAILABLE_MODELS = useSelector((s: RootState) => s.model.availableModels);

  const { handleSendMessage, toggleSource, chatTitle, startNewChat, renameChat, summarizeNow, uploadedVisionFiles, setUploadedVisionFiles, session } = useNetra();

  const SOURCE_OPTIONS: { id: ChatSource; label: string }[] = [
    { id: 'terminal',    label: 'Terminal' },
    { id: 'doctrine',    label: 'Doctrine' },
    { id: 'historical',  label: 'History' },
    { id: 'information', label: 'Info' },
  ];

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Theme tokens
  const t = darkMode ? {
    panelBg: '#0d0d0d',
    headerBg: '#0d0d0d',
    headerBorder: 'rgba(255,255,255,0.08)',
    chatBg: '#0d0d0d',
    aiBubbleBg: 'rgba(255,255,255,0.05)',
    aiBubbleBorder: 'rgba(255,255,255,0.08)',
    aiBubbleText: '#e2e8f0',
    inputAreaBg: 'rgba(255,255,255,0.02)',
    inputBoxBg: 'rgba(255,255,255,0.03)',
    inputBoxBorder: 'rgba(255,255,255,0.1)',
    inputText: '#ffffff',
    inputPlaceholder: 'rgba(255,255,255,0.35)',
    toolbarBorder: 'rgba(255,255,255,0.08)',
    toolbarText: 'rgba(255,255,255,0.65)',
    toolbarBtnBorder: 'rgba(255,255,255,0.18)',
    toolbarHoverBg: 'rgba(255,255,255,0.06)',
    closeHoverBg: 'rgba(239,68,68,0.12)',
    paramsBg: 'rgba(255,255,255,0.02)',
    paramsBorder: 'rgba(255,255,255,0.08)',
    paramsText: 'rgba(255,255,255,0.5)',
    watermark: '#ffffff',
    emptyIcon: 'rgba(65,105,225,0.15)',
    emptyTitle: 'rgba(255,255,255,0.7)',
    emptyBody: 'rgba(255,255,255,0.3)',
    sepColor: 'rgba(255,255,255,0.15)',
  } : {
    panelBg: '#ffffff',
    headerBg: '#ffffff',
    headerBorder: 'rgba(65,105,225,0.15)',
    chatBg: '#f8fafc',
    aiBubbleBg: '#ffffff',
    aiBubbleBorder: 'rgba(15,23,42,0.1)',
    aiBubbleText: '#0f172a',
    inputAreaBg: '#ffffff',
    inputBoxBg: '#f8fafc',
    inputBoxBorder: 'rgba(65,105,225,0.2)',
    inputText: '#0f172a',
    inputPlaceholder: 'rgba(15,23,42,0.35)',
    toolbarBorder: 'rgba(65,105,225,0.12)',
    toolbarText: 'rgba(15,23,42,0.65)',
    toolbarBtnBorder: 'rgba(15,23,42,0.2)',
    toolbarHoverBg: 'rgba(65,105,225,0.06)',
    closeHoverBg: 'rgba(239,68,68,0.08)',
    paramsBg: '#f8fafc',
    paramsBorder: 'rgba(65,105,225,0.15)',
    paramsText: 'rgba(15,23,42,0.5)',
    watermark: '#0f172a',
    emptyIcon: 'rgba(65,105,225,0.08)',
    emptyTitle: '#0f172a',
    emptyBody: 'rgba(15,23,42,0.45)',
    sepColor: 'rgba(15,23,42,0.15)',
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', background: t.panelBg, position: 'relative', transition: 'background 300ms' }}>

      {/* Thread Header */}
      <div style={{ height: '46px', borderBottom: `1px solid ${t.headerBorder}`, background: t.headerBg, padding: '0 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexShrink: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: '8px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#4169E1', marginBottom: '2px' }}>Maya Chat</div>
          <div title={chatTitle} style={{ fontSize: '12px', fontWeight: 800, color: darkMode ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '220px' }}>
            {chatTitle || 'Maya Chat'}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            type="button"
            title="New chat"
            onClick={() => {
              const title = window.prompt('New Maya chat name', 'New chat');
              if (title !== null) startNewChat(title);
            }}
            style={{ width: '28px', height: '28px', border: `1px solid ${t.toolbarBtnBorder}`, background: darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff', color: '#4169E1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          </button>
          <button
            type="button"
            title="Rename chat"
            onClick={() => {
              const title = window.prompt('Rename Maya chat', chatTitle || 'Maya Chat');
              if (title !== null) renameChat(title);
            }}
            style={{ width: '28px', height: '28px', border: `1px solid ${t.toolbarBtnBorder}`, background: darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff', color: t.toolbarText, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button
            type="button"
            title="Summarize chat memory"
            onClick={summarizeNow}
            disabled={isAiLoading}
            style={{ width: '28px', height: '28px', border: `1px solid ${t.toolbarBtnBorder}`, background: darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff', color: t.toolbarText, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isAiLoading ? 'not-allowed' : 'pointer', opacity: isAiLoading ? 0.5 : 1 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><path d="M4 7h16M4 12h10M4 17h7"/></svg>
          </button>
        </div>
      </div>

      {/* Chat History */}
      <div
        ref={chatContainerRef}
        style={{ flex: 1, overflowY: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '12px', background: t.chatBg, position: 'relative' }}
        className="custom-scrollbar"
      >

        {chatHistory.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center', opacity: 0.8 }}>
            <div style={{ width: '40px', height: '40px', background: t.emptyIcon, border: `1px solid ${darkMode ? 'rgba(65,105,225,0.2)' : 'rgba(65,105,225,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 18V9L12 15L20 9V18" stroke="#4169E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="5" r="2" fill="#4169E1"/>
              </svg>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.15em', color: t.emptyTitle, marginBottom: '6px' }}>Maya is ready</div>
            <div style={{ fontSize: '10px', color: t.emptyBody, lineHeight: 1.55 }}>Ask about market conditions, trade setups, or get analysis on your data.</div>
          </div>
        )}

        {chatHistory.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', width: '100%' }}>
            {msg.role !== 'user' && (
              <div style={{ width: '24px', height: '24px', background: '#4169E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: '8px', alignSelf: 'flex-end' }}>
                <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><polygon points="7,1 13,4 13,10 7,13 1,10 1,4" fill="none" stroke="white" strokeWidth="1.5"/><circle cx="7" cy="7" r="2" fill="white"/></svg>
              </div>
            )}
            <div
              style={{
                maxWidth: '82%',
                padding: '10px 14px',
                background: msg.role === 'user' ? '#4169E1' : t.aiBubbleBg,
                color: msg.role === 'user' ? '#ffffff' : t.aiBubbleText,
                border: msg.role === 'user' ? 'none' : `1px solid ${t.aiBubbleBorder}`,
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '2px 12px 12px 12px',
                fontSize: '13px',
                lineHeight: 1.6,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
              className="animate-in fade-in slide-in-from-bottom-1 duration-200 markdown-content"
            >
              <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''}`} style={{ fontFamily: 'inherit', color: 'inherit' }}>
                <MessageContent text={msg.text} dark={darkMode} />
              </div>
            </div>
          </div>
        ))}

        {isAiLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', background: '#4169E1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><polygon points="7,1 13,4 13,10 7,13 1,10 1,4" fill="none" stroke="white" strokeWidth="1.5"/><circle cx="7" cy="7" r="2" fill="white"/></svg>
            </div>
            <div style={{ background: t.aiBubbleBg, border: `1px solid ${t.aiBubbleBorder}`, padding: '12px 16px', borderRadius: '2px 12px 12px 12px', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0, 0.1, 0.2].map((delay, i) => (
                <div key={i} className="animate-bounce" style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4169E1', animationDelay: `${delay}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${t.headerBorder}`, background: t.inputAreaBg, flexShrink: 0 }}>

        {/* Advanced Params Panel */}
        {isConfigOpen && (
          <div style={{ background: t.paramsBg, border: `1px solid ${t.paramsBorder}`, padding: '14px 16px', marginBottom: '10px' }}>
            <div style={{ fontSize: '8px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', color: '#4169E1', marginBottom: '12px' }}>Model Parameters</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
              {[
                { label: 'Temperature', key: 'temperature' as const, min: 0, max: 1, step: 0.05, val: modelConfig.temperature },
                { label: 'Freq Penalty', key: 'frequency_penalty' as const, min: 0, max: 2, step: 0.1, val: modelConfig.frequency_penalty || 0 },
                { label: 'Top P', key: 'top_p' as const, min: 0, max: 1, step: 0.05, val: modelConfig.top_p || 1.0 },
                { label: 'Max Tokens', key: 'max_tokens' as const, min: 1, max: 4096, step: 1, val: modelConfig.max_tokens || 2048 },
              ].map(p => (
                <div key={p.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '8px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.paramsText }}>{p.label}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#4169E1', fontFamily: 'monospace' }}>{p.val}</span>
                  </div>
                  <input type="range" min={p.min} max={p.max} step={p.step} value={p.val}
                    onChange={e => dispatch(setModelConfig({ ...modelConfig, [p.key]: p.key === 'max_tokens' ? parseInt(e.target.value) : parseFloat(e.target.value) }))}
                    style={{ width: '100%', accentColor: '#4169E1' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Image Previews */}
        {uploadedVisionFiles.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            {uploadedVisionFiles.map((file, idx) => (
              <div key={idx} style={{ position: 'relative', width: '48px', height: '48px' }}>
                <img src={URL.createObjectURL(file)} style={{ width: '100%', height: '100%', objectFit: 'cover', border: `1px solid ${t.aiBubbleBorder}` }} alt="Preview" />
                <button
                  onClick={() => setUploadedVisionFiles([])}
                  style={{ position: 'absolute', top: '-6px', right: '-6px', width: '16px', height: '16px', background: darkMode ? '#0d0d0d' : '#ffffff', border: `1px solid ${t.aiBubbleBorder}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '10px', color: '#ef4444' }}
                >×</button>
              </div>
            ))}
          </div>
        )}

        {/* Textarea container */}
        <div style={{ background: t.inputBoxBg, border: `1px solid ${t.inputBoxBorder}`, display: 'flex', flexDirection: 'column' }}>
          <textarea
            value={chatInput}
            onChange={e => dispatch(setChatInput(e.target.value))}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
            placeholder="Ask Maya anything about the market..."
            style={{ width: '100%', background: 'transparent', border: 'none', padding: '12px 14px', fontSize: '13px', color: t.inputText, outline: 'none', resize: 'none', height: '64px', fontFamily: 'inherit' }}
            className="custom-scrollbar"
          />

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderTop: `1px solid ${t.toolbarBorder}`, gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
              
              {/* Model selector (on the left) */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', flexShrink: 0 }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: t.toolbarText }}>{AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name.split(',')[0] || 'Model'}</span>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={t.toolbarText} strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                <select
                  value={selectedModel}
                  onChange={e => dispatch(setSelectedModel(e.target.value))}
                  style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', fontSize: '10px' }}
                >
                  {(() => {
                    const allowedModels = session?.allowedModels || [];
                    let filtered = AVAILABLE_MODELS.filter(m => {
                      if (allowedModels.includes('*')) return true;
                      return allowedModels.some((am: string) => m.id.toLowerCase().includes(am.toLowerCase()));
                    });
                    if (filtered.length === 0) {
                      filtered = AVAILABLE_MODELS;
                    }
                    return filtered.map(m => (
                      <option key={m.id} value={m.id}>{m.name.split(',')[0]}</option>
                    ));
                  })()}
                </select>
              </div>

              {/* Separator */}
              <div style={{ width: '1px', height: '14px', background: t.sepColor, margin: '0 2px', flexShrink: 0 }} />

              {/* Config toggle */}
              <button
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                title="Model Configuration"
                style={{ width: '26px', height: '26px', border: `1px solid ${isConfigOpen ? '#4169E1' : t.toolbarBtnBorder}`, background: isConfigOpen ? 'rgba(65,105,225,0.1)' : 'none', color: isConfigOpen ? '#4169E1' : t.toolbarText, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 150ms', flexShrink: 0 }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 12h6"/></svg>
              </button>

              {/* Upload image */}
              <label
                style={{ width: '26px', height: '26px', border: `1px solid ${t.toolbarBtnBorder}`, background: 'none', color: t.toolbarText, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 150ms', flexShrink: 0 }}
                title="Attach image"
              >
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) setUploadedVisionFiles([e.target.files[0]]); }} />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
              </label>

              {/* Separator */}
              <div style={{ width: '1px', height: '14px', background: t.sepColor, margin: '0 2px', flexShrink: 0 }} />

              {/* Context Source Multiselect Dropdown */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setSourcesOpen(o => !o)}
                  title="Toggle Context Sources"
                  style={{
                    height: '26px', padding: '0 8px',
                    border: `1px solid ${t.toolbarBtnBorder}`,
                    background: 'none',
                    color: t.toolbarText,
                    fontSize: '9px', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  <span>Sources ({sources.length})</span>
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {sourcesOpen && (
                  <>
                    <div onClick={() => setSourcesOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
                    <div style={{
                      position: 'absolute', bottom: '30px', left: 0, zIndex: 999,
                      background: darkMode ? '#0d0d0d' : '#ffffff',
                      border: `1px solid ${t.toolbarBorder}`,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                      display: 'flex', flexDirection: 'column', padding: '4px 0', minWidth: '100px'
                    }}>
                      {SOURCE_OPTIONS.map(opt => {
                        const on = sources.includes(opt.id);
                        return (
                          <div
                            key={opt.id}
                            onClick={() => toggleSource(opt.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '6px 12px', cursor: 'pointer',
                              background: on ? 'rgba(99,102,241,0.08)' : 'transparent',
                              color: on ? '#6366f1' : t.toolbarText,
                              fontSize: '9.5px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
                              transition: 'background 100ms'
                            }}
                            onMouseEnter={e => { if (!on) e.currentTarget.style.background = t.toolbarHoverBg; }}
                            onMouseLeave={e => { if (!on) e.currentTarget.style.background = 'transparent'; }}
                          >
                            <div style={{
                              width: '8px', height: '8px', borderRadius: '1px',
                              border: `1.5px solid ${on ? '#6366f1' : t.toolbarBtnBorder}`,
                              background: on ? '#6366f1' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                              {on && <span style={{ fontSize: '6px', color: 'white', fontWeight: 900 }}>✓</span>}
                            </div>
                            <span>{opt.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isAiLoading}
              style={{
                height: '28px', padding: '0 14px', border: 'none',
                background: (!chatInput.trim() || isAiLoading) ? (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.08)') : '#4169E1',
                color: (!chatInput.trim() || isAiLoading) ? t.toolbarText : '#ffffff',
                cursor: (!chatInput.trim() || isAiLoading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 150ms', fontFamily: 'inherit',
                flexShrink: 0
              }}
            >
              {isAiLoading ? (
                <div style={{ width: '12px', height: '12px', border: `2px solid ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(15,23,42,0.15)'}`, borderTopColor: '#4169E1', borderRadius: '50%' }} className="animate-spin" />
              ) : (
                <>
                  <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Send</span>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
