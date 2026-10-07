# Research notes

Everything the map asserts, where it came from, and how sure we are. Compiled October 2026.

## Primary text

- **Dante Alighieri, *Inferno*** (c. 1308–1321). Italian follows the standard modern (Petrocchi) text.
- **H. W. Longfellow translation (1867)**: public domain, used for every English quote. Modern translations (Ciardi, Mandelbaum, Pinsky, Hollander, Kirkpatrick) are under copyright and are not quoted.
- **Citation system**: canto (Roman) . line(s), e.g. `V.121-123`. Edition-independent; page numbers are never used.

## Sources consulted / recommended for verification

- divinacommedia.dante.global (Italian with line numbers). Used.
- danteinferno.info (Longfellow by canto). Used.
- lithub.com, Inferno canto XIV (Longfellow). Used.
- Digital Dante, Columbia: digitaldante.columbia.edu. Recommended.
- Princeton Dante Project and Dartmouth Dante Lab (commentary database). Recommended.
- Project Gutenberg #1001 (Longfellow, *Hell*). Recommended.

## Structure: what the text states (high confidence)

- Order of regions: Dark Wood → Gate (III) → Vestibule → Acheron → Circles 1–5 → walls of Dis (VIII–IX) → Circles 6–7 (7 has three rings) → great cliff and Geryon (XVI–XVII) → Malebolge, ten ditches (XVIII–XXX) → Well of the Giants (XXXI) → Cocytus in four zones (XXXII–XXXIV) → Lucifer → hidden way to the stars (XXXIV.127-139).
- Direction: the descent turns left, except two right turns at **IX.132** and **XVII.31**. Left turn on entering Malebolge: **XVIII.21**.
- Crossings ("level drops"): Charon (III), Phlegyas (VIII), landslide (XII), Nessus' ford (XII), Geryon's spiral flight (XVII.115-117), Antaeus (XXXI), climbing down Lucifer and turning at Earth's center (XXXIV.70-93).
- Broken bridges over bolgia 6 and the landslide both date to the earthquake at Christ's death / Harrowing of Hell (IV.52-63, XII.34-45, XXI.106-114, XXIII.133-144).
- Malacoda's date clue (XXI.112-114): 1,266 years since the bridges broke, placing the scene on Holy Saturday 1300.

### Dante's own measurements

- Bolgia 9 is 22 miles around: **XXIX.9**
- Bolgia 10 is 11 miles around and at least half a mile across: **XXX.86-87**
- Nimrod's face is as long as St. Peter's bronze pinecone: **XXXI.58-59**

## Theme the map is built around

- Hell as distance from God. Limbo's souls "sinned not" (**IV.34**); their only punishment is "without hope we live on in desire" (**IV.41-42**). Virgil is one of them (**IV.39**).
- The bottom of Hell is ice, not fire: Cocytus is frozen by the wind of Lucifer's six wings (**XXXIV.46-52**).
- Contrapasso, punishment that mirrors the sin, is named outright by Bertran de Born (**XXVIII.142**).

## Modelling decisions (interpretive)

- **Cosmology**: Hell is a cone beneath Jerusalem (traditional reading of XXXIV.112-115). Its point is Earth's center, and Purgatory rises at the antipode from land displaced by Lucifer's fall (**XXXIV.121-126**). The model uses a globe of radius 190.2 units centred at y = -126, with ground at y = 8, so the funnel mouth (r = 135) sits on the sphere.
- **Proportions** loosely follow the Renaissance reconstructions of Antonio Manetti and Galileo Galilei's 1588 lectures to the Florentine Academy on the "shape, location and size" of Dante's Inferno. No specific numbers from those lectures are encoded; ring widths and depths are ours.
- **Path angles**: each circle is crossed as a partial arc. Arc lengths are not given in the text.
- **Points** tagged `"conf": "interp"` come from tradition or commentary:
  - Jerusalem overhead.
  - "He of the Great Refusal" read as Celestine V (III.58-60).
  - The Buoso among the thieves read as Buoso Donati.
- **Sensitive depiction**: Muhammad and Ali (XXVIII.22-63) are represented by a sword icon, not a figure. The note frames the placement as Dante's 14th-century Christian view.

## Quote verification log

Fact-check pass on 2026-10-05, run by a separate checking agent. Two errors were found and fixed:

1. `capaneus` English was wrong. It is now Longfellow's "Such as I was living, am I, dead." (XIV.51).
2. `lucifer` citation didn't contain its quote. Changed to XXXIV.1-60, since "Vexilla regis…" is XXXIV.1.

3. `lucifer` English repeated the Latin instead of translating it (found 2026-10-07 while capturing README screenshots). Now both lines of the sentence (XXXIV.1-2): English matched against Project Gutenberg #1001 ("Towards us; therefore look in front of thee"); Italian second half ("verso di noi; però dinanzi mira") from the standard text, not yet matched against a scanned source.

Status of every quoted line ("source" = matched against a published text; "memory" = checked from model knowledge only, still to confirm):

| node | cite | Italian | Longfellow |
|---|---|---|---|
| `dark_wood` | I.1-3 | memory | memory |
| `virgil` | I.61-63 | memory | — |
| `gate` | III.1-9 | source | memory |
| `charon` | III.82-111 | source | — |
| `limbo_sighs` | IV.25-42 | memory | memory |
| `poets` | IV.85-102 | memory | source |
| `aristotle` | IV.130-144 | memory | — |
| `minos` | V.4-15 | memory | — |
| `whirlwind` | V.31-45 | memory | — |
| `francesca` | V.73-142 | memory | source |
| `paolo` | V.73-142 | memory | source |
| `plutus` | VII.1-15 | source | — |
| `furies` | IX.37-63 | memory | — |
| `farinata` | X.22-51 | memory | — |
| `pier` | XIII.31-108 | memory | source |
| `florentine_suicide` | XIII.130-151 | memory | — |
| `capaneus` | XIV.43-72 | memory | source |
| `brunetto` | XV.22-124 | memory | source |
| `geryon` | XVII.1-27 | memory | source |
| `malebolge` | XVIII.1-18 | memory | memory |
| `nicholas` | XIX.31-120 | memory | source |
| `ulysses` | XXVI.52-142 | memory | source |
| `bertran` | XXVIII.112-142 | memory | source |
| `nimrod` | XXXI.46-81 | memory | — |
| `ugolino` | XXXII.124–XXXIII.90 | source | source |
| `lucifer` | XXXIV.1-60 | source | source |
| `center` | XXXIV.76-111 | source | — |
| `stars` | XXXIV.127-139 | source | source |

Also checked from knowledge, no page reachable at the time: XXIX.9, XXX.86-87, XXXI.58-59, IV.39, VIII.124-126, XXI.112-114, XXV.13-15, XXVII.124-127, XVIII.21, XVII.31 (Longfellow wording confirmed, line number not).
Confirmed against a source: IX.132, III.136, V.107, V.142, XXXIII.137.

**To do**: confirm every "memory" row against Digital Dante or Gutenberg #1001. Recheck `limbo_sighs` (IV.41-42), which was added after the check.
