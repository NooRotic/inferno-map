# INFERNVS

**Dante's *Inferno* as a data visualization.** Every soul, guardian, place and event in the poem is a data point with a canto-and-line citation, placed in a 3D cutaway of the Earth and linked to the others.

**Live:** [inferno.pollardjr.com](https://inferno.pollardjr.com) · plain HTML, vanilla JS and Three.js · no framework, no bundler, no backend

![INFERNVS: the cutaway at the end of the descent](docs/img/hero.png)

## The idea

The *Inferno* is already a structured dataset. Dante gives the geometry (a cone driven into the Earth beneath Jerusalem, narrowing to the planet's center), the ordering (circles, ledges, pits, in a fixed sequence), the cast (who, where, why) and the references between them (who points to whom, who caused whom). It is built as a system, and it can be read like one.

This project takes that structure literally:

- **A cutaway of the globe.** The funnel is modelled from Dante's own description: the descent turns left, bridges break at the sixth pit, and the lowest circle is ice, not fire.
- **Every point is cited.** 130 points, each tied to a canto and line range, such as `X.22-51`. The first Roman numeral also decides when the point appears on the journey.
- **Text versus interpretation is marked.** A tag on each card says whether something is *stated in the text* or *interpretive*, so Dante's claims are never mixed up with commentary.
- **Links are data too.** 37 typed relationships (betrayal, cause and effect, prophecy, echoes across the poem) connect points, drawn on the map and listed on each card.
- **Quotes are public domain.** The Italian is the standard text and the English is H. W. Longfellow (1867). Quotes are checked against published sources, and the log in [`docs/RESEARCH.md`](docs/RESEARCH.md) lists exactly what has been verified and what is still to confirm.

| Count | |
|---|---|
| Points | 130 (69 souls, 21 guardians, 27 places, 12 events, 1 absence) |
| Links | 37 typed relationships |
| Levels | 29 (circles, ledges and pits, from the dark wood to the center) |
| Journey | 78 waypoints through cantos I-XXXIV |
| Icons | 110 original 16×16 sprites |

## Taking the tour

Press **Play the journey** (or the space bar) to follow Dante and Virgil down canto by canto. Rings they have passed light up, the ones ahead stay in shadow, and the counters at top right track how many souls, guardians, places and events you have met.

Or go where you like: drag to turn the globe, scroll to zoom, click any icon to fly to it. The card that opens shows the citation, the Italian line with the Longfellow translation, and its connections.

![A soul card: Farinata degli Uberti, Canto X](docs/img/soul-farinata.png)

![Lucifer at the center of the Earth, Canto XXXIV](docs/img/lucifer.png)

## The codex

The five tabs at the top are the reference layer, named in Latin to match the tone of the poem.

| Tab | What it is |
|---|---|
| **MAPPA** | The 3D map itself, with the journey slider along the bottom |
| **INDEX** | Every point in the order Dante meets it. Searchable by name, note or canto |
| **CIRCULI** | The circles from the rim to the center, with a *passed / ahead* state for each |
| **CLAVIS** | The key to the map: ring colors, link types and the *stated vs interpretive* tags |
| **PROOEMIUM** | The introduction: how Dante builds Hell, and where the proportions come from (the poem gives few measurements, so scale follows Renaissance reconstructions) |

![The INDEX tab searching for "Brutus"](docs/img/index.png)

![The CLAVIS tab, the legend for ring colors and link types](docs/img/clavis.png)

## The icons

Each point has a 16×16 pixel icon. The sprites are not drawn one by one: [`src/sprites.json`](src/sprites.json) holds a palette, a base figure and a set of modifiers (crown, tiara, hood, wings, flames, tomb, tar, frozen and so on), and the sprite engine stacks them into 110 icons, adds a 1px outline and packs everything into one texture atlas. Icons are colour-ringed by kind: soul, guardian, place or event. Press `I` to switch between icons and plain dots.

![All 110 sprites](docs/img/sprites.png)

## Controls

| Key | Action |
|---|---|
| `Space` | Play or pause the journey |
| Drag / right-drag / scroll | Turn the globe / pan / zoom |
| `F` | Look closer at the selected point |
| `G` | Fly mode (WASD, Q and E) |
| `I` | Toggle icons and dots |
| `R` | Back to the whole Earth |
| `Esc` | Clear the selection |

## Run it locally

The page `fetch()`es its JSON, so it has to be served over HTTP (`file://` will not work).

```bash
npm run dev            # builds dist/ and serves it at http://localhost:5173
```

`npm run build` keeps Three.js on cdnjs. `npm run build:vendor` copies it into `dist/vendor/` so the only third-party request left is Google Fonts. There are no dependencies to install.

## Deployment

`dist/` is the whole site: `index.html`, `inferno.json`, `sprites.json` and `vendor/three.min.js`. All paths are relative, so it works at a domain root or in a subfolder. A [GitHub Actions workflow](.github/workflows/deploy.yml) builds it with `build:vendor` and publishes to GitHub Pages on every push to `main`.

## Under the hood

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): how the engine is organized, the data model (coordinates are polar around the funnel axis) and how to add a point or a sprite.
- [`docs/RESEARCH.md`](docs/RESEARCH.md): sources, modelling decisions and the citation verification log.
- [`docs/ROADMAP.md`](docs/ROADMAP.md): planned work (animated punishments, rollover cards).

## Credits and licenses

- This project's own code, data and sprites: MIT (see `LICENSE`).
- Dante Alighieri, *Inferno*; Italian text and H. W. Longfellow's 1867 translation are public domain.
- Three.js r128, MIT (see `vendor/three-r128/LICENSE`).
- Fonts: Cinzel and EB Garamond via Google Fonts (SIL Open Font License).
- Pixel sprites and procedural textures are original to this project.
