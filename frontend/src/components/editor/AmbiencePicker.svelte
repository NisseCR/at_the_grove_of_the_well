<script lang="ts">
  import type { AmbienceAsset } from "@/types/ambience";

  type Props = {
    ambiences: AmbienceAsset[];
    onselect: (id: string) => void;
    onclose: () => void;
  };

  let { ambiences, onselect, onclose }: Props = $props();

  function select(id: string) {
    onselect(id);
    onclose();
  }
</script>

<div class="backdrop" role="presentation" onclick={onclose}></div>

<div class="panel" role="dialog">
  <div class="panel-header">
    <span>Select ambience</span>
    <button class="btn-close" onclick={onclose}>×</button>
  </div>

  {#if ambiences.length === 0}
    <p class="empty">All ambiences are already linked.</p>
  {:else}
    <ul class="list">
      {#each ambiences as ambience (ambience.id)}
        <li>
          <button class="option" onclick={() => select(ambience.id)}>
            {ambience.id}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 10;
  }

  .panel {
    position: fixed;
    z-index: 11;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 320px;
    max-height: 420px;
    display: flex;
    flex-direction: column;
    background: rgba(12, 10, 22, 0.92);
    border: 1px solid var(--color-border-hover);
    border-radius: var(--radius-lg);
    backdrop-filter: blur(var(--blur-lg));
    -webkit-backdrop-filter: blur(var(--blur-lg));
    overflow: hidden;
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border);
    font-family: var(--font-display);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    letter-spacing: var(--tracking-wide);
    flex-shrink: 0;
  }

  .btn-close {
    font-size: var(--text-base);
    color: var(--color-text-faint);
    line-height: 1;
    transition: color var(--ease-fast);
  }

  .btn-close:hover {
    color: var(--color-text-muted);
  }

  .list {
    list-style: none;
    overflow-y: auto;
    padding: var(--space-2);
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .option {
    display: block;
    width: 100%;
    text-align: left;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    transition: background var(--ease-fast), color var(--ease-fast);
  }

  .option:hover {
    background: var(--color-glass-hover);
    color: var(--color-text);
  }

  .empty {
    padding: var(--space-4);
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    text-align: center;
  }
</style>
