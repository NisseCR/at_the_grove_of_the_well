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
