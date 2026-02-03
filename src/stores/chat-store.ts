import { create } from "zustand";

export type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
};

export type Conversation = {
  id: string;
  title: string | null;
  model: string;
  provider: string;
  messages: Message[];
  createdAt: Date;
};

interface ChatState {
  // Current conversation
  currentConversation: Conversation | null;
  conversations: Conversation[];

  // Model selection
  selectedModel: string;
  selectedProvider: string;

  // Loading states
  isLoading: boolean;
  isStreaming: boolean;

  // Actions
  setCurrentConversation: (conversation: Conversation | null) => void;
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;

  setSelectedModel: (model: string) => void;
  setSelectedProvider: (provider: string) => void;

  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;

  setIsLoading: (loading: boolean) => void;
  setIsStreaming: (streaming: boolean) => void;

  reset: () => void;
}

const initialState = {
  currentConversation: null,
  conversations: [],
  selectedModel: "gpt-4o",
  selectedProvider: "openai",
  isLoading: false,
  isStreaming: false,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  setCurrentConversation: (conversation) =>
    set({ currentConversation: conversation }),

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
      currentConversation: conversation,
    })),

  updateConversation: (id, updates) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
      currentConversation:
        state.currentConversation?.id === id
          ? { ...state.currentConversation, ...updates }
          : state.currentConversation,
    })),

  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      currentConversation:
        state.currentConversation?.id === id ? null : state.currentConversation,
    })),

  setSelectedModel: (model) => set({ selectedModel: model }),

  setSelectedProvider: (provider) => set({ selectedProvider: provider }),

  addMessage: (message) =>
    set((state) => ({
      currentConversation: state.currentConversation
        ? {
            ...state.currentConversation,
            messages: [...state.currentConversation.messages, message],
          }
        : null,
    })),

  updateLastMessage: (content) =>
    set((state) => {
      if (!state.currentConversation) return state;
      const messages = [...state.currentConversation.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return {
        currentConversation: {
          ...state.currentConversation,
          messages,
        },
      };
    }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  setIsStreaming: (streaming) => set({ isStreaming: streaming }),

  reset: () => set(initialState),
}));
