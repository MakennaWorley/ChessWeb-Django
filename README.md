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

```bash
source venv/bin/activate
bash dbreset.sh      # resets migrations, creates a superuser, and bulk-loads the club roster
python3 manage.py runserver
```

See [docs/DATABASE.md](docs/DATABASE.md#resetting-the-database-from-scratch) for what `dbreset.sh` does
and how to recover if it fails partway through (e.g. due to bad data in a CSV).