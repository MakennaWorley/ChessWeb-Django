# ChessWeb

> **Status: Archived as of October 6, 2026.** This repository is retired as its own MVP, not under active
> development. Work is moving toward a complete overhaul into an official product for chess clubs beyond
> Oakwood Elementary's — see "What's next" below. The code here still works and is free to clone, run, or
> fork; it just won't grow new features in this repo.

ChessWeb is a tool for running the week-to-week paperwork of a scholastic chess club: who's playing whom,
what happened in each game, and whose rating went up or down because of it.

## Where this came from

This started as the final project for a college Database Systems class — a PHP/MySQL ("LAMP stack")
version, built to satisfy a class assignment. This repository is a full rebuild of that idea on
[Django](https://www.djangoproject.com/), grown well past a class project into the actual tool a real
chess club uses every week.

## What this project is

This repository is a **minimum viable product, built specifically for Oakwood Elementary's Chess Club** —
not a general-purpose platform for any club. It assumes exactly one club, and it's a tool for the club's
**director and assistant director(s)** specifically — not every volunteer who helps run a meet gets a
login, just the one or two people actually managing the roster, pairings, and results. A handful of
Oakwood-specific details are also written directly into the code (two of the club's teachers are
referenced by name in the pairing logic, for instance, not as a configurable setting). That scope was a
deliberate, reasonable choice for an MVP solving one real club's actual problem — it's just not something
to assume carries over if you're adapting this for a different club.

## What's next

ChessWeb is being completely overhauled into an official product for chess clubs beyond Oakwood
Elementary's — any club, not just this one. That's a bigger undertaking than this repository's scope, and
is happening as a separate effort going forward rather than as more commits here. The target is a live
beta before 2027.

## What ChessWeb actually does

### The problem it solves

Every club meet needs a few things: a list of who's playing whom and on which board (a "pairing sheet"),
a way to record who won each game, and an updated ranking of every player once results come in. Doing all
of that by hand on paper — especially trying to keep games evenly matched by skill and avoid the same two
kids playing each other every week — gets tedious fast. ChessWeb automates it.

### The four things a director does in ChessWeb

1. **Pair a round** (the *Pair* page) — pick a date, and ChessWeb automatically matches players up:
   closest in rating, never one of their last three opponents, highest-rated players matched first. If a
   specific matchup needs to happen (a pre-arranged game, say), it can be locked in by hand first, and
   everyone else gets paired automatically around it. Two of the club's classes can optionally be paired
   separately from everyone else, or skipped for a given week entirely.
2. **Enter results** (the *Input Results* page) — once games are played, open that day's pairing sheet and
   record who won each board (White, Black, or Draw). Submitting automatically triggers the rating
   recalculation described below — there's nothing separate to run.
3. **Browse ratings and past pairings** (the *Home* page) — the club's current ranked list of players, or
   any past date's pairings and results.
4. **Everything else** (the *Manual Edit* page) — a catch-all form for adding a new player, class, or game
   by hand, fixing a mistake, or removing something — for whatever the three pages above don't cover.

Every page also offers an Excel download — a printable pairing sheet for meet day, or a full ratings
export — since physical printouts are still how these get handed out at an elementary school club.

### How ratings are calculated

ChessWeb uses a simplified version of the Elo rating system — the same style of system used in
competitive chess, just simplified. Every game nudges both players' ratings based on the result and how
big the gap between their ratings already was: beating someone rated much higher than you earns more than
beating someone rated much lower, and draws split the difference. Volunteers who play just to fill out a
board don't have their own rating affected either way, and no player's rating is ever allowed to drop
below 100.

### How pairing works

For a given date, ChessWeb sorts every unpaired player by rating, highest first, then works down the list
matching each player with the closest-rated opponent available who isn't one of their last three
opponents — so the same two players don't keep facing each other week after week. Anyone who can't be
matched (an odd number of players, most often) gets a bye for that round instead.

## Project structure, for anyone poking around the code

This is a Django application with a single app (`chess`) and a TypeScript frontend
(`chess/static_src/`) compiled to plain JS before Django serves it (see `dev.sh`/`build.mjs`). The data
model, every URL/API route, and the pairing/rating algorithms are documented in detail in
[docs/](docs/README.md) — that's the place to go for anything beyond this overview, including as a
starting point for an AI coding assistant to orient itself in this codebase if you're using one to make
changes.

## Running it yourself

### Requirements

- Python 3.12 and Node.js (for the frontend build)
- A virtual environment at `venv/` in the repo root

### First-time setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install Django==5.1.1 django-allauth==65.0.2 openpyxl==3.1.5 python-decouple==3.8 requests==2.32.3

npm install              # installs the frontend build tooling (typescript + esbuild)

bash dbreset.sh          # runs migrations, creates a superuser, and seeds the club roster
```

`dbreset.sh` will prompt you to create a superuser account interactively — that's your login once the
server is running. See [docs/DATABASE.md](docs/DATABASE.md#resetting-the-database-from-scratch) for what
it does in detail and how to recover if it fails partway through (e.g. bad data in a CSV).

You'll also need a `.env` file in the repo root — see
[docs/SETUP.md](docs/SETUP.md#environment-variables) for the required/optional variables.

### Every time after that

```bash
bash dev.sh
```

This builds the frontend, keeps rebuilding it in the background as you edit any `.ts` file, and runs
`python3 manage.py runserver` in the foreground. Visit `http://127.0.0.1:8000/` and log in with the
superuser account from setup. Stop it with Ctrl-C — it cleans up the background build watcher for you.

### Running from PyCharm

1. **Open the project** — `File > Open...` and select the repo root.
2. **Point PyCharm at the venv** — `Settings/Preferences > Project > Python Interpreter > Add Interpreter
   > Existing` and select `venv/bin/python3` (create it first via "First-time setup" above if it doesn't
   exist yet).
3. **Run the one-time setup** — open the Terminal tool window (`Alt+F12` / `⌥F12`) and run the `npm
   install` and `bash dbreset.sh` steps above. PyCharm's bundled terminal already has the venv active once
   step 2 is done.
4. **Add a run configuration for `dev.sh`** — `Run > Edit Configurations... > + > Shell Script`:
   - Script path: `dev.sh`
   - Working directory: the project root
   - Interpreter: System (or leave default — `dev.sh` activates the venv itself)

   Run it from the toolbar like any other configuration. Output (Django log lines + esbuild rebuild
   messages) streams into the Run tool window; stop it with the red square — that sends the same signal
   Ctrl-C would, which `dev.sh` traps to kill the background build watcher too.

   (Running `bash dev.sh` directly in the Terminal tool window works identically, if you'd rather not set
   up a run configuration.)

## Can I use this for my own club?

Yes — this code is free to use for any club, at no cost, for as long as this repository exists. Keep in
mind it was built around one specific club's setup (see "What this project is" above), so expect to need
to adjust a few hardcoded details — the two teacher names referenced in the pairing logic in particular —
for your own club's roster.

Adjustments and support here are limited going forward, since attention is on building the actual product
described in "What's next" above rather than this repo. Some features that land in that product will be
exclusive to it and won't be brought back here. If that's a dealbreaker, keep an eye out for the beta
rather than building long-term plans on top of this repository as-is.
