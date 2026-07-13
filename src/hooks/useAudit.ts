// Hook — the Maya post-trade audit: posts the recognised plan + outcome for review and stores the verdict.

import { useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setAuditData, setIsAuditing } from '../store/slices/logsSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';

export function useAudit() {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, showToast, getActiveModel } = useNetraUtils();
  const auditAbortControllerRef = useRef<AbortController | null>(null);

  const auditData = useSelector((s: RootState) => s.logs.auditData);
  const isAuditing = useSelector((s: RootState) => s.logs.isAuditing);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);

  useEffect(() => {
    return () => { auditAbortControllerRef.current?.abort(); };
  }, []);

  const triggerPostTradeAudit = useCallback((tradeTelemetry: Record<string, unknown>) => {
    if (isAuditing) return;
    dispatch(setIsAuditing(true));
    dispatch(setAuditData(null));

    if (auditAbortControllerRef.current) auditAbortControllerRef.current.abort();
    auditAbortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    fetch(`${API_BASE}/api/ai/post-trade-audit`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        ...tradeTelemetry,
        provider: providerVal,
        model_config: { ...modelConfig, model_id: modelIdVal },
      }),
      signal: auditAbortControllerRef.current.signal,
    })
      .then((res) => res.json())
      .then((envelope: { status?: string; data?: Record<string, unknown>; thinking?: string; error?: string }) => {
        const hasData = envelope?.data && Object.keys(envelope.data).length > 0;
        const data = (hasData ? envelope.data : envelope) as Record<string, unknown>;
        const rawText =
          typeof data.analysis === 'string' ? data.analysis :
          typeof data.raw === 'string' ? data.raw :
          typeof data.raw_model_response === 'string' ? data.raw_model_response :
          typeof data.text === 'string' ? data.text :
          '';
        const result = (hasData
          ? {
              ...envelope.data,
              analysis: rawText || envelope.data?.analysis,
              raw: rawText || envelope.data?.raw,
              response_format: 'text',
              display_mode: 'text',
              status: envelope.status,
              error: envelope.error,
              thinking: envelope.thinking ?? '',
            }
          : {
              ...envelope,
              analysis: rawText || envelope.error || '',
              raw: rawText || envelope.error || '',
              response_format: 'text',
              display_mode: 'text',
              thinking: envelope?.thinking ?? '',
            }) as Parameters<typeof setAuditData>[0];
        const appAuditData = {
          ...result,
          phase_key: 'phase10',
          phase_name: 'Maya Audit',
          saved_at: new Date().toISOString(),
        } as Parameters<typeof setAuditData>[0];
        dispatch(setAuditData(appAuditData));
        dispatch(setIsAuditing(false));
        showToast('Tactical Audit Complete');

        // Persist phase10 directly to the trade log. Do not commit learning data here;
        // learning commit must only happen from the explicit Commit action.
        if (activeSessionId && appAuditData) {
          fetch(`${API_BASE}/api/logs/${encodeURIComponent(activeSessionId)}/state`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ phase10: appAuditData, auditor: appAuditData, highestStep: 11 }),
          }).catch(() => { /* silent */ });
        }
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') showToast('Audit Stopped', 'info');
        else showToast('Audit Failure', 'error');
        dispatch(setIsAuditing(false));
      });
  }, [isAuditing, dispatch, getActiveModel, getAuthHeaders, modelConfig, activeSessionId, showToast]);

  const stopPostTradeAudit = useCallback(() => {
    auditAbortControllerRef.current?.abort();
    auditAbortControllerRef.current = null;
    dispatch(setIsAuditing(false));
  }, [dispatch]);

  return { auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit };
}
