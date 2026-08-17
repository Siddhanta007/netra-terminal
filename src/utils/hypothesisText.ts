/**
 * Return only the analyst-editable hypothesis statement from a Maya result.
 * Detailed evidence, traces and metadata remain in the AI result panel.
 */
export function getEditableHypothesisText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';

  const result = value as Record<string, unknown>;
  for (const key of ['claim', 'hypothesis', 'analysis']) {
    const candidate = result[key];
    if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    if (candidate && typeof candidate === 'object') {
      const nested = getEditableHypothesisText(candidate);
      if (nested) return nested;
    }
  }

  const data = getEditableHypothesisText(result.data);
  return data;
}
