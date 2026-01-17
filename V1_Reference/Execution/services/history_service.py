"""History Service - The AI Memory System for APEX
Retrieves contextual history to inject into AI prompts.
This is the "3-ring binder" - institutional memory for setup decisions.
"""

from Execution.database.database import db


class HistoryService:
    """Retrieves historical context for AI reasoning.
    Implements the "learning loop" by feeding past experience into prompts.
    """

    def __init__(self):
        self.use_database = db.is_connected

    def get_track_history(self, track_name, vehicle_id=None, limit=10):
        """Get all historical sessions at this track.
        The AI will know: "Last time at Thunder Alley, you ran X setup and got Y lap times".

        Args:
            track_name: Track name to search for
            vehicle_id: Optional - filter to specific vehicle
            limit: Max sessions to return

        Returns:
            List of session summaries with setups and results

        """
        if not self.use_database:
            return []

        try:
            vehicle_filter = "AND s.vehicle_id = %(vehicle_id)s" if vehicle_id else ""

            query = f"""
                SELECT
                    s.id as session_id,
                    s.session_name,
                    s.session_date,
                    s.session_type,
                    s.track_name,
                    s.traction,
                    s.surface_type,
                    s.surface_condition,
                    s.actual_setup,
                    v.nickname as vehicle_name,
                    v.brand,
                    v.model,
                    -- Aggregate best results from this session
                    (SELECT MIN(best_lap) FROM race_results WHERE session_id = s.id) as best_lap,
                    (SELECT AVG(consistency) FROM race_results WHERE session_id = s.id) as avg_consistency
                FROM sessions s
                JOIN vehicles v ON s.vehicle_id = v.id
                WHERE LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)
                {vehicle_filter}
                ORDER BY s.session_date DESC
                LIMIT %(limit)s
            """

            params = {
                'track_pattern': f"%{track_name}%",
                'vehicle_id': vehicle_id,
                'limit': limit
            }

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving track history: {e}")
            return []

    def get_condition_history(self, traction, surface_type, surface_condition,
                              vehicle_id=None, limit=10):
        """Get sessions with similar conditions (regardless of track).
        The AI will know: "In high-traction, bumpy conditions, changes to X typically helped".

        Args:
            traction: Low/Medium/High
            surface_type: Dusty/Dry/Wet/Muddy
            surface_condition: Smooth/Bumpy/Rutted
            vehicle_id: Optional vehicle filter
            limit: Max sessions

        Returns:
            List of session summaries

        """
        if not self.use_database:
            return []

        try:
            vehicle_filter = "AND s.vehicle_id = %(vehicle_id)s" if vehicle_id else ""

            query = f"""
                SELECT
                    s.id as session_id,
                    s.track_name,
                    s.session_date,
                    s.traction,
                    s.surface_type,
                    s.surface_condition,
                    s.actual_setup,
                    v.nickname as vehicle_name,
                    (SELECT MIN(best_lap) FROM race_results WHERE session_id = s.id) as best_lap
                FROM sessions s
                JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.traction = %(traction)s
                  AND s.surface_type = %(surface_type)s
                  AND s.surface_condition = %(surface_condition)s
                  {vehicle_filter}
                ORDER BY s.session_date DESC
                LIMIT %(limit)s
            """

            params = {
                'traction': traction,
                'surface_type': surface_type,
                'surface_condition': surface_condition,
                'vehicle_id': vehicle_id,
                'limit': limit
            }

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving condition history: {e}")
            return []

    def get_successful_changes(self, vehicle_id=None, track_name=None, limit=20):
        """Get setup changes that WORKED (accepted AND improved lap times).
        This is the core learning signal - what actually made the car faster.

        Args:
            vehicle_id: Optional vehicle filter
            track_name: Optional track filter
            limit: Max changes to return

        Returns:
            List of successful changes with context

        """
        if not self.use_database:
            return []

        try:
            filters = ["sc.status = 'accepted'"]
            params = {'limit': limit}

            if vehicle_id:
                filters.append("s.vehicle_id = %(vehicle_id)s")
                params['vehicle_id'] = vehicle_id

            if track_name:
                filters.append("LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)")
                params['track_pattern'] = f"%{track_name}%"

            where_clause = " AND ".join(filters)

            query = f"""
                SELECT
                    sc.parameter,
                    sc.old_value,
                    sc.new_value,
                    sc.ai_reasoning,
                    sc.lap_time_before,
                    sc.lap_time_after,
                    CASE
                        WHEN sc.lap_time_before IS NOT NULL AND sc.lap_time_after IS NOT NULL
                        THEN sc.lap_time_before - sc.lap_time_after
                        ELSE NULL
                    END as improvement,
                    s.track_name,
                    s.traction,
                    s.surface_type,
                    s.surface_condition,
                    s.session_date,
                    v.nickname as vehicle_name
                FROM setup_changes sc
                JOIN sessions s ON sc.session_id = s.id
                JOIN vehicles v ON s.vehicle_id = v.id
                WHERE {where_clause}
                ORDER BY
                    CASE
                        WHEN sc.lap_time_before IS NOT NULL AND sc.lap_time_after IS NOT NULL
                        THEN sc.lap_time_before - sc.lap_time_after
                        ELSE 0
                    END DESC,
                    sc.created_at DESC
                LIMIT %(limit)s
            """

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving successful changes: {e}")
            return []

    def get_failed_changes(self, vehicle_id=None, track_name=None, limit=10):
        """Get setup changes that were ACCEPTED but made things WORSE.

        IMPORTANT: We do NOT include denied changes here.
        - Denials happen for many reasons (missing parts, time, preference)
        - Denials do NOT mean the recommendation was wrong
        - Only ACCEPTED changes that resulted in slower lap times are true failures

        The car is a connected system - we also capture the full setup context
        because a component change may fail due to overall balance, not the
        component itself.

        Returns:
            List of accepted changes that made lap times worse

        """
        if not self.use_database:
            return []

        try:
            # Only get ACCEPTED changes where lap time got WORSE
            filters = [
                "sc.status = 'accepted'",
                "sc.lap_time_before IS NOT NULL",
                "sc.lap_time_after IS NOT NULL",
                "sc.lap_time_after > sc.lap_time_before"  # Lap time increased = worse
            ]
            params = {'limit': limit}

            if vehicle_id:
                filters.append("s.vehicle_id = %(vehicle_id)s")
                params['vehicle_id'] = vehicle_id

            if track_name:
                filters.append("LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)")
                params['track_pattern'] = f"%{track_name}%"

            where_clause = " AND ".join(filters)

            query = f"""
                SELECT
                    sc.parameter,
                    sc.old_value,
                    sc.new_value,
                    sc.ai_reasoning,
                    sc.lap_time_before,
                    sc.lap_time_after,
                    (sc.lap_time_after - sc.lap_time_before) as time_lost,
                    s.track_name,
                    s.traction,
                    s.surface_condition,
                    s.actual_setup as full_setup_context,
                    s.session_date
                FROM setup_changes sc
                JOIN sessions s ON sc.session_id = s.id
                WHERE {where_clause}
                ORDER BY (sc.lap_time_after - sc.lap_time_before) DESC,
                         sc.created_at DESC
                LIMIT %(limit)s
            """

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving failed changes: {e}")
            return []

    def get_parameter_history(self, parameter, vehicle_id=None, limit=15):
        """Get history of changes to a specific parameter.
        e.g., "Every time you've changed front shock oil, here's what happened".

        Args:
            parameter: Parameter key (e.g., "SO_F", "front.shock_oil")
            vehicle_id: Optional vehicle filter
            limit: Max changes

        Returns:
            List of changes to this parameter with outcomes

        """
        if not self.use_database:
            return []

        try:
            vehicle_filter = "AND s.vehicle_id = %(vehicle_id)s" if vehicle_id else ""

            query = f"""
                SELECT
                    sc.old_value,
                    sc.new_value,
                    sc.status,
                    sc.lap_time_before,
                    sc.lap_time_after,
                    sc.ai_reasoning,
                    s.track_name,
                    s.traction,
                    s.surface_condition,
                    s.session_date
                FROM setup_changes sc
                JOIN sessions s ON sc.session_id = s.id
                WHERE sc.parameter = %(parameter)s
                {vehicle_filter}
                ORDER BY sc.created_at DESC
                LIMIT %(limit)s
            """

            params = {
                'parameter': parameter,
                'vehicle_id': vehicle_id,
                'limit': limit
            }

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving parameter history: {e}")
            return []

    def get_best_setups_for_conditions(self, traction, surface_condition,
                                        brand, model, limit=5):
        """Find the best-performing setups for given conditions.
        Ranks by lap time performance.

        Returns:
            List of top setups with their performance data

        """
        if not self.use_database:
            return []

        try:
            query = """
                SELECT
                    s.actual_setup,
                    s.track_name,
                    s.session_date,
                    rr.best_lap,
                    rr.consistency,
                    rr.heat_name
                FROM sessions s
                JOIN vehicles v ON s.vehicle_id = v.id
                JOIN race_results rr ON rr.session_id = s.id
                WHERE s.traction = %(traction)s
                  AND s.surface_condition = %(surface_condition)s
                  AND v.brand = %(brand)s
                  AND v.model = %(model)s
                  AND rr.best_lap IS NOT NULL
                ORDER BY rr.best_lap ASC
                LIMIT %(limit)s
            """

            params = {
                'traction': traction,
                'surface_condition': surface_condition,
                'brand': brand,
                'model': model,
                'limit': limit
            }

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving best setups: {e}")
            return []

    # ============================================================
    # X-FACTOR RATING-BASED QUERIES (Phase 2.5)
    # ============================================================

    def get_rated_changes(self, min_rating=4, vehicle_id=None, track_name=None, limit=15):
        """Get setup changes that received high X-Factor ratings.
        These are driver-validated successes from the audit process.

        Args:
            min_rating: Minimum rating to include (default 4 = SUCCESS)
            vehicle_id: Optional vehicle filter
            track_name: Optional track filter
            limit: Max changes to return

        Returns:
            List of highly-rated changes with audit context

        """
        if not self.use_database:
            return []

        try:
            filters = ["xf.rating >= %(min_rating)s"]
            params = {'min_rating': min_rating, 'limit': limit}

            if vehicle_id:
                filters.append("s.vehicle_id = %(vehicle_id)s")
                params['vehicle_id'] = vehicle_id

            if track_name:
                filters.append("LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)")
                params['track_pattern'] = f"%{track_name}%"

            where_clause = " AND ".join(filters)

            query = f"""
                SELECT
                    sc.parameter,
                    sc.old_value,
                    sc.new_value,
                    sc.ai_reasoning,
                    sc.impact_status,
                    xf.rating,
                    xf.gain_category,
                    xf.observation,
                    xf.best_lap_at_audit,
                    s.track_name,
                    s.traction,
                    s.surface_type,
                    s.surface_condition,
                    s.start_date as session_date,
                    v.brand as vehicle_brand,
                    v.model as vehicle_model
                FROM x_factor_audits xf
                LEFT JOIN setup_changes sc ON xf.change_id = sc.id
                JOIN sessions s ON xf.session_id = s.id
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                WHERE {where_clause}
                ORDER BY xf.rating DESC, xf.created_at DESC
                LIMIT %(limit)s
            """

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving rated changes: {e}")
            return []

    def get_failed_changes_with_symptoms(self, vehicle_id=None, track_name=None, limit=10):
        """Get changes that were rated 1-2 in X-Factor audits WITH symptom categories.
        Enhanced version of get_failed_changes that includes driver diagnosis.

        Returns:
            List of failed changes with symptom context

        """
        if not self.use_database:
            return []

        try:
            filters = ["xf.rating <= 2"]
            params = {'limit': limit}

            if vehicle_id:
                filters.append("s.vehicle_id = %(vehicle_id)s")
                params['vehicle_id'] = vehicle_id

            if track_name:
                filters.append("LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)")
                params['track_pattern'] = f"%{track_name}%"

            where_clause = " AND ".join(filters)

            query = f"""
                SELECT
                    sc.parameter,
                    sc.old_value,
                    sc.new_value,
                    sc.ai_reasoning,
                    sc.lap_time_before,
                    sc.lap_time_after,
                    xf.rating,
                    xf.symptom_category,
                    xf.observation,
                    s.track_name,
                    s.traction,
                    s.surface_condition,
                    s.actual_setup as full_setup_context,
                    s.start_date as session_date
                FROM x_factor_audits xf
                LEFT JOIN setup_changes sc ON xf.change_id = sc.id
                JOIN sessions s ON xf.session_id = s.id
                WHERE {where_clause}
                ORDER BY xf.rating ASC, xf.created_at DESC
                LIMIT %(limit)s
            """

            return db.execute_query(query, params)

        except Exception as e:
            print(f"Error retrieving failed changes with symptoms: {e}")
            return []

    def get_gain_category_stats(self, vehicle_id=None, track_name=None):
        """Get statistics on which gain categories are most common for successes.
        Helps identify where the car typically improves.

        Returns:
            Dict with gain category counts

        """
        if not self.use_database:
            return {}

        try:
            filters = ["xf.rating >= 4", "xf.gain_category IS NOT NULL"]
            params = {}

            if vehicle_id:
                filters.append("s.vehicle_id = %(vehicle_id)s")
                params['vehicle_id'] = vehicle_id

            if track_name:
                filters.append("LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)")
                params['track_pattern'] = f"%{track_name}%"

            where_clause = " AND ".join(filters)

            query = f"""
                SELECT
                    xf.gain_category,
                    COUNT(*) as count
                FROM x_factor_audits xf
                JOIN sessions s ON xf.session_id = s.id
                WHERE {where_clause}
                GROUP BY xf.gain_category
                ORDER BY count DESC
            """

            result = db.execute_query(query, params)
            return {r['gain_category']: r['count'] for r in result} if result else {}

        except Exception as e:
            print(f"Error retrieving gain category stats: {e}")
            return {}

    def get_symptom_category_stats(self, vehicle_id=None, track_name=None):
        """Get statistics on which symptoms are most common for failures.
        Helps identify recurring issues.

        Returns:
            Dict with symptom category counts

        """
        if not self.use_database:
            return {}

        try:
            filters = ["xf.rating <= 2", "xf.symptom_category IS NOT NULL"]
            params = {}

            if vehicle_id:
                filters.append("s.vehicle_id = %(vehicle_id)s")
                params['vehicle_id'] = vehicle_id

            if track_name:
                filters.append("LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)")
                params['track_pattern'] = f"%{track_name}%"

            where_clause = " AND ".join(filters)

            query = f"""
                SELECT
                    xf.symptom_category,
                    COUNT(*) as count
                FROM x_factor_audits xf
                JOIN sessions s ON xf.session_id = s.id
                WHERE {where_clause}
                GROUP BY xf.symptom_category
                ORDER BY count DESC
            """

            result = db.execute_query(query, params)
            return {r['symptom_category']: r['count'] for r in result} if result else {}

        except Exception as e:
            print(f"Error retrieving symptom category stats: {e}")
            return {}

    def build_context_for_ai(self, track_name, traction, surface_type,
                             surface_condition, vehicle_id, brand, model):
        """Build the complete historical context for an AI query.
        This is the main method called by the dashboard.

        Returns:
            Formatted string ready for injection into prompt

        """
        context_parts = []

        # 1. Track-specific history
        track_history = self.get_track_history(track_name, vehicle_id, limit=5)
        if track_history:
            context_parts.append(self._format_track_history(track_history))

        # 2. Similar conditions history
        condition_history = self.get_condition_history(
            traction, surface_type, surface_condition, vehicle_id, limit=5
        )
        if condition_history:
            context_parts.append(self._format_condition_history(condition_history))

        # 3. Driver-rated successful changes (X-Factor validated)
        rated_successes = self.get_rated_changes(min_rating=4, vehicle_id=vehicle_id,
                                                  track_name=track_name, limit=10)
        if rated_successes:
            context_parts.append(self._format_rated_changes(rated_successes))
        else:
            # Fallback to lap-time based successes if no X-Factor data
            successes = self.get_successful_changes(vehicle_id, track_name, limit=10)
            if successes:
                context_parts.append(self._format_successful_changes(successes))

        # 4. Driver-rated failures with symptoms (X-Factor validated)
        rated_failures = self.get_failed_changes_with_symptoms(vehicle_id=vehicle_id,
                                                                track_name=track_name, limit=5)
        if rated_failures:
            context_parts.append(self._format_failed_changes_with_symptoms(rated_failures))
        else:
            # Fallback to lap-time based failures if no X-Factor data
            failures = self.get_failed_changes(vehicle_id, track_name, limit=5)
            if failures:
                context_parts.append(self._format_failed_changes(failures))

        # 5. Best setups for these conditions
        best_setups = self.get_best_setups_for_conditions(
            traction, surface_condition, brand, model, limit=3
        )
        if best_setups:
            context_parts.append(self._format_best_setups(best_setups))

        if not context_parts:
            return "<historical_memory>\nNo prior experience at this track or in these conditions. This is a fresh start.\n</historical_memory>"

        return "<historical_memory>\n" + "\n\n".join(context_parts) + "\n</historical_memory>"

    def _format_track_history(self, sessions):
        """Format track history for prompt injection."""
        lines = ["## Track History (Previous Sessions Here)"]
        for s in sessions:
            date = s.get('session_date', 'Unknown date')
            setup = s.get('actual_setup', {})
            best_lap = s.get('best_lap')
            lap_str = f"{best_lap:.3f}s" if best_lap else "No lap data"

            lines.append(f"- {date}: {s.get('vehicle_name', 'Unknown')} | "
                        f"Best: {lap_str} | "
                        f"Conditions: {s.get('traction', '?')}/{s.get('surface_condition', '?')}")

            # Include key setup params if available
            if setup:
                diffs = setup.get('diffs', {})
                front = setup.get('front', {})
                if diffs.get('front'):
                    lines.append(f"  Setup: DF={diffs.get('front')} | "
                               f"SO_F={front.get('shock_oil')} | "
                               f"Compound={setup.get('tires', {}).get('compound')}")

        return "\n".join(lines)

    def _format_condition_history(self, sessions):
        """Format condition history for prompt injection."""
        lines = ["## Similar Conditions History"]
        for s in sessions:
            best_lap = s.get('best_lap')
            lap_str = f"{best_lap:.3f}s" if best_lap else "No data"
            lines.append(f"- {s.get('track_name', 'Unknown')} ({s.get('session_date')}): "
                        f"Best {lap_str}")
        return "\n".join(lines)

    def _format_successful_changes(self, changes):
        """Format successful changes for prompt injection."""
        lines = ["## What Worked (Accepted Changes That Improved Lap Times)"]
        for c in changes:
            improvement = c.get('improvement')
            imp_str = f"(improved by {improvement:.3f}s)" if improvement else "(accepted)"
            lines.append(f"- {c.get('parameter')}: {c.get('old_value')} → {c.get('new_value')} "
                        f"{imp_str}")
            lines.append(f"  Context: {c.get('track_name')} | {c.get('traction')}/{c.get('surface_condition')}")
            if c.get('ai_reasoning'):
                # Truncate long reasoning
                reasoning = c.get('ai_reasoning', '')[:150]
                lines.append(f"  Reasoning: {reasoning}...")
        return "\n".join(lines)

    def _format_failed_changes(self, changes):
        """Format failed changes for prompt injection."""
        lines = ["## Changes That Made Things Worse (Accepted but Lost Time)"]
        lines.append("Note: These changes were applied but resulted in slower lap times.")
        lines.append("Consider the full setup context - the component may work in a different balance.")
        lines.append("")
        for c in changes:
            time_lost = c.get('time_lost')
            time_str = f"+{time_lost:.3f}s slower" if time_lost else "slower"
            lines.append(f"- {c.get('parameter')}: {c.get('old_value')} → {c.get('new_value')} ({time_str})")
            lines.append(f"  Context: {c.get('track_name')} | {c.get('traction')}/{c.get('surface_condition')}")
            # Include setup context hint if available
            setup = c.get('full_setup_context')
            if setup and isinstance(setup, dict):
                diffs = setup.get('diffs', {})
                if diffs:
                    lines.append(f"  Full setup at time: DF={diffs.get('front')} DC={diffs.get('center')} DR={diffs.get('rear')}")
        return "\n".join(lines)

    def _format_best_setups(self, setups):
        """Format best setups for prompt injection."""
        lines = ["## Top Performing Setups for These Conditions"]
        for i, s in enumerate(setups, 1):
            lines.append(f"{i}. {s.get('track_name')} - {s.get('best_lap'):.3f}s "
                        f"({s.get('heat_name', 'Unknown heat')})")
            setup = s.get('actual_setup', {})
            if setup:
                # Extract key parameters
                diffs = setup.get('diffs', {})
                front = setup.get('front', {})
                setup.get('rear', {})
                tires = setup.get('tires', {})
                lines.append(f"   Diffs: F={diffs.get('front')} C={diffs.get('center')} R={diffs.get('rear')}")
                lines.append(f"   Front: SO={front.get('shock_oil')} SP={front.get('spring')}")
                lines.append(f"   Tires: {tires.get('tread')} / {tires.get('compound')}")
        return "\n".join(lines)

    def _format_rated_changes(self, changes):
        """Format X-Factor rated successful changes for prompt injection."""
        lines = ["## Driver-Validated Successes (X-Factor Rated 4-5)"]
        lines.append("These changes received high ratings in post-session audits.")
        lines.append("")

        for c in changes:
            rating = c.get('rating', 'N/A')
            gain = c.get('gain_category', '')
            gain_str = f" | Improved: {gain}" if gain else ""

            # Handle session-level vs change-level audits
            if c.get('parameter'):
                lines.append(f"- {c.get('parameter')}: {c.get('old_value')} -> {c.get('new_value')} "
                           f"(Rated {rating}/5{gain_str})")
            else:
                lines.append(f"- Session rated {rating}/5{gain_str}")

            lines.append(f"  Context: {c.get('track_name')} | {c.get('traction')}/{c.get('surface_condition')}")

            if c.get('best_lap_at_audit'):
                lines.append(f"  Best Lap: {c.get('best_lap_at_audit'):.3f}s")

            if c.get('observation'):
                # Truncate long observations
                obs = c.get('observation', '')[:150]
                lines.append(f"  Driver Note: \"{obs}...\"")

        return "\n".join(lines)

    def _format_failed_changes_with_symptoms(self, changes):
        """Format X-Factor rated failures with symptom diagnosis for prompt injection."""
        lines = ["## Driver-Identified Problems (X-Factor Rated 1-2)"]
        lines.append("These changes were rated poorly with specific symptom diagnosis.")
        lines.append("Consider the full setup context - the component may work in a different balance.")
        lines.append("")

        for c in changes:
            rating = c.get('rating', 'N/A')
            symptom = c.get('symptom_category', 'Unknown issue')

            # Handle session-level vs change-level audits
            if c.get('parameter'):
                lines.append(f"- {c.get('parameter')}: {c.get('old_value')} -> {c.get('new_value')} "
                           f"(Rated {rating}/5 | Issue: {symptom})")
            else:
                lines.append(f"- Session rated {rating}/5 | Issue: {symptom}")

            lines.append(f"  Context: {c.get('track_name')} | {c.get('traction')}/{c.get('surface_condition')}")

            # Include setup context hint if available
            setup = c.get('full_setup_context')
            if setup and isinstance(setup, dict):
                # Try both flat and nested formats
                if 'DF' in setup:
                    lines.append(f"  Setup at time: DF={setup.get('DF')} DC={setup.get('DC')} DR={setup.get('DR')}")
                elif 'diffs' in setup:
                    diffs = setup.get('diffs', {})
                    lines.append(f"  Setup at time: DF={diffs.get('front')} DC={diffs.get('center')} DR={diffs.get('rear')}")

            if c.get('observation'):
                obs = c.get('observation', '')[:150]
                lines.append(f"  Driver Note: \"{obs}...\"")

        return "\n".join(lines)

    def log_package_copy(self, session_id, package_name, parameters_changed, timestamp):
        """**SPRINT 4: X-Factor Integration**
        Log a package copy operation to the session audit trail.
        This enables impact tracking - we can measure if package copies led to performance gains.

        Args:
            session_id: Active session ID
            package_name: Which package was copied (e.g., 'Suspension', 'Geometry')
            parameters_changed: Dict of parameter changes {param: (old_val, new_val), ...}
            timestamp: When the copy was applied

        Impact:
            - Records package copy in setup_changes table for audit trail
            - Links to X-Factor audits at session closeout
            - Enables AI to learn which packages/parameters improve performance

        """
        if not self.use_database:
            return False

        try:
            # Insert each parameter change into setup_changes table
            insert_query = """
                INSERT INTO setup_changes
                (session_id, package_name, parameter_name, value_before, value_after, timestamp)
                VALUES (%(session_id)s, %(package_name)s, %(param)s, %(old_val)s, %(new_val)s, %(timestamp)s)
            """

            for param, (old_val, new_val) in parameters_changed.items():
                params = {
                    'session_id': session_id,
                    'package_name': package_name,
                    'param': param,
                    'old_val': str(old_val),
                    'new_val': str(new_val),
                    'timestamp': timestamp
                }
                db.execute_query(insert_query, params, fetch=False)

            return True

        except Exception as e:
            print(f"Error logging package copy: {e}")
            return False

    def get_session_package_copies(self, session_id):
        """Get all package copy operations logged during a session.
        Used for impact analysis at session closeout.

        Args:
            session_id: Session to analyze

        Returns:
            List of package copy records with parameter changes

        """
        if not self.use_database:
            return []

        try:
            query = """
                SELECT
                    package_name,
                    parameter_name,
                    value_before,
                    value_after,
                    timestamp
                FROM setup_changes
                WHERE session_id = %(session_id)s
                ORDER BY timestamp DESC
            """

            return db.execute_query(query, {'session_id': session_id})

        except Exception as e:
            print(f"Error retrieving session package copies: {e}")
            return []


# Singleton instance
history_service = HistoryService()
