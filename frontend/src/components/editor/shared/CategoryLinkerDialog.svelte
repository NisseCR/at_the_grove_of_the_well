<script lang="ts">
  import { Dialog } from "bits-ui";

  interface CategoryItem {
    id: string;
    label: string;
  }

  interface Props {
    /** Controls dialog open state — use bind:open from the parent. */
    open: boolean;
    /** Label of the entity being linked (e.g. ambience name). */
    entityLabel: string;
    /** All available categories to link against. */
    categories: CategoryItem[];
    /** IDs of categories currently linked to the entity. */
    linkedIds: Set<string>;
    /** Called when a category is toggled on. */
    onlink: (categoryId: string) => void;
    /** Called when a category is toggled off. */
    onunlink: (categoryId: string) => void;
    onclose: () => void;
  }

  let { open = $bindable(), entityLabel, categories, linkedIds, onlink, onunlink, onclose }: Props =
    $props();
</script>

<Dialog.Root bind:open onOpenChange={(v) => { if (!v) onclose(); }}>
  <Dialog.Portal>
    <Dialog.Overlay class="cl-overlay" />
    <Dialog.Content class="cl-panel">
      <Dialog.Title class="cl-title">Categories — {entityLabel}</Dialog.Title>
      <Dialog.Description class="cl-desc">
        Toggle categories to link or unlink this item.
      </Dialog.Description>

      {#if categories.length === 0}
        <p class="cl-empty">No categories exist yet.</p>
      {:else}
        <div class="cl-chips">
          {#each categories as cat (cat.id)}
            {@const linked = linkedIds.has(cat.id)}
            <button
              class="cl-chip"
              class:cl-chip--linked={linked}
              onclick={() => (linked ? onunlink(cat.id) : onlink(cat.id))}
            >
              {cat.label}
            </button>
          {/each}
        </div>
      {/if}

      <div class="cl-actions">
        <button class="btn-secondary" onclick={onclose}>Close</button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.cl-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.cl-panel) {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(420px, 90vw);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.cl-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  :global(.cl-desc) {
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    margin: 0;
  }

  :global(.cl-empty) {
    font-size: var(--text-sm);
    color: var(--color-text-faint);
    font-style: italic;
    margin: 0;
  }

  :global(.cl-chips) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  :global(.cl-chip) {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    color: var(--color-text-muted);
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid var(--color-border);
    border-radius: 99px;
    padding: var(--space-1) var(--space-4);
    cursor: pointer;
    transition:
      color var(--ease-fast),
      border-color var(--ease-fast),
      background var(--ease-fast);
  }

  :global(.cl-chip:hover) {
    color: var(--color-text);
    border-color: var(--color-text-faint);
  }

  :global(.cl-chip--linked) {
    color: var(--color-accent);
    border-color: var(--color-accent);
    background: rgba(255, 255, 255, 0.06);
  }

  :global(.cl-chip--linked:hover) {
    background: rgba(192, 57, 43, 0.12);
    color: #e74c3c;
    border-color: #e74c3c;
  }

  .cl-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--space-2);
  }

  .btn-secondary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    cursor: pointer;
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    transition: background var(--ease-fast), color var(--ease-fast);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--color-text);
  }
</style>
