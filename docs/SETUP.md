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

## First-time run

```bash
source venv/bin/activate
python3 manage.py migrate
python3 manage.py createsuperuser
python3 manage.py runserver
```

Then visit `http://127.0.0.1:8000/` and log in with the superuser account you just created.

If you'd rather start with the club's existing sample data (volunteers, classes, players) already loaded,
use `dbreset.sh` instead — see [DATABASE.md](DATABASE.md#resetting-the-database-from-scratch).

## Running the shell script

`dbreset.sh` is checked in without execute permissions, so running it directly fails:

```bash
./dbreset.sh
# zsh: permission denied: ./dbreset.sh
```

Run it through `bash` instead, or `chmod +x dbreset.sh` once if you want to use `./dbreset.sh` going
forward:

```bash
bash dbreset.sh
```
