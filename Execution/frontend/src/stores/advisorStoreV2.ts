/**
 * Advisor Store V2 (Refactored with Slices)
 * Composed from ConversationSlice, PrescriptionSlice, ContextSlice
 * Includes persist middleware for conversation state (sessionStorage)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SetupChange } from '@/types/database';
import {
  Prescription,
  PrescriptionContext,
  getPrescriptionForSymptom,
  getContextWarnings,
} from '@/lib/physicsAdvisor';
import {
  createConversationSlice,
  ConversationSlice,
} from './slices/conversationSlice';
import {
  createPrescriptionSlice,
  PrescriptionSlice,
} from './slices/prescriptionSlice';
import { createContextSlice, ContextSlice } from './slices/contextSlice';

// Re-export types for backward compatibility
export type { ChatMessage, ConversationPhase, Message, ProposalChoice } from './advisorStore';

// ==================== COMBINED STORE TYPE ====================

export type AdvisorStoreV2 = ConversationSlice &
  PrescriptionSlice &
  ContextSlice & {
    // Orchestration Actions (span multiple slices)
    initiateSocraticLoop: (
      symptom: string,
      context: PrescriptionContext
    ) => void;
    generateProposalsFromContext: (context: PrescriptionContext) => void;
    acceptPrescription: (
      choice: 'primary' | 'alternative',
      setupChangeData: Partial<SetupChange>
    ) => Promise<void>;
    generatePrescription: (context: PrescriptionContext) => void;
    reset: () => void;
  };

// ==================== HELPER: Clarifying Questions ====================

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

  return (
    questionMap[symptom] || [
      'Can you describe exactly where in the lap you feel this?',
      'Does it happen on power, off power, or both?',
    ]
  );
}

// ==================== STORE CREATION ====================

export const useAdvisorStoreV2 = create<AdvisorStoreV2>()(
  persist(
    (set, get, api) => ({
      // Compose slices
      ...createConversationSlice(set, get, api),
      ...createPrescriptionSlice(set, get, api),
      ...createContextSlice(set, get, api),

      // Orchestration Actions
      initiateSocraticLoop: (symptom, context) => {
        const state = get();

        // Confidence Gate
        if (
          state.driverConfidence !== undefined &&
          state.driverConfidence < 3
        ) {
          const guidanceMsg = `⚠️ Driver confidence is currently ${state.driverConfidence}/10. I recommend more track time to build consistency before making setup changes.`;

          state.addChatMessage({
            role: 'ai',
            type: 'ai-guidance',
            content: guidanceMsg,
          });

          set({ conversationPhase: 'symptom' });
          return;
        }

        // Tire Fatigue Gate
        if (state.tireFatigue === 'TIRE_CHANGE_RECOMMENDED') {
          const tireMsg =
            '🚨 TIRE CHANGE RECOMMENDED: Replace tires before making suspension changes.';

          state.addChatMessage({
            role: 'ai',
            type: 'ai-guidance',
            content: tireMsg,
          });

          state.setError('TIRE_CHANGE_REQUIRED');
          return;
        }

        // Log user symptom
        state.selectSymptom(symptom);
        state.addChatMessage({
          role: 'user',
          type: 'user-response',
          content: symptom,
        });

        // Generate clarifying questions
        const questions = getClarifyingQuestionsForSymptom(symptom);
        const firstQuestion = questions[0];

        set({
          conversationPhase: 'clarifying',
          clarifyingQuestions: questions,
          userResponses: {},
        });

        state.addChatMessage({
          role: 'ai',
          type: 'ai-question',
          content: firstQuestion,
        });
      },

      generateProposalsFromContext: (context) => {
        const state = get();

        if (!state.selectedSymptom) {
          state.setError('No symptom selected');
          return;
        }

        // Institutional Memory Check
        const relevantPastChanges = state.sessionSetupChanges.filter((change) =>
          change.parameter
            .toLowerCase()
            .includes(state.selectedSymptom?.toLowerCase() || '')
        );

        if (relevantPastChanges.length > 0) {
          const lastChange =
            relevantPastChanges[relevantPastChanges.length - 1];
          const institutionalMemoryMsg = `📚 Institutional Memory: Last time we saw "${state.selectedSymptom}", we fixed it with "${lastChange.parameter}".`;

          state.addChatMessage({
            role: 'ai',
            type: 'ai-guidance',
            content: institutionalMemoryMsg,
          });
        }

        // Generate prescription
        const result = getPrescriptionForSymptom(state.selectedSymptom, {
          ...context,
          scenarioB: state.isScenarioB,
        });

        if ('error' in result) {
          state.setError(result.error);
          state.setPrescription(null);
          return;
        }

        const prescription = result;
        const proposalIntroMsg = `Based on your description, here are two approaches to resolve "${state.selectedSymptom}":`;

        state.setPrescription(prescription);
        set({ conversationPhase: 'proposal' });

        state.addChatMessage({
          role: 'ai',
          type: 'ai-proposal',
          content: proposalIntroMsg,
          proposal: {
            variant: 'primary',
            prescription,
            status: 'suggested',
          },
        });

        state.setError(null);
      },

      generatePrescription: (context) => {
        const state = get();

        if (!state.selectedSymptom) {
          state.setError('No symptom selected');
          return;
        }

        // Tire fatigue override
        if (state.tireFatigue === 'TIRE_CHANGE_RECOMMENDED') {
          state.setPrescription(null);
          state.setContextWarnings([
            '🚨 TIRE CHANGE RECOMMENDED',
            'Replace tires before continuing.',
          ]);
          state.setError(null);
          return;
        }

        // Get prescription
        const result = getPrescriptionForSymptom(state.selectedSymptom, {
          ...context,
          scenarioB: state.isScenarioB,
        });

        if ('error' in result) {
          state.setError(result.error);
          state.setPrescription(null);
          return;
        }

        // Generate context warnings
        const warnings = getContextWarnings(
          state.runCount,
          context.trackTemp,
          state.tireFatigue,
          state.driverConfidence
        );

        state.setPrescription(result);
        state.setContextWarnings([...result.warnings, ...warnings]);
        state.setError(null);
      },

      acceptPrescription: async (choice, setupChangeData) => {
        const state = get();
        await state.applyProposal(choice, undefined, setupChangeData);
      },

      reset: () => {
        const state = get();
        state.resetConversation();
        state.resetPrescription();
        state.resetContext();
      },
    }),
    {
      name: 'apex-conversation',
      storage: createJSONStorage(() => sessionStorage),
      // Only persist conversation state
      partialize: (state) => ({
        chatMessages: state.chatMessages,
        conversationPhase: state.conversationPhase,
        conversationLedger: state.conversationLedger,
      }),
    }
  )
);

// ==================== SELECTORS ====================

export const useTireFatiguePercent = () => {
  const { runCount, tireFatigue } = useAdvisorStoreV2();
  const baseThreshold = 6;
  return Math.min(100, (runCount / baseThreshold) * 100);
};

export const useCanAccept = () => {
  const { currentPrescription, tireFatigue, isAccepting } =
    useAdvisorStoreV2();
  return (
    currentPrescription !== null &&
    tireFatigue !== 'TIRE_CHANGE_RECOMMENDED' &&
    !isAccepting
  );
};

export const useCanApplyProposal = () => {
  const { driverConfidence, tireFatigue, currentPrescription, isAccepting } =
    useAdvisorStoreV2();

  if (driverConfidence !== undefined && driverConfidence < 3) return false;
  if (tireFatigue === 'TIRE_CHANGE_RECOMMENDED') return false;
  if (currentPrescription === null) return false;
  if (isAccepting) return false;

  return true;
};

export const useChatMessages = () => {
  const { chatMessages } = useAdvisorStoreV2();

  const filtered = [...chatMessages]
    .filter((msg) => msg.role === 'user' || msg.role === 'ai')
    .sort((a, b) => a.timestamp - b.timestamp);

  return filtered;
};

export const useIsProposalPhase = () => {
  const { conversationPhase } = useAdvisorStoreV2();
  return conversationPhase === 'proposal';
};

export const useIsClarifyingPhase = () => {
  const { conversationPhase } = useAdvisorStoreV2();
  return conversationPhase === 'clarifying';
};

export const useCurrentClarifyingQuestion = () => {
  const { clarifyingQuestions, chatMessages } = useAdvisorStoreV2();
  const questionMessages = chatMessages.filter((m) => m.type === 'ai-question');
  const answeredCount = chatMessages.filter(
    (m) => m.type === 'user-response'
  ).length;
  return clarifyingQuestions[answeredCount] || null;
};
