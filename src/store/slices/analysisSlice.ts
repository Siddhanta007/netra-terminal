import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';
import {
  Selections, Notes, InterSelections, StrikeSelections,
  NetraOutput, WeaponPrediction,
} from '../../types';

interface AnalysisState {
  highestStep: number;
  selections: Selections;
  notes: Notes;
  finalCommand: string | null;
  commandLocked: boolean;
  weaponLocked: boolean;
  netraOutput: NetraOutput | null;
  sysRecommendation: unknown;
  interSelections: InterSelections;
  strikeSelections: StrikeSelections;
  saturationSelections: Record<string, string>;
  selectedWeaponId: string | null;
  isEvaluating: boolean;
  isPredictingWeapon: boolean;
  weaponPrediction: WeaponPrediction | null;
  imageDescription: string | null;
  isUploadingImage: boolean;
  analyticsData: unknown;
  stepTimestamps: Record<string, string>;
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

const initialState: AnalysisState = {
  highestStep: loadState('highestStep', 1),
  selections: loadState('selections', { realBias: {}, htfStructure: {}, marketPulse: {}, liquidityContext: {} }),
  notes: loadState('notes', { realBias: '', htfStructure: '', marketPulse: '', liquidityContext: '', weapon: '' }),
  finalCommand: loadState('finalCommand', null),
  commandLocked: loadState('commandLocked', false),
  weaponLocked: loadState('weaponLocked', false),
  netraOutput: null,
  sysRecommendation: null,
  interSelections: loadState('interSelections', { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }),
  strikeSelections: loadState('strikeSelections', { impulseQuality: '', continuationZone: '', pullbackDepth: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '', compressionQuality: '', breakoutEnergy: '', postBreakoutBehaviour: '', boundaryBreakQuality: '', acceptanceQuality: '', entryPattern: '' }),
  saturationSelections: loadState('saturationSelections', { expansionQuality: '', pullbackQuality: '', followThrough: '', structuralFatigue: '', liquidityConsumption: '', emotionalParticipation: '' }),
  selectedWeaponId: loadState('selectedWeaponId', null),
  isEvaluating: false,
  isPredictingWeapon: false,
  weaponPrediction: null,
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
    setSelectedWeaponId: (state, action: PayloadAction<string | null>) => {
      state.selectedWeaponId = action.payload;
    },
    setIsEvaluating: (state, action: PayloadAction<boolean>) => {
      state.isEvaluating = action.payload;
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
  setSysRecommendation,
  setInterSelections,
  setStrikeSelections,
  setSaturationSelections,
  setSelectedWeaponId,
  setIsEvaluating,
  setIsPredictingWeapon,
  setWeaponPrediction,
  setImageDescription,
  setIsUploadingImage,
  setAnalyticsData,
  setStepTimestamps,
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
} = analysisSlice.actions;

export default analysisSlice.reducer;
