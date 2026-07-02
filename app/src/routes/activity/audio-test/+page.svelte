<script lang="ts">
  import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";
  import * as Tone from "tone";
  import {
    PUBLIC_DISCORD_CLIENT_ID,
    PUBLIC_ASSETS_BASE,
  } from "$env/static/public";

  let log = $state<string[]>([]);
  let sdkReady = $state(false);

  const append = (msg: string) => {
    log = [...log, msg];
  };

  async function init() {
    try {
      const sdk = new DiscordSDK(PUBLIC_DISCORD_CLIENT_ID);
      await Promise.race([
        sdk.ready(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("timeout — are you inside Discord?")),
            5000,
          ),
        ),
      ]);
      patchUrlMappings([{ prefix: "/r2", target: PUBLIC_ASSETS_BASE }]);
      sdkReady = true;
      append("✓ SDK ready — URL mappings patched");
    } catch (e) {
      append(`✗ SDK init: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function testOscillator() {
    try {
      await Tone.start();
      append(`✓ AudioContext: ${Tone.getContext().state}`);
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease("C4", "0.5");
      append("✓ Oscillator fired — did you hear a beep?");
    } catch (e) {
      append(`✗ Oscillator: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function testPlayer() {
    // TODO: verify this path matches a real file in your R2 bucket
    const url = `${PUBLIC_ASSETS_BASE}/ambiences/01-weather/blizzard.webm`;
    try {
      append(`Loading: ${url}`);
      const player = new Tone.Player({ url, loop: true }).toDestination();
      await Tone.loaded();
      player.start();
      append("✓ Player started — do you hear looping audio?");
    } catch (e) {
      append(`✗ Player: ${e instanceof Error ? e.message : e}`);
    }
  }

  async function testWebSocket() {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url = `${protocol}//${window.location.host}/api/control/ws`;
      append(`Connecting: ${url}`);
      const ws = new WebSocket(url);
      await new Promise<void>((resolve, reject) => {
        ws.onopen = () => {
          append("✓ WebSocket connected");
          ws.close();
          resolve();
        };
        ws.onerror = () => reject(new Error("connection failed"));
        setTimeout(() => reject(new Error("timeout")), 5000);
      });
    } catch (e) {
      append(`✗ WebSocket: ${e instanceof Error ? e.message : e}`);
    }
  }

  init();
</script>

<main>
  <h1>Audio Test</h1>
  <p class="status">SDK: {sdkReady ? "✓ ready" : "initializing…"}</p>

  <div class="buttons">
    <button onclick={testOscillator} disabled={!sdkReady}>
      1. Oscillator
    </button>
    <button onclick={testPlayer} disabled={!sdkReady}> 2. R2 File </button>
    <button onclick={testWebSocket} disabled={!sdkReady}> 3. WebSocket </button>
  </div>

  <ul>
    {#each log as entry}
      <li class:error={entry.startsWith("✗")}>{entry}</li>
    {/each}
  </ul>
</main>

<style>
  main {
    padding: 2rem;
    min-height: 100vh;
    background: #0d0b14;
    color: #c8c0d8;
    font-family: monospace;
    font-size: 0.875rem;
  }

  h1 {
    font-size: 1rem;
    letter-spacing: 0.1em;
    color: #e8e0f8;
    margin-bottom: 0.5rem;
  }

  .status {
    color: #6b5f80;
    margin-bottom: 1.5rem;
  }

  .buttons {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  button {
    padding: 0.5rem 1rem;
    background: #1e1a2e;
    color: #c8c0d8;
    border: 1px solid #3a3050;
    border-radius: 4px;
    cursor: pointer;
    font-family: monospace;
    font-size: 0.875rem;
    transition: border-color 0.15s;
  }

  button:hover:not(:disabled) {
    border-color: #7c6fa0;
  }

  button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    border: 1px solid #1e1a2e;
    border-radius: 4px;
    overflow: hidden;
  }

  li {
    padding: 0.375rem 0.75rem;
    border-bottom: 1px solid #1e1a2e;
    color: #a09ab8;
  }

  li.error {
    color: #c87070;
  }

  li:last-child {
    border-bottom: none;
  }
</style>
