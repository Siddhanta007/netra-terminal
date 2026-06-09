// Hook — uploads chart images and gets a vision-model description used as context by the other agents.

import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setIsUploadingImage, setImageDescription } from '../store/slices/analysisSlice';
import { appendChatMessage } from '../store/slices/chatSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';

export function useVisionAnalysis(uploadedVisionFiles: File[], setUploadedVisionFiles: (f: File[]) => void) {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, showToast, getActiveVisionModel } = useNetraUtils();
  const [visionAbortController, setVisionAbortController] = useState<AbortController | null>(null);

  const isUploadingImage = useSelector((s: RootState) => s.analysis.isUploadingImage);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);

  const uploadAndDescribeImage = useCallback(async () => {
    if (uploadedVisionFiles.length === 0) return;
    dispatch(setIsUploadingImage(true));

    const controller = new AbortController();
    setVisionAbortController(controller);

    const formData = new FormData();
    uploadedVisionFiles.forEach((file) => formData.append('files', file));

    const { provider: providerVal, model_id: modelIdVal } = getActiveVisionModel();
    formData.append('provider', providerVal);
    formData.append('model_config', JSON.stringify({ ...modelConfig, model_id: modelIdVal }));

    try {
      showToast('Analyzing Tactical Visuals...', 'success');
      const response = await fetch(`${API_BASE}/api/ai/describe-image`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData,
        signal: controller.signal,
      });
      const envelope = await response.json() as { data?: { description: string }; description?: string; error?: string };
      const description = envelope?.data?.description ?? envelope?.description;
      if (description) {
        dispatch(setImageDescription(description));
        showToast('Visual Analysis Cached', 'success');
        dispatch(appendChatMessage({ role: 'ai', text: `**Visual Analysis Cached:**\n\n${description}` }));
      } else {
        showToast(envelope?.error || 'Failed to analyze image', 'error');
      }
    } catch (err) {
      const e = err as Error;
      if (e.name !== 'AbortError') showToast('Connection failed', 'error');
    } finally {
      dispatch(setIsUploadingImage(false));
      setVisionAbortController(null);
    }
  }, [uploadedVisionFiles, dispatch, getActiveVisionModel, getAuthHeaders, modelConfig, showToast]);

  const stopVisualAnalysis = useCallback(() => {
    visionAbortController?.abort();
    setVisionAbortController(null);
    dispatch(setIsUploadingImage(false));
    showToast('Visual Analysis Aborted', 'warning');
  }, [visionAbortController, dispatch, showToast]);

  return {
    isUploadingImage, imageDescription,
    uploadAndDescribeImage, stopVisualAnalysis,
    setImageDescription: (v: string | null) => dispatch(setImageDescription(v)),
    uploadedVisionFiles, setUploadedVisionFiles,
  };
}
