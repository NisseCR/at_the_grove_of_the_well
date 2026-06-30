<script lang="ts">
  import { Search, X } from "@lucide/svelte";

  let { value = $bindable(""), placeholder = "Search..." } = $props();
</script>

<div class="search-bar">
  <span class="icon"><Search size={13} /></span>
  <input
    type="text"
    bind:value
    {placeholder}
    class="search-input"
    autocomplete="off"
    spellcheck="false"
  />
  {#if value}
    <button class="clear-btn" onclick={() => (value = "")} aria-label="Clear search">
      <X size={13} />
    </button>
  {/if}
</div>

<style>
  .search-bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding-inline: var(--space-3);
    height: 36px;
    background: var(--color-glass);
    backdrop-filter: blur(var(--blur-sm));
    -webkit-backdrop-filter: blur(var(--blur-sm));
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    transition: border-color var(--ease-fast);
  }

  .search-bar:focus-within {
    border-color: var(--color-border-hover);
  }

  .icon {
    display: flex;
    color: var(--color-text-faint);
    flex-shrink: 0;
  }

  .search-input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    color: var(--color-text);
    font-size: var(--text-sm);
    letter-spacing: var(--tracking-wide);
    min-width: 0;
  }

  .search-input::placeholder {
    color: var(--color-text-faint);
  }

  .clear-btn {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: var(--color-text-faint);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;
    transition: color var(--ease-fast);
  }

  .clear-btn:hover {
    color: var(--color-text-muted);
  }
</style>
