# INFERNVS — a cutaway map of Dante's Hell

A 3D, museum-style cutaway of the Earth showing Hell as Dante builds it in the *Inferno*: a funnel under Jerusalem narrowing to Lucifer at the planet's center, with a hidden tunnel up to Mount Purgatory on the far side. Every soul, guardian, place and event is a data point cited by canto and line.

- Live: _deployment pending_
- Stack: plain HTML + vanilla JS + Three.js r128. No framework, no bundler, no runtime dependencies beyond Three.js and Google Fonts.

## Repo layout

```
src/
  index.html      The app: CSS + markup + two <script> blocks (sprite engine, map engine). "Artifact form": no <html>/<head>.
  inferno.json    The data: levels, journey path, 130 points, 37 links.
  sprites.json    The pixel art: palette, person generator parts, templates, 110 sprites.
tools/build.mjs   Wraps src/index.html into a standalone page in dist/ (adds doctype/head). Optional --vendor.
vendor/three-r128 Three.js r128 (MIT) for self-hosting without a CDN.
docs/RESEARCH.md  Sources, modelling decisions, and the citation verification log.
docs/ROADMAP.md   Future work: animated "torment tableaux" and rollover cards.
```

## Run it locally

The page `fetch()`es its two JSON files, so it must be served over HTTP (opening the file directly with `file://` fails).

```bash
npm run dev            # builds dist/ and serves it at http://localhost:5173
# or, with nothing installed but Python:
node tools/build.mjs && cd dist && python3 -m http.server 5173
```

`npm run build` keeps Three.js on cdnjs (identical to the artifact). `npm run build:vendor` copies Three.js into `dist/vendor/` so the site has no third-party script host.

## Deploy to your own static host

`dist/` is the whole site: `index.html`, `inferno.json`, `sprites.json` (+ `vendor/three.min.js` if vendored). All paths are relative, so it works at a domain root or in a subfolder (e.g. `https://inferno.example.com/` or `https://example.com/inferno/`).

```bash
npm run build:vendor
rsync -avz --delete dist/ user@yourhost:/var/www/inferno/     # or SFTP/FTP the dist/ folder
```

Host checklist:
- Serve `.json` as `application/json` (default on nginx/Apache/Caddy).
- Turn on gzip/brotli: the JSON and HTML compress ~5–8×.
- HTTPS recommended (Google Fonts and cdnjs are HTTPS; mixed content blocks them on an HTTP page).
- Caching: long cache for `vendor/`, short or revalidate for `index.html` and the JSON so data edits show up.
- No server code, database, or CORS setup needed: everything is same-origin static files.

## How the code is organized (src/index.html)

1. **CSS tokens** (`:root`): vellum, ink, rubric red, gold, lapis; Cinzel + EB Garamond. Single dark "lamplit" theme by design.
2. **Sprite engine** (`buildPix(spec)`): turns `sprites.json` into one texture atlas (canvas), with automatic centering and a 1px outline. Exposes `index`, `resolve(name, kind)` and `url(name)` (data-URL for HTML icons).
3. **Map engine** (one IIFE):
   - `buildEarth()`: the globe as a 300° lathe (60° wedge cut away at 140°–200°), two strata-textured section faces traced from the funnel profile, the tunnel carved into the 200° face, Purgatory at the antipode.
   - `buildLevels()`: each level is a lathe ring (floor) + cliff wall, with its own material so it can be tinted and faded.
   - `buildLandmarks()`: hill, Dark Wood, gate, castle, Dis walls and towers, tombs, landslide, bridges (broken over bolgia 6), giants, Lucifer.
   - `buildPath()`: CatmullRom curve through the journey waypoints (Geryon's spiral is generated), drawn as a tube whose shader colors the traveled part.
   - `buildMarkers()`: one `THREE.Points` draw call for all 130 points; the fragment shader samples the sprite atlas and draws the colored ring. `I` toggles icons/dots.
   - Procedural textures (`TEX_RECIPES`): fractal value-noise recipes for stone, water, mud, blood, sand, iron, ice, strata, ocean.
   - State: `setCanto()` drives everything journey-related (passed / current / ahead tinting, counters, itinerary).
   - Selection: `selectNode()` / `selectLevel()` set `S.fadeLv`; `updateFade()` eases every other level and the Earth toward transparency.
   - Camera: custom orbit + fly controls; `frameNode()` stands on the funnel axis looking out, so it never ends up outside the walls.

## Data model (src/inferno.json)

Coordinates are polar around the funnel axis:

| field | meaning |
|---|---|
| `lv` | level id the point sits on |
| `a` | angle in degrees. The descent turns left, which is decreasing `a`. Keep points out of the cut wedge (140–200). |
| `r` | 0 = outer edge of the level's ring, 1 = inner edge |
| `h` | height above the floor (giants, Lucifer's mouths) |
| `y`, `rad` | absolute height / radius overrides (Earth's center, tunnel) |

**Add a point**: copy any entry in `nodes`, give it a unique `id`, a `lv`, `a`, `r`, a `cite` (first Roman numeral = the canto it unlocks on the journey), a `k` kind (`soul`, `guardian`, `place`, `event`, `absent`), an `icon` from sprites.json, `note`, optional `it`/`en` quote and `conf` (`text` or `interp`). **Remove a point**: delete it; links pointing at it are skipped with a console warning.

**Links** (`edges`): `{ a, b, t, cite, note }` where `t` is one of `pair, betray, cause, source, fate, echo, summon, home, judge, lie`. Either end can be a point id or a level id.

**Journey** (`path`): ordered waypoints with `c` = canto position (decimal, 1–35). `turn: "right"` marks the two right turns; `mode: "flight"` generates Geryon's spiral.

## Sprites (src/sprites.json)

16×16, one letter per pixel from `palette` (`.` = transparent). Three ways to define one:

```json
"tree":  { "grid": ["....", "..."] },
"pope":  { "person": { "robe": "w", "shade": "g", "mods": ["tiara"] } },
"lion":  { "template": "quad", "colors": { "F": "t" }, "stamps": [[2, ["...nnnn..."]]] }
```

Person mods stack (`crown, tiara, laurel, hood, helmet, horns, halo, wings, book, sword, frozen, flames, tomb, tar, muck, …`). `post` can be `flipFire`, `flipV`, `crossRot`, `statueBands`. Assign with a point's `icon` field; unknown names fall back to `kindDefaults`.

## Credits and licenses

- This project's own code, data and sprites: MIT (see `LICENSE`).
- Dante Alighieri, *Inferno*; Italian text and H. W. Longfellow's 1867 translation are public domain.
- Three.js r128, MIT (see `vendor/three-r128/LICENSE`).
- Fonts: Cinzel and EB Garamond via Google Fonts (SIL Open Font License).
- Pixel sprites and procedural textures are original to this project.
