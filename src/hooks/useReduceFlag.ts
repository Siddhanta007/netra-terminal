// Hook — derives the HTF risk gate (CONTINUE / REDUCE / STOP) from the higher-timeframe structure selections.

import { useSelector } from 'react-redux';
import { RootState } from '../store';

export type HTFGate = 'CONTINUE' | 'REDUCE' | 'STOP';

export function useHTFGate(): HTFGate {
  const htf = useSelector((s: RootState) => s.analysis.selections.htfStructure);
  const continuity = htf?.structuralContinuity || '';
  const maturity = htf?.legMaturity || '';
  const rotation = htf?.rotationDepth || '';
  const anchor = htf?.anchorCondition || '';
  const protection = htf?.protectionCondition || '';
  const objective = htf?.objectiveCondition || '';

  if (
    continuity === 'Broken Continuity' ||
    anchor === 'Anchor Failure' ||
    protection === 'Protection Failure' ||
    (maturity === 'Late' && rotation === 'Deep' && ['Objective Approaching', 'Active Interaction', 'Objective Rejection'].includes(objective))
  ) return 'STOP';

  if (
    continuity === 'Threatened Continuity' ||
    maturity === 'Late' ||
    ['Objective Approaching', 'Active Interaction', 'Objective Rejection', 'Objective Influenced'].includes(objective) ||
    ['Approaching Anchor', 'Anchor Test'].includes(anchor) ||
    ['Pressured', 'Fragile'].includes(protection)
  ) return 'REDUCE';

  return 'CONTINUE';
}

export function useReduceFlag(): boolean {
  return useHTFGate() === 'REDUCE';
}
