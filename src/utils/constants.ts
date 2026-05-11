export const API_BASE: string = import.meta.env.VITE_API_URL || '';

export const DEBOUNCE_MS = 1500;

export const WEIGHTS: Record<string, number> = {
  realBias: 2.5,
  htfStructure: 3.5,
  marketPulse: 3.0,
  liquidityContext: 1.5,
};

export const SCORES: Record<string, Record<string, number>> = {
  realBias: {
    'Large Gap Up': 10, 'Small Gap Up': 8, 'No Gap': 5, 'Small Gap Down': 3, 'Large Gap Down': 1,
    'Aligned': 10, 'Neutral': 5, 'Diverging': 2,
    'Bullish Close + Large Range': 10, 'Bullish Close + Average Range': 8, 'Bullish Close + Small Range': 6,
    'Middle Close + Any Range': 5,
    'Bearish Close + Small Range': 4, 'Bearish Close + Average Range': 3, 'Bearish Close + Large Range': 1,
    'Upper Third': 3, 'Middle Third': 6, 'Lower Third': 9,
  },
  htfStructure: {
    'Intact': 10, 'Threatened': 5, 'Broken': 1,
    'Early': 10, 'Mid': 8, 'Late': 4,
    'Shallow': 10, 'Moderate': 7, 'Deep': 3,
    'Present': 8, 'Absent': 5,
    'Far': 10, 'Near': 4,
    'Fully Balanced': 10, 'Partially Filled': 7, 'Unfilled': 3,
  },
  marketPulse: {
    'Relocation (In Bias)': 10, 'Transitional': 6, 'Balance': 4, 'Relocation (Against Bias)': 7,
    'Boundary Interaction': 8, 'Mid Range': 2, 'Break Rejecting': 7, 'Break Confirming': 3,
    'Slicing': 10, 'Constant': 7, 'Grinding': 3,
    'Efficient': 10, 'Absorbed': 2,
    'Violent': 10, 'Controlled': 7,
    'Immediate': 10, 'Delayed': 6, 'Dead': 0,
  },
  liquidityContext: {
    'Tier 1 (HTF Walls)': 10, 'Tier 2 (MTF Walls)': 6, 'Tier 3 (LTF Walls)': 2,
    'Fresh': 10, 'Developing': 6, 'Mature': 3,
  },
};

export const STEP_NAMES: Record<number, string> = {
  1: 'realBias',
  2: 'htfStructure',
  3: 'marketPulse',
  4: 'liquidityContext',
  5: 'evaluation',
  6: 'matrix',
  7: 'armory',
  8: 'control',
};
