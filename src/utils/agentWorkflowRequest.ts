interface AgentWorkflowRequestInput {
  sessionId: string | null;
  provider: string;
  modelId: string;
  modelConfig: Record<string, unknown>;
}

/**
 * AI evidence is assembled server-side from the confirmed MongoDB session and
 * static/data.json. The browser sends session identity and model routing only;
 * lineage is resolved from MongoDB and never enters model evidence.
 */
export function buildAgentWorkflowRequest({
  sessionId,
  provider,
  modelId,
  modelConfig,
}: AgentWorkflowRequestInput) {
  return {
    session_id: sessionId,
    provider,
    llm_config: { ...modelConfig, model_id: modelId },
  };
}
