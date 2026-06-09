// Redux slice — the Maya chat panel: message history, input, active knowledge sources, and loading flag.

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../types';
import { loadState } from '../../utils/storage';

export type ChatSource = 'terminal' | 'doctrine' | 'historical' | 'information';

interface ChatState {
  chatHistory: ChatMessage[];
  chatInput: string;
  isAiLoading: boolean;
  sources: ChatSource[];
  chatId: string | null;
}

const initialState: ChatState = {
  chatHistory: [],
  chatInput: '',
  isAiLoading: false,
  sources: loadState<ChatSource[]>('chatSources', ['information']),
  chatId: loadState<string | null>('chatId', null),
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChatHistory: (state, action: PayloadAction<ChatMessage[]>) => {
      state.chatHistory = action.payload;
    },
    appendChatMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.chatHistory.push(action.payload);
    },
    setChatInput: (state, action: PayloadAction<string>) => {
      state.chatInput = action.payload;
    },
    setIsAiLoading: (state, action: PayloadAction<boolean>) => {
      state.isAiLoading = action.payload;
    },
    setSources: (state, action: PayloadAction<ChatSource[]>) => {
      state.sources = action.payload;
    },
    toggleSource: (state, action: PayloadAction<ChatSource>) => {
      const s = action.payload;
      state.sources = state.sources.includes(s)
        ? state.sources.filter(x => x !== s)
        : [...state.sources, s];
    },
    setChatId: (state, action: PayloadAction<string | null>) => {
      state.chatId = action.payload;
    },
  },
});

export const {
  setChatHistory,
  appendChatMessage,
  setChatInput,
  setIsAiLoading,
  setSources,
  toggleSource,
  setChatId,
} = chatSlice.actions;

export default chatSlice.reducer;
