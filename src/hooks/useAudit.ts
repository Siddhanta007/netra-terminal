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
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const weaponPrediction = useSelector((s: RootState) => s.analysis.weaponPrediction);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
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
        strategy_analysis: netraOutput?.analysis,
        execution_plan: (weaponPrediction as { weapon?: string } | null)?.weapon,
        provider: providerVal,
        model_config: { ...modelConfig, model_id: modelIdVal },
        image_description: imageDescription,
      }),
      signal: auditAbortControllerRef.current.signal,
    })
      .then((res) => res.json())
      .then((envelope: { data?: unknown }) => {
        const result = (envelope?.data ?? envelope) as Parameters<typeof setAuditData>[0];
        dispatch(setAuditData(result));
        dispatch(setIsAuditing(false));
        showToast('Tactical Audit Complete');

        // Persist phase10 directly to the trade log
        if (activeSessionId && result) {
          fetch(`${API_BASE}/api/logs/${encodeURIComponent(activeSessionId)}/state`, {
            method: 'PUT',
            headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ phase10: result, highestStep: 11, tradeName: '', assetName: '' }),
          }).catch(() => { /* silent */ });

          // Commit session to PinakaGraph (PostgreSQL ML store)
          fetch(`${API_BASE}/api/graph/commit/${encodeURIComponent(activeSessionId)}`, {
            method: 'POST',
            headers: getAuthHeaders(),
          })
            .then(r => r.json())
            .then(d => { if (d.committed > 0) showToast(`Graph: ${d.committed} node(s) committed`); })
            .catch(() => { /* silent — graph failure doesn't affect the session */ });
        }
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') showToast('Audit Stopped', 'info');
        else showToast('Audit Failure', 'error');
        dispatch(setIsAuditing(false));
      });
  }, [isAuditing, dispatch, getActiveModel, getAuthHeaders, netraOutput, weaponPrediction, modelConfig, imageDescription, activeSessionId, showToast]);

  const stopPostTradeAudit = useCallback(() => {
    auditAbortControllerRef.current?.abort();
    auditAbortControllerRef.current = null;
    dispatch(setIsAuditing(false));
  }, [dispatch]);

  return { auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit };
}
