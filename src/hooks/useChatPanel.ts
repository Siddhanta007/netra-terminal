// Hook — the Maya chat panel: send/stream messages, manage history, sources, and vision attachments.

import { useState, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  appendChatMessage, setChatInput, setIsAiLoading,
  setChatHistory, setChatId, toggleSource, ChatSource,
} from '../store/slices/chatSlice';
import { ChatMessage } from '../types';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';

export function useChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, showToast, getActiveModel, checkGuestLimit, markGuestAiUsed } = useNetraUtils();

  const [uploadedVisionFiles, setUploadedVisionFiles] = useState<File[]>([]);
  const [chatTitle, setChatTitle] = useState('Maya Chat');

  const chatHistory = useSelector((s: RootState) => s.chat.chatHistory);
  const chatInput = useSelector((s: RootState) => s.chat.chatInput);
  const isAiLoading = useSelector((s: RootState) => s.chat.isAiLoading);
  const sources = useSelector((s: RootState) => s.chat.sources);
  const chatId = useSelector((s: RootState) => s.chat.chatId);
  const session = useSelector((s: RootState) => s.session.session);
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);

  // Rehydrate the active thread from the server on first mount
  useEffect(() => {
    if (!chatId) return;
    fetch(`${API_BASE}/api/chat/${encodeURIComponent(chatId)}`, { headers: getAuthHeaders() })
      .then(r => (r.ok ? r.json() : null))
      .then((thread: { messages?: ChatMessage[]; title?: string } | null) => {
        if (thread?.messages) dispatch(setChatHistory(thread.messages));
        if (thread?.title) setChatTitle(thread.title);
      })
      .catch(() => { /* offline / not found — keep local view */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = useCallback((s: ChatSource) => dispatch(toggleSource(s)), [dispatch]);

  const startNewChat = useCallback(async (title = 'New chat') => {
    const cleanTitle = title.trim() || 'New chat';
    try {
      const res = await fetch(`${API_BASE}/api/chat/new`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ user_id: session?.userName || 'Unknown', title: cleanTitle }),
      });
      if (!res.ok) throw new Error('Chat create failed');
      const thread = await res.json() as { chat_id?: string; title?: string };
      dispatch(setChatHistory([]));
      dispatch(setChatInput(''));
      dispatch(setChatId(thread.chat_id || null));
      setChatTitle(thread.title || cleanTitle);
      showToast('New Maya chat created');
    } catch {
      showToast('Could not create Maya chat', 'error');
    }
  }, [dispatch, getAuthHeaders, session?.userName, showToast]);

  const renameChat = useCallback(async (title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (!chatId) {
      await startNewChat(cleanTitle);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(chatId)}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: cleanTitle }),
      });
      if (!res.ok) throw new Error('Chat rename failed');
      const data = await res.json() as { title?: string };
      setChatTitle(data.title || cleanTitle);
      showToast('Maya chat renamed');
    } catch {
      showToast('Could not rename Maya chat', 'error');
    }
  }, [chatId, getAuthHeaders, showToast, startNewChat]);

  const summarizeNow = useCallback(async () => {
    if (!chatId || isAiLoading) return;
    dispatch(setIsAiLoading(true));
    try {
      const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
      const res = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(chatId)}/summarize`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ provider: providerVal, model_config: { ...modelConfig, model_id: modelIdVal } }),
      });
      const data = await res.json() as { summarized?: boolean; dropped?: number; reason?: string };
      if (data?.summarized) {
        // Reload the now-compacted thread so the UI reflects the trimmed history
        const t = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(chatId)}`, { headers: getAuthHeaders() })
          .then(r => (r.ok ? r.json() : null));
        if (t?.messages) dispatch(setChatHistory(t.messages));
        showToast(`Summarized ${data.dropped} older messages`);
      } else {
        showToast(data?.reason === 'nothing to summarize' ? 'Not enough history to summarize' : 'Nothing to summarize', 'info');
      }
    } catch {
      showToast('Summarize failed', 'error');
    } finally {
      dispatch(setIsAiLoading(false));
    }
  }, [chatId, isAiLoading, dispatch, getActiveModel, getAuthHeaders, modelConfig, showToast]);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isAiLoading) return;
    if (!checkGuestLimit()) { showToast('Guest limit reached — sign in to continue', 'error'); return; }

    const userMsg = { role: 'user' as const, text: chatInput };
    dispatch(appendChatMessage(userMsg));
    dispatch(setChatInput(''));
    dispatch(setIsAiLoading(true));

    let image_base64: string | null = null;
    let image_type: string | null = null;

    if (uploadedVisionFiles.length > 0) {
      const file = uploadedVisionFiles[0];
      image_type = file.type;
      const readAsDataURL = (f: File) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });
      try {
        const dataUrl = await readAsDataURL(file);
        image_base64 = dataUrl.split(',')[1];
      } catch {
        if (import.meta.env.DEV) console.error('Failed to read file as base64');
      }
    }

    try {
      // Terminal context is attached only when the user selected the "terminal" source
      const contextObj = sources.includes('terminal') ? {
        asset: session?.assetName || activeEditLog?.phase1?.asset_ticker,
        selections, notes,
        active_log_id: activeEditLog?.id,
        current_step: highestStep,
        image_description: imageDescription,
      } : null;

      const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          chat_id: chatId,
          user_id: session?.userName || 'Unknown',
          message: userMsg.text,
          sources,
          context_data: contextObj,
          provider: providerVal,
          llm_config: { ...modelConfig, model_id: modelIdVal },
          image_base64,
          image_type,
        }),
      });

      if (!response.ok) throw new Error('Neural Link Timeout');
      const envelope = await response.json() as { data?: { text: string }; text?: string; chat_id?: string };

      // Persist the server-assigned thread id (first message of a new thread)
      if (envelope?.chat_id && envelope.chat_id !== chatId) {
        dispatch(setChatId(envelope.chat_id));
        setChatTitle(userMsg.text.slice(0, 60) || 'New chat');
      }

      const text = envelope?.data?.text ?? envelope?.text ?? 'No response';
      dispatch(appendChatMessage({ role: 'ai', text }));
      markGuestAiUsed();
      setUploadedVisionFiles([]);
    } catch {
      showToast('NETRA Neural Link Interrupted', 'error');
      dispatch(appendChatMessage({ role: 'ai', text: 'Protocol error: My neural link was interrupted. Please retry.' }));
    } finally {
      dispatch(setIsAiLoading(false));
    }
  }, [chatInput, isAiLoading, uploadedVisionFiles, sources, chatId, chatHistory, session, activeEditLog, highestStep, selections, notes, imageDescription, modelConfig, dispatch, getActiveModel, getAuthHeaders, showToast, checkGuestLimit, markGuestAiUsed]);

  return {
    chatHistory, chatInput, isAiLoading, sources, chatTitle,
    uploadedVisionFiles, setUploadedVisionFiles,
    handleSendMessage, toggleSource: toggle, startNewChat, renameChat, summarizeNow,
  };
}
