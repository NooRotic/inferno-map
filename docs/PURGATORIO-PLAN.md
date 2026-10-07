# Purgatorio: early planning (October 2026)

Status: **idea, not started.** Written from the poem's structure and the current engine; no line numbers or quotes here are verified. Verification against Longfellow (Project Gutenberg) happens when the data is built, per `CLAUDE.md`.

## How the poem maps to the engine

| Inferno (built) | Purgatorio |
|---|---|
| A funnel narrowing downward | A mountain: a cone rising from an island at the antipode |
| Vestibule plus 9 circles | Ante-Purgatory (shore and foot of the slope), the Gate (three steps, angel doorkeeper), seven terraces (pride, envy, wrath, sloth, avarice, gluttony, lust), then the Earthly Paradise at the summit |
| Five sin-band colours | Seven terrace colours, heaviest sin at the bottom |
| Depth gauge, going down | Altitude gauge, going up (same code, reversed) |
| 34 cantos | 33 cantos |
| Contrapasso | Punishment fits the sin, but as purgation, not damnation |

## What would make it more than a re-skin

- **The seven P's.** An angel marks seven P's on Dante's forehead and erases one at each terrace: a ready-made progress mechanic tied to the journey bar.
- **The sun rule.** Dante can only climb by daylight, and the poem stops at nightfall. Lighting could shift between day and night as you scrub.
- **The mountain's origin.** The Inferno data already records the mountain being formed by Lucifer's fall, so the two books connect.

## Engine changes

- No Earth cutaway wedge; the mountain is an exterior view with terraces as rings.
- Altitude replaces depth in the gauge and in camera framing.
- A spiral path, since Dante circles the mountain as he climbs.
- New sprites in `sprites.json` for the new cast.
- Split the single ~1,150-line file into a shared engine and a per-book data folder. Today the engine and the Inferno are tangled together.

## Rough phases

1. Decide structure (one site with a Cantica switcher, or separate sites).
2. Data skeleton: levels, path, terraces, no points yet.
3. Points in batches, one terrace at a time, each with a verified Longfellow quote and line citation. This is the slow part.
4. Engine adaptations and the mobile layout.
5. Polish: the P marks, day and night lighting.

## Open questions

- One Commedia site (Inferno, Purgatorio, Paradiso) or separate sites?
- Same data-quality rules (Longfellow only, `conf` field, nothing quoted from memory)? Assumed yes.
- This repo as a second data set, or a new repo?
- Timing: ship the mobile work first so the Inferno is stable before any refactor.
