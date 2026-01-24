/**
 * Context Slice
 * Manages session context, telemetry, environmental conditions
 * Handles debrief mode and session history
 */

import { StateCreator } from 'zustand';
import { SetupChange } from '@/types/database';
import type { SessionContext } from '../advisorStore';

export interface ContextSlice {
  // State
  sessionContext: SessionContext | null;
  isDebriefMode: boolean;
  sessionSetupChanges: SetupChange[];
  tireFatigue: 'TIRE_CHANGE_RECOMMENDED' | 'MONITOR_TIRE_WEAR' | null;
  runCount: number;
  driverConfidence?: number;
  isScenarioB: boolean;

  // Actions
  loadSessionContext: (context: SessionContext) => void;
  setDebriefMode: (isActive: boolean) => void;
  fetchSessionHistory: (changes: SetupChange[]) => void;
  setTireFatigue: (
    tireFatigue: 'TIRE_CHANGE_RECOMMENDED' | 'MONITOR_TIRE_WEAR' | null,
    runCount: number
  ) => void;
  setScenarioB: (isScenarioB: boolean) => void;
  setDriverConfidence: (confidence: number) => void;
  generateDebriefSystemPrompt: () => string;
  resetContext: () => void;
}

const initialContextState = {
  sessionContext: null,
  isDebriefMode: false,
  sessionSetupChanges: [],
  tireFatigue: null,
  runCount: 0,
  driverConfidence: undefined,
  isScenarioB: false,
};

export const createContextSlice: StateCreator<
  ContextSlice,
  [],
  [],
  ContextSlice
> = (set, get) => ({
  ...initialContextState,

  loadSessionContext: (context) => {
    set({
      sessionContext: context,
      isDebriefMode: true,
    });
  },

  setDebriefMode: (isActive) => {
    set({ isDebriefMode: isActive });
  },

  fetchSessionHistory: (changes) => {
    set({ sessionSetupChanges: changes });
  },

  setTireFatigue: (tireFatigue, runCount) => {
    set({ tireFatigue, runCount });
  },

  setScenarioB: (isScenarioB) => {
    set({ isScenarioB });
  },

  setDriverConfidence: (confidence) => {
    set({ driverConfidence: confidence });
  },

  generateDebriefSystemPrompt: () => {
    const state = get();
    if (!state.sessionContext) return '';

    const { sessionContext } = state;
    const setupJson = JSON.stringify(
      sessionContext.applied_setup_snapshot,
      null,
      2
    );

    // Cold Start Detection
    const isFirstRun =
      state.sessionSetupChanges.length === 0;
    const sessionManifest = isFirstRun
      ? 'SESSION_MANIFEST: FIRST_RUN'
      : 'SESSION_MANIFEST: ONGOING';

    // Diagnostic Hierarchy
    const isQualifier =
      sessionContext.session_type === 'qualifier' ||
      (sessionContext.session_duration_minutes || 0) < 10;
    const isLongMain =
      sessionContext.session_type === 'main' &&
      (sessionContext.session_duration_minutes || 0) > 12;

    const diagnosticHierarchy = isQualifier
      ? `
SESSION AWARENESS (QUALIFIER < 10 MIN):
- Tire wear is NEGLIGIBLE. Do NOT lead with tire-related questions.
- DIAGNOSTIC HIERARCHY (in order):
  1. TRACK EVOLUTION: Surface changes, drying, grooving, blowing out
  2. MECHANICAL: Nitro thermal drift, Eco-motor heat soak, clutch engagement, drivetrain friction
  3. DRIVER FOCUS/FATIGUE: Lap-to-lap mental consistency
- FORBIDDEN: Do not guess track location (e.g., "in the rhythm section")
- ONLY ask about mechanics and behavior: "Did the track surface blow out, or did the car feel mechanically lazy?"`
      : isLongMain
      ? `
SESSION AWARENESS (MAIN > 12 MIN):
- Tire wear becomes a valid diagnostic factor AFTER the primary hierarchy is explored
- DIAGNOSTIC HIERARCHY (in order):
  1. TRACK EVOLUTION: Surface changes first
  2. MECHANICAL: Hardware drift and thermal soak second
  3. DRIVER FOCUS/FATIGUE: Consistency third
  4. TIRE WEAR: Only after the above are ruled out
- FORBIDDEN: Do not assume tire wear without confirming other factors first`
      : `
SESSION AWARENESS (PRACTICE):
- Use same diagnostic hierarchy as Qualifiers
- Focus on baseline establishment and driver comfort
- Tire considerations secondary to learning curve`;

    return `
CRITICAL MISSION: DEBRIEF MODE
===============================
${sessionManifest}
Telemetry Data: ORP Score: ${sessionContext.orp_score.orp_score}/100, Fade Factor: ${
      sessionContext.fade_factor !== null
        ? `${(sessionContext.fade_factor * 100).toFixed(1)}%`
        : 'N/A'
    }
Raw Setup Context:
${setupJson}

Racer Scribe Notes: "${sessionContext.racer_scribe_feedback || 'No notes provided'}"

${diagnosticHierarchy}

INSTRUCTION:
1. Present the ORP and Fade data as objective terminal reports.
2. Review the 'Raw Setup Context'—Identify current values for each category (TIRES → GEOMETRY → SHOCKS → POWER).
3. Ask ONE open-ended Socratic question about the car's behavior using the diagnostic hierarchy above.
4. FORBIDDEN: Do not assume a cause. Let the racer articulate the mechanical or focus issue.
5. FORBIDDEN: Do not suggest solutions—only diagnostic questions.${
      isFirstRun
        ? `

BASELINE ESTABLISHMENT (FIRST RUN):
- Frame all advice as establishing a baseline for future comparison, not as corrective measures.
- Avoid statements like "improve from last session" - there is no history.
- Emphasize: "This baseline will help us understand your typical performance range."
- Encourage consistent methodology: "Let's establish how the car responds with these settings."`
        : ''
    }
`.trim();
  },

  resetContext: () => {
    set(initialContextState);
  },
});
