"""A.P.E.X. ORP Service - Optimal Race Pace Engine
Phase 5: Calculates consistency metrics and ORP scores from lap data.

The ORP Engine prioritizes consistency (Std Dev) over raw speed.
- Consistency: Measured by standard deviation of lap times
- Fade: Measures pace degradation (Avg Last 5 / Avg Top 3)
- ORP Score: 0-100 scale penalizing variance
"""

import logging
from statistics import mean, stdev

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("apex.orp_service")


class ORPService:
    """Optimal Race Pace calculations for consistency analysis."""

    # ORP Score thresholds for strategy decisions
    AVANT_GARDE_THRESHOLD = 85  # ORP > 85: Allow risky changes
    STABILITY_THRESHOLD = 70     # ORP < 70: Focus on stability

    def __init__(self):
        """Initialize ORP Service."""
        pass

    @staticmethod
    def calculate_consistency(laps: list[float]) -> dict[str, float]:
        """Calculate lap consistency metrics.

        Args:
            laps: List of lap times in seconds (e.g., [58.2, 58.1, 62.5, 59.0, 57.8])

        Returns:
            Dict with:
            - std_dev: Standard deviation of lap times
            - consistency_pct: 100 minus coefficient of variation (lower variance = higher %)
            - best_lap: Fastest lap
            - worst_lap: Slowest lap
            - avg_lap: Average lap time

        """
        if not laps or len(laps) < 2:
            return {
                "std_dev": 0.0,
                "consistency_pct": 0.0,
                "best_lap": laps[0] if laps else 0.0,
                "worst_lap": laps[0] if laps else 0.0,
                "avg_lap": laps[0] if laps else 0.0,
                "lap_count": len(laps),
            }

        avg_lap = mean(laps)
        std_dev = stdev(laps)
        best_lap = min(laps)
        worst_lap = max(laps)

        # Coefficient of Variation (CV) = Std Dev / Mean
        # Consistency = 100 - (CV * 100), capped at 0-100
        cv = (std_dev / avg_lap) * 100 if avg_lap > 0 else 0
        consistency_pct = max(0, min(100, 100 - cv))

        return {
            "std_dev": round(std_dev, 4),
            "consistency_pct": round(consistency_pct, 2),
            "best_lap": round(best_lap, 3),
            "worst_lap": round(worst_lap, 3),
            "avg_lap": round(avg_lap, 3),
            "lap_count": len(laps),
        }

    @staticmethod
    def calculate_fade(laps: list[float]) -> dict[str, float]:
        """Calculate fade factor (pace degradation).
        Fade = Avg Last 5 / Avg Top 3
        - Fade > 1.0 = Degrading (Getting slower)
        - Fade < 1.0 = Improving (Getting faster)
        - Fade = 1.0 = Steady.

        Args:
            laps: List of lap times in seconds

        Returns:
            Dict with:
            - fade_factor: Ratio of last 5 average / top 3 average
            - last_5_avg: Average of last 5 laps
            - top_3_avg: Average of 3 fastest laps
            - fade_pct: Percentage slower (positive = slower, negative = faster)

        """
        if not laps or len(laps) < 3:
            return {
                "fade_factor": 1.0,
                "last_5_avg": 0.0,
                "top_3_avg": 0.0,
                "fade_pct": 0.0,
                "warning": "Insufficient laps for fade calculation",
            }

        # Top 3 = 3 fastest laps
        top_3_laps = sorted(laps)[:3]
        top_3_avg = mean(top_3_laps)

        # Last 5 = most recent 5 laps
        last_5_laps = laps[-5:] if len(laps) >= 5 else laps
        last_5_avg = mean(last_5_laps)

        fade_factor = last_5_avg / top_3_avg if top_3_avg > 0 else 1.0
        fade_pct = ((last_5_avg - top_3_avg) / top_3_avg * 100) if top_3_avg > 0 else 0

        return {
            "fade_factor": round(fade_factor, 4),
            "last_5_avg": round(last_5_avg, 3),
            "top_3_avg": round(top_3_avg, 3),
            "fade_pct": round(fade_pct, 2),
            "last_5_count": len(last_5_laps),
            "interpretation": "degrading" if fade_factor > 1.01 else ("improving" if fade_factor < 0.99 else "steady"),
        }

    @staticmethod
    def calculate_orp_score(
        laps: list[float],
        experience_level: str = "Intermediate",
        driver_confidence: int = 3,
    ) -> dict[str, any]:
        """Calculate ORP Score (0-100).

        ORP = Base Score (consistency) + Adjustments
        - Base: 0-100 from consistency
        - Adjustment: Fade factor (penalize if degrading)
        - Adjustment: Driver confidence gate (score = 0 if confidence < 3)

        Args:
            laps: List of lap times
            experience_level: "Sportsman", "Intermediate", or "Pro"
            driver_confidence: 1-5 rating (from X-Factor audit)

        Returns:
            Dict with ORP score, component breakdown, strategy recommendation

        """
        if not laps or len(laps) < 2:
            return {
                "orp_score": 0,
                "status": "invalid",
                "message": "Insufficient lap data",
            }

        # Confidence gate: < 3 = reject setup
        if driver_confidence < 3:
            return {
                "orp_score": 0,
                "status": "rejected",
                "reason": f"Driver confidence {driver_confidence}/5 below threshold (3)",
                "components": {
                    "consistency_score": 0,
                    "fade_penalty": 0,
                    "confidence_gate": "FAILED",
                },
            }

        # Calculate base metrics
        consistency = ORPService.calculate_consistency(laps)
        fade = ORPService.calculate_fade(laps)

        # Base score from consistency (0-100)
        consistency_score = consistency["consistency_pct"]

        # Fade penalty: If fading > 1.5%, reduce score proportionally
        fade_penalty = 0
        if fade["fade_factor"] > 1.01:
            # Each 1% fade = 2 point penalty (max -20 for 10% fade)
            fade_pct = fade["fade_pct"]
            fade_penalty = min(20, (fade_pct * 2))

        # Base ORP score
        orp_score = max(0, consistency_score - fade_penalty)

        # Experience-level bias (informational, doesn't change score)
        bias_profile = {
            "Sportsman": {"consistency_weight": 0.8, "speed_weight": 0.2},
            "Intermediate": {"consistency_weight": 0.5, "speed_weight": 0.5},
            "Pro": {"consistency_weight": 0.3, "speed_weight": 0.7},
        }
        bias = bias_profile.get(experience_level, bias_profile["Intermediate"])

        # Strategy recommendation
        if orp_score >= ORPService.AVANT_GARDE_THRESHOLD:
            strategy = "avant_garde"
            recommendation = "Setup is locked in. High confidence for experimental changes."
        elif orp_score >= ORPService.STABILITY_THRESHOLD:
            strategy = "balanced"
            recommendation = "Setup is competitive. Focus on minor tweaks."
        else:
            strategy = "stability"
            recommendation = "Setup needs work. Focus on consistency before trying new ideas."

        return {
            "orp_score": round(orp_score, 1),
            "status": "valid",
            "strategy": strategy,
            "recommendation": recommendation,
            "components": {
                "consistency_score": round(consistency_score, 1),
                "fade_penalty": round(fade_penalty, 1),
                "confidence_gate": "PASSED",
                "driver_confidence": driver_confidence,
            },
            "experience_level": experience_level,
            "bias_profile": bias,
            "metrics": {
                "consistency": consistency,
                "fade": fade,
            },
        }

    @staticmethod
    def get_strategy_for_scenario(
        experience_level: str,
        practice_rounds: int,
        qualifying_rounds: int,
    ) -> dict[str, any]:
        """Determine strategy scenario based on event structure.

        Scenario A: Unlimited practice → Avant Garde allowed (experimental changes OK)
        Scenario B: Limited practice → Tune, Don't Pivot (only safe tweaks)

        Args:
            experience_level: "Sportsman", "Intermediate", or "Pro"
            practice_rounds: Number of practice sessions (0 = limited)
            qualifying_rounds: Number of qualifying sessions

        Returns:
            Dict with scenario, allowed parameters, recommendations

        """
        if practice_rounds >= 3:
            scenario = "A"
            discovery_mode = "avant_garde"
            description = "Unlimited Practice - Experimental changes encouraged"
            allowed_parameters = [
                "pistons",  # Avant Garde
                "geometry",  # Avant Garde
                "arm_positions",  # Avant Garde
                "oils",  # Safe
                "ride_height",  # Safe
                "camber",  # Safe
            ]
        else:
            scenario = "B"
            discovery_mode = "tune_dont_pivot"
            description = "Limited Practice - Conservative approach"
            allowed_parameters = [
                "oils",  # Safe
                "ride_height",  # Safe
                "camber",  # Safe
            ]

        discovery_window = {
            "scenario": scenario,
            "mode": discovery_mode,
            "description": description,
            "practice_rounds": practice_rounds,
            "qualifying_rounds": qualifying_rounds,
            "allowed_parameters": allowed_parameters,
            "recommended_focus": (
                "Experiment with setup combinations" if scenario == "A"
                else "Fine-tune current setup"
            ),
        }

        return discovery_window


# Singleton instance for easy access
_orp_service = None


def get_orp_service() -> ORPService:
    """Get or create ORP Service singleton."""
    global _orp_service
    if _orp_service is None:
        _orp_service = ORPService()
    return _orp_service
