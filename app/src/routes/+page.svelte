<script lang="ts">
  import { Lock } from "@lucide/svelte";
</script>

<div class="home">
  <div class="bg"></div>

  <div class="content">
    <h1 class="title">At the Grove of the Well</h1>

    <nav class="cards">
      <a href="/player" class="card">
        <span class="card-label">Player</span>
        <span class="card-desc">The audio-visual VTT experience</span>
      </a>

      <a href="/reader" class="card">
        <span class="card-label">Reader</span>
        <span class="card-desc">The immersive reading experience</span>
      </a>

      <a href="/controller/scenes" class="card" data-sveltekit-reload>
        <Lock size={13} class="lock-icon" />
        <span class="card-label">Controller</span>
        <span class="card-desc">Control scenes, ambiences and music</span>
      </a>
    </nav>

    <a href="/activity/audio-test" class="dev-link">Discord activity audio test</a>
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
    flex-direction: column;
    align-items: center;
    gap: var(--space-4);
    padding-inline: var(--space-6);
    width: 100%;
  }

  .card {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-8) var(--space-10);
    background: var(--color-glass);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    width: min(380px, 100%);
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
  }

  .card-desc {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }

  .dev-link {
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    text-decoration: none;
    letter-spacing: var(--tracking-wide);
    transition: color var(--ease-fast);
  }

  .dev-link:hover {
    color: var(--color-text-muted);
  }

  :global(.lock-icon) {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    color: var(--color-text-faint);
  }
</style>
