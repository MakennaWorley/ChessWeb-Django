# Architecture

## Project layout

```
website/           Django project (settings, root urls, wsgi/asgi)
chess/             The one Django app containing all functionality
  models.py        Player, LessonClass, Game, RegisteredUser
  views.py         Page views + JSON API endpoints
  forms.py         Django forms (login, signup, game/player/class forms)
  signals.py       Auto-creates a RegisteredUser whenever a User is created
  write_to_file.py Generates the .xlsx ratings/pairings/export spreadsheets
  admin.py         Django admin registration for all models
  management/commands/
    import_data.py   Bulk CSV import: volunteers, classes, players
    import_game.py   Bulk CSV import: one day's games/pairings
  templates/chess/ One HTML template per page (see PAGES.md)
  static_src/       TypeScript source for the page scripts (types.ts, utils.ts, home.ts, pair.ts,
                    input_results.ts, manual.ts) — see /convert_to_type.md for the conversion notes
  static/           Build output only: home.js/pair.js/input_results.js/manual.js are esbuild bundles
                    compiled from chess/static_src/*.ts (gitignored, not committed — run `npm run build`)
                    + chess_page_styles.css (hand-written, committed)
files/              CSV data, Excel templates (Pairing/Ratings/Export), and generated output folders
  ratings/          Generated ratings spreadsheets land here
  pairings/         Generated pairing spreadsheets land here
dbreset.sh          Convenience script: migrate + createsuperuser + bulk import (see DATABASE.md)
```

The project has a single Django app (`chess`) — there's no multi-app split.

## Routing

Root URLs ([website/urls.py](../website/urls.py)) just include the app's URLs and the Django admin.
Everything else is defined in [chess/urls.py](../chess/urls.py).

### Pages

| URL | Name | View | Auth |
|---|---|---|---|
| `/` | `login` | `login_view` | public |
| `/signup/` | `signup` | `signup_view` | public |
| `/logout/` | `logout` | Django's `LogoutView` | — |
| `/home/` | `home` | `home_view` | required |
| `/input_results/` | `input_results` | `input_results_view` | required |
| `/pair/` | `pair` | `pair_view` | required |
| `/manual/` | `manual` | `manual_view` | required |
| `/password_reset/` + related | — | Django's built-in auth views | public |

### JSON API (all under `/api/`, all require login)

| URL | View | Purpose |
|---|---|---|
| `GET /api/get_players` | `get_players` | List active members for dropdowns |
| `POST /api/player/add/` | `add_player` | Create a player |
| `POST /api/player/update/<id>/` | `update_player` | Patch arbitrary fields on a player |
| `DELETE /api/player/delete/<id>/` | `delete_player` | Hard-delete a player row |
| `GET/POST /api/get_games` | `get_games` | List games for a given date |
| `POST /api/game/add/` | `add_game` | Create a game |
| `POST /api/game/update/<id>/` | `update_game` | Patch arbitrary fields on a game |
| `DELETE /api/game/delete/<id>/` | `delete_game` | Hard-delete a game row |
| `POST /api/class/add/` | `add_class` | Create a lesson class |
| `POST /api/class/update/<id>/` | `update_class` | Patch arbitrary fields on a class |
| `DELETE /api/class/delete/<id>/` | `delete_class` | Hard-delete a class row |
| `POST /api/get_ratings_sheet` | `get_ratings_sheet` | JSON data backing the Home page's ratings table |
| `GET /api/export_player_data` | `export_player_data` | Downloads an .xlsx export of all active players |
| `GET /api/get-object-data/?model=&id=` | `get_object_data` | Fetch one row's full field data (used by the Manual Edit page to pre-fill the edit form) |

Note: `add_player`/`add_game`/`add_class`/`update_*`/`delete_*` are `@csrf_exempt` — they rely on
`login_required` and are only ever called from the site's own JS via `fetch`/the Manual page's
server-side proxy (see [PAGES.md § Manual Edit](PAGES.md#manual-edit)), not exposed as a public API.

### Downloads

| URL | View | Purpose |
|---|---|---|
| `/download_ratings/` | `download_ratings` | Build and download a fresh ratings `.xlsx` |
| `/download_existing_ratings_sheet/?file=` | `download_existing_ratings_sheet` | Download a previously generated ratings file from `files/ratings/` |
| `/download_player_data` | `download_player_data` | Build and download the full player data export |
| `/download_pairings/` (POST) | `download_pairings` | Build and download a pairings `.xlsx` for a chosen date |

## Rating calculation

Ratings use a simplified Elo formula, defined as inline lambdas in
[chess/views.py](../chess/views.py):

```python
CALC_EXPECTED = lambda player_rating, opponent_rating: 1 / (1 + 10 ** ((opponent_rating - player_rating) / 400))
RATINGS_HELPER = lambda rating, result, expected: round(rating + 32 * (result - expected))
```

`result` is `1` for a win, `0.5` for a draw, `0` for a loss, fed in from the `save_games` view once a game's
result is recorded on the Input Results page. A K-factor of 32 is used for every player. If either side of
a game is a volunteer, the student's rating is left unchanged entirely (volunteers act as "practice"
opponents).

Ratings are never allowed to go below 100 — enforced in `Player.add_player`, `edit_player`, and
`update_rating`.

## Pairing algorithm

Implemented by the recursive `pair()` function in [chess/views.py](../chess/views.py) (design notes also
kept in [files/pairings_notes.txt](../files/pairings_notes.txt)):

1. Any games the user has manually created beforehand are excluded from the pool, and their players marked
   paired.
2. Remaining unpaired players are sorted by rating (descending), grade, then name.
3. `pair()` takes the first (highest-rated) unpaired player and scans the rest of the list for the first
   player who (a) isn't one of their last 3 opponents (`opponent_one/two/three`) and (b) has a rating within
   30 points. That's a greedy, not globally-optimal, matching.
4. If a match is found, both players are removed from the pool and the match recorded; if not, the lone
   player is given a bye (no opponent) and removed. Either way, `pair()` recurses on what's left.
5. `get_pair_placement()` / `get_player_placement()` decide who plays White vs. Black for a found pair,
   alternating based on each player's most recent game so the same player doesn't repeatedly play the same
   color.
6. If "Pair Janice's class separately" is checked, Janice's and Cedar's class rosters are paired
   independently from everyone else before being merged back into one set of games.
7. "Pair Janice's class?" is a separate, independent toggle (checked by default) that controls whether
   Janice's class participates in pairing at all: unchecked, every player in Janice's class is dropped from
   the pool before pairing runs and gets no game that day, regardless of the "separately" checkbox. Checked
   (the default), Janice's class is included — and the "separately" checkbox then decides whether it's
   mixed into the general pool or paired on its own.

The resulting pairings are saved as new `Game` rows (`result=''`, i.e. unplayed) and later get their result
filled in on the Input Results page, which is what actually triggers the rating recalculation above.
