import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIState {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (loading: boolean) => void;
  toggleOpen: () => void;
  clearMessages: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  messages: [],
  isLoading: false,
  isOpen: false,

  addMessage: (message) => {
    const newMessage: ChatMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    set(state => ({
      messages: [...state.messages, newMessage],
    }));
  },

  setLoading: (loading) => set({ isLoading: loading }),

  toggleOpen: () => set(state => ({ isOpen: !state.isOpen })),

  clearMessages: () => set({ messages: [] }),
}));