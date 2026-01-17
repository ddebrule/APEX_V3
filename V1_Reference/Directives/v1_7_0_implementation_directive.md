# Directive: A.P.E.X. v1.7.0 Implementation Wrapper

## 1. Mission
To implement the v1.7.0 "Intelligence Layer" refinements, finalizing the Scribe optimization, establishing the Hybrid Parsing Engine, and automating the reporting loop. This document serves as the high-fidelity instruction set for the implementation agent.

---

## 2. Optimized Scribe (Tab 2)
**Goal**: Transition from manual wake words to proactive signal detection.
- **Requirement**: Remove all "Note" and "Log" wake-word logic.
- **Logic**: Implement keyword-based visual highlighting during voice transcription.
- **Keywords**: "Bottoming", "Loose", "Traction", "Rotation", "Wash", "Stability", "Entry", "Exit", "Jump", "Land", "Consistency".
- **UI Action**: If a keyword is detected in the Whisper transcript, the resulting chat bubble or activity log entry must be visually flagged (e.g., using `st.warning` or `st.info` in the dashboard).

---

## 3. Hybrid Parsing Engine (Tab 5)
**Goal**: 100% setup fidelity across digital and physical sources.
- **Stage 1 (Precision)**: Robust AcroForm extraction for fillable PDFs from Tekno, Associated, Mugen, and Xray.
- **Stage 2 (Vision)**: AI Vision fallback (Claude 3.5 Sonnet) for photos of setup sheets. Use the multi-modal endpoint to extract the 24-parameter schema (DF, DC, DR, SO_F, etc.) from images.
- **Integration**: Both paths must populate the `st.session_state.actual_setup` (Digital Twin) and allow प्रमोशन (promotion) to the Master Library.

---

## 4. Automated Reporting (Tab 4)
**Goal**: Hands-free sponsor distribution.
- **Logic**: Integrate an "Automate Sponsor Reports" toggle in the Post Event Analysis tab.
- **Action**: When the X-Factor "Complete Audit" button is clicked, IF the toggle is enabled, immediately trigger the `email_service.send_report` call.
- **Recipient**: Default to the email registered in the `Racer Profile`.

---

## 5. Technical Constraints
- **File Hierarchy**:
    - Update `dashboard.py` for UI and Scribe logic.
    - Update `setup_parser.py` for Hybrid (Vision) logic.
- **Mapping**: Ensure all extracted values map 1:1 to the `car_configs.csv` and database schema.
- **Safety**: Maintain CSV fallback mode for all services to ensure local development remains functional.
