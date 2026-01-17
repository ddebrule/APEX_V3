"""X-Factor Service - Performance Audit State Machine for APEX
Implements the X-Factor Protocol as defined in Directives/x_factor_protocol.md.

The X-Factor Protocol is the "black box" of the APEX system - transforming
subjective driver "feel" into objective, searchable performance data.

Audit Flow:
1. TRIGGER: Session closeout (end of race event, 1-7 days)
2. STATE 1: Mechanical Validation - Rate overall session 1-5
3. STATE 2: Contextual Diagnostics - Branch based on rating
   - [1-2] FAILURE: Identify symptom (Front-end wash, Rear loose, etc.)
   - [4-5] SUCCESS: Identify gain area (Corner Entry, Exit, Jumping, Consistency)
   - [3] NEUTRAL: Quick confirmation
4. STATE 3: X-Factor Observation - Open-ended final note
5. COMPLETE: Close session, promote data to Institutional Memory
"""


from Execution.database.database import db

# Constants for symptom and gain categories
FAILURE_SYMPTOMS = [
    "Front-end wash",
    "Rear-end loose",
    "Stability (bumpy)",
    "Rotation (tight)"
]

SUCCESS_GAINS = [
    "Corner Entry",
    "Corner Exit",
    "Jumping/Landing",
    "Consistency"
]


class XFactorService:
    """Manages the X-Factor Performance Audit workflow.

    The audit can be done at two levels:
    1. Session-level: Overall rating for the entire event
    2. Change-level: Rate individual significant changes (optional)
    """

    def __init__(self):
        self.use_database = db.is_connected

    def start_session_audit(self, session_id):
        """Initialize a session-level audit.

        Args:
            session_id: UUID of the session to audit

        Returns:
            audit_id (UUID) or None

        """
        if not self.use_database:
            return None

        try:
            result = db.execute_query(
                """
                INSERT INTO x_factor_audits (session_id)
                VALUES (%(session_id)s)
                RETURNING id
                """,
                {'session_id': session_id}
            )

            if result:
                return result[0]['id']
            return None

        except Exception as e:
            print(f"Error starting session audit: {e}")
            return None

    def start_change_audit(self, session_id, change_id):
        """Initialize an audit for a specific setup change.

        Args:
            session_id: UUID of the session
            change_id: UUID of the specific change to rate

        Returns:
            audit_id (UUID) or None

        """
        if not self.use_database:
            return None

        try:
            result = db.execute_query(
                """
                INSERT INTO x_factor_audits (session_id, change_id)
                VALUES (%(session_id)s, %(change_id)s)
                RETURNING id
                """,
                {
                    'session_id': session_id,
                    'change_id': change_id
                }
            )

            if result:
                return result[0]['id']
            return None

        except Exception as e:
            print(f"Error starting change audit: {e}")
            return None

    def record_rating(self, audit_id, rating):
        """Record the 1-5 performance rating.

        STATE 1 of the X-Factor Protocol.

        Args:
            audit_id: UUID of the audit
            rating: Integer 1-5
                1-2 = FAILURE (car got worse)
                3 = NEUTRAL (no change)
                4-5 = SUCCESS (car improved)

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return False

        if not 1 <= rating <= 5:
            print(f"Invalid rating: {rating}. Must be 1-5.")
            return False

        try:
            db.execute_query(
                """
                UPDATE x_factor_audits
                SET rating = %(rating)s
                WHERE id = %(audit_id)s
                """,
                {
                    'audit_id': audit_id,
                    'rating': rating
                },
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error recording rating: {e}")
            return False

    def record_symptom(self, audit_id, symptom):
        """Record the failure symptom (for ratings 1-2).

        STATE 2 of the X-Factor Protocol - FAILURE branch.

        Args:
            audit_id: UUID of the audit
            symptom: One of FAILURE_SYMPTOMS:
                - "Front-end wash"
                - "Rear-end loose"
                - "Stability (bumpy)"
                - "Rotation (tight)"

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return False

        if symptom not in FAILURE_SYMPTOMS:
            print(f"Invalid symptom: {symptom}. Must be one of {FAILURE_SYMPTOMS}")
            return False

        try:
            db.execute_query(
                """
                UPDATE x_factor_audits
                SET symptom_category = %(symptom)s
                WHERE id = %(audit_id)s
                """,
                {
                    'audit_id': audit_id,
                    'symptom': symptom
                },
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error recording symptom: {e}")
            return False

    def record_gain(self, audit_id, gain_area):
        """Record the improvement area (for ratings 4-5).

        STATE 2 of the X-Factor Protocol - SUCCESS branch.

        Args:
            audit_id: UUID of the audit
            gain_area: One of SUCCESS_GAINS:
                - "Corner Entry"
                - "Corner Exit"
                - "Jumping/Landing"
                - "Consistency"

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return False

        if gain_area not in SUCCESS_GAINS:
            print(f"Invalid gain area: {gain_area}. Must be one of {SUCCESS_GAINS}")
            return False

        try:
            db.execute_query(
                """
                UPDATE x_factor_audits
                SET gain_category = %(gain_area)s
                WHERE id = %(audit_id)s
                """,
                {
                    'audit_id': audit_id,
                    'gain_area': gain_area
                },
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error recording gain: {e}")
            return False

    def record_observation(self, audit_id, observation, best_lap=None):
        """Record the final open-ended observation.

        STATE 3 of the X-Factor Protocol - "Final observation for the binder"

        Args:
            audit_id: UUID of the audit
            observation: Free-form text note
            best_lap: Best lap time at time of audit (optional)

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return False

        try:
            db.execute_query(
                """
                UPDATE x_factor_audits
                SET observation = %(observation)s,
                    best_lap_at_audit = %(best_lap)s
                WHERE id = %(audit_id)s
                """,
                {
                    'audit_id': audit_id,
                    'observation': observation,
                    'best_lap': best_lap
                },
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error recording observation: {e}")
            return False

    def complete_audit(self, audit_id):
        """Finalize the audit and promote data to Institutional Memory.

        This updates the associated setup_changes with impact_status
        based on the audit rating.

        Args:
            audit_id: UUID of the audit to complete

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return False

        try:
            # Get the audit data
            audit = db.execute_query(
                """
                SELECT audit.*, s.id as session_id
                FROM x_factor_audits audit
                JOIN sessions s ON audit.session_id = s.id
                WHERE audit.id = %(audit_id)s
                """,
                {'audit_id': audit_id}
            )

            if not audit:
                return False

            audit = audit[0]
            rating = audit.get('rating')
            change_id = audit.get('change_id')

            # Determine impact status based on rating
            if rating is None:
                impact_status = None
            elif rating <= 2:
                impact_status = 'FAILURE'
            elif rating >= 4:
                impact_status = 'SUCCESS'
            else:
                impact_status = 'NEUTRAL'

            # If this audit is for a specific change, update that change
            if change_id:
                db.execute_query(
                    """
                    UPDATE setup_changes
                    SET impact_status = %(impact_status)s
                    WHERE id = %(change_id)s
                    """,
                    {
                        'change_id': change_id,
                        'impact_status': impact_status
                    },
                    fetch=False
                )
            else:
                # Session-level audit: update ALL accepted changes in this session
                # based on the overall session rating
                db.execute_query(
                    """
                    UPDATE setup_changes
                    SET impact_status = %(impact_status)s
                    WHERE session_id = %(session_id)s
                    AND status = 'accepted'
                    AND impact_status IS NULL
                    """,
                    {
                        'session_id': audit['session_id'],
                        'impact_status': impact_status
                    },
                    fetch=False
                )

            return True

        except Exception as e:
            print(f"Error completing audit: {e}")
            return False

    def get_audit(self, audit_id):
        """Get a specific audit record.

        Returns:
            Audit dict or None

        """
        if not self.use_database:
            return None

        try:
            result = db.execute_query(
                """
                SELECT *
                FROM x_factor_audits
                WHERE id = %(audit_id)s
                """,
                {'audit_id': audit_id}
            )

            return result[0] if result else None

        except Exception as e:
            print(f"Error getting audit: {e}")
            return None

    def get_session_audits(self, session_id):
        """Get all audits for a session.

        Returns:
            List of audit dicts

        """
        if not self.use_database:
            return []

        try:
            return db.execute_query(
                """
                SELECT a.*, sc.parameter, sc.old_value, sc.new_value
                FROM x_factor_audits a
                LEFT JOIN setup_changes sc ON a.change_id = sc.id
                WHERE a.session_id = %(session_id)s
                ORDER BY a.created_at ASC
                """,
                {'session_id': session_id}
            )

        except Exception as e:
            print(f"Error getting session audits: {e}")
            return []

    def get_rating_summary(self, profile_id=None, track_name=None):
        """Get summary statistics of ratings for analysis.

        Args:
            profile_id: Filter by racer profile (optional)
            track_name: Filter by track (optional)

        Returns:
            Dict with rating statistics

        """
        if not self.use_database:
            return {}

        try:
            filters = []
            params = {}

            if profile_id:
                filters.append("s.profile_id = %(profile_id)s")
                params['profile_id'] = profile_id

            if track_name:
                filters.append("LOWER(s.track_name) LIKE LOWER(%(track_pattern)s)")
                params['track_pattern'] = f"%{track_name}%"

            where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""

            result = db.execute_query(
                f"""
                SELECT
                    COUNT(*) as total_audits,
                    AVG(a.rating) as avg_rating,
                    COUNT(CASE WHEN a.rating <= 2 THEN 1 END) as failure_count,
                    COUNT(CASE WHEN a.rating = 3 THEN 1 END) as neutral_count,
                    COUNT(CASE WHEN a.rating >= 4 THEN 1 END) as success_count,
                    -- Most common symptoms for failures
                    MODE() WITHIN GROUP (ORDER BY a.symptom_category) as common_symptom,
                    -- Most common gains for successes
                    MODE() WITHIN GROUP (ORDER BY a.gain_category) as common_gain
                FROM x_factor_audits a
                JOIN sessions s ON a.session_id = s.id
                {where_clause}
                """,
                params
            )

            return result[0] if result else {}

        except Exception as e:
            print(f"Error getting rating summary: {e}")
            return {}


# Singleton instance
x_factor_service = XFactorService()
