"""Data persistence layer.

This package handles:
- PostgreSQL connection pooling (database)
- Database schema (schema.sql)
- CSV to PostgreSQL migration (migrate_to_database)
- Automatic fallback to CSV when DATABASE_URL not set
"""
