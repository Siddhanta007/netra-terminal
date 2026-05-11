import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { appendChatMessage, setChatInput, setIsAiLoading } from '../store/slices/chatSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';

export function useChatPanel() {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, showToast, getActiveModel } = useNetraUtils();

  const [uploadedVisionFiles, setUploadedVisionFiles] = useState<File[]>([]);

  const chatHistory = useSelector((s: RootState) => s.chat.chatHistory);
  const chatInput = useSelector((s: RootState) => s.chat.chatInput);
  const isAiLoading = useSelector((s: RootState) => s.chat.isAiLoading);
  const includeData = useSelector((s: RootState) => s.chat.includeData);
  const includeDoctrine = useSelector((s: RootState) => s.chat.includeDoctrine);
  const session = useSelector((s: RootState) => s.session.session);
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);
  const highestStep = useSelector((s: RootState) => s.analysis.highestStep);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);

  const handleSendMessage = useCallback(async () => {
    if (!chatInput.trim() || isAiLoading) return;

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
      const contextObj = includeData ? {
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
          messages: [...chatHistory, userMsg],
          include_doctrine: includeDoctrine,
          context_data: contextObj,
          provider: providerVal,
          llm_config: { ...modelConfig, model_id: modelIdVal },
          image_base64,
          image_type,
        }),
      });

      if (!response.ok) throw new Error('Neural Link Timeout');
      const envelope = await response.json() as { data?: { text: string }; text?: string };
      const text = envelope?.data?.text ?? envelope?.text ?? 'No response';
      dispatch(appendChatMessage({ role: 'ai', text }));
    } catch {
      showToast('NETRA Neural Link Interrupted', 'error');
      dispatch(appendChatMessage({ role: 'ai', text: 'Protocol error: My neural link was interrupted. Please retry.' }));
    } finally {
      dispatch(setIsAiLoading(false));
    }
  }, [chatInput, isAiLoading, uploadedVisionFiles, includeData, includeDoctrine, chatHistory, session, activeEditLog, highestStep, selections, notes, imageDescription, modelConfig, dispatch, getActiveModel, getAuthHeaders, showToast]);

  return {
    chatHistory, chatInput, isAiLoading, includeData, includeDoctrine,
    uploadedVisionFiles, setUploadedVisionFiles,
    handleSendMessage,
  };
}
