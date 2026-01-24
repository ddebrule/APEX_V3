/**
 * Prescription Slice
 * Manages physics-based setup prescriptions and proposals
 * Handles primary/alternative fixes and application logic
 */

import { StateCreator } from 'zustand';
import { SetupChange } from '@/types/database';
import { insertSetupChange } from '@/lib/queries';
import { Prescription } from '@/lib/physicsAdvisor';
import type { ProposalChoice } from '../advisorStore';

export interface PrescriptionSlice {
  // State
  selectedSymptom: string | null;
  currentPrescription: Prescription | null;
  contextWarnings: string[];
  lastAppliedProposal?: ProposalChoice;
  isAccepting: boolean;
  error: string | null;

  // Actions
  selectSymptom: (symptom: string) => void;
  setPrescription: (prescription: Prescription | null) => void;
  setContextWarnings: (warnings: string[]) => void;
  applyProposal: (
    choice: 'primary' | 'alternative',
    customValue?: string | number,
    setupChangeData?: Partial<SetupChange>
  ) => Promise<void>;
  revertLastProposal: (proposalId: string) => Promise<void>;
  setIsAccepting: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetPrescription: () => void;
}

const initialPrescriptionState = {
  selectedSymptom: null,
  currentPrescription: null,
  contextWarnings: [],
  lastAppliedProposal: undefined,
  isAccepting: false,
  error: null,
};

export const createPrescriptionSlice: StateCreator<
  PrescriptionSlice,
  [],
  [],
  PrescriptionSlice
> = (set, get) => ({
  ...initialPrescriptionState,

  selectSymptom: (symptom) => {
    set({ selectedSymptom: symptom, error: null });
  },

  setPrescription: (prescription) => {
    set({ currentPrescription: prescription });
  },

  setContextWarnings: (warnings) => {
    set({ contextWarnings: warnings });
  },

  applyProposal: async (choice, customValue, setupChangeData) => {
    set({ isAccepting: true, error: null });

    try {
      const state = get();
      const prescription = state.currentPrescription;

      if (!prescription) {
        throw new Error('No prescription to apply');
      }

      const selectedFix =
        choice === 'primary' ? prescription.primary : prescription.alternative;

      // Prepare setup change payload
      const payload = {
        session_id: setupChangeData?.session_id as string,
        parameter: selectedFix.name,
        old_value: setupChangeData?.old_value || null,
        new_value: customValue
          ? String(customValue)
          : setupChangeData?.new_value || null,
        ai_reasoning: selectedFix.reasoning,
        status: 'pending' as const,
      };

      // Insert into Supabase
      await insertSetupChange(payload);

      // Create proposal choice object
      const proposalChoice: ProposalChoice = {
        timestamp: Date.now(),
        choice,
        customValue,
        prescription,
        appliedProposalId: `msg-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 9)}`,
      };

      set({
        lastAppliedProposal: proposalChoice,
        isAccepting: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to apply proposal';
      set({ error: errorMessage, isAccepting: false });
    }
  },

  revertLastProposal: async (proposalId) => {
    set({ isAccepting: true, error: null });

    try {
      const state = get();

      if (!state.lastAppliedProposal) {
        throw new Error('No proposal to revert');
      }

      // TODO: Update status in database to 'reversed'
      // This will need to be implemented with proper DB call

      set({
        lastAppliedProposal: undefined,
        isAccepting: false,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to revert proposal';
      set({ error: errorMessage, isAccepting: false });
    }
  },

  setIsAccepting: (loading) => {
    set({ isAccepting: loading });
  },

  setError: (error) => {
    set({ error });
  },

  resetPrescription: () => {
    set(initialPrescriptionState);
  },
});
