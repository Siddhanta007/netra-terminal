import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import {
  setH1AgentTrace, setH1Hypothesis, setH1Proposal,
  setIsConfirmingH1, setIsGeneratingH1,
} from '../store/slices/analysisSlice';
import { API_BASE } from '../utils/constants';
import { H1AgentTraceStep, H1Hypothesis } from '../types';
import { useNetraUtils } from './useNetraUtils';
import { buildAgentWorkflowRequest } from '../utils/agentWorkflowRequest';
import { waitForNextPaint } from '../utils/waitForNextPaint';

export function useHypothesisFlow() {
  const dispatch = useDispatch<AppDispatch>();
  const { getAuthHeaders, getActiveModel, showToast } = useNetraUtils();
  const abortRef = useRef<AbortController | null>(null);
  const h1Hypothesis = useSelector((s: RootState) => s.analysis.h1Hypothesis);
  const h1Proposal = useSelector((s: RootState) => s.analysis.h1Proposal);
  const h1AgentTrace = useSelector((s: RootState) => s.analysis.h1AgentTrace);
  const isGeneratingH1 = useSelector((s: RootState) => s.analysis.isGeneratingH1);
  const isConfirmingH1 = useSelector((s: RootState) => s.analysis.isConfirmingH1);
  const modelConfig = useSelector((s: RootState) => s.model.modelConfig);
  const activeSessionId = useSelector((s: RootState) => s.session.activeSessionId);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (!activeSessionId || !h1Proposal?.provenance.run_id) {
      dispatch(setH1AgentTrace([]));
      return;
    }
    const controller = new AbortController();
    fetch(`${API_BASE}/api/hypotheses/h1/${encodeURIComponent(activeSessionId)}/trace`, {
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then(response => response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`)))
      .then(body => dispatch(setH1AgentTrace(Array.isArray(body?.agent_trace) ? body.agent_trace : [])))
      .catch(error => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) dispatch(setH1AgentTrace([]));
      });
    return () => controller.abort();
  }, [activeSessionId, dispatch, getAuthHeaders, h1Proposal?.provenance.run_id]);

  const triggerH1Hypothesis = useCallback(async (): Promise<H1Hypothesis | null> => {
    if (isGeneratingH1) return null;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    dispatch(setIsGeneratingH1(true));
    const { provider, model_id } = getActiveModel();
    try {
      await waitForNextPaint();
      const response = await fetch(`${API_BASE}/api/hypotheses/h1/generate`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        signal: abortRef.current.signal,
        body: JSON.stringify(buildAgentWorkflowRequest({
          sessionId: activeSessionId,
          provider,
          modelId: model_id,
          modelConfig,
        })),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.status !== 'ok' || !body?.data?.hypothesis) {
        throw new Error(body?.error || body?.detail || `HTTP ${response.status}`);
      }
      const hypothesis = body.data.hypothesis as H1Hypothesis;
      dispatch(setH1Proposal(hypothesis));
      dispatch(setH1AgentTrace((Array.isArray(body.data.agent_trace) ? body.data.agent_trace : []) as H1AgentTraceStep[]));
      showToast(`H1 revision ${hypothesis.revision} generated`);
      return hypothesis;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return null;
      showToast(`Maya H1 failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return null;
    } finally {
      dispatch(setIsGeneratingH1(false));
    }
  }, [activeSessionId, dispatch, getActiveModel, getAuthHeaders, h1Hypothesis, h1Proposal, isGeneratingH1, modelConfig, showToast]);

  const confirmH1Hypothesis = useCallback(async (draft: H1Hypothesis): Promise<H1Hypothesis | null> => {
    if (isConfirmingH1 || !activeSessionId) return null;
    dispatch(setIsConfirmingH1(true));
    try {
      await waitForNextPaint();
      const response = await fetch(`${API_BASE}/api/hypotheses/h1/${encodeURIComponent(activeSessionId)}/confirm`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        // The analyst owns only the final hypothesis statement. Evidence,
        // conditions and handoff metadata stay attached to Maya's proposal.
        body: JSON.stringify({ hypothesis: { claim: draft.claim } }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.status !== 'ok' || !body?.hypothesis) {
        throw new Error(body?.detail || `HTTP ${response.status}`);
      }
      const finalHypothesis = body.hypothesis as H1Hypothesis;
      dispatch(setH1Hypothesis(finalHypothesis));
      showToast('Final H1 hypothesis confirmed');
      return finalHypothesis;
    } catch (error) {
      showToast(`H1 confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
      return null;
    } finally {
      dispatch(setIsConfirmingH1(false));
    }
  }, [activeSessionId, dispatch, getAuthHeaders, isConfirmingH1, showToast]);

  const stopH1Hypothesis = useCallback(() => {
    abortRef.current?.abort();
    dispatch(setIsGeneratingH1(false));
  }, [dispatch]);

  return {
    h1Hypothesis, h1Proposal, h1AgentTrace,
    isGeneratingH1, isConfirmingH1,
    triggerH1Hypothesis, stopH1Hypothesis, confirmH1Hypothesis,
  };
}
