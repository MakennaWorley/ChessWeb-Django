// Bundles each ChessWeb page entry point (TypeScript, ES modules) into a single
// browser-loadable IIFE script per page, output alongside the other static assets.
// Run `npm run typecheck` separately (or let `npm run build` fail fast below) —
// esbuild only transpiles/bundles, it does not type-check.
//
// See /convert_to_type.md for why this exists and why build output isn't committed.
import { build, context } from "esbuild";
import { execSync } from "node:child_process";

const watch = process.argv.includes("--watch");

const entryPoints = {
    home: "chess/static_src/home.ts",
    pair: "chess/static_src/pair.ts",
    input_results: "chess/static_src/input_results.ts",
    manual: "chess/static_src/manual.ts",
};

const options = {
    entryPoints,
    outdir: "chess/static",
    bundle: true,
    format: "iife",
    target: "es2020",
    sourcemap: true,
    logLevel: "info",
};

if (!watch) {
    execSync("npx tsc --noEmit", { stdio: "inherit" });
}

if (watch) {
    const ctx = await context(options);
    await ctx.watch();
    console.log("Watching chess/static_src for changes...");
} else {
    await build(options);
}
