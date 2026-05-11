import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { TradeLog, EditFormData, AuditData } from '../../types';

interface LogsState {
  tradeLogs: TradeLog[];
  logSearchTerm: string;
  logFilterOutcome: string;
  logSortOrder: 'ASC' | 'DESC';
  activeEditLog: TradeLog | null;
  editFormData: EditFormData;
  tradeName: string;
  auditData: AuditData | null;
  isAuditing: boolean;
}

const initialState: LogsState = {
  tradeLogs: [],
  logSearchTerm: '',
  logFilterOutcome: 'ALL',
  logSortOrder: 'DESC',
  activeEditLog: null,
  editFormData: {},
  tradeName: '',
  auditData: null,
  isAuditing: false,
};

export const logsSlice = createSlice({
  name: 'logs',
  initialState,
  reducers: {
    setTradeLogs: (state, action: PayloadAction<TradeLog[]>) => {
      state.tradeLogs = action.payload;
    },
    setLogSearchTerm: (state, action: PayloadAction<string>) => {
      state.logSearchTerm = action.payload;
    },
    setLogFilterOutcome: (state, action: PayloadAction<string>) => {
      state.logFilterOutcome = action.payload;
    },
    setLogSortOrder: (state, action: PayloadAction<'ASC' | 'DESC'>) => {
      state.logSortOrder = action.payload;
    },
    setActiveEditLog: (state, action: PayloadAction<TradeLog | null>) => {
      state.activeEditLog = action.payload;
    },
    setEditFormData: (state, action: PayloadAction<EditFormData>) => {
      state.editFormData = action.payload;
    },
    setTradeName: (state, action: PayloadAction<string>) => {
      state.tradeName = action.payload;
    },
    setAuditData: (state, action: PayloadAction<AuditData | null>) => {
      state.auditData = action.payload;
    },
    setIsAuditing: (state, action: PayloadAction<boolean>) => {
      state.isAuditing = action.payload;
    },
  },
});

export const {
  setTradeLogs,
  setLogSearchTerm,
  setLogFilterOutcome,
  setLogSortOrder,
  setActiveEditLog,
  setEditFormData,
  setTradeName,
  setAuditData,
  setIsAuditing,
} = logsSlice.actions;

export default logsSlice.reducer;
