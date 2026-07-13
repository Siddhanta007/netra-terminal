export type AccessVisibility = 'private' | 'team' | 'public_demo' | 'system';
export type AccessRole = 'owner' | 'team_admin' | 'team_member' | 'viewer' | 'demo_readonly' | 'system';
export type AccessScope = 'user' | 'team' | 'system';

export interface TradeAccess {
  owner_user_id: string;
  team_id: string;
  visibility: AccessVisibility;
  role: AccessRole;
  scope: AccessScope;
}

export interface TradeAppMetadata {
  user_id: string;
  team: string;
  access: TradeAccess;
  model_id: string;
  source: 'terminal_trade' | string;
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
}

export interface Phase9TradeBlock {
  weapon: {
    weapon_id?: string;
    weapon_name?: string;
    selected_dimensions?: Record<string, unknown>;
    selected_events?: Record<string, unknown>;
    thought?: string;
    strategy?: string;
    prediction?: unknown;
  };
  trade: {
    mode?: string;
    asset_class?: string;
    instrument_type?: string;
    thesis_asset?: string;
    execution_instrument?: string;
    side?: string;
    entry?: Record<string, unknown>;
    targets?: Record<string, unknown>;
    management_actions?: Record<string, unknown>;
    exit?: Record<string, unknown>;
    temporal?: Record<string, unknown>;
  };
  stats: Record<string, unknown>;
  notes: Record<string, unknown>;
}

export interface CanonicalTradePatch {
  metadata: TradeAppMetadata;
  phase_9?: Record<string, Phase9TradeBlock>;
}

export function buildTradeAccess(userId: string, teamId = 'default'): TradeAccess {
  return {
    owner_user_id: userId || 'Unknown',
    team_id: teamId || 'default',
    visibility: 'private',
    role: 'owner',
    scope: 'user',
  };
}

export function buildTradeMetadata(userId: string, modelId = 'pinaka', teamId = 'default'): TradeAppMetadata {
  return {
    user_id: userId || 'Unknown',
    team: teamId || 'default',
    access: buildTradeAccess(userId, teamId),
    model_id: modelId || 'pinaka',
    source: 'terminal_trade',
    updated_at: new Date().toISOString(),
  };
}

export function buildPhase9TradeBlock(input: {
  weaponId?: string;
  weaponName?: string;
  selectedDimensions?: Record<string, unknown>;
  thought?: string;
  strategy?: string;
  prediction?: unknown;
  mode?: string;
  assetClass?: string;
  instrumentType?: string;
  thesisAsset?: string;
  executionInstrument?: string;
  side?: string;
  entry?: Record<string, unknown>;
  targets?: Record<string, unknown>;
  managementActions?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  temporal?: Record<string, unknown>;
  stats?: Record<string, unknown>;
  notes?: Record<string, unknown>;
}): Phase9TradeBlock {
  return {
    weapon: {
      weapon_id: input.weaponId,
      weapon_name: input.weaponName || input.weaponId,
      selected_dimensions: input.selectedDimensions || {},
      selected_events: {},
      thought: input.thought,
      strategy: input.strategy,
      prediction: input.prediction,
    },
    trade: {
      mode: input.mode,
      asset_class: input.assetClass,
      instrument_type: input.instrumentType,
      thesis_asset: input.thesisAsset,
      execution_instrument: input.executionInstrument,
      side: input.side,
      entry: input.entry || {},
      targets: input.targets || {},
      management_actions: input.managementActions || {},
      exit: input.exit || {},
      temporal: input.temporal || {},
    },
    stats: input.stats || { status: 'pending_until_commit' },
    notes: input.notes || {},
  };
}
