/**
 * ORPService.ts
 * Optimal Race Pace (ORP) calculation engine
 *
 * ORP = (Consistency * 0.6) + (Speed * 0.4)
 * Where:
 *   - Consistency: Inverted Coefficient of Variation (100 - CoV*5)
 *   - Speed: Global Top 5 percentile comparison
 *
 * This service is deterministic, testable, and physics-grounded.
 */

// ==================== TYPES ====================

export interface ORP_CalculationInput {
  lapTimes: number[]; // Individual lap times in seconds
  racerLaps: Record<string, any>; // Full LiveRC racerLaps object for Top 5 calculation
  driverId: string; // Current driver ID
}

export interface ORP_Result {
  orp_score: number; // 0-100
  consistency_score: number; // 0-100 (inverted CoV)
  speed_score: number; // 0-100 (percentile vs Top 5)
  fade_factor: number | null; // Performance decay, null if < 6 laps
  coV: number; // Raw Coefficient of Variation (0+)
  average_lap: number; // Mean lap time
  best_lap: number; // Minimum lap time
}

// ==================== CALCULATIONS ====================

/**
 * Calculate Coefficient of Variation (CoV) from lap times
 * CoV = (StandardDeviation / Mean) * 100
 * Lower is better (more consistent)
 */
export function calculateCoV(lapTimes: number[]): number {
  if (lapTimes.length === 0) return 0;

  const mean = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
  if (mean === 0) return 0;

  const variance =
    lapTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) /
    lapTimes.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev / mean) * 100;
}

/**
 * Normalize CoV to a 0-100 consistency score
 * Score = Max(0, 100 - (CoV * 5))
 * Assumption: 20% CoV = "Zero Score" (100 - 20*5 = 0)
 * At 0% CoV (perfect): 100
 * At 20%+ CoV (bad): 0 or less (clamped to 0)
 */
export function normalizeConsistencyScore(coV: number): number {
  const score = 100 - coV * 5;
  return Math.max(0, score);
}

/**
 * Get the global Top 5 average lap time from the entire racerLaps set
 * Used to normalize individual SpeedScore
 */
export function getGlobalTop5Average(
  racerLaps: Record<string, any>
): number {
  const allAverages = Object.values(racerLaps)
    .map((r) => parseFloat(r.avgLap))
    .filter((avg) => !isNaN(avg))
    .sort((a, b) => a - b)
    .slice(0, 5);

  if (allAverages.length === 0) return 0;

  return allAverages.reduce((a, b) => a + b, 0) / allAverages.length;
}

/**
 * Calculate SpeedScore as a percentile vs Top 5
 * SpeedScore = (Top5Avg / MyAvg) * 100
 * At parity: 100
 * 10% faster than Top 5: ~91 (not possible, capped at 100)
 * 10% slower than Top 5: ~91
 */
export function calculateSpeedScore(
  myAverageLap: number,
  top5Average: number
): number {
  if (myAverageLap === 0 || top5Average === 0) return 0;

  const score = (top5Average / myAverageLap) * 100;
  return Math.min(score, 100); // Cap at 100 (can't exceed)
}

/**
 * Calculate performance fade (degradation) from first 3 to last 3 laps
 * Fade = (Avg(Last 3) - Avg(First 3)) / Avg(First 3)
 * Positive = Getting slower (fade)
 * Negative = Getting faster (improving)
 * Returns null if < 6 laps (not enough data)
 */
export function calculateFade(lapTimes: number[]): number | null {
  if (lapTimes.length < 6) return null;

  const firstThree = lapTimes.slice(0, 3);
  const lastThree = lapTimes.slice(-3);

  const avgFirst = firstThree.reduce((a, b) => a + b, 0) / 3;
  const avgLast = lastThree.reduce((a, b) => a + b, 0) / 3;

  if (avgFirst === 0) return null;

  return (avgLast - avgFirst) / avgFirst; // Positive = Performance Fade (Slower)
}

/**
 * Main ORP calculation
 * Input: Lap times, full racerLaps object, driver ID
 * Output: Complete ORP result object with all metrics
 */
export function calculateORP(input: ORP_CalculationInput): ORP_Result {
  const { lapTimes, racerLaps, driverId } = input;

  // Guard: No lap data
  if (lapTimes.length === 0) {
    return {
      orp_score: 0,
      consistency_score: 0,
      speed_score: 0,
      fade_factor: null,
      coV: 0,
      average_lap: 0,
      best_lap: 0,
    };
  }

  // Calculate basic metrics
  const average_lap = lapTimes.reduce((a, b) => a + b, 0) / lapTimes.length;
  const best_lap = Math.min(...lapTimes);
  const coV = calculateCoV(lapTimes);
  const consistency_score = normalizeConsistencyScore(coV);

  // Calculate SpeedScore via global Top 5
  const top5Average = getGlobalTop5Average(racerLaps);
  const speed_score = calculateSpeedScore(average_lap, top5Average);

  // Calculate Fade Factor
  const fade_factor = calculateFade(lapTimes);

  // Calculate ORP = (Consistency * 0.6) + (Speed * 0.4)
  const orp_score = consistency_score * 0.6 + speed_score * 0.4;

  return {
    orp_score: Math.round(orp_score),
    consistency_score: Math.round(consistency_score),
    speed_score: Math.round(speed_score),
    fade_factor,
    coV: Math.round(coV * 100) / 100, // Round to 2 decimals
    average_lap: Math.round(average_lap * 1000) / 1000,
    best_lap: Math.round(best_lap * 1000) / 1000,
  };
}

// ==================== DIAGNOSTICS ====================

/**
 * Generate a human-readable diagnostic of ORP breakdown
 * Used for UI display and Debrief context
 */
export function formatORPDiagnostic(result: ORP_Result): string {
  return `
ORP Score: ${result.orp_score}/100
├─ Consistency: ${result.consistency_score}/100 (CoV: ${result.coV}%)
├─ Speed: ${result.speed_score}/100
└─ Fade Factor: ${result.fade_factor !== null ? `${(result.fade_factor * 100).toFixed(1)}%` : 'N/A (< 6 laps)'}

Best Lap: ${result.best_lap.toFixed(3)}s
Average Lap: ${result.average_lap.toFixed(3)}s
`.trim();
}
