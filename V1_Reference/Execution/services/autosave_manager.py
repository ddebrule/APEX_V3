"""Auto-Save Manager for Phase 4.3: Session Auto-Save Protocol.

Manages draft session lifecycle, debounced saving, and draft picker UI.
Designed to integrate cleanly with Streamlit session_state and callbacks.
"""

import time

from Execution.services.session_service import session_service


class AutoSaveManager:
    """Manages auto-save functionality for draft sessions.

    Features:
    - Debounced saving (10-second default)
    - Draft creation/updating
    - Draft promotion to active
    - Draft deletion
    - Draft picker UI support
    - Connection status tracking
    """

    DEBOUNCE_INTERVAL = 10  # seconds

    def __init__(self):
        self.last_save_time = 0
        self.save_in_progress = False

    def restore_session_on_load(self, profile_id):
        """Session Lifecycle Manager - called at app startup.

        Step 1: Check for active session
        Step 2: Check for latest draft if no active session

        Args:
            profile_id: UUID of the racer profile

        Returns:
            dict with 'session_data', 'status' (active/draft/none), and 'action'

        """
        # Step 1: Check for active session
        active_session = session_service.get_active_session(profile_id)
        if active_session:
            return {
                'session_data': active_session,
                'status': 'active',
                'action': 'restore_active',
                'message': f"Restored active session: {active_session.get('session_name', 'Session')}"
            }

        # Step 2: Check for drafts if no active session
        drafts = session_service.get_all_drafts(profile_id)

        if not drafts:
            # Cleanup stale drafts while we're here
            session_service.cleanup_stale_drafts(profile_id, days=30)
            return {
                'session_data': None,
                'status': 'none',
                'action': 'new_session',
                'message': 'No existing session found. Start a new event.'
            }

        if len(drafts) == 1:
            # Single draft: restore it directly
            draft = drafts[0]
            full_draft = session_service.get_latest_draft(profile_id)
            return {
                'session_data': full_draft,
                'status': 'draft',
                'action': 'restore_draft',
                'message': f"Recovered draft session: {draft['track_name']}"
            }

        # Multiple drafts: return list for picker
        return {
            'session_data': drafts,
            'status': 'multiple_drafts',
            'action': 'show_picker',
            'message': 'Multiple draft sessions found. Please select one:'
        }

    def should_save(self):
        """Check if enough time has passed since last save (debounce check).

        Returns:
            bool - True if save should proceed, False if within debounce window

        """
        current_time = time.time()
        if current_time - self.last_save_time >= self.DEBOUNCE_INTERVAL:
            return True
        return False

    def save_draft(self, profile_id, vehicle_id, session_data, device_info=None, force=False):
        """Save (or update) a draft session with debounce protection.

        Args:
            profile_id: UUID of the racer profile
            vehicle_id: UUID of the vehicle
            session_data: Dict with track context and setup
            device_info: Optional device identifier
            force: If True, bypass debounce and save immediately

        Returns:
            dict with status, session_id, and error (if any)

        """
        # Check debounce window
        if not force and not self.should_save():
            return {
                'status': 'debounced',
                'session_id': None,
                'message': f'Save debounced (next save in {self.DEBOUNCE_INTERVAL}s)'
            }

        try:
            self.save_in_progress = True

            session_id = session_service.upsert_draft(
                profile_id=profile_id,
                vehicle_id=vehicle_id,
                session_data=session_data,
                device_info=device_info
            )

            self.last_save_time = time.time()
            self.save_in_progress = False

            if session_id:
                return {
                    'status': 'saved',
                    'session_id': session_id,
                    'message': 'Draft saved successfully',
                    'error': None
                }
            else:
                return {
                    'status': 'failed',
                    'session_id': None,
                    'message': 'Failed to save draft',
                    'error': 'Database returned no session ID'
                }

        except Exception as e:
            self.save_in_progress = False
            return {
                'status': 'error',
                'session_id': None,
                'message': 'Connection lost - changes not saved',
                'error': str(e)
            }

    def promote_to_active(self, session_id):
        """Promote a draft to active status (called on "Lock Config").

        Args:
            session_id: UUID of the draft to promote

        Returns:
            dict with status and message

        """
        try:
            success = session_service.promote_draft_to_active(session_id)
            if success:
                return {
                    'status': 'success',
                    'message': 'Draft promoted to active session'
                }
            else:
                return {
                    'status': 'failed',
                    'message': 'Failed to promote draft'
                }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error promoting draft: {str(e)}'
            }

    def discard_draft(self, session_id):
        """Delete a draft session.

        Args:
            session_id: UUID of the draft to delete

        Returns:
            dict with status and message

        """
        try:
            success = session_service.delete_draft(session_id)
            if success:
                return {
                    'status': 'success',
                    'message': 'Draft discarded'
                }
            else:
                return {
                    'status': 'failed',
                    'message': 'Failed to discard draft'
                }
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Error discarding draft: {str(e)}'
            }

    def get_save_status_indicator(self, last_save_result=None):
        """Get UI indicator text and color based on save status.

        Args:
            last_save_result: Result dict from save_draft()

        Returns:
            dict with 'emoji', 'text', 'color'

        """
        if self.save_in_progress:
            return {
                'emoji': '🔄',
                'text': 'Saving...',
                'color': 'warning'
            }

        if last_save_result is None:
            return {
                'emoji': '☁️',
                'text': 'Draft Ready',
                'color': 'info'
            }

        status = last_save_result.get('status', 'unknown')

        if status == 'saved':
            return {
                'emoji': '☁️',
                'text': 'Saved',
                'color': 'success'
            }
        elif status == 'error':
            return {
                'emoji': '⚠️',
                'text': 'Connection Lost',
                'color': 'error'
            }
        elif status == 'debounced':
            return {
                'emoji': '⏳',
                'text': f'Next save in {self.DEBOUNCE_INTERVAL}s',
                'color': 'info'
            }
        else:
            return {
                'emoji': '☁️',
                'text': 'Saving...',
                'color': 'warning'
            }


# Singleton instance
autosave_manager = AutoSaveManager()
