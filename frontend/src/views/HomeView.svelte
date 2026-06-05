<script lang="ts">
  import { Lock } from "@lucide/svelte";
  import { navigate, type KnownView } from "@/stores/router.svelte";
  import { auth } from "@/stores/auth.svelte";
  import LoginModal from "@/components/LoginModal.svelte";

  let pendingView = $state<"controller" | "sync" | null>(null);

  function openView(view: KnownView) {
    if ((view === "controller" || view === "sync") && !auth.isAuthenticated) {
      pendingView = view;
      return;
    }
    navigate(view);
  }

  function onLoginSuccess() {
    const target = pendingView;
    pendingView = null;
    if (target) navigate(target);
  }
</script>

{#if pendingView}
  <LoginModal onclose={() => (pendingView = null)} onsuccess={onLoginSuccess} />
{/if}

<div class="home">
  <div class="bg"></div>

  <div class="content">
    <h1 class="title">At the Grove of the Well</h1>

    <nav class="cards">
      <button class="card" onclick={() => openView("player")}>
        <span class="card-label">Player</span>
        <span class="card-desc">The audio-visual experience</span>
      </button>

      <button class="card" class:locked={!auth.isAuthenticated} onclick={() => openView("controller")}>
        <span class="card-label">
          Controller
          {#if !auth.isAuthenticated}<span class="lock-icon"><Lock size={13} /></span>{/if}
        </span>
        <span class="card-desc">Set scenes, ambiences and music</span>
      </button>

      <button class="card" class:locked={!auth.isAuthenticated} onclick={() => openView("sync")}>
        <span class="card-label">
          Sync
          {#if !auth.isAuthenticated}<span class="lock-icon"><Lock size={13} /></span>{/if}
        </span>
        <span class="card-desc">Reload content from R2</span>
      </button>
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
    gap: var(--space-4);
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
    min-width: 180px;
    text-align: center;
    transition:
      background var(--ease-fast),
      border-color var(--ease-fast);
  }

  .card:hover {
    background: var(--color-glass-hover);
    border-color: var(--color-border-hover);
  }

  .card.locked {
    opacity: 0.45;
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

  .lock-icon {
    display: flex;
    opacity: 0.7;
  }

  .card-desc {
    font-size: var(--text-xs);
    color: var(--color-text-muted);
  }
</style>
