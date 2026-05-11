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
  selectedWeaponId: string | null;
  isEvaluating: boolean;
  isPredictingWeapon: boolean;
  weaponPrediction: WeaponPrediction | null;
  imageDescription: string | null;
  isUploadingImage: boolean;
  analyticsData: unknown;
  stepTimestamps: Record<string, string>;
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
  strikeSelections: loadState('strikeSelections', { impulseQuality: '', continuationZone: '', pullbackQuality: '', zoneReaction: '', continuationTrigger: '' }),
  selectedWeaponId: loadState('selectedWeaponId', null),
  isEvaluating: false,
  isPredictingWeapon: false,
  weaponPrediction: null,
  imageDescription: loadState('imageDescription', null),
  isUploadingImage: false,
  analyticsData: null,
  stepTimestamps: loadState('stepTimestamps', {}),
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
  setSelectedWeaponId,
  setIsEvaluating,
  setIsPredictingWeapon,
  setWeaponPrediction,
  setImageDescription,
  setIsUploadingImage,
  setAnalyticsData,
  setStepTimestamps,
} = analysisSlice.actions;

export default analysisSlice.reducer;
