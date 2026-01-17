# Phase 7: Maintenance & Debugging Setup

## Goal Description
The user needs a systematic way to start "searching, finding, and fixing errors" in the codebase, specifically targeting "code pointing to things not available" (broken references) and general code health. 

This plan activates **Phase 7** of the Roadmap (Development Practices) by validating and installing robust static analysis tools.

## User Review Required
> [!NOTE]
> This plan introduces new development dependencies (`ruff`, `vulture`) but does not modify runtime application code.

## Proposed Changes

### 1. Dependency Management
#### [MODIFY] [requirements.txt](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/requirements.txt)
- Add `ruff` (Fast Python linter/formatter)
- Add `vulture` (Dead code detection)
- Add `pytest` (Testing framework - if not fully integrated yet)

### 2. Tool Configuration
#### [NEW] [pyproject.toml](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/pyproject.toml)
- Configure `ruff` to catch F (Pyflakes - undefined names), E (Pycodestyle), and I (Import sorting).
- Configure `vulture` excludes.

### 3. Utility Scripts
#### [NEW] [scripts/run_health_check.py](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/scripts/run_health_check.py)
- A cross-platform script to run the analysis tools and summarize findings.
- Report "Undefined Names" (broken code refs).
- Report "Unused Code" (dead code).

### 4. Documentation
#### [NEW] [Directives/debugging_workflow.md](file:///c:/Users/dnyce/Desktop/Coding/Antigravit%20Workspaces/APEX-AGR-SYSTEM/Directives/debugging_workflow.md)
- Step-by-step guide on how to use these tools to find and fix errors.

## Verification Plan

### Automated Tests
- Run `python scripts/run_health_check.py` and verify it produces a report without crashing.
- Run `ruff check .` manually to verify config picks up usage.

### Manual Verification
- Deliberately introduce a broken reference (e.g., `print(undefined_var)`) in a temporary file and verify the health check catches it.
