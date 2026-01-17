"""Phase 5 Sprint 4: ORP Visualization Utilities.

Provides Plotly chart generation functions for:
- Performance window (best lap + consistency bands)
- Fade indicator (gauge showing pace degradation)
- ORP score interpretation
- Lap time trends

All functions accept ORP metrics and return Plotly figures ready for Streamlit display.
"""


import plotly.express as px
import plotly.graph_objects as go


def get_orp_color(orp_score: float) -> str:
    """Get color representation for ORP score.

    Args:
        orp_score: ORP score (0-100)

    Returns:
        Color string ('green', 'orange', or 'red')

    """
    if orp_score >= 70:
        return 'green'
    elif orp_score >= 40:
        return 'orange'
    else:
        return 'red'


def get_orp_description(orp_score: float) -> str:
    """Get interpretation of ORP score.

    Args:
        orp_score: ORP score (0-100)

    Returns:
        Description string

    """
    if orp_score >= 70:
        return f"Setup optimized ({orp_score:.1f}) - fine-tune only"
    elif orp_score >= 40:
        return f"Setup balanced ({orp_score:.1f}) - targeted adjustments"
    else:
        return f"Setup inconsistent ({orp_score:.1f}) - stability focus"


def get_fade_status(fade_factor: float) -> tuple[str, str]:
    """Get status description and color for fade factor.

    Args:
        fade_factor: Fade ratio (1.0 = stable, <1.0 = improving, >1.0 = degrading)

    Returns:
        Tuple of (status_text, color)

    """
    if fade_factor < 1.0:
        return "Improving", "green"
    elif fade_factor <= 1.05:
        return "Stable", "lightgreen"
    elif fade_factor <= 1.10:
        return "Degrading (slight)", "yellow"
    else:
        return "Degrading (critical)", "red"


def create_performance_window_chart(
    lap_times: list[float],
    best_lap: float,
    consistency: float
) -> go.Figure:
    """Create performance window visualization.

    Shows lap times with best lap line and consistency bands.
    Consistency bands represent ±X% of best lap time.

    Args:
        lap_times: List of lap times in seconds
        best_lap: Best lap time (reference line)
        consistency: Consistency percentage (std dev)

    Returns:
        Plotly Figure object

    """
    if not lap_times:
        return go.Figure().add_annotation(text="No lap data available")

    lap_numbers = list(range(1, len(lap_times) + 1))

    # Calculate consistency bands
    upper_band = best_lap * (1 + consistency / 100)
    lower_band = best_lap * (1 - consistency / 100)

    # Create figure
    fig = go.Figure()

    # Add lap times line with markers
    fig.add_trace(go.Scatter(
        x=lap_numbers,
        y=lap_times,
        mode='lines+markers',
        name='Lap Times',
        line=dict(color='#1f77b4', width=2),
        marker=dict(size=6, color='#1f77b4'),
        hovertemplate='<b>Lap %{x}</b><br>Time: %{y:.3f}s<extra></extra>'
    ))

    # Add upper consistency band
    fig.add_trace(go.Scatter(
        x=lap_numbers,
        y=[upper_band] * len(lap_numbers),
        mode='lines',
        name='Upper Band',
        line=dict(color='rgba(255,0,0,0.3)', width=1, dash='dash'),
        hovertemplate='Upper: %{y:.3f}s<extra></extra>'
    ))

    # Add lower consistency band with fill
    fig.add_trace(go.Scatter(
        x=lap_numbers,
        y=[lower_band] * len(lap_numbers),
        mode='lines',
        name='Lower Band',
        line=dict(color='rgba(255,0,0,0.3)', width=1, dash='dash'),
        fill='tonexty',
        fillcolor='rgba(0, 200, 0, 0.15)',
        hovertemplate='Lower: %{y:.3f}s<extra></extra>'
    ))

    # Add best lap reference line
    fig.add_hline(
        y=best_lap,
        line_dash="dash",
        line_color="green",
        line_width=2,
        annotation_text=f"<b>Best: {best_lap:.3f}s</b>",
        annotation_position="right",
        annotation_font_color="green"
    )

    # Update layout
    fig.update_layout(
        title=f"<b>Performance Window</b> (±{consistency:.1f}%)",
        xaxis_title="Lap Number",
        yaxis_title="Lap Time (seconds)",
        hovermode='x unified',
        height=400,
        plot_bgcolor='rgba(240, 240, 240, 0.5)',
        paper_bgcolor='white',
        font=dict(size=11),
        margin=dict(l=50, r=50, t=50, b=50),
        showlegend=False
    )

    # Format y-axis to show 3 decimal places
    fig.update_yaxes(tickformat='.3f')

    return fig


def create_fade_indicator(fade_factor: float) -> go.Figure:
    """Create fade factor gauge visualization.

    Shows fade factor with color-coded regions:
    - <1.0: Green (improving)
    - ~1.0: Light green (stable)
    - 1.05-1.10: Yellow (degrading)
    - >1.10: Red (critical)

    Args:
        fade_factor: Fade ratio (1.0 = stable)

    Returns:
        Plotly Figure (gauge chart)

    """
    status, color = get_fade_status(fade_factor)

    # Create gauge
    fig = go.Figure(go.Indicator(
        mode="gauge+number+delta",
        value=fade_factor,
        title={'text': "<b>Fade Factor</b>", 'font': {'size': 16}},
        delta={'reference': 1.0, 'decreasing': {'color': 'green'}, 'suffix': ''},
        number={'font': {'size': 20}, 'valueformat': '.3f'},
        gauge={
            'axis': {'range': [0.8, 1.3], 'tickformat': '.2f'},
            'bar': {'color': color, 'thickness': 0.7},
            'steps': [
                {'range': [0.8, 1.0], 'color': "rgba(0, 255, 0, 0.2)", 'name': 'Improving'},
                {'range': [1.0, 1.05], 'color': "rgba(144, 238, 144, 0.2)", 'name': 'Stable'},
                {'range': [1.05, 1.10], 'color': "rgba(255, 255, 0, 0.2)", 'name': 'Degrading'},
                {'range': [1.10, 1.3], 'color': "rgba(255, 0, 0, 0.2)", 'name': 'Critical'}
            ],
            'threshold': {
                'line': {'color': 'black', 'width': 3},
                'thickness': 0.75,
                'value': 1.0
            }
        }
    ))

    fig.update_layout(
        height=350,
        font=dict(size=12),
        margin=dict(l=50, r=50, t=80, b=50),
        paper_bgcolor='white'
    )

    return fig


def create_lap_trend_chart(
    lap_times: list[float],
    best_lap: float,
    confidence: int = 3
) -> go.Figure:
    """Create lap time trend visualization.

    Shows lap times as line chart, colored by confidence level.
    Includes best lap reference line.

    Args:
        lap_times: List of lap times
        best_lap: Best lap time (reference)
        confidence: Driver confidence 1-5

    Returns:
        Plotly Figure

    """
    if not lap_times:
        return go.Figure().add_annotation(text="No lap data available")

    lap_numbers = list(range(1, len(lap_times) + 1))

    # Determine color by confidence
    if confidence >= 4:
        line_color = '#00b300'  # Green
    elif confidence >= 3:
        line_color = '#1f77b4'  # Blue
    else:
        line_color = '#d62728'  # Red

    # Create figure
    fig = px.line(
        x=lap_numbers,
        y=lap_times,
        title=f"<b>Lap Time Trend</b> (Confidence: {confidence}/5)",
        labels={'x': 'Lap Number', 'y': 'Lap Time (seconds)'},
        markers=True
    )

    fig.update_traces(
        line_color=line_color,
        marker_size=5,
        marker_color=line_color,
        hovertemplate='<b>Lap %{x}</b><br>Time: %{y:.3f}s<extra></extra>'
    )

    # Add best lap reference line
    fig.add_hline(
        y=best_lap,
        line_dash="dash",
        line_color="green",
        line_width=2,
        annotation_text=f"<b>Best: {best_lap:.3f}s</b>",
        annotation_position="right",
        annotation_font_color="green"
    )

    # Update layout
    fig.update_layout(
        height=350,
        hovermode='x unified',
        plot_bgcolor='rgba(240, 240, 240, 0.5)',
        paper_bgcolor='white',
        font=dict(size=11),
        margin=dict(l=50, r=50, t=60, b=50),
        showlegend=False
    )

    # Format y-axis
    fig.update_yaxes(tickformat='.3f')

    return fig


def create_orp_score_gauge(orp_score: float) -> go.Figure:
    """Create ORP score gauge visualization.

    Color-coded gauge showing:
    - Green: 70-100 (optimized)
    - Yellow: 40-70 (balanced)
    - Red: 0-40 (inconsistent)

    Args:
        orp_score: ORP score (0-100)

    Returns:
        Plotly Figure (gauge)

    """
    color = get_orp_color(orp_score)
    get_orp_description(orp_score)

    # Map colors to RGB for gauge
    color_map = {
        'green': '#00b300',
        'orange': '#ff8c00',
        'red': '#d62728'
    }

    fig = go.Figure(go.Indicator(
        mode="gauge+number",
        value=orp_score,
        title={'text': "<b>ORP Score</b>", 'font': {'size': 16}},
        number={'font': {'size': 24}, 'valueformat': '.1f'},
        gauge={
            'axis': {'range': [0, 100], 'tickformat': '.0f'},
            'bar': {'color': color_map.get(color, '#1f77b4'), 'thickness': 0.7},
            'steps': [
                {'range': [0, 40], 'color': "rgba(255, 0, 0, 0.2)", 'name': 'Inconsistent'},
                {'range': [40, 70], 'color': "rgba(255, 255, 0, 0.2)", 'name': 'Balanced'},
                {'range': [70, 100], 'color': "rgba(0, 255, 0, 0.2)", 'name': 'Optimized'}
            ]
        }
    ))

    fig.update_layout(
        height=300,
        font=dict(size=12),
        margin=dict(l=50, r=50, t=80, b=50),
        paper_bgcolor='white'
    )

    return fig


def create_consistency_bar_chart(
    consistency: float,
    orp_score: float
) -> go.Figure:
    """Create consistency percentage bar chart.

    Shows consistency as percentage, lower is better.

    Args:
        consistency: Consistency percentage (std dev)
        orp_score: ORP score for context

    Returns:
        Plotly Figure (bar chart)

    """
    # Create categories based on consistency
    if consistency < 3:
        category = "Excellent"
        color = "green"
    elif consistency < 5:
        category = "Good"
        color = "lightgreen"
    elif consistency < 10:
        category = "Acceptable"
        color = "yellow"
    else:
        category = "Poor"
        color = "red"

    fig = go.Figure(go.Bar(
        x=[consistency],
        y=["Consistency %"],
        orientation='h',
        marker_color=color,
        text=f"{consistency:.1f}%",
        textposition='auto',
        hovertemplate='<b>Consistency</b><br>%{x:.1f}%<br>' + f'{category}<extra></extra>'
    ))

    fig.update_layout(
        title=f"<b>Consistency</b> ({category})",
        xaxis_title="Std Dev %",
        height=250,
        showlegend=False,
        margin=dict(l=100, r=50, t=50, b=50),
        xaxis=dict(range=[0, max(15, consistency + 2)])
    )

    return fig
