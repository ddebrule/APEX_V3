# Design OS Standard
**Version:** 1.0
**Source:** [Builder Methods](https://github.com/buildermethods/design-os)

## Philosophy
We do not build generic software. We build specified products. Design OS is the "Missing Process" between the idea and the code. It forces us to resolve visual and functional ambition *before* implementation complexity begins.

## The 4-Step Workflow

### 1. Product Planning (The Spec)
**Goal:** Define *what* we are building and *why*.
**Deliverable:** `Orchestration/Specs/[Feature]_Product_Spec.md`
**Required Sections:**
*   **The Problem:** What user pain point are we solving?
*   **The User:** Who is this for? (e.g., "The Sportsman Racer in the Pit Lane")
*   **Data Model:** What entities correspond to this feature? (e.g., `Session`, `LapTime`)
*   **Requirements:** A bulleted list of "Must Haves".

### 2. Design System (The Shell)
**Goal:** Define *how* it looks. This is done ONCE globally, then referenced.
**Deliverable:** `Directives/Standards/Design_System.md`
**Required Sections:**
*   **Color Palette:** Deep Charcoal (Background), Stark White (Text), Signal Green/Red (Status), Safety Yellow (Alerts).
*   **Typography:** Modern Sans-Serif (Headers in UPPERCASE), Tabular Numbers.
*   **Components:** High-density Cards, Ticker Indicators, "Action Center" Lists.
*   **Vibe:** "Pro-Level Command Center", "Executive Dashboard".

### 3. Section Design (The Mockup)
**Goal:** Visualize the specific feature *before* coding.
**Deliverable:** `Orchestration/Specs/[Feature]_Design_Spec.md`
**Required Sections:**
*   **Layout:** A text-based wireframe or description of the screen layout.
*   **Interactions:** "Clicking X opens Y", "Hovering Z shows tooltip".
*   **Copy:** The actual text on the buttons and headers.

### 4. Handoff (The Build)
**Goal:** Execute the build.
**Trigger:** This phase ONLY begins when Steps 1-3 are marked `[APPROVED]`.
**Process:** The Builder (Claude) takes the `Product Spec` + `Design Spec` and implements the code.
