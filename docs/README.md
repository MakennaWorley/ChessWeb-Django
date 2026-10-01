# ChessWeb Documentation

ChessWeb is a Django application built for Oakwood Elementary's Chess Club. It tracks players, lesson
classes, and games, calculates Elo-style ratings after each round, and generates the pairing and ratings
spreadsheets the club hands out at meets.

This directory contains the full documentation set. Start here, then jump to the page that matches what
you're trying to do:

| Doc | What it covers |
|---|---|
| [SETUP.md](SETUP.md) | Installing dependencies, configuring `.env`, running the dev server for the first time |
| [DATABASE.md](DATABASE.md) | The data model, resetting the database from scratch, bulk-loading data with `dbreset.sh`, and the CSV formats each importer expects |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Project layout, URL routes, the JSON API endpoints, and how the pairing algorithm works |
| [PAGES.md](PAGES.md) | A walkthrough of every page in the site, including the in-app help text that's shown to club volunteers |

## Quick links

- To wipe and reload the database with sample data: see [DATABASE.md § Resetting the database from scratch](DATABASE.md#resetting-the-database-from-scratch).
- To understand what a specific page does: see [PAGES.md](PAGES.md).
- To find a model field or API route: see [ARCHITECTURE.md](ARCHITECTURE.md).
