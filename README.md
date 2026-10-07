# ChessWeb
 
This is an extension of my final Project for Databases (see my Chess-Website_LAMP Repo for that code) which is used for the local chess club I volunteer at to update their players' ratings and pair the next meets matches. This code will eventually be published on my personal website once it is ready.

I'm hopeful to have this open to all clubs wanting to use this when it is posted to my website.

For any other clubs wanting to use this code, you are completely free to download and run this on your own machine. This also extends to anyone wanting to fork this project for other uses!

## Documentation

Full documentation lives in [docs/](docs/README.md), including:

- [docs/SETUP.md](docs/SETUP.md) — installing dependencies, configuring `.env`, and running the dev server
- [docs/DATABASE.md](docs/DATABASE.md) — the data model, resetting the database from scratch, and bulk-loading data with `dbreset.sh`
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — project layout, URL routes, the JSON API, and how pairing/ratings are calculated
- [docs/PAGES.md](docs/PAGES.md) — a walkthrough of every page in the site

## Quick start

The frontend (`chess/static_src/*.ts`) is TypeScript, compiled with esbuild before Django can serve it —
see [docs/SETUP.md](docs/SETUP.md#frontend-build-typescript) and
[convert_to_type.md](convert_to_type.md) for why. First-time setup needs both the Python side and the
Node side:

```bash
python3 -m venv venv              # first time only
source venv/bin/activate
pip install Django==5.1.1 django-allauth==65.0.2 openpyxl==3.1.5 python-decouple==3.8 requests==2.32.3

npm install                       # first time only — installs typescript + esbuild

bash dbreset.sh                   # first time only — migrations, superuser, seed the club roster
```

Then, every time you want to run the app:

```bash
bash dev.sh
```

`dev.sh` builds the frontend once, keeps rebuilding it in the background as you edit `.ts` files, and
runs `python3 manage.py runserver` in the foreground. Stop it with Ctrl-C — it cleans up the background
build watcher for you. See [docs/SETUP.md](docs/SETUP.md) if you'd rather run those steps by hand.

See [docs/DATABASE.md](docs/DATABASE.md#resetting-the-database-from-scratch) for what `dbreset.sh` does
and how to recover if it fails partway through (e.g. due to bad data in a CSV).

## Running from PyCharm

1. **Open the project** — `File > Open...` and select the repo root.
2. **Point PyCharm at the venv** — `Settings/Preferences > Project > Python Interpreter > Add Interpreter
   > Existing` and select `venv/bin/python3` (create the venv first via the Quick start steps above if it
   doesn't exist yet).
3. **Run the one-time setup** — open the Terminal tool window (`Alt+F12` / `⌥F12`) and run the `npm
   install` and `bash dbreset.sh` steps from Quick start above. PyCharm's bundled terminal already has the
   venv active once step 2 is done.
4. **Add a run configuration for `dev.sh`** — `Run > Edit Configurations... > + > Shell Script`:
   - Script path: `dev.sh`
   - Working directory: the project root
   - Interpreter: System (or leave default — `dev.sh` activates the venv itself)

   Click OK, then run it from the toolbar like any other configuration. Output (Django log lines +
   esbuild rebuild messages) streams into the Run tool window; stop it with the red square like any other
   run — that sends the same signal `Ctrl-C` would, which `dev.sh` traps to kill the background build
   watcher too.

   (Running `bash dev.sh` directly in the Terminal tool window works identically, if you'd rather not set
   up a run configuration.)