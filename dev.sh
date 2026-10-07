#!/usr/bin/env bash
# One-shot local dev startup: builds the TypeScript frontend, keeps rebuilding it in the
# background as you edit, and runs the Django dev server in the foreground.
#
# Usage: bash dev.sh
#
# First-time setup (migrations, superuser, seed data) is NOT part of this script — see
# docs/DATABASE.md and dbreset.sh for that. This script assumes the DB is already set up.
set -e

cd "$(dirname "$0")"

if [ -f venv/bin/activate ]; then
    source venv/bin/activate
fi

if [ ! -d node_modules ]; then
    echo "Installing npm dependencies (first run only)..."
    npm install
fi

echo "Building frontend (chess/static_src -> chess/static)..."
npm run build

npm run build:watch &
WATCH_PID=$!
trap 'kill "$WATCH_PID" 2>/dev/null' EXIT INT TERM

python3 manage.py runserver
