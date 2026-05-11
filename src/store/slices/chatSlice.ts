import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChatMessage } from '../../types';

interface ChatState {
  chatHistory: ChatMessage[];
  chatInput: string;
  isAiLoading: boolean;
  includeData: boolean;
  includeDoctrine: boolean;
}

const initialState: ChatState = {
  chatHistory: [],
  chatInput: '',
  isAiLoading: false,
  includeData: false,
  includeDoctrine: false,
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
    setIncludeData: (state, action: PayloadAction<boolean>) => {
      state.includeData = action.payload;
    },
    setIncludeDoctrine: (state, action: PayloadAction<boolean>) => {
      state.includeDoctrine = action.payload;
    },
  },
});

export const {
  setChatHistory,
  appendChatMessage,
  setChatInput,
  setIsAiLoading,
  setIncludeData,
  setIncludeDoctrine,
} = chatSlice.actions;

export default chatSlice.reducer;
