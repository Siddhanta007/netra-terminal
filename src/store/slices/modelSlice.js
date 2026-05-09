import { createSlice } from '@reduxjs/toolkit';
import { loadState, saveState } from '../../utils/storage';

const initialState = {
  availableModels: [],
  selectedModel: loadState('selectedModel', 'google|gemini-3.1-flash'),
  visionModel: loadState('visionModel', 'google|gemini-3.1-flash-lite'),
  modelConfig: loadState('modelConfig', {
    temperature: 0.2,
    top_p: 1.0,
    max_tokens: 2048,
    seed: 42,
    frequency_penalty: 0.0
  }),
  currentModel: 'pinaka',
  sysData: null,
};

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setAvailableModels: (state, action) => {
      state.availableModels = action.payload;
    },
    setSelectedModel: (state, action) => {
      state.selectedModel = action.payload;
      saveState('selectedModel', action.payload);
    },
    setVisionModel: (state, action) => {
      state.visionModel = action.payload;
      saveState('visionModel', action.payload);
    },
    setModelConfig: (state, action) => {
      state.modelConfig = action.payload;
      saveState('modelConfig', action.payload);
    },
    setCurrentModel: (state, action) => {
      state.currentModel = action.payload;
    },
    setSysData: (state, action) => {
      state.sysData = action.payload;
    },
  },
});

export const { 
  setAvailableModels, 
  setSelectedModel, 
  setVisionModel, 
  setModelConfig, 
  setCurrentModel, 
  setSysData 
} = modelSlice.actions;

export default modelSlice.reducer;
