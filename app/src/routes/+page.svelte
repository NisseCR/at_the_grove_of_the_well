
<script lang="ts">
  import { Lock } from "@lucide/svelte";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<div class="home">
  <div class="bg"></div>

  <div class="content">
    <h1 class="title">At the Grove of the Well</h1>

    <nav class="cards">
      <a href="/player" class="card">
        <span class="card-label">Player</span>
        <span class="card-desc">The audio-visual experience</span>
      </a>

      <a href="/controller/scenes" class="card" data-sveltekit-reload>
        <span class="card-label">
          Controller
          {#if !data.isAuthed}<Lock size={13} class="lock-icon" />{/if}
        </span>
        <span class="card-desc">Set audio and visuals</span>
      </a>
    </nav>
  </div>
</div>

<style>
  .home {
    position: relative;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .bg {
    position: absolute;
    inset: 0;
    background-image: url("/controller-background.jpg");
    background-size: cover;
    background-position: center;
    filter: blur(var(--blur-bg)) brightness(0.25);
    transform: scale(1.08);
    z-index: 0;
  }

  .content {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-10);
  }

  .title {
    font-size: var(--text-lg);
    letter-spacing: var(--tracking-wider);
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-4);
    padding-inline: var(--space-6);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-8) var(--space-10);
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    min-width: 220px;
    flex: 1 1 220px;
    max-width: 340px;
    text-align: center;
    text-decoration: none;
    transition:
      background var(--ease-fast),
      border-color var(--ease-fast);
  }

  .card:hover {
    background: var(--color-glass-hover);
    border-color: var(--color-border-hover);
  }

  .card-label {
    font-family: var(--font-display);
    font-size: var(--text-base);
    color: var(--color-text);
    letter-spacing: var(--tracking-wide);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }

  .card-desc {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
    white-space: nowrap;
  }
</style>
