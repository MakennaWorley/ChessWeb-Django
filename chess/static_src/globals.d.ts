/**
 * Ambient globals injected by each page template's Django-rendered inline <script>
 * block, which always loads before the page's compiled bundle (see convert_to_type.md,
 * "Handling the Django-injected inline-script globals").
 *
 * These are declared as bare global `const`s, not `Window` properties: the inline
 * scripts are classic (non-module) <script> tags, so their top-level `const`/`let`
 * bindings live in the shared global lexical scope of the page and are visible to
 * later classic scripts as free identifiers — but they are NOT attached to the
 * `window` object. A bundled IIFE script (what esbuild produces) can still see them
 * because an IIFE only introduces a new inner scope; it doesn't block lookups that
 * climb back out to the page's global scope.
 *
 * Not every page sets every one of these — each page's inline script only sets the
 * subset it needs (see the per-page *PageGlobals interfaces in types.ts for exactly
 * which). tsc can't enforce "this page didn't set X"; only the browser's existing
 * load-order contract does, same as before this conversion.
 */
import type { ManualModelMap, ManualFieldTemplates } from "./types";

declare global {
    const getPlayersUrl: string;
    const getGamesUrl: string;
    const getRatingsSheetUrl: string;
    const getPairingsSheetUrl: string;
    const newPairingsUrl: string;
    const saveGamesUrl: string;
    const modelMap: ManualModelMap;
    const fieldTemplates: ManualFieldTemplates;
}
