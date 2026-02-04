#!/usr/bin/env bash
set -e

echo "Running Alembic migrations..."
cd src
alembic upgrade head

echo "Running seeders..."
python -m seeders

echo "Starting the application..."
uvicorn main:app \
  --host "${API_HOST:-0.0.0.0}" \
  --port "${API_PORT:-8080}" \
  --proxy-headers \
  --forwarded-allow-ips "${FORWARDED_ALLOW_IPS:-*}"
