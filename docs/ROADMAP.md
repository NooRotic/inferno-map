# Roadmap

Ideas captured October 2026. None of this is built yet.

## 1. Living areas: animated "torment tableaux"

**Goal**: you can see the punishments just by looking. Each circle plays its torment as small animated scenes, and hovering explains them.

**Technique** (fits the current engine, no new libraries):
- **Animated sprites**: add `"frames": [[...16 rows...], ...]` and `"fps"` to sprites.json. The atlas bakes every frame, and the marker shader picks `frame = floor(time * fps) % count`.
- **Moving crowds**: instanced billboards (one draw call per tableau) whose positions come from a small function of time (orbit, march, fall, bob). This is the same pattern as the existing particle systems in `tickParticles()`.
- **Flowing liquids**: scroll the texture offset over time (`map.offset.x += dt * speed`) for Acheron, Styx, Phlegethon and the pitch. Very cheap.
- **Performance**: tableaux outside the camera's view, or on faded levels, stop animating.

| Circle | What moves (from the text) | Cite | Effort |
|---|---|---|---|
| Vestibule | Neutrals chasing a whirling banner, wasps | III.52-69 | S |
| Acheron / Styx / Phlegethon | Flowing water, mud with bubbles, boiling blood | III, VII, XII | S |
| Lust | Souls blown round in a storm "like starlings" | V.31-45 | S (upgrade existing particles to sprites) |
| Gluttony | Rain and hail; Cerberus clawing | VI.7-33 | S |
| Hoarders & Wasters | Two half-circles roll great weights with their chests, crash, shout, turn back | VII.22-35 | M |
| Wrath | Brawlers in the mud; the sullen bubbling under it | VII.109-126 | S |
| Heresy | Tomb lids open, flames flicker | IX.112-133 | S |
| Violence 1 | Centaurs patrol the blood river and shoot anyone rising too high | XII.55-75 | M |
| Violence 2 | Harpies in the trees; black hounds chasing the squanderers | XIII | M |
| Violence 3 | Fire falling like snow; blasphemers lie, usurers sit, sodomites run | XIV.13-42 | S |
| Malebolge 1 | Two files marching in opposite directions, whipped by demons | XVIII.25-39 | M |
| Malebolge 3 | Feet on fire sticking out of holes | XIX.22-30 | S |
| Malebolge 4 | Diviners walking backwards, heads twisted | XX.10-15 | S |
| Malebolge 5 | Demons hooking barrators out of pitch | XXI-XXII | M |
| Malebolge 6 | A slow procession in lead cloaks | XXIII.58-67 | S |
| Malebolge 7 | Serpents; burning to ash and re-forming | XXIV-XXV | M |
| Malebolge 8 | Moving flames like fireflies | XXVI.25-42 | S |
| Malebolge 9 | Marchers split by a sword demon on every lap | XXVIII.37-42 | M |
| Cocytus | Lucifer's wings (exists), chewing mouths, freezing wind particles | XXXIV | S |

S = about an hour, M = a few hours. **Whole set: roughly 2–3 focused sessions with Claude.** This is moderate work, well within what this setup handles.

**Accuracy note**: there are no "wheels" in Circle 4. The hoarders and wasters push heavy weights around half-circles, collide, and reverse (VII.22-35). The wheel in that canto is Fortune's, in Virgil's speech (VII.67-96).

## 2. Rollover "torment cards"

**Status (October 2026):** the card is built as a strip under the header. Rolling over an icon or level label shows its name, sin, a line of description and the citation (touch screens skip it, since tapping already opens the side panel). What is left is the data below: once a node has `torment` and `contrapasso`, the strip should show them in place of the trimmed `note`.

Hovering a soul or area shows a compact card. Proposed new fields in `inferno.json` nodes:

```json
{
  "torment": "Split from chin to groin by a demon's sword; healed on each lap, cut again.",
  "contrapasso": "They split communities apart, so their bodies are split.",
  "who": ["Mosca dei Lamberti", "Bertran de Born", "Curio"],
  "deed": "Sowed political and religious division."
}
```

Hover shows torment and contrapasso. Click opens the full folio: who, deed, quotes and links.

## 3. Smaller follow-ups

- **Deep links**: `#farinata` opens straight to a point. The artifact can only pass plain `#id` anchors, so this fits.
- **Verify the remaining quotes**: see the to-do list in RESEARCH.md.
- **Sequels**: *Purgatorio*, a mountain of seven terraces already sitting at the antipode, and *Paradiso*, the celestial spheres. Both could reuse the same engine and data shape.
- **Ambient sound** (idea, October 2026): one looping, low-volume background track with a mute button, off until the visitor turns it on. The "Intra · Enter" click is a user gesture, so browsers will allow it to start. Later option: crossfade a different bed per sin band (wind in the Dark Wood, storm for Lust, ice creak for Treachery). Needs audio with a clear license, because the repo is public, and the files add to the Pages download.
- **Narration**: optional per-canto audio clips or text-to-speech of the Longfellow lines. A talking or animated Dante figure was considered and left out: it needs art, a voice and lip-sync, and it competes with the quote cards.
- **Mobile**: lower texture resolution and fewer instanced objects on small screens. The layout side is its own piece of work, written up in section 4 below.

## 4. Next session: mobile pass (handoff, October 2026)

The desktop experience (900px and up) is done and live. Phones were deliberately left for their own pass; here is what is known going in.

**How the layout is built:** absolutely positioned panels with media queries at 1459, 1100, 900 and 720px. `--foot` holds the measured footer height, and the medallions and hover strip stack above it.

| Width | What changes today |
|---|---|
| 1460+ | Hover strip at the top centre |
| 901-1459 | Strip moves to the bottom left; depth gauge on the left wall; itinerary and Circuli cards shift 40px right to clear it |
| 900 and under | Gauge, medallion icons and counter labels are hidden; strip goes full width |
| 720 and under | Strip, hints, brand and counters are hidden; itinerary card compacts; the detail card becomes a bottom sheet (max 58% high) |

**Done on the `feat/mobile-layout` branch (720px and under unless noted):**
- Hamburger button replaces the tab row and opens a full-screen section menu; the current section name sits beside it.
- Footer controls are compact (two rows) and only the milestone ticks are tappable; the slider covers the rest.
- A slim depth gauge sits on the right edge (900px and under).
- Coach marks say "Tap", skip the hidden medallions and point at the play button and the gauge instead.
- Hover strip stays off touch on purpose: a tap selects an icon and opens the bottom sheet.

**Still open on touch:** the itinerary card is large on a phone, the gauge tip overlaps it briefly, and nothing has been tried on a real device.

**Untested anywhere:** iOS Safari (the vertical gauge relies on `writing-mode: vertical-lr` on a range input), Firefox, and any real device.

**How to test here:** the in-app browser's `resize_window` mobile preset (375x812) switches to a touch user agent, though clicks still arrive as mouse events. The page only draws while the pane is rendered, so take a screenshot before reading label positions.

**Link preview is done** (`src/og.png`, tags in `tools/build.mjs`). When the picture changes, bump the `?v=` on `og:image` and `twitter:image` there so platforms re-fetch it.

**Still open from the same review:** README screenshots that predate the bands, gauge and wider rings, and header tabs clipping at about 800px wide.
