# A.P.E.X. System Rebuild Instructions

## Project Overview
**Name:** A.P.E.X. (Accelerate Performance + Experimentation = X-Factor)
**Goal:** A remote race engineer AI system designed to increase the podium probability for sportsman and intermediate RC (Remote Control) racers, **helping them find and achieve their optimal race pace.**
**Philosophy:** "Institutional Memory" - The system serves as a digital racing binder that learns what works for a specific driver, car, and track condition over time.
**Architecture:** Entirely web-based.

## Design Framework: The "Design OS" Method
**Mandatory Process:** We are adopting the **Design OS** framework by Builder Methods.
*   **Why:** To solve the problem of AI coding tools building generic, half-implemented UIs due to lack of specification.
*   **The Process:** Before writing functional code, you must execute the Design OS workflow:
    1.  **Product Planning:** Define the "Product Spec" (User Roles, Data Models, Roadmap).
    2.  **Design System:** Determine the "Look & Feel" (Color Palette, Typography, Component Shell) *first*.
    3.  **Section Design:** For each "Journey" below, generate a visual spec/mockup.
    4.  **Handoff:** Only fast-follow with implementation once the design is approved.
*   **Resource:** [Design OS on GitHub](https://github.com/buildermethods/design-os)

**Workflow:** `Directives` (Vision) -> `Orchestration` (Design OS Spec) -> `Execution` (Code).

## Project Architecture (Skeleton)
The system must be built using this exact file structure:
```text
/PROJECT_ROOT
├── /Directives         # Layer 1: Context & Standards
│   ├── Project_Manifest.md
│   ├── Tech_Standards.md
│   └── Rebuild_Blueprint.md
├── /Orchestration      # Layer 2: Design & Plans
│   ├── /Specs          # Design OS Visual Specs
│   └── /Implementation_Plans  # Granular build tickets
├── /Execution          # Layer 3: The Code (External)
│   ├── /backend        # Python/FastAPI Core
│   │   ├── /services   # Physics, AI, ORP Logic
│   │   ├── /database   # Migration & Connection
│   │   └── main.py
│   └── /frontend       # React/Next.js UI
│       ├── /components # High-density UI cards
│       └── /pages      # The 6-Tab Journey
├── /brain              # Gemini Internal Memory (Excluded from Prod)
└── package.json, next.config.js, requirements.txt
```

## Engineering Standards & Maintenance
To ensure system stability and continuous improvement, the following engineering protocols are mandatory:

### 1. The Self-Annealing Loop
"Self-anneal" when things break. If a script or tool fails:
1.  **Analyze:** Read the error message and full stack trace.
2.  **Fix & Test:** Implement the fix and test it immediately. 
    *   *Constraint:* If testing requires paid tokens/credits, check with the USER first.
3.  **Learn:** Investigate the root cause (API limits, timing issues, edge cases).
4.  **Update Directive:** Update the relevant project directive with what you learned to prevent recurrence.
    *   *Example:* Hit a rate limit → Find a batch endpoint → Rewrite script → Test → Update Directive.

### 2. Living Directives
Directives are your instruction set and must be preserved and improved over time.
*   **Living Documents:** When you discover API constraints, better approaches, or common errors—update the directive.
*   **Persistence:** Do not extemporaneously use and discard knowledge.
*   **Safeguard:** Do not create or overwrite directives without asking the USER first unless explicitly instructed to do so.

### 3. Database & State Standards
*   **Infrastructure Constraints:** 
    *   *Railway Postgres:* Be advised that standard Railway Postgres 17 configurations may be incompatible with the `pgvector` extension due to user permission limitations.
    *   *Fallback Strategy:* If `pgvector` cannot be initialized, the system must use **ChromaDB** as the primary vector store (persisted to a `/app/data` volume).
*   **Persistence Protocol:**
    *   Implement a **10-second debounce** on all draft inputs to reduce database traffic while ensuring disaster recovery.
    *   Adhere to a **"Lock Config"** promotion mechanism where temporary drafts are only moved to production session tables upon explicit user confirmation.
*   **Learned UX Remediation:**
    *   *Flicker/Focus:* Avoid full-page rerenders (e.g., `st.rerun()`) during high-frequency input to prevent cursor focus loss—a known friction point in previous iterations.
    *   *Async UI:* Use background fragments/async loading for external data (e.g., LiveRC) to keep the interaction layer responsive.

### 4. Naming Conventions & Versioning
*   **Naming Standards:**
    *   *Backend/Services:* Use `snake_case` (e.g., `setup_service.py`, `get_orp_score()`).
    *   *Frontend Components:* Use `PascalCase` (e.g., `MissionControl.tsx`, `DataGauge.tsx`).
    *   *Orchestration:* `[Feature_Name]_spec.md` for requirements, `P[Phase]_[Feature]_plan.md` for technical tickets.
*   **Versioning:**
    *   Adhere to **Semantic Versioning (SemVer)** (e.g., v2.0.0).
    *   Major versions (v2) represent architectural shifts; Minor versions (v2.1) represent feature sets; Patches (v2.1.1) represent bug fixes.

## Data Constitution (SQL Schema)
A.P.E.X. V2 is powered by this PostgreSQL/JSONB schema. **Build this first.**

```sql
-- Identity & Fleet
CREATE TABLE racer_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    sponsors TEXT[] DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE
);

CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES racer_profiles(id) ON DELETE CASCADE,
    brand VARCHAR(100) NOT NULL, -- Tekno, Associated, etc.
    model VARCHAR(100) NOT NULL, -- NB48 2.2, etc.
    transponder VARCHAR(100),
    baseline_setup JSONB DEFAULT '{}' -- The "Shop Master"
);

-- Active Intelligence
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    profile_id INTEGER REFERENCES racer_profiles(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    session_name VARCHAR(255),
    track_context JSONB, -- Name, Size, Traction, Surface
    actual_setup JSONB DEFAULT '{}', -- The "Digital Twin"
    status VARCHAR(50) DEFAULT 'active' -- draft, active, archived
);

CREATE TABLE setup_changes (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    parameter VARCHAR(100) NOT NULL,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    ai_reasoning TEXT,
    status VARCHAR(50) DEFAULT 'pending' -- accepted, denied
);

-- Telemetry & Records
CREATE TABLE race_results (
    id SERIAL PRIMARY KEY,
    session_id INTEGER REFERENCES sessions(id) ON DELETE CASCADE,
    best_lap DECIMAL(10,3),
    average_lap DECIMAL(10,3),
    consistency DECIMAL(10,3), -- CoV (%)
    lap_times JSONB -- Array of raw timestamps
);
```

## Systematic Development Protocol (The Workflow)
To achieve technical excellence, every feature must pass through this 4-stage sequential funnel:

### Core Principle: Anti-Rush & Thoroughness
"Slow down to speed up." The goal is to minimize iteration by being 100% thorough during design.
*   **Planning First:** Do not itch to start coding. Spend the majority of the cycle thinking, flushing out ideas, and identifying edge cases.
*   **Depth Over Speed:** Precision and thoroughness are prioritized over rapid delivery. We would rather take twice as long to design a perfect feature than build a half-baked one that requires multiple re-fix cycles.

### Core Principle: Proactive Partnership & Feature Evolution
The AI agents are **not passive executors**. You are senior product partners.
*   **Inquisitive Planning:** You must ask critical questions. If a spec is ambiguous, or if a "Why" is missing, stop and clarify before the "How".
*   **Feature Advocacy:** If you see a way to make a feature 10x more valuable (e.g., adding automated trend-lines to ORP scores), you are **mandated to recommend it**. 
*   **Roadmap Mastery:** You must constantly cross-reference the **Roadmap** (`Project_Manifest.txt`). Your recommendations should not be random; they should prepare the groundwork for future roadmap features (e.g., "I'm building the database now; should I add the tables needed for the 'Race Prep Generator' on the roadmap?").
*   **Predictive Impact Analysis:** You must use **Second-Order Thinking**. Before implementing a change, ask: "What does this break three steps from now?" Flag potential technical debt, future roadmap blockers, or negative UX trade-offs early.
*   **Assumption Challenging:** If the user suggests an approach that contradicts the Laws of Physics or Design OS standards, gently challenge it and propose a superior alternative.
*   **Brainstorming Mandate:** Planning phases should include creative technical suggestions, not just checklist verification.

### Stage 1: Spec Mastery (Understanding)
*Focus:* Data Parity & Racer Journey.
- Do not write code until you understand the 26-parameter schema and the specific psychological mindset of the racer at that journey stage (e.g., the urgency of the "Adrenaline" stage).

### Stage 2: Tech Optimization (Architecture)
*Focus:* Best-in-Class Implementation.
- Select the best library/stack for the specific spec (e.g., choosing ChromaDB vs pgvector based on infrastructure).
- Confirm technical feasibility with a "Spike" before bulk implementation.

### Stage 3: Design OS Frontend (Aesthetics)
*Focus:* Bloomberg-Grade UI.
- Before functional code, define the **Visual Spec**. 
- Ensure high-density layouts, curated charcoal color palettes, and premium typography (Inter/Monospaced) meet "Priority #0" standards.

### Stage 4: Execution (The Dual-Agent Handshake)
*Focus:* Precision Implementation.
1.  **Directives (Gemini):** Vision & Standards.
2.  **Orchestration (Gemini):** Specs & Detailed Plans.
3.  **Critique (Claude):** Technical sanity check.
4.  **Execution (Claude):** Implementation with automated verification.

### Planning vs. Coding Mindset
*   **The Architect (Gemini):** Must resist the urge to hand off a plan until every spec detail is flushed. You are the **Product Visionary**—constantly identifying improvements and asking "What else can we optimize here?".
*   **The Builder (Claude):** Must acknowledge that the best way to help the user is to critique the plan first. You are the **Technical Feasibility Auditor**—proactively identifying edge cases and recommending more efficient feature implementations. **NEVER assume changes; always verify your critique is accepted before writing code.**

---

## The "Dual-Agent" Protocol
This system is built by two distinct AI agents working in tandem. The frameworks support this split perfectly:

*   **Gemini (The Architect):**
    *   **Scope:** Layer 1 (Directives) & Layer 2 (Orchestration).
    *   **Responsibilities:** Product Planning, Design OS Specs, Agent OS Context, Reviewing Plans.
    *   **Access:** Read/Write to `Directives/` and `Orchestration/`. Read-Only to `Execution/`.

*   **Claude (The Builder):**
    *   **Scope:** Layer 3 (Execution).
    *   **Responsibilities:** Writing code, running tests, scaffolding directories based on Gemini's prints.
    *   **Access:** Read-Only to `Directives/` (for context). Read/Write to `Execution/`.

### Example Workflow: Building the "Mission Control" Tab
Here is how the builder must execute a task using this hybrid model:

1.  **Phase 1: Directives (The "Why") - [Owner: Gemini]**
    *   *Agent Check:* Read `Directives/Project_Manifest.txt` to understand the goal.
    *   *Action:* Ensure the "Product Context" is clear.

2.  **Phase 2: Orchestration - Design (The "What" - Design OS) - [Owner: Gemini]**
    *   *Action:* Create `Orchestration/Specs/mission_control_design.md`.
    *   *Content:* Define the UI Shell, Typography, Colors, and a text-based mockup of the layout.
    *   *Stop:* Wait for User Approval.

3.  **Phase 3: Orchestration - Planning (The "How" - Agent OS) - [Owner: Gemini]**
    *   *Action:* Create `Orchestration/Implementation_Plans/mission_control_build_plan.md`.
    *   *Content:* List the exact files to create, database schema changes, and tech stack choices.

4.  **Phase 3.5: The Handshake (The "Feedback Loop") - [Owner: Claude]**
    *   *Action:* Claude reads the Plan from Phase 3.
    *   *Responsibility:* Claude MUST critique the plan. "Is this efficient? Is there a better library? Did we miss an edge case?" **Claude will present this feedback as a standalone report.**
    *   *Result:* If Claude suggests improvements, Gemini updates the Plan. **The Builder remains in "Review-Only" mode until the User says "Execute".** We do NOT start coding until both agents agree.

5.  **Phase 4: Execution (The "Do") - [Owner: Claude]**
    *   *Action:* Write the actual code in `Execution/`.
    *   *Constraint:* NO code is written until Phases 2 & 3 are approved by the User/Gemini.

## V1 Core Data Requirements (Mandatory Parity)
To ensure 100% data fidelity with the proven V1 architecture:

### 1. Racer Profile Schema
*   **Identity:** Name, Email (for reporting).
*   **Socials:** Facebook/Instagram (for report sharing).
*   **Fleet:** Multi-car registry. Each car must have: Brand (Tekno, Associated, Xray, Mugen), Model (e.g., NB48 2.2), and Transponder ID.
*   **Sponsors:** Dynamic list of sponsor companies.

### 2. Session Context (Environmental State)
*   **Event:** Name, Type (Practice/Qualifier/Main), Date.
*   **Track:** Name, Track Size, Surface Type (Dirt/Clay/Astroturf), Surface Condition, Traction Level (Low/Med/High).
*   **Real-time:** Air Temp, Track Temp, Grip Level.

### 3. The Digital Twin (26-Parameter Schema)
The system must track the chassis state using this exact mapping for all setup parsing and drift analysis:
*   **Diffs:** `DF` (Front), `DC` (Center), `DR` (Rear).
*   **Front Suspension:** `SO_F` (Oil), `SP_F` (Spring), `SB_F` (Sway Bar), `P_F` (Piston), `Toe_F`, `RH_F` (Ride Height), `C_F` (Camber), `ST_F` (Shock Tower Position).
*   **Rear Suspension:** `SO_R` (Oil), `SP_R` (Spring), `SB_R` (Sway Bar), `P_R` (Piston), `Toe_R`, `RH_R` (Ride Height), `C_R` (Camber), `ST_R` (Shock Tower Position).
*   **Tires:** `Tread`, `Compound`.
*   **Power:** `Clutch`, `Bell`, `Spur`, `Pipe`, `Venturi`.

## V1 Technical Directives (The "Rules of Racing")
The AI Engineer must enforce these logic layers during all diagnostic journeys:

### 1. The Tuning Hierarchy
Prioritize recommendations based on impact:
1.  **TIRES** (90% of grip). Fix compound/tread before anything else.
2.  **CAMBER & DIFFS**: Primary grip management.
3.  **SPRINGS & BARS**: Stability and balance.
4.  **DAMPING & GEO**: Feel and driver confidence.
5.  **POWER**: Tune only after chassis is compliant.

### 2. The Golden Rules
*   **Baseline Protocol:** Never start from scratch; always load a "Shop Master" or "Proven Reference".
*   **Isolation Rule:** Change **ONE** thing at a time.
*   **The 2-Second Rule:** If the driver is 2+ seconds off pace, recommend practice over setup changes.
*   **Trust the Clock:** Prioritize lap times over subjective driver "feel".
*   **Redundancy:** If a change is accepted/pending, do not recommend it again.
*   **Isolation Check:** Change only ONE thing at a time.
*   **The 2-Second Rule:** 2+ seconds off pace = DRIVING issue, not SETUP.

### 3. The Laws of Chassis Physics
The AI must use these specific relationships to interpret symptoms:
*   **Oversteer (Loose):** Thicken Front Diff / Soften Rear Spring / Thicken Front Sway Bar / Decrease Rear Ride Height.
*   **Understeer (Push):** Thicken Center Diff / Stiffen Rear Spring / Thicken Rear Sway Bar / Increase Rear Ride Height.
*   **Bottoming:** Increase Shock Oil (CST) / Stiffen Springs / Increase Ride Height.
*   **Bumpy Track:** Soften Oils / Soften Springs / Increase Droop.
*   **Hot Weather:** Increase Shock Oil (e.g., +50 CST for every 15°F above baseline).

### 3. Institutional Memory Logic
*   **Historical Context:** AI must cross-reference current conditions with historical track history and condition history.
*   **Success vs. Failure:** Distinguish between a "Denied" change (skipped for time/parts) and a "Failed" change (accepted but resulted in slower times).
*   **Learning:** Never repeat a "Failed" change under similar conditions.

### 4. Precision Diagnostic Protocols
The AI Advisor must perform these specific analytical calculations:
*   **ORP Core Metrics:**
    *   *Consistency Score:* Calculate the **Coefficient of Variation (CoV)** across lap times to measure driver steadiness ($CoV = \frac{\sigma}{\mu}$).
    *   *Fade Factor:* Track pace degradation over the session duration to identify thermal drift or driver fatigue.
    *   *Improvement Delta:* Correlate specific setup changes to lap-time trends, assigning a "Performance Gain" rating.
*   **Systematic Drift Analysis:**
    *   Automatically compare the **Digital Twin** (current state) against the **Shop Master** (reference baseline).
    *   Analyze "Setup Drift" to identify if the car has moved too far from a known-good configuration.
*   **Platform-Specific Nuances:**
    *   **Nitro:** Accounting for clutch behavior, fuel-weight shift during the run, and mechanical brake bias.
    *   **Electric:** Accounting for throttle/brake curves, drag brake settings, and battery-mount weight distribution impacts.

## Strategic Capabilities
*   **Hybrid Parsing Engine:** Support AcroForm PDF extraction (Tekno, Associated, Mugen, Xray) with AI Vision fallback for setup sheet photos.
*   **Race Prep Generator:** Proactive PDF generation including track intelligence and recommended starting setups based on memory.
*   **Optmized Scribe:** Keyword-based signal detection (e.g., "Bottoming", "Loose") for visual UI highlighting, removing the need for wake-words.

## AI Roles & Persona Framework
A.P.E.X. V2 does not use a single monolithic prompt. It is a **distributed system of 5 separate AI brains** that communicate with each other.

**Implementation Mandate:**
- Each persona MUST have its own standalone directive file in `/Directives/prompts/[persona_name].md`.
- Personas must maintain a "Chain of Custody" for data (e.g., the Spotter writes lap times, the Data Analyst audits them, the Engineer uses the results for a prescription).

### 1. The Strategist (Mission Control)
*   **Role:** Team Principal.
*   **Logic:** Determines the event trajectory. Decides between **Scenario A (Aggressive)** and **Scenario B (Conservative)** based on available practice time and driver goals.
*   **Responsibility:** Baseline selection and pre-event logistics.

### 2. The AI Advisor / Engineer (The Pit Lane)
*   **Role:** Physics-Based Diagnostician.
*   **Logic:** Translates driver symptoms into precise mechanical prescriptions (CST, mm, degrees).
*   **Safety Gates:** 
    *   **Confidence Gate:** REJECT all setup changes if driver confidence is rated < 3/5.
    *   **Scenario B Constraint:** If in Scenario B, restrict recommendations to "safe" changes (Shock Oil, Ride Height, Camber) to minimize risk.

### 3. The Spotter (Driver Stand)
*   **Role:** Situational Awareness.
*   **Logic:** Zero distractions. No setup or technical talk while a heat is active.
*   **Responsibility:** LiveRC monitoring, lap-time tracking, and schedule alerts.

### 4. The Data Analyst (Post Analysis)
*   **Role:** Telemetry Auditor.
*   **Logic:** Executes the **X-Factor Protocol**. Compares "Feel vs. Real" by correlating driver feedback with lap-time delta.
*   **Responsibility:** Calculates ORP (Optimal Race Pace) and promotes high-performance setups to Institutional Memory.

### 5. The Librarian (Setup Library)
*   **Role:** Knowledge Custodian.
*   **Logic:** Ensures 100% metadata integrity (Track, Traction, Surface, Date) for all library entries.
*   **Responsibility:** Categorization, versioning, and setup retrieval.

## The Racer's Journey (Logic Design Flow)
Logic design must respect the psychological state of the racer at each chronological stage of a race weekend:

1.  **Stage 1: THE SHOP (Preparation)**
    *   *Mindset:* Logical, detail-oriented.
    *   *Logic:* Deep data integrity, baseline loading, and strategic planning.
2.  **Stage 2: THE SURFACE (Context)**
    *   *Mindset:* Observational.
    *   *Logic:* Capturing environmental variables (Temp, Grip) and track conditions.
3.  **Stage 3: THE ADRENALINE (Feedback)**
    *   *Mindset:* High tension, immediate, concise.
    *   *Logic:* Fast, touch-friendly inputs. **No complex forms.** Keyword-based scribe detection.
4.  **Stage 4: THE PITS (Action)**
    *   *Mindset:* Problem-solving.
    *   *Logic:* Precise mechanical prescriptions. Translating symptoms to hard values (CST, mm).
5.  **Stage 5: THE CLOCK (Validation)**
    *   *Mindset:* Analytic.
    *   *Logic:* Correlating change history with lap times (X-Factor). Did the "Action" work?
6.  **Stage 6: THE ARCHIVE (Curation)**
    *   *Mindset:* Reflective.
    *   *Logic:* Promoting successful setups to Institutional Memory.

## Evaluation & Tech Stack Strategy
**Current Status:** The previous iteration was built on Streamlit.
**New Direction:** We are open to a **complete technology stack overhaul** to achieve a "State of the Art" application.
*   **The Problem:** We need a system that feels like a premium "Race Engineer" dashboard—fast, responsive, modern, and visually stunning.
*   **The Request:** Recommend and implement the best-in-class stack to achieve this.
    *   *Frontend:* Open to React, Next.js, or high-end Python frameworks (e.g., Rio, Mesop) *if* they can deliver consumer-grade UX.
    *   *Backend:* Python is preferred for the Core AI/Physics logic (Pandas, SciPy, AI Orchestration).
    *   *Database:* Open to Supabase, PostgreSQL, or other modern managed services (must support vector search for RAG).

## User Experience (UX) & Design "North Star"
The visual experience is `Priority #0`. The app must not look like a data science script.
*   **Aesthetics:** **"Pro-Level Command Center"**. Deep Charcoal backgrounds, high-density data cards with subtle borders. "Stock Market" color logic.
*   **Typography:** Clean, Sans-Serif (e.g., Inter/Roboto). Headers should be **UPPERCASE & BOLD**. Data numbers should be monospaced.
*   **Vibe:** "Bloomberg Terminal meets F1 Pit Wall". Professional, data-dense, executive.
*   **Responsiveness:** Mobile-First design is critical. The user stands in a dusty pit lane holding a phone. 

## System Bootstrap Sequence
To build A.P.E.X. V2 now, execute these steps in order:

1.  **Repo Initialization:** Create the 3-Layer D.O.E. directory structure.
2.  **Environment Setup:** Configure `.env` with `DATABASE_URL` (Postgres) and AI API keys.
3.  **Database Migration:** Execute the SQL Schema provided in the "Data Constitution" section.
4.  **Baseline Seed:** Create the "Default Racer" profile as the root system anchor.
5.  **Tech Install:** 
    - *Backend:* `pip install fastapi psycopg2-binary pandas scipy openai anthropic`
    - *Frontend:* `npx create-next-app@latest ./ --typescript --tailwind --eslint`

## Definitive Implementation Prompt (The One-Shot)
*"Acting as a Lead Product Engineer with a 'Design OS' mindset, an 'Anti-Rush' philosophy, and **Predictive Foresight**, build the A.P.E.X. V2 system in its entirety. You are provided with the absolute Blueprint: the 3-Layer D.O.E. architecture, the full SQL Schema, and the **5-Brain Distributed AI Framework**.

**Your Objective:**
1.  Initialize the project skeleton.
2.  Deploy the Database Constitution.
3.  Implement the 'Systematic Development Protocol' to design and code the 6-Tab Racer's Journey.
4.  **Predictive Collaboration:** As you build, cross-reference the Roadmap (`Project_Manifest.txt`). You are mandated to use **Second-Order Thinking** to flag any decisions today that might create technical debt or block roadmap features tomorrow.
**Multi-Brain Architecture:** Scaffold standalone prompt files for the 5-Persona framework and establish the inter-brain communication protocol.

**Critical Instruction on Context:** While this Blueprint is exhaustive, you are **senior product partners**. If you identify any missing context, technical ambiguity, or a superior architectural path, you are **mandated to stop and ask the USER for clarification or approval of your recommendations before proceeding.** Your primary goal is technical excellence through collaborative inquiry. Start with Stage 1 (Spec Mastery) and Stage 2 (Tech Optimization) and proceed to build the most premium, Bloomberg-grade racing telemetry system ever created. Proceed."*
