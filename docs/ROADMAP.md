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
- **Narration**: optional per-canto audio clips or text-to-speech of the Longfellow lines.
- **Mobile**: lower texture resolution and fewer instanced objects on small screens.
