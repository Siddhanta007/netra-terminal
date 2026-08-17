// Hook — asks the backend for the one persisted audit of the complete terminal session.

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
  const hasCompletedSessionAudit = auditData?.audit_type === 'SESSION' && auditData?.status === 'COMPLETED';

  useEffect(() => {
    return () => { auditAbortControllerRef.current?.abort(); };
  }, []);

  const triggerPostTradeAudit = useCallback(() => {
    if (isAuditing) return;
    if (!activeSessionId) {
      showToast('No active terminal session', 'error');
      return;
    }
    if (hasCompletedSessionAudit) {
      showToast('This terminal session is already audited', 'info');
      return;
    }
    dispatch(setIsAuditing(true));
    dispatch(setAuditData(null));

    if (auditAbortControllerRef.current) auditAbortControllerRef.current.abort();
    auditAbortControllerRef.current = new AbortController();

    const { provider: providerVal, model_id: modelIdVal } = getActiveModel();
    fetch(`${API_BASE}/api/ai/post-trade-audit`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        session_id: String(activeSessionId),
        provider: providerVal,
        llm_config: { ...modelConfig, model_id: modelIdVal },
      }),
      signal: auditAbortControllerRef.current.signal,
    })
      .then(async (res) => {
        const envelope = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(envelope?.detail || envelope?.error || `Audit request failed (${res.status})`);
        }
        if (envelope?.status === 'error') {
          throw new Error(envelope?.error || 'Maya Terminal Audit failed');
        }
        return envelope;
      })
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
              request_status: envelope.status,
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
        const appAuditData = result as Parameters<typeof setAuditData>[0];
        dispatch(setAuditData(appAuditData));
        dispatch(setIsAuditing(false));
        showToast('Maya Terminal Audit Complete');
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') showToast('Audit Stopped', 'info');
        else showToast(err.message || 'Audit Failure', 'error');
        dispatch(setIsAuditing(false));
      });
  }, [isAuditing, hasCompletedSessionAudit, dispatch, getActiveModel, getAuthHeaders, modelConfig, activeSessionId, showToast]);

  const stopPostTradeAudit = useCallback(() => {
    auditAbortControllerRef.current?.abort();
    auditAbortControllerRef.current = null;
    dispatch(setIsAuditing(false));
  }, [dispatch]);

  return { auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit };
}
