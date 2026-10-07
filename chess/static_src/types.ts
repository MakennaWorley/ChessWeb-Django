/**
 * Shared type definitions for every ChessWeb page script.
 *
 * See /convert_to_type.md for the conversion this file is part of. Field names on API
 * request/response types match the JSON actually sent by chess/views.py exactly (including
 * casing) — they are not renamed for style, since both sides are plain fetch/JsonResponse,
 * not a generated/typed client.
 */

/** One of the 55 board labels, e.g. "G-1", "H-6", "I-22", "J-1". */
export type BoardLabel = string;

/** A game result as stored/sent by the backend. */
export type GameResult = "White" | "Black" | "Draw" | "NONE" | "U" | "";

// ---------------------------------------------------------------------------
// GET /api/get_players
// ---------------------------------------------------------------------------

export interface PlayerOption {
    id: number;
    name: string;
}

export interface GetPlayersResponse {
    players: PlayerOption[];
}

// ---------------------------------------------------------------------------
// GET/POST /api/get_games
// ---------------------------------------------------------------------------

export interface GetGamesRequest {
    game_date: string;
}

export interface GameRow {
    board: BoardLabel;
    result: GameResult;
    white_player: string;
    black_player: string;
}

export interface GetGamesSuccessResponse {
    games: GameRow[];
}

export interface ApiErrorResponse {
    status: "error";
    message: string;
}

export type GetGamesResponse = GetGamesSuccessResponse | ApiErrorResponse;

// ---------------------------------------------------------------------------
// POST /api/get_ratings_sheet
// ---------------------------------------------------------------------------

export interface GetRatingsSheetRequest {
    show_volunteers: boolean;
}

/**
 * Every field here is a string as sent by the server (Django does `str(...)` on
 * rating/grade before putting them in the JSON) — do not narrow rating/grade to number.
 */
export interface RatingsPlayerRow {
    id: number;
    name: string;
    rating: string;
    improved_rating: string;
    grade: string;
    lesson_class: string;
    parent_or_guardian: string;
    email: string;
    phone: string;
}

export interface GetRatingsSheetResponse {
    players: RatingsPlayerRow[];
}

// ---------------------------------------------------------------------------
// POST /save_games/
// ---------------------------------------------------------------------------

export interface SaveGamesRequestGame {
    board: BoardLabel;
    white: string;
    result: GameResult;
    black: string;
}

export interface SaveGamesRequest {
    game_date: string;
    games: SaveGamesRequestGame[];
}

export interface SaveGamesSuccessResponse {
    status: "success";
    message: string;
    added_games: string[];
    deactivated_games: string[];
    updated_games: string[];
    ratings?: string[];
}

export interface SaveGamesErrorResponse {
    status: "error";
    message: string;
    added_games?: string[];
    deactivated_games?: string[];
    updated_games?: string[];
    ratings?: string[];
}

export type SaveGamesResponse = SaveGamesSuccessResponse | SaveGamesErrorResponse;

// ---------------------------------------------------------------------------
// POST /new_pairings/
// ---------------------------------------------------------------------------

export interface NewPairingsRequestGame {
    board: BoardLabel;
    whitePlayer: string;
    blackPlayer: string;
}

export interface NewPairingsRequest {
    game_date: string;
    games: NewPairingsRequestGame[];
    separate_classes: boolean;
    pair_janice_class: boolean;
}

// new_pairings returns a plain HttpResponse; the frontend only checks response.ok, no body type needed.

// ---------------------------------------------------------------------------
// GET /api/get-object-data/?model=&id=  (Manual Edit page)
// ---------------------------------------------------------------------------

/** Shape varies by model (player/game/class); field values are whatever that model's form fields hold. */
export type ObjectData = Record<string, string | number | boolean | null>;

export type ManualModelName = "player" | "game" | "class";

/** modelMap[model] = { [rowId: string]: displayName } */
export type ManualModelMap = Record<ManualModelName, Record<string, string>>;

/** fieldTemplates[model] = { [fieldName: string]: rawInputHtml } */
export type ManualFieldTemplates = Record<ManualModelName, Record<string, string>>;

export type ManualAction = "add" | "update" | "delete";

// ---------------------------------------------------------------------------
// Shared in-page cache state (mirrors the module-level `cached*` globals in utils.js)
// ---------------------------------------------------------------------------

export interface AppCacheState {
    cachedRatings: RatingsPlayerRow[] | null;
    cachedRatingsVolunteers: boolean;
    cachedPlayers: PlayerOption[] | null;
    cachedGames: GameRow[] | null;
    cachedGameDate: string | null;
}

// ---------------------------------------------------------------------------
// Per-page globals injected by each template's Django-rendered inline <script> block.
// These are declared here as named interfaces; each entry file should narrow
// `declare global { interface Window { ... } }` (or equivalent) to only the subset
// the page it belongs to actually sets. See "Handling the Django-injected inline-script
// globals" in /convert_to_type.md.
// ---------------------------------------------------------------------------

/** Globals set by home.html's inline <script>. */
export interface HomePageGlobals {
    getPairingsSheetUrl: string;
    getRatingsSheetUrl: string;
}

/** Globals set by pair.html's inline <script>. */
export interface PairPageGlobals {
    getPlayersUrl: string;
    newPairingsUrl: string;
}

/** Globals set by input_results.html's inline <script>. */
export interface InputResultsPageGlobals {
    getPlayersUrl: string;
    getGamesUrl: string;
    saveGamesUrl: string;
}

/** Globals set by manual.html's inline <script>. */
export interface ManualPageGlobals {
    modelMap: ManualModelMap;
    fieldTemplates: ManualFieldTemplates;
}
