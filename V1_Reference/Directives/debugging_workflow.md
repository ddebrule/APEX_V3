# Code Debugging & Health Check Workflow

This document describes how to use A.P.E.X.'s static analysis tools to find and fix code errors systematically.

## Overview

The health check system catches three categories of errors:

1. **Undefined Names** (F) - References to non-existent variables, functions, modules
2. **Code Style Issues** (E, W) - Formatting, spacing, and style violations
3. **Import Problems** (I) - Unused imports, wrong import order, missing imports
4. **Naming Violations** (N) - Variables/functions that don't follow Python conventions
5. **Common Bugs** (B) - Anti-patterns and common mistakes (e.g., mutable defaults)

## Quick Start

### Run Full Health Check
```bash
# Check everything (linting + tests)
python scripts/run_health_check.py

# Linting only
python scripts/run_health_check.py --ruff

# Tests only
python scripts/run_health_check.py --tests

# Tests with coverage report
python scripts/run_health_check.py --coverage
```

### Manual Ruff Check
```bash
# Check all Python files
ruff check .

# Check specific file/folder
ruff check Execution/services/

# Show detailed output
ruff check . --show-fixes

# Auto-format (if configured)
ruff format .
```

## Common Issues & Solutions

### Issue Type: Undefined Names (F)

**Example Error:**
```
Execution/services/history_service.py:821:F821: Undefined name 'execute_update'
```

**What it means:** You're referencing a function/variable that doesn't exist.

**How to fix:**
1. Check if the name is spelled correctly
2. Check if the module/class was imported
3. Check if the method exists on the object (e.g., `db.execute_query()` not `db.execute_update()`)

**Example fix:**
```python
# ❌ WRONG - method doesn't exist
db.execute_update(query, params)

# ✅ RIGHT - correct method name
db.execute_query(query, params, fetch=False)
```

---

### Issue Type: Unused Imports (F401)

**Example Error:**
```
Execution/components/sidebar.py:15:F401: 'json' imported but unused
```

**What it means:** You imported something but never used it in the file.

**How to fix:**
1. If you're not using it, delete the import
2. If you added it for future use, remove it (keep code simple)
3. If you ARE using it, check the name is correct

**Example:**
```python
# ❌ WRONG - import but not used
import json

def my_function():
    return "hello"

# ✅ RIGHT - only import what you need
def my_function():
    return "hello"
```

---

### Issue Type: Line Too Long (E501)

**Example Error:**
```
Execution/services/config_service.py:42:E501: Line too long (145 > 120 characters)
```

**What it means:** Your line is longer than 120 characters (configured in pyproject.toml).

**How to fix:**
1. Break the line into multiple lines
2. Use implicit line continuation (inside parentheses, brackets, braces)

**Example:**
```python
# ❌ WRONG - too long
result = db.execute_query("SELECT * FROM table WHERE id = %s AND status = 'active' AND created_at > NOW()", params)

# ✅ RIGHT - split into multiple lines
result = db.execute_query(
    """
    SELECT * FROM table
    WHERE id = %s
      AND status = 'active'
      AND created_at > NOW()
    """,
    params
)
```

---

### Issue Type: Wrong Naming Convention (N)

**Example Error:**
```
Execution/services/config_service.py:21:N802: Function name 'CSVRowToJSONB' should be lowercase
```

**What it means:** Function/variable names don't follow Python style (should be snake_case, not CamelCase).

**How to fix:**
Rename to follow Python conventions:
- Functions: `snake_case` (e.g., `csv_row_to_jsonb`)
- Classes: `PascalCase` (e.g., `ConfigService`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`)

**Example:**
```python
# ❌ WRONG - function should be lowercase
def GetUserProfile(user_id):
    return user_id

# ✅ RIGHT
def get_user_profile(user_id):
    return user_id
```

---

### Issue Type: Import Sorting (I)

**Example Error:**
```
Execution/services/session_service.py:5:I001: isort found an import order issue
```

**What it means:** Your imports are not in the correct order (should be: stdlib, third-party, local).

**How to fix:**
Ruff can auto-fix this with:
```bash
ruff check . --fix
```

Or manually fix:
```python
# ❌ WRONG - mixed order
import json
from requests import get
import os
from Execution.database import db

# ✅ RIGHT - stdlib first, then third-party, then local
import json
import os
from requests import get

from Execution.database import db
```

---

## Workflow: Finding & Fixing Issues

### Step 1: Run Health Check
```bash
python scripts/run_health_check.py
```

### Step 2: Read the Output
The output will show:
- File path
- Line number
- Error code (F821, E501, etc.)
- Description of the issue

### Step 3: Open the File
```bash
# Open in editor at specific line
code Execution/services/config_service.py:42
```

### Step 4: Understand the Issue
- Look at the error code (see Common Issues section above)
- Read the surrounding code
- Understand why the linter is complaining

### Step 5: Fix the Issue
- Apply the appropriate fix from the examples above
- Save the file

### Step 6: Verify the Fix
```bash
# Run health check again
python scripts/run_health_check.py --ruff

# Or check just that file
ruff check Execution/services/config_service.py
```

### Step 7: Commit
```bash
git add .
git commit -m "fix: Resolve linting issues (E501, F401, etc.)"
git push
```

---

## Preventing Issues

### Pre-Commit Hook (Optional)
To automatically run health checks before commits:

```bash
# Install pre-commit framework
pip install pre-commit

# Create .pre-commit-config.yaml (in root)
# See section below
```

### .pre-commit-config.yaml (Optional)
```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.1.0
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format
```

Then run:
```bash
pre-commit install
```

Now ruff will run automatically before each commit!

---

## CI/CD Integration

Add to GitHub Actions workflow (`.github/workflows/tests.yml`):

```yaml
- name: Run Health Check
  run: python scripts/run_health_check.py

- name: Run Tests with Coverage
  run: python scripts/run_health_check.py --coverage
```

---

## Error Code Reference

| Code | Category | Meaning | Example |
|------|----------|---------|---------|
| F821 | Pyflakes | Undefined name | Using `x` without defining it |
| F401 | Pyflakes | Unused import | `import json` but never used |
| E501 | pycodestyle | Line too long | Line > 120 characters |
| W291 | pycodestyle | Trailing whitespace | Space at end of line |
| I001 | isort | Import sorting issue | Imports not ordered correctly |
| N802 | pep8-naming | Invalid function name | `def MyFunction()` instead of `def my_function()` |
| B006 | flake8-bugbear | Mutable default argument | `def fn(x=[])` instead of `def fn(x=None)` |

---

## Quick Reference: Fixing Common Patterns

### Pattern 1: Database Method Doesn't Exist
```python
# ❌ BROKEN - method doesn't exist
db.execute_update(query, params)

# ✅ FIXED - use correct method
db.execute_query(query, params, fetch=False)
```

### Pattern 2: Unchecked Empty List Access
```python
# ❌ BROKEN - crashes if results is empty
return results[0]['id']

# ✅ FIXED - check before accessing
if results and len(results) > 0:
    return results[0]['id']
return None
```

### Pattern 3: NaN/None in JSON
```python
# ❌ BROKEN - NaN values can't serialize to JSON
json.dumps({'value': float('nan')})

# ✅ FIXED - use safe getter
def _safe_get(row, key):
    val = row.get(key)
    if pd.isna(val):
        return None
    return val
```

---

## Getting Help

- **Ruff documentation:** https://docs.astral.sh/ruff/
- **Error codes explained:** https://docs.astral.sh/ruff/rules/
- **Python style guide (PEP 8):** https://www.python.org/dev/peps/pep-0008/

---

## When to Ignore Warnings

Sometimes you have a good reason to ignore a specific error. Do this:

```python
# Ignore for this line
x = 1  # noqa: F841 (unused variable)

# Ignore for entire function
# noqa: E501
def long_function_name(var_one, var_two, var_three, var_four):
    pass

# Ignore for entire file
# ruff: noqa
```

**Use sparingly** - usually if you're ignoring errors, there's a better way to fix the code.

---

## Phase 7 Maintenance Checklist

- [ ] Run health check weekly
- [ ] Fix all F (Pyflakes) errors immediately - these are real bugs
- [ ] Fix E/W (style) errors before merging to main
- [ ] Update pyproject.toml if adding new linting rules
- [ ] Keep requirements.txt updated with latest ruff/pytest versions
- [ ] Review health check output in CI/CD pipeline

---

**Last Updated:** January 15, 2026
**Version:** v1.7.2
