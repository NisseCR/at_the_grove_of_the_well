<script lang="ts">
  import * as Tone from "tone";
  import { onMount, onDestroy } from "svelte";
  import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";
  import {
    PUBLIC_DISCORD_CLIENT_ID,
    PUBLIC_ASSETS_BASE,
  } from "$env/static/public";
  import { connect } from "$lib/services/transport";
  import SceneRenderer from "$lib/components/scene/SceneRenderer.svelte";
  import StoryGate from "$lib/components/scene/StoryGate.svelte";
  import AudioRenderer from "$lib/components/audio/AudioRenderer.svelte";
  import VolumeOverlay from "$lib/components/player/VolumeOverlay.svelte";
  import DebugOverlay from "$lib/components/player/DebugOverlay.svelte";
  import { appState } from "$lib/state/appState.svelte";
  import { sceneState } from "$lib/state/sceneState.svelte";

  onMount(async () => {
    const sdk = new DiscordSDK(PUBLIC_DISCORD_CLIENT_ID);
    await sdk.ready();
    patchUrlMappings(
      [{ prefix: "/r2", target: new URL(PUBLIC_ASSETS_BASE).host }],
      { patchSrcAttributes: true },
    );
    connect();
  });

  async function unlock(): Promise<void> {
    await Tone.start();
    appState.renderReady = true;
  }

  onDestroy(() => {
    appState.renderReady = false;
  });
</script>

<div class="player">
  <div class="stage">
    {#if !appState.renderReady}
      <StoryGate onunlock={unlock} title="At the Grove of the Well" />
    {:else}
      <AudioRenderer state={appState} />
      <SceneRenderer
        slotState={sceneState}
        requestedSceneId={appState.scene?.id ?? null}
      />
      <VolumeOverlay />
      {#if appState.debug}<DebugOverlay />{/if}
    {/if}
  </div>
</div>

<style>
  .player {
    position: fixed;
    inset: 0;
    background: black;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .stage {
    position: relative;
    aspect-ratio: 16 / 9;
    width: min(100vw, calc(100vh * 16 / 9));
    background: var(--color-bg);
    overflow: hidden;
    border-radius: 8px;
  }
</style>
