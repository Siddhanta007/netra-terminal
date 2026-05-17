import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState, saveState } from '../../utils/storage';
import { AvailableModel, ModelConfig, SysData } from '../../types';

interface ModelState {
  availableModels: AvailableModel[];
  selectedModel: string;
  visionModel: string;
  modelConfig: ModelConfig;
  currentModel: string;
  sysData: SysData | null;
}

const initialState: ModelState = {
  availableModels: [],
  selectedModel: loadState('selectedModel', 'google|gemini-3.1-flash-lite'),
  visionModel: loadState('visionModel', 'google|gemini-3.1-flash-lite'),
  modelConfig: loadState('modelConfig', {
    temperature: 0.2,
    top_p: 1.0,
    max_tokens: 2048,
    seed: 42,
    frequency_penalty: 0.0,
  }),
  currentModel: loadState('currentModel', 'pinaka'),
  sysData: null,
};

export const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    setAvailableModels: (state, action: PayloadAction<AvailableModel[]>) => {
      state.availableModels = action.payload;
    },
    setSelectedModel: (state, action: PayloadAction<string>) => {
      state.selectedModel = action.payload;
    },
    setVisionModel: (state, action: PayloadAction<string>) => {
      state.visionModel = action.payload;
    },
    setModelConfig: (state, action: PayloadAction<ModelConfig>) => {
      state.modelConfig = action.payload;
    },
    setCurrentModel: (state, action: PayloadAction<string>) => {
      state.currentModel = action.payload;
      saveState('currentModel', action.payload);
    },
    setSysData: (state, action: PayloadAction<SysData | null>) => {
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
  setSysData,
} = modelSlice.actions;

export default modelSlice.reducer;
