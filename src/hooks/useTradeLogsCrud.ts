import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { setTradeLogs, setActiveEditLog, setEditFormData, setTradeName } from '../store/slices/logsSlice';
import { setConfirmModal, setIsLoggerOpen } from '../store/slices/uiSlice';
import { API_BASE } from '../utils/constants';
import { useNetraUtils } from './useNetraUtils';
import { TradeLog } from '../types';

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
  const selectedWeaponId = useSelector((s: RootState) => s.analysis.selectedWeaponId);
  const netraOutput = useSelector((s: RootState) => s.analysis.netraOutput);
  const imageDescription = useSelector((s: RootState) => s.analysis.imageDescription);
  const auditData = useSelector((s: RootState) => s.logs.auditData);

  const fetchLogs = useCallback((modelId = 'pinaka') => {
    fetch(`${API_BASE}/api/logs?model_id=${modelId}`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data: TradeLog[]) => dispatch(setTradeLogs(data)))
      .catch(() => { if (import.meta.env.DEV) console.error('Logger offline'); });
  }, [dispatch, getAuthHeaders]);

  const commitTradeLog = useCallback((weapon?: string) => {
    const selNotes = [
      Object.keys(selections.realBias || {}).length > 0 && `Real Bias: ${Object.values(selections.realBias).join(', ')}${notes.realBias ? ' — ' + notes.realBias : ''}`,
      Object.keys(selections.htfStructure || {}).length > 0 && `HTF Structure: ${Object.values(selections.htfStructure).join(', ')}${notes.htfStructure ? ' — ' + notes.htfStructure : ''}`,
      Object.keys(selections.marketPulse || {}).length > 0 && `Market Pulse: ${Object.values(selections.marketPulse).join(', ')}${notes.marketPulse ? ' — ' + notes.marketPulse : ''}`,
      Object.keys(selections.liquidityContext || {}).length > 0 && `Liquidity Context: ${Object.values(selections.liquidityContext).join(', ')}${notes.liquidityContext ? ' — ' + notes.liquidityContext : ''}`,
    ].filter(Boolean).join(' | ');

    const stsData = finalCommand === 'INTERCEPTION'
      ? Object.entries(interSelections).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
      : finalCommand === 'STRIKE'
        ? Object.entries(strikeSelections).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ')
        : '';

    const finalWeapon = (editFormData.manual_weapon as string | undefined) || weapon || selectedWeaponId || 'NONE';
    const payload = {
      model_id: currentModel, username: session?.userName || 'Unknown',
      ...selections,
      realBias_note: notes.realBias, htfStructure_note: notes.htfStructure,
      marketPulse_note: notes.marketPulse, liquidityContext_note: notes.liquidityContext,
      weapon: finalWeapon, protocol: finalCommand || 'UNKNOWN',
      asset_ticker: editFormData.trading_asset || session?.assetName || '',
      trade_name: editFormData.trade_name || `${finalWeapon} [${session?.userName || ''}] ${new Date().toLocaleTimeString('en-IN')}`,
      trading_asset: editFormData.trading_asset,
      entry_price: editFormData.entry_price, stop_loss: editFormData.stop_loss,
      take_profit: editFormData.take_profit, buying_type: editFormData.buying_type,
      manual_weapon: editFormData.manual_weapon, additional_cost: editFormData.additional_cost,
      notes: editFormData.notes,
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
      .then((res) => res.json())
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
      })
      .catch(() => showToast('Firing Sequence Failure', 'error'));
  }, [dispatch, getAuthHeaders, fetchLogs, selections, notes, finalCommand, interSelections, strikeSelections, editFormData, selectedWeaponId, currentModel, session, imageDescription, netraOutput, showToast]);

  const updateTradeLog = useCallback((tradeId: number) => {
    if (!tradeId) return;
    const entry = parseFloat(String(editFormData.entry_price)) || 0;
    const cost = parseFloat(String(editFormData.additional_cost)) || 0;
    const exit = parseFloat(String(editFormData.exit_price)) || 0;
    const be = entry + cost;
    let outcome = 'Breakeven';
    if (exit > be) outcome = 'Win';
    if (exit > 0 && exit < be) outcome = 'Loss';
    if (exit === 0) outcome = 'Open';
    const updatedData = { ...editFormData, outcome, audit_data: auditData, vision_data: imageDescription };
    fetch(`${API_BASE}/api/logs/${encodeURIComponent(tradeId)}`, {
      method: 'PUT',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updatedData),
    })
      .then((res) => res.json())
      .then((data: TradeLog) => {
        fetchLogs();
        dispatch(setActiveEditLog(data));
        dispatch(setEditFormData({
          ...(data.phase2 || {}),
          ...(data.phase3 || {}),
          ...(data.phase4 || {}),
          trade_name: data.name,
        }));
        showToast('Mission Protocol Updated Successfully');
      });
  }, [dispatch, getAuthHeaders, fetchLogs, editFormData, auditData, imageDescription, showToast]);

  const deleteTradeLog = useCallback((tradeId: number) => {
    if (!tradeId) return;
    dispatch(setConfirmModal({
      title: 'Delete Trade?',
      desc: 'This trade will be permanently removed from the ledger. This cannot be undone.',
      onConfirm: () => {
        fetch(`${API_BASE}/api/logs/${encodeURIComponent(tradeId)}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
          .then(() => {
            fetchLogs();
            dispatch(setActiveEditLog(null));
            dispatch(setConfirmModal(null));
            showToast('Trade deleted');
          });
      },
    }));
  }, [dispatch, getAuthHeaders, fetchLogs, showToast]);

  const handleGlobalSave = useCallback(() => {
    if (activeEditLog) { updateTradeLog(activeEditLog.id); return; }
    showToast('No active session to save', 'error');
  }, [activeEditLog, updateTradeLog, showToast]);

  return {
    tradeLogs, activeEditLog, editFormData,
    fetchLogs, commitTradeLog, updateTradeLog, deleteTradeLog, handleGlobalSave,
    setActiveEditLog: (v: TradeLog | null) => dispatch(setActiveEditLog(v)),
    setEditFormData: (v: RootState['logs']['editFormData']) => dispatch(setEditFormData(v)),
  };
}
