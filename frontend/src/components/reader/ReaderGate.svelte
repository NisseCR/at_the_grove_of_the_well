<script lang="ts">
  let { onunlock }: { onunlock: () => Promise<void> } = $props();

  let fading = $state(false);

  async function unlock() {
    if (fading) return;
    fading = true;
    await onunlock();
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
    z-index: 10;
    opacity: 1;
    transition: opacity 600ms ease;
  }

  .gate.fading {
    opacity: 0;
    pointer-events: none;
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
