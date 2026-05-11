import { useSelector } from 'react-redux';
import { RootState } from '../store';

export type HTFGate = 'CONTINUE' | 'REDUCE' | 'STOP';

export function useHTFGate(): HTFGate {
  const htf = useSelector((s: RootState) => s.analysis.selections.htfStructure);
  const continuity = htf?.continuity || '';
  const maturity = htf?.maturity || '';
  const rotation = htf?.rotation || '';
  const destination = htf?.destination || '';
  const distraction = htf?.distraction || '';

  if (
    continuity === 'Broken' ||
    (maturity === 'Late' && rotation === 'Deep' && destination === 'Near')
  ) return 'STOP';

  if (
    continuity === 'Threatened' ||
    maturity === 'Late' ||
    destination === 'Near' ||
    distraction === 'Unfilled'
  ) return 'REDUCE';

  return 'CONTINUE';
}

export function useReduceFlag(): boolean {
  return useHTFGate() === 'REDUCE';
}
