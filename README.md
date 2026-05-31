# At the Grove of the Well

Inspired by the many layers and emotions in the music of [At the Grove of the Well\_](https://taylormooremusic.bandcamp.com/track/at-the-grove-of-the-well) by Taylor Moore.

Music dimensions:

- Horizontal layering in theme (e.g. Borealis, Elina, Plains).
- Horizontal layering in versions of a theme (e.g. Borealis I, Borealis II, ...).
- Vertical layering in intensity of a version (e.g. bass, harmonic, melody, percussion).

## Stack

- **Frontend**: Vite + Svelte 5 + TypeScript + Pico CSS + Tone.js + GSAP
- **Backend**: FastAPI (Python) with Pydantic models
- **Communication**: WebSocket relay (dumb backend, frontend owns state)

## Architecture

- `transport.ts` — WebSocket connection, exposes typed send helpers (`sendSetScene`, `sendSyncAmbiences`, `sendSync`)
- `messageHandler.ts` — routes incoming messages to engines and updates `appState`
- `sceneEngine.ts` — fetches, preloads, and transitions scenes (GSAP)
- `ambienceEngine.ts` — fetches ambience assets, manages stem lifecycle (activate/deactivate with fades)
- `audioEngine.ts` — Tone.js stem creation, buffer caching, gain nodes, linear ramping
- `router.svelte.ts` — view state (`?view=controller|player|home`)
- `appState.svelte.ts` — shared reactive state (scene, music, ambiences); updated by message handler on all clients
- `sceneState.svelte.ts` — player-local transition state (current/next scene config, isTransitioning)

## Key Decisions

- Backend is a dumb WebSocket relay — no app state stored server-side; messages are broadcast back to sender
- Controller sends ids only — player fetches full config itself (scenes via `sceneEngine`, ambiences via `ambienceEngine`)
- `appState` is updated in `messageHandler` on receive, not at the call site — ensures all connected controllers stay in sync
- `sceneState.requestedSceneId` is the reactive bridge between `messageHandler` and `SceneRenderer` — the handler sets it, a `$effect` in `SceneRenderer` watches it and calls `sceneEngine.transitionScene`; this indirection exists because the engine needs a live DOM container getter that only the component can provide
- Scene transitions use AbortController tokens to cancel mid-transition
- Two scene slots (current/next) for crossfading via GSAP
- `SceneRenderer` passes a DOM container getter to `sceneEngine` — engine never owns DOM references directly
- Ambience stems keyed by id in `ambienceEngine.active`; URL stored on the `Stem` object
- `syncActive` uses an AbortController token (same pattern as `sceneEngine`) to cancel in-flight fetches/activations when a new sync supersedes the current one
- Audio buffer cache in `audioEngine` persists across deactivations to avoid re-downloading
- Player requires a user gesture before rendering — `StoryGate` component calls `Tone.start()` on click, then mounts the player
- Ambience volume is hardcoded to 0.5 — per-ambience volume control not yet implemented
- `DebugOverlay` in `PlayerView` is temporary — displays live `appState` and `sceneState` for development
- Mood pad: X = calm→tense, Y = sparse→full (planned)

## Folder Structure

```
frontend/src/
├── lib/
│   ├── engines/        # sceneEngine, ambienceEngine, audioEngine
│   └── services/       # sceneApiClient, ambienceApiClient, messageHandler, transport
├── stores/             # appState, sceneState, router
├── types/              # scene.ts, ambience.ts, message.ts, state.ts, audio.ts
├── components/
│   ├── controller/     # Scenes, Ambiences
│   └── player/         # SceneRenderer, SceneAsset, ConnectionIndicator, StoryGate, DebugOverlay
└── views/              # ControllerView, PlayerView, HomeView
```

## Data (Backend)

```
backend/data/
├── entities/
│   ├── scenes/         # one JSON per scene (background + ordered layers)
│   └── ambiences/      # one JSON per ambience (id + src)
└── categories/
    └── ambiences/      # grouped ambience collections (planned)
```

Scene config fields: `id`, `src`, `type`, `loop`, `opacity`, `brightness`, `grayscale`, `blur`, `flip`, `blend_mode`, `order`.

Assets live outside the repo in a directory referenced by `ASSETS_DIR` in `.env`:

```
assets/
├── raw/                    # original source files — never served directly
│   ├── audio/ambience/
│   ├── images/
│   └── video/
└── processed/              # pipeline output — what the backend serves
    ├── audio/ambience/
    ├── images/
    └── video/
```

`ASSETS_DIR` points to `processed/`. Raw files are the source of truth; processed files are derived and can be regenerated.

## Scripts

```
scripts/
└── resample.py     # resample audio files to a target sample rate via ffmpeg
```

```
python scripts/resample.py assets/raw/audio/ambience assets/processed/audio/ambience
```

Options: `--rate` (default 48000), `--dry-run`.

Tone.js runs the Web Audio API at the OS default sample rate (48000 Hz on Windows). All audio assets must be resampled to 48000 Hz before serving — the browser's implicit resampling produces audible artefacts. Run the script once per new audio file added to `raw/`.

## Notes

- `.svelte.ts` extension required for `$state` outside components
- `cancelAndHoldAtTime` used before `setTargetAtTime` for interruptible, exponential audio fades; time constant is `duration / 3` (~95% reached after full duration)
- `preloadVideo` uses `oncanplaythrough`, `preloadImage` uses `onload`
- `tick()` called after `swapSceneSlots` so DOM updates before `transitionIn`
- `ToneAudioBuffer.load(url)` used directly for preloading — avoids buffer disposal bug with temporary `Tone.Player`
