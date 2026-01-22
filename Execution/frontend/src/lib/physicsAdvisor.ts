/**
 * Physics Advisor Logic Engine
 * Single source of truth for all physics-based setup recommendations
 * Enforces tuning hierarchy and context-aware guardrails
 */

// ==================== TYPES ====================

export interface FixOption {
  name: string;                            // e.g., "Increase Front Shock Oil to 500 CST + 1.6mm Piston"
  category: string;                        // e.g., "Shock Oil", "Sway Bar"
  physicsImpact: number;                   // 0-100 scale
  executionSpeed: 'high' | 'low';          // High = <5 min, Low = 10+ min
  timingMinutes: number;                   // Estimated time in pit
  reasoning: string;                       // Physics explanation
  // Piston Primacy: Oil + Piston pairing
  oilCST?: number;                         // e.g., 500 CST
  pistonSize?: string;                     // e.g., "1.6mm"
  pistonType?: string;                     // e.g., "Tekno", "Kyosho", "Xray"
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

// ==================== XV4 SPLIT-VALVE LOGIC ====================

// XV4 Return Valve Washers (VRP Split-Valve Design)
const XV4_WASHERS = {
  'Black': { reboundLevel: 100, description: 'Maximum rebound - best for ruts and loose surfaces' },
  'Red': { reboundLevel: 75, description: 'High rebound - balanced grip/stability' },
  'Gold': { reboundLevel: 50, description: 'Medium rebound - general purpose' },
  'Blue': { reboundLevel: 25, description: 'Low rebound - smooth surfaces, prevents oscillation' },
};

// XV4 Piston Hole Specifications
const XV4_HOLES = {
  '1.0mm': { lowSpeedFlow: 'tight', highSpeedFlow: 'restricted', application: 'smooth/high-grip tracks' },
  '1.1mm': { lowSpeedFlow: 'medium', highSpeedFlow: 'restricted', application: 'mixed surfaces, rut control' },
  '1.3mm': { lowSpeedFlow: 'open', highSpeedFlow: 'medium', application: 'bumpy/loamy tracks' },
  '1.5mm': { lowSpeedFlow: 'open', highSpeedFlow: 'open', application: 'maximum compliance' },
};

/**
 * XV4 Flow Index Calculator
 * Estimates total suspension flow based on washer + hole configuration
 * Returns index 0-100 (lower = more restriction, higher = more compliance)
 */
export function calculateXV4FlowIndex(washerColor: string, holeDiameter: string): number {
  const washer = XV4_WASHERS[washerColor as keyof typeof XV4_WASHERS];
  const holes = XV4_HOLES[holeDiameter as keyof typeof XV4_HOLES];

  if (!washer || !holes) return 50; // Default to neutral

  // Base flow from washer rebound level
  let flowIndex = washer.reboundLevel;

  // Adjust for hole diameter
  const holeAdjustments: Record<string, number> = {
    '1.0mm': -20,
    '1.1mm': 0,
    '1.3mm': 15,
    '1.5mm': 30,
  };

  flowIndex += holeAdjustments[holeDiameter] || 0;
  return Math.min(100, Math.max(0, flowIndex));
}

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
      name: 'Increase Front Shock Oil to 500 CST + 1.6mm Piston',
      category: 'Shock Oil',
      physicsImpact: PHYSICS_IMPACT_SCORES['Shock Oil'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Shock Oil'],
      oilCST: 500,
      pistonSize: '1.6mm',
      pistonType: 'Tekno',
      reasoning: 'Thicker front oil (500 CST) slows weight transfer to front tires, reducing oversteer on entry. 1.6mm piston reduces low-speed bleed, maintaining mid-stroke control.',
    },
    alternative: {
      name: 'Soften Rear Spring to Blue',
      category: 'Springs',
      physicsImpact: 65,
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Springs'],
      reasoning: 'Softer rear spring (Blue) improves rear grip on corner entry, balancing oversteer.',
    },
    reasoning: 'Entry oversteer indicates front tires are losing grip during turn-in. Weight transfer is too aggressive.',
  },

  'Understeer (Exit)': {
    primary: {
      name: 'Thicken Center Diff to 10K Oil',
      category: 'Diff',
      physicsImpact: PHYSICS_IMPACT_SCORES['Diff'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Diff'],
      reasoning: 'Thicker center diff (10K oil) increases torque delivery to front wheels, improving exit grip.',
    },
    alternative: {
      name: 'Increase Rear Ride Height by +2.5mm',
      category: 'Ride Height',
      physicsImpact: PHYSICS_IMPACT_SCORES['Ride Height'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Ride Height'],
      reasoning: 'Higher rear ride height (+2.5mm) reduces rear aero load, helping front end grip.',
    },
    reasoning: 'Exit understeer indicates insufficient front grip during acceleration. Front tires lack mechanical advantage.',
  },

  'Bottoming Out': {
    primary: {
      name: 'Increase Shock Oil to 550 CST + 1.5mm Piston',
      category: 'Shock Oil',
      physicsImpact: PHYSICS_IMPACT_SCORES['Shock Oil'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Shock Oil'],
      oilCST: 550,
      pistonSize: '1.5mm',
      pistonType: 'Tekno',
      reasoning: 'Thicker oil (550 CST) controls damping speed, preventing chassis from bottoming. 1.5mm piston restricts compression flow.',
    },
    alternative: {
      name: 'Increase Ride Height by +3.0mm',
      category: 'Ride Height',
      physicsImpact: PHYSICS_IMPACT_SCORES['Ride Height'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Ride Height'],
      reasoning: 'Mechanical ride height increase (+3.0mm) adds suspension travel room.',
    },
    reasoning: 'Bottoming is a damping issue. Oil controls the speed of compression; height provides mechanical clearance.',
  },

  'Bumpy Track Feel': {
    primary: {
      name: 'Soften Shock Oil to 350 CST + 1.8mm Piston',
      category: 'Shock Oil',
      physicsImpact: 75,
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Shock Oil'],
      oilCST: 350,
      pistonSize: '1.8mm',
      pistonType: 'Tekno',
      reasoning: 'Thinner oil (350 CST) absorbs bumps better, reducing chassis chatter. 1.8mm piston allows greater low-speed compliance.',
    },
    alternative: {
      name: 'Soften Sway Bars by -0.3mm',
      category: 'Sway Bars',
      physicsImpact: PHYSICS_IMPACT_SCORES['Sway Bars'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Sway Bars'],
      reasoning: 'Softer bars allow more independent suspension movement, improving bump compliance.',
    },
    reasoning: 'Loamy/bumpy tracks require compliance over stiffness. Suspension must absorb energy, not fight it.',
  },

  'High-Speed Ruts / Chattering': {
    primary: {
      name: 'Switch to Black XV4 Rebound Washer (Rear) + 1.1mm Holes',
      category: 'Return Valves',
      physicsImpact: 85,
      executionSpeed: 'low',
      timingMinutes: 10,
      reasoning: 'Black washer (max rebound) keeps tire in contact with ground through ruts. 1.1mm holes balance low-speed tracking (rut compliance) with high-speed pack. VRP split-valve design allows independent rebound control.',
    },
    alternative: {
      name: 'Switch Rear XV4 to 1.1mm Holes + Gold Washer',
      category: 'Pistons',
      physicsImpact: 80,
      executionSpeed: 'low',
      timingMinutes: 15,
      reasoning: 'Gold washer (medium rebound) with 1.1mm holes provides balanced compliance. Preferred if chattering occurs at mid-speed transitions.',
    },
    reasoning: 'Ruts require fast rebound and controlled low-speed flow. XV4 split-valve design (washer + hole pairing) allows independent tuning of rebound velocity vs. fluid bleed.',
  },

  'Loose / Excessive Traction': {
    primary: {
      name: 'Thicken Front Diff to 12K Oil',
      category: 'Diff',
      physicsImpact: PHYSICS_IMPACT_SCORES['Diff'],
      executionSpeed: 'low',
      timingMinutes: EXECUTION_SPEEDS['Diff'],
      reasoning: 'Thicker front diff (12K oil) reduces throttle steer, stabilizing the rear end on high-traction clay.',
    },
    alternative: {
      name: 'Thicken Front Sway Bar by +0.2mm',
      category: 'Sway Bars',
      physicsImpact: PHYSICS_IMPACT_SCORES['Sway Bars'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Sway Bars'],
      reasoning: 'Stiffer front bar (+0.2mm) reduces body roll and stabilizes steering.',
    },
    reasoning: 'High-traction surfaces (clay, abrasive) amplify steering inputs. Mechanical stiffness is required.',
  },

  'Tire Fade / Inconsistency': {
    primary: {
      name: 'Adjust Camber to -2.5° (F) / -1.8° (R)',
      category: 'Camber',
      physicsImpact: PHYSICS_IMPACT_SCORES['Camber'],
      executionSpeed: 'high',
      timingMinutes: EXECUTION_SPEEDS['Camber'],
      reasoning: 'Camber (-2.5° F / -1.8° R) affects tire contact patch. More negative = better grip, but thermal fade if too aggressive.',
    },
    alternative: {
      name: 'Reduce Tire Pressure by -0.05 BAR',
      category: 'Tires',
      physicsImpact: 95,
      executionSpeed: 'high',
      timingMinutes: 2,
      reasoning: 'Lower pressure (-0.05 BAR) increases contact patch, improving grip and heat dissipation.',
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
