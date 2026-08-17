// Redux slice — the live analysis pipeline: phase progress, dimension selections, notes, recognised NETRA output, and command lock.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';
import {
  Selections, Notes, InterSelections, StrikeSelections,
  NetraOutput, WeaponPrediction, WaitSelections, RecognitionCheckpoint,
  H1Hypothesis, H1AgentTraceStep,
} from '../../types';

interface AnalysisState {
  highestStep: number;
  selections: Selections;
  notes: Notes;
  finalCommand: string | null;
  commandLocked: boolean;
  weaponLocked: boolean;
  netraOutput: NetraOutput | null;
  selectedNetraState: Record<string, unknown> | null;
  sysRecommendation: unknown;
  interSelections: InterSelections;
  strikeSelections: StrikeSelections;
  saturationSelections: Record<string, string>;
  waitSelections: WaitSelections;
  recognitionCheckpoints: RecognitionCheckpoint[];
  selectedWeaponId: string | null;
  isEvaluating: boolean;
  h1Hypothesis: H1Hypothesis | null;
  h1Proposal: H1Hypothesis | null;
  h1AgentTrace: H1AgentTraceStep[];
  isConfirmingH1: boolean;
  isGeneratingH1: boolean;
  isPredictingWeapon: boolean;
  weaponPrediction: WeaponPrediction | null;
  imageDescription: string | null;
  isUploadingImage: boolean;
  analyticsData: unknown;
  stepTimestamps: Record<string, string>;
  weaponStageLog: Array<{ stage: string; ts: string }>;
  stateTimeline: Array<{ state_id: string; ts: string }>;
  liveMarketContext: Record<string, unknown>;
  // Mission Control Data
  rAmount: string;
  dailyLossLimit: string;
  dailyLossHit: boolean;
  dailyTarget: string;
  dailyTargetHit: boolean;
  openingWindow: string;
  sessionCutoff: string;
  isExpiryDay: boolean;
  expiryCutoff: string;
  rulesAcknowledged: boolean[];
}

const persistedNetraOutput = loadState<NetraOutput | null>('netraOutput', null);
const cleanPersistedNetraOutput =
  persistedNetraOutput && (persistedNetraOutput as Record<string, unknown>).state_override
    ? null
    : persistedNetraOutput;

const initialState: AnalysisState = {
  highestStep: loadState('highestStep', 1),
  selections: loadState('selections', { preSessionContext: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} }),
  notes: loadState('notes', { preSessionContext: '', htfStructure: '', marketPulse: '', liquidityContext: '', weapon: '' }),
  finalCommand: loadState('finalCommand', null),
  commandLocked: loadState('commandLocked', false),
  weaponLocked: loadState('weaponLocked', false),
  netraOutput: cleanPersistedNetraOutput,       // expensive AI call — persist so a reload doesn't re-run it
  selectedNetraState: loadState<Record<string, unknown> | null>('selectedNetraState', null),
  sysRecommendation: loadState('sysRecommendation', null),
  interSelections: loadState('interSelections', { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }),
  strikeSelections: loadState('strikeSelections', { impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }),
  saturationSelections: loadState('saturationSelections', { expansionQuality: '', pullbackQuality: '', followThrough: '', structuralFatigue: '', liquidityConsumption: '', emotionalParticipation: '' }),
  waitSelections: {
    waitingFor: '', referenceLocation: '', requiredResolution: '', developmentStage: '',
    institutionalSignature: '', validityHorizon: '', resolutionStatus: 'OPEN',
    waitNote: '', resolutionEvent: '', resolutionNote: '', openedAt: '', resolvedAt: '',
  },
  // P5 belongs to the active Mongo session. Never hydrate another session's
  // recognition path from a single global browser key.
  recognitionCheckpoints: [],
  weaponStageLog: loadState('weaponStageLog', [] as Array<{ stage: string; ts: string }>),
  stateTimeline: loadState('stateTimeline', [] as Array<{ state_id: string; ts: string }>),
  liveMarketContext: {},
  selectedWeaponId: loadState('selectedWeaponId', null),
  isEvaluating: false,
  h1Hypothesis: null,
  h1Proposal: null,
  h1AgentTrace: [],
  isConfirmingH1: false,
  isGeneratingH1: false,
  isPredictingWeapon: false,
  weaponPrediction: loadState<WeaponPrediction | null>('weaponPrediction', null),  // expensive AI call — persist across reloads
  imageDescription: loadState('imageDescription', null),
  isUploadingImage: false,
  analyticsData: null,
  stepTimestamps: loadState('stepTimestamps', {}),
  // Mission Control Data
  rAmount: loadState('rAmount', ''),
  dailyLossLimit: loadState('dailyLossLimit', ''),
  dailyLossHit: loadState('dailyLossHit', false),
  dailyTarget: loadState('dailyTarget', ''),
  dailyTargetHit: loadState('dailyTargetHit', false),
  openingWindow: loadState('openingWindow', '09:20'),
  sessionCutoff: loadState('sessionCutoff', '14:30'),
  isExpiryDay: loadState('isExpiryDay', false),
  expiryCutoff: loadState('expiryCutoff', '12:00'),
  rulesAcknowledged: loadState('rulesAcknowledged', new Array(7).fill(false)),
};

export const analysisSlice = createSlice({
  name: 'analysis',
  initialState,
  reducers: {
    setHighestStep: (state, action: PayloadAction<number>) => {
      state.highestStep = action.payload;
    },
    setSelections: (state, action: PayloadAction<Selections>) => {
      state.selections = action.payload;
    },
    setNotes: (state, action: PayloadAction<Notes>) => {
      state.notes = action.payload;
    },
    setFinalCommand: (state, action: PayloadAction<string | null>) => {
      state.finalCommand = action.payload;
    },
    setCommandLocked: (state, action: PayloadAction<boolean>) => {
      state.commandLocked = action.payload;
    },
    setWeaponLocked: (state, action: PayloadAction<boolean>) => {
      state.weaponLocked = action.payload;
    },
    setNetraOutput: (state, action: PayloadAction<NetraOutput | null>) => {
      state.netraOutput = action.payload;
    },
    setSelectedNetraState: (state, action: PayloadAction<Record<string, unknown> | null>) => {
      state.selectedNetraState = action.payload;
    },
    setSysRecommendation: (state, action: PayloadAction<unknown>) => {
      state.sysRecommendation = action.payload;
    },
    setInterSelections: (state, action: PayloadAction<InterSelections>) => {
      state.interSelections = action.payload;
    },
    setStrikeSelections: (state, action: PayloadAction<StrikeSelections>) => {
      state.strikeSelections = action.payload;
    },
    setSaturationSelections: (state, action: PayloadAction<Record<string, string>>) => {
      state.saturationSelections = action.payload;
    },
    setWaitSelections: (state, action: PayloadAction<WaitSelections>) => {
      state.waitSelections = action.payload;
    },
    setRecognitionCheckpoints: (state, action: PayloadAction<RecognitionCheckpoint[]>) => {
      state.recognitionCheckpoints = action.payload;
    },
    appendRecognitionCheckpoint: (state, action: PayloadAction<Omit<RecognitionCheckpoint, 'id' | 'sequence' | 'createdAt'>>) => {
      const sequence = state.recognitionCheckpoints.length + 1;
      state.recognitionCheckpoints = [...state.recognitionCheckpoints, {
        ...action.payload,
        id: `recognition-${Date.now()}-${sequence}`,
        sequence,
        createdAt: new Date().toISOString(),
      }];
    },
    updateLatestRecognitionCheckpoint: (state, action: PayloadAction<Partial<RecognitionCheckpoint>>) => {
      const index = state.recognitionCheckpoints.length - 1;
      if (index < 0) return;
      state.recognitionCheckpoints[index] = { ...state.recognitionCheckpoints[index], ...action.payload };
    },
    setSelectedWeaponId: (state, action: PayloadAction<string | null>) => {
      state.selectedWeaponId = action.payload;
    },
    setIsEvaluating: (state, action: PayloadAction<boolean>) => {
      state.isEvaluating = action.payload;
    },
    setH1Hypothesis: (state, action: PayloadAction<H1Hypothesis | null>) => {
      state.h1Hypothesis = action.payload;
    },
    setH1Proposal: (state, action: PayloadAction<H1Hypothesis | null>) => {
      state.h1Proposal = action.payload;
    },
    setH1AgentTrace: (state, action: PayloadAction<H1AgentTraceStep[]>) => {
      state.h1AgentTrace = action.payload;
    },
    setIsGeneratingH1: (state, action: PayloadAction<boolean>) => {
      state.isGeneratingH1 = action.payload;
    },
    setIsConfirmingH1: (state, action: PayloadAction<boolean>) => {
      state.isConfirmingH1 = action.payload;
    },
    setIsPredictingWeapon: (state, action: PayloadAction<boolean>) => {
      state.isPredictingWeapon = action.payload;
    },
    setWeaponPrediction: (state, action: PayloadAction<WeaponPrediction | null>) => {
      state.weaponPrediction = action.payload;
    },
    setImageDescription: (state, action: PayloadAction<string | null>) => {
      state.imageDescription = action.payload;
    },
    setIsUploadingImage: (state, action: PayloadAction<boolean>) => {
      state.isUploadingImage = action.payload;
    },
    setAnalyticsData: (state, action: PayloadAction<unknown>) => {
      state.analyticsData = action.payload;
    },
    setStepTimestamps: (state, action: PayloadAction<Record<string, string>>) => {
      state.stepTimestamps = action.payload;
    },
    setRAmount: (state, action: PayloadAction<string>) => { state.rAmount = action.payload; },
    setDailyLossLimit: (state, action: PayloadAction<string>) => { state.dailyLossLimit = action.payload; },
    setDailyLossHit: (state, action: PayloadAction<boolean>) => { state.dailyLossHit = action.payload; },
    setDailyTarget: (state, action: PayloadAction<string>) => { state.dailyTarget = action.payload; },
    setDailyTargetHit: (state, action: PayloadAction<boolean>) => { state.dailyTargetHit = action.payload; },
    setOpeningWindow: (state, action: PayloadAction<string>) => { state.openingWindow = action.payload; },
    setSessionCutoff: (state, action: PayloadAction<string>) => { state.sessionCutoff = action.payload; },
    setIsExpiryDay: (state, action: PayloadAction<boolean>) => { state.isExpiryDay = action.payload; },
    setExpiryCutoff: (state, action: PayloadAction<string>) => { state.expiryCutoff = action.payload; },
    setRulesAcknowledged: (state, action: PayloadAction<boolean[]>) => { state.rulesAcknowledged = action.payload; },
    setWeaponStageLog: (state, action: PayloadAction<Array<{ stage: string; ts: string }>>) => { state.weaponStageLog = action.payload; },
    appendWeaponStage: (state, action: PayloadAction<{ stage: string; ts: string }>) => { state.weaponStageLog = [...state.weaponStageLog, action.payload]; },
    setStateTimeline: (state, action: PayloadAction<Array<{ state_id: string; ts: string }>>) => { state.stateTimeline = action.payload; },
    setLiveMarketContext: (state, action: PayloadAction<Record<string, unknown>>) => { state.liveMarketContext = action.payload; },
    appendStateRecognition: (state, action: PayloadAction<string>) => {
      // Append only when the recognised state actually changed (collapse repeats)
      const last = state.stateTimeline[state.stateTimeline.length - 1];
      if (!last || last.state_id !== action.payload) {
        state.stateTimeline = [...state.stateTimeline, { state_id: action.payload, ts: new Date().toISOString() }];
      }
    },
  },
});

export const {
  setHighestStep,
  setSelections,
  setNotes,
  setFinalCommand,
  setCommandLocked,
  setWeaponLocked,
  setNetraOutput,
  setSelectedNetraState,
  setSysRecommendation,
  setInterSelections,
  setStrikeSelections,
  setSaturationSelections,
  setWaitSelections,
  setRecognitionCheckpoints,
  appendRecognitionCheckpoint,
  updateLatestRecognitionCheckpoint,
  setSelectedWeaponId,
  setIsEvaluating,
  setH1Hypothesis,
  setH1Proposal,
  setH1AgentTrace,
  setIsGeneratingH1,
  setIsConfirmingH1,
  setIsPredictingWeapon,
  setWeaponPrediction,
  setImageDescription,
  setIsUploadingImage,
  setAnalyticsData,
  setStepTimestamps,
  setStateTimeline,
  setLiveMarketContext,
  appendStateRecognition,
  setRAmount,
  setDailyLossLimit,
  setDailyLossHit,
  setDailyTarget,
  setDailyTargetHit,
  setOpeningWindow,
  setSessionCutoff,
  setIsExpiryDay,
  setExpiryCutoff,
  setRulesAcknowledged,
  setWeaponStageLog,
  appendWeaponStage,
} = analysisSlice.actions;

export default analysisSlice.reducer;
