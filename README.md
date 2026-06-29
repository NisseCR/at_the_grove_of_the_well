# At the Grove of the Well

<img width="800" height="450" alt="At the Grove of the Well" src="https://github.com/user-attachments/assets/22b51385-98df-4407-941a-2832bc5c239d" />

A D&D ambient experience tool inspired by the music of [At the Grove of the Well](https://taylormooremusic.bandcamp.com/track/at-the-grove-of-the-well) by Taylor Moore.

The GM controls scenes, music, ambiences and art from a **controller view**, while players experience the result in a fullscreen **player view** — synced in real time over WebSocket.

## Getting Started

```bash
docker compose up -d --build
```

Opens at `http://localhost`.

For frontend-only development:

```bash
cd app && npm run dev
```

See [HOSTING.md](HOSTING.md) for VPS deployment and SSL setup.

## How It Works

The app has three views, routed via SvelteKit:

- **Controller** (`/controller`) — the GM's interface for selecting scenes, music, and ambiences
- **Player** (`/player`) — the fullscreen experience shown to players, with animated scenes and layered audio
- **Reader** (`/reader`) — a narrative reader for story chapters

The ws-relay is a stateless WebSocket broadcast relay — it holds no state and just forwards messages to all connected clients. The controller sends commands, the player fetches the relevant assets and renders them. Multiple controllers can be open simultaneously and stay in sync.

## Stack

- **Frontend** — SvelteKit + Svelte 5 + TypeScript + Tone.js + GSAP
- **Backend** — FastAPI (Python) WebSocket relay
- **Styling** — custom CSS + Bits UI

## Project Structure

```
app/src/
├── lib/
│   ├── actions/        # Svelte actions (scroll, reveal animations)
│   ├── components/     # UI components
│   ├── config/         # configuration
│   ├── engines/        # sceneEngine, audioEngine, ambienceEngine, musicEngine
│   ├── server/         # server-side data loading and asset scanning
│   ├── services/       # messageHandler, transport
│   ├── state/          # Svelte reactive state
│   ├── types/          # TypeScript types
│   └── utils/
└── routes/
    ├── controller/     # GM interface (scenes, music, ambiences, config)
    ├── player/         # fullscreen player view
    ├── reader/         # story reader
    ├── scene-builder/  # visual scene builder
    ├── sync/           # asset sync trigger
    └── api/            # REST API endpoints
```

```
ws-relay/
└── app/                # FastAPI WebSocket relay (stateless broadcast)
```

Assets are served from Cloudflare R2, configured via env vars in `.env` (see `.env.example`).

## Asset Structure

Assets live in Cloudflare R2. The scanner lists the bucket at startup and builds all in-memory data from the folder structure. `PUBLIC_ASSETS_BASE` in `.env` is the CDN base URL used to construct asset URLs.

### Naming conventions

- All folder and file names are **kebab-case** (`forest-day`, `frystfel-i`, `wind-1`)
- Folder names are slugs used as stable IDs. **Renaming a folder breaks references.**
- Labels are derived automatically: numeric prefix is stripped, hyphens become spaces, result is title-cased
  - `01-exploration` → `Exploration`
  - `borealis` → `Borealis`
  - `frystfel-i` → `Frystfel I`
- **Category display order** is controlled by a numeric prefix: `01-wind`, `02-precipitation`
- Playlist and ambience names have no prefix — they appear in alphabetical order within their category

### Bucket structure

```
R2 bucket/
├── _shared/            # visual assets referenced by scene configs
│   ├── images/         # background images (.webp + .thumb.webp each)
│   └── videos/         # looping video layers (.webm + .thumb.webp each)
├── ambiences/          # one category folder per ambience group
├── playlists/          # one category folder per playlist group
├── scenes/             # one category folder per scene group
└── stories/            # one folder per story
```

### Playlists

```
playlists/
├── 01-exploration/                 # category folder (prefix controls display order)
│   ├── australis/                  # playlist folder (no prefix — alphabetical order)
│   │   ├── cover.webp
│   │   ├── cover.thumb.webp
│   │   ├── a-new-day-has-dawned.webm
│   │   ├── anders.webm
│   │   └── awakening.webm
│   └── borealis/
│       ├── cover.webp
│       ├── cover.thumb.webp
│       ├── frystfel-i.webm
│       └── highlands-i.webm
└── 02-mood/
    └── alone/
        ├── cover.webp
        ├── cover.thumb.webp
        └── ashen.webm
```

- Every playlist folder must contain `cover.webp` and `cover.thumb.webp`
- Tracks play in alphabetical order; the engine loops back to the first track at the end

### Ambiences

```
ambiences/
├── 01-wind/                        # category folder (prefix controls display order)
│   ├── cover.webp                  # category thumbnail
│   ├── cover.thumb.webp
│   ├── distorted.webm
│   ├── nessus.webm
│   └── wind-1.webm
└── 02-precipitation/
    ├── cover.webp
    ├── cover.thumb.webp
    ├── crystal.webm
    └── rain.webm
```

- Every category folder must contain `cover.webp` and `cover.thumb.webp`
- Each `.webm` directly inside a category folder is one ambience

### Shared assets

```
_shared/
├── images/
│   ├── abyssus.webp
│   ├── abyssus.thumb.webp
│   └── storm-at-sea.webp
└── videos/
    ├── house-night.webm
    ├── house-night.thumb.webp
    └── snow.webm
```

- `_shared/` is a flat pool of visual assets — no subfolders beyond `images/` and `videos/`
- Every file has a `.thumb.webp` sidecar used for thumbnails in the controller
- Files here are referenced by scene configs in `scenes/`

### Scenes

```
scenes/
├── 01-wilderness/
│   ├── abyssus.json
│   └── stormwall.json
└── 02-urban/
    ├── cathedral.json
    └── study.json
```

- Each JSON file is a scene config referencing assets from `_shared/`
- Category prefix controls display order in the controller

### Stories

```
stories/
├── abyssus/
│   ├── chapter-1.json
│   ├── chapter-2.json
│   └── chapter-3.json
└── the-well/
    └── chapter-1.json
```

- Each story folder contains one JSON file per chapter, sorted alphabetically

### File formats

| Type   | Format                                  |
| ------ | --------------------------------------- |
| Audio  | `.webm` (audio/opus)                    |
| Images | `.webp` + `.thumb.webp` sidecar         |
| Video  | `.webm` + `.thumb.webp` sidecar         |
| Config | `.json` (scene and story chapter files) |
