import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import modelReducer from './slices/modelSlice';
import analysisReducer from './slices/analysisSlice';
import chatReducer from './slices/chatSlice';
import logsReducer from './slices/logsSlice';
import sessionReducer from './slices/sessionSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    model: modelReducer,
    analysis: analysisReducer,
    chat: chatReducer,
    logs: logsReducer,
    session: sessionReducer,
  },
});

export default store;
