#!/usr/bin/env bash
# One-shot installer for ChessWeb. Safe to re-run: it skips anything already done.
#
# Usage: bash install.sh
#
# What it does:
#   1. Checks for Python 3 and Node.js/npm
#   2. Creates venv/ and installs requirements.txt
#   3. Runs `npm install` and builds the TypeScript frontend
#   4. Creates a .env with a freshly generated SECRET_KEY (if none exists)
#   5. Creates/updates the database (makemigrations + migrate)
#   6. Seeds the club roster from files/*.csv, if those files are present
#   7. Offers to create a superuser (your login)
set -euo pipefail

cd "$(dirname "$0")"

say() { printf '\n==> %s\n' "$1"; }
die() { printf 'Error: %s\n' "$1" >&2; exit 1; }

say "Checking prerequisites"
PYTHON=""
for candidate in python3.12 python3; do
    if command -v "$candidate" >/dev/null 2>&1; then PYTHON="$candidate"; break; fi
done
[ -n "$PYTHON" ] || die "Python 3 not found. Install Python 3.12 (macOS: 'brew install python@3.12')."
"$PYTHON" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' \
    || die "Python 3.10+ required (found $("$PYTHON" --version)); 3.12 recommended."
command -v node >/dev/null 2>&1 || die "Node.js not found. Install it (macOS: 'brew install node')."
command -v npm  >/dev/null 2>&1 || die "npm not found. Install Node.js, which includes npm."
echo "Python: $("$PYTHON" --version)   Node: $(node --version)   npm: $(npm --version)"

say "Setting up Python virtual environment"
if [ ! -f venv/bin/activate ]; then
    "$PYTHON" -m venv venv
fi
# shellcheck disable=SC1091
source venv/bin/activate
pip install --quiet --disable-pip-version-check -r requirements.txt
echo "Python dependencies installed."

say "Installing frontend dependencies and building"
npm install --no-audit --no-fund
npm run build

say "Checking .env"
if [ -f .env ]; then
    echo ".env already exists — leaving it alone."
else
    SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')"
    cat > .env <<ENVEOF
SECRET_KEY=$SECRET
DEBUG=True
MY_EMAIL=contact@example.com
MY_PHONE_NUMBER=555-555-5555
ENVEOF
    echo "Created .env with a generated SECRET_KEY (edit MY_EMAIL / MY_PHONE_NUMBER for the footer)."
fi

say "Setting up the database"
python3 manage.py makemigrations chess
python3 manage.py migrate

say "Seeding club data"
if [ -f files/volunteers2026.csv ] && [ -f files/classes2026.csv ] && [ -f files/players2026.csv ]; then
    python3 manage.py import_data files/volunteers2026.csv files/classes2026.csv files/players2026.csv
else
    echo "Skipped: files/volunteers2026.csv, classes2026.csv and players2026.csv not found."
    echo "(They're not in the repo. Add them and run 'bash dbreset.sh', or add players on the Manual Edit page.)"
fi

say "Superuser"
HAS_SUPER="$(python3 manage.py shell -c 'from django.contrib.auth.models import User; print(User.objects.filter(is_superuser=True).exists())' 2>/dev/null | tail -1)"
if [ "$HAS_SUPER" = "True" ]; then
    echo "A superuser already exists — skipping."
elif [ -t 0 ]; then
    python3 manage.py createsuperuser
else
    echo "Not an interactive terminal; run 'source venv/bin/activate && python3 manage.py createsuperuser' later."
fi

say "Done! Start the app with:  bash dev.sh   then open http://127.0.0.1:8000/"
