# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

INFERNVS: a static, no-framework 3D cutaway of Dante's *Inferno* (Three.js r128). Every soul, guardian, place and event is a data point cited by canto and line. It is presented as a **data visualization of the text** (not a "map of Hell"), because it is shown on the owner's professional profile; keep copy and framing in that register.

## Commands

No tests, linter or dependencies; Node is only used for the build script.

```bash
npm run dev            # build dist/ and serve at http://localhost:5173
npm run build          # dist/ with Three.js loaded from cdnjs
npm run build:vendor   # dist/ with Three.js copied to dist/vendor/ (use this for deploys)
```

The page `fetch()`es its JSON, so `file://` does not work; always serve over HTTP. `dist/` is gitignored and wiped on every build.

## Architecture

- **`src/index.html` is a fragment** ("artifact form": no `<html>`/`<head>`). `tools/build.mjs` wraps it in a doctype/head, hoists its `<title>`, optionally rewrites the cdnjs script URL (the string match is exact, so keep that `<script src>` unchanged), and copies the two JSON files beside it. Edit `src/`, never `dist/`.
- **It is one ~1,150-line file with two `<script>` blocks**: a sprite engine (`buildPix`, turns `sprites.json` into a single canvas texture atlas) and a map engine (one IIFE: `buildEarth`, `buildLevels`, `buildLandmarks`, `buildPath`, `buildMarkers`, plus state in `setCanto`/`selectNode`/`selectLevel`). Markers are one `THREE.Points` draw call whose shader samples the sprite atlas.
- **Data drives everything** (`src/inferno.json`: `meta`, `levels`, `path`, `nodes`, `edges`; `src/sprites.json`: `palette`, `base`, `mods`, `templates`, `sprites`, `kindDefaults`). Nodes reference levels by `lv` and sprites by `icon`; edges can end on a node id or a level id.
- **Tableaux** (`inferno.json` `tableaux`) are animated scenes tied to a level: `{ id, lv, sprite, how, count, lane, speed, size, cite, conf, note }`, where `how` is `march`, `bob`, `fall`, `flicker` or `flow` (floor scroll, no sprite). `conf` follows the same rule as nodes; movement is staging, so say so in `note`. They are skipped when the OS asks for reduced motion; add `?motion` to the URL to force them on, and `?debug` mirrors their state into `document.documentElement.dataset.inf`.
- **Bad data is skipped, not fatal**: nodes with an unknown level, edges with a missing end, and unknown sprite mods log a `console.warn` and are dropped. When editing data, check the browser console, since a typo silently removes a point.
- **Coordinates are polar** around the funnel axis (`lv`, `a`, `r`, `h`; `y`/`rad` override). Keep `a` out of the cut wedge, 140-200 degrees. The first Roman numeral of a node's `cite` is the canto that unlocks it on the journey, so changing a citation changes when the point appears.
- All paths are relative, so the site works at a domain root or in a subfolder. Everything is same-origin static files plus cdnjs and Google Fonts.

## Content rules (these matter more than code style)

- Citations are canto + line. `docs/RESEARCH.md` is the verification log; about ten line numbers are still unconfirmed (listed near its end). Do not "fix" a quote or line number from memory; verify it against Longfellow (Project Gutenberg #1001) or leave it flagged.
- English quotes are Longfellow 1867 only (public domain). Do not add quotes from modern translations (Ciardi, Mandelbaum, Pinsky, etc.).
- Keep the `conf` field honest: `text` for what Dante states, `interp` for interpretation.

## Planned work

See `docs/ROADMAP.md` (animated tableaux, hover cards). Anything not in that file is not planned for this repo. This repo ships only the cited book edition.

## Deployment

Public repo `NooRotic/inferno-map`; the site is served at `inferno.pollardjr.com` via GitHub Pages (use `npm run build:vendor`). Commit as `NooRotic <371508+NooRotic@users.noreply.github.com>` (set in the repo's local git config) so the personal email stays out of public history.
