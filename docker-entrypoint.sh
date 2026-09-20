#!/bin/sh
set -eu

# Railway mounts persistent volumes after the image is built. Fix ownership only
# on the dedicated upload mount, then immediately drop root privileges.
chown -R plenalitik:plenalitik /app/backend/uploads

exec gosu plenalitik uvicorn server:app --host 0.0.0.0 --port "${PORT:-8000}"
