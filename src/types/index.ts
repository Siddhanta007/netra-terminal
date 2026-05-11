// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface Session {
  userName: string;
  assetName: string | null;
  tradeName: string | null;
}

export interface Selections {
  realBias: Record<string, string>;
  htfStructure: Record<string, string>;
  marketPulse: Record<string, string>;
  liquidityContext: Record<string, string>;
}

export interface Notes {
  realBias: string;
  htfStructure: string;
  marketPulse: string;
  liquidityContext: string;
  weapon?: string;
  weapon_thought?: string;
  command?: string;
}

export interface InterSelections {
  pattern: string;
  friction: string;
  sweep: string;
  response: string;
  reversion: string;
  flip: string;
}

export interface StrikeSelections {
  impulseQuality: string;
  continuationZone: string;
  pullbackQuality: string;
  zoneReaction: string;
  continuationTrigger: string;
}

export interface NetraOutput {
  cmd: string;
  conviction: string;
  size: string;
  synthesis?: string;
  analysis?: string;
  reasoning?: string;
  thinking?: string;
  [key: string]: unknown;
}

export interface WeaponPrediction {
  weapon?: string;
  plan?: string;
  reasoning?: string;
  thinking?: string;
  [key: string]: unknown;
}

export interface AuditPillar {
  score: number;
  critique: string;
}

export interface AuditData {
  pillars?: Record<string, AuditPillar>;
  tactical_score?: number;
  thinking?: string;
  [key: string]: unknown;
}

export interface ModelConfig {
  temperature: number;
  top_p: number;
  max_tokens: number;
  seed: number;
  frequency_penalty: number;
}

export interface AvailableModel {
  id: string;
  name: string;
  cost: string;
  tags: string[];
}

// ─── Trade Log Types ──────────────────────────────────────────────────────────

export interface TradeLogPhase1 {
  asset_ticker?: string;
  protocol?: string;
  realBias?: string | Record<string, string>;
  htfStructure?: string | Record<string, string>;
  marketPulse?: string | Record<string, string>;
  liquidityContext?: string | Record<string, string>;
  weapon?: string;
  realBias_note?: string;
  htfStructure_note?: string;
  marketPulse_note?: string;
  liquidityContext_note?: string;
  [key: string]: unknown;
}

export interface TradeLogPhase2 {
  trading_asset?: string;
  entry_price?: string | number;
  stop_loss?: string | number;
  take_profit?: string | number;
  buying_type?: string;
  additional_cost?: string | number;
  asset_ticker?: string;
  [key: string]: unknown;
}

export interface TradeLogPhase3 {
  notes?: string;
  manual_weapon?: string;
  [key: string]: unknown;
}

export interface TradeLogPhase4 {
  exit_price?: string | number;
  outcome?: string;
  pl?: string | number;
  user_thought?: string;
  execution_rating?: number;
  [key: string]: unknown;
}

export interface SessionState {
  highestStep: number;
  selections: Selections;
  notes: Notes;
  interSelections: InterSelections;
  strikeSelections: StrikeSelections;
  finalCommand: string | null;
  netraOutput: NetraOutput | null;
  sysRecommendation: unknown;
  selectedWeaponId: string | null;
  stepTimestamps: Record<string, string>;
  tradeName: string;
  assetName: string;
}

export interface TradeLog {
  id: number;
  name: string;
  username: string;
  weapon: string;
  timestamp: string;
  asset?: string;
  phase1?: TradeLogPhase1;
  phase2?: TradeLogPhase2;
  phase3?: TradeLogPhase3;
  phase4?: TradeLogPhase4;
  session_state?: SessionState;
  _stsData?: unknown;
}

// ─── UI / State Types ─────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  msg: string;
  type: ToastType;
}

export interface ConfirmModal {
  title: string;
  desc: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

export interface SessionInput {
  userName: string;
  password: string;
  assetName: string;
  tradeName: string;
  marketType: string;
  modelName: string;
}

export interface EditFormData {
  trading_asset?: string;
  entry_price?: string | number;
  stop_loss?: string | number;
  take_profit?: string | number;
  buying_type?: string;
  manual_weapon?: string;
  additional_cost?: string | number;
  notes?: string;
  trade_name?: string;
  exit_price?: string | number;
  execution_rating?: number;
  [key: string]: unknown;
}

// ─── System Data Types ────────────────────────────────────────────────────────

export interface SystemDimension {
  id: string;
  name: string;
  options?: string[];
  opts?: string[];
  description?: string;
  [key: string]: unknown;
}

export interface Weapon {
  id: string;
  name: string;
  logic: string;
  activation: string;
  entry?: string;
  stop?: string;
  target?: string;
  misfire?: string;
}

export interface SystemWeapons {
  strike: Weapon[];
  interception: Weapon[];
  [key: string]: Weapon[] | undefined;
}

export interface SysData {
  weapons?: SystemWeapons;
  realBias?: { title?: string; dimensions: SystemDimension[] };
  htfStructure?: { title?: string; dimensions: SystemDimension[] };
  marketPulse?: { title?: string; dimensions: SystemDimension[] };
  liquidityContext?: { title?: string; dimensions: SystemDimension[] };
  strikeDimensions?: SystemDimension[];
  interceptionDimensions?: SystemDimension[];
  tactical_provider?: string;
  providers?: Array<{
    provider: string;
    models: Array<{ id: string; name: string; cost: string; tags: string[] }>;
  }>;
  [key: string]: unknown;
}

// ─── AI Output Types ──────────────────────────────────────────────────────────

export interface AIOutput {
  analysis?: string;
  reasoning?: string;
  description?: string;
  synthesis?: string;
  cmd?: string;
  weapon?: string;
  plan?: string;
  conviction?: string;
  predictability?: string;
  risk_level?: string;
  thinking?: string;
  critic_review?: {
    status?: string;
    critique?: string;
    suggested_cmd?: string;
  } | null;
  risk_audit?: {
    risk_status?: string;
    risk_critique?: string;
    adjusted_plan?: string;
  } | null;
  [key: string]: unknown;
}

export type FinalCommand = 'STRIKE' | 'INTERCEPTION' | 'NO_ENGAGEMENT' | null;
export type ActiveView = 'terminal' | 'trishul' | 'profile';
