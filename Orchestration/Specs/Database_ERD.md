# Database Architecture: Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    RACER_PROFILES ||--o{ VEHICLES : "owns"
    RACER_PROFILES ||--o{ SESSIONS : "runs"
    VEHICLES ||--o{ SESSIONS : "used_in"
    SESSIONS ||--o{ SETUP_CHANGES : "has"
    SESSIONS ||--o{ RACE_RESULTS : "produces"
    
    RACER_PROFILES {
        uuid id PK
        string name
        string email
        string_array sponsors
        boolean is_default
    }

    VEHICLES {
        uuid id PK
        uuid profile_id FK
        string brand
        string model
        string transponder
        jsonb baseline_setup
    }

    SESSIONS {
        uuid id PK
        uuid profile_id FK
        uuid vehicle_id FK
        string event_name
        string type
        datetime date
        jsonb track_context
        jsonb actual_setup "The Digital Twin"
        string status "draft | active | archived"
    }

    SETUP_CHANGES {
        uuid id PK
        uuid session_id FK
        string parameter
        string old_value
        string new_value
        text ai_reasoning
        string status "pending | accepted | denied"
    }

    RACE_RESULTS {
        uuid id PK
        uuid session_id FK
        decimal best_lap
        decimal average_lap
        decimal consistency_score "CoV %"
        jsonb lap_times "Raw Data"
    }
```

## Key Architectural Decisions
1. **JSONB for Setups:** Chassis setups (26 parameters) are stored in `jsonb` to allow for schema flexibility between car brands while maintaining performance.
2. **UUIDs:** All Primary Keys use UUIDs to ensure no collisions during cross-regional syncing.
3. **Active Intelligence:** The `SETUP_CHANGES` table is specifically designed to feed the "Institutional Memory" loop by tracking *why* a change was made and whether it worked.
