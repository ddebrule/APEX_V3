# Session State Contract

**Version:** 1.0 (Phase 6 Modular Refactor)
**Purpose:** Document all `st.session_state` keys to prevent "mystery state" bugs and clarify ownership.

---

## 1. Initialization Rules

### Rule 1: Sole Owner
`dashboard.py` (the orchestrator) is the **sole owner** of initializing ALL session state keys. It runs `init_session_state()` before importing any tabs.

### Rule 2: Consumer Access
Tabs are **consumers** of session state. They:
- Read from any key (no checks needed; key exists by contract)
- Write to keys they own (documented below)
- Check for existence *only* if they create temporary state (e.g., modal flags)

### Rule 3: Persistence
Session state persists for the duration of the Streamlit session. It is volatile and resets on:
- Browser refresh
- Streamlit app restart
- Manual `st.rerun()` (preserves state across reruns)

---

## 2. State Registry

### Global State (Initialized by dashboard.py)

| Key | Type | Owner (Writer) | Consumers (Readers) | Purpose |
|-----|------|---|---|---|
| `racer_profile` | Dict | **dashboard.py** (sidebar) | All Tabs | User identity: name, email, social media, transponder, sponsors, vehicles |
| `messages` | List[Dict] | **Tab 2** (Setup Advisor) | Tab 2, Tab 4 | Chat history for AI advisor (message history accumulates per session) |
| `weather_data` | Dict \| None | **Tab 2** (Setup Advisor) | Tab 4 | Real-time weather: Temp, Humidity, DA (density altitude) |
| `actual_setup` | Dict \| None | **Tab 1** (Event Setup), **Tab 6** (Setup Library) | Tab 2, Tab 4, Tab 5 | Digital Twin: current chassis config (24-parameter schema) |
| `pending_changes` | List[Dict] | **Tab 2** (Setup Advisor) | Tab 2, Tab 4 | AI-proposed changes awaiting user acceptance |
| `track_context` | Dict | **Tab 1** (Event Setup) | Tab 2, Tab 4 | Track metadata: track_name, track_size, traction, surface_type, surface_condition, event_name, session_type |
| `active_session_id` | UUID \| None | **Tab 1** (Event Setup) | All Tabs | Database ID of current event session |
| `session_just_started` | Bool | **Tab 1** (Event Setup) | Tab 1, Tab 2 | Flag to trigger prep plan offer after session start |
| `event_url` | String | **Tab 3** (Race Support) | Tab 3, Tab 4 | LiveRC track event URL |
| `monitored_heats` | List[Dict] | **Tab 3** (Race Support) | Tab 3, Tab 4 | Current heats being monitored from LiveRC |
| `active_classes` | List[String] | **Tab 3** (Race Support) | Tab 3, Tab 4 | Filtered RC classes to monitor |
| `track_media` | List[File] | **Tab 2** (Setup Advisor) | Tab 2, Tab 4 | Uploaded track walk photos |
| `tire_media` | List[File] | **Tab 2** (Setup Advisor) | Tab 2, Tab 4 | Uploaded tire wear photos |
| `last_report` | Dict \| None | **Tab 4** (Post Event Analysis) | Tab 4 | Last generated race report |

### Session Lifecycle State (Auto-Save: Phase 4.3)

| Key | Type | Owner (Writer) | Consumers (Readers) | Purpose |
|-----|------|---|---|---|
| `draft_session_id` | UUID \| None | **dashboard.py** (autosave_manager) | Tab 1, Tab 2 | ID of current draft being edited |
| `last_save_result` | Dict \| None | **dashboard.py** (autosave_manager) | Tab 1 | Result of last auto-save operation |
| `draft_picker_shown` | Bool | **dashboard.py** (autosave_manager) | dashboard.py | Flag to show draft picker modal on load |
| `session_lifecycle_initialized` | Bool | **dashboard.py** (autosave_manager) | dashboard.py | Prevents re-running lifecycle check multiple times |

### X-Factor State (Phase 4.2)

| Key | Type | Owner (Writer) | Consumers (Readers) | Purpose |
|-----|------|---|---|---|
| `x_factor_audit_id` | UUID \| None | **Tab 4** (Post Analysis) | Tab 4 | Current X-Factor audit being reviewed |
| `x_factor_state` | String | **Tab 4** (Post Analysis) | Tab 4 | State machine: "idle", "running", "complete" |

### Package Copy & Modal State (Sprint 3-4)

| Key | Type | Owner (Writer) | Consumers (Readers) | Purpose |
|-----|------|---|---|---|
| `show_staging_modal` | Bool | **Tab 5** (Setup Library) | Tab 5 | Modal visibility for package copy staging |
| `staging_package` | String \| None | **Tab 5** (Setup Library) | Tab 5 | Which package (DIFFS, GEOMETRY, etc.) is being staged |
| `staging_data` | Dict | **Tab 5** (Setup Library) | Tab 5 | Edited parameter values for staging modal |
| `comparison_baseline_id` | UUID \| None | **Tab 5** (Setup Library) | Tab 5 | ID of baseline setup being compared |

### Parsed Data State (Setup Import)

| Key | Type | Owner (Writer) | Consumers (Readers) | Purpose |
|-----|------|---|---|---|
| `last_parsed_data` | Dict \| None | **Tab 5** (Setup Library) | Tab 5 | Last parsed setup from PDF or Vision AI |
| `last_parsed_source` | String | **Tab 5** (Setup Library) | Tab 5 | Source of parsed data: "PDF" or "Vision" |
| `last_parsed_brand` | String | **Tab 5** (Setup Library) | Tab 5 | Brand of parsed setup (Tekno, Associated, etc.) |
| `last_parsed_model` | String | **Tab 5** (Setup Library) | Tab 5 | Model of parsed setup (NB48 2.2, etc.) |
| `verified_setup_data` | Dict | **Tab 5** (Setup Library) | Tab 5 | User-verified parameters before saving to library |
| `show_library_save` | Bool | **Tab 5** (Setup Library) | Tab 5 | Flag to show library save verification screen |

---

## 3. Key Ownership & Write Rules

### Tab 1: Event Setup (event_setup.py)
**Writes to:**
- `active_session_id` - When user clicks "Start Session"
- `actual_setup` - When loading Shop Master baseline
- `track_context` - When user fills session form
- `session_just_started` - After session creation

### Tab 2: Setup Advisor (setup_advisor.py)
**Writes to:**
- `messages` - Each AI response added to history
- `weather_data` - After fetching weather
- `pending_changes` - When AI proposes setup changes

### Tab 3: Race Support (race_support.py)
**Writes to:**
- `event_url` - When user enters LiveRC event URL
- `monitored_heats` - When scraping LiveRC
- `active_classes` - When user filters by class

### Tab 4: Post Event Analysis (post_analysis.py)
**Writes to:**
- `x_factor_audit_id` - When opening audit
- `x_factor_state` - During audit workflow
- `last_report` - When generating report

### Tab 5: Setup Library (setup_library.py)
**Writes to:**
- `actual_setup` - When importing library baseline or applying package copy
- `last_parsed_data` - When parsing PDF or Vision
- `last_parsed_source`, `last_parsed_brand`, `last_parsed_model` - Metadata for parsed data
- `show_staging_modal`, `staging_package`, `staging_data` - Modal state
- `comparison_baseline_id` - When comparing setups
- `verified_setup_data` - User verification of extracted parameters
- `show_library_save` - Flag to show save screen

### Sidebar (components/sidebar.py)
**Writes to:**
- `racer_profile` - When user edits profile, sponsors, or fleet

---

## 4. Example Access Patterns

### Reading from State (Tabs)

```python
# Tab 2 reading track context for AI prompt
track_info = st.session_state.track_context  # Safe to read (initialized by Tab 1)

# Tab 4 reading actual setup for comparison
setup = st.session_state.actual_setup  # Safe to read (exists by contract)
if setup:
    # Use setup data
```

### Writing to State (Tabs)

```python
# Tab 2 adding AI message
st.session_state.messages.append({
    "role": "assistant",
    "content": response_text
})

# Tab 5 importing a baseline
st.session_state.actual_setup = imported_setup  # Overwrites current setup
```

### Temporary Tab State (Advanced)

```python
# Tab 5: Creating temporary state that Tab 5 owns
if "temp_comparison_view" not in st.session_state:
    st.session_state.temp_comparison_view = {}

st.session_state.temp_comparison_view["current"] = data
```

---

## 5. Validation Rules (For Future Auth)

When multi-user authentication is added:
- All user-specific data (`racer_profile`, `actual_setup`, `car_configs`) will be keyed by user ID
- Session-specific data will be keyed by `active_session_id`
- Current pattern (single default user) will be replaced with:
  ```python
  user_id = st.session_state.user_id  # Set by auth layer
  st.session_state[f"racer_profile_{user_id}"] = ...
  ```

---

## 6. Migration Checklist (Phase 6 Refactor)

When extracting each tab, verify:

- [ ] Tab imports no session state initialization code
- [ ] Tab only reads keys that exist in the contract
- [ ] Tab only writes to keys it owns (documented above)
- [ ] All existing reads/writes are preserved (no logic changes)
- [ ] Tests verify state persistence across `st.rerun()`
- [ ] Sidebar sidebar.py can read/write `racer_profile` correctly

---

## 7. Known Limitations & Future Work

- **No multi-user state isolation** (auth layer coming in future phase)
- **No state versioning** (rollback not supported; use autosave drafts for recovery)
- **Volatile on browser refresh** (use database for persistence; autosave_manager handles active sessions)
- **No conflict detection** if two users edit same session (reserved for multi-user phase)

---

## 8. Quick Reference: Which Tab Owns What?

| State Key | Owner Tab |
|-----------|-----------|
| `racer_profile` | Sidebar (global) |
| `messages`, `weather_data`, `pending_changes` | Tab 2 |
| `actual_setup` | Tab 1 (init), Tab 5 (override) |
| `track_context`, `active_session_id` | Tab 1 |
| `event_url`, `monitored_heats`, `active_classes` | Tab 3 |
| `x_factor_audit_id`, `x_factor_state`, `last_report` | Tab 4 |
| `last_parsed_*`, `staging_*`, `show_library_save` | Tab 5 |
| All lifecycle (`draft_*`) | dashboard.py |
