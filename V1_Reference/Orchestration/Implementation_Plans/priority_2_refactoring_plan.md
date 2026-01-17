# Priority 2: Project Structure Refactoring Plan

**Status:** ✅ COMPLETED (2025-12-28)
**Created:** 2025-12-27
**Updated:** 2025-12-28 (Removed Task #1 - Keep `Execution/` name per D.O.E. framework)
**Completed:** 2025-12-28
**Effort:** Low-Medium (1-2 hours) - Actual: ~1.5 hours
**Breaking Changes:** No

---

## Overview

This plan improves code organization while maintaining the D.O.E. framework naming:
1. ~~Renaming `Execution/` to `src/`~~ **SKIPPED** - Keep `Execution/` per D.O.E. framework
2. Organizing code by domain/concern (services/database/ai/utils)
3. Centralizing configuration management
4. Adding automated CI/CD testing

**Rationale for Keeping `Execution/`:**
- Maintains conceptual clarity of D.O.E. framework (Directives → Orchestration → Execution)
- Non-breaking change (no Procfile updates needed)
- Meaningful name in project context
- Still achieves 90% of organizational benefits
- Project is an application, not a PyPI library

## Tasks

### ~~Task 1: Rename `Execution/` → `src/`~~ ❌ SKIPPED
**Decision:** Keep `Execution/` name to maintain D.O.E. framework clarity

**Why Skipped:**
- `Execution/` is meaningful in the D.O.E. context (Directives → Orchestration → Execution)
- Non-breaking (no Procfile or import changes needed)
- Project is an application, not a library requiring PyPI packaging
- The value is in organization by domain, not the folder name

---

### Task 1 (Renumbered): Organize `Execution/` by Domain
**Why:** Better maintainability and separation of concerns

**Current Structure:** 19 Python files in flat directory

**Target Structure:**
```
Execution/
├── __init__.py                  # Package initialization
├── dashboard.py                 # Main entry point (stays at root)
│
├── services/                    # Business logic & external integrations
│   ├── __init__.py
│   ├── setup_parser.py          # PDF/Vision parsing
│   ├── liverc_harvester.py      # Web scraping
│   ├── email_service.py         # Email reports
│   ├── baseline_manager.py      # Baseline CRUD
│   ├── library_service.py       # Master library
│   ├── config_service.py        # Car configs
│   ├── session_service.py       # Session tracking
│   ├── history_service.py       # History logs
│   ├── prep_plan_service.py     # Race prep plans
│   └── x_factor_service.py      # X-Factor protocol
│
├── database/                    # Data persistence layer
│   ├── __init__.py
│   ├── database.py              # Connection pool
│   ├── schema.sql               # Database schema
│   └── migrate_to_database.py   # Migration script
│
├── ai/                          # AI/LLM components
│   ├── __init__.py
│   ├── prompts.py               # Prompt templates
│   ├── mcp_server.py            # FastMCP server
│   └── pdf_generator.py         # PDF report generation
│
├── utils/                       # Shared utilities
│   ├── __init__.py
│   └── (future shared helpers)
│
└── data/                        # Runtime data (gitignored)
    └── .gitkeep
```

**File Moves:**
```bash
# Create subdirectories
mkdir -p Execution/services Execution/database Execution/ai Execution/utils

# Move service files
git mv Execution/setup_parser.py Execution/services/
git mv Execution/liverc_harvester.py Execution/services/
git mv Execution/email_service.py Execution/services/
git mv Execution/baseline_manager.py Execution/services/
git mv Execution/library_service.py Execution/services/
git mv Execution/config_service.py Execution/services/
git mv Execution/session_service.py Execution/services/
git mv Execution/history_service.py Execution/services/
git mv Execution/prep_plan_service.py Execution/services/
git mv Execution/x_factor_service.py Execution/services/

# Move database files
git mv Execution/database.py Execution/database/
git mv Execution/schema.sql Execution/database/
git mv Execution/migrate_to_database.py Execution/database/

# Move AI files
git mv Execution/prompts.py Execution/ai/
git mv Execution/mcp_server.py Execution/ai/
git mv Execution/pdf_generator.py Execution/ai/
```

**Benefits:**
- Clear separation of concerns
- Easier to find specific functionality
- Better for unit testing
- Scales as project grows

---

### Task 2 (Renumbered): Create Configuration Management
**Why:** Centralize configuration, single source of truth

**Create:** `config/settings.py`
```python
# config/settings.py
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    """Central configuration for A.P.E.X. system."""

    # Paths
    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / "Data"
    EXECUTION_DIR = BASE_DIR / "Execution"

    # API Keys (required)
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

    # Database (optional - falls back to CSV)
    DATABASE_URL = os.getenv("DATABASE_URL")

    # SMTP Configuration (optional - mock mode if not set)
    SMTP_SERVER = os.getenv("SMTP_SERVER")
    SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER = os.getenv("SMTP_USER")
    SMTP_PASS = os.getenv("SMTP_PASS")

    # Application Settings
    ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

    @property
    def use_database(self) -> bool:
        """Check if PostgreSQL database is configured."""
        return bool(self.DATABASE_URL)

    @property
    def use_email(self) -> bool:
        """Check if SMTP email is configured."""
        return bool(self.SMTP_SERVER and self.SMTP_USER)

    def validate(self) -> list[str]:
        """Validate required configuration."""
        errors = []
        if not self.ANTHROPIC_API_KEY:
            errors.append("ANTHROPIC_API_KEY is required")
        if not self.OPENAI_API_KEY:
            errors.append("OPENAI_API_KEY is required")
        return errors

# Singleton instance
settings = Settings()

# Validate on import
config_errors = settings.validate()
if config_errors:
    raise ValueError(f"Configuration errors: {', '.join(config_errors)}")
```

**Usage Pattern:**
```python
# OLD:
import os
api_key = os.environ.get("ANTHROPIC_API_KEY")

# NEW:
from config.settings import settings
api_key = settings.ANTHROPIC_API_KEY
```

**Benefits:**
- Single source of truth
- Type safety and validation
- Easy to mock in tests
- Clear documentation of all config

---

### Task 3 (Renumbered): Add GitHub Actions CI/CD
**Why:** Automated testing on every push/PR

**Create:** `.github/workflows/ci.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Python 3.10
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('requirements.txt') }}

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-mock

      - name: Run tests
        run: |
          pytest tests/ -v --cov=Execution --cov-report=term --cov-report=html

      - name: Upload coverage report
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report
          path: htmlcov/

  lint:
    name: Code Quality
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install linting tools
        run: |
          pip install ruff black isort

      - name: Run ruff (fast linter)
        run: ruff check Execution/ --output-format=github
        continue-on-error: true

      - name: Check formatting with black
        run: black --check Execution/
        continue-on-error: true

  deployment-check:
    name: Deployment Validation
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Validate Procfile
        run: |
          if [ ! -f Procfile ]; then
            echo "❌ Procfile missing!"
            exit 1
          fi
          echo "✅ Procfile exists"

      - name: Validate requirements.txt
        run: |
          if [ ! -f requirements.txt ]; then
            echo "❌ requirements.txt missing!"
            exit 1
          fi
          echo "✅ requirements.txt exists"

      - name: Check for secrets in code
        run: |
          if grep -r "sk-" Execution/ --exclude-dir=data; then
            echo "❌ Potential API keys found in code!"
            exit 1
          fi
          echo "✅ No hardcoded secrets detected"
```

**Benefits:**
- Automated testing on every commit
- Catches bugs before production
- Professional development workflow
- Code quality enforcement

---

## Implementation Order

Execute in this sequence to minimize issues:

1. **Create subdirectories** in `Execution/` first (services/database/ai/utils)
2. **Move files** to subdirectories using `git mv`
3. **Create `__init__.py`** files in each subdirectory
4. **Create** `config/settings.py`
5. **Update all imports** throughout codebase:
   - Update relative imports in moved files
   - Update dashboard.py imports
   - Update test imports
6. **Update CLAUDE.md** documentation (minor updates only)
7. **Create GitHub Actions** workflow
8. **Test locally**: Run dashboard, run tests
9. **Commit with clear message**
10. **Deploy to Railway** and verify

---

## Files Requiring Import Updates

After reorganization, these files will need import updates:

### In `Execution/dashboard.py`:
```python
# OLD:
from setup_parser import setup_parser
from liverc_harvester import LiveRCHarvester
from baseline_manager import baseline_manager

# NEW:
from Execution.services.setup_parser import setup_parser
from Execution.services.liverc_harvester import LiveRCHarvester
from Execution.services.baseline_manager import baseline_manager
```

### In `tests/test_setup_parser.py`:
```python
# OLD:
from setup_parser import SetupParser

# NEW:
from Execution.services.setup_parser import SetupParser
```

### In service files (internal imports):
```python
# Example in Execution/services/library_service.py:
# OLD:
from database import get_connection

# NEW:
from Execution.database.database import get_connection
```

---

## Testing Checklist

Before committing, verify:

- [ ] `streamlit run Execution/dashboard.py` launches successfully
- [ ] All 5 tabs load without errors
- [ ] `pytest tests/` passes all tests
- [ ] `python Execution/ai/mcp_server.py` runs without import errors
- [ ] Procfile still points to `execution/dashboard.py` (no change needed)
- [ ] All imports use new subdirectory paths
- [ ] GitHub Actions workflow validates

---

## Rollback Plan

If issues arise after deployment:

1. **Immediate:** Revert git commit
   ```bash
   git revert HEAD
   git push
   ```

2. **Railway:** Previous deployment will auto-restore

3. **Local:** Checkout previous commit
   ```bash
   git checkout <previous-commit-hash>
   ```

---

## Expected Benefits

### Developer Experience:
- ✅ Familiar structure (matches Django, FastAPI, etc.)
- ✅ Easier onboarding for new contributors
- ✅ Clear where to add new features

### Code Quality:
- ✅ Better separation of concerns
- ✅ Easier unit testing (mock services independently)
- ✅ Reduced coupling between modules

### Professional Standards:
- ✅ Ready for pip packaging
- ✅ CI/CD automated testing
- ✅ Matches industry best practices

### Maintenance:
- ✅ Easier to locate bugs (clear module boundaries)
- ✅ Refactoring is safer (tests catch breaks)
- ✅ Scales better as codebase grows

---

## Commit Message Template

```
refactor: Priority 2 - organize Execution/ by domain for better maintainability

Changes:
1. Organized Execution/ code by domain:
   - Execution/services/ - Business logic and integrations (10 service files)
   - Execution/database/ - Data persistence layer (3 files)
   - Execution/ai/ - AI/LLM components (3 files)
   - Execution/utils/ - Shared utilities (reserved for future)
2. Created config/settings.py for centralized configuration
3. Added GitHub Actions CI/CD workflow (.github/workflows/ci.yml)
4. Updated all import statements across codebase
5. Updated CLAUDE.md documentation

Breaking Changes:
- Import paths changed from flat to domain-organized structure
- Old: `from setup_parser import SetupParser`
- New: `from Execution.services.setup_parser import SetupParser`

Migration:
- All imports updated to use new subdirectory structure
- No Procfile changes (still uses execution/dashboard.py)
- No data migration needed (data/ folder untouched)
- Execution/ folder name unchanged (maintains D.O.E. framework)

Benefits:
- Better code organization by domain/concern
- Easier to find and maintain specific functionality
- CI/CD automated testing on every commit
- Centralized configuration management
- Non-breaking (Execution/ name preserved for D.O.E. framework)

Testing:
- All unit tests pass (pytest tests/ -v)
- Dashboard launches successfully
- MCP server runs without errors
- Deployed to Railway and verified

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Related Documentation

- Priority 1 Plan: `Orchestration/Implementation_Plans/` (completed)
- Project Structure: `CLAUDE.md` (will be updated)
- Deployment Guide: `Orchestration/Deployment/RAILWAY_DEPLOYMENT.md` (will need updates)

---

**Status:** 📋 PLANNED - Ready for implementation when approved
**Dependencies:** Priority 1 must be complete (✅ DONE)
**Next Step:** User approval to proceed with implementation
