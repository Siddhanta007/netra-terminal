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
        dispatch(setAuditData((envelope?.data ?? envelope) as Parameters<typeof setAuditData>[0]));
        dispatch(setIsAuditing(false));
        showToast('Tactical Audit Complete');
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') showToast('Audit Stopped', 'info');
        else showToast('Audit Failure', 'error');
        dispatch(setIsAuditing(false));
      });
  }, [isAuditing, dispatch, getActiveModel, getAuthHeaders, netraOutput, weaponPrediction, modelConfig, imageDescription, showToast]);

  const stopPostTradeAudit = useCallback(() => {
    auditAbortControllerRef.current?.abort();
    auditAbortControllerRef.current = null;
    dispatch(setIsAuditing(false));
  }, [dispatch]);

  return { auditData, isAuditing, triggerPostTradeAudit, stopPostTradeAudit };
}
