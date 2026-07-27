// Hook — CRUD for saved trade logs (list, edit, delete) against the backend.

import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setTradeLogs, setActiveEditLog, setEditFormData, setTradeName } from '../store/slices/logsSlice';
import { setConfirmModal, setIsLoggerOpen } from '../store/slices/uiSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';
import { TradeLog } from '../types';

async function apiError(response: Response, fallback: string): Promise<Error> {
  const body = await response.json().catch(() => ({}));
  const detail = typeof body?.detail === 'string' ? body.detail : fallback;
  return new Error(`${detail} (${response.status})`);
}

export function useTradeLogsCrud() {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, showToast } = useNetraUtils();

  const tradeLogs = useSelector((s: RootState) => s.logs.tradeLogs);
  const activeEditLog = useSelector((s: RootState) => s.logs.activeEditLog);
  const editFormData = useSelector((s: RootState) => s.logs.editFormData);
  const session = useSelector((s: RootState) => s.session.session);
  const currentModel = useSelector((s: RootState) => s.model.currentModel);
  const selections = useSelector((s: RootState) => s.analysis.selections);
  const notes = useSelector((s: RootState) => s.analysis.notes);
  const finalCommand = useSelector((s: RootState) => s.analysis.finalCommand);
  const interSelections = useSelector((s: RootState) => s.analysis.interSelections);
  const strikeSelections = useSelector((s: RootState) => s.analysis.strikeSelections);
  const saturationSelections = useSelector((s: RootState) => s.analysis.saturationSelections);
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const auditData = useSelector((s: RootState) => s.logs.auditData);
  const logsRequestRef = useRef(0);

  const fetchLogs = useCallback(async (modelId = currentModel || 'pinaka') => {
    const requestedModel = String(modelId || 'pinaka').toLowerCase();
    const requestId = ++logsRequestRef.current;
    try {
      const res = await fetch(`${API_BASE}/api/logs?model_id=${encodeURIComponent(requestedModel)}`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`Could not load logs (${res.status})`);
      const data: TradeLog[] = await res.json();
      if (requestId !== logsRequestRef.current) return;
      // Keep the client boundary strict even if an older server returns an
      // unexpectedly mixed response. Legacy records without model_id belong
      // to Pinaka, which was the original/default terminal model.
      const scoped = data.filter(log => String(log.model_id || 'pinaka').toLowerCase() === requestedModel);
      dispatch(setTradeLogs(scoped));
    } catch {
      if (import.meta.env.DEV) console.error('Logger offline');
    }
  }, [currentModel, dispatch, getAuthHeaders]);

  const commitTradeLog = useCallback((weapon?: string) => {
    const selNotes = [
      Object.keys(selections.preSessionContext || {}).length > 0 && `Pre-Session Context: ${Object.values(selections.preSessionContext).join(', ')}${notes.preSessionContext ? ' — ' + notes.preSessionContext : ''}`,
      Object.keys(selections.htfStructure || {}).length > 0 && `HTF Structure: ${Object.values(selections.htfStructure).join(', ')}${notes.htfStructure ? ' — ' + notes.htfStructure : ''}`,
      Object.keys(selections.marketPulse || {}).length > 0 && `Market Pulse: ${Object.values(selections.marketPulse).join(', ')}${notes.marketPulse ? ' — ' + notes.marketPulse : ''}`,
      Object.keys(selections.liquidityContext || {}).length > 0 && `Liquidity Context: ${Object.values(selections.liquidityContext).join(', ')}${notes.liquidityContext ? ' — ' + notes.liquidityContext : ''}`,
    ].filter(Boolean).join(' | ');

    const stsData = finalCommand === 'INTERCEPTION'
      ? Object.entries(interSelections).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
      : finalCommand === 'STRIKE'
        ? Object.entries(strikeSelections).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        : finalCommand === 'SATURATION'
          ? Object.entries(saturationSelections).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
          : '';

    const finalWeapon = (editFormData.manual_weapon as string | undefined) || weapon || selectedWeaponId || 'NONE';
    
    // Calculate time spent if both times are present
    const entryTime = editFormData.entry_time;
    const exitTime = editFormData.exit_time;
    let calculatedTimeSpent = "";
    if (entryTime && exitTime) {
      const [entryH, entryM] = entryTime.split(':').map(Number);
      const [exitH, exitM] = exitTime.split(':').map(Number);
      if (!isNaN(entryH) && !isNaN(entryM) && !isNaN(exitH) && !isNaN(exitM)) {
        const entryTotal = entryH * 60 + entryM;
        const exitTotal = exitH * 60 + exitM;
        const diff = exitTotal - entryTotal;
        if (diff >= 0) {
          const hours = Math.floor(diff / 60);
          const mins = diff % 60;
          calculatedTimeSpent = `${hours}h ${mins}m`;
        }
      }
    }

    const payload = {
      model_id: currentModel, username: session?.userName || 'Unknown',
      ...selections,
      preSessionContext_note: notes.preSessionContext, htfStructure_note: notes.htfStructure,
      marketPulse_note: notes.marketPulse, liquidityContext_note: notes.liquidityContext,
      weapon: finalWeapon, protocol: finalCommand || 'UNKNOWN',
      asset_ticker: editFormData.trading_asset || session?.assetName || '',
      trade_name: editFormData.trade_name || `${finalWeapon} [${session?.userName || ''}] ${new Date().toLocaleTimeString('en-IN')}`,
      trading_asset: editFormData.trading_asset,
      entry_price: editFormData.entry_price, stop_loss: editFormData.stop_loss,
      take_profit: editFormData.take_profit, buying_type: editFormData.buying_type,
      manual_weapon: editFormData.manual_weapon, additional_cost: editFormData.additional_cost,
      notes: editFormData.notes,
      entry_time: entryTime,
      exit_time: exitTime,
      time_spent: calculatedTimeSpent || editFormData.time_spent,
      _selNotes: selNotes, _stsData: stsData,
      vision_data: imageDescription,
      market_type_analysis: netraOutput?.analysis || null,
      entry_model_analysis: netraOutput?.reasoning || null,
      audit_data: null,
    };

    fetch(`${API_BASE}/api/logs`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        if (!res.ok) throw await apiError(res, 'Could not create trade log');
        const data: TradeLog = await res.json();
        if (!data?.id) throw new Error('Server did not return a trade ID');
        return data;
      })
      .then((data: TradeLog) => {
        fetchLogs();
        dispatch(setActiveEditLog(data));
        dispatch(setEditFormData({
          ...data.phase2, ...data.phase3, trade_name: data.name,
          asset_ticker: data.phase2?.asset_ticker || session?.assetName || '',
          notes: data.phase3?.notes || '',
        }));
        dispatch(setIsLoggerOpen(true));
        dispatch(setTradeName(''));
        showToast('Mission Log Committed (FIRED)');

        // Vectorize the committed log
        fetch(`${API_BASE}/api/rag/commit_trade_log`, {
          method: 'POST',
          headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({
            text: JSON.stringify(payload, null, 2),
            date: new Date().toISOString().split('T')[0]
          })
        })
        .then(res => res.json())
        .then(vecData => {
          console.log('Vectorized:', vecData);
          showToast('Mission Log Vectorized');
        })
        .catch(e => console.error('Vectorize failure', e));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown save error';
        showToast(`Firing Sequence Failure: ${message}`, 'error');
      });
  }, [dispatch, getAuthHeaders, fetchLogs, selections, notes, finalCommand, interSelections, strikeSelections, editFormData, selectedWeaponId, currentModel, session, imageDescription, netraOutput, showToast]);

  const updateTradeLog = useCallback(async (tradeId: string) => {
    const normalizedTradeId = String(tradeId || '').trim();
    if (!normalizedTradeId) {
      showToast('Cannot update trade: missing trade ID', 'error');
      return;
    }
    const entry = parseFloat(String(editFormData.entry_price)) || 0;
    const cost = parseFloat(String(editFormData.additional_cost)) || 0;
    const exit = parseFloat(String(editFormData.exit_price)) || 0;

    let outcome = 'Open';
    try {
      const outcomeRes = await fetch(`${API_BASE}/api/decision/trade-outcome`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ entry_price: entry, exit_price: exit, additional_cost: cost }),
      });
      const outcomeData = await outcomeRes.json();
      outcome = outcomeData.outcome || 'Open';
    } catch {
      // silent fallback
    }

    // Calculate time spent if both times are present
    const entryTime = editFormData.entry_time;
    const exitTime = editFormData.exit_time;
    let calculatedTimeSpent = "";
    if (entryTime && exitTime) {
      const [entryH, entryM] = entryTime.split(':').map(Number);
      const [exitH, exitM] = exitTime.split(':').map(Number);
      if (!isNaN(entryH) && !isNaN(entryM) && !isNaN(exitH) && !isNaN(exitM)) {
        const entryTotal = entryH * 60 + entryM;
        const exitTotal = exitH * 60 + exitM;
        const diff = exitTotal - entryTotal;
        if (diff >= 0) {
          const hours = Math.floor(diff / 60);
          const mins = diff % 60;
          calculatedTimeSpent = `${hours}h ${mins}m`;
        }
      }
    }

    const updatedData = { 
      ...editFormData, 
      outcome, 
      audit_data: auditData, 
      vision_data: imageDescription,
      time_spent: calculatedTimeSpent || editFormData.time_spent
    };
    try {
      const res = await fetch(`${API_BASE}/api/logs/${encodeURIComponent(normalizedTradeId)}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) throw await apiError(res, 'Could not update trade log');
      const data: TradeLog = await res.json();
      if (!data?.id) throw new Error('Server returned an invalid trade log');

      await fetchLogs();
      dispatch(setActiveEditLog(data));
      dispatch(setEditFormData({
        ...(data.phase2 || {}),
        ...(data.phase3 || {}),
        ...(data.phase4 || {}),
        trade_name: data.name,
      }));
      showToast('Mission Protocol Updated Successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown save error';
      showToast(`Trade save failed: ${message}`, 'error');
    }
  }, [dispatch, getAuthHeaders, fetchLogs, editFormData, auditData, imageDescription, showToast]);

  const deleteTradeLog = useCallback((tradeId: string) => {
    const normalizedTradeId = String(tradeId || '').trim();
    if (!normalizedTradeId) return;
    dispatch(setConfirmModal({
      title: 'Delete Trade?',
      desc: 'This trade will be permanently removed from the ledger. This cannot be undone.',
      loadingText: 'Deleting trade…',
      onConfirm: async () => {
        const res = await fetch(`${API_BASE}/api/logs/${encodeURIComponent(normalizedTradeId)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          showToast('Could not delete trade. Please try again.', 'error');
          throw new Error(`Could not delete trade (${res.status})`);
        }
        await fetchLogs();
        dispatch(setActiveEditLog(null));
        showToast('Trade deleted');
      },
    }));
  }, [dispatch, getAuthHeaders, fetchLogs, showToast]);

  const handleGlobalSave = useCallback(() => {
    if (activeEditLog?.id) { void updateTradeLog(activeEditLog.id); return; }
    showToast('No active session to save', 'error');
  }, [activeEditLog, updateTradeLog, showToast]);

  return {
    tradeLogs, activeEditLog, editFormData,
    fetchLogs, commitTradeLog, updateTradeLog, deleteTradeLog, handleGlobalSave,
    setActiveEditLog: (v: TradeLog | null) => dispatch(setActiveEditLog(v)),
    setEditFormData: (v: RootState['logs']['editFormData']) => dispatch(setEditFormData(v)),
  };
}
