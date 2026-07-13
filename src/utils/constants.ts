// App-wide constants — API base URL, debounce timing, and the dimension scoring weights/tables.

// Production requests stay on the Vercel origin and are forwarded by the
// server-side /api proxy. Only local Vite development calls FastAPI directly.
export const API_BASE: string = import.meta.env.DEV
  ? import.meta.env.VITE_API_URL || 'http://localhost:7860'
  : '/backend';

export const DEBOUNCE_MS = 1500;

export const WEIGHTS: Record<string, number> = {
  preSessionContext: 2.5,
  htfStructure: 3.5,
  marketPulse: 3.0,
  liquidityContext: 1.5,
};

export const SCORES: Record<string, Record<string, number>> = {
  preSessionContext: {
    'Aligned': 10, 'Diverging': 2, 'Neutral': 5,
    'Upward Displacement': 10, 'Downward Displacement': 2, 'No Displacement': 5,
    'Large Displacement': 10, 'Small Displacement': 5,
    'Upper Third': 3, 'Middle Third': 6, 'Lower Third': 9,
    'Bullish Close + Large Range': 10, 'Bullish Close + Average Range': 8, 'Bullish Close + Small Range': 6,
    'Middle Close + Any Range': 5,
    'Bearish Close + Small Range': 4, 'Bearish Close + Average Range': 3, 'Bearish Close + Large Range': 1,
  },
  htfStructure: {
    'Intact Continuity': 10, 'Threatened Continuity': 5, 'Broken Continuity': 1,
    'Early': 10, 'Mid': 8, 'Late': 4,
    'Shallow': 10, 'Moderate': 7, 'Deep': 3,
    'Present': 8, 'Absent': 5,
    'Secure': 10, 'Approaching Anchor': 5, 'Anchor Test': 3, 'Anchor Failure': 1,
    'Protected': 10, 'Pressured': 6, 'Fragile': 3, 'Protection Failure': 1,
    'Open Space': 10, 'Objective Approaching': 6, 'Objective Influenced': 7, 'Active Interaction': 4, 'Objective Acceptance': 8, 'Objective Rejection': 3,
    'Break of Structure (BOS)': 10, 'Change of Character (CHoCH)': 8, 'Market Structure Shift (MSS)': 6, 'No Significant Event': 5,
    'Objective Sweep': 10, 'Objective Interaction': 6, 'Objective Absorption': 5,
  },
  marketPulse: {
    'Balance': 6, 'Relocation In HTF Direction': 10, 'Relocation Against HTF Direction': 7, 'Transitional': 4,
    'Stable Balance': 10, 'Skewed Balance': 8, 'Contracting Balance': 5, 'Expanding Balance': 4,
    'Bullish Rotational': 8, 'Bearish Rotational': 8, 'Expansion Leg': 10, 'Pullback Leg': 6, 'Counter-Expansion Leg': 8, 'Recovery Leg': 5, 'Breaking Leg': 7, 'Opposing Leg': 5,
    'Impulsive': 10, 'Sustained': 8, 'Opposed': 5, 'Stalling': 3,
    'Weak': 10, 'Moderate': 7, 'Strong': 4, 'Dominant': 2,
  },
  liquidityContext: {
    'Objective Rejection': 3, 'Protection Failure': 2, 'Pullback Completion': 10, 'Liquidity Sweep': 8, 'Range Expansion': 9, 'Unknown': 5,
    'Protected': 10, 'Pressured': 6, 'Fragile': 4, 'Broken': 1,
    'Structural Anchor': 8, 'Structural Protection': 6, 'Auction Protection': 7, 'Auction Objective': 10, 'Pullback Magnet': 8,
    'Fair Value Gap': 7, 'Order Block': 8, 'Gap': 8, 'Swing Liquidity': 9, 'Liquidity Cluster': 10, 'Higher Time Frame Reference Liquidity': 10,
    'Fresh': 10, 'Developing': 6, 'Mature': 3,
    'Clear Runway': 10, 'Objective Approaching': 7, 'Active Interaction': 5, 'Objective Acceptance': 9,
    'No Active Magnet': 10, 'Weak Magnet': 8, 'Active Magnet': 5, 'Dominant Magnet': 3, 'Magnet Rebalanced': 9,
    'No Significant Event': 5, 'Auction BOS': 10, 'Auction CHoCH': 8, 'Auction MSS': 7, 'Objective Sweep': 8, 'Protection Test': 6, 'Range Acceptance': 9, 'Range Rejection': 4, 'Compression Formation': 6, 'Compression Expansion': 9, 'Compression Failure': 3, 'Mitigation Event': 7, 'Rebalance Completion': 9, 'Liquidity Absorption': 5, 'Trap Confirmation': 8,
  },
};

export const STEP_NAMES: Record<number, string> = {
  1: 'preSessionContext',
  2: 'htfStructure',
  3: 'marketPulse',
  4: 'liquidityContext',
  5: 'evaluation',
  6: 'matrix',
  7: 'armory',
  8: 'control',
};
