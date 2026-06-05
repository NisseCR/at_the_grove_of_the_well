# At the Grove of the Well

<img width="800" height="450" alt="At the Grove of the Well" src="https://github.com/user-attachments/assets/22b51385-98df-4407-941a-2832bc5c239d" />

A D&D ambient experience tool inspired by the music of [At the Grove of the Well](https://taylormooremusic.bandcamp.com/track/at-the-grove-of-the-well) by Taylor Moore.

The GM controls scenes, music, ambiences and art from a **controller view**, while players experience the result in a fullscreen **player view** — synced in real time over WebSocket.

## Getting Started

Run `run.bat` to start the backend and frontend in separate terminal windows, then open `http://localhost:5173` in your browser.

See [HOSTING.md](HOSTING.md) for VPS deployment and SSL setup.

## How It Works

The app has two views:

- **Controller** (`?view=controller`) — the GM's interface for selecting scenes and toggling ambiences
- **Player** (`?view=player`) — the fullscreen experience shown to players, with animated scenes and layered audio

The backend is a dumb WebSocket relay — it holds no state, it just broadcasts messages to all connected clients. The controller sends commands, the player fetches the relevant assets and renders them. Multiple controllers can be open simultaneously and stay in sync.

## Stack

- **Frontend** — Vite + Svelte 5 + TypeScript + Tone.js + GSAP
- **Backend** — FastAPI (Python)
- **Styling** — custom CSS, no framework

## Project Structure

```
frontend/src/
├── lib/
│   ├── engines/        # sceneEngine, ambienceEngine, audioEngine
│   └── services/       # API clients, messageHandler, transport
├── stores/             # appState, sceneState, router
├── types/              # scene, ambience, message, state, audio
├── components/
│   ├── controller/
│   └── player/
└── views/              # ControllerView, PlayerView, HomeView
```

```
backend/data/
├── entities/
│   ├── scenes/         # one JSON per scene
│   └── ambiences/      # one JSON per ambience
└── categories/
    ├── scenes/         # grouped scene collections
    └── ambiences/      # grouped ambience collections
```

Assets live outside the repo in a directory referenced by `ASSETS_DIR` in `.env`.

## Scripts

TODO describe usage of preprocessing scripts.

## Source Folder

The `source/` folder holds raw asset inputs. File contents are gitignored — only the top-level folder skeleton is tracked. The preprocessing script converts files to standardised formats and writes them to a separate output directory, which is what gets synced to the CDN.

### Naming conventions

- All folder and file names must be **kebab-case** (`forest-day`, `frystfel-i`, `wind-1`)
- Folder names are slugs — they are used as stable IDs. **Renaming a folder breaks references.**
- Labels are derived automatically: numeric prefix is stripped, hyphens become spaces, result is title-cased
  - `01_exploration` → `Exploration`
  - `borealis` → `Borealis`
  - `frystfel-i` → `Frystfel I`
- **Category display order** is controlled by a numeric prefix on the category folder: `01_wind`, `02_precipitation`
- Playlist and ambience names have no required prefix — they appear in alphabetical order within their category

### Folder structure

```
source/
  _shared/                          ← shared visual assets, referenceable by any entity
    images/                         ← background images and textures (.jpg, .png)
    videos/                         ← looping video layers (.webm)
  ambiences/                        ← one category folder per ambience group
  playlists/                        ← one category folder per playlist group
  handouts/                         ← future use
```

### Playlists

```
source/playlists/
  01_exploration/                   ← category folder (prefix controls display order)
    australis/                      ← playlist folder (no prefix — alphabetical order)
      cover.jpg                     ← required playlist cover image
      a-new-day-has-dawned.mp3
      anders.mp3
      awakening.mp3
    borealis/
      cover.jpg
      frystfel-i.mp3
      frystfel-ii.mp3
      highlands-i.mp3
    dissonance/
      cover.jpg
      a-blessing.mp3
      a-village-leaves.mp3
  02_mood/
    alone/
      cover.jpg
      ashen.mp3
      eye-of-the-needle.mp3
```

- Every playlist folder must contain a `cover.jpg`
- Tracks play in alphabetical order; the engine loops back to the first track at the end
- Empty category folders are ignored by the scanner

### Ambiences

```
source/ambiences/
  01_wind/                          ← category folder (prefix controls display order)
    cover.jpg                       ← required category thumbnail
    distorted.ogg
    nessus.ogg
    piercing.ogg
    wind-1.ogg
    wind-2.ogg
    wind-3.ogg
  02_precipitation/
    cover.jpg
    crystal.ogg
    rain.ogg
    snow-1.ogg
    snow-2.ogg
```

- Every category folder must contain a `cover.jpg` — this is used as the thumbnail in the controller
- Each audio file directly inside a category folder is one ambience
- Ambiences always loop and play at default volume (0.5) — no per-file config needed
- Numbering within a category (e.g. `wind-1`, `wind-2`) is for distinct sound variants, not ordering

### Shared assets

```
source/_shared/
  images/
    abyssus.jpg
    storm-at-sea.jpg
    study.jpg
  videos/
    house-night.webm
    lens-cold.webm
    snow.webm
    wind.webm
```

- `_shared/` is a flat pool of visual assets — no subfolders beyond `images/` and `videos/`
- Files here are referenced by scene configs (stored in the project repo, not in `source/`)
- Use `_shared/` for any asset that is reused across multiple scenes to avoid duplication

### Scenes

Scene configs are stored in the project repo as `scene.json` files, not in `source/`. Visual assets used by scenes (backgrounds, video layers) live in `source/_shared/`. There is no `source/scenes/` folder.

### File formats

Raw files can be in any common format — the preprocessing script converts everything before syncing to the CDN:

| Type   | Accepted input      | Output                                          |
| ------ | ------------------- | ----------------------------------------------- |
| Audio  | `.mp3`, `.wav`, etc | `.ogg` (48kHz, −16 LUFS)                        |
| Images | `.jpg`, `.png`, etc | `.webp` + `cover.thumb.webp` (covers only)      |
| Video  | `.webm`             | `.webm` (passthrough)                           |
