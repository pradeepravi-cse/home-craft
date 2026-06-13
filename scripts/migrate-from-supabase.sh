#!/bin/sh
# Dumps the public schema from Supabase and restores it into the local postgres.
# Runs inside the db-migrate container — do not execute directly.
set -e

DUMP_FILE=/backup/supabase-dump.sql

echo "==> Dumping public schema from Supabase..."
pg_dump \
  --no-owner \
  --no-acl \
  --schema=public \
  "$SUPABASE_DIRECT_URL" \
  -f "$DUMP_FILE"

echo "==> Dump size: $(du -sh "$DUMP_FILE" | cut -f1)"

echo "==> Dropping and recreating public schema in local postgres..."
PGPASSWORD="$DB_PASSWORD" psql \
  -h postgres \
  -U "$DB_USER" \
  -d homecraft \
  -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "==> Restoring into local postgres..."
PGPASSWORD="$DB_PASSWORD" psql \
  -h postgres \
  -U "$DB_USER" \
  -d homecraft \
  -f "$DUMP_FILE"

echo "==> Migration complete. Backup kept at /backup/supabase-dump.sql on the host."
