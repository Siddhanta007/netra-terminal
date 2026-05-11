import { configureStore } from '@reduxjs/toolkit';
import { localStorageMiddleware } from './middleware/localStorageMiddleware';
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
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(localStorageMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
