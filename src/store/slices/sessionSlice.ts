// Redux slice — the active trading session: asset/user metadata, login + guest flags, and the session input form.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';
import { Session, SessionInput } from '../../types';

interface SessionState {
  session: Session | null;
  activeSessionId: number | null;
  isLoggingIn: boolean;
  sessionInput: SessionInput;
}

const initialState: SessionState = {
  session: loadState('session', null),
  activeSessionId: loadState('activeSessionId', null),
  isLoggingIn: false,
  sessionInput: {
    userName: '',
    password: '',
    assetName: '',
    tradeName: '',
    marketType: 'TRENDING',
    modelName: 'pinaka',
    assetClass: 'Index',
  },
};

export const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
    },
    setActiveSessionId: (state, action: PayloadAction<number | null>) => {
      state.activeSessionId = action.payload;
    },
    setIsLoggingIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggingIn = action.payload;
    },
    setSessionInput: (state, action: PayloadAction<SessionInput>) => {
      state.sessionInput = action.payload;
    },
  },
});

export const {
  setSession,
  setActiveSessionId,
  setIsLoggingIn,
  setSessionInput,
} = sessionSlice.actions;

export default sessionSlice.reducer;
