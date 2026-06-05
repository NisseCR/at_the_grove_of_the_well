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

Tone.js runs the Web Audio API at 48000 Hz. All audio assets must be resampled to match before serving — the browser's implicit resampling produces audible artefacts.

```
python scripts/resample.py <input_dir> <output_dir>
```

Options: `--rate` (default 48000), `--dry-run`. Run once per new audio file added.

## Source Folder

The `source/` folder is the raw asset input for the project. Its contents are gitignored — only the top-level folder structure is tracked. Raw files (`.mp3`, `.jpg`, etc.) live here and are preprocessed into a separate output directory before being synced to the CDN.

### Naming conventions

- All folder and file names are **kebab-case** (`forest-day`, `frystfel-i`)
- Folder names are used as slugs — treat them as stable IDs; renaming breaks references
- Labels are derived automatically: strip any numeric prefix, replace hyphens with spaces, title-case
- Use a numeric prefix to control display order: `01_borealis`, `02_australis`

### Playlists

```
source/playlists/
  01_exploration/               ← category (display order via prefix)
    01_borealis/                ← playlist
      cover.jpg
      01_frystfel-i.mp3         ← track order via numeric prefix
      02_frystfel-ii.mp3
      03_highlands-i.mp3
    02_australis/
      cover.jpg
      01_ashen.mp3
      02_refuge.mp3
  02_mood/
    01_alone/
      cover.jpg
      01_track.mp3
```

- Each playlist folder contains a `cover.jpg` and one or more audio tracks
- Track playback order follows the numeric prefix on the filename
- The playlist engine loops back to the first track when it reaches the end

### Ambiences

```
source/ambiences/
  01_forest/                    ← category
    cover.jpg                   ← category thumbnail
    cursed.ogg
    darkest.ogg
    night.ogg
  02_wind/
    cover.jpg
    ghostly.ogg
    haunting.ogg
```

- Each audio file directly inside a category folder is one ambience
- Ambiences always loop and play at default volume (0.5)
- The category `cover.jpg` is used as the thumbnail in the controller rail

### Scenes

```
source/scenes/
  (empty for now — structure TBD)
```

Scenes reference shared visual assets via a `scene.json` config file stored in the project repo (not in `source/`). The `_shared/` folder at the root of `source/` holds the visual files themselves.

### Shared assets

```
source/_shared/
  images/                       ← background images and textures
    forest-bg.jpg
    stone-wall.jpg
  videos/                       ← looping video layers
    mist.webm
    fire.webm
    rain.webm
```

Any entity type (scenes, handouts, etc.) can reference files from `_shared/`. This avoids duplicating large video files across multiple scenes that reuse the same layer.

### Handouts

```
source/handouts/
  (future — not yet populated)
```

### File formats

Raw source files can be in any common format — the preprocessing script converts everything to the standardised output formats before syncing to the CDN:

| Type   | Input          | Output  |
|--------|----------------|---------|
| Audio  | `.mp3`, `.wav` | `.ogg` (48kHz, −16 LUFS) |
| Images | `.jpg`, `.png` | `.webp` + `cover.thumb.webp` thumbnail |
| Video  | `.webm`        | `.webm` (passthrough for now) |
