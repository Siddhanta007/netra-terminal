// MAYA chat sidebar — conversation, model controls, tools/agents, and vision attachments.

import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ReactMarkdown from 'react-markdown';
import { useNetra } from '../../context/NetraContext';
import { setChatInput, type ChatSource } from '../../store/slices/chatSlice';
import { setSelectedModel, setModelConfig } from '../../store/slices/modelSlice';
import type { RootState, AppDispatch } from '../../store';

function MayaMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`maya-chat-mark ${small ? 'is-small' : ''}`} aria-hidden="true">
      <svg width={small ? 10 : 14} height={small ? 10 : 14} viewBox="0 0 14 14" fill="none">
        <polygon points="7,1 13,4 13,10 7,13 1,10 1,4" stroke="currentColor" strokeWidth="1.35" />
        <circle cx="7" cy="7" r="1.8" fill="currentColor" />
      </svg>
    </span>
  );
}

function MessageContent({ text, dark }: { text: string | unknown; dark: boolean }) {
  const str = typeof text === 'string' ? text : JSON.stringify(text);
  const thinkRegex = /<think>([\s\S]*?)<\/think>/;
  const match = str.match(thinkRegex);
  if (!match) return <ReactMarkdown>{str}</ReactMarkdown>;

  const thinking = match[1];
  const response = str.replace(thinkRegex, '').trim();
  return (
    <>
      <details className="maya-chat-thinking" data-dark={dark ? 'true' : undefined}>
        <summary>Reasoning trace</summary>
        <div>{thinking}</div>
      </details>
      <ReactMarkdown>{response}</ReactMarkdown>
    </>
  );
}

function formatThreadTime(value?: string) {
  if (!value) return 'No activity yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Saved conversation';
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  return sameDay
    ? `Today · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : date.toLocaleDateString([], { day: '2-digit', month: 'short', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}

export default function MayaChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const threadTitleInputRef = useRef<HTMLInputElement>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [threadEditor, setThreadEditor] = useState<'new' | 'rename' | null>(null);
  const [threadTitleDraft, setThreadTitleDraft] = useState('');
  const [isThreadSaving, setIsThreadSaving] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [openingThreadId, setOpeningThreadId] = useState<string | null>(null);
  const [renamingThreadId, setRenamingThreadId] = useState<string | null>(null);
  const [historyTitleDraft, setHistoryTitleDraft] = useState('');
  const [savingThreadId, setSavingThreadId] = useState<string | null>(null);
  const [confirmDeleteThreadId, setConfirmDeleteThreadId] = useState<string | null>(null);
  const [deletingThreadId, setDeletingThreadId] = useState<string | null>(null);

  const chatHistory = useSelector((state: RootState) => state.chat.chatHistory);
  const chatInput = useSelector((state: RootState) => state.chat.chatInput);
  const isAiLoading = useSelector((state: RootState) => state.chat.isAiLoading);
  const sources = useSelector((state: RootState) => state.chat.sources);
  const selectedModel = useSelector((state: RootState) => state.model.selectedModel);
  const modelConfig = useSelector((state: RootState) => state.model.modelConfig);
  const darkMode = useSelector((state: RootState) => state.ui.darkMode);
  const availableModels = useSelector((state: RootState) => state.model.availableModels);

  const {
    handleSendMessage,
    toggleSource,
    chatId,
    chatTitle,
    chatThreads,
    isChatThreadsLoading,
    loadChatThreads,
    openChatThread,
    renameChatThread,
    deleteChatThread,
    startNewChat,
    renameChat,
    summarizeNow,
    uploadedVisionFiles,
    setUploadedVisionFiles,
    session,
  } = useNetra();

  const toolOptions: Array<{ id: ChatSource; label: string; detail: string; kind: 'Tool' | 'Agent' }> = [
    { id: 'terminal', label: 'Terminal Context', detail: 'Current captured workflow', kind: 'Tool' },
    { id: 'doctrine', label: 'Doctrine RAG', detail: 'Pinaka rules and books', kind: 'Tool' },
    { id: 'historical', label: 'Historian', detail: 'Past trades and outcomes', kind: 'Agent' },
    { id: 'information', label: 'Knowledge RAG', detail: 'Reference information', kind: 'Tool' },
    { id: 'news', label: 'Brave News', detail: 'Current external evidence', kind: 'Tool' },
  ];

  useEffect(() => {
    if (chatContainerRef.current) chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  }, [chatHistory, isAiLoading]);

  useEffect(() => {
    if (threadEditor) threadTitleInputRef.current?.focus();
  }, [threadEditor]);

  const visibleThreadTitle = !chatTitle || chatTitle.trim().toLowerCase() === 'maya chat'
    ? 'New conversation'
    : chatTitle;

  const openThreadEditor = (mode: 'new' | 'rename') => {
    setIsHistoryOpen(false);
    setThreadTitleDraft(mode === 'new' ? 'New conversation' : visibleThreadTitle);
    setThreadEditor(mode);
  };

  const submitThreadTitle = async (event: FormEvent) => {
    event.preventDefault();
    const title = threadTitleDraft.trim();
    if (!title || isThreadSaving) return;
    setIsThreadSaving(true);
    try {
      if (threadEditor === 'new') await startNewChat(title);
      else await renameChat(title);
      setThreadEditor(null);
    } finally {
      setIsThreadSaving(false);
    }
  };

  const toggleHistory = () => {
    const shouldOpen = !isHistoryOpen;
    setIsHistoryOpen(shouldOpen);
    setThreadEditor(null);
    setRenamingThreadId(null);
    setConfirmDeleteThreadId(null);
    if (shouldOpen) void loadChatThreads();
  };

  const selectThread = async (targetChatId: string) => {
    if (openingThreadId || isAiLoading) return;
    setOpeningThreadId(targetChatId);
    const opened = await openChatThread(targetChatId);
    setOpeningThreadId(null);
    if (opened) setIsHistoryOpen(false);
  };

  const beginHistoryRename = (targetChatId: string, title: string) => {
    setRenamingThreadId(targetChatId);
    setHistoryTitleDraft(title);
    setConfirmDeleteThreadId(null);
  };

  const saveHistoryRename = async (event: FormEvent, targetChatId: string) => {
    event.preventDefault();
    const title = historyTitleDraft.trim();
    if (!title || savingThreadId) return;
    setSavingThreadId(targetChatId);
    const renamed = await renameChatThread(targetChatId, title);
    setSavingThreadId(null);
    if (renamed) setRenamingThreadId(null);
  };

  const removeThread = async (targetChatId: string) => {
    if (deletingThreadId || isAiLoading) return;
    setDeletingThreadId(targetChatId);
    const deleted = await deleteChatThread(targetChatId);
    setDeletingThreadId(null);
    if (deleted) setConfirmDeleteThreadId(null);
  };

  const allowedModels = session?.allowedModels || [];
  const permittedModels = availableModels.filter(model => (
    allowedModels.includes('*')
    || allowedModels.some((allowed: string) => model.id.toLowerCase().includes(allowed.toLowerCase()))
  ));
  const modelOptions = permittedModels.length > 0 ? permittedModels : availableModels;
  const activeModelName = availableModels.find(model => model.id === selectedModel)?.name.split(',')[0] || 'Model';

  const colors = darkMode ? {
    panel: '#0e1015', header: '#101218', chat: '#0a0c11', surface: '#151821',
    border: 'rgba(166,177,199,0.12)', strongBorder: 'rgba(166,177,199,0.22)', text: '#f4f6fb',
    muted: 'rgba(218,224,237,0.54)', soft: '#121620', aiText: '#e5e9f2',
    shadow: 'rgba(0,0,0,0.5)', matte: '#11141b', matteRaised: '#181c25', matteAccent: '#1b2740',
  } : {
    panel: '#f8f9fc', header: '#fafbfe', chat: '#f0f2f7', surface: '#f8f9fc',
    border: 'rgba(42,53,72,0.11)', strongBorder: 'rgba(42,53,72,0.19)', text: '#131a29',
    muted: 'rgba(35,45,63,0.54)', soft: '#f0f3f8', aiText: '#131a29',
    shadow: 'rgba(32,42,58,0.16)', matte: '#eef1f6', matteRaised: '#f8f9fc', matteAccent: '#e5ebf8',
  };
  const panelTheme = {
    '--maya-panel': colors.panel,
    '--maya-header': colors.header,
    '--maya-chat': colors.chat,
    '--maya-surface': colors.surface,
    '--maya-border': colors.border,
    '--maya-border-strong': colors.strongBorder,
    '--maya-text': colors.text,
    '--maya-muted': colors.muted,
    '--maya-soft': colors.soft,
    '--maya-ai-text': colors.aiText,
    '--maya-shadow': colors.shadow,
    '--maya-matte': colors.matte,
    '--maya-matte-raised': colors.matteRaised,
    '--maya-matte-accent': colors.matteAccent,
  } as CSSProperties;

  const params = [
    { label: 'Temperature', key: 'temperature' as const, min: 0, max: 1, step: 0.05, value: modelConfig.temperature },
    { label: 'Frequency penalty', key: 'frequency_penalty' as const, min: 0, max: 2, step: 0.1, value: modelConfig.frequency_penalty || 0 },
    { label: 'Top P', key: 'top_p' as const, min: 0, max: 1, step: 0.05, value: modelConfig.top_p || 1 },
    { label: 'Token limit', key: 'max_tokens' as const, min: 1, max: 4096, step: 1, value: modelConfig.max_tokens || 2048 },
  ];

  return (
    <section className="maya-chat-panel" style={panelTheme}>
      <header className="maya-chat-header">
        <button type="button" className="maya-chat-history-trigger" onClick={toggleHistory} aria-expanded={isHistoryOpen} aria-controls="maya-chat-history-drawer" title="Conversation history">
          <MayaMark />
          <div className="maya-chat-title-copy">
            <span className="maya-chat-brand">MAYA</span>
            <span className="maya-chat-thread-title" title={visibleThreadTitle}>{visibleThreadTitle}</span>
          </div>
          <svg className={`maya-chat-history-chevron ${isHistoryOpen ? 'is-open' : ''}`} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
        </button>
        <div className="maya-chat-header-actions">
          <button type="button" className="maya-chat-icon-button tone-blue" onClick={() => openThreadEditor('new')} aria-label="New conversation" title="New conversation">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
          </button>
          <button type="button" className="maya-chat-icon-button tone-amber" onClick={() => openThreadEditor('rename')} aria-label="Rename conversation" title="Rename conversation">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
          </button>
          <button type="button" className="maya-chat-icon-button tone-cyan" onClick={summarizeNow} disabled={isAiLoading || chatHistory.length === 0} aria-label="Compact conversation memory" title="Compact conversation memory">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M7 11h10M9 16h6" /><path d="m10 20 2 2 2-2" /></svg>
          </button>
        </div>
      </header>

      {isHistoryOpen && (
        <section id="maya-chat-history-drawer" className="maya-chat-history-drawer" aria-label="Maya conversation history">
          <header>
            <div>
              <span>Conversations</span>
              <small>{chatThreads.length === 1 ? '1 saved chat' : `${chatThreads.length} saved chats`}</small>
            </div>
            <button type="button" onClick={() => void loadChatThreads()} disabled={isChatThreadsLoading} aria-label="Refresh conversations" title="Refresh conversations">
              <svg className={isChatThreadsLoading ? 'is-spinning' : ''} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 11a8.1 8.1 0 1 0 .2 3" /><path d="M20 4v7h-7" /></svg>
            </button>
          </header>

          <div className="maya-chat-thread-list custom-scrollbar">
            {isChatThreadsLoading && chatThreads.length === 0 && (
              <div className="maya-chat-thread-state" role="status">
                <span className="netra-loading-dots" aria-hidden="true"><i /><i /><i /></span>
                <span>Loading conversations</span>
              </div>
            )}

            {!isChatThreadsLoading && chatThreads.length === 0 && (
              <div className="maya-chat-thread-state is-empty">
                <MayaMark small />
                <span>No saved conversations</span>
                <small>Use the plus button to start one.</small>
              </div>
            )}

            {chatThreads.map(thread => {
              const isActive = thread.chat_id === chatId;
              const isRenaming = renamingThreadId === thread.chat_id;
              const isConfirmingDelete = confirmDeleteThreadId === thread.chat_id;
              return (
                <article key={thread.chat_id} className={`maya-chat-thread-row ${isActive ? 'is-active' : ''}`}>
                  {isRenaming ? (
                    <form className="maya-chat-thread-inline-form" onSubmit={event => saveHistoryRename(event, thread.chat_id)}>
                      <input
                        autoFocus
                        value={historyTitleDraft}
                        onChange={event => setHistoryTitleDraft(event.target.value)}
                        onKeyDown={event => { if (event.key === 'Escape') setRenamingThreadId(null); }}
                        maxLength={80}
                        aria-label={`Rename ${thread.title}`}
                      />
                      <button type="button" onClick={() => setRenamingThreadId(null)}>Cancel</button>
                      <button type="submit" disabled={!historyTitleDraft.trim() || savingThreadId === thread.chat_id}>{savingThreadId === thread.chat_id ? 'Saving…' : 'Save'}</button>
                    </form>
                  ) : isConfirmingDelete ? (
                    <div className="maya-chat-thread-delete-confirm">
                      <div><strong>Delete this conversation?</strong><small>This cannot be recovered.</small></div>
                      <button type="button" onClick={() => setConfirmDeleteThreadId(null)}>Cancel</button>
                      <button type="button" className="is-danger" onClick={() => void removeThread(thread.chat_id)} disabled={deletingThreadId === thread.chat_id}>{deletingThreadId === thread.chat_id ? 'Deleting…' : 'Delete'}</button>
                    </div>
                  ) : (
                    <>
                      <button type="button" className="maya-chat-thread-open" onClick={() => void selectThread(thread.chat_id)} disabled={Boolean(openingThreadId) || isAiLoading}>
                        <span title={thread.title}>{thread.title || 'Untitled conversation'}</span>
                        <small>{openingThreadId === thread.chat_id ? 'Opening…' : formatThreadTime(thread.updated_at)}</small>
                      </button>
                      <div className="maya-chat-thread-actions">
                        <button type="button" onClick={() => beginHistoryRename(thread.chat_id, thread.title)} disabled={isAiLoading} aria-label={`Rename ${thread.title}`} title="Rename">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                        </button>
                        <button type="button" className="is-danger" onClick={() => { setConfirmDeleteThreadId(thread.chat_id); setRenamingThreadId(null); }} disabled={isAiLoading} aria-label={`Delete ${thread.title}`} title="Delete">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {threadEditor && (
        <form className="maya-chat-thread-editor" onSubmit={submitThreadTitle}>
          <div>
            <span>{threadEditor === 'new' ? 'New conversation' : 'Rename conversation'}</span>
            <small>Stored with Maya chat history</small>
          </div>
          <input
            ref={threadTitleInputRef}
            value={threadTitleDraft}
            onChange={event => setThreadTitleDraft(event.target.value)}
            onKeyDown={event => { if (event.key === 'Escape') setThreadEditor(null); }}
            maxLength={80}
            aria-label="Conversation title"
          />
          <button type="button" onClick={() => setThreadEditor(null)}>Cancel</button>
          <button type="submit" disabled={!threadTitleDraft.trim() || isThreadSaving}>{isThreadSaving ? 'Saving…' : threadEditor === 'new' ? 'Create' : 'Save'}</button>
        </form>
      )}

      <div ref={chatContainerRef} className="maya-chat-history custom-scrollbar">
        {chatHistory.length === 0 && (
          <div className="maya-chat-empty">
            <MayaMark />
            <span>Conversation ready</span>
            <p>Ask Maya to inspect terminal context, doctrine, history, knowledge, or current news.</p>
          </div>
        )}

        {chatHistory.map((message, index) => (
          <article key={index} className={`maya-chat-message is-${message.role === 'user' ? 'user' : 'maya'}`}>
            {message.role !== 'user' && <MayaMark small />}
            <div className="maya-chat-bubble markdown-content">
              <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                <MessageContent text={message.text} dark={darkMode} />
              </div>
            </div>
          </article>
        ))}

        {isAiLoading && (
          <div className="maya-chat-message is-maya is-loading" role="status" aria-live="polite" aria-label="Maya is responding">
            <MayaMark small />
            <div className="maya-chat-bubble">
              <span>Maya is working</span>
              <span className="netra-loading-dots" aria-hidden="true"><i /><i /><i /></span>
            </div>
          </div>
        )}
      </div>

      <footer className="maya-chat-composer-area">
        {isConfigOpen && (
          <section className="maya-chat-config-panel">
            <header>
              <div>
                <span>Response controls</span>
                <small>Fine-tune this conversation only</small>
              </div>
              <button type="button" onClick={() => setIsConfigOpen(false)} aria-label="Close response controls">×</button>
            </header>
            <div className="maya-chat-param-grid">
              {params.map(param => (
                <label key={param.key} className="maya-chat-param">
                  <span><span>{param.label}</span><output>{param.value}</output></span>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={param.value}
                    onChange={event => dispatch(setModelConfig({
                      ...modelConfig,
                      [param.key]: param.key === 'max_tokens' ? parseInt(event.target.value, 10) : parseFloat(event.target.value),
                    }))}
                  />
                </label>
              ))}
            </div>
          </section>
        )}

        {uploadedVisionFiles.length > 0 && (
          <div className="maya-chat-attachments">
            {uploadedVisionFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="maya-chat-attachment">
                <img src={URL.createObjectURL(file)} alt="Attached chart preview" />
                <span title={file.name}>{file.name}</span>
                <button type="button" onClick={() => setUploadedVisionFiles(uploadedVisionFiles.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}>×</button>
              </div>
            ))}
          </div>
        )}

        <div className="maya-chat-composer">
          <textarea
            value={chatInput}
            onChange={event => dispatch(setChatInput(event.target.value))}
            onKeyDown={event => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask Maya about this market…"
            rows={3}
            className="custom-scrollbar"
          />

          <div className="maya-chat-composer-toolbar">
            <div className="maya-chat-composer-tools">
              <label className="maya-chat-model-select" title="Model tier">
                <span>Tier</span>
                <strong>{activeModelName}</strong>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                <select value={selectedModel} onChange={event => dispatch(setSelectedModel(event.target.value))} aria-label="Model tier">
                  {modelOptions.map(model => <option key={model.id} value={model.id}>{model.name.split(',')[0]}</option>)}
                </select>
              </label>

              <button type="button" className={`maya-chat-tool-button ${isConfigOpen ? 'is-active' : ''}`} onClick={() => setIsConfigOpen(open => !open)} aria-label="Response configuration" title="Response configuration">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 12h6" /></svg>
              </button>

              <label className="maya-chat-tool-button" title="Attach image">
                <input type="file" accept="image/*" onChange={event => { if (event.target.files?.[0]) setUploadedVisionFiles([event.target.files[0]]); }} />
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m21.4 11.1-9.2 9.1a6 6 0 0 1-8.5-8.5l9.2-9.1a4 4 0 1 1 5.7 5.6l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5" /></svg>
              </label>

              <div className="maya-chat-tools-menu">
                <button type="button" className={`maya-chat-tools-trigger ${toolsOpen ? 'is-active' : ''}`} onClick={() => setToolsOpen(open => !open)} aria-expanded={toolsOpen}>
                  <span>Tools &amp; Agents</span>
                  <em>{sources.length}</em>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6" /></svg>
                </button>
                {toolsOpen && (
                  <>
                    <button type="button" className="maya-chat-menu-backdrop" onClick={() => setToolsOpen(false)} aria-label="Close tools and agents" />
                    <div className="maya-chat-tools-popover">
                      <header>
                        <div><span>Evidence access</span><small>Sources Maya may use in this chat</small></div>
                        <em>{sources.length} active</em>
                      </header>
                      <div className="maya-chat-tools-list">
                        {toolOptions.map(option => {
                          const selected = sources.includes(option.id);
                          return (
                            <button
                              type="button"
                              key={option.id}
                              className={selected ? 'is-selected' : ''}
                              onClick={() => toggleSource(option.id)}
                              aria-pressed={selected}
                            >
                              <span className={`maya-chat-tool-icon is-${option.kind.toLowerCase()}`} aria-hidden="true">
                                {option.kind === 'Agent' ? (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M12 3v3M5.6 5.6l2.1 2.1M3 12h3M18 12h3M16.3 7.7l2.1-2.1" />
                                    <path d="M8 15.5a5 5 0 1 1 8 0L14.7 17H9.3L8 15.5Z" />
                                    <path d="M9.5 20h5" />
                                  </svg>
                                ) : (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" />
                                    <path d="m8.2 10.8 7.6-3.6M8.2 13.2l7.6 3.6" />
                                  </svg>
                                )}
                              </span>
                              <span className="maya-chat-tool-copy"><strong>{option.label}</strong><small>{option.detail}</small></span>
                              <span className="maya-chat-tool-switch" aria-hidden="true"><i /></span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <button type="button" className="maya-chat-send" onClick={handleSendMessage} disabled={!chatInput.trim() || isAiLoading} aria-label="Send message" title="Send message">
              {isAiLoading
                ? <span className="netra-loading-dots" aria-hidden="true"><i /><i /><i /></span>
                : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m5 12 14-7-4 14-3-6Z" /><path d="m12 13 7-8" /></svg>}
            </button>
          </div>
        </div>
        <div className="maya-chat-composer-hint"><span>Enter to send · Shift + Enter for a new line</span><span>{chatInput.length}</span></div>
      </footer>
    </section>
  );
}
