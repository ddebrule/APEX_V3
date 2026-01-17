# Phase 5 Sprint 4: ORP Visualization & Dashboard Features - Plan

**Status:** Planning Phase
**Duration Estimate:** 4-6 hours
**Target Completion:** Early January 2026
**Prerequisite:** Phase 5 Sprint 3 Complete (✅ 31/31 tests passing, AI advisor fully integrated)

---

## Objective

Add data visualization layer to ORP system so that:
- Users see performance window (best lap + consistency range)
- Users see fade indicator (pace degradation over session)
- ORP score is color-coded (green/yellow/red)
- Visualizations integrate seamlessly into Tab 2 advisor
- Charts update dynamically with new lap data

---

## Current State

### What We Have
- ✅ ORP metrics calculated (score, consistency, fade)
- ✅ ORP data displayed as 4-column metrics
- ✅ Confidence gate and scenario constraints enforced
- ✅ 79/79 tests passing

### What's Missing
- ❌ Performance window chart (best lap + bands)
- ❌ Fade indicator visualization
- ❌ Color coding by ORP score
- ❌ Historical trend tracking
- ❌ Live lap time visualization

---

## Sprint 4 Implementation Tasks

### Task 1: Performance Window Chart (1.5-2 hours)

**Concept:**
A Plotly line chart showing:
- X-axis: Lap number (1, 2, 3, ...)
- Y-axis: Lap time (seconds)
- Best lap line (horizontal)
- Consistency bands (±2-3% of best lap)
- Color by confidence (green if confident, red if low)

**Data Requirements:**
```python
# From run_logs_service.get_session_laps()
lap_times = [58.1, 58.3, 58.0, 57.9, 58.2, 58.4, 58.1, ...]

# From ORP metrics
best_lap = min(lap_times)
consistency = orp_context.get('consistency', 0)  # Std dev %

# Calculated
upper_band = best_lap * (1 + consistency / 100)
lower_band = best_lap * (1 - consistency / 100)
```

**Plotly Implementation:**
```python
import plotly.graph_objects as go

def create_performance_window_chart(lap_times, best_lap, consistency):
    """
    Create performance window visualization.

    Args:
        lap_times: List of lap times [58.1, 58.3, ...]
        best_lap: Best lap time (float)
        consistency: Std dev percentage (float)

    Returns:
        Plotly Figure
    """
    # Create data
    lap_numbers = list(range(1, len(lap_times) + 1))

    # Calculate bands
    upper_band = best_lap * (1 + consistency / 100)
    lower_band = best_lap * (1 - consistency / 100)

    # Create figure
    fig = go.Figure()

    # Add lap times line
    fig.add_trace(go.Scatter(
        x=lap_numbers,
        y=lap_times,
        mode='lines+markers',
        name='Lap Times',
        line=dict(color='blue', width=2),
        marker=dict(size=6)
    ))

    # Add best lap line
    fig.add_hline(
        y=best_lap,
        line_dash="dash",
        line_color="green",
        annotation_text=f"Best: {best_lap:.2f}s"
    )

    # Add consistency bands
    fig.add_trace(go.Scatter(
        x=lap_numbers,
        y=[upper_band] * len(lap_numbers),
        mode='lines',
        name='Upper Band',
        line=dict(color='rgba(255,0,0,0)', width=0),
        showlegend=False
    ))

    fig.add_trace(go.Scatter(
        x=lap_numbers,
        y=[lower_band] * len(lap_numbers),
        mode='lines',
        name='Lower Band',
        line=dict(color='rgba(255,0,0,0)', width=0),
        fill='tonexty',
        fillcolor='rgba(0,255,0,0.2)',
        showlegend=False
    ))

    # Layout
    fig.update_layout(
        title=f"Performance Window (±{consistency:.1f}%)",
        xaxis_title="Lap Number",
        yaxis_title="Lap Time (seconds)",
        hovermode='x unified',
        height=400
    )

    return fig
```

**Location in Dashboard:**
- Tab 2, after ORP metrics display
- Before pending changes section
- Responsive width

---

### Task 2: Fade Indicator Visualization (1-1.5 hours)

**Concept:**
A gauge or bar chart showing:
- Current fade factor (1.0 = stable, <1.0 = improving, >1.0 = degrading)
- Visual interpretation (green/yellow/red)
- Trend arrow (up/down/stable)

**Data Requirements:**
```python
# From ORP metrics
fade_factor = orp_context.get('fade', 1.0)

# Interpretation
if fade_factor < 1.0:
    status = "Improving"
    color = "green"
elif fade_factor <= 1.05:
    status = "Stable"
    color = "green"
elif fade_factor <= 1.10:
    status = "Degrading (slight)"
    color = "yellow"
else:
    status = "Degrading (critical)"
    color = "red"
```

**Plotly Implementation (Gauge):**
```python
def create_fade_indicator(fade_factor):
    """
    Create fade factor gauge visualization.

    Args:
        fade_factor: Fade ratio (1.0 = stable, >1.0 = degrading)

    Returns:
        Plotly Figure (gauge chart)
    """
    # Determine color and status
    if fade_factor < 1.0:
        status = "Improving"
        color = "green"
    elif fade_factor <= 1.05:
        status = "Stable"
        color = "lightgreen"
    elif fade_factor <= 1.10:
        status = "Degrading (slight)"
        color = "yellow"
    else:
        status = "Degrading (critical)"
        color = "red"

    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=fade_factor,
        title={'text': "Fade Factor"},
        delta={'reference': 1.0, 'decreasing': {'color': 'green'}},
        gauge={
            'axis': {'range': [0.8, 1.3]},
            'bar': {'color': color},
            'steps': [
                {'range': [0.8, 1.0], 'color': "rgba(0, 255, 0, 0.2)"},
                {'range': [1.0, 1.05], 'color': "rgba(144, 238, 144, 0.2)"},
                {'range': [1.05, 1.10], 'color': "rgba(255, 255, 0, 0.2)"},
                {'range': [1.10, 1.3], 'color': "rgba(255, 0, 0, 0.2)"}
            ],
            'threshold': {
                'line': {'color': 'black', 'width': 2},
                'thickness': 0.75,
                'value': 1.0
            }
        }
    ))

    fig.update_layout(height=300)
    return fig, status
```

**Alternative: Bar Chart**
```python
def create_fade_bar_chart(fade_factor):
    """Simple bar showing fade status"""
    statuses = ['Improving\n(<1.0)', 'Stable\n(~1.0)', 'Degrading\n(1.05-1.10)', 'Critical\n(>1.10)']
    values = [0.95, 1.0, 1.075, 1.15]
    colors = ['green', 'lightgreen', 'yellow', 'red']

    fig = go.Figure(data=[
        go.Bar(
            x=statuses,
            y=values,
            marker_color=colors,
            name='Status Range'
        ),
        go.Scatter(
            x=[2 if fade_factor >= 1.05 else 1],  # Position on chart
            y=[fade_factor],
            mode='markers',
            marker=dict(size=15, color='black'),
            name='Current'
        )
    ])

    return fig
```

**Location in Dashboard:**
- Tab 2, next to performance window
- Two-column layout
- Height: 300px

---

### Task 3: ORP Score Color Coding (1 hour)

**Concept:**
Apply color to ORP metrics display based on score:
- Green: 70-100 (optimized)
- Yellow: 40-70 (balanced)
- Red: 0-40 (inconsistent)

**Implementation:**
```python
def get_orp_color(orp_score):
    """Return color based on ORP score"""
    if orp_score >= 70:
        return "green"
    elif orp_score >= 40:
        return "orange"
    else:
        return "red"

def get_orp_description(orp_score):
    """Return interpretation of ORP score"""
    if orp_score >= 70:
        return "Setup optimized - fine-tune only"
    elif orp_score >= 40:
        return "Setup balanced - targeted adjustments"
    else:
        return "Setup inconsistent - stability focus"
```

**In Dashboard:**
```python
orp_score = orp_context.get('orp_score', 50)
color = get_orp_color(orp_score)
desc = get_orp_description(orp_score)

# Metric with color
st.metric(
    "ORP Score",
    f"{orp_score:.1f}",
    delta=f"{orp_context.get('consistency', 0):.1f}% consistency"
)

# Add background color using markdown
if color == 'green':
    st.success(desc)
elif color == 'orange':
    st.warning(desc)
else:
    st.error(desc)
```

**Location:**
- Tab 2, in the 4-column ORP metrics section
- Color behind score value
- Description below

---

### Task 4: Lap Time Trend Chart (1 hour)

**Concept:**
Plotly line chart showing lap time trend over time:
- X: Lap number
- Y: Lap time
- Color: Based on confidence level
- Show best lap horizontal line

**Data Requirements:**
```python
# From dashboard
lap_times = [58.1, 58.3, 58.0, 57.9, 58.2, ...]
best_lap = min(lap_times)
confidence = st.session_state.get('confidence_rating', 3)

# Color by confidence
if confidence >= 4:
    line_color = 'green'
elif confidence >= 3:
    line_color = 'blue'
else:
    line_color = 'red'
```

**Implementation:**
```python
def create_lap_trend_chart(lap_times, best_lap, confidence):
    """Create lap time trend visualization"""
    lap_numbers = list(range(1, len(lap_times) + 1))

    # Determine color by confidence
    if confidence >= 4:
        line_color = 'green'
    elif confidence >= 3:
        line_color = 'blue'
    else:
        line_color = 'red'

    fig = px.line(
        x=lap_numbers,
        y=lap_times,
        title=f"Lap Time Trend (Confidence: {confidence}/5)",
        labels={'x': 'Lap Number', 'y': 'Lap Time (s)'},
        markers=True
    )

    fig.update_traces(line_color=line_color)

    # Add best lap line
    fig.add_hline(
        y=best_lap,
        line_dash="dash",
        line_color="green",
        annotation_text=f"Best: {best_lap:.2f}s",
        annotation_position="right"
    )

    fig.update_layout(height=350, hovermode='x unified')
    return fig
```

**Location in Dashboard:**
- Tab 2, full width section
- Below performance window
- Dynamic based on available lap data

---

### Task 5: Dashboard Integration (1.5 hours)

**Tab 2 Layout (New Structure):**
```
┌─────────────────────────────────────────────────────────┐
│  ORP METRICS (4 columns)                                │
│  Score | Status | Fade | Confidence Gate               │
├─────────────────────────────────────────────────────────┤
│  VISUALIZATIONS (2-column layout)                       │
│  ┌──────────────────────┬──────────────────────┐       │
│  │ Performance Window   │ Fade Indicator       │       │
│  │ (Lap times + bands) │ (Gauge chart)        │       │
│  └──────────────────────┴──────────────────────┘       │
├─────────────────────────────────────────────────────────┤
│  LAP TIME TREND (full width)                            │
│  (Line chart showing trend over session)               │
├─────────────────────────────────────────────────────────┤
│  PENDING AI RECOMMENDATIONS                             │
│  (With confidence gate + scenario constraints)          │
└─────────────────────────────────────────────────────────┘
```

**Code Structure:**
```python
# In Tab 2, after ORP metrics display

st.divider()
st.subheader("📊 ORP Visualization")

# 2-column layout for performance window + fade
col_viz1, col_viz2 = st.columns(2)

with col_viz1:
    st.write("### Performance Window")
    if lap_times:
        fig_perf = create_performance_window_chart(
            lap_times, best_lap, consistency
        )
        st.plotly_chart(fig_perf, use_container_width=True)

with col_viz2:
    st.write("### Fade Indicator")
    if lap_times:
        fig_fade, status = create_fade_indicator(fade_factor)
        st.plotly_chart(fig_fade, use_container_width=True)
        st.caption(f"Status: {status}")

# Full-width lap time trend
st.write("### Lap Time Trend")
if lap_times:
    fig_trend = create_lap_trend_chart(lap_times, best_lap, confidence)
    st.plotly_chart(fig_trend, use_container_width=True)
```

---

### Task 6: Testing & Refinement (0.5-1 hour)

**Test Coverage:**
- Color coding logic (green/yellow/red)
- Chart generation with various ORP scores
- Empty data handling (no laps yet)
- Responsiveness (mobile/desktop)
- Performance (large datasets)

**Test File:** `tests/test_sprint4_orp_visualizations.py`
```python
def test_orp_color_coding():
    """Test color based on ORP score"""
    assert get_orp_color(85) == 'green'
    assert get_orp_color(55) == 'orange'
    assert get_orp_color(35) == 'red'

def test_performance_window_chart():
    """Test chart generation"""
    lap_times = [58.1, 58.0, 58.2, 57.9]
    fig = create_performance_window_chart(lap_times, 57.9, 5.0)
    assert fig is not None

def test_fade_indicator_improvement():
    """Fade <1.0 should show improving"""
    fig, status = create_fade_indicator(0.95)
    assert 'Improving' in status

def test_fade_indicator_degradation():
    """Fade >1.10 should show critical"""
    fig, status = create_fade_indicator(1.15)
    assert 'critical' in status.lower()
```

---

## Implementation Order

### Day 1 (2-3 hours)
1. Create visualization helper functions (colors, charts)
2. Implement performance window chart
3. Implement fade indicator
4. Add color coding logic

### Day 2 (1.5-2 hours)
1. Integrate visualizations into Tab 2
2. Implement lap time trend chart
3. Refine layout and styling
4. Test responsiveness

### Day 3 (1 hour)
1. Create comprehensive tests
2. Bug fixes and refinement
3. Final integration testing
4. Documentation and commits

---

## Success Criteria

✅ Performance window chart displays lap times + bands
✅ Fade indicator shows status (improving/stable/degrading)
✅ ORP score color-coded (green/yellow/red)
✅ Lap time trend visualization working
✅ All visualizations responsive (mobile-friendly)
✅ Charts update with new lap data
✅ Integration tests passing
✅ No performance degradation
✅ Charts render <500ms
✅ Tab 2 layout clean and intuitive

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Plotly performance with many laps | Low | Medium | Limit display to last 50 laps |
| Chart responsiveness issues | Low | Low | Test on mobile/desktop |
| Color accessibility | Low | Low | Use color + text labels |
| Empty data (no laps yet) | Medium | Low | Show placeholder message |

---

## Files to Create/Modify

| File | Changes | Effort |
|------|---------|--------|
| `Execution/dashboard.py` | Add visualization section to Tab 2 | 1.5h |
| `Execution/visualization_utils.py` | NEW: Helper functions for charts | 1h |
| `tests/test_sprint4_orp_visualizations.py` | NEW: Visualization tests | 0.5h |

**Total New Code:** ~300-400 lines

---

## Definition of Done

- [ ] Performance window chart implemented
- [ ] Fade indicator implemented
- [ ] ORP score color coding working
- [ ] Lap time trend chart implemented
- [ ] Dashboard Tab 2 integrated with visualizations
- [ ] Responsive layout (mobile/desktop)
- [ ] All tests passing
- [ ] Performance verified (<500ms render)
- [ ] Documentation complete
- [ ] Changes committed and pushed

---

## Next Steps (After Sprint 4)

**Future Enhancements:**
- Historical ORP trends (multi-session comparison)
- Setup change impact visualization
- Session statistics dashboard
- Export reports with charts
- Real-time lap monitoring

---

**Status: Ready to begin implementation**
**Last Updated:** 2025-12-28
**Target Completion:** Early January 2026
