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

export interface ChatThreadSummary {
  chat_id: string;
  title: string;
  updated_at: string;
}

export function useChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, showToast, getActiveModel, checkGuestLimit, markGuestAiUsed } = useNetraUtils();

  const [uploadedVisionFiles, setUploadedVisionFiles] = useState<File[]>([]);
  const [chatTitle, setChatTitle] = useState('Maya Chat');
  const [chatThreads, setChatThreads] = useState<ChatThreadSummary[]>([]);
  const [isChatThreadsLoading, setIsChatThreadsLoading] = useState(false);

  const chatHistory = useSelector((s: RootState) => s.chat.chatHistory);
  const chatInput = useSelector((s: RootState) => s.chat.chatInput);
  const isAiLoading = useSelector((s: RootState) => s.chat.isAiLoading);
  const sources = useSelector((s: RootState) => s.chat.sources);
  const chatId = useSelector((s: RootState) => s.chat.chatId);
  const session = useSelector((s: RootState) => s.session.session);
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);
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

  const loadChatThreads = useCallback(async () => {
    setIsChatThreadsLoading(true);
    try {
      const userId = session?.userName || 'Unknown';
      const res = await fetch(`${API_BASE}/api/chat/threads?user_id=${encodeURIComponent(userId)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Chat history failed');
      const threads = await res.json() as ChatThreadSummary[];
      const normalized = Array.isArray(threads) ? threads : [];
      setChatThreads(normalized);
      return normalized;
    } catch {
      showToast('Could not load Maya chat history', 'error');
      return [];
    } finally {
      setIsChatThreadsLoading(false);
    }
  }, [getAuthHeaders, session?.userName, showToast]);

  const openChatThread = useCallback(async (targetChatId: string) => {
    if (!targetChatId || isAiLoading) return false;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(targetChatId)}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Chat load failed');
      const thread = await res.json() as {
        chat_id?: string;
        title?: string;
        messages?: ChatMessage[];
      };
      dispatch(setChatHistory(Array.isArray(thread.messages) ? thread.messages : []));
      dispatch(setChatInput(''));
      dispatch(setChatId(thread.chat_id || targetChatId));
      setChatTitle(thread.title || 'New chat');
      setUploadedVisionFiles([]);
      return true;
    } catch {
      showToast('Could not open Maya chat', 'error');
      return false;
    }
  }, [dispatch, getAuthHeaders, isAiLoading, showToast]);

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
      if (thread.chat_id) {
        setChatThreads(previous => [
          {
            chat_id: thread.chat_id as string,
            title: thread.title || cleanTitle,
            updated_at: new Date().toISOString(),
          },
          ...previous.filter(item => item.chat_id !== thread.chat_id),
        ]);
      }
      showToast('New Maya chat created');
    } catch {
      showToast('Could not create Maya chat', 'error');
    }
  }, [dispatch, getAuthHeaders, session?.userName, showToast]);

  const renameChatThread = useCallback(async (targetChatId: string, title: string) => {
    const cleanTitle = title.trim();
    if (!targetChatId || !cleanTitle) return false;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(targetChatId)}`, {
        method: 'PATCH',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: cleanTitle }),
      });
      if (!res.ok) throw new Error('Chat rename failed');
      const data = await res.json() as { title?: string; updated_at?: string };
      const savedTitle = data.title || cleanTitle;
      setChatThreads(previous => previous.map(thread => (
        thread.chat_id === targetChatId
          ? { ...thread, title: savedTitle, updated_at: data.updated_at || thread.updated_at }
          : thread
      )));
      if (targetChatId === chatId) setChatTitle(savedTitle);
      showToast('Maya chat renamed');
      return true;
    } catch {
      showToast('Could not rename Maya chat', 'error');
      return false;
    }
  }, [chatId, getAuthHeaders, showToast]);

  const renameChat = useCallback(async (title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (!chatId) {
      await startNewChat(cleanTitle);
      return;
    }

    await renameChatThread(chatId, cleanTitle);
  }, [chatId, renameChatThread, startNewChat]);

  const deleteChatThread = useCallback(async (targetChatId: string) => {
    if (!targetChatId || isAiLoading) return false;
    try {
      const res = await fetch(`${API_BASE}/api/chat/${encodeURIComponent(targetChatId)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Chat delete failed');
      setChatThreads(previous => previous.filter(thread => thread.chat_id !== targetChatId));
      if (targetChatId === chatId) {
        dispatch(setChatHistory([]));
        dispatch(setChatInput(''));
        dispatch(setChatId(null));
        setChatTitle('Maya Chat');
        setUploadedVisionFiles([]);
      }
      showToast('Maya chat deleted');
      return true;
    } catch {
      showToast('Could not delete Maya chat', 'error');
      return false;
    }
  }, [chatId, dispatch, getAuthHeaders, isAiLoading, showToast]);

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
      // Send identity only. The backend rebuilds the same compact, data.json-driven
      // agent context used by the H1/H2 workflows from the persisted terminal.
      const contextObj = sources.includes('terminal') ? {
        session_id: activeSessionId || activeEditLog?.id || null,
        asset: session?.assetName || activeEditLog?.phase1?.asset_ticker || '',
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
  }, [chatInput, isAiLoading, uploadedVisionFiles, sources, chatId, session, activeSessionId, activeEditLog, modelConfig, dispatch, getActiveModel, getAuthHeaders, showToast, checkGuestLimit, markGuestAiUsed]);

  return {
    chatHistory, chatInput, isAiLoading, sources, chatId, chatTitle,
    chatThreads, isChatThreadsLoading,
    uploadedVisionFiles, setUploadedVisionFiles,
    handleSendMessage, toggleSource: toggle, startNewChat, renameChat, summarizeNow,
    loadChatThreads, openChatThread, renameChatThread, deleteChatThread,
  };
}
