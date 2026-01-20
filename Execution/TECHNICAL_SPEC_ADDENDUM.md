# Technical Specification Addendum (v6.0.1)
## 1. LiveRC Scraper: Error Recovery & Staleness
The scraper must handle network failures, missing elements, and stale data to protect the system from crashes.

- **Interface Contract**:
```typescript
interface LiveRCScraperResult {
  status: 'success' | 'stale' | 'error';
  data?: ScrapedTelemetry;
  warning?: string;
  lastUpdateTimestamp: number; // Date.now() of the LAST successful scrape
}
```
- **Error Behavior**:
    - **Invalid URL/404**: Set `status: 'error'`, return empty data, and toast the racer: `"LIVERC LINK UNREACHABLE"`.
    - **Missing Racer**: If `racerLaps[driverId]` is undefined, set `status: 'stale'`, use the last known telemetry, and warning: `"RACER NOT DETECTED IN FEED"`.
    - **Staleness Tracking**: Use `Date.now()` vs `lastUpdateTimestamp`. If Delta > 60s, UI displays a `STALE DATA` badge.

## 2. ORP Formula: Global Calculations & Edge Cases
- **SpeedScore (Global Top 5 Normalization)**:
    - AI must calculate the "Global Top 5 Average" from the entire `racerLaps` set before computing the individual SpeedScore.
```typescript
function getGlobalTop5Average(racerLaps: Record<string, any>): number {
  const allAverages = Object.values(racerLaps)
    .map(r => parseFloat(r.avgLap))
    .filter(avg => !isNaN(avg))
    .sort((a, b) => a - b)
    .slice(0, 5);
  if (allAverages.length === 0) return 0;
  return allAverages.reduce((a, b) => a + b, 0) / allAverages.length;
}
```
- **Fade Factor (Telemetry Bounds)**:
    - **Constraint**: Requires a minimum of 6 laps to compute a meaningful trend.
```typescript
function calculateFade(lapTimes: number[]): number | null {
  if (lapTimes.length < 6) return null; // Null handles UI "Calculating..." state
  const firstThree = lapTimes.slice(0, 3);
  const lastThree = lapTimes.slice(-3);
  const avgFirst = firstThree.reduce((a, b) => a + b) / 3;
  const avgLast = lastThree.reduce((a, b) => a + b) / 3;
  return (avgLast - avgFirst) / avgFirst; // Positive result = Performance Fade (Slower)
}
```

- **applied_setup_snapshot**: This field must contain a **deep-clone** of the full `VehicleSetup` object.
- **VehicleSetup Dynamic Definition**:
Implemented in **[database.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/types/database.ts)**. To maintain compatibility with existing Race Control tabs, the data structure is **FLAT**.

```typescript
export type VehicleSetup = {
  [parameter_key: string]: string | number | boolean;
};
```

## 4. Logical Tuning Hierarchy
The AI Advisor and Librarian see the setup through this **Logical Layer** to prioritize advice, even though the data is stored flat:
1. **TIRES**: `tire_compound`, `tire_insert`, `tread_pattern`
2. **GEOMETRY**: `camber`, `toe_in`, `ride_height`, `front_toe_out`
3. **SHOCKS**: `shock_oil`, `springs`, `front_sway_bar`, `rear_sway_bar`
4. **POWER**: `punch`, `brake`
*(Add new parameters to these groups as the fleet evolves)*

## 5. Debrief System Prompt Template
When the Debrief starts, the `advisorStore` will inject this exact template into the system instructions:

```text
CRITICAL MISSION: DEBRIEF MODE
Telemetry Data: ORP Score: {{orp_score}}, Fade Factor: {{fade_factor}}
Raw Setup Context: {{applied_setup_snapshot}}
Racer Scribe: {{racer_scribe_feedback}}

INSTRUCTION: 
1. Present the ORP and Fade data as objective terminal reports.
2. Review the 'Raw Setup Context'—this is a dynamic object. Identify the current values for each category.
3. Ask one open-ended Socratic question about the car's behavior.
4. FORBIDDEN: Do not assume a cause. Let the racer articulate the mechanical or focus issue.
```

## 5. Librarian: "Push to Advisor" Logic
- **Embedding Strategy**: Use OpenAI `text-embedding-3-small` (1536 dims).
- **Search Vector Space**: Embed the `Setup Matrix` (as a JSON string) and the `Dialogue History`.
- **Trigger**: Advisor sends a `RetrieveHistoricalPivot` event when ORP < 80% or "I don't know" is detected.
- **Action**: Librarian returns 1-2 sessions in this schema:
```typescript
interface RetrievedContext {
  event_date: string;
  symptom: string;
  fix: string;
  orp_improvement: number;
}
```

## 6. Database: Historic Sessions Table
- **Requirement**: Create `historic_sessions` table in Supabase.
- **Type Definition**: Refer to `HistoricSession` in **[database.ts](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX_V3/Execution/frontend/src/types/database.ts)**.
- **Archival Flow**: Transition session from `sessions` to `historic_sessions` only after a "Final Commit" in the Advisor tab.

## 7. Cold Start Resilience (New Racer Protocol)
To prevent runtime errors and poor AI UX when no historical data exists:

- **ORP Delta Calculation**: 
    - If `historic_sessions.length === 0`, `deltaORP` returns `0`.
    - UI Display: Replace "Delta" with a `[CALIBRATING]` badge.
- **Librarian Fallback**:
    - If `RetrieveHistoricalPivot` returns null, the Librarian must utilize its **General Racing Knowledge** to provide "Baseline Performance Targets" for the specific `Vehicle Class`.
- **Advisor Context Injection**:
    - If no history is detected, inject: `SESSION_MANIFEST: FIRST_RUN`.
    - AI Directive: "Frame all advice as establishing a baseline. Avoid comparisons to previous performance."
