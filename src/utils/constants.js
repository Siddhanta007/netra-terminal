export const API_BASE = import.meta.env.VITE_API_URL || '';

export const WEIGHTS = { bias: 3.5, auction: 3.0, liquidity: 2.0, behaviour: 1.5 };

export const SCORES = {
  bias: { Constructive: 10, Extended: 8, Transitional: 6, Neutral: 4 },
  auction: { 'Early Relocation': 10, 'Progressive Relocation': 10, 'Structural Flip': 9, 'Exhaustive Relocation': 7, 'Breakout Failure': 7, 'Acceptance Failure': 7, 'Skewed Balance': 6, 'Contracting Balance': 6, 'Stable Balance': 2, 'Expanding Balance': 2 },
  liquidity: { 'Continuation Path': 10, 'Trap Zone': 8, 'Rotation Zone': 4, 'No Context': 1 },
  behaviour: { 'Clean Drive': 10, 'Hidden Wall': 8, 'Absorptive Push': 8, 'Exhaustion': 5, 'Dead Market': 0 }
};

export const STEP_NAMES = { 1: 'bias', 2: 'auction', 3: 'liquidity', 4: 'behaviour', 5: 'netra' };
