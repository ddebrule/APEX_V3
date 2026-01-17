# Project Naming Convention Guide

**Status:** MANDATORY for all new files
**Effective:** December 28, 2025 onwards
**Applies To:** All files in all directories

---

## Overview

This guide establishes project-wide naming standards to ensure consistency, improve discoverability, and make cross-referencing with the Roadmap and strategic documents intuitive.

**Key Principles:**
- All lowercase unless otherwise specified
- Phase/sprint information in filename when applicable
- Self-documenting names that reveal purpose and scope
- Consistent across all directory layers (Directives, Orchestration, Execution, tests)

---

## Markdown Documentation Files

### Implementation Plans & Reports

**Pattern:** `phase_X_Y_[description]_[type].md`

**Components:**
- `phase_X_Y`: Phase number and sub-component
  - Examples: `phase_4_2`, `phase_2_5`, `phase_3_1`
  - Format: `phase_` followed by major version, underscore, minor version

- `[description]`: What the document covers
  - Examples: `sprint_1`, `sprint_2`, `sprint_3`
  - For deployments: `deployment`
  - Keep brief but descriptive

- `[type]`: Document type (lowercase)
  - `plan` = Implementation plan (before work starts)
  - `summary` = Executive summary of completed work
  - `completion_report` = Detailed completion report with metrics
  - `deployment_checklist` = Pre-deployment verification
  - `deployment_summary` = Post-deployment results

**Valid Examples:**
```
✅ phase_4_2_sprint_1_summary.md
✅ phase_4_2_sprint_2_completion_report.md
✅ phase_4_2_sprint_3_plan.md
✅ phase_4_2_deployment_checklist.md
✅ phase_4_2_deployment_summary.md
✅ phase_2_5_institutional_memory_plan.md
✅ phase_3_3_race_prep_plan_summary.md
```

**Invalid Examples:**
```
❌ SPRINT_3_COMPLETION_REPORT.md          (mixed case, no phase)
❌ Deployment_Summary.md                   (mixed case, inconsistent)
❌ Sprint1Plan.md                          (mixed case, no phase, wrong type)
❌ 4.2_sprint_3_plan.md                    (wrong phase format)
```

---

### Priority/Roadmap Documents

**Pattern:** `priority_X_[name]_[type].md`

**Components:**
- `priority_X`: Priority number (1-6, corresponding to Roadmap phases)
  - `priority_1` = Phase 1 priority tasks
  - `priority_2` = Phase 2 priority tasks
  - `priority_3` = Phase 3 priority tasks (deferred)

- `[name]`: What the priority covers
  - Examples: `refactoring`, `development_practices`, `quality_assurance`

- `[type]`: Document type
  - `plan` = Implementation plan
  - `summary` = Completion summary
  - `report` = Detailed report

**Valid Examples:**
```
✅ priority_2_refactoring_plan.md
✅ priority_3_development_practices_plan.md
✅ priority_1_core_features_summary.md
```

---

### Version-Specific Documents

**Pattern:** `v1_X_X_[purpose]_[type].md`

**Components:**
- `v1_X_X`: Semantic version
  - Format: `v1_` followed by major version, underscore, minor version
  - Examples: `v1_7_0`, `v1_8_2`

- `[purpose]`: What the document covers
  - Examples: `implementation`, `release_notes`, `migration`

- `[type]`: Document type
  - Usually just `summary`, `plan`, `notes`

**Valid Examples:**
```
✅ v1_7_0_implementation_plan.md
✅ v1_7_0_implementation_summary.md
✅ v1_8_2_release_notes.md
```

---

### Strategic/Directive Documents

**Pattern:** `[meaningful_name].md` (no phase prefix)

**Location:** `Directives/`

**Examples:**
```
✅ setup_logic.md                  (No phase - foundational)
✅ baseline_management.md
✅ fleet_definitions.md
✅ scribe_operations.md
✅ racer_profiles.md
✅ theory_index.md
```

**Rationale:** Strategic documents exist outside phase iterations; they're principles that apply across all phases.

---

### Architecture Documents

**Pattern:** `[system]_architecture.md` or `[domain]_architecture.md`

**Location:** `Orchestration/Architecture/`

**Examples:**
```
✅ digital_twin_architecture.md
✅ ai_advisor_architecture.md
✅ data_persistence_architecture.md
```

---

### Deployment Guides

**Pattern:** `[platform]_deployment.md` or generic `deployment_guide.md`

**Location:** `Orchestration/Deployment/`

**Examples:**
```
✅ railway_deployment.md
✅ heroku_deployment.md
✅ deployment_guide.md
```

---

### Quick-Start/Onboarding

**Pattern:** `[audience]_quickstart.md` or `getting_started.md`

**Location:** `Orchestration/Onboarding/`

**Examples:**
```
✅ developer_quickstart.md
✅ contributor_guide.md
✅ getting_started.md
```

---

## Python Code Files

**NO CHANGES** - Continue using existing Python conventions:

### Modules
```
snake_case.py

Examples:
✅ setup_parser.py
✅ package_copy_service.py
✅ liverc_harvester.py
✅ email_service.py
```

### Classes
```
PascalCase

Examples:
✅ class PackageCopyService
✅ class DatabaseConnection
✅ class SetupParser
```

### Functions
```
snake_case

Examples:
✅ def stage_package()
✅ def apply_package()
✅ def get_setup_baseline()
```

### Constants
```
UPPER_SNAKE_CASE

Examples:
✅ SETUP_PACKAGES
✅ DATABASE_URL
✅ MAX_RETRIES
```

---

## Data Files

### CSV Files
```
Format: snake_case.csv

Examples:
✅ master_library.csv
✅ car_configs.csv
✅ track_logs.csv
```

### JSON Configuration
```
Format: snake_case.json

Examples:
✅ database_config.json
✅ feature_flags.json
```

---

## Test Files

**Pattern:** `test_[module_name].py`

**Location:** `tests/`

**Examples:**
```
✅ test_package_copy_service.py
✅ test_setup_parser.py
✅ test_library_service.py
✅ test_email_service.py
```

---

## Complete Directory Structure

```
root/
├── README.md                              # Project overview (fixed)
├── CLAUDE.md                              # Developer guide (fixed, NOW WITH NAMING CONVENTION)
├── Roadmap.md                             # Strategic roadmap (fixed)
├── change_log.md                          # Version history (fixed)
├── .env.example                           # Environment template (fixed)
├── requirements.txt                       # Python dependencies (fixed)
├── Procfile                               # Deployment config (fixed)
├── .gitignore                             # VCS rules (fixed)
│
├── Directives/                            # Layer 1: Strategic principles (Why/What)
│   ├── Project_Manifest.txt               # System goals and requirements
│   ├── setup_logic.md                     # Tuning authority hierarchy
│   ├── baseline_management.md             # Baseline promotion protocol
│   ├── fleet_definitions.md               # Vehicle standardization
│   ├── scribe_operations.md               # Voice capture protocol
│   ├── racer_profiles.md                  # Profile generation SOP
│   └── theory_index.md                    # Reference library protocol
│
├── Orchestration/                         # Layer 2: Implementation coordination (How)
│   ├── NAMING_CONVENTION_GUIDE.md         # THIS FILE
│   ├── Implementation_Plans/              # All implementation documentation
│   │   ├── phase_4_2_sprint_1_summary.md
│   │   ├── phase_4_2_sprint_2_summary.md
│   │   ├── phase_4_2_sprint_2_completion_report.md
│   │   ├── phase_4_2_sprint_3_plan.md
│   │   ├── phase_4_2_sprint_3_summary.md
│   │   ├── phase_4_2_sprint_3_completion_report.md
│   │   ├── phase_4_2_deployment_checklist.md
│   │   ├── phase_4_2_deployment_summary.md
│   │   ├── priority_2_refactoring_plan.md
│   │   ├── priority_3_development_practices_plan.md
│   │   ├── v1_7_0_implementation_plan.md
│   │   ├── v1_7_0_implementation_summary.md
│   │   └── v1_7_0_final_summary.md
│   ├── Architecture/                      # System architecture documentation
│   │   └── [to be created as needed]
│   ├── Deployment/                        # Deployment guides
│   │   ├── RAILWAY_DEPLOYMENT.md
│   │   └── [to be created as needed]
│   ├── Onboarding/                        # Quick-start guides
│   │   └── [to be created as needed]
│   ├── Database/                          # Database documentation
│   │   └── [to be created as needed]
│   └── README.md                          # Orchestration layer guide
│
├── Execution/                             # Layer 3: Application code (Do)
│   ├── dashboard.py                       # Main Streamlit app
│   ├── database.py                        # Database connection
│   ├── services/
│   │   ├── __init__.py
│   │   ├── setup_parser.py                # PDF parsing service
│   │   ├── package_copy_service.py        # Package copying service
│   │   ├── library_service.py             # Master library CRUD
│   │   ├── email_service.py               # Email/reporting service
│   │   ├── liverc_harvester.py            # LiveRC scraping service
│   │   ├── baseline_manager.py            # Baseline management service
│   │   └── prompts.py                     # AI prompt templates
│   ├── database/
│   │   ├── schema.sql                     # PostgreSQL schema
│   │   └── migrations/
│   │       └── [migration files]
│   ├── data/                              # Runtime data (CSV fallback)
│   │   ├── master_library.csv
│   │   ├── car_configs.csv
│   │   └── track_logs.csv
│   └── [other execution modules]
│
├── Data/                                  # Static assets
│   ├── Setup_Templates/                   # PDF form templates
│   ├── theory-library/                    # Reference documents
│   └── hardware_specs/                    # Vehicle specifications
│
├── tests/                                 # Test suite
│   ├── __init__.py
│   ├── conftest.py                        # Pytest fixtures
│   ├── test_package_copy_service.py
│   ├── test_setup_parser.py
│   └── [other test files]
│
├── scripts/                               # Utility scripts
│   └── inspect_pdfs.py
│
└── .claude/                               # Claude Code configuration
    └── settings.local.json
```

---

## Enforcement & Best Practices

### When Creating New Files

1. **Identify the file type:**
   - Implementation documentation? → Use phase_X_Y pattern
   - Priority-based planning? → Use priority_X pattern
   - Version-specific docs? → Use v1_X_X pattern
   - Strategic principle? → Use meaningful_name pattern
   - Python code? → Use snake_case.py

2. **Check the location:**
   - Implementation docs → `Orchestration/Implementation_Plans/`
   - Directives → `Directives/`
   - Architecture → `Orchestration/Architecture/`
   - Deployment → `Orchestration/Deployment/`
   - Code → `Execution/` or `tests/`

3. **Verify against examples:**
   - Look at similar existing files
   - Copy the pattern exactly
   - All lowercase (except Python classes and constants)

4. **When in doubt:**
   - Check the "Valid Examples" section above
   - Ask: "Does this file name show what phase/sprint/version it covers?"
   - Ask: "Does this file name show what type of document it is?"

### Code Review Checklist

Reviewers should flag:
- ❌ Mixed case in markdown filenames (should be all lowercase)
- ❌ Missing phase/priority prefix for implementation docs
- ❌ Wrong location (e.g., sprint reports in root instead of Orchestration/)
- ❌ Inconsistent file types (e.g., "report" vs "summary" vs "completion_report")
- ❌ Python files not using snake_case

### Common Mistakes to Avoid

| ❌ Wrong | ✅ Correct | Reason |
|---------|-----------|--------|
| `SPRINT_3_COMPLETION_REPORT.md` | `phase_4_2_sprint_3_completion_report.md` | Mixed case, missing phase |
| `Deployment_Checklist.md` | `phase_4_2_deployment_checklist.md` | Mixed case, missing phase |
| `V1_7_0_Summary.md` | `v1_7_0_implementation_summary.md` | Mixed case for version |
| `sprint_3_summary.md` | `phase_4_2_sprint_3_summary.md` | Missing phase information |
| `SetupParser.py` | `setup_parser.py` | Python modules use snake_case |
| `get_configs.py` | `config_service.py` | Describe the module, not the function |

---

## Quick Reference

**Need a template?**

- Implementation plan: Copy `phase_4_2_sprint_1_plan.md` pattern
- Completion report: Copy `phase_4_2_sprint_3_completion_report.md` pattern
- Deployment checklist: Copy `phase_4_2_deployment_checklist.md` pattern
- Priority docs: Copy `priority_3_development_practices_plan.md` pattern
- Version docs: Copy `v1_7_0_implementation_summary.md` pattern

**Need to find a file?**

Use the directory structure above or search for:
- Phase-specific docs: `phase_4_2_*`
- Priority docs: `priority_3_*`
- Version docs: `v1_7_0_*`

---

## Questions?

Refer to:
1. This guide (detailed specs)
2. CLAUDE.md (developer guide, summary section)
3. Existing similar files (copy the pattern)
4. Directory structure above (correct location)

---

**Last Updated:** December 28, 2025
**Version:** 1.0
**Status:** MANDATORY - Enforce on all new files

