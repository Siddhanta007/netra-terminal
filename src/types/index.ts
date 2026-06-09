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
  detectedTraps?: string;
}

export interface StrikeSelections {
  impulseQuality: string;
  continuationZone: string;
  // Trishul (D2 = None / Shallow Pullback)
  pullbackDepth: string;
  // Bramosh (D2 = FVG / OB Present)
  pullbackQuality: string;
  zoneReaction: string;
  continuationTrigger: string;
  // Agni (D2 = Compression Visible)
  compressionQuality: string;
  breakoutEnergy: string;
  postBreakoutBehaviour: string;
  // Vajra (D2 = Acceptance Building)
  boundaryBreakQuality: string;
  acceptanceQuality: string;
  entryPattern: string;
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
  // stance-based co-pilot schema
  stance?: 'ENTER' | 'WAIT' | 'STAND_ASIDE' | string;
  type?: 'weapon' | 'custom' | string;
  name?: string;
  entry?: string;
  stop?: string;
  target?: string;
  wait_for?: string;
  becomes?: string;
  expected?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  reasoning?: string;
  thinking?: string;
  // legacy
  weapon?: string;
  plan?: string;
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
  exit_type?: string;
  trade_status?: string;
  holding_time_minutes?: number;
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
  weaponPrediction: WeaponPrediction | null;
  selectedWeaponId: string | null;
  stepTimestamps: Record<string, string>;
  tradeName: string;
  assetName: string;
  imageDescription: string | null;
  auditData: AuditData | null;
}

// ─── New phase-structured trade log ──────────────────────────────────────────

// ─── New phase-structured trade log ──────────────────────────────────────────

// Typed phase interfaces — used by new code and for documentation
export interface TradePhase1 { image_description?: string }
export interface TradePhase2 { selections?: Record<string, string>; note?: string }
export interface TradePhase3 { selections?: Record<string, string>; note?: string }
export interface TradePhase4 { marketPulse?: Record<string, string>; liquidityContext?: Record<string, string>; marketPulse_note?: string; liquidityContext_note?: string }
export interface TradePhase5 extends NetraOutput {}
export interface TradePhase6 { command?: string; confirmed_at?: string; recommendation?: Record<string, unknown> }
export interface TradePhase7 extends WeaponPrediction {}
export interface TradePhase8 { weapon_id?: string; dimensions?: Record<string, string> }
export interface TradePhase9Card {
  trade_index?: number; asset?: string; direction?: string;
  entry_price?: string; stop_loss?: string; quantity?: string; additional_cost?: string;
  t1?: string; t2?: string; t3?: string; t4?: string;
  entry_time?: string; exit_time?: string;
  add_entries?: unknown[]; partial_exits?: unknown[];
  weighted_avg_price?: number; breakeven?: number;
  exit_price?: string; exit_type?: string; trade_status?: string;
  holding_time_minutes?: number; pnl?: string; outcome?: string;
  note?: string; closed?: boolean;
}
export interface TradePhase10 extends AuditData { execution_rating?: number; lessons?: string }

export interface TradeLog {
  id: number;
  name: string;
  username?: string;
  created_by?: string;
  weapon?: string;
  asset?: string;
  timestamp: string;
  model_id?: string;
  highestStep?: number;
  assetName?: string;
  stepTimestamps?: Record<string, string>;
  // New phase-structured data (Record<string,any> keeps existing UI code working)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase1?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase2?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase3?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase4?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase5?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase6?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase7?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase8?: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase9?: Array<Record<string, any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  phase10?: Record<string, any>;
  // Backward-compat: old documents carry session_state blob
  session_state?: SessionState;
  // Quick trade fields
  source?: string;
  closed?: boolean;
  [key: string]: unknown;
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
  entry_time?: string;
  exit_time?: string;
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

export interface WeaponDimension {
  id: string;
  name: string;
  opts: string[];
  description?: string;
  howToMeasure?: string;
  optDescriptions?: Record<string, string>;
}

export interface Weapon {
  id: string;
  name: string;
  type?: string;
  logic: string;
  activation: string;
  entry?: string;
  entryPrimary?: string;
  entryAlternative?: string;
  entryAggressive?: string;
  stop?: string;
  target?: string;
  targetPrimary?: string;
  targetSecondary?: string;
  misfire?: string;
  misfireList?: string[];
  executionMarks?: string[];
  weaponDimensions?: WeaponDimension[];
}

export interface SystemWeapons {
  strike: Weapon[];
  interception: Weapon[];
  [key: string]: Weapon[] | undefined;
}

export interface ChecklistMark {
  id: string;
  label: string;
}

export interface MarketPulseExtras {
  operationalMarks?: ChecklistMark[];
  activeLegOptions?: string[];
  subAuctionOptions?: Record<string, string[]>;
}

export interface SysData {
  weapons?: SystemWeapons;
  realBias?: { title?: string; dimensions: SystemDimension[] };
  htfStructure?: { title?: string; dimensions: SystemDimension[] };
  marketPulse?: { title?: string; dimensions: SystemDimension[] };
  liquidityContext?: { title?: string; dimensions: SystemDimension[] };
  strikeDimensions?: SystemDimension[];
  interceptionDimensions?: SystemDimension[];
  saturationDimensions?: SystemDimension[];
  // Backend-driven UI config (was hardcoded in phase components)
  marketPulseExtras?: MarketPulseExtras;
  executionMarks?: ChecklistMark[];
  weaponStages?: string[];
  tradeStatuses?: string[];
  exitTypes?: string[];
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

export type FinalCommand = 'STRIKE' | 'INTERCEPTION' | 'SATURATION' | 'NO_ENGAGEMENT' | null;
export type ActiveView = 'terminal' | 'trishul' | 'profile' | 'about';

// ─── Session Registry ─────────────────────────────────────────────────────────

export interface SessionMeta {
  id: string;
  name: string;
  parentId: string | null;
  forkPoint: number | null;
  weapon: string | null;
  command: FinalCommand;
  status: 'active' | 'open' | 'closed';
  pnl: string | null;
  timestamp: string;
}
