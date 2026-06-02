<script lang="ts">
  import * as Tone from "tone";
  import { appState } from "@/stores/appState.svelte";
  import { sceneState } from "@/stores/sceneState.svelte";
  import { ambienceEngine } from "@/lib/engines/ambienceEngine";
  import { musicEngine } from "@/lib/engines/musicEngine";

  const FADE_MS = 600;

  let fading = $state(false);

  async function unlock() {
    if (fading) return;
    fading = true;

    await Tone.start();
    await new Promise((resolve) => setTimeout(resolve, FADE_MS));

    appState.audioReady = true;

    if (appState.scene?.id) sceneState.requestedSceneId = appState.scene.id;
    if (appState.ambiences?.length) await ambienceEngine.syncActive(appState.ambiences);
    if (appState.music?.playlistId) await musicEngine.setPlaylist(appState.music.playlistId);
    if (appState.music) musicEngine.setVolume(appState.music.volume);
  }
</script>

<div
  class="gate"
  class:fading
  role="button"
  tabindex="0"
  onclick={unlock}
  onkeydown={(e) => e.key === "Enter" && unlock()}
>
  <div class="content">
    <h1 class="title">At the Grove of the Well</h1>
    <span class="prompt">Click to begin</span>
  </div>
</div>

<style>
  .gate {
    position: fixed;
    inset: 0;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 1;
    transition: opacity 600ms ease;
  }

  .gate.fading {
    opacity: 0;
  }

  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-6);
  }

  .title {
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .prompt {
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
    opacity: 0.5;
  }
</style>
