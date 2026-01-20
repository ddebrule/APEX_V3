/**
 * Advisor Store (Zustand)
 * State management for Setup Advisor Tab 2
 * Handles Socratic loop conversation, prescription generation, and session history
 *
 * State Machine: 'symptom' → 'clarifying' → 'proposal' → 'applied'
 */

import { create } from 'zustand';
import { SetupChange, VehicleSetup } from '@/types/database';
import { insertSetupChange } from '@/lib/queries';
import {
  Prescription,
  PrescriptionContext,
  getPrescriptionForSymptom,
  calculateDynamicTireFatigue,
  getContextWarnings,
  getSessionScenario,
} from '@/lib/physicsAdvisor';
import { ScrapedTelemetry } from '@/lib/LiveRCScraper';
import { ORP_Result } from '@/lib/ORPService';

// ==================== TYPES ====================

export type ConversationPhase = 'symptom' | 'clarifying' | 'proposal' | 'applied';

export type ChatMessageType = 'ai-question' | 'user-response' | 'ai-proposal' | 'ai-confirmation' | 'ai-guidance';
export type ProposalStatus = 'suggested' | 'applied' | 'reverted';

export interface ChatMessage {
  id: string;                               // UUID for temporal ordering
  role: 'user' | 'ai' | 'system';          // Message origin
  type: ChatMessageType;                    // Message classification
  content: string;                          // Text content
  timestamp: number;                        // Unix timestamp
  proposal?: {
    variant: 'primary' | 'alternative';
    prescription: Prescription;
    status: ProposalStatus;
    customValue?: string | number;          // User override (e.g., "115 CST")
    customFeedback?: string;                 // Post-application feedback
  };
}

export interface ProposalChoice {
  timestamp: number;
  choice: 'primary' | 'alternative';
  customValue?: string | number;
  prescription: Prescription;
  appliedProposalId?: string;               // Reference to chat message ID
}

// ===== NEW: Debrief & Session Context =====

export interface SessionContext {
  telemetry: ScrapedTelemetry;              // Lap telemetry from LiveRC scraper
  orp_score: ORP_Result;                    // Calculated ORP metrics
  fade_factor: number | null;               // Performance fade percentage
  current_setup_id: string;                 // Reference to the setup used
  applied_setup_snapshot: VehicleSetup;     // Deep-clone of full VehicleSetup
  racer_scribe_feedback?: string;           // High-level notes from Race Control
}

export interface Message {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  type?: ChatMessageType;
}

export interface AdvisorState {
  // ===== CONVERSATION STATE (New) =====
  conversationPhase: ConversationPhase;     // State machine: symptom → clarifying → proposal → applied
  chatMessages: ChatMessage[];              // Full message history with temporal ordering
  clarifyingQuestions: string[];            // AI's pending clarifying questions for current symptom
  userResponses: Record<string, string>;    // User's responses to clarifying questions (keyed by question)
  lastAppliedProposal?: ProposalChoice;     // Track most recent user action

  // ===== LEGACY STATE (Retained for compatibility) =====
  selectedSymptom: string | null;
  currentPrescription: Prescription | null;
  contextWarnings: string[];

  // Tire Status
  tireFatigue: 'TIRE_CHANGE_RECOMMENDED' | 'MONITOR_TIRE_WEAR' | null;
  runCount: number;

  // Loading States
  isLoading: boolean;
  isAccepting: boolean;
  error: string | null;

  // Session History & Context
  sessionSetupChanges: SetupChange[];
  isScenarioB: boolean;
  driverConfidence?: number;                // From Mission Control (1-10 scale)

  // ===== NEW: Debrief Mode State =====
  conversationLedger: Message[];            // Global AI-human dialogue history
  sessionContext: SessionContext | null;    // Debrief data bridge from RaceControl
  isDebriefMode: boolean;                   // Debrief mode toggle

  // ===== ACTIONS: Chat & Conversation =====
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  submitClarificationResponse: (questionIndex: number, response: string) => void;
  initiateSocraticLoop: (symptom: string, context: PrescriptionContext) => void;
  generateProposalsFromContext: (context: PrescriptionContext) => void;
  applyProposal: (
    choice: 'primary' | 'alternative',
    customValue?: string | number,
    setupChangeData?: Partial<SetupChange>
  ) => Promise<void>;
  revertLastProposal: (proposalId: string) => Promise<void>;

  // ===== ACTIONS: Legacy (refactored) =====
  selectSymptom: (symptom: string) => void;
  generatePrescription: (context: PrescriptionContext) => void;
  acceptPrescription: (
    choice: 'primary' | 'alternative',
    setupChangeData: Partial<SetupChange>
  ) => Promise<void>;
  setIsAccepting: (loading: boolean) => void;
  fetchSessionHistory: (changes: SetupChange[]) => void;
  setTireFatigue: (tireFatigue: 'TIRE_CHANGE_RECOMMENDED' | 'MONITOR_TIRE_WEAR' | null, runCount: number) => void;
  setScenarioB: (isScenarioB: boolean) => void;
  setDriverConfidence: (confidence: number) => void;
  setError: (error: string | null) => void;

  // ===== NEW: Debrief Mode Actions =====
  loadSessionContext: (context: SessionContext) => void; // Load Debrief data & inject system prompt
  addToLedger: (message: Message) => void; // Append to global conversation ledger
  setDebriefMode: (isActive: boolean) => void; // Toggle Debrief mode
  generateDebriefSystemPrompt: () => string; // Create system prompt from sessionContext

  reset: () => void;
}

// ==================== INITIAL STATE ====================

const INITIAL_STATE = {
  // Conversation (New)
  conversationPhase: 'symptom' as ConversationPhase,
  chatMessages: [],
  clarifyingQuestions: [],
  userResponses: {},
  lastAppliedProposal: undefined,

  // Legacy
  selectedSymptom: null,
  currentPrescription: null,
  contextWarnings: [],
  tireFatigue: null,
  runCount: 0,
  isLoading: false,
  isAccepting: false,
  error: null,
  sessionSetupChanges: [],
  isScenarioB: false,
  driverConfidence: undefined,

  // ===== NEW: Debrief Mode State =====
  conversationLedger: [],
  sessionContext: null,
  isDebriefMode: false,
};

// ==================== HELPER: Clarifying Questions by Symptom ====================

/**
 * Deterministic clarifying questions mapped by symptom
 * Returns array of 1-2 physics-specific follow-up questions
 */
function getClarifyingQuestionsForSymptom(symptom: string): string[] {
  const questionMap: Record<string, string[]> = {
    'Oversteer (Entry)': [
      'Is the oversteer happening right at turn-in, or partway through the corner?',
      'Does it get worse if you hit the brakes deeper into the turn?',
    ],
    'Understeer (Exit)': [
      'Is the understeer on throttle application, or just a slow front-end rotation?',
      'Does the car push even when you back off the throttle slightly?',
    ],
    'Bottoming Out': [
      'Where is it bottoming? (entry / apex / acceleration zone)',
      'Is it a hard clunk or a gradual loss of grip?',
    ],
    'Bumpy Track Feel': [
      'Are the bumps causing loss of grip, or just feeling harsh?',
      'Is it affecting one end of the car more than the other?',
    ],
    'Loose / Excessive Traction': [
      'When does it feel loose? (on power / off power / both)',
      'Is it the front sliding or the rear drifting wide?',
    ],
    'Tire Fade / Inconsistency': [
      'Does the grip fade gradually or suddenly drop off?',
      'Is it consistent across all four tires, or favoring one corner?',
    ],
  };

  return questionMap[symptom] || [
    'Can you describe exactly where in the lap you feel this?',
    'Does it happen on power, off power, or both?',
  ];
}

// ==================== STORE ====================

export const useAdvisorStore = create<AdvisorState>((set, get) => ({
  ...INITIAL_STATE,

  // ===== NEW: Chat & Conversation Actions =====

  /**
   * Add a message to the chat history
   */
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const timestamp = Date.now();
    const newMessage: ChatMessage = { ...message, id, timestamp };

    set((state) => ({
      chatMessages: [...state.chatMessages, newMessage],
    }));
  },

  /**
   * Initiate Socratic loop: User provides symptom → AI asks clarifying questions
   */
  initiateSocraticLoop: (symptom: string, context: PrescriptionContext) => {
    const state = get();

    // ===== CONFIDENCE GATE =====
    if (state.driverConfidence !== undefined && state.driverConfidence < 3) {
      const guidanceMsg = `⚠️ Driver confidence is currently ${state.driverConfidence}/10. I recommend more track time to build consistency before making setup changes. Continue driving to gather better baseline data.`;

      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            role: 'ai',
            type: 'ai-guidance',
            content: guidanceMsg,
            timestamp: Date.now(),
          },
        ],
        conversationPhase: 'symptom',
        error: null,
      }));
      return;
    }

    // ===== TIRE FATIGUE GATE =====
    if (state.tireFatigue === 'TIRE_CHANGE_RECOMMENDED') {
      const tireMsg = '🚨 TIRE CHANGE RECOMMENDED: Tires have exceeded the recommended run count. Replace tires first before making any suspension changes.';

      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            role: 'ai',
            type: 'ai-guidance',
            content: tireMsg,
            timestamp: Date.now(),
          },
        ],
        error: 'TIRE_CHANGE_REQUIRED',
      }));
      return;
    }

    // ===== LOG USER SYMPTOM =====
    set((state) => ({
      selectedSymptom: symptom,
      chatMessages: [
        ...state.chatMessages,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          role: 'user',
          type: 'user-response',
          content: symptom,
          timestamp: Date.now(),
        },
      ],
    }));

    // ===== GENERATE CLARIFYING QUESTIONS =====
    const questions = getClarifyingQuestionsForSymptom(symptom);
    const firstQuestion = questions[0];

    set((state) => ({
      conversationPhase: 'clarifying',
      clarifyingQuestions: questions,
      userResponses: {},
      chatMessages: [
        ...state.chatMessages,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          role: 'ai',
          type: 'ai-question',
          content: firstQuestion,
          timestamp: Date.now(),
        },
      ],
    }));
  },

  /**
   * User submits response to clarifying question
   */
  submitClarificationResponse: (questionIndex: number, response: string) => {
    const state = get();
    const question = state.clarifyingQuestions[questionIndex];

    if (!question) {
      set({ error: 'Invalid question index' });
      return;
    }

    // ===== LOG USER RESPONSE =====
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

    // ===== CHECK IF ALL QUESTIONS ANSWERED =====
    const allAnswered = state.clarifyingQuestions.every((q) => state.userResponses[q] || response);

    if (allAnswered) {
      // Move to proposal phase
      set((state) => ({
        conversationPhase: 'proposal',
      }));
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

  /**
   * Generate proposal cards after context is locked from clarifying questions
   */
  generateProposalsFromContext: (context: PrescriptionContext) => {
    const state = get();

    if (!state.selectedSymptom) {
      set({ error: 'No symptom selected' });
      return;
    }

    // ===== INSTITUTIONAL MEMORY: Check past fixes =====
    const relevantPastChanges = state.sessionSetupChanges.filter(
      (change) => change.parameter.toLowerCase().includes(state.selectedSymptom?.toLowerCase() || '')
    );

    let institutionalMemoryMsg = '';
    if (relevantPastChanges.length > 0) {
      const lastChange = relevantPastChanges[relevantPastChanges.length - 1];
      institutionalMemoryMsg = `📚 Institutional Memory: Last time we saw "${state.selectedSymptom}", we fixed it with "${lastChange.parameter}". Ready to try that approach again?`;

      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            role: 'ai',
            type: 'ai-guidance',
            content: institutionalMemoryMsg,
            timestamp: Date.now(),
          },
        ],
      }));
    }

    // ===== GENERATE PRESCRIPTION =====
    const result = getPrescriptionForSymptom(state.selectedSymptom, {
      ...context,
      scenarioB: state.isScenarioB,
    });

    if ('error' in result) {
      set({ error: result.error, currentPrescription: null });
      return;
    }

    const prescription = result;

    // ===== LOG PROPOSAL MESSAGE =====
    const proposalIntroMsg = `Based on your description and current conditions, here are two approaches to resolve "${state.selectedSymptom}":`;

    set((state) => ({
      currentPrescription: prescription,
      conversationPhase: 'proposal',
      chatMessages: [
        ...state.chatMessages,
        {
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          role: 'ai',
          type: 'ai-proposal',
          content: proposalIntroMsg,
          timestamp: Date.now(),
          proposal: {
            variant: 'primary',
            prescription,
            status: 'suggested',
          },
        },
      ],
      error: null,
    }));
  },

  /**
   * Apply a proposal choice (primary or alternative) with optional custom value
   */
  applyProposal: async (
    choice: 'primary' | 'alternative',
    customValue?: string | number,
    setupChangeData?: Partial<SetupChange>
  ) => {
    set({ isAccepting: true, error: null });

    try {
      const state = get();
      const prescription = state.currentPrescription;

      if (!prescription) {
        throw new Error('No prescription to apply');
      }

      const selectedFix = choice === 'primary' ? prescription.primary : prescription.alternative;

      // Prepare setup change payload
      const payload = {
        session_id: setupChangeData?.session_id as string,
        parameter: selectedFix.name,
        old_value: setupChangeData?.old_value || null,
        new_value: customValue ? String(customValue) : setupChangeData?.new_value || null,
        ai_reasoning: selectedFix.reasoning,
        status: 'pending' as const,
      };

      // Insert into Supabase
      const savedChange = await insertSetupChange(payload);

      // Create proposal choice object
      const proposalChoice: ProposalChoice = {
        timestamp: Date.now(),
        choice,
        customValue,
        prescription,
        appliedProposalId: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };

      // ===== LOG CONFIRMATION MESSAGE =====
      const confirmationMsg = `✅ Applied: ${selectedFix.name}${customValue ? ` (custom: ${customValue})` : ''}. The change has been logged and is pending implementation at the pit.`;

      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            role: 'ai',
            type: 'ai-confirmation',
            content: confirmationMsg,
            timestamp: Date.now(),
          },
        ],
        sessionSetupChanges: [...state.sessionSetupChanges, savedChange],
        lastAppliedProposal: proposalChoice,
        conversationPhase: 'applied',
        isAccepting: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply proposal';
      set({ error: errorMessage, isAccepting: false });
    }
  },

  /**
   * Revert a previously applied proposal
   */
  revertLastProposal: async (proposalId: string) => {
    set({ isAccepting: true, error: null });

    try {
      const state = get();

      if (!state.lastAppliedProposal) {
        throw new Error('No proposal to revert');
      }

      // Update status in sessionSetupChanges to 'reversed'
      const updatedChanges = state.sessionSetupChanges.map((change) =>
        change.id === proposalId ? { ...change, status: 'reversed' as const } : change
      );

      // ===== LOG REVERSION MESSAGE =====
      const revertMsg = `⏮️ Reverted: Last change has been undone. The vehicle is back to the previous state.`;

      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            role: 'ai',
            type: 'ai-confirmation',
            content: revertMsg,
            timestamp: Date.now(),
          },
        ],
        sessionSetupChanges: updatedChanges,
        lastAppliedProposal: undefined,
        isAccepting: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to revert proposal';
      set({ error: errorMessage, isAccepting: false });
    }
  },

  // ===== LEGACY: Compatibility Actions =====

  /**
   * Select a symptom (legacy: now triggers initiateSocraticLoop)
   */
  selectSymptom: (symptom: string) => {
    set({ selectedSymptom: symptom, error: null });
  },

  /**
   * Generate prescription (legacy: refactored into generateProposalsFromContext)
   */
  generatePrescription: (context: PrescriptionContext) => {
    const state = get();

    if (!state.selectedSymptom) {
      set({ error: 'No symptom selected' });
      return;
    }

    // Check tire fatigue override
    if (state.tireFatigue === 'TIRE_CHANGE_RECOMMENDED') {
      set({
        currentPrescription: null,
        error: null,
        contextWarnings: [
          '🚨 TIRE CHANGE RECOMMENDED',
          'All suspension recommendations are bypassed. Replace tires before continuing.',
        ],
      });
      return;
    }

    // Get prescription
    const result = getPrescriptionForSymptom(state.selectedSymptom, {
      ...context,
      scenarioB: state.isScenarioB,
    });

    if ('error' in result) {
      set({ error: result.error, currentPrescription: null });
      return;
    }

    // Generate context warnings
    const warnings = getContextWarnings(
      state.runCount,
      context.trackTemp,
      state.tireFatigue,
      state.driverConfidence
    );

    set({
      currentPrescription: result,
      contextWarnings: [...result.warnings, ...warnings],
      error: null,
    });
  },

  /**
   * Accept a prescription choice (legacy: now uses applyProposal)
   */
  acceptPrescription: async (choice: 'primary' | 'alternative', setupChangeData: Partial<SetupChange>) => {
    set({ isAccepting: true, error: null });

    try {
      const state = get();
      const prescription = state.currentPrescription;

      if (!prescription) {
        throw new Error('No prescription to accept');
      }

      const selectedFix = choice === 'primary' ? prescription.primary : prescription.alternative;

      // Prepare setup change payload
      const payload = {
        session_id: setupChangeData.session_id as string,
        parameter: selectedFix.name,
        old_value: setupChangeData.old_value || null,
        new_value: setupChangeData.new_value || null,
        ai_reasoning: selectedFix.reasoning,
        status: 'pending' as const,
      };

      // Insert into Supabase
      const savedChange = await insertSetupChange(payload);

      // Update session history
      set((state) => ({
        sessionSetupChanges: [...state.sessionSetupChanges, savedChange],
        isAccepting: false,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept prescription';
      set({ error: errorMessage, isAccepting: false });
    }
  },

  /**
   * Set accepting state
   */
  setIsAccepting: (loading: boolean) => {
    set({ isAccepting: loading });
  },

  /**
   * Fetch and display session history
   */
  fetchSessionHistory: (changes: SetupChange[]) => {
    set({ sessionSetupChanges: changes });
  },

  /**
   * Set tire fatigue status and run count
   */
  setTireFatigue: (tireFatigue: 'TIRE_CHANGE_RECOMMENDED' | 'MONITOR_TIRE_WEAR' | null, runCount: number) => {
    set({ tireFatigue, runCount });
  },

  /**
   * Set Scenario B (Conservative Mode)
   */
  setScenarioB: (isScenarioB: boolean) => {
    set({ isScenarioB });
  },

  /**
   * Set driver confidence (from Mission Control)
   */
  setDriverConfidence: (confidence: number) => {
    set({ driverConfidence: confidence });
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error });
  },

  // ===== NEW: Debrief Mode Actions =====

  /**
   * Load session context and inject Debrief system prompt
   * Called when "Start Debrief" button is clicked in RaceControl
   */
  loadSessionContext: (context: SessionContext) => {
    const systemPrompt = get().generateDebriefSystemPrompt();

    set({
      sessionContext: context,
      isDebriefMode: true,
      conversationPhase: 'clarifying', // Debrief asks clarifying questions
      chatMessages: [
        {
          id: `msg-${Date.now()}-system`,
          role: 'system',
          type: 'ai-guidance',
          content: systemPrompt,
          timestamp: Date.now(),
        },
      ],
      clarifyingQuestions: [
        `ORP dropped from ${context.orp_score.orp_score}% to a lower baseline. How did the car feel during that decline?`,
        `The Fade Factor shows ${context.fade_factor !== null ? `${(context.fade_factor * 100).toFixed(1)}%` : 'stable'} performance change. What mechanical sensations did you notice?`,
      ],
      userResponses: {},
    });
  },

  /**
   * Append message to global conversation ledger
   * Used for Librarian semantic search and institutional memory
   */
  addToLedger: (message: Message) => {
    set((state) => ({
      conversationLedger: [...state.conversationLedger, message],
    }));
  },

  /**
   * Toggle Debrief mode on/off
   */
  setDebriefMode: (isActive: boolean) => {
    set({ isDebriefMode: isActive });
  },

  /**
   * Generate Debrief system prompt from sessionContext
   * Injects ORP telemetry, setup context, and racer scribe feedback
   * COLD START: Detects first-run and injects SESSION_MANIFEST: FIRST_RUN marker
   */
  generateDebriefSystemPrompt: () => {
    const state = get();
    if (!state.sessionContext) return '';

    const { sessionContext } = state;
    const setupJson = JSON.stringify(sessionContext.applied_setup_snapshot, null, 2);

    // Cold Start Detection: Check if this is the first session (no prior history)
    const isFirstRun = state.sessionSetupChanges.length === 0 && state.conversationLedger.length === 0;
    const sessionManifest = isFirstRun ? 'SESSION_MANIFEST: FIRST_RUN' : 'SESSION_MANIFEST: ONGOING';

    return `
CRITICAL MISSION: DEBRIEF MODE
===============================
${sessionManifest}
Telemetry Data: ORP Score: ${sessionContext.orp_score.orp_score}/100, Fade Factor: ${sessionContext.fade_factor !== null ? `${(sessionContext.fade_factor * 100).toFixed(1)}%` : 'N/A'}
Raw Setup Context:
${setupJson}

Racer Scribe Notes: "${sessionContext.racer_scribe_feedback || 'No notes provided'}"

INSTRUCTION:
1. Present the ORP and Fade data as objective terminal reports.
2. Review the 'Raw Setup Context'—this is a dynamic object. Identify the current values for each category.
3. Ask one open-ended Socratic question about the car's behavior.
4. FORBIDDEN: Do not assume a cause. Let the racer articulate the mechanical or focus issue.${isFirstRun ? `

BASELINE ESTABLISHMENT (FIRST RUN):
- Frame all advice as establishing a baseline for future comparison, not as corrective measures.
- Avoid statements like "improve from last session" - there is no history.
- Emphasize: "This baseline will help us understand your typical performance range."
- Encourage consistent methodology: "Let's establish how the car responds with these settings."` : ''}
`.trim();
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set(INITIAL_STATE);
  },
}));

// ==================== SELECTORS ====================

/**
 * Get tire fatigue as a percentage for UI progress indicators
 */
export const useTireFatiguePercent = () => {
  const { runCount, tireFatigue } = useAdvisorStore();
  const baseThreshold = 6; // Hard-packed default
  return Math.min(100, (runCount / baseThreshold) * 100);
};

/**
 * Check if prescription can be accepted (not disabled)
 */
export const useCanAccept = () => {
  const { currentPrescription, tireFatigue, isAccepting } = useAdvisorStore();
  return (
    currentPrescription !== null &&
    tireFatigue !== 'TIRE_CHANGE_RECOMMENDED' &&
    !isAccepting
  );
};

// ==================== NEW SELECTORS: Chat & Conversation =====

/**
 * Get current clarifying question being asked
 */
export const useCurrentClarifyingQuestion = () => {
  const { clarifyingQuestions, chatMessages } = useAdvisorStore();
  const questionMessages = chatMessages.filter((m) => m.type === 'ai-question');
  const answeredCount = chatMessages.filter((m) => m.type === 'user-response').length;
  return clarifyingQuestions[answeredCount] || null;
};

/**
 * Check if user can apply a proposal (confidence + tire checks)
 */
export const useCanApplyProposal = () => {
  const { driverConfidence, tireFatigue, currentPrescription, isAccepting } = useAdvisorStore();

  if (driverConfidence !== undefined && driverConfidence < 3) return false;
  if (tireFatigue === 'TIRE_CHANGE_RECOMMENDED') return false;
  if (currentPrescription === null) return false;
  if (isAccepting) return false;

  return true;
};

/**
 * Get all messages for chat display (sorted by timestamp)
 */
export const useChatMessages = () => {
  const { chatMessages } = useAdvisorStore();
  return [...chatMessages].sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Check if conversation is in proposal phase and ready to show cards
 */
export const useIsProposalPhase = () => {
  const { conversationPhase } = useAdvisorStore();
  return conversationPhase === 'proposal';
};

/**
 * Check if conversation is in clarifying phase
 */
export const useIsClarifyingPhase = () => {
  const { conversationPhase } = useAdvisorStore();
  return conversationPhase === 'clarifying';
};
