<script lang="ts">
  import { Dialog } from "bits-ui";
  import { AudioWaveform } from "@lucide/svelte";
  import type { Ambience } from "@/types/ambience";
  import SearchInput from "@/components/editor/SearchInput.svelte";

  interface Props {
    open: boolean;
    /** Pre-filtered list — caller excludes ambiences already in the category. */
    ambiences: Ambience[];
    onpick: (ambience: Ambience) => void;
    oncancel: () => void;
  }

  let { open = $bindable(), ambiences, onpick, oncancel }: Props = $props();

  let searchQuery = $state("");

  $effect(() => {
    if (open) searchQuery = "";
  });

  /** Returns ambiences matching the current search query. */
  function filtered(): Ambience[] {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return ambiences;
    return ambiences.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        (a.audio_asset_label?.toLowerCase().includes(q) ?? false),
    );
  }

  function handlePick(ambience: Ambience) {
    onpick(ambience);
    open = false;
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="amb-picker-overlay" />
    <Dialog.Content class="amb-picker-panel">
      <Dialog.Title class="amb-picker-title">Add ambience to category</Dialog.Title>

      <SearchInput bind:value={searchQuery} placeholder="Search by label or audio asset…" />

      <div class="list">
        {#if filtered().length === 0}
          <p class="status">
            {searchQuery ? `No results for "${searchQuery}"` : "No ambiences available."}
          </p>
        {:else}
          {#each filtered() as ambience (ambience.id)}
            <button class="item" onclick={() => handlePick(ambience)}>
              <span class="item-label">{ambience.label}</span>
              {#if ambience.audio_asset_label}
                <span class="item-audio">
                  <AudioWaveform size={11} strokeWidth={1.5} />
                  {ambience.audio_asset_label}
                </span>
              {:else}
                <span class="item-warn">No audio linked</span>
              {/if}
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
  :global(.amb-picker-overlay) {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    z-index: 50;
  }

  :global(.amb-picker-panel) {
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

  :global(.amb-picker-title) {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    color: var(--color-text);
    margin: 0;
  }

  .list {
    flex: 1;
    overflow-y: auto;
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm, 4px);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background var(--ease-fast);
  }

  .item:hover {
    background: rgba(255, 255, 255, 0.06);
  }

  .item-label {
    flex: 1;
    font-size: var(--text-sm);
    color: var(--color-text);
    font-family: var(--font-body);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-audio {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    font-family: var(--font-body);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .item-warn {
    font-size: var(--text-xs);
    color: #e67e22;
    font-family: var(--font-body);
    white-space: nowrap;
    flex-shrink: 0;
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
