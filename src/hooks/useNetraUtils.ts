import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setToast as setToastAction } from '../store/slices/uiSlice';
import { ToastType } from '../types';

export function useNetraUtils() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedModel = useSelector((s: RootState) => s.model.selectedModel);
  const availableModels = useSelector((s: RootState) => s.model.availableModels);

  const getAuthHeaders = useCallback((extraHeaders: Record<string, string> = {}): Record<string, string> => {
    const token = import.meta.env.VITE_HF_TOKEN as string | undefined;
    const headers: Record<string, string> = { ...extraHeaders };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }, []);

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    dispatch(setToastAction({ msg, type }));
    setTimeout(() => dispatch(setToastAction(null)), 3000);
  }, [dispatch]);

  const getActiveModel = useCallback((): { provider: string; model_id: string } => {
    const parts = selectedModel.split('|');
    const model_id = parts[1];
    if (!model_id) {
      const fallback = availableModels[0]?.id || 'google|gemini-3.1-flash';
      const [fProvider, fModelId] = fallback.split('|');
      return { provider: fProvider, model_id: fModelId };
    }
    return { provider: parts[0], model_id };
  }, [selectedModel, availableModels]);

  const getActiveVisionModel = useCallback((): { provider: string; model_id: string } => {
    const isValid = availableModels.some((m) => m.id === selectedModel);
    const parts = selectedModel.split('|');
    const model_id = parts[1];
    if (!isValid || !model_id) {
      const fallback = availableModels[0]?.id || 'google|gemini-3.1-flash-lite';
      const [fProvider, fModelId] = fallback.split('|');
      return { provider: fProvider, model_id: fModelId };
    }
    return { provider: parts[0], model_id };
  }, [selectedModel, availableModels]);

  return { getAuthHeaders, showToast, getActiveModel, getActiveVisionModel };
}
