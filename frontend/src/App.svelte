<script lang="ts">
  import { onMount } from "svelte";
  import IntensitySlider from "@/components/Slider.svelte";
  import * as transport from "@/lib/transport";

  // ── State ──────────────────────────────────────────────────────────────────

  let intensity = $state(0);
  let status = $state<"idle" | "loading" | "ready" | "error">("idle");
  let errorMsg = $state("");
  let apiStatus = $state<"unknown" | "ok" | "error">("unknown");

  // ── Stems to load ──────────────────────────────────────────────────────────
  // Place your .wav files in frontend/public/stems/
  // Rename or add/remove entries to match your actual files.

  const STEMS = [
    { id: "stem-1", url: "/stems/stem-1.ogg" },
    { id: "stem-2", url: "/stems/stem-2.ogg" },
    { id: "stem-3", url: "/stems/stem-3.ogg" },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onMount(async () => {
    // Check backend is reachable
    try {
      const res = await fetch("http://localhost:8000/ping");
      apiStatus = res.ok ? "ok" : "error";
    } catch {
      apiStatus = "error";
    }
  });

  // ── Handlers ───────────────────────────────────────────────────────────────

  async function startAudio() {
    status = "loading";
    try {
      await transport.loadStems(STEMS);
      status = "ready";
    } catch (e) {
      errorMsg = String(e);
      status = "error";
    }
  }

  function onIntensityChange(value: number) {
    intensity = value;
    transport.setIntensity(value);
  }

  function stopAudio() {
    transport.stop();
    status = "idle";
    intensity = 0;
  }
</script>

<!-- ── Layout ─────────────────────────────────────────────────────────────── -->
<main class="container">
  <h1>TTRPG Music <small>dev</small></h1>

  <!-- Backend status -->
  <p>
    Backend:
    {#if apiStatus === "ok"}
      <ins>reachable</ins>
    {:else if apiStatus === "error"}
      <del>unreachable — is FastAPI running?</del>
    {:else}
      checking…
    {/if}
  </p>

  <hr />

  <!-- Audio controls -->
  <section>
    <h2>Audio engine</h2>

    {#if status === "idle"}
      <button onclick={startAudio}>Load stems</button>
    {:else if status === "loading"}
      <p aria-busy="true">Loading stems…</p>
    {:else if status === "error"}
      <p><strong>Error:</strong> {errorMsg}</p>
      <button onclick={startAudio}>Retry</button>
    {:else if status === "ready"}
      <p><ins>Stems loaded and playing.</ins></p>

      <div class="controls">
        <IntensitySlider bind:value={intensity} onChange={onIntensityChange} />
      </div>

      <!-- Visual feedback: which stems are active -->
      <div class="stem-indicators">
        {#each STEMS as stem, i}
          {@const threshold = i / STEMS.length}
          <div class="stem-indicator {intensity > threshold ? 'active' : ''}">
            {stem.id}
          </div>
        {/each}
      </div>

      <button class="secondary" onclick={stopAudio}>Stop</button>
    {/if}
  </section>
</main>

<style>
  .controls {
    max-width: 360px;
    margin: 1.5rem 0;
  }

  .stem-indicators {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .stem-indicator {
    padding: 0.3rem 0.75rem;
    border-radius: var(--pico-border-radius);
    border: 1px solid var(--pico-muted-border-color);
    font-size: 0.75rem;
    color: var(--pico-muted-color);
    transition: all 0.3s ease;
  }

  .stem-indicator.active {
    border-color: var(--pico-primary);
    color: var(--pico-primary);
    background: color-mix(in srgb, var(--pico-primary) 10%, transparent);
  }
</style>
