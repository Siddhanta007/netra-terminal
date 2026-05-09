import { createSlice } from '@reduxjs/toolkit';
import { loadState, saveState } from '../../utils/storage';

const initialState = {
  session: loadState('session', null),
  activeSessionId: loadState('activeSessionId', null),
  isLoggingIn: false,
  sessionInput: { userName: '', password: '', assetName: '', tradeName: '', marketType: 'TRENDING', modelName: 'pinaka' },
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action) => {
      state.session = action.payload;
      saveState('session', action.payload);
    },
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
      saveState('activeSessionId', action.payload);
    },
    setIsLoggingIn: (state, action) => {
      state.isLoggingIn = action.payload;
    },
    setSessionInput: (state, action) => {
      state.sessionInput = action.payload;
    },
  },
});

export const { setSession, setActiveSessionId, setIsLoggingIn, setSessionInput } = sessionSlice.actions;

export default sessionSlice.reducer;
