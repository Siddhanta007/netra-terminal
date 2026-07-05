// Hook — shared utilities: auth headers, toasts, active model/vision-model resolution, and the guest AI-usage limiter.

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setToast as setToastAction } from '../store/slices/uiSlice';
import { ToastType } from '../types';

const GUEST_AI_KEY = 'netra_guest_ai_count';
const GUEST_AI_LIMIT = 5;

export function useNetraUtils() {
  const dispatch = useDispatch<AppDispatch>();
  const selectedModel = useSelector((s: RootState) => s.model.selectedModel);
  const availableModels = useSelector((s: RootState) => s.model.availableModels);
  const session = useSelector((s: RootState) => s.session.session);
  const getAuthHeaders = useCallback((extraHeaders: Record<string, string> = {}): Record<string, string> => {
    const headers: Record<string, string> = { ...extraHeaders };
    const netraToken = localStorage.getItem('netra_token');
    const hfToken = import.meta.env.VITE_HF_TOKEN as string | undefined;
    
    if (netraToken) {
      headers['Authorization'] = `Bearer ${netraToken}`;
    } else if (hfToken) {
      headers['Authorization'] = `Bearer ${hfToken}`;
    }
    
    if (session) {
      headers['x-user'] = session.userName;
    }
    return headers;
  }, [session]);

  const checkGuestLimit = useCallback((): boolean => {
    return true;
  }, []);

  const markGuestAiUsed = useCallback(() => {
    // no-op
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

  return { getAuthHeaders, showToast, getActiveModel, getActiveVisionModel, checkGuestLimit, markGuestAiUsed };
}
