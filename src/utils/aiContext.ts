import { NetraOutput, RecognitionCheckpoint, WaitSelections } from '@/types';

const suggestionFields = ['analysis', 'synthesis', 'reasoning', 'description', 'summary'] as const;

export function aiSuggestionText(output: NetraOutput | Record<string, unknown> | null | undefined): string {
  if (!output || typeof output !== 'object') return '';
  for (const field of suggestionFields) {
    const value = output[field];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function compactWait(wait: WaitSelections) {
  return {
    waitingFor: wait.waitingFor || '',
    referenceLocation: wait.referenceLocation || '',
    requiredResolution: wait.requiredResolution || '',
    developmentStage: wait.developmentStage || '',
    institutionalSignature: wait.institutionalSignature || '',
    validityHorizon: wait.validityHorizon || '',
    waitNote: wait.waitNote || '',
    resolutionStatus: wait.resolutionStatus || '',
    resolutionEvent: wait.resolutionEvent || '',
    resolutionNote: wait.resolutionNote || '',
  };
}

export function compactLatestWaitCheckpoint(checkpoints: RecognitionCheckpoint[]) {
  return checkpoints
    .filter(checkpoint => checkpoint.wait)
    .slice(-1)
    .map(checkpoint => ({ wait: compactWait(checkpoint.wait as WaitSelections) }));
}
