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

- `transport.ts` — WebSocket connection, exposes typed public actions (loadScene, setIntensity etc.)
- `messageHandler.ts` — routes incoming messages to the correct engine
- `sceneEngine.ts` — fetches, preloads, transitions scenes (GSAP)
- `audioEngine.ts` — Tone.js stem playback, gain nodes, linear ramping
- `router.svelte.ts` — view state (?view=controller|player|home)
- `appState.svelte.ts` — shared reactive state (scene, music, ambience)
- `sceneState.svelte.ts` — current/next scene config for renderer

## Key Decisions

- Backend is a dumb WebSocket relay — no app state stored server-side
- Controller sends scene_id only — player fetches full config itself
- Slider inputs use local $state, not appState, to avoid network lag
- All stems use Tone.Gain nodes with linearRampToValueAtTime (Firefox fix)
- Scene transitions use AbortController tokens to cancel mid-transition
- Two scene slots (current/next) for crossfading via GSAP
- Mood pad: X = calm→tense, Y = sparse→full, third axis = tense

## Folder Structure

frontend/src/
├── lib/
│ ├── engines/ # sceneEngine, musicEngine, ambienceEngine
│ └── services/ # sceneApiClient, ambienceApiClient, # messageHandler
├── stores/ # appState, sceneState, router
├── types/ # scene.ts, message.ts, state.ts
├── components/
│ ├── scene/ # SceneRenderer, SceneAsset
│ ├── player/
│ └── ui/ # ConnectionIndicator
└── views/ # ControllerView, PlayerView, HomeView

## Scene Config (JSON)

Each scene has a background (image/video) and ordered layers (video/image).
Assets served via FastAPI StaticFiles mount from ASSETS_DIR in .env.
Config fields: src, type, loop, opacity, brightness, grayscale, blur, flip, blend_mode, order, id.

## Notes

- .svelte.ts extension required for $state outside components
- cancelAndHoldAtTime used for interruptible audio fades
- preloadVideo uses oncanplaythrough, preloadImage uses onload
- tick() called after swapSceneSlots so DOM updates before transitionIn
