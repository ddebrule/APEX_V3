/**
 * Conversation Slice
 * Manages chat messages, Socratic loop conversation state
 * Persisted to sessionStorage for tab-isolated conversation history
 */

import { StateCreator } from 'zustand';
import type { ChatMessage, ConversationPhase, Message } from '../advisorStore';

export interface ConversationSlice {
  // State
  conversationPhase: ConversationPhase;
  chatMessages: ChatMessage[];
  clarifyingQuestions: string[];
  userResponses: Record<string, string>;
  conversationLedger: Message[];

  // Actions
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  submitClarificationResponse: (questionIndex: number, response: string) => void;
  addToLedger: (message: Message) => void;
  resetConversation: () => void;
}

const initialConversationState = {
  conversationPhase: 'symptom' as ConversationPhase,
  chatMessages: [],
  clarifyingQuestions: [],
  userResponses: {},
  conversationLedger: [],
};

export const createConversationSlice: StateCreator<
  ConversationSlice,
  [],
  [],
  ConversationSlice
> = (set, get) => ({
  ...initialConversationState,

  addChatMessage: (message) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const timestamp = Date.now();
    const newMessage: ChatMessage = { ...message, id, timestamp };

    set((state) => ({
      chatMessages: [...state.chatMessages, newMessage],
    }));
  },

  submitClarificationResponse: (questionIndex, response) => {
    const state = get();
    const question = state.clarifyingQuestions[questionIndex];

    if (!question) {
      console.error('Invalid question index');
      return;
    }

    // Log user response
    set((state) => ({
      userResponses: { ...state.userResponses, [question]: response },
      chatMessages: [
        ...state.chatMessages,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          role: 'user',
          type: 'user-response',
          content: response,
          timestamp: Date.now(),
        },
      ],
    }));

    // Check if all questions answered
    const allAnswered = state.clarifyingQuestions.every(
      (q) => state.userResponses[q] || response
    );

    if (allAnswered) {
      set({ conversationPhase: 'proposal' });
    } else if (questionIndex + 1 < state.clarifyingQuestions.length) {
      // Ask next question
      const nextQuestion = state.clarifyingQuestions[questionIndex + 1];
      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            role: 'ai',
            type: 'ai-question',
            content: nextQuestion,
            timestamp: Date.now(),
          },
        ],
      }));
    }
  },

  addToLedger: (message) => {
    set((state) => ({
      conversationLedger: [...state.conversationLedger, message],
    }));
  },

  resetConversation: () => {
    set(initialConversationState);
  },
});
