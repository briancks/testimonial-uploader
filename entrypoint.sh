#!/bin/sh
set -e

DB_PATH="/app/data/testimonials.db"
mkdir -p /app/data

# If GCS_BUCKET_NAME is set, use Litestream for backup/restore
if [ -n "$GCS_BUCKET_NAME" ]; then
  # Restore database from GCS if it exists
  echo "Restoring database from GCS..."
  litestream restore -if-replica-exists -o "$DB_PATH" "gcs://${GCS_BUCKET_NAME}/testimonials.db" || true

  # If no backup existed, copy the pre-migrated DB from the build
  if [ ! -f "$DB_PATH" ]; then
    echo "No backup found, using fresh database..."
    cp /app/seed.db "$DB_PATH"
  fi

  # Start Litestream replication with Next.js as the subprocess
  echo "Starting with Litestream replication..."
  exec litestream replicate -exec "node server.js"
else
  # Local/development mode
  if [ ! -f "$DB_PATH" ]; then
    cp /app/seed.db "$DB_PATH"
  fi
  exec node server.js
fi
