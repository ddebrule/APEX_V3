/**
 * Physics Advisor Logic Engine
 * Single source of truth for all physics-based setup recommendations
 * Enforces tuning hierarchy and context-aware guardrails
 */

// ==================== TYPES ====================

export interface FixOption {
  name: string;                            // e.g., "Increase Front Shock Oil"
  category: string;                        // e.g., "Shock Oil", "Sway Bar"
  physicsImpact: number;                   // 0-100 scale
  executionSpeed: 'high' | 'low';          // High = <5 min, Low = 10+ min
  timingMinutes: number;                   // Estimated time in pit
  reasoning: string;                       // Physics explanation
}

export interface Prescription {
  primary: FixOption;
  alternative: FixOption;
  reasoning: string;
  warnings: string[];
}

export interface PrescriptionContext {
  trackTemp: number;                       // Celsius or Fahrenheit (we'll standardize to F)
  scenarioB: boolean;                      // Conservative mode (Main race or manual override)
  sessionType: 'practice' | 'qualifier' | 'main';
  surfaceType: 'loamy' | 'hard_packed' | 'clay' | string;
}

// ==================== CONSTANTS ====================

// Tire fatigue thresholds by surface type (Level 2 Dynamic)
const TIRE_THRESHOLDS: Record<string, number> = {
  'loamy': 10,           // Low wear, consistency-driven
  'soft_dirt': 10,       // Alias for loamy
  'hard_packed': 6,      // Edge wear accelerates
  'clay': 3,             // Abrasive, rapid degradation
  'abrasive': 3,         // Alias for clay
};

// Tire wear monitoring thresholds
const TIRE_FATIGUE_WARNING_THRESHOLD = 0.75; // 75% of max runs = warning

// Heat map temperature threshold (Fahrenheit)
const HOT_TRACK_THRESHOLD = 110;
const OIL_BOOST_CST = 100;

// Physics impact scores (used for Primary/Alternative scoring)
const PHYSICS_IMPACT_SCORES = {
  'Tires': 100,
  'Shock Oil': 80,
  'Sway Bars': 70,
  'Springs': 70,
  'Ride Height': 50,
  'Diff': 85,
  'Camber': 60,
};

// Execution speed (minutes)
const EXECUTION_SPEEDS = {
  'Tires': 2.5,
  'Shock Oil': 15,
  'Sway Bars': 2.5,
  'Springs': 10,
  'Ride Height': 1,
  'Diff': 5,
  'Camber': 3,
};

// ==================== SYMPTOM MAPPING ====================

interface SymptomFix {
  primary: FixOption;
  alternative: FixOption;
  reasoning: string;
}

// Core symptom library (deterministic, per Physics_Logic_Spec.md)
const SYMPTOM_LIBRARY: Record<string, SymptomFix> = {
  'Oversteer (Entry)': {
    primary: {
      name: 'Increase Front Shock Oil',
      category: 'Shock Oil',
      physicsImpact: PHYSICS_IMPACT_SCORES['Shock Oil'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Shock Oil'],
      reasoning: 'Thicker front oil slows weight transfer to front tires, reducing oversteer tendency on entry.',
    },
    alternative: {
      name: 'Soften Rear Spring',
      category: 'Springs',
      physicsImpact: 65,
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Springs'],
      reasoning: 'Softer rear spring improves rear grip on corner entry, balancing oversteer.',
    },
    reasoning: 'Entry oversteer indicates front tires are losing grip during turn-in. Weight transfer is too aggressive.',
  },

  'Understeer (Exit)': {
    primary: {
      name: 'Thicken Center Diff',
      category: 'Diff',
      physicsImpact: PHYSICS_IMPACT_SCORES['Diff'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Diff'],
      reasoning: 'Thicker center diff increases torque delivery to front wheels, improving exit grip.',
    },
    alternative: {
      name: 'Increase Rear Ride Height',
      category: 'Ride Height',
      physicsImpact: PHYSICS_IMPACT_SCORES['Ride Height'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Ride Height'],
      reasoning: 'Higher rear ride height reduces rear aero load, helping front end grip.',
    },
    reasoning: 'Exit understeer indicates insufficient front grip during acceleration. Front tires lack mechanical advantage.',
  },

  'Bottoming Out': {
    primary: {
      name: 'Increase Shock Oil',
      category: 'Shock Oil',
      physicsImpact: PHYSICS_IMPACT_SCORES['Shock Oil'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Shock Oil'],
      reasoning: 'Thicker oil controls damping speed, preventing chassis from bottoming.',
    },
    alternative: {
      name: 'Increase Ride Height',
      category: 'Ride Height',
      physicsImpact: PHYSICS_IMPACT_SCORES['Ride Height'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Ride Height'],
      reasoning: 'Mechanical ride height increase adds suspension travel room.',
    },
    reasoning: 'Bottoming is a damping issue. Oil controls the speed of compression; height provides mechanical clearance.',
  },

  'Bumpy Track Feel': {
    primary: {
      name: 'Soften Shock Oil',
      category: 'Shock Oil',
      physicsImpact: 75,
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Shock Oil'],
      reasoning: 'Thinner oil absorbs bumps better, reducing chassis chatter.',
    },
    alternative: {
      name: 'Soften Sway Bars',
      category: 'Sway Bars',
      physicsImpact: PHYSICS_IMPACT_SCORES['Sway Bars'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Sway Bars'],
      reasoning: 'Softer bars allow more independent suspension movement, improving bump compliance.',
    },
    reasoning: 'Loamy/bumpy tracks require compliance over stiffness. Suspension must absorb energy, not fight it.',
  },

  'Loose / Excessive Traction': {
    primary: {
      name: 'Thicken Front Diff',
      category: 'Diff',
      physicsImpact: PHYSICS_IMPACT_SCORES['Diff'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Diff'],
      reasoning: 'Thicker front diff reduces throttle steer, stabilizing the rear.',
    },
    alternative: {
      name: 'Thicken Front Sway Bar',
      category: 'Sway Bars',
      physicsImpact: PHYSICS_IMPACT_SCORES['Sway Bars'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Sway Bars'],
      reasoning: 'Stiffer front bar reduces body roll and stabilizes steering.',
    },
    reasoning: 'High-traction surfaces (clay, abrasive) amplify steering inputs. Mechanical stiffness is required.',
  },

  'Tire Fade / Inconsistency': {
    primary: {
      name: 'Adjust Camber',
      category: 'Camber',
      physicsImpact: PHYSICS_IMPACT_SCORES['Camber'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Camber'],
      reasoning: 'Camber affects tire contact patch. More negative = better grip, but thermal fade if too aggressive.',
    },
    alternative: {
      name: 'Reduce Tire Pressure',
      category: 'Tires',
      physicsImpact: 95,
      executionSpeed: 'high',
      timingMinutes: 2,
      reasoning: 'Lower pressure increases contact patch, improving grip and heat dissipation.',
    },
    reasoning: 'Tire inconsistency suggests thermal cycling or pressure drift. Track tire condition first.',
  },
};

// ==================== CORE FUNCTIONS ====================

/**
 * Calculate tire fatigue based on run count and surface type
 * Returns status: tire change recommended, monitor, or null (proceed normally)
 */
export function calculateDynamicTireFatigue(
  runCount: number,
  surfaceType: string
): 'TIRE_CHANGE_RECOMMENDED' | 'MONITOR_TIRE_WEAR' | null {
  // Normalize surface type
  const normalizedSurface = surfaceType.toLowerCase().replace(/[\s_-]/g, '_');
  const threshold = TIRE_THRESHOLDS[normalizedSurface] || TIRE_THRESHOLDS['hard_packed'];

  const fatigueRatio = runCount / threshold;

  if (runCount >= threshold) {
    return 'TIRE_CHANGE_RECOMMENDED';
  }

  if (fatigueRatio >= TIRE_FATIGUE_WARNING_THRESHOLD) {
    return 'MONITOR_TIRE_WEAR';
  }

  return null;
}

/**
 * Get tire fatigue severity as a percentage (0-100)
 */
export function getTireFatigueSeverity(
  runCount: number,
  surfaceType: string
): number {
  const normalizedSurface = surfaceType.toLowerCase().replace(/[\s_-]/g, '_');
  const threshold = TIRE_THRESHOLDS[normalizedSurface] || TIRE_THRESHOLDS['hard_packed'];
  return Math.min(100, (runCount / threshold) * 100);
}

/**
 * Apply heat map adjustment to shock oil recommendation
 * Hot tracks require thicker oil for proper damping
 */
export function applyHeatMapAdjustment(oilCST: number, trackTemp: number): number {
  if (trackTemp > HOT_TRACK_THRESHOLD) {
    return oilCST + OIL_BOOST_CST;
  }
  return oilCST;
}

/**
 * Get prescription for a given symptom, adjusted for context
 * Returns prescription or error object
 */
export function getPrescriptionForSymptom(
  symptom: string,
  context: PrescriptionContext
): Prescription | { error: string } {
  // Check if symptom exists in library
  if (!SYMPTOM_LIBRARY[symptom]) {
    return { error: `Symptom "${symptom}" not found in physics library.` };
  }

  const basePrescription = SYMPTOM_LIBRARY[symptom];

  // Clone to avoid mutations
  let primary = { ...basePrescription.primary };
  let alternative = { ...basePrescription.alternative };

  // ===== SCENARIO B: Conservative Mode (Main race) =====
  // Restrict to: Shock Oil, Ride Height, Camber only
  if (context.scenarioB) {
    const allowedCategories = ['Shock Oil', 'Ride Height', 'Camber'];

    // If primary is not allowed, swap with alternative
    if (!allowedCategories.includes(primary.category)) {
      if (allowedCategories.includes(alternative.category)) {
        [primary, alternative] = [alternative, primary];
      } else {
        // Both options violate Scenario B constraints
        return {
          error: 'Scenario B (Main race): No safe fixes available for this symptom. Recommend track time to improve consistency.',
        };
      }
    }
  }

  // ===== HEAT MAP ADJUSTMENT: Hot Track =====
  // If primary is Shock Oil and track is hot, boost recommendation
  if (primary.category === 'Shock Oil' && context.trackTemp > HOT_TRACK_THRESHOLD) {
    primary.reasoning += ` [HOT TRACK: +${OIL_BOOST_CST} CST boost applied at ${context.trackTemp}°F]`;
  }

  // ===== BIAS LOGIC =====
  // Practice session: favor Primary (Oil/Springs) - more aggressive tuning
  // Qualifying/Main: Primary is already limited by Scenario B above
  if (context.sessionType === 'practice') {
    // Primary is already good for practice; no change needed
  }

  return {
    primary,
    alternative,
    reasoning: basePrescription.reasoning,
    warnings: [],
  };
}

/**
 * Generate context-aware warnings for the user
 */
export function getContextWarnings(
  runCount: number,
  trackTemp: number,
  tireFatigue: string | null,
  confidence?: number
): string[] {
  const warnings: string[] = [];

  // Tire fatigue warning
  if (tireFatigue === 'TIRE_CHANGE_RECOMMENDED') {
    warnings.push('🚨 TIRE CHANGE RECOMMENDED: Tires have exceeded recommended run count. Replace before next session.');
  } else if (tireFatigue === 'MONITOR_TIRE_WEAR') {
    const severity = getTireFatigueSeverity(runCount, 'hard_packed');
    warnings.push(`⚠️ MONITOR TIRE WEAR: Tires at ${Math.round(severity)}% fatigue. Next session recommend fresh rubber.`);
  }

  // Heat map warning
  if (trackTemp > HOT_TRACK_THRESHOLD) {
    const delta = trackTemp - HOT_TRACK_THRESHOLD;
    warnings.push(`🔥 HOT TRACK DETECTED: ${trackTemp}°F (+${delta}°F above baseline). Oil recommendations boosted by ${OIL_BOOST_CST} CST.`);
  }

  // Confidence gate
  if (confidence !== undefined && confidence < 3) {
    warnings.push('⚠️ CONFIDENCE GATE: Driver confidence < 3/5. Recommend track time over setup changes.');
  }

  return warnings;
}

/**
 * Get all available symptoms for UI rendering
 */
export function getAvailableSymptoms(): string[] {
  return Object.keys(SYMPTOM_LIBRARY);
}

/**
 * Get tire threshold for a given surface type
 */
export function getTireThreshold(surfaceType: string): number {
  const normalizedSurface = surfaceType.toLowerCase().replace(/[\s_-]/g, '_');
  return TIRE_THRESHOLDS[normalizedSurface] || TIRE_THRESHOLDS['hard_packed'];
}

/**
 * Get session scenario (A or B) based on session type and optional override
 */
export function getSessionScenario(
  sessionType: 'practice' | 'qualifier' | 'main',
  manualOverride?: boolean
): boolean {
  // manualOverride = true means Scenario B (conservative)
  if (manualOverride !== undefined) {
    return manualOverride;
  }

  // Auto-trigger Scenario B for Main races (priority: risk mitigation)
  return sessionType === 'main';
}
