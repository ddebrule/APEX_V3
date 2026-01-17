"""Session Service - Persistent Session Management for APEX
Manages multi-day race event sessions with state persistence across browser restarts.

Sessions can span 1-7 days and must persist their state (Digital Twin, changes, etc.)
until the racer explicitly closes them via the X-Factor Protocol in Tab 4.
"""

import json
import uuid
from datetime import date

from Execution.database.database import db


class SessionService:
    """Manages persistent racing sessions across multi-day events.

    Session Lifecycle:
    1. create_session() - Called when racer locks config in Tab 1
    2. save_session_state() - Called whenever Digital Twin changes
    3. load_active_session() - Called on app load to restore state
    4. close_session() - Called after X-Factor audit in Tab 4
    """

    def __init__(self):
        self.use_database = db.is_connected
        self.last_error = None

    def create_session(self, profile_id, vehicle_id, session_data):
        """Create a new persistent session.

        Args:
            profile_id: UUID of the racer profile
            vehicle_id: UUID of the vehicle being used
            session_data: Dict containing:
                - session_name: str
                - session_type: str (Practice, Qualifying, Main, Club Race)
                - track_name: str
                - track_size: str
                - traction: str
                - surface_type: str
                - surface_condition: str
                - actual_setup: dict (the Digital Twin)
                - practice_rounds: int (0-5+, optional, for ORP Strategy)
                - qualifying_rounds: int (1-6, optional, for ORP Strategy)

        Returns:
            session_id (UUID) or None if failed

        """
        self.last_error = None
        if not self.use_database:
            print("WARNING: Database not connected. Creating volatile in-memory session.")
            return str(uuid.uuid4())

        try:
            result = db.execute_query(
                """
                INSERT INTO sessions (
                    profile_id, vehicle_id, session_name, session_type,
                    start_date, track_name, track_size, traction,
                    surface_type, surface_condition, actual_setup, status,
                    practice_rounds, qualifying_rounds
                )
                VALUES (
                    %(profile_id)s, %(vehicle_id)s, %(session_name)s, %(session_type)s,
                    %(start_date)s, %(track_name)s, %(track_size)s, %(traction)s,
                    %(surface_type)s, %(surface_condition)s, %(actual_setup)s, 'active',
                    %(practice_rounds)s, %(qualifying_rounds)s
                )
                RETURNING id
                """,
                {
                    'profile_id': profile_id,
                    'vehicle_id': vehicle_id,
                    'session_name': session_data.get('session_name', 'Unnamed Session'),
                    'session_type': session_data.get('session_type', 'Practice'),
                    'start_date': date.today(),
                    'track_name': session_data.get('track_name', ''),
                    'track_size': session_data.get('track_size', 'Medium'),
                    'traction': session_data.get('traction', 'Medium'),
                    'surface_type': session_data.get('surface_type', 'Dry'),
                    'surface_condition': session_data.get('surface_condition', 'Smooth'),
                    'actual_setup': json.dumps(session_data.get('actual_setup', {})),
                    'practice_rounds': session_data.get('practice_rounds', 0),
                    'qualifying_rounds': session_data.get('qualifying_rounds', 0)
                }
            )

            if result:
                return result[0]['id']
            return None

        except Exception as e:
            print(f"Error creating session: {e}")
            self.last_error = str(e)
            return None

    def get_active_session(self, profile_id):
        """Get the currently active session for a profile.

        Returns:
            Session dict with all fields, or None if no active session

        """
        if not self.use_database:
            return None

        try:
            result = db.execute_query(
                """
                SELECT
                    s.*,
                    v.brand as vehicle_brand,
                    v.model as vehicle_model
                FROM sessions s
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.profile_id = %(profile_id)s
                  AND s.status = 'active'
                ORDER BY s.created_at DESC
                LIMIT 1
                """,
                {'profile_id': profile_id}
            )

            if result:
                session = result[0]
                # Parse JSONB actual_setup if it's a string
                if isinstance(session.get('actual_setup'), str):
                    try:
                        session['actual_setup'] = json.loads(session['actual_setup'])
                    except json.JSONDecodeError as je:
                        print(f"Warning: Could not parse actual_setup JSON: {je}")
                        session['actual_setup'] = {}
                return session
            return None

        except Exception as e:
            print(f"Error getting active session: {e}")
            return None

    def has_unclosed_session(self, profile_id):
        """Check if there's an unclosed session for warning display.

        Returns:
            bool - True if there's an active (unclosed) session

        """
        if not self.use_database:
            return False

        try:
            result = db.execute_query(
                """
                SELECT EXISTS (
                    SELECT 1 FROM sessions
                    WHERE profile_id = %(profile_id)s
                    AND status = 'active'
                )
                """,
                {'profile_id': profile_id}
            )
            return result[0]['exists'] if result else False

        except Exception as e:
            print(f"Error checking for unclosed session: {e}")
            return False

    def save_session_state(self, session_id, actual_setup):
        """Update the Digital Twin state in the persistent session.
        Called whenever the setup changes (AI recommendation accepted, manual change).

        Args:
            session_id: UUID of the session
            actual_setup: Dict of the current Digital Twin state

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return True

        try:
            db.execute_query(
                """
                UPDATE sessions
                SET actual_setup = %(actual_setup)s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %(session_id)s
                """,
                {
                    'session_id': session_id,
                    'actual_setup': json.dumps(actual_setup)
                },
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error saving session state: {e}")
            return False

    def load_session(self, session_id):
        """Load a specific session by ID.

        Returns:
            Session dict or None

        """
        if not self.use_database:
            return None

        try:
            result = db.execute_query(
                """
                SELECT
                    s.*,
                    v.brand as vehicle_brand,
                    v.model as vehicle_model
                FROM sessions s
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.id = %(session_id)s
                """,
                {'session_id': session_id}
            )

            if result:
                session = result[0]
                if isinstance(session.get('actual_setup'), str):
                    try:
                        session['actual_setup'] = json.loads(session['actual_setup'])
                    except json.JSONDecodeError as je:
                        print(f"Warning: Could not parse actual_setup JSON: {je}")
                        session['actual_setup'] = {}
                return session
            return None

        except Exception as e:
            print(f"Error loading session: {e}")
            return None

    def close_session(self, session_id):
        """Close a session (called after X-Factor audit completion).

        Args:
            session_id: UUID of the session to close

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return False

        try:
            db.execute_query(
                """
                UPDATE sessions
                SET status = 'closed',
                    end_date = %(end_date)s,
                    closed_at = CURRENT_TIMESTAMP
                WHERE id = %(session_id)s
                """,
                {
                    'session_id': session_id,
                    'end_date': date.today()
                },
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error closing session: {e}")
            return False

    def get_session_history(self, profile_id, limit=20):
        """Get recent closed sessions for a profile.

        Returns:
            List of session dicts

        """
        if not self.use_database:
            return []

        try:
            return db.execute_query(
                """
                SELECT
                    s.id, s.session_name, s.track_name, s.start_date, s.end_date,
                    s.traction, s.surface_condition, s.status,
                    v.brand as vehicle_brand, v.model as vehicle_model,
                    (SELECT COUNT(*) FROM setup_changes WHERE session_id = s.id) as change_count,
                    (SELECT MIN(best_lap) FROM race_results WHERE session_id = s.id) as best_lap
                FROM sessions s
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.profile_id = %(profile_id)s
                ORDER BY s.created_at DESC
                LIMIT %(limit)s
                """,
                {'profile_id': profile_id, 'limit': limit}
            )

        except Exception as e:
            print(f"Error getting session history: {e}")
            return []

    def record_setup_change(self, session_id, parameter, old_value, new_value,
                           status='accepted', ai_reasoning=None, lap_time_before=None):
        """Record a setup change made during this session.

        Args:
            session_id: UUID of the current session
            parameter: Parameter key (e.g., "SO_F", "Compound")
            old_value: Previous value
            new_value: New value
            status: 'pending', 'accepted', or 'denied'
            ai_reasoning: Why the AI recommended this (optional)
            lap_time_before: Best lap before the change (optional)

        Returns:
            change_id (UUID) or None

        """
        if not self.use_database:
            return None

        try:
            result = db.execute_query(
                """
                INSERT INTO setup_changes (
                    session_id, parameter, old_value, new_value,
                    status, ai_reasoning, lap_time_before
                )
                VALUES (
                    %(session_id)s, %(parameter)s, %(old_value)s, %(new_value)s,
                    %(status)s, %(ai_reasoning)s, %(lap_time_before)s
                )
                RETURNING id
                """,
                {
                    'session_id': session_id,
                    'parameter': parameter,
                    'old_value': str(old_value) if old_value is not None else None,
                    'new_value': str(new_value) if new_value is not None else None,
                    'status': status,
                    'ai_reasoning': ai_reasoning,
                    'lap_time_before': lap_time_before
                }
            )

            if result:
                return result[0]['id']
            return None

        except Exception as e:
            print(f"Error recording setup change: {e}")
            return None

    def update_change_lap_time(self, change_id, lap_time_after):
        """Update a change with the lap time achieved after the change.

        Args:
            change_id: UUID of the setup change
            lap_time_after: Best lap after the change was applied

        """
        if not self.use_database:
            return False

        try:
            db.execute_query(
                """
                UPDATE setup_changes
                SET lap_time_after = %(lap_time_after)s
                WHERE id = %(change_id)s
                """,
                {
                    'change_id': change_id,
                    'lap_time_after': lap_time_after
                },
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error updating change lap time: {e}")
            return False

    def get_session_changes(self, session_id):
        """Get all setup changes made during a session.
        Used for X-Factor audit review.

        Returns:
            List of change dicts

        """
        if not self.use_database:
            return []

        try:
            return db.execute_query(
                """
                SELECT *
                FROM setup_changes
                WHERE session_id = %(session_id)s
                ORDER BY created_at ASC
                """,
                {'session_id': session_id}
            )

        except Exception as e:
            print(f"Error getting session changes: {e}")
            return []

    def get_latest_draft(self, profile_id):
        """Get the most recent draft session for a profile.

        Returns:
            Draft session dict or None if no draft exists

        """
        if not self.use_database:
            return None

        try:
            result = db.execute_query(
                """
                SELECT
                    s.*,
                    v.brand as vehicle_brand,
                    v.model as vehicle_model
                FROM sessions s
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.profile_id = %(profile_id)s
                  AND s.status = 'draft'
                ORDER BY s.last_updated DESC
                LIMIT 1
                """,
                {'profile_id': profile_id}
            )

            if result:
                session = result[0]
                if isinstance(session.get('actual_setup'), str):
                    try:
                        session['actual_setup'] = json.loads(session['actual_setup'])
                    except json.JSONDecodeError as je:
                        print(f"Warning: Could not parse actual_setup JSON: {je}")
                        session['actual_setup'] = {}
                return session
            return None

        except Exception as e:
            print(f"Error getting latest draft: {e}")
            return None

    def get_all_drafts(self, profile_id):
        """Get all draft sessions for a profile, sorted by most recent first.

        Returns:
            List of draft session dicts

        """
        if not self.use_database:
            return []

        try:
            result = db.execute_query(
                """
                SELECT
                    s.id,
                    s.session_name,
                    s.track_name,
                    s.session_type,
                    s.last_updated,
                    v.brand as vehicle_brand,
                    v.model as vehicle_model
                FROM sessions s
                LEFT JOIN vehicles v ON s.vehicle_id = v.id
                WHERE s.profile_id = %(profile_id)s
                  AND s.status = 'draft'
                ORDER BY s.last_updated DESC
                """,
                {'profile_id': profile_id}
            )

            return result if result else []

        except Exception as e:
            print(f"Error getting all drafts: {e}")
            return []

    def upsert_draft(self, profile_id, vehicle_id, session_data, device_info=None):
        """Create or update a draft session (auto-save).

        Uses "Last Modified Wins" conflict resolution based on session.id.

        Args:
            profile_id: UUID of the racer profile
            vehicle_id: UUID of the vehicle
            session_data: Dict containing track_name, actual_setup, etc.
            device_info: Optional device identifier for tracking

        Returns:
            session_id of the draft, or None if failed

        """
        if not self.use_database:
            print("WARNING: Database not connected. Creating volatile draft.")
            return str(uuid.uuid4())

        try:
            track_name = session_data.get('track_name', 'Unnamed Track')

            # Check if a draft already exists for this profile
            existing = db.execute_query(
                """
                SELECT id FROM sessions
                WHERE profile_id = %(profile_id)s
                  AND status = 'draft'
                ORDER BY last_updated DESC
                LIMIT 1
                """,
                {'profile_id': profile_id}
            )

            if existing:
                # Update existing draft
                session_id = existing[0]['id']
                db.execute_query(
                    """
                    UPDATE sessions
                    SET
                        vehicle_id = %(vehicle_id)s,
                        session_name = %(session_name)s,
                        session_type = %(session_type)s,
                        track_name = %(track_name)s,
                        track_size = %(track_size)s,
                        traction = %(traction)s,
                        surface_type = %(surface_type)s,
                        surface_condition = %(surface_condition)s,
                        actual_setup = %(actual_setup)s,
                        device_info = %(device_info)s,
                        last_updated = CURRENT_TIMESTAMP
                    WHERE id = %(session_id)s
                    """,
                    {
                        'session_id': session_id,
                        'vehicle_id': vehicle_id,
                        'session_name': session_data.get('session_name', 'Draft Session'),
                        'session_type': session_data.get('session_type', 'Practice'),
                        'track_name': track_name,
                        'track_size': session_data.get('track_size', 'Medium'),
                        'traction': session_data.get('traction', 'Medium'),
                        'surface_type': session_data.get('surface_type', 'Dry'),
                        'surface_condition': session_data.get('surface_condition', 'Smooth'),
                        'actual_setup': json.dumps(session_data.get('actual_setup', {})),
                        'device_info': device_info
                    },
                    fetch=False
                )
                return session_id
            else:
                # Create new draft
                result = db.execute_query(
                    """
                    INSERT INTO sessions (
                        profile_id, vehicle_id, session_name, session_type,
                        session_date, track_name, track_size, traction,
                        surface_type, surface_condition, actual_setup, status,
                        device_info, last_updated
                    )
                    VALUES (
                        %(profile_id)s, %(vehicle_id)s, %(session_name)s, %(session_type)s,
                        %(session_date)s, %(track_name)s, %(track_size)s, %(traction)s,
                        %(surface_type)s, %(surface_condition)s, %(actual_setup)s, 'draft',
                        %(device_info)s, CURRENT_TIMESTAMP
                    )
                    RETURNING id
                    """,
                    {
                        'profile_id': profile_id,
                        'vehicle_id': vehicle_id,
                        'session_name': session_data.get('session_name', 'Draft Session'),
                        'session_type': session_data.get('session_type', 'Practice'),
                        'session_date': date.today(),
                        'track_name': track_name,
                        'track_size': session_data.get('track_size', 'Medium'),
                        'traction': session_data.get('traction', 'Medium'),
                        'surface_type': session_data.get('surface_type', 'Dry'),
                        'surface_condition': session_data.get('surface_condition', 'Smooth'),
                        'actual_setup': json.dumps(session_data.get('actual_setup', {})),
                        'device_info': device_info
                    }
                )
                return result[0]['id'] if result else None

        except Exception as e:
            print(f"Error upserting draft: {e}")
            return None

    def promote_draft_to_active(self, session_id):
        """Promote a draft session to active status (called on "Lock Config").

        Args:
            session_id: UUID of the draft session to promote

        Returns:
            bool - Success status

        """
        if not self.use_database:
            print("WARNING: Database not connected. Promoted volatile draft.")
            return True

        try:
            db.execute_query(
                """
                UPDATE sessions
                SET status = 'active',
                    updated_at = CURRENT_TIMESTAMP,
                    last_updated = CURRENT_TIMESTAMP
                WHERE id = %(session_id)s
                  AND status = 'draft'
                """,
                {'session_id': session_id},
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error promoting draft to active: {e}")
            return False

    def delete_draft(self, session_id):
        """Delete a draft session (called when user discards a draft).

        Args:
            session_id: UUID of the draft session to delete

        Returns:
            bool - Success status

        """
        if not self.use_database:
            return False

        try:
            db.execute_query(
                """
                DELETE FROM sessions
                WHERE id = %(session_id)s
                  AND status = 'draft'
                """,
                {'session_id': session_id},
                fetch=False
            )
            return True

        except Exception as e:
            print(f"Error deleting draft: {e}")
            return False

    def cleanup_stale_drafts(self, profile_id, days=30):
        """Delete draft sessions older than the retention policy (lazy cleanup).
        Called during app initialization.

        Args:
            profile_id: UUID of the racer profile
            days: Number of days to retain drafts (default: 30)

        Returns:
            int - Number of drafts deleted

        """
        if not self.use_database:
            return 0

        try:
            db.execute_query(
                """
                DELETE FROM sessions
                WHERE profile_id = %(profile_id)s
                  AND status = 'draft'
                  AND last_updated < NOW() - INTERVAL '%(days)s days'
                """,
                {'profile_id': profile_id, 'days': days},
                fetch=False
            )
            # Note: PostgreSQL DELETE doesn't return row count in this driver
            # We'll return a truthy value to indicate success
            return 1

        except Exception as e:
            print(f"Error cleaning up stale drafts: {e}")
            return 0


# Singleton instance
session_service = SessionService()
