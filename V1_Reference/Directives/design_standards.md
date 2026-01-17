# A.P.E.X. Design Standards (Design OS)

**Type:** Layer 1 Directive  
**Status:** Active Draft v1.0  
**Scope:** UI/UX, Component Architecture, Voice & Tone  

## 1. Design Philosophy
The A.P.E.X. interface transforms complex setup and telemetry data into a **calm, intuitive experience**. It is built around three core values: **Speed, Clarity, and Trust**.

*   **Mission:** Give users full control and confidence without losing essential operational depth. Avoid the cluttered, fragmented visuals of other platforms.
*   **Principle 1: Efficiency & Empathy.** Every section serves both the need for speed (Efficiency) and the racer's need for confidence (Empathy). We streamline operations to reduce mental load in the heat of the race.
*   **Principle 2: High Signal-to-Noise.** Every pixel should serve the goal of making the car faster. If it doesn't build trust or speed, remove it.
*   **Principle 3: Native Clarity.** Leverage Streamlit's native components for a clean, data-driven UI. Avoid decorative inputs; focus on clarity and effortless control.
*   **Principle 4: The "Twin" Concept.** The UI is a direct reflection of the physical car. Changes in UI = Changes on Car.

## 2. Visual Hierarchy & Iconography
We use a strict **Emoji-as-Icon** system to provide visual anchors in a text-heavy interface.

### Header Hierarchy
*   **Page Title:** `🏎️ Project A.P.E.X.` (Brand anchor)
*   **Tabs:** Function + Icon
    *   📋 Event Setup (Admin/Config)
    *   🛠️ Setup Advisor (Tools/Action)
    *   🏎️ Race Support (Live Ops)
    *   📊 Post Event Analysis (Data/Review)
    *   📚 Setup Library (Reference)
*   **Section Headers:** Descriptive Icon + Title (e.g., `⚡ Performance Metrics`, `📝 Edit Profile`)

### Indicator Icons
*   🚀 **Action:** Submitting forms, locking configs.
*   🔄 **Sync/Refresh:** Updating state, reloading data.
*   💾 **Save:** Committing to permanent storage ("Shop Master").
*   🛰️ **External Data:** APIs (Weather, LiveRC).
*   🧠 **AI Processing:** LLM reasoning in progress.

### Global Theming & Color
**Yes, you can change the look.**
To maintain "Native Clarity" (Principle 3), we control color globally, not locally.
*   **Theming:** Use `.streamlit/config.toml` to define the Primary Color, Background, and Text Color.
*   **Protocol:** Do not hardcode colors in Python (e.g., `:red[...]`). Instead, update the Global Theme so the change applies everywhere instantly.

## 3. Component Architecture

### The "HUD" Pattern (Heads-Up Display)
Use `st.metric` columns for high-level health checks. Always group in sets of 3 or 4.
*   **Usage:** ORP Scores, Confidence Ratings, Weather, Lap Times.
*   **Style:** Use `delta` parameters to show trends (Green = Good/Improvement, Red = Drift/Degradation).

### The "Control Array" Pattern
For parametric inputs (suspension, gearing), use `st.columns` to mimic physical layout.
*   **Front/Rear Split:** Always separate Front and Rear suspension into distinct column groups.
*   **Flow:** Group inputs logically: Shocks → Geometry → Drivetrain.

### The "Console" Pattern
For AI interaction (Chat), use `st.chat_message`.
*   **Assistant:** "Crew Chief" persona.
*   **User:** "Driver" persona.
*   **Status:** Use `st.status` ("🧠 Engineering Analysis...") to mask latency during AI thought visibility.

## 4. Feedback & Interaction Patterns

*   **Success (`st.success`):** Confirmation of state change.
    *   *Example:* "Digital Twin Updated.", "Session Locked."
*   **Info (`st.info`):** Contextual data or non-critical state.
    *   *Example:* "Active Session: Q1 Nitro Challenge", "Scenario A: Avant Garde Mode."
*   **Warning (`st.warning`):** Setup drifts, missing data, or "Yellow Flags".
    *   *Example:* "Unsaved changes detected.", "Vehicle not found in database."
*   **Error (`st.error`):** Critical failures, "Red Flags", or Gate Rejections.
    *   *Example:* "Confidence Gate REJECTED.", "Weather API Offline."

## 5. Voice & Tone
The system speaks as a **Senior Race Engineer**.

*   **Direct & Concise:** No pleasantries ("Please", "Would you like"). Give orders or state facts.
*   **Technical:** Use domain-correct terminology (CST, Toe-out, Ackermann).
*   **Confidence-Based:**
    *   High Confidence: "Increase Front Oil to 600 CST."
    *   Low Confidence: "Consider testing 600 CST Front Oil to address dive."

## 6. Streamlit Implementation Rules
1.  **Do not use** `st.markdown` for custom styling (e.g., `<style>...</style>`) unless strictly necessary for layout fixes.
2.  **Do not use** raw HTML for core components.
3.  **Always** use `st.container(border=True)` to group related control sets (e.g., a specific suspension corner).

## 7. Evolution & Flexibility
**This is a Living Document.**
As A.P.E.X. evolves, so will its interface. This directive serves as a **baseline for consistency**, not a barrier to innovation.
*   **New Ideas:** If a new design pattern works better (e.g., a better way to visualize shock curves), implement it, then update this guide.
*   **Exceptions:** "Empathy" (Principle 1) takes precedence over "Consistency". If breaking a rule reduces racer anxiety, break the rule.

### Workflow: "Make it Look Like This"
**Visual References are Encouraged.**
Because Streamlit has constraints, providing images ("Make it look like this") is the **best way** to communicate intent.
*   **Our Job:** When you upload an image, we will map it to the closest possible *Native Streamlit* component defined in Section 3.
*   **No Conflict:** Your visual inspiration triggers the evolution of this document. If you show us a better UI, we will build it and update the standard.
