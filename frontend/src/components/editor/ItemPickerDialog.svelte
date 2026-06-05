<script lang="ts">
  import { Dialog } from "bits-ui";
  import SearchInput from "@/components/editor/SearchInput.svelte";

  interface Item {
    id: string;
    label: string;
  }

  interface Props {
    open: boolean;
    items: Item[];
    title?: string;
    placeholder?: string;
    onpick: (item: Item) => void;
    oncancel: () => void;
  }

  let {
    open = $bindable(),
    items,
    title = "Pick item",
    placeholder = "Search…",
    onpick,
    oncancel,
  }: Props = $props();

  let searchQuery = $state("");

  $effect(() => {
    if (open) searchQuery = "";
  });

  /** Returns items matching the current search query. */
  function filtered(): Item[] {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }

  function handlePick(item: Item) {
    onpick(item);
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="item-picker-overlay" />
    <Dialog.Content class="item-picker-panel">
      <Dialog.Title class="item-picker-title">{title}</Dialog.Title>

      <SearchInput bind:value={searchQuery} {placeholder} />

      <div class="list">
        {#if filtered().length === 0}
          <p class="status">
            {searchQuery ? `No results for "${searchQuery}"` : "Nothing available."}
          </p>
        {:else}
          {#each filtered() as item (item.id)}
            <button class="item" onclick={() => handlePick(item)}>
              {item.label}
            </button>
          {/each}
        {/if}
      </div>

      <div class="footer">
        <button class="btn-secondary" onclick={oncancel}>Cancel</button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<style>
  :global(.item-picker-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.item-picker-panel) {
    position: fixed;
    top: 10vh;
    left: 50%;
    transform: translateX(-50%);
    z-index: 51;
    background: #1a1825;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md, 8px);
    padding: var(--space-6);
    width: min(480px, 90vw);
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  :global(.item-picker-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  .list {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-height: 0;
  }

  .status {
    color: var(--color-text-faint);
    font-size: var(--text-sm);
    font-style: italic;
    padding: var(--space-4) 0;
  }

  .item {
    display: block;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm, 4px);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    box-sizing: border-box;
    min-width: 0;
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    transition: background var(--ease-fast);
  }

  .item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    border-top: 1px solid var(--color-border);
    padding-top: var(--space-4);
  }

  .btn-secondary {
    font-family: var(--font-body);
    font-size: var(--text-sm);
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm, 4px);
    background: rgba(255, 255, 255, 0.08);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    cursor: pointer;
    transition: background var(--ease-fast), color var(--ease-fast);
  }

  .btn-secondary:hover {
    background: rgba(255, 255, 255, 0.12);
    color: var(--color-text);
  }
</style>
