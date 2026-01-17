# Orchestration Layer

This folder contains the **"HOW"** of the A.P.E.X. system, per the D.O.E. framework:

- **Directives/** → The "Why" and "What" (strategic documents, SOPs, baseline rules)
- **Orchestration/** → The "How" (workflow coordination, implementation plans, deployment guides)
- **Execution/** → The "Do" (actual code, scripts, servers)

## Purpose

The Orchestration layer bridges strategic intent (Directives) with actual implementation (Execution). It contains:

1. **Implementation Plans** - Step-by-step execution plans for features/versions
2. **Deployment Guides** - Infrastructure setup and configuration
3. **Database Documentation** - Schema, migration strategies, data architecture
4. **Onboarding Guides** - Quick-start and user setup documentation
5. **Strategic Plans** - Roadmaps, phase progression tracking

## Folder Structure

```
Orchestration/
├── Implementation_Plans/     # Feature implementation plans and summaries
│   ├── v1_7_0_implementation_plan.md
│   ├── v1_7_0_implementation_summary.md
│   └── v1_7_0_FINAL_SUMMARY.md
├── Deployment/               # Infrastructure and deployment guides
│   └── RAILWAY_DEPLOYMENT.md
├── Database/                 # Database architecture and migration docs
│   └── DATABASE_MIGRATION_SUMMARY.md
├── Onboarding/              # User and developer onboarding
│   └── QUICK_START.md
└── Strategic_Plans/         # Long-term planning and roadmaps
    (Future: Roadmap.md may be moved here)
```

## Usage Guidelines

### When Creating Implementation Plans
- Always start with a directive from `Directives/` folder
- Create detailed implementation plan here before coding
- Include file-by-file changes, testing strategy, deployment notes
- Keep plans focused on "how to execute" not "what to build"

### When Writing Deployment Guides
- Document infrastructure requirements
- Include environment variables, dependencies, platform-specific setup
- Provide troubleshooting steps and verification procedures

### When Documenting Database Changes
- Document schema migrations with before/after states
- Include rollback procedures
- Note data preservation strategies

## Relationship to Other Layers

**Directives → Orchestration:**
- Directives define the strategic intent (e.g., "Implement Intelligence Layer")
- Orchestration translates that into actionable implementation plans

**Orchestration → Execution:**
- Orchestration plans guide actual code changes
- Execution implements the plans in `dashboard.py`, `setup_parser.py`, etc.

**Orchestration ↔ AI Agents:**
- AI agents (Claude Code) read directives, create orchestration plans
- Plans guide agents through systematic implementation
- Summaries capture what was actually built for future reference

## Best Practices

1. **Keep Plans Detailed**: Implementation plans should be thorough enough for another developer (or AI agent) to execute independently
2. **Version Alignment**: Plan file names should match directive versions (e.g., `v1_7_0_implementation_plan.md`)
3. **Summaries Post-Implementation**: Create final summaries after implementation to capture actual decisions made
4. **No Code Here**: This layer is documentation only - actual code belongs in `Execution/`
5. **Update References**: When moving files, update links in `CLAUDE.md` and other reference docs

## Current Status

**Latest Version:** v1.7.0 (Intelligence Layer + Intelligent PDF Fallback)

**Recent Plans:**
- v1.7.0: Optimized Scribe, Hybrid Parsing Engine, Automated Reporting
- Implementation complete with intelligent Vision AI fallback for PDF parsing

**Active Documentation:**
- Railway deployment guide for production infrastructure
- PostgreSQL migration strategy from CSV fallback mode
- Quick-start guide for local development setup

---

*This README is part of the D.O.E. framework reorganization (December 2025)*
