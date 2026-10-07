# Setup

## Requirements

- Python 3.12
- A virtual environment (the project expects one at `venv/` in the repo root)

ChessWeb has no `requirements.txt` checked in; the following packages are installed in the project's
existing `venv`:

```
Django==5.1.1
django-allauth==65.0.2
openpyxl==3.1.5
python-decouple==3.8
requests==2.32.3
```

If you're setting up a fresh environment, install them with:

```bash
python3 -m venv venv
source venv/bin/activate
pip install Django==5.1.1 django-allauth==65.0.2 openpyxl==3.1.5 python-decouple==3.8 requests==2.32.3
```

## Environment variables

Settings are loaded from a `.env` file in the project root via `python-decouple`
([website/settings.py](../website/settings.py)). Create one with:

```
SECRET_KEY=your-django-secret-key
DEBUG=True
MY_EMAIL=contact@example.com
MY_PHONE_NUMBER=555-555-5555
```

- `SECRET_KEY` is required — Django will refuse to start without it.
- `MY_EMAIL` / `MY_PHONE_NUMBER` are shown in the site footer ("Contact me at ... or text me at ...") and
  default to placeholder values if omitted.

`.env` is listed in `.gitignore` and should never be committed.

## Frontend build (TypeScript)

Page scripts live as TypeScript source in `chess/static_src/*.ts` and are compiled to the JS files Django
actually serves (`chess/static/home.js`, `pair.js`, `input_results.js`, `manual.js`). That compiled output
is gitignored, not committed — see [/convert_to_type.md](../convert_to_type.md) for why. You need Node
installed, then:

```bash
npm install
npm run build          # one-off build
npm run build:watch    # rebuild on save, while developing
npm run typecheck      # tsc --noEmit, no bundling
```

Run `npm run build` at least once before `runserver` — without it, `chess/static/*.js` won't exist and
the pages will fail to load their scripts. `dev.sh` (below) does this for you automatically.

## First-time run

```bash
source venv/bin/activate
python3 manage.py migrate
python3 manage.py createsuperuser
npm install
python3 manage.py runserver
```

Then visit `http://127.0.0.1:8000/` and log in with the superuser account you just created. Note that
`runserver` alone won't produce working frontend JS the first time — run `npm run build` (or use `dev.sh`,
below) before relying on it.

If you'd rather start with the club's existing sample data (volunteers, classes, players) already loaded,
use `dbreset.sh` instead — see [DATABASE.md](DATABASE.md#resetting-the-database-from-scratch).

## Everyday startup: `dev.sh`

Once the database and `node_modules` exist, `dev.sh` is the one-command way to start developing: it
builds the frontend, starts rebuilding it in the background on every `.ts` save, and runs
`python3 manage.py runserver` in the foreground. Ctrl-C stops both.

```bash
bash dev.sh
```

See the project root's `README.md` for the PyCharm run-configuration equivalent.

## Running the shell scripts

`dbreset.sh` and `dev.sh` are both checked in without execute permissions, so running them directly fails:

```bash
./dev.sh
# zsh: permission denied: ./dev.sh
```

Run them through `bash` instead, or `chmod +x dbreset.sh dev.sh` once if you want to use the `./` form
going forward:

```bash
bash dbreset.sh
bash dev.sh
```
