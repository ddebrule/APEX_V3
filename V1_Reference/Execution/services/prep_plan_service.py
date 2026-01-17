"""Prep Plan Service - Race Preparation Plan Generator for APEX
Compiles data and generates AI-powered race prep plans.

"Win the race before you arrive at the track"

This service orchestrates the creation of Race Prep Plans by:
1. Gathering historical intelligence from Institutional Memory
2. Compiling recommended setups from the Master Library
3. Generating AI-powered strategic content
4. Producing a printable PDF document
"""

import os
from datetime import datetime

import anthropic
from dotenv import load_dotenv

from Execution.ai import prompts
from Execution.ai.pdf_generator import generate_race_prep_plan
from Execution.database.database import db
from Execution.services.history_service import history_service
from Execution.services.library_service import library_service

load_dotenv()
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY")


class PrepPlanService:
    """Orchestrates the creation of Race Prep Plans.

    A Race Prep Plan is a strategic preparation document generated
    after event registration in Tab 1, containing:
    1. Strategic Overview - Goals and expectations
    2. Track Intelligence - What we know from history
    3. Recommended Starting Setup - Best baseline for conditions
    4. Mechanical Checklist - Pre-race maintenance items
    5. Parts & Consumables List - What to bring
    6. Practice Session Strategy - Session-by-session focus
    7. Contingency Notes - If-then scenarios
    """

    def __init__(self):
        self.use_database = db.is_connected

    def get_track_intelligence(self, track_name, vehicle_id=None, brand=None, model=None):
        """Gather all historical data about a specific track.

        Returns:
            Dict with track-specific knowledge

        """
        intelligence = {
            "previous_sessions": [],
            "best_lap_ever": None,
            "typical_conditions": {},
            "successful_setups": [],
            "common_issues": []
        }

        if not self.use_database:
            return intelligence

        # Get track history
        track_history = history_service.get_track_history(track_name, vehicle_id, limit=10)
        if track_history:
            intelligence["previous_sessions"] = track_history

            # Find best lap ever
            laps = [s.get('best_lap') for s in track_history if s.get('best_lap')]
            if laps:
                intelligence["best_lap_ever"] = min(laps)

            # Analyze typical conditions
            tractions = [s.get('traction') for s in track_history if s.get('traction')]
            surfaces = [s.get('surface_condition') for s in track_history if s.get('surface_condition')]

            if tractions:
                intelligence["typical_conditions"]["traction"] = max(set(tractions), key=tractions.count)
            if surfaces:
                intelligence["typical_conditions"]["surface"] = max(set(surfaces), key=surfaces.count)

        # Get successful setups from library
        if brand and model:
            library_results = library_service.search_baselines(track=track_name, brand=brand)
            if not library_results.empty:
                intelligence["successful_setups"] = library_results.head(3).to_dict('records')

        # Get symptom stats for common issues
        symptoms = history_service.get_symptom_category_stats(vehicle_id=vehicle_id, track_name=track_name)
        if symptoms:
            intelligence["common_issues"] = list(symptoms.keys())[:3]

        return intelligence

    def get_recommended_setup(self, track_name, conditions, brand, model):
        """Get the recommended starting setup for given conditions.

        Args:
            track_name: Track name
            conditions: Dict with traction, surface_type, surface_condition
            brand: Vehicle brand
            model: Vehicle model

        Returns:
            Dict with setup parameters and rationale

        """
        recommended = {
            "setup": {},
            "source": "Default baseline",
            "rationale": "No specific match found, using shop master baseline."
        }

        # Try to find a match in the library
        library_results = library_service.search_baselines(track=track_name, brand=brand)

        if not library_results.empty:
            # Use the most recent matching baseline
            best_match = library_results.iloc[0]
            recommended["setup"] = {col: best_match[col] for col in library_results.columns
                                   if col not in ['ID', 'Track', 'Brand', 'Vehicle', 'Condition', 'Date', 'Source']}
            recommended["source"] = f"Master Library: {best_match.get('Source', 'Community')}"
            recommended["rationale"] = f"Track-specific baseline from {best_match.get('Date', 'unknown date')}"

        elif self.use_database:
            # Try condition-based best setups
            traction = conditions.get('traction', 'Medium')
            surface = conditions.get('surface_condition', 'Smooth')

            best_setups = history_service.get_best_setups_for_conditions(
                traction, surface, brand, model, limit=1
            )

            if best_setups:
                setup = best_setups[0].get('actual_setup', {})
                # Flatten if nested
                if 'diffs' in setup:
                    flat_setup = {}
                    flat_setup.update({f"D{k[0].upper()}": v for k, v in setup.get('diffs', {}).items()})
                    for section in ['front', 'rear']:
                        prefix = 'F' if section == 'front' else 'R'
                        for k, v in setup.get(section, {}).items():
                            flat_setup[f"{k}_{prefix}".upper()] = v
                    flat_setup.update(setup.get('tires', {}))
                    flat_setup.update(setup.get('power', {}))
                    recommended["setup"] = flat_setup
                else:
                    recommended["setup"] = setup

                recommended["source"] = f"Institutional Memory: {best_setups[0].get('track_name')}"
                recommended["rationale"] = (f"Best performing setup in {traction} traction, {surface} conditions. "
                                           f"Achieved {best_setups[0].get('best_lap'):.3f}s best lap.")

        return recommended

    def get_mechanical_checklist(self, vehicle_brand=None):
        """Generate a pre-race mechanical checklist.

        Args:
            vehicle_brand: Vehicle brand for brand-specific items

        Returns:
            List of maintenance items

        """
        # Universal checklist items
        checklist = [
            "Rebuild front and rear shocks (fresh oil, new O-rings if needed)",
            "Check/rebuild differentials if over 3 hours run time",
            "Inspect all turnbuckles for bending or damage",
            "Verify clutch shoes and springs condition",
            "Check all body mount screws and wing mount",
            "Inspect servo horn and steering linkage for play",
            "Verify receiver battery voltage and connections",
            "Check motor temp sensor (if equipped)",
            "Inspect wheel hexes and axle pins",
            "Verify radio range and failsafe settings"
        ]

        # Brand-specific additions
        if vehicle_brand == "Tekno":
            checklist.extend([
                "Check Tekno hinge pin bushings for wear",
                "Verify clutch bell bearings"
            ])
        elif vehicle_brand == "Associated":
            checklist.extend([
                "Check Associated shock bladders",
                "Verify diff outdrives"
            ])

        return checklist

    def get_parts_list(self, conditions, vehicle_brand=None):
        """Generate a list of parts and consumables to bring.

        Args:
            conditions: Dict with expected conditions
            vehicle_brand: Vehicle brand

        Returns:
            List of parts/consumables

        """
        traction = conditions.get('traction', 'Medium')
        surface_type = conditions.get('surface_type', 'Dry')
        surface_condition = conditions.get('surface_condition', 'Smooth')

        parts = []

        # Tire recommendations based on conditions
        if traction == "High":
            parts.append("Green compound tires (primary) - 4+ sets")
            parts.append("Aqua compound tires (backup if too sticky) - 2 sets")
        elif traction == "Low":
            parts.append("Blue compound tires (primary) - 4+ sets")
            parts.append("Green compound tires (backup) - 2 sets")
        else:
            parts.append("Green compound tires (primary) - 4+ sets")
            parts.append("Blue compound tires (for morning sessions) - 2 sets")

        # Shock oils
        parts.extend([
            "Shock oil range: 300-500cst front, 350-550cst rear",
            "Diff oil: 5k-10k for conditions"
        ])

        # Condition-specific parts
        if surface_condition in ["Bumpy", "Rutted"]:
            parts.append("Extra shock shafts (bending risk)")
            parts.append("Softer springs for compliance")

        if surface_type == "Wet" or surface_type == "Muddy":
            parts.append("Sealed receiver box if not standard")
            parts.append("Extra air filters")

        # Universal spares
        parts.extend([
            "Spare wing and wing buttons",
            "Extra wheel nuts and axle pins",
            "Turnbuckles (various lengths)",
            "Servo horn and steering linkage spares",
            "Body clip assortment"
        ])

        # Consumables
        parts.extend([
            "Fuel (1-2 gallons depending on event length)",
            "Air filter oil",
            "Thread lock (blue)",
            "Cleaning supplies (denatured alcohol, brushes)"
        ])

        return parts

    def get_practice_strategy(self, event_type="Race"):
        """Generate a practice session strategy.

        Args:
            event_type: Type of event (Race, Practice, Club Race)

        Returns:
            List of practice session focus areas

        """
        if event_type == "Practice":
            return [
                "Session 1: Baseline verification - confirm car feels familiar",
                "Session 2: Test any new components or settings",
                "Session 3: Push pace, identify weak areas",
                "Session 4: Fine-tuning based on observations"
            ]
        else:  # Race
            return [
                "Practice 1: Track familiarization, baseline verification - easy laps",
                "Practice 2: Tire compound evaluation - compare options",
                "Practice 3: Primary tuning session - address biggest handling issues",
                "Practice 4 (if available): Race simulation - push pace, check consistency",
                "Final practice: Light tuning only, confirm setup before qualifying"
            ]

    def generate_contingencies(self, expected_conditions):
        """Generate contingency plans for condition changes.

        Args:
            expected_conditions: Dict with expected traction, surface_type, etc.

        Returns:
            List of dicts with 'condition' and 'action' keys

        """
        contingencies = []
        expected_traction = expected_conditions.get('traction', 'Medium')
        expected_surface = expected_conditions.get('surface_type', 'Dry')

        # Traction changes
        if expected_traction == "Low":
            contingencies.append({
                "condition": "Traction is higher than expected (track gripped up)",
                "action": "Switch to softer compound (Green/Aqua), soften front springs, reduce front camber"
            })
        elif expected_traction == "High":
            contingencies.append({
                "condition": "Traction is lower than expected (dusty/slippery)",
                "action": "Switch to harder compound (Blue), stiffen front springs, add front camber"
            })
        else:
            contingencies.append({
                "condition": "Traction changes significantly during the day",
                "action": "Morning: harder compound, stiffer springs. Afternoon: softer compound, more damping"
            })

        # Weather changes
        if expected_surface == "Dry":
            contingencies.append({
                "condition": "Rain or unexpected moisture",
                "action": "Add 500cst to front diff, soften front bar, switch to aqua compound if available"
            })
        elif expected_surface in ["Wet", "Muddy"]:
            contingencies.append({
                "condition": "Track dries out faster than expected",
                "action": "Stiffen springs, add damping, monitor for tire ballooning"
            })

        # Surface condition changes
        contingencies.append({
            "condition": "Track becomes rutted or rough",
            "action": "Raise ride height +1mm, soften shock oil 50cst, reduce droop"
        })

        contingencies.append({
            "condition": "Car feels unpredictable or inconsistent",
            "action": "Return to baseline, verify nothing is broken, simplify changes"
        })

        return contingencies

    def generate_ai_content(self, profile, track_context, historical_memory, vehicle_info):
        """Use AI to generate strategic content for the prep plan.

        Returns:
            Dict with AI-generated sections

        """
        if not ANTHROPIC_KEY:
            return {
                "strategic_overview": "AI content unavailable - API key missing.",
                "track_intelligence": "Historical data analysis unavailable."
            }

        try:
            client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)

            prompt = prompts.get_prep_plan_prompt(profile, track_context, historical_memory, vehicle_info)

            response = client.messages.create(
                model="claude-sonnet-4-5",
                max_tokens=2000,
                temperature=0.5,
                system=prompts.SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}]
            )

            # Parse the AI response
            content = response.content[0].text

            # Try to extract sections (AI should format with headers)
            sections = {
                "strategic_overview": "",
                "track_intelligence": ""
            }

            # Simple parsing - AI should use ## headers
            current_section = None
            lines = content.split('\n')

            for line in lines:
                if "Strategic Overview" in line or "Goals" in line:
                    current_section = "strategic_overview"
                elif "Track Intelligence" in line or "Track History" in line:
                    current_section = "track_intelligence"
                elif current_section:
                    sections[current_section] += line + "\n"

            # If parsing failed, use the whole content
            if not sections["strategic_overview"]:
                sections["strategic_overview"] = content[:1000]
            if not sections["track_intelligence"]:
                sections["track_intelligence"] = "See Strategic Overview for track analysis."

            return sections

        except Exception as e:
            print(f"Error generating AI content: {e}")
            return {
                "strategic_overview": f"AI content generation failed: {e}",
                "track_intelligence": "Historical data analysis unavailable."
            }

    def generate_full_plan(self, racer_profile, track_context, vehicle_info):
        """Generate a complete Race Prep Plan.

        Args:
            racer_profile: Dict with racer info (name, etc.)
            track_context: Dict with track/event info from Tab 1
            vehicle_info: Dict with brand, model

        Returns:
            bytes - PDF file content

        """
        track_name = track_context.get('track_name', 'Unknown Track')
        event_name = track_context.get('event_name', 'Race Event')
        event_date = track_context.get('session_date', datetime.now().strftime('%Y-%m-%d'))
        conditions = {
            'traction': track_context.get('traction', 'Medium'),
            'surface_type': track_context.get('surface_type', 'Dry'),
            'surface_condition': track_context.get('surface_condition', 'Smooth')
        }

        # Gather data
        track_intel = self.get_track_intelligence(
            track_name,
            vehicle_id=None,  # TODO: Get from session
            brand=vehicle_info.get('brand'),
            model=vehicle_info.get('model')
        )

        recommended = self.get_recommended_setup(
            track_name,
            conditions,
            vehicle_info.get('brand'),
            vehicle_info.get('model')
        )

        # Build historical memory for AI
        if self.use_database:
            historical_memory = history_service.build_context_for_ai(
                track_name=track_name,
                traction=conditions['traction'],
                surface_type=conditions['surface_type'],
                surface_condition=conditions['surface_condition'],
                vehicle_id=None,
                brand=vehicle_info.get('brand'),
                model=vehicle_info.get('model')
            )
        else:
            historical_memory = "<historical_memory>No database connected.</historical_memory>"

        # Generate AI content
        ai_content = self.generate_ai_content(
            racer_profile,
            track_context,
            historical_memory,
            vehicle_info
        )

        # Build track intelligence text
        track_intel_text = ai_content.get('track_intelligence', '')
        if track_intel.get('best_lap_ever'):
            track_intel_text += f"\n\nBest lap at this track: {track_intel['best_lap_ever']:.3f}s"
        if track_intel.get('common_issues'):
            track_intel_text += f"\n\nCommon issues at this track: {', '.join(track_intel['common_issues'])}"

        # Generate PDF
        pdf_bytes = generate_race_prep_plan(
            racer_name=racer_profile.get('name', 'Unknown Racer'),
            event_name=event_name,
            track_name=track_name,
            event_date=event_date,
            vehicle_info=vehicle_info,
            strategic_overview=ai_content.get('strategic_overview', 'No strategic analysis available.'),
            track_intelligence=track_intel_text or 'No prior track data available.',
            recommended_setup=recommended.get('setup', {}),
            mechanical_checklist=self.get_mechanical_checklist(vehicle_info.get('brand')),
            parts_list=self.get_parts_list(conditions, vehicle_info.get('brand')),
            practice_strategy=self.get_practice_strategy(track_context.get('session_type', 'Race')),
            contingencies=self.generate_contingencies(conditions)
        )

        return pdf_bytes


# Singleton instance
prep_plan_service = PrepPlanService()
