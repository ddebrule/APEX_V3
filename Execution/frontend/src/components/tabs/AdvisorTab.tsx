'use client';

import { useEffect, useState, useRef } from 'react';
import Header from '@/components/common/Header';
import GlassCard from '@/components/common/GlassCard';
import ChatMessage from '@/components/advisor/ChatMessage';
import ProposalCardsContainer from '@/components/advisor/ProposalCardsContainer';
import {
  useAdvisorStore,
  useChatMessages,
  useIsProposalPhase,
  useIsClarifyingPhase,
  useCurrentClarifyingQuestion,
  useCanApplyProposal,
} from '@/stores/advisorStore';
import { useMissionControlStore } from '@/stores/missionControlStore';
import {
  calculateDynamicTireFatigue,
  getSessionScenario,
  getAvailableSymptoms,
  getTireThreshold,
  PrescriptionContext,
} from '@/lib/physicsAdvisor';
import { getSetupChanges } from '@/lib/queries';

export default function AdvisorTab() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [prescriptionContext, setPrescriptionContext] = useState<PrescriptionContext | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mission Control state (provides session context)
  const { selectedSession, selectedVehicle } = useMissionControlStore();

  // Advisor store with new chat actions
  const {
    conversationPhase,
    currentPrescription,
    tireFatigue,
    isScenarioB,
    isAccepting,
    error: storeError,
    initiateSocraticLoop,
    submitClarificationResponse,
    generateProposalsFromContext,
    applyProposal,
    revertLastProposal,
    setTireFatigue,
    setScenarioB,
    fetchSessionHistory,
  } = useAdvisorStore();

  // Chat selectors
  const chatMessages = useChatMessages();
  const isProposalPhase = useIsProposalPhase();
  const isClarifyingPhase = useIsClarifyingPhase();
  const currentQuestion = useCurrentClarifyingQuestion();
  const canApplyProposal = useCanApplyProposal();
  const availableSymptoms = getAvailableSymptoms();

  // ===== AUTO-SCROLL CHAT TO BOTTOM =====
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ===== INITIALIZATION =====
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);

        if (!selectedSession || !selectedVehicle) {
          setLocalError('No active session or vehicle selected');
          setIsInitializing(false);
          return;
        }

        // Calculate tire fatigue
        const trackContext = selectedSession.track_context as Record<string, unknown>;
        const surfaceType = (trackContext?.surface_type as string) || 'hard_packed';
        const estimatedRunCount = 0;
        const tireFatigueStatus = calculateDynamicTireFatigue(estimatedRunCount, surfaceType);
        setTireFatigue(tireFatigueStatus, estimatedRunCount);

        // Determine scenario (Scenario B for Main races)
        const sessionType = (selectedSession.session_type as 'practice' | 'qualifier' | 'main') || 'practice';
        const isScenarioBMode = getSessionScenario(sessionType, undefined);
        setScenarioB(isScenarioBMode);

        // Build prescription context
        const trackTemp = (trackContext?.temperature as number) || 75;
        setPrescriptionContext({
          trackTemp,
          scenarioB: isScenarioBMode,
          sessionType,
          surfaceType,
        });

        // Fetch setup history
        const setupChanges = await getSetupChanges(selectedSession.id as string);
        fetchSessionHistory(setupChanges);

        setLocalError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Initialization failed';
        setLocalError(errorMessage);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [selectedSession, selectedVehicle, setTireFatigue, setScenarioB, fetchSessionHistory]);

  // ===== HANDLERS =====

  const handleSymptomSelect = (symptom: string) => {
    if (!prescriptionContext) return;
    initiateSocraticLoop(symptom, prescriptionContext);
  };

  const handleClarifyingResponse = (response: string) => {
    submitClarificationResponse(0, response); // TODO: track question index properly

    // After all questions answered, generate proposals
    setTimeout(() => {
      if (prescriptionContext && conversationPhase === 'proposal') {
        generateProposalsFromContext(prescriptionContext);
      }
    }, 100);
  };

  const handleApplyProposal = async (choice: 'primary' | 'alternative', customValue?: string | number) => {
    if (!selectedSession) return;

    await applyProposal(choice, customValue, {
      session_id: selectedSession.id as string,
      old_value: undefined,
      new_value: customValue ? String(customValue) : undefined,
    });
  };

  const handleRevert = async (proposalId: string) => {
    await revertLastProposal(proposalId);
  };

  // ===== ERROR DISPLAY =====
  if (localError && !selectedSession) {
    return (
      <div className="w-full h-screen bg-apex-dark text-white overflow-auto p-6">
        <GlassCard className="border-apex-red border">
          <div className="text-center py-12">
            <p className="text-apex-red mb-4">⚠️ Initialization Error</p>
            <p className="text-sm text-gray-400">{localError}</p>
            <p className="text-xs text-gray-500 mt-4">Please initialize a session in Mission Control first.</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  const showTireOverlay = tireFatigue === 'TIRE_CHANGE_RECOMMENDED';

  // ===== RENDER =====
  return (
    <div className="w-full min-h-screen bg-apex-dark text-white overflow-auto">
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        {/* TOP BAR */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-apex-border">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold uppercase tracking-tight">A.P.E.X. V3</div>
            <div className="text-sm font-bold uppercase tracking-tight text-gray-500">Conversational Advisor</div>
          </div>

          <div className="flex items-center gap-3">
            {isScenarioB && (
              <div className="px-2 py-1 bg-apex-red/20 border border-apex-red rounded text-xs font-mono">
                SCENARIO B
              </div>
            )}
            {tireFatigue && (
              <div className="px-2 py-1 bg-amber-600/20 border border-amber-500 rounded text-xs font-mono">
                {tireFatigue === 'TIRE_CHANGE_RECOMMENDED' ? '🚨 TIRES' : '⚠️ MONITOR'}
              </div>
            )}
          </div>
        </div>

        {/* SESSION HEADER */}
        {selectedSession && (
          <div className="mb-6 pb-4 border-b border-apex-border">
            <h2 className="text-lg font-bold text-apex-green uppercase tracking-tight">
              {selectedSession.event_name}
            </h2>
            <p className="text-xs text-gray-500 mt-1 font-mono">
              {selectedVehicle?.brand} {selectedVehicle?.model} | {selectedSession.session_type?.toUpperCase()}
            </p>
          </div>
        )}

        {/* TIRE OVERLAY MESSAGE */}
        {showTireOverlay && (
          <div className="mb-6 p-4 bg-apex-red/20 border border-apex-red rounded">
            <p className="text-apex-red font-bold text-sm mb-1">🚨 TIRE CHANGE RECOMMENDED</p>
            <p className="text-xs text-gray-300">
              Tires have exceeded the recommended run count. Replace before proceeding with setup changes.
            </p>
          </div>
        )}

        {/* CHAT FEED */}
        <div className="mb-6 h-96 overflow-y-auto rounded border border-gray-700 bg-gray-900/30 p-4 space-y-3">
          {chatMessages.length === 0 && (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              <div className="text-center">
                <p className="mb-2">👋 Welcome to your Analytical Pit Partner</p>
                <p className="text-xs text-gray-600">
                  Select a symptom below to begin the Socratic dialogue
                </p>
              </div>
            </div>
          )}

          {chatMessages.map((message) => (
            <div key={message.id}>
              <ChatMessage
                message={message}
                onClarifyingResponse={handleClarifyingResponse}
                isLoading={isAccepting}
              />

              {/* Render ProposalCards after ai-proposal message */}
              {message.type === 'ai-proposal' && currentPrescription && (
                <ProposalCardsContainer
                  prescription={currentPrescription}
                  onApplyPrimary={(cv) => handleApplyProposal('primary', cv)}
                  onApplyAlternative={(cv) => handleApplyProposal('alternative', cv)}
                  isLoading={isAccepting}
                />
              )}
            </div>
          ))}

          <div ref={chatEndRef} />
        </div>

        {/* SYMPTOM SELECTOR (only if not in proposal/applied phase) */}
        {conversationPhase === 'symptom' && !showTireOverlay && (
          <div className="mb-6">
            <div className="text-xs text-gray-500 uppercase font-mono mb-3">Select a Symptom</div>
            <div className="grid grid-cols-2 gap-2">
              {availableSymptoms.slice(0, 6).map((symptom) => (
                <button
                  key={symptom}
                  onClick={() => handleSymptomSelect(symptom)}
                  disabled={isInitializing || isAccepting}
                  className="px-3 py-2 bg-gray-800 border border-gray-600 rounded hover:border-apex-green hover:bg-gray-700 text-xs font-mono text-white transition-colors disabled:opacity-50"
                >
                  {symptom}
                </button>
              ))}
            </div>
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">More symptoms...</summary>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {availableSymptoms.slice(6).map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => handleSymptomSelect(symptom)}
                    disabled={isInitializing || isAccepting}
                    className="px-3 py-2 bg-gray-800 border border-gray-600 rounded hover:border-apex-green hover:bg-gray-700 text-xs font-mono text-white transition-colors disabled:opacity-50"
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* STATUS BAR */}
        <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-700">
          <p>
            🤖 Conversational Advisor | Status: <span className="text-apex-green font-mono">
              {isInitializing ? 'INITIALIZING' : conversationPhase.toUpperCase()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
