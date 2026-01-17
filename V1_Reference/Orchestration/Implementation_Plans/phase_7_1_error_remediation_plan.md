# Phase 7.1: Error Remediation ("Operation Clean Sweep")

## Goal Description
The initial health check revealed **902 errors**. This is typical for a codebase that hasn't had linting enforced. We need to triage and fix these systematically without breaking the application.

Our goal is to bring the error count down to **< 50** by prioritizing real bugs over style nitpicks.

## User Review Required
> [!IMPORTANT]
> This plan involves running auto-fixers `ruff --fix`. While generally safe, there is a tiny risk of logic changes if code was relying on buggy behavior.

## Proposed Changes

### Strategy: Triage & Conquer
We will tackle the 902 errors in 3 waves:

#### Wave 1: Safe Auto-Fixes (Reduces count by ~60%)
- Run `ruff check . --fix`
- **What it fixes**: Import sorting, unused imports, whitespace, simple syntax standardizations.
- **Risk**: Very Low.

#### Wave 2: Suppression of Noise (Reduces count by ~30%)
- Configure `pyproject.toml` to ignore low-value style rules that are "too loud" for now.
- **Ignore**:
    - `E501` (Line too long) - We can wrap lines later.
    - `E402` (Module level import not at top) - Common in Streamlit apps.
    - `F401` (Unused imports in `__init__.py`) - Often intentional for exposing APIs.

#### Wave 3: Critical Bug Fixes (The remaining ~10%)
- Focus on `F` (Pyflakes) errors that are ACTUAL bugs:
    - `F821` (Undefined name) - **CRITICAL**: Code trying to use variables that don't exist.
    - `F841` (Unused variable) - Often indicates logic errors.
    - `F401` (Unused imports in normal files) - Dead code.

## Execution Steps

### 1. Configure Noise Filters
#### [MODIFY] [pyproject.toml](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/pyproject.toml)
- Update `[tool.ruff.lint]` to strictly select only high-value rules initially (`E`, `F`, `I`).
- Add ignores for Streamlit-specific patterns.

### 2. Auto-Fix
- Run: `ruff check . --fix`

### 3. Manual Remediation
- We will generate a report of the remaining `F821` (Undefined Name) errors and fix them one by one. This is where the specific "code pointing to things not available" issue will be solved.

## Verification Plan

### Automated Verification
- Run `python scripts/run_health_check.py` after each wave to track the count dropping.
- Target: 902 -> ~300 (Wave 1) -> ~100 (Wave 2) -> <50 (Wave 3).

### Manual Verification
- Spot check 3-5 "fixed" files to ensure logic remains intact.
