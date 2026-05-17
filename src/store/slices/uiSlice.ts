import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { loadState, saveState } from '../../utils/storage';
import { Toast, ConfirmModal, ActiveView } from '../../types';

const getInitialPrepStep = (): number => {
  const s = loadState('session', null);
  if (!s) return 0;
  const persisted = loadState<number | null>('prepStep', null);
  if (persisted !== null && persisted >= 1) return persisted;
  const activeId = loadState('activeSessionId', null);
  return activeId ? 2 : 1;
};

interface UiState {
  darkMode: boolean;
  activeView: ActiveView;
  isProfileOpen: boolean;
  isMobileMenuOpen: boolean;
  isAiPaneOpen: boolean;
  toast: Toast | null;
  confirmModal: ConfirmModal | null;
  prepStep: number;
  isLoggerOpen: boolean;
}

const initialState: UiState = {
  darkMode: loadState('darkMode', false),
  activeView: 'terminal',
  isProfileOpen: false,
  isMobileMenuOpen: false,
  isAiPaneOpen: false,
  toast: null,
  confirmModal: null,
  prepStep: getInitialPrepStep(),
  isLoggerOpen: false,
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setActiveView: (state, action: PayloadAction<ActiveView>) => {
      state.activeView = action.payload;
    },
    setProfileOpen: (state, action: PayloadAction<boolean>) => {
      state.isProfileOpen = action.payload;
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload;
    },
    setAiPaneOpen: (state, action: PayloadAction<boolean>) => {
      state.isAiPaneOpen = action.payload;
    },
    setToast: (state, action: PayloadAction<Toast | null>) => {
      state.toast = action.payload;
    },
    setConfirmModal: (state, action: PayloadAction<ConfirmModal | null>) => {
      state.confirmModal = action.payload;
    },
    setPrepStep: (state, action: PayloadAction<number>) => {
      state.prepStep = action.payload;
      saveState('prepStep', action.payload);
    },
    setIsLoggerOpen: (state, action: PayloadAction<boolean>) => {
      state.isLoggerOpen = action.payload;
    },
  },
});

export const {
  setDarkMode,
  setActiveView,
  setProfileOpen,
  setMobileMenuOpen,
  setAiPaneOpen,
  setToast,
  setConfirmModal,
  setPrepStep,
  setIsLoggerOpen,
} = uiSlice.actions;

export default uiSlice.reducer;
