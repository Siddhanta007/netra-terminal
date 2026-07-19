export function buildForkName(sessionName: string | null | undefined, forkPoint: string): string {
  const base = String(sessionName || 'Trade').trim() || 'Trade';
  const point = String(forkPoint || 'Branch')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase() || 'BRANCH';
  return `${base}_${point}`;
}
