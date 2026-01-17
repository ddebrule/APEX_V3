# Phase 5 Sprint 2: Prerequisites & Setup Checklist

**Status:** Pre-Sprint Planning
**Sprint 2 Focus:** Database Schema Migration + UI Integration

---

## Before Sprint 2 Starts

### ✅ Sprint 1 Artifacts (Ready to Use)

- [x] `orp_service.py` - Core ORP math (22 tests passing)
- [x] `test_orp_service.py` - Complete unit test suite
- [x] `orp_metrics.csv` - Test data template
- [x] `run_logs` table schema (in schema.sql)
- [x] `liverc_harvester.get_lap_times()` - Lap extraction method

---

## Sprint 2 Checklist

### Phase 1: Database Migration

**Action Items:**

- [ ] **Apply run_logs migration to PostgreSQL**
  - Command: `psql $DATABASE_URL < Execution/database/schema.sql`
  - Verify: `\dt run_logs` shows table
  - Test: Insert dummy row, verify timestamps auto-populate

- [ ] **Add columns to racer_profiles table**
  ```sql
  ALTER TABLE racer_profiles ADD COLUMN experience_level VARCHAR(50) DEFAULT 'Intermediate';
  ALTER TABLE racer_profiles ADD COLUMN driving_style VARCHAR(255);
  ```
  - Verify: `\d racer_profiles` shows new columns
  - Backward compatible: Existing racers get "Intermediate" default

- [ ] **Add columns to sessions table**
  ```sql
  ALTER TABLE sessions ADD COLUMN practice_rounds INTEGER DEFAULT 0;
  ALTER TABLE sessions ADD COLUMN qualifying_rounds INTEGER DEFAULT 0;
  ```
  - Verify: `\d sessions` shows new columns
  - Backward compatible: Existing sessions default to 0

- [ ] **Create CSV fallback for local dev**
  - File: `Execution/data/run_logs.csv`
  - Columns: `session_id,heat_name,lap_number,lap_time,confidence_rating`
  - Use existing `orp_metrics.csv` as reference

### Phase 2: Database Services

**New Services to Create:**

- [ ] **`run_logs_service.py`** - CRUD operations
  ```python
  class RunLogsService:
      def add_lap(session_id, heat_name, lap_number, lap_time, confidence_rating)
      def get_session_laps(session_id) -> List[float]
      def get_laps_by_heat(session_id, heat_name) -> List[Dict]
      def calculate_orp_from_session(session_id) -> Dict  # Integrate orp_service
  ```

- [ ] **Update `session_service.py`**
  - Add `practice_rounds`, `qualifying_rounds` to create_session()
  - Add `experience_level` lookup from racer_profiles

### Phase 3: UI Integration (Tab 1)

**Dashboard Changes:**

- [ ] **Tab 1: Event Setup**
  - Input: `Qualifying Rounds` (1-6, slider or dropdown)
  - Input: `Practice Rounds` (0-5+, or "Unlimited" checkbox)
  - Call: `orp_service.get_strategy_for_scenario()` to show allowed parameters
  - Display: "Scenario A: Avant Garde Unlocked" or "Scenario B: Conservative Mode"

- [ ] **Racer Profile Sidebar**
  - Input: `Experience Level` (Sportsman / Intermediate / Pro)
  - Input: `Driving Style` (free text or predefined list)
  - Save to: `racer_profiles` table

### Phase 4: Advisor Integration

**Integration Points:**

- [ ] **Update `prompts.py`**
  - New prompt function: `get_orp_strategy_prompt(experience_level, orp_score, scenario)`
  - Example: "You are coaching a Sportsman driver. ORP=75 (Balanced). Recommend safe tweaks only."

- [ ] **Update recommendation logic** (in dashboard or new service)
  - Check: If ORP < 85, reject Avant Garde suggestions
  - Check: If confidence < 3, reject setup entirely
  - Apply: Experience bias to recommendation tone

### Phase 5: Testing & Validation

- [ ] **Integration test: End-to-end ORP flow**
  ```python
  # 1. Create session with practice/qualifying rounds
  # 2. Add lap data to run_logs
  # 3. Calculate ORP
  # 4. Verify strategy matches scenario
  # 5. Verify thresholds applied correctly
  ```

- [ ] **UI test: Tab 1 inputs flow**
  - Enter practice rounds → See scenario change
  - Enter experience level → See advisor bias change
  - Save and reload → Data persists

---

## Code References (Sprint 1 Created)

### ORP Service Methods Ready to Use

```python
# Calculate metrics from lap times
orp_service = ORPService()

consistency = orp_service.calculate_consistency([58.1, 58.0, 58.2, ...])
fade = orp_service.calculate_fade([58.1, 58.0, 58.2, ...])
orp = orp_service.calculate_orp_score(laps, experience_level, confidence)
strategy = orp_service.get_strategy_for_scenario(exp, practice, quals)
```

### LiveRC Integration Ready

```python
# Extract laps from LiveRC
harvester = LiveRCHarvester(url)
lap_times = harvester.get_lap_times("Driver Name")  # Returns [58.1, 58.0, ...]
```

---

## Database Schema Ready

### New run_logs Table
- ✅ Schema defined in `schema.sql`
- ✅ Indexes created for common queries
- ✅ Trigger for updated_at auto-population
- ✅ Foreign key to sessions (cascade delete)

### Migrations for Sprint 2
- [ ] ALTER racer_profiles (ADD experience_level, driving_style)
- [ ] ALTER sessions (ADD practice_rounds, qualifying_rounds)
- [ ] Create migration script: `Execution/database/migrations/001_add_orp_fields.sql`

---

## Risk Mitigation

### Database Migration Backup Plan
1. **Before applying migration:**
   ```bash
   pg_dump $DATABASE_URL > backup_before_sprint2.sql
   ```

2. **If migration fails:**
   ```bash
   psql $DATABASE_URL < backup_before_sprint2.sql
   ```

3. **Test migration locally first:**
   - Create test database
   - Apply migrations
   - Run integration tests

### CSV Fallback
- ✅ Exists: `orp_metrics.csv` (test data)
- Create: `run_logs.csv` (local fallback)
- Allows development without PostgreSQL

---

## Sprint 2 Success Criteria

- [ ] run_logs table exists with data
- [ ] racer_profiles.experience_level populated
- [ ] sessions.practice_rounds populated
- [ ] Tab 1 UI shows scenario detection
- [ ] ORP score persists and displays
- [ ] Advisor respects ORP thresholds
- [ ] All Sprint 2 tests passing
- [ ] No data loss from migration

---

## Estimated Timeline

| Task | Effort | Status |
|------|--------|--------|
| Schema migration | 1 hour | Pending |
| run_logs_service.py | 1-1.5 hours | Pending |
| Tab 1 UI integration | 1.5-2 hours | Pending |
| Prompts & advisor logic | 1-1.5 hours | Pending |
| Testing & validation | 1 hour | Pending |
| **Total** | **5-7 hours** | **On track with plan** |

---

## Next Steps

1. ✅ Sprint 1 complete (this was it!)
2. → Schedule Sprint 2 kickoff (4-6 hours)
3. → Sprint 3 AI integration (8-10 hours)
4. → Sprint 4 Visualization (4-6 hours)

**Recommendation:** Start Sprint 2 when ready. All prerequisites are in place.
