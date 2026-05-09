import { createSlice } from '@reduxjs/toolkit';
import { loadState, saveState } from '../../utils/storage';

const initialState = {
  highestStep: loadState('highestStep', 1),
  selections: loadState('selections', { bias: {}, auction: {}, liquidity: {}, behaviour: {} }),
  notes: loadState('notes', { bias: '', auction: '', liquidity: '', behaviour: '', weapon: '' }),
  finalCommand: loadState('finalCommand', null),
  commandLocked: loadState('commandLocked', false),
  weaponLocked: loadState('weaponLocked', false),
  netraOutput: null,
  sysRecommendation: null,
  interSelections: loadState('interSelections', { pattern: '', friction: '', sweep: '', response: '', reversion: '', flip: '' }),
  strikeSelections: loadState('strikeSelections', { imbalance: '', pullback: '', trigger: '' }),
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
    setHighestStep: (state, action) => {
      state.highestStep = action.payload;
      saveState('highestStep', action.payload);
    },
    setSelections: (state, action) => {
      state.selections = action.payload;
      saveState('selections', action.payload);
    },
    setNotes: (state, action) => {
      state.notes = action.payload;
      saveState('notes', action.payload);
    },
    setFinalCommand: (state, action) => {
      state.finalCommand = action.payload;
      saveState('finalCommand', action.payload);
    },
    setCommandLocked: (state, action) => {
      state.commandLocked = action.payload;
      saveState('commandLocked', action.payload);
    },
    setWeaponLocked: (state, action) => {
      state.weaponLocked = action.payload;
      saveState('weaponLocked', action.payload);
    },
    setNetraOutput: (state, action) => {
      state.netraOutput = action.payload;
    },
    setSysRecommendation: (state, action) => {
      state.sysRecommendation = action.payload;
    },
    setInterSelections: (state, action) => {
      state.interSelections = action.payload;
      saveState('interSelections', action.payload);
    },
    setStrikeSelections: (state, action) => {
      state.strikeSelections = action.payload;
      saveState('strikeSelections', action.payload);
    },
    setSelectedWeaponId: (state, action) => {
      state.selectedWeaponId = action.payload;
      saveState('selectedWeaponId', action.payload);
    },
    setIsEvaluating: (state, action) => {
      state.isEvaluating = action.payload;
    },
    setIsPredictingWeapon: (state, action) => {
      state.isPredictingWeapon = action.payload;
    },
    setWeaponPrediction: (state, action) => {
      state.weaponPrediction = action.payload;
    },
    setImageDescription: (state, action) => {
      state.imageDescription = action.payload;
      saveState('imageDescription', action.payload);
    },
    setIsUploadingImage: (state, action) => {
      state.isUploadingImage = action.payload;
    },
    setAnalyticsData: (state, action) => {
      state.analyticsData = action.payload;
    },
    setStepTimestamps: (state, action) => {
      state.stepTimestamps = action.payload;
      saveState('stepTimestamps', action.payload);
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
  setStepTimestamps
} = analysisSlice.actions;

export default analysisSlice.reducer;
