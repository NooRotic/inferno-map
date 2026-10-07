# Architecture and data model

Moved out of the README. See also `CLAUDE.md` for the short version.

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
