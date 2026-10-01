# Pages

Every page except Login and Sign Up extends [base.html](../chess/templates/chess/base.html), which provides
the nav bar, the footer (contact email/phone + credit), and the welcome banner shown to logged-in users:

> ChessWeb is a web based application designed for Oakwood Elementary's Chess Club with the main purpose of
> simplifying the process of updating ratings and pairing the members. It is designed and maintained by
> Makenna Worley using the Django framework.

The nav bar links to Admin (superusers only), Home, Manual Edit, Input Results, and Pair A Round, plus a
Log Out button.

## Login — [login.html](../chess/templates/chess/login.html)

URL: `/` (name: `login`)

A standard username/password form (`AuthenticationForm`) with a link to Sign Up. No app-specific help text
— this is the entry point for every session.

## Sign Up — [signup.html](../chess/templates/chess/signup.html)

URL: `/signup/` (name: `signup`)

Creates a new Django `User` via `SignUpForm` (first name, last name, username, email, password x2). On
success the user is logged in immediately and a `RegisteredUser` row is created for them. Has a link back
to Login.

## Home — [home.html](../chess/templates/chess/home.html)

URL: `/home/` (name: `home`)

The main data browser. A radio toggle at the top switches the view between **Ratings** and **Pairings**;
when Ratings is selected, a second toggle controls whether volunteers are included. When Pairings is
selected, a date dropdown (populated from every date that has games) appears instead.

In-app help text shown on this page:

> Here are the ratings of the players as stored in the database. This is currently **NOT** displaying
> volunteers' ratings.

> To add any new players, classes, or games please click the plus icon to the right. Please keep in mind
> you must have the teacher in the database **BEFORE** you create the class and you must also have the
> class created **BEFORE** adding a player to the class. If you add a game via the plus icon and need to
> put in a result, you **MUST** use the "Input Results" section.

> To edit any player data, you can click the pencil icon located on the right of the player row. If you
> need to update game data, please use the "Input Results" section since it already does that
> functionality. When editing game data, please be cautious since this can affect player ratings! Undo
> functionality coming in Release 1.2.

> To delete any data, please click the trashcan icon located on the right side of any row. Keep in mind
> deleting a game does **NOT** reset the players ratings to before the game result was added. Undo
> functionality coming in Release 1.2.

The actual table is rendered client-side by [home.js](../chess/static/home.js) from the
`get_ratings_sheet` / `get_games` JSON endpoints, and offers inline add/edit/delete via the plus, pencil,
and trashcan icons mentioned above.

## Input Results — [input_results.html](../chess/templates/chess/input_results.html)

URL: `/input_results/` (name: `input_results`)

Has two sections:

**Update Game Results** — pick a date, click "Open Pairings" to load that day's board assignments into a
modal, fill in each board's result, and submit. In-app help text:

> To update the results of a previously paired pairing sheet or make changes to the pairings sheet, select
> the date of those games and click "Open Pairings". Make sure to hit "Submit Results" to save your
> changes!

> After the success message pops up with a brief summary for which boards were updated and who's ratings
> have changed, you can now download the ratings sheet and pair your next set of games in "Pair"!

> **If you put in the result wrong and change it in this form, the ratings will be off. Do NOT do this,
> undo functionality coming in Release 1.2, until then contact me!**

> **If you pair a student vs volunteer the student's rating will NOT change!**

Inside the modal:

> Players can only play one game per meet! If a board was empty or a player did not make it, scroll to the
> bottom of the list of players to find "N/A" which will remove that player/game from the database.

**Download Ratings Sheet** — three actions: generate-and-download a fresh ratings spreadsheet, download a
previously-generated one from a dropdown of existing files, or export full player data.

> Below is where you can download the ratings sheets either:
> - Create a new ratings sheet with the most recent changes you have made
> - Download a previously existing rating sheet

> Click the button below to export all data from the database on active, non-volunteers players

Submitting the results form calls `save_games`, which both persists the `Game` rows and triggers the Elo
rating recalculation described in [ARCHITECTURE.md](ARCHITECTURE.md#rating-calculation).

## Pair — [pair.html](../chess/templates/chess/pair.html)

URL: `/pair/` (name: `pair`)

**Make Pairing Sheet** — pick a date, optionally pre-assign specific boards manually, then run the pairing
algorithm for everyone else.

> To make a pairing sheet, first select the date that the games will be played. If you want certain players
> to play this time you **MUST** manually add these games with **BOTH** players to a particular board and
> **THEN** hit the "Pair!" button. Failing to do this will **NOT** create the game before the pairing
> algorithm runs.

> If you have already submitted the pairing sheet and realized you have made a mistake, you need to use the
> "Input Results" tab's Update Game Results to fix this. Do **NOT** use the Make Pairing Sheet again!

> After the success message, you can now download the pairings sheet!

Inside the modal: "Players can only play one game per meet!" There's also a checkbox, "Pair Janice's class
separate?", which runs that class's pairing independently (see
[ARCHITECTURE.md § Pairing algorithm](ARCHITECTURE.md#pairing-algorithm)).

**Download Pairing Sheet** — pick a date and download the current state of that day's board assignments as
an `.xlsx`.

> When downloading a pairings sheet, it will **ALWAYS** download what is in the database at the moment you
> hit download. This does **NOT** save older versions of the pairing sheet for that date!

## Manual Edit — [manual.html](../chess/templates/chess/manual.html)

URL: `/manual/` (name: `manual`)

A low-level admin form for directly adding/updating/deleting a `Player`, `Game`, or `LessonClass` row,
intended as a fallback for edits the Home/Pair/Input Results pages don't cover. The form picks Action
(Add/Update/Delete) and Model (Player/Game/Class), then renders the matching fields client-side via
[manual.js](../chess/static/manual.js) using JSON blobs of existing rows and form field templates passed in
from the view.

Submitting POSTs back to this same page server-side, which then relays the request to the matching
`/api/<model>/<action>/` JSON endpoint internally (via `requests`, forwarding the user's session cookie)
and shows a success/error message inline — see `manual_view` in
[chess/views.py](../chess/views.py).
