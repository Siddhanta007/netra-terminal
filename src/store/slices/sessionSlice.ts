import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState } from '../../utils/storage';
import { Session, SessionInput } from '../../types';

interface SessionState {
  session: Session | null;
  activeSessionId: number | null;
  isLoggingIn: boolean;
  isGuest: boolean;
  sessionInput: SessionInput;
}

const initialState: SessionState = {
  session: loadState('session', null),
  activeSessionId: loadState('activeSessionId', null),
  isLoggingIn: false,
  isGuest: false,
  sessionInput: {
    userName: '',
    password: '',
    assetName: '',
    tradeName: '',
    marketType: 'TRENDING',
    modelName: 'pinaka',
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
    setIsGuest: (state, action: PayloadAction<boolean>) => {
      state.isGuest = action.payload;
    },
  },
});

export const {
  setSession,
  setActiveSessionId,
  setIsLoggingIn,
  setSessionInput,
  setIsGuest,
} = sessionSlice.actions;

export default sessionSlice.reducer;
