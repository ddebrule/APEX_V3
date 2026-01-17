# A.P.E.X. v1.7.0 Implementation Plan
**Intelligence Layer Refinements**

**Version:** v1.7.0
**Current Version:** v1.6.0
**Prepared:** 2025-12-27
**Execution Agent:** Claude Code

---

## Executive Summary

This plan implements three strategic refinements to the A.P.E.X. intelligence layer:

1. **Optimized Scribe (Tab 2)**: Replace manual wake-word detection with proactive keyword-based visual highlighting
2. **Hybrid Parsing Engine (Tab 5)**: Extend PDF parsing to all major brands + AI Vision fallback for photos
3. **Automated Reporting (Tab 4)**: Enable hands-free sponsor report distribution at session close

**Complexity:** Medium
**Estimated Implementation Blocks:** 3 major modules
**Risk Level:** Low (Non-breaking changes to existing features)

---

## Feature 1: Optimized Scribe (Tab 2)

### Current State Analysis
- **Location**: [dashboard.py:96-104](dashboard.py#L96-L104) (`transcribe_voice()`)
- **Legacy Wake-Word Logic**:
  - [mcp_server.py:43-44](mcp_server.py#L43-L44) contains wake-word checks for "Note" and "Log"
  - Manual user intent required to trigger logging
- **Problem**: Requires racer to remember wake words during high-speed runs in loud environment

### Target State
- **Automatic Detection**: System scans ALL voice transcripts for technical keywords
- **Visual Highlighting**: Detected keywords trigger visual UI flags (warning/info blocks)
- **Zero Manual Triggers**: No wake words needed - intelligence layer handles detection

### Implementation Specification

#### File: `dashboard.py` (Tab 2 - Setup Advisor)

**Location**: Lines ~400-560 (Setup Advisor tab section)

**Changes Required**:

1. **Create Keyword Detection Function** (Add after line 126):
```python
def detect_technical_keywords(transcript: str) -> dict:
    """
    Scans transcript for technical racing keywords.
    Returns dict with detected keywords and highlighting level.
    """
    keywords = {
        "critical": ["Bottoming", "Wash", "Stability"],
        "performance": ["Loose", "Traction", "Rotation", "Consistency"],
        "track_features": ["Entry", "Exit", "Jump", "Land"]
    }

    detected = {"critical": [], "performance": [], "track_features": []}
    transcript_lower = transcript.lower()

    for category, words in keywords.items():
        for word in words:
            if word.lower() in transcript_lower:
                detected[category].append(word)

    return detected
```

2. **Modify Voice Transcription Handler** (Lines ~500-530):
- Current: Transcript is logged and added to chat
- New: Pass through `detect_technical_keywords()` → render with visual flags

**Before** (approximate current code):
```python
if audio:
    transcript = transcribe_voice(audio['bytes'])
    st.session_state.messages.append({"role": "user", "content": transcript})
    # Log to CSV
    pd.DataFrame([{...}]).to_csv(LOG_PATH, mode='a', index=False)
```

**After**:
```python
if audio:
    transcript = transcribe_voice(audio['bytes'])

    # Keyword detection
    detected = detect_technical_keywords(transcript)

    # Visual highlighting based on detected keywords
    if detected["critical"]:
        st.warning(f"🔴 CRITICAL FEEDBACK: {', '.join(detected['critical'])}")
    if detected["performance"]:
        st.info(f"⚡ PERFORMANCE NOTE: {', '.join(detected['performance'])}")
    if detected["track_features"]:
        st.info(f"🏁 TRACK INSIGHT: {', '.join(detected['track_features'])}")

    st.session_state.messages.append({"role": "user", "content": transcript})

    # Enhanced logging with keyword flags
    log_entry = {
        "Date": datetime.now().strftime("%m-%d %H:%M"),
        "Event": current_session,
        "Vehicle": active_car_adv,
        "Notes": transcript,
        "Keywords": ", ".join(detected["critical"] + detected["performance"] + detected["track_features"]) if any(detected.values()) else ""
    }
    pd.DataFrame([log_entry]).to_csv(LOG_PATH, mode='a', index=False)
```

3. **Update Chat Display** (Lines ~540-550):
- Add keyword badges to message rendering
- Highlight messages containing critical keywords

#### File: `mcp_server.py` (Deprecate Wake-Word Logic)

**Location**: Lines 43-44, 128-130

**Changes Required**:
- Remove wake-word checking logic (lines 43-44)
- Update docstrings to reflect automatic detection
- Maintain backwards compatibility for API consumers

**Before**:
```python
is_wake_word = text.lower().startswith("note") or text.lower().startswith("log")
```

**After**:
```python
# Wake-word logic deprecated in v1.7.0 - all transcripts are logged with keyword detection
```

#### Database Schema Update (Optional Enhancement)

**Table**: `track_logs` (already exists via CSV/PostgreSQL)

**New Column** (if using PostgreSQL):
```sql
ALTER TABLE track_logs ADD COLUMN keywords VARCHAR(255);
```

CSV column already handled in new logging code above.

---

## Feature 2: Hybrid Parsing Engine (Tab 5)

### Current State Analysis
- **Location**: [setup_parser.py](setup_parser.py)
- **Current Support**: Tekno PDF AcroForm extraction ONLY
- **Brand Mappings**: Placeholder mappings exist for Associated, Mugen, Xray (lines 52-74) but incomplete
- **Vision Fallback**: Infrastructure exists (lines 124-169) but not integrated into UI

### Target State
- **Stage 1 (Precision)**: Complete AcroForm mappings for all 4 brands
- **Stage 2 (Vision)**: UI integration for photo uploads with AI Vision parsing
- **100% Fidelity**: Any setup sheet (digital PDF or photo) → 24-parameter schema

### Implementation Specification

#### File: `setup_parser.py`

**Location**: Lines 52-74 (Brand-specific mappings)

**Changes Required**:

1. **Complete Associated Mapping** (Line 52):
```python
def _get_associated_mapping(self) -> Dict[str, str]:
    """Field mapping for Associated setup sheets (RC8B4/RC8T4)."""
    return {
        # Diffs
        "Front_Diff_Oil": "DF",
        "Center_Diff_Oil": "DC",
        "Rear_Diff_Oil": "DR",
        # Front Suspension
        "Front_Shock_Oil": "SO_F",
        "Front_Spring": "SP_F",
        "Front_Sway_Bar": "SB_F",
        "Front_Piston": "P_F",
        "Front_Toe": "Toe_F",
        "Front_Ride_Height": "RH_F",
        "Front_Camber": "C_F",
        "Front_Shock_Type": "ST_F",
        # Rear Suspension
        "Rear_Shock_Oil": "SO_R",
        "Rear_Spring": "SP_R",
        "Rear_Sway_Bar": "SB_R",
        "Rear_Piston": "P_R",
        "Rear_Toe": "Toe_R",
        "Rear_Ride_Height": "RH_R",
        "Rear_Camber": "C_R",
        "Rear_Shock_Type": "ST_R",
        # Tires
        "Tire_Type": "Tread",
        "Tire_Compound": "Compound",
        # Power
        "Clutch_Bell": "Bell",
        "Spur_Gear": "Spur",
        "Exhaust_Pipe": "Pipe"
    }
```

2. **Complete Mugen Mapping** (Line 61):
```python
def _get_mugen_mapping(self) -> Dict[str, str]:
    """Field mapping for Mugen setup sheets (MBX8/MTX8)."""
    return {
        # Diffs
        "FD_Oil_Weight": "DF",
        "CD_Oil_Weight": "DC",
        "RD_Oil_Weight": "DR",
        # Front Suspension
        "F_Shock_Oil": "SO_F",
        "F_Shock_Spring": "SP_F",
        "F_Anti_Roll_Bar": "SB_F",
        "F_Shock_Piston": "P_F",
        "F_Toe_Angle": "Toe_F",
        "F_Ride_Height": "RH_F",
        "F_Camber_Angle": "C_F",
        "F_Shock_Tower": "ST_F",
        # Rear Suspension
        "R_Shock_Oil": "SO_R",
        "R_Shock_Spring": "SP_R",
        "R_Anti_Roll_Bar": "SB_R",
        "R_Shock_Piston": "P_R",
        "R_Toe_Angle": "Toe_R",
        "R_Ride_Height": "RH_R",
        "R_Camber_Angle": "C_R",
        "R_Shock_Tower": "ST_R",
        # Tires
        "Tire_Insert": "Tread",
        "Rubber_Compound": "Compound",
        # Power
        "Clutch_Setting": "Clutch",
        "Clutch_Bell_Teeth": "Bell",
        "Spur_Gear_Teeth": "Spur"
    }
```

3. **Complete Xray Mapping** (Line 69):
```python
def _get_xray_mapping(self) -> Dict[str, str]:
    """Field mapping for Xray setup sheets (XB8/XT8)."""
    return {
        # Diffs
        "Diff_Front_Oil": "DF",
        "Diff_Center_Oil": "DC",
        "Diff_Rear_Oil": "DR",
        # Front Suspension
        "Shock_Front_Oil": "SO_F",
        "Spring_Front": "SP_F",
        "Anti_Roll_Bar_Front": "SB_F",
        "Piston_Front": "P_F",
        "Toe_In_Front": "Toe_F",
        "Ride_Height_Front": "RH_F",
        "Camber_Front": "C_F",
        "Shock_Position_Front": "ST_F",
        # Rear Suspension
        "Shock_Rear_Oil": "SO_R",
        "Spring_Rear": "SP_R",
        "Anti_Roll_Bar_Rear": "SB_R",
        "Piston_Rear": "P_R",
        "Toe_In_Rear": "Toe_R",
        "Ride_Height_Rear": "RH_R",
        "Camber_Rear": "C_R",
        "Shock_Position_Rear": "ST_R",
        # Tires
        "Tire_Tread": "Tread",
        "Tire_Compound": "Compound",
        # Power
        "Clutch_Springs": "Clutch",
        "Clutch_Bell": "Bell",
        "Spur": "Spur",
        "Exhaust": "Pipe"
    }
```

**NOTE**: Actual field names must be verified against real PDF templates from `Data/Setup_Templates/`. The above are educated guesses based on common RC nomenclature.

4. **Enhance Vision Parsing** (Line 124):
- Update to latest Claude model: `claude-3-5-sonnet-20241022` (or newest available)
- Improve prompt with few-shot examples
- Add confidence scoring

**Current** (Line 149):
```python
model="claude-3-5-sonnet-20240620",
```

**Updated**:
```python
model="claude-3-5-sonnet-20241022",  # Use latest vision model
```

**Enhanced Prompt** (Line 139):
```python
vision_prompt = f"""
You are analyzing an RC car setup sheet for {brand}. Extract all visible setup parameters.

CRITICAL PARAMETERS TO FIND:
- Diff Oils: Front (DF), Center (DC), Rear (DR) - usually in CST
- Shock Oil: Front (SO_F), Rear (SO_R) - usually in CST
- Springs: Front (SP_F), Rear (SP_R) - color codes or spring rates
- Sway Bars: Front (SB_F), Rear (SB_R) - wire diameter or stiffness
- Pistons: Front (P_F), Rear (P_R) - hole configuration
- Toe: Front (Toe_F), Rear (Toe_R) - degrees
- Ride Height: Front (RH_F), Rear (RH_R) - mm
- Camber: Front (C_F), Rear (C_R) - degrees
- Tire Tread and Compound
- Gearing: Bell, Spur

Return ONLY a JSON object with keys from this list:
DF, DC, DR, SO_F, SP_F, SB_F, P_F, Toe_F, RH_F, C_F, ST_F, SO_R, SP_R, SB_R, P_R, Toe_R, RH_R, C_R, ST_R, Tread, Compound, Clutch, Bell, Spur, Pipe, Venturi

EXAMPLE OUTPUT:
{{"DF": 5000, "DC": 7000, "DR": 3000, "SO_F": 450, "SO_R": 500, "Tread": "Bar Codes", "Compound": "Blue"}}

If a parameter is not visible or unclear, omit it from the JSON.
"""
```

#### File: `dashboard.py` (Tab 5 - Setup Library)

**Location**: Lines ~900-1100 (Tab 5 section)

**Changes Required**:

1. **Add Vision Upload Section** (After existing PDF upload):
```python
st.divider()
st.subheader("📸 Upload Setup Photo (Vision Parsing)")
st.caption("Take a photo of any setup sheet - AI will extract the parameters")

photo_brand = st.selectbox("Brand", ["Tekno", "Associated", "Mugen", "Xray"], key="vision_brand")
uploaded_photo = st.file_uploader("Upload Photo", type=["jpg", "jpeg", "png"], key="vision_photo")

if uploaded_photo and st.button("🔍 Parse with AI Vision"):
    with st.spinner("Analyzing setup sheet with AI Vision..."):
        photo_bytes = uploaded_photo.read()
        parsed_data = setup_parser.parse_with_vision(photo_bytes, photo_brand)

        if parsed_data:
            st.success("✅ Setup extracted successfully!")

            # Display extracted parameters in grid
            cols = st.columns(3)
            for i, (key, value) in enumerate(parsed_data.items()):
                with cols[i % 3]:
                    st.metric(key, value)

            # Offer to save to Digital Twin or Master Library
            col1, col2 = st.columns(2)
            with col1:
                if st.button("💾 Save to Digital Twin"):
                    st.session_state.actual_setup = parsed_data
                    st.success("Loaded into Digital Twin (Tab 2)")
            with col2:
                if st.button("📚 Save to Master Library"):
                    # Prompt for metadata
                    setup_name = st.text_input("Setup Name", placeholder="Pro Layout - Blue Groove")
                    if setup_name:
                        library_service.add_to_library(
                            brand=photo_brand,
                            model="Vision Upload",
                            track_name="Unknown",
                            setup_name=setup_name,
                            setup_data=parsed_data
                        )
                        st.success("Added to Master Library!")
        else:
            st.error("❌ Could not extract setup data. Ensure photo is clear and well-lit.")
```

2. **Brand-Specific PDF Validation** (Existing upload logic):
- Add brand selection dropdown BEFORE file upload
- Pass brand to `setup_parser.parse_pdf(pdf_path, brand)`

---

## Feature 3: Automated Reporting (Tab 4)

### Current State Analysis
- **Location**: [dashboard.py:764-798](dashboard.py#L764-L798) (X-Factor completion logic)
- **Email Infrastructure**: READY ([email_service.py](email_service.py) exists with mock mode)
- **Current Behavior**: Lines 787-795 ALREADY implement auto-email on completion
- **Issue**: Toggle exists but may not be visible/accessible to user

### Target State
- **Visible Toggle**: User can enable/disable auto-reporting in Tab 4 UI
- **Smart Default**: OFF by default (opt-in for privacy)
- **Confirmation UI**: Show email status after completion

### Implementation Specification

#### File: `dashboard.py` (Tab 4 - Post Event Analysis)

**Location**: Lines ~700-810 (Tab 4 section)

**Changes Required**:

1. **Add Toggle in Tab 4 Header** (Add after Tab 4 declaration, ~line 700):
```python
with tab4:
    st.header("📊 Post Event Analysis")

    # Automated Reporting Toggle (Prominent placement)
    with st.expander("⚙️ Reporting Settings", expanded=False):
        st.session_state.auto_email_reports = st.checkbox(
            "📧 Automatically email reports to sponsor list on session close",
            value=st.session_state.auto_email_reports,
            help="When enabled, completing the X-Factor audit will automatically send a summary to your registered email."
        )

        if st.session_state.auto_email_reports:
            st.info(f"Reports will be sent to: **{st.session_state.racer_profile.get('email', 'No email set')}**")
            st.caption("Update email in Racer Profile (Sidebar) if needed.")

    st.divider()
```

2. **Enhance Email Confirmation** (Lines 787-796):

**Current**:
```python
if st.session_state.auto_email_reports:
    with st.spinner("📧 Sending automated sponsor reports..."):
        recipient = st.session_state.racer_profile.get("email", "racer@example.com")
        subject = f"A.P.E.X. Auto-Report: {active_session.get('session_name', 'Event')}"
        summary = f"Event: {active_session.get('session_name')}\nTrack: {active_session.get('track_name')}\nRating: {st.session_state.get('x_factor_rating', 'N/A')}\nObservation: {observation}"
        success, msg = email_service.send_report(recipient, subject, summary)
        if success: st.info(f"Report automatically sent to {recipient}")
```

**Enhanced**:
```python
if st.session_state.auto_email_reports:
    with st.spinner("📧 Sending automated sponsor reports..."):
        recipient = st.session_state.racer_profile.get("email", "racer@example.com")
        subject = f"A.P.E.X. Race Report: {active_session.get('session_name', 'Event')}"

        # Build comprehensive email report
        summary = f"""
        === A.P.E.X. RACE REPORT ===

        Racer: {st.session_state.racer_profile.get('name', 'N/A')}
        Event: {active_session.get('session_name', 'N/A')}
        Track: {active_session.get('track_name', 'N/A')}
        Date: {datetime.now().strftime('%Y-%m-%d')}

        PERFORMANCE RATING: {st.session_state.get('x_factor_rating', 'N/A')}/5

        DRIVER OBSERVATION:
        {observation}

        SETUP SNAPSHOT:
        {st.session_state.actual_setup if st.session_state.actual_setup else 'No Digital Twin loaded'}

        ---
        Powered by AGR A.P.E.X. v1.7.0
        """

        success, msg = email_service.send_report(recipient, subject, summary)

        if success:
            st.success(f"✅ Report sent to {recipient}")
            st.caption(msg)  # Shows "Mock Mode" or "Email sent successfully"
        else:
            st.error(f"❌ Failed to send report: {msg}")
```

3. **Add Manual Send Button** (Optional enhancement):
```python
# After automated email section
st.divider()
with st.expander("📤 Manual Report Distribution"):
    st.caption("Send race report to a custom recipient")
    manual_recipient = st.text_input("Recipient Email", placeholder="sponsor@example.com")
    if st.button("Send Report Now") and manual_recipient:
        # Reuse email logic above
        st.info("Manual send functionality coming soon!")
```

#### File: `email_service.py`

**No Changes Required** - Service is production-ready. Current behavior:
- Mock mode when no SMTP credentials (logs to console)
- Real email when `SMTP_USER` and `SMTP_PASS` are set in `.env`

**Enhancement** (Optional): Add HTML formatting support

---

## Technical Constraints & Safety

### File Hierarchy
- ✅ `dashboard.py`: UI and Scribe logic changes (Tab 2, Tab 4, Tab 5)
- ✅ `setup_parser.py`: Brand mapping completion and vision enhancements
- ✅ `mcp_server.py`: Wake-word deprecation (backwards compatible)
- ✅ `email_service.py`: No changes required (already production-ready)

### Data Integrity
- ✅ All extracted values map 1:1 to 24-parameter schema
- ✅ CSV column: `Keywords` (optional) added to `track_logs`
- ✅ PostgreSQL migration NOT required (column handled in CSV fallback)

### Backwards Compatibility
- ✅ Existing sessions not affected
- ✅ MCP server API remains functional (wake-word check simply removed)
- ✅ CSV fallback mode maintained for local development

### Error Handling
- Vision parsing failures → User-friendly error messages
- PDF parsing failures → Automatic fallback to vision suggestion
- Email failures → Mock mode logs (no crash)

---

## Testing Strategy

### Unit Tests
1. **Keyword Detection**:
   - Test with transcript: "Car was bottoming in the whoops, felt loose on exit"
   - Expected: Detects "Bottoming" (critical), "Loose" (performance), "Exit" (track_features)

2. **Brand PDF Parsing**:
   - Test Tekno PDF (existing) → Should still work
   - Test Associated PDF → Verify new mapping extracts correct values
   - Test invalid PDF → Should return None and suggest vision upload

3. **Vision Parsing**:
   - Test clear photo → Should extract 15+ parameters
   - Test blurry photo → Should handle gracefully with error message

### Integration Tests
1. **Tab 2 Workflow**:
   - Record voice note with keywords → Should highlight in UI
   - Check CSV log → Keywords column populated

2. **Tab 5 Workflow**:
   - Upload Tekno PDF → Parse → Save to library
   - Upload Associated PDF → Parse → Load to Digital Twin
   - Upload setup photo → Vision parse → Display extracted params

3. **Tab 4 Workflow**:
   - Enable auto-email toggle
   - Complete X-Factor audit
   - Verify email sent (check console for mock mode output)

### Success Criteria
- ✅ No wake words needed - all technical keywords auto-detected
- ✅ 4 brands parse successfully from PDF (Tekno, Associated, Mugen, Xray)
- ✅ Vision parsing works on clear photos (80%+ parameter extraction)
- ✅ Auto-email toggle visible and functional
- ✅ No crashes or data loss
- ✅ CSV fallback mode remains operational

---

## Deployment Checklist

### Pre-Implementation
- [ ] Read all affected files completely
- [ ] Verify current `dashboard.py` line numbers match plan
- [ ] Backup current `car_configs.csv` and `track_logs.csv`
- [ ] Verify Anthropic API key is active (for vision parsing)

### Implementation Order
1. **Phase 1**: Optimized Scribe (Tab 2) - Lowest risk, highest user impact
2. **Phase 2**: Automated Reporting (Tab 4) - Already 90% done, quick win
3. **Phase 3**: Hybrid Parsing Engine (Tab 5) - Requires PDF template verification

### Post-Implementation
- [ ] Update version in `dashboard.py` line 34: `v1.7.0 - Intelligence Layer`
- [ ] Update `change_log.md` with v1.7.0 entry
- [ ] Update `Roadmap.md` Phase 3.2 and 4.1 checkboxes
- [ ] Test all 5 tabs end-to-end
- [ ] Deploy to Railway (automatic via git push)

### Documentation Updates
- [ ] `CLAUDE.md`: Update version to v1.7.0, add new features
- [ ] `README.md` (if exists): Update feature list
- [ ] Add vision parsing examples to `Data/Setup_Templates/README.md`

---

## Known Limitations & Future Work

### v1.7.0 Scope Exclusions
- **Real-time speech processing**: Keywords detected after transcription (not during)
- **Multi-language support**: English only for keyword detection
- **PDF form field names**: Must be verified against actual templates (mappings are educated guesses)
- **Email attachments**: Text-only reports (PDF generation for email is v1.8.0+)

### Future Enhancements (v1.8.0+)
- Confidence scoring for vision-parsed parameters
- Multi-page PDF support (currently single-page only)
- Real-time keyword highlighting during voice recording
- Advanced email templates with HTML/CSS formatting
- Bulk import from photo gallery

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| PDF field names don't match brand templates | Medium | High | Requires manual verification with real PDFs before deployment |
| Vision parsing accuracy <80% | Low | Medium | Fallback to manual entry, improve prompt engineering |
| Keyword false positives (e.g., "loose screw") | Medium | Low | Context-aware NLP in future version, acceptable for v1.7.0 |
| Email spam complaints | Low | Medium | Toggle defaults to OFF, clear opt-in UI |
| Breaking existing sessions | Low | High | Comprehensive backwards compatibility testing |

---

## Approval & Sign-Off

**Ready for Implementation**: YES
**Blocking Issues**: None
**Requirements Clarifications Needed**:
1. ⚠️ **CRITICAL**: Need actual PDF templates from `Data/Setup_Templates/` to verify Associated/Mugen/Xray field names
2. ✅ Email infrastructure already deployed (mock mode ready)
3. ✅ Vision API confirmed available (Anthropic multimodal)

**Recommended Implementation Sequence**:
1. Start with Tab 2 (Scribe) - Most straightforward, immediate UX improvement
2. Then Tab 4 (Reporting) - Already 90% implemented, just needs UI polish
3. Finally Tab 5 (Parsing) - Requires PDF template verification, can be staged (Tekno→Associated→Mugen→Xray)

---

**Plan Status**: READY FOR EXECUTION
**Next Step**: User approval → Begin implementation with TodoWrite tracking
