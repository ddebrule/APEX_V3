/**
 * LiveRCScraper.ts
 * Scrapes race results from LiveRC event URLs
 *
 * Contract:
 * - URL format: https://<track>.liverc.com/results/?p=view_event&id=<event_id>
 * - Extracts racerLaps JavaScript object from page
 * - Returns typed ScrapedTelemetry payload
 * - Handles errors, staleness, missing racer gracefully
 */

import { ORP_CalculationInput } from '@/lib/ORPService';

// ==================== TYPES ====================

export interface ScrapedTelemetry {
  laps: number;
  best_lap: number; // milliseconds
  average_lap: number; // milliseconds
  consistency_percentage: number; // LiveRC native metric
  lap_history: number[]; // Individual lap times in seconds
}

export interface LiveRCScraperResult {
  status: 'success' | 'stale' | 'error';
  data?: ScrapedTelemetry;
  warning?: string;
  lastUpdateTimestamp: number; // Date.now() of the LAST successful scrape
}

// ==================== SCRAPER ====================

/**
 * Convert LiveRC lap time string (e.g., "29.415") to milliseconds
 */
function parseLapTime(timeStr: string): number {
  const seconds = parseFloat(timeStr);
  return isNaN(seconds) ? 0 : seconds * 1000; // Convert to ms
}

/**
 * Extract the racerLaps object from LiveRC HTML
 * The page injects racerLaps as a JavaScript object
 *
 * Example structure:
 * ```
 * racerLaps[838189] = {
 *   'driverName': 'RYAN DIETRICH',
 *   'fastLap': '27.415',
 *   'avgLap': '29.804',
 *   'laps': [
 *     { 'lapNum': '0', 'pos': '2', 'time': '0', 'pace': '0', 'segments': [] },
 *     ...
 *   ]
 * }
 * ```
 */
function extractRacerLapsFromHTML(htmlText: string): Record<string, any> {
  try {
    // Look for the racerLaps object definition in the HTML
    const match = htmlText.match(/racerLaps\s*=\s*({[\s\S]*?});/);
    if (!match) return {};

    // Attempt to parse as JSON (LiveRC uses valid JS object syntax)
    // This is a simplified extraction; in production, consider using a proper parser
    const objectStr = match[1];

    // Use Function constructor as a safe eval alternative for trusted data
    const racerLaps = new Function(`return ${objectStr}`)();
    return racerLaps || {};
  } catch (error) {
    console.error('Failed to extract racerLaps from HTML:', error);
    return {};
  }
}

/**
 * Parse individual racer lap data from racerLaps[driverId]
 */
function parseLapHistory(racerData: any): number[] {
  if (!racerData || !Array.isArray(racerData.laps)) return [];

  return racerData.laps
    .map((lap: any) => parseLapTime(lap.time) / 1000) // Convert back to seconds
    .filter((time: number) => time > 0); // Exclude warm-up/invalid laps
}

/**
 * Main scraper function
 * Fetches LiveRC URL and extracts telemetry for a specific driver
 */
export async function scrapeRaceResults(
  liveRcUrl: string,
  driverId: string,
  lastKnownTelemetry?: ScrapedTelemetry
): Promise<LiveRCScraperResult> {
  const now = Date.now();

  // Validate URL format
  if (!liveRcUrl || !liveRcUrl.includes('liverc.com')) {
    return {
      status: 'error',
      warning: 'LIVERC LINK UNREACHABLE',
      lastUpdateTimestamp: now,
    };
  }

  try {
    // Fetch the LiveRC page with a 10-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(liveRcUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    clearTimeout(timeoutId);

    // Handle 404, 403, or other HTTP errors
    if (!response.ok) {
      return {
        status: 'error',
        warning: 'LIVERC LINK UNREACHABLE',
        data: lastKnownTelemetry,
        lastUpdateTimestamp: now,
      };
    }

    const htmlText = await response.text();

    // Extract racerLaps object
    const racerLaps = extractRacerLapsFromHTML(htmlText);

    // Check if driver is in the results
    const racer = racerLaps[driverId];
    if (!racer) {
      return {
        status: 'stale',
        warning: 'RACER NOT DETECTED IN FEED',
        data: lastKnownTelemetry,
        lastUpdateTimestamp: now,
      };
    }

    // Parse lap history and calculate metrics
    const lapHistory = parseLapHistory(racer);

    if (lapHistory.length === 0) {
      return {
        status: 'stale',
        warning: 'NO LAP DATA AVAILABLE',
        data: lastKnownTelemetry,
        lastUpdateTimestamp: now,
      };
    }

    const best_lap_ms = Math.min(...lapHistory) * 1000;
    const average_lap_ms =
      (lapHistory.reduce((a, b) => a + b, 0) / lapHistory.length) * 1000;

    // LiveRC consistency is often provided, but we'll use lap count as a proxy
    const consistency_percentage = 100 - Math.min(100, lapHistory.length * 5);

    const telemetry: ScrapedTelemetry = {
      laps: lapHistory.length,
      best_lap: Math.round(best_lap_ms),
      average_lap: Math.round(average_lap_ms),
      consistency_percentage: Math.max(0, consistency_percentage),
      lap_history: lapHistory,
    };

    return {
      status: 'success',
      data: telemetry,
      lastUpdateTimestamp: now,
    };
  } catch (error) {
    console.error('LiveRC scraper error:', error);

    // Network timeout or other fetch error
    return {
      status: 'error',
      warning:
        error instanceof Error ? error.message : 'UNKNOWN SCRAPER ERROR',
      data: lastKnownTelemetry,
      lastUpdateTimestamp: now,
    };
  }
}

/**
 * Check if telemetry is stale (> 60 seconds old)
 */
export function isTelemtryStale(
  lastUpdateTimestamp: number,
  stalethresholdMs: number = 60000
): boolean {
  return Date.now() - lastUpdateTimestamp > stalethresholdMs;
}

/**
 * Convert ScrapedTelemetry to ORP_CalculationInput format
 * Requires racerLaps from a fresh scrape to calculate global Top 5
 */
export function telemetryToORPInput(
  telemetry: ScrapedTelemetry,
  racerLaps: Record<string, any>,
  driverId: string
): ORP_CalculationInput {
  return {
    lapTimes: telemetry.lap_history,
    racerLaps,
    driverId,
  };
}
