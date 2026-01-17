"""A.P.E.X. Run Logs Service - ORP Data Persistence
Phase 5: Manages granular lap-level data for ORP calculations.

Provides CRUD operations for run_logs table and integrates with orp_service
for real-time ORP score calculations.
"""

import csv
import logging
import os
from datetime import datetime
from typing import Optional

from Execution.database.database import db
from Execution.services.orp_service import ORPService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("apex.run_logs_service")


class RunLogsService:
    """Manages granular lap-level telemetry for ORP calculations."""

    def __init__(self):
        """Initialize Run Logs Service."""
        self.use_database = db.is_connected
        self.csv_file = "Execution/data/run_logs.csv"
        self._ensure_csv_exists()

    def _ensure_csv_exists(self):
        """Create CSV file if it doesn't exist (for local dev)."""
        if not self.use_database and not os.path.exists(self.csv_file):
            os.makedirs(os.path.dirname(self.csv_file), exist_ok=True)
            with open(self.csv_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([
                    'session_id', 'heat_name', 'lap_number',
                    'lap_time', 'confidence_rating', 'created_at'
                ])
            logger.info(f"Created CSV fallback: {self.csv_file}")

    def add_lap(
        self,
        session_id: str,
        heat_name: str,
        lap_number: int,
        lap_time: float,
        confidence_rating: int = 3,
    ) -> bool:
        """Add a lap to run_logs.

        Args:
            session_id: UUID of the session
            heat_name: Heat identifier (e.g., "Q1", "A-Main")
            lap_number: Lap sequence number
            lap_time: Lap time in seconds
            confidence_rating: 1-5 confidence rating (default 3)

        Returns:
            True if successful, False otherwise

        """
        try:
            # Validate input
            if not session_id or lap_time <= 0 or not (1 <= confidence_rating <= 5):
                logger.error(f"Invalid lap data: session={session_id}, time={lap_time}, conf={confidence_rating}")
                return False

            if self.use_database:
                # Store in PostgreSQL
                with db.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        """
                        INSERT INTO run_logs
                        (session_id, heat_name, lap_number, lap_time, confidence_rating)
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (session_id, heat_name, lap_number, lap_time, confidence_rating)
                    )
                    conn.commit()
                    logger.info(f"Added lap {lap_number} ({lap_time}s) to session {session_id}")
                    return True
            else:
                # Store in CSV
                with open(self.csv_file, 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([
                        session_id, heat_name, lap_number,
                        lap_time, confidence_rating, datetime.now().isoformat()
                    ])
                logger.info(f"Added lap {lap_number} to CSV for session {session_id}")
                return True

        except Exception as e:
            logger.error(f"Error adding lap: {str(e)}")
            return False

    def add_laps_batch(
        self,
        session_id: str,
        heat_name: str,
        lap_times: list[float],
        confidence_rating: int = 3,
    ) -> int:
        """Add multiple laps in one operation.

        Args:
            session_id: UUID of the session
            heat_name: Heat identifier
            lap_times: List of lap times in seconds
            confidence_rating: Confidence rating for all laps

        Returns:
            Number of laps successfully added

        """
        count = 0
        for lap_num, lap_time in enumerate(lap_times, start=1):
            if self.add_lap(session_id, heat_name, lap_num, lap_time, confidence_rating):
                count += 1

        logger.info(f"Added {count}/{len(lap_times)} laps to session {session_id}")
        return count

    def get_session_laps(self, session_id: str) -> list[float]:
        """Get all lap times for a session (ordered by lap_number).

        Args:
            session_id: UUID of the session

        Returns:
            List of lap times in seconds, ordered by lap sequence

        """
        try:
            if self.use_database:
                with db.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        """
                        SELECT lap_time FROM run_logs
                        WHERE session_id = %s
                        ORDER BY lap_number ASC
                        """,
                        (session_id,)
                    )
                    results = cursor.fetchall()
                    return [row[0] for row in results]
            else:
                # Read from CSV
                laps = []
                with open(self.csv_file) as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if row['session_id'] == session_id:
                            laps.append(float(row['lap_time']))
                return sorted(laps)  # Simple sort; ideally use lap_number

        except Exception as e:
            logger.error(f"Error retrieving session laps: {str(e)}")
            return []

    def get_laps_by_heat(self, session_id: str, heat_name: str) -> list[dict]:
        """Get all laps for a specific heat within a session.

        Args:
            session_id: UUID of the session
            heat_name: Heat identifier (e.g., "Q1")

        Returns:
            List of dicts with lap details (number, time, confidence)

        """
        try:
            if self.use_database:
                with db.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        """
                        SELECT lap_number, lap_time, confidence_rating
                        FROM run_logs
                        WHERE session_id = %s AND heat_name = %s
                        ORDER BY lap_number ASC
                        """,
                        (session_id, heat_name)
                    )
                    results = cursor.fetchall()
                    return [
                        {
                            "lap_number": row[0],
                            "lap_time": float(row[1]),
                            "confidence_rating": row[2],
                        }
                        for row in results
                    ]
            else:
                # Read from CSV
                laps = []
                with open(self.csv_file) as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        if row['session_id'] == session_id and row['heat_name'] == heat_name:
                            laps.append({
                                "lap_number": int(row['lap_number']),
                                "lap_time": float(row['lap_time']),
                                "confidence_rating": int(row['confidence_rating']),
                            })
                return sorted(laps, key=lambda x: x['lap_number'])

        except Exception as e:
            logger.error(f"Error retrieving heat laps: {str(e)}")
            return []

    def calculate_orp_from_session(
        self,
        session_id: str,
        heat_name: Optional[str] = None,
        experience_level: str = "Intermediate",
        driver_confidence: int = 3,
    ) -> Optional[dict]:
        """Calculate ORP score for a session or specific heat.

        Args:
            session_id: UUID of the session
            heat_name: Optional heat to filter (if None, use all laps)
            experience_level: "Sportsman", "Intermediate", or "Pro"
            driver_confidence: 1-5 confidence rating

        Returns:
            ORP result dict from orp_service, or None if no laps found

        """
        try:
            # Get lap times
            if heat_name:
                lap_data = self.get_laps_by_heat(session_id, heat_name)
                lap_times = [lap["lap_time"] for lap in lap_data]
            else:
                lap_times = self.get_session_laps(session_id)

            if not lap_times or len(lap_times) < 2:
                logger.warning(f"Insufficient lap data for ORP calculation: {len(lap_times)} laps")
                return None

            # Calculate ORP using orp_service
            orp_result = ORPService.calculate_orp_score(
                lap_times,
                experience_level=experience_level,
                driver_confidence=driver_confidence,
            )

            logger.info(f"ORP calculated for session {session_id}: score={orp_result['orp_score']}, strategy={orp_result.get('strategy', 'N/A')}")
            return orp_result

        except Exception as e:
            logger.error(f"Error calculating ORP: {str(e)}")
            return None

    def delete_session_laps(self, session_id: str) -> int:
        """Delete all laps for a session (when session is closed/deleted).

        Args:
            session_id: UUID of the session

        Returns:
            Number of laps deleted

        """
        try:
            if self.use_database:
                with db.get_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute(
                        "DELETE FROM run_logs WHERE session_id = %s",
                        (session_id,)
                    )
                    deleted = cursor.rowcount
                    conn.commit()
                    logger.info(f"Deleted {deleted} laps for session {session_id}")
                    return deleted
            else:
                # Remove from CSV
                all_rows = []
                with open(self.csv_file) as f:
                    reader = csv.DictReader(f)
                    all_rows = list(reader)

                rows_to_keep = [row for row in all_rows if row['session_id'] != session_id]
                deleted = len(all_rows) - len(rows_to_keep)

                with open(self.csv_file, 'w', newline='') as f:
                    writer = csv.DictWriter(f, fieldnames=['session_id', 'heat_name', 'lap_number', 'lap_time', 'confidence_rating', 'created_at'])
                    writer.writeheader()
                    writer.writerows(rows_to_keep)

                logger.info(f"Removed {deleted} laps from CSV for session {session_id}")
                return deleted

        except Exception as e:
            logger.error(f"Error deleting laps: {str(e)}")
            return 0

    def get_session_summary(self, session_id: str) -> Optional[dict]:
        """Get summary statistics for a session.

        Args:
            session_id: UUID of the session

        Returns:
            Dict with lap count, best time, average, fastest heat

        """
        try:
            lap_times = self.get_session_laps(session_id)

            if not lap_times:
                return None

            return {
                "session_id": session_id,
                "total_laps": len(lap_times),
                "best_lap": min(lap_times),
                "worst_lap": max(lap_times),
                "avg_lap": sum(lap_times) / len(lap_times),
                "consistency": max(lap_times) - min(lap_times),  # Spread
            }

        except Exception as e:
            logger.error(f"Error generating summary: {str(e)}")
            return None


# Singleton instance
_run_logs_service = None


def get_run_logs_service() -> RunLogsService:
    """Get or create Run Logs Service singleton."""
    global _run_logs_service
    if _run_logs_service is None:
        _run_logs_service = RunLogsService()
    return _run_logs_service
