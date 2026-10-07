# Converting ChessWeb's JS to TypeScript

This is the reference doc for migrating every frontend script in this app from plain JavaScript to
TypeScript. **Every subagent working on this conversion must read this file first** and follow it —
its job is to make sure nothing gets silently dropped, renamed-without-a-trace, or behaviorally changed
during the conversion.

**Status: phase 1 (vanilla TS conversion) is complete.** All five files are converted
(`chess/static_src/{types,utils,home,pair,input_results,manual}.ts`), the build pipeline
(`package.json`/`tsconfig.json`/`build.mjs`/`dev.sh`) is in place, `chess/dist/` (the dead prior attempt)
is deleted, and all four pages were verified working in a real browser with zero console errors. The
Manual Edit page's pre-existing "update form doesn't pre-fill values" bug (unrelated to the conversion,
but found during it) has also been fixed — see `applyFieldValue` in `manual.ts`. What's left is still
everything in "Why this is happening now, and what's next" below: Angular, Docker — neither started yet.

## Why this is happening now, and what's next

The user's long-term plan is to eventually replace this frontend with an **Angular app written in
TypeScript**, and to **Dockerize the whole application**. This conversion is phase 1 of that: convert the
existing vanilla-JS page scripts to vanilla TypeScript, compiled with a real build step (not committed
build output), so the tooling and project shape are already compatible with Node being a first-class part
of the stack. Do not jump ahead and build Angular scaffolding now — that's a separate, future task. The
instruction is just: **set this phase up as if Node/a build step will be assumed from here on out**, because
it will be.

Practical implications of that decision:
- Compiled JS output is **not** committed to git. `chess/static/*.js` becomes build output only.
- A `package.json` at the repo root makes Node tooling explicit and reproducible (`npm install`).
- Running the app now requires a build step (`npm run build`) before `python3 manage.py runserver` will
  serve working JS. This is a real change to the dev workflow — document it in `docs/SETUP.md` as part of
  this work (see "Docs to update" below).
- When Docker work happens later, the build step belongs in a multi-stage Dockerfile (a Node stage compiles
  TS → JS, copied into the Python/Django image). Don't build that Dockerfile now — just don't do anything in
  this conversion that would make that harder later (e.g. don't hardcode absolute paths, keep the build
  self-contained and runnable from a clean checkout).

## Critical history: there was already a failed attempt at this

**`chess/dist/`** is not sample data or current build output — it's the leftover compiled output of a
previous, abandoned attempt to convert these same files to TypeScript (see commit `fdae8c7 "TS Not
Working"` in `git log`). Key facts about it:

- It is **not referenced by any template** — `grep -rn "dist" chess/templates/` turns up nothing. The
  `<script src="{% static '...' %}">` tags in every template point at `chess/static/*.js`, never `dist/`.
- It is **gitignored** (`dist/` in `.gitignore`) and untracked — it only exists on this machine.
- It is **broken in a browser**: it was compiled with TypeScript's default/`commonjs` module target, so it's
  full of `Object.defineProperty(exports, "__esModule", ...)`, `require("./appState")`, etc. None of that
  works in a `<script>` tag without a bundler or a CommonJS shim — this is almost certainly *why* the
  previous attempt was abandoned.
- Its file split (`appFunctions`, `appVariables`, `appState`, `appInterfaces`) shows the shape of the
  previous attempt, but don't treat its contents as ground truth — some of it drifted from the current
  `chess/static/*.js` (e.g. it keys pairing-sheet games by a combined `board` field, while current
  `utils.js` already made that change). **Treat `chess/static/*.js` + current `chess/views.py` JSON
  responses as the only source of truth for behavior.**

**Action for this conversion:** once the new TS build is working and verified, delete `chess/dist/`
entirely and correct the description of `dist/` in `docs/ARCHITECTURE.md` (it currently describes it as
"Compiled/bundled copies of the static JS files," which is aspirational, not accurate — that's what *this*
conversion is actually building). Don't delete it before the replacement works; it costs nothing to leave
it until then since it's gitignored and inert.

## The reason this matters: don't repeat the CommonJS mistake

Whatever module system choice is made for the new build, **verify the actual browser output is plain
script-loadable JS**, not Node-style `require`/`exports`. The recommended toolchain below (TypeScript +
esbuild, bundling to IIFE) avoids this by construction — esbuild resolves `import`/`export` at bundle time
and emits a single self-contained script per entry point. If that toolchain changes, re-verify this
property before calling the conversion done.

## Current state inventory (ground truth as of this conversion)

### Files and what loads them

| Template | Scripts loaded, in order |
|---|---|
| `chess/templates/chess/home.html` | inline `<script>` (sets `getPairingsSheetUrl`, `getRatingsSheetUrl`) → `utils.js` → `home.js` |
| `chess/templates/chess/pair.html` | inline `<script>` (sets `getPlayersUrl`, `newPairingsUrl`) → `utils.js` → `pair.js` |
| `chess/templates/chess/input_results.html` | inline `<script>` (sets `getPlayersUrl`, `getGamesUrl`, `saveGamesUrl`) → `utils.js` → `input_results.js` |
| `chess/templates/chess/manual.html` | inline `<script>` (sets `modelMap`, `fieldTemplates`) → `manual.js` (no `utils.js`) |

All four inline scripts are **Django-rendered** — they interpolate `{% url %}` tags and server-side context
(`{{ players|safe }}`, `{{ player_form_json|safe }}`, etc.) directly into JS literals. They cannot become
`.ts` source files themselves (they're templates, not static assets), but every value they produce must be
given a type in `types.ts` so the TS files that consume them are fully typed, not `any`.

### `chess/static/utils.js` (233 lines) — shared helpers, loaded on 3 of 4 pages

Defines, as bare globals (no module wrapper):
- State: `cachedRatings`, `cachedRatingsVolunteers`, `cachedPlayers`, `cachedGames`, `cachedGameDate`
- Constant: `BOARDS` (the ordered list of 55 board labels, `G-1`..`G-5`, `H-1`..`H-6`, `I-1`..`I-22`,
  `J-1`..`J-22`)
- Functions: `formatDate`, `fetchPlayers`, `fetchGames`, `fetchRatingsSheet`, `fetchPairingsSheet`,
  `populatePlayerDropdown`, `handlePlayerSelection`, `generateRatingsSheetHTML`, `generatePairingsSheetHTML`

Depends on globals injected by whichever page's inline script loads it: `getPlayersUrl`, `getGamesUrl`,
`getRatingsSheetUrl`, `getPairingsSheetUrl`, and (implicitly, via `fetchGames`) a `gameDateSelect` DOM
reference that's actually declared in `home.js`, not `utils.js` — this is an existing cross-file ordering
dependency, not a bug to "fix" silently; preserve it (see "Known fragile coupling" below).

### `chess/static/home.js` (39 lines) — Home page

Grabs DOM elements by ID: `data-selection-form`, `ratings_sheet`, `pairings_sheet`, `date-picker`,
`game-date`, `volunteer-toggle`, `help-text`. Wires a `change` handler on the form that toggles between
showing the ratings table and the pairings table, and a `DOMContentLoaded` handler that loads the ratings
sheet by default. Calls `fetchPairingsSheet`/`fetchRatingsSheet` from `utils.js`.

### `chess/static/pair.js` (114 lines) — Pair page

Reads the CSRF token once at top level. On `DOMContentLoaded`, wires: a date-submit button that builds an
empty pairing table via `populatePlayerDropdown`/`BOARDS` (from `utils.js`) and opens a modal; a form submit
that collects board/white/black selections into `gamesData` and POSTs to `newPairingsUrl`; modal-close
handlers (button + click-outside). Note: `gamesData` is assigned without `const`/`let` (implicit global) —
preserve working behavior, but this is exactly the kind of thing TS's `noImplicitAny`/strict mode will flag;
give it a proper typed declaration rather than leaving it implicit.

### `chess/static/input_results.js` (192 lines) — Input Results page

Reads CSRF token at top level. On `DOMContentLoaded`, wires: a date-submit button that either reuses cached
games or fetches them, then renders a results-entry table (white/result/black selects per board) via a
locally-defined `displayGamesInModal`; a `gameResultsForm` submit handler that collects per-board results
and POSTs to `saveGamesUrl`, then builds a detailed success/error alert message from
`added_games`/`deactivated_games`/`updated_games`/`ratings` arrays in the response; modal-close handlers.

Note: this file defines its own `displayGamesInModal` (nested inside the `DOMContentLoaded` callback,
closed over `gamesTableBody`), which is a **different, incompatible signature** from the
`displayGamesInModal(games, gamesTableBody)` found in the old `chess/dist/appFunctions.js` prototype. Follow
the current `chess/static/input_results.js` version — the `dist` one is stale, see above.

### `chess/static/manual.js` (83 lines) — Manual Edit page

Entirely independent of `utils.js`/`BOARDS`/CSRF — this page builds a dynamic add/update/delete form for
Player/Game/LessonClass rows. Depends on two globals injected by `manual.html`'s inline script:
- `modelMap: Record<string, Record<string, string>>` — e.g. `{"player": {"3": "Smith, John", ...}, ...}`,
  id → display-name per model
- `fieldTemplates: Record<string, Record<string, string>>` — field name → raw `<input>`/`<select>`/
  `<textarea>` HTML string per model

Also fetches `/api/get-object-data/?model=&id=` directly (hardcoded URL, not injected — leave as-is unless
asked to change it).

### Known fragile coupling (preserve, don't silently fix)

- `utils.js`'s `fetchGames` references `gameDateSelect`, a `const` declared in `home.js`. This only works
  today because of global-scope `<script>` load order (`utils.js` then `home.js` in the same page) — it is
  not called in a page where `home.js` isn't also loaded. When converting to ES modules, this needs an
  explicit import/parameter rather than relying on global load order, but the *behavior* (which element,
  which page) must stay identical. Flag this as a deliberate fix in the PR notes, not something to quietly
  change in a way that alters behavior.
- `pair.js`'s `gamesData` is an implicit global. Same deal: give it a real declaration, same behavior.

### JSON API shapes relevant to these files (from `chess/views.py`, `chess/urls.py`)

| Endpoint | Method | Request body | Response shape |
|---|---|---|---|
| `/api/get_players` (`get_players`) | GET | — | `{ players: { id: number, name: string }[] }` |
| `/api/get_games` (`get_games`) | GET/POST | `{ game_date: string }` | success: `{ games: { board: string, result: string, white_player: string, black_player: string }[] }`; error: `{ status: "error", message: string }` |
| `/api/get_ratings_sheet` (`get_ratings_sheet`) | POST | `{ show_volunteers: boolean }` | `{ players: { id: number, name: string, rating: string, improved_rating: string, grade: string, lesson_class: string, parent_or_guardian: string, email: string, phone: string }[] }` — note every field is a **string**, including `rating`/`grade`, straight from Django's `str(...)` |
| `/save_games/` (`save_games`) | POST | `{ game_date: string, games: { board: string, white: string, result: string, black: string }[] }` | success: `{ status: "success", message: string, added_games: string[], deactivated_games: string[], updated_games: string[], ratings?: string[] }`; error: `{ status: "error", message: string, ...same optional arrays }` |
| `/new_pairings/` (`new_pairings`) | POST | `{ game_date: string, games: { board: string, whitePlayer: string, blackPlayer: string }[], separate_classes: boolean, pair_janice_class: boolean }` | plain `HttpResponse`, checked via `response.ok` only — no JSON body consumed by the frontend |
| `/api/get-object-data/?model=&id=` (`get_object_data`) | GET | query params | object of field name → value for one row (shape varies by model; type loosely as `Record<string, string \| number \| null>` unless a stricter per-model type is worth the effort) |

Field names in the ratings-sheet response use `snake_case` (`improved_rating`, `lesson_class`,
`parent_or_guardian`) matching the Python dict keys directly — **do not rename these to camelCase** when
typing them; the type must match the wire format exactly, since this is still a plain `fetch` + manual
`JSON.parse`, not a typed client.

## Toolchain

- **TypeScript** for types + `tsc --noEmit` for type-checking (fast, no emit).
- **esbuild** for bundling each page entry point into a single IIFE script the browser can load directly —
  this is what avoids repeating the `dist/` mistake. Each page gets exactly one `<script>` tag, same as
  today.
- No framework, no new runtime dependencies beyond `typescript` and `esbuild` themselves. This is a
  type-safety conversion of existing logic, not a rewrite or a chance to pull in a framework early — that's
  what the eventual Angular move is for.

### Proposed layout

```
package.json                   # new — devDependencies: typescript, esbuild
tsconfig.json                  # new — strict mode on, noEmit (tsc is type-check only; esbuild emits)
build.mjs                      # new — esbuild script, 4 entry points -> chess/static/*.js (IIFE)
chess/static_src/
  types.ts                     # all custom types/interfaces (this file, created now, before conversion starts)
  utils.ts                     # 1:1 port of chess/static/utils.js
  home.ts                      # 1:1 port of chess/static/home.js
  pair.ts                      # 1:1 port of chess/static/pair.js
  input_results.ts             # 1:1 port of chess/static/input_results.js
  manual.ts                    # 1:1 port of chess/static/manual.js
chess/static/
  *.js                         # build output only from here on — gitignore these, keep chess_page_styles.css tracked
```

Keep it a flat 1:1 file mapping (one `.ts` per existing `.js`, same responsibilities) rather than
re-splitting things further — matches how the existing code is organized and keeps the diff reviewable.
`types.ts` is the one exception to "1:1," per the user's explicit request: it's a new file that didn't
exist before, holding every custom interface/type used across the other files (API response/request shapes,
the per-page injected-globals shapes, shared domain types like a board label). Don't scatter `interface`s
across the per-page files if they're shared — put shared ones in `types.ts` and import them.

### Handling the Django-injected inline-script globals

Each page's inline `<script>` block assigns bare globals (`getPlayersUrl`, `modelMap`, etc.) before loading
the page's compiled bundle. Keep this mechanism (don't rearchitect how Django hands data to JS as part of
this conversion — out of scope), but give each page's expected globals a named interface in `types.ts` and
declare them via `declare global { interface Window { ... } }` or a top-level `declare const` block, scoped
per entry file to only the globals that page actually sets. This turns "stringly-typed hope that the
inline script ran first" into something `tsc` actually checks.

## Rules for every subagent doing conversion work

1. **Read this file and the relevant section above for your target file before writing anything.**
2. **1:1 behavior preservation.** Every function, every DOM id/selector touched, every event listener, every
   fetch call (URL, method, headers, body shape) must have an equivalent in the `.ts` version. If something
   looks dead or redundant, leave it and note it in your summary — don't remove it unilaterally.
3. **No new dependencies.** Don't add a framework, a fetch wrapper library, a state-management library, etc.
   Plain `fetch`, typed.
4. **Match wire-format field names exactly** (see the API table above) — the JSON types in `types.ts` must
   use the same casing/keys Django actually sends, even where that's inconsistent (e.g. `improved_rating`
   vs. a hypothetical `improvedRating`).
5. **Strict mode, no `any` escape hatches** unless a value is genuinely untyped at the boundary (e.g.
   `get_object_data`'s response) — then use a precise-as-possible type or a documented `unknown` + narrowing,
   not a blanket `any`.
6. **Fix the two known implicit-global issues** (`gameDateSelect` cross-file reference, `gamesData`) as part
   of modularizing with `import`/`export`, but preserve identical runtime behavior — call this out
   explicitly when you do it.
7. **Don't touch `chess/dist/`** until the full new build is verified working on all four pages — then
   delete it in its own clearly-labeled step, and fix its description in `docs/ARCHITECTURE.md`.
8. **Verify in a browser**, not just `tsc`/`esbuild` exiting cleanly. Run the dev server (see
   `docs/SETUP.md`), log in, and click through: Home (both ratings and pairings views, volunteer toggle),
   Pair (create a pairing), Input Results (enter a result, check the success alert text), Manual (add/
   update/delete each of the three models). Compare against current `main` behavior if anything's unclear.
9. **Update docs as part of the work, not as an afterthought:** `docs/SETUP.md` needs an "install Node
   deps + build the frontend" step added to first-time setup; `docs/ARCHITECTURE.md`'s project-layout
   section and its `dist/` description need correcting once `dist/` is replaced for real.

## Suggested order of work

1. `types.ts` (this turn — already done before conversion starts).
2. `package.json`, `tsconfig.json`, `build.mjs` — get an empty/no-op build pipeline running end to end first.
3. `utils.ts` (everything else depends on it).
4. `manual.ts` (fully independent — good isolated second file).
5. `home.ts`, `pair.ts`, `input_results.ts` (each depends on `utils.ts`).
6. Wire templates: confirm `{% static '...' %}` tags still resolve to the right build output filenames.
7. Full manual browser pass on all four pages (step 8 above).
8. Delete `chess/dist/`, fix `docs/ARCHITECTURE.md`, add the build step to `docs/SETUP.md`.
