# Database

## Data model

All models live in [chess/models.py](../chess/models.py). ChessWeb never hard-deletes rows — most models
use a soft-delete pattern (`is_active` + `end_at`) so that changing a player's rating or a game's result
creates a new row instead of overwriting history.

### Player

The central model. Represents both club members (students) and volunteers (teachers/helpers), toggled by
`is_volunteer`.

| Field | Notes |
|---|---|
| `first_name`, `last_name` | |
| `rating` | Current rating. Clamped to a minimum of 100 everywhere it's set. |
| `beginning_rating` | Rating at the start of the season, used to calculate `improved_rating()`. |
| `grade` | Optional. |
| `lesson_class` | FK to `LessonClass`. A player must belong to an existing class to be assigned one. |
| `active_member` | Whether the player currently attends the club. |
| `is_volunteer` | Volunteers are excluded from ratings sheets and don't have their rating changed by games. |
| `opponent_one/two/three` | Self-referential FKs tracking the player's last 3 opponents, used by the pairing algorithm to avoid rematches. |
| `modified_by` | FK to the `User` who made the change. |
| `is_active` / `end_at` | Soft-delete / history fields — see below. |

Because `edit_player`, `update_rating`, and `delete_player` all mark the current row `is_active=False` and
`end_at=now()` before creating a replacement row, a player's full rating history is just
`Player.objects.filter(first_name=..., last_name=...)` ordered by `created_at`. The "current" row for any
player is always the one with `is_active=True`.

### LessonClass

A teaching group (e.g. "Makenna & Aaron", "Sam"). Requires a `teacher` (a `Player`) and optionally a
`co_teacher`. Follows the same soft-delete/history pattern as `Player`.

### Game

One match on one board on one date. `white` and `black` are nullable FKs to `Player` (a board can be empty,
or have only one side filled in). `result` is one of `White`, `Black`, `Draw`, or `U` (unknown/unplayed).
Follows the same soft-delete/history pattern.

### RegisteredUser

A one-to-one extension of Django's built-in `User` with a single extra flag, `is_director`. Created
automatically whenever a `User` is created, via the signal in [chess/signals.py](../chess/signals.py).

## Resetting the database from scratch

To wipe the SQLite database and rebuild it with migrations, a fresh superuser, and the club's current
volunteer/class/player rosters, use the root-level [`dbreset.sh`](../dbreset.sh) script:

```bash
bash dbreset.sh
```

This runs, in order:

```bash
python3 manage.py makemigrations chess
python3 manage.py migrate
python3 manage.py createsuperuser

python3 manage.py import_data files/volunteers2026.csv files/classes2026.csv files/players2026.csv
```

Walking through what each step does:

1. **`makemigrations chess` / `migrate`** — regenerates and applies migrations. On a truly fresh clone with
   no `db.sqlite3`, `migrate` creates the SQLite file and every table.
2. **`createsuperuser`** — interactive. You'll be prompted for a username, email, and password. This
   account is needed because `import_data` attaches every imported row to a user via `modified_by`, and the
   import script looks up a user named `m` specifically (see below) — plan your username accordingly, or
   edit the importer if you use a different one.
3. **`import_data`** — bulk-loads volunteers, then classes, then players (order matters — see
   [CSV import order](#csv-import-order) below).

`dbreset.sh` does **not** drop `db.sqlite3` first. If you want a truly clean slate rather than an
upsert on top of existing data, delete the database file before running it:

```bash
rm db.sqlite3
bash dbreset.sh
```

The script also has commented-out lines at the bottom for importing historical game/pairing data for
specific dates:

```bash
#python3 manage.py import_game files/pairings9-26-2024.csv 2024-09-26
```

These are left disabled by default since they're season-specific; uncomment the ones you need, or run
`import_game` directly (see [below](#import_game)).

### Why `dbreset.sh` can fail partway through

`import_data` processes CSV rows one at a time and will raise and stop the whole script if a row has bad
data — for example, a `rating` column containing text (`6/23/00`) instead of a number. Rows processed
before the bad one are already committed to the database, so after fixing the CSV you can safely re-run
`bash dbreset.sh`; `update_or_create` means already-imported rows are updated in place rather than
duplicated.

## Management commands

Both importers live in [chess/management/commands/](../chess/management/commands/) and are invoked with
`python3 manage.py <command>`.

### `import_data`

```bash
python3 manage.py import_data <volunteers_csv> <classes_csv> <players_csv>
```

Imports, in this fixed order, because each stage depends on the previous one existing in the database:

1. **Volunteers** (`volunteer_import`) — must run first if any volunteer is also a class teacher.
2. **Classes** (`class_import`) — must run before players if players need to be assigned to a class.
3. **Players** (`player_import`) — must run last so it can look up classes by name.

All three stages use `update_or_create` keyed on name, so re-running the command is safe — existing rows
are updated rather than duplicated, and a `Created ...` / `Updated ...` line is printed per row.

**`volunteers_csv` columns** (see [files/volunteers2026.csv](../files/volunteers2026.csv)):

```
last_name,first_name,rating,beginning_rating,active_member,is_volunteer,parent_or_guardian,email,phone
```

Every imported row is forced to `is_volunteer=True` regardless of the CSV's own value.

**`classes_csv` columns** (see [files/classes2026.csv](../files/classes2026.csv)):

```
teacher,co_teacher
```

`teacher` and `co_teacher` are matched by `first_name` (case-insensitive) against existing `Player` rows,
so the volunteer import must happen first. The class name is auto-generated as `"<teacher> & <co_teacher>"`
or just `"<teacher>"` if there's no co-teacher.

**`players_csv` columns** (see [files/players2026.csv](../files/players2026.csv)):

```
last_name,first_name,rating,beginning_rating,grade,lesson_class,active_member,is_volunteer,parent_or_guardian,email,phone,additional_info
```

`lesson_class` is matched by exact class name (as generated above). If the named class doesn't exist yet,
the player is still created but with no class assigned, and a warning is printed.

**Important CSV gotchas:**

- `rating` and `beginning_rating` must be plain integers — spreadsheet auto-formatting a cell as a date
  (producing something like `6/23/00`) will crash the import with
  `ValueError: Field 'rating' expected a number but got '6/23/00'`.
- `active_member` / `is_volunteer` are parsed as the literal string `"True"`/`"False"` (case-insensitive);
  anything else is treated as `False`.
- All three commands look up `User.objects.get(username='m')` to set `modified_by`. If you create your
  superuser with a different username, either create a user named `m` as well or edit the importer scripts
  to use `settings.AUTH_USER_MODEL` dynamically / your own username.

### `import_game`

```bash
python3 manage.py import_game <game_csv> <date_of_match>
```

Imports a single day's pairing/result sheet. Must be run **after** `import_data`'s player import, since
every row looks up `white`/`black` players by exact `"Last, First"` name match.

**CSV columns** (see [files/pairings9-26-2024.csv](../files/pairings9-26-2024.csv)):

```
Board#,White,Results,Black
```

- `Board#` must match the pattern `<Letter>-<Number>` (e.g. `G-3`).
- `White` / `Black` are `"LastName, FirstName"` or blank.
- `Results` is one of `White`, `Black`, `Draw`, or blank/`NULL`/`None`.

For each row with a decisive result, the command also shifts each player's `opponent_one/two/three`
history (dropping the oldest) so the pairing algorithm knows who they've recently played. It does **not**
recalculate ratings — that only happens through the "Input Results" page in the running app (see
[PAGES.md](PAGES.md#input-results)).

`date_of_match` is passed as a plain string (e.g. `2024-09-26`) and used as-is for every row in that file.

## Starting completely from zero

If you want an empty, un-seeded database (no sample club data at all):

```bash
rm -f db.sqlite3
python3 manage.py makemigrations chess
python3 manage.py migrate
python3 manage.py createsuperuser
```

Then use the "Manual Edit" page in the running app to add your own players, classes, and games — or write
your own CSVs in the formats documented above and run `import_data` yourself.
