<script lang="ts">
  import { Search } from "@lucide/svelte";

  interface Props {
    /** Current search value — use bind:value from the parent. */
    value: string;
    placeholder?: string;
  }

  let { value = $bindable(), placeholder = "Search…" }: Props = $props();
</script>

<div class="search-row">
  <span class="search-icon"><Search size={14} /></span>
  <input
    class="search-input"
    type="search"
    {placeholder}
    bind:value
  />
</div>

<style>
  .search-row {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
  }

  .search-icon {
    position: absolute;
    left: var(--space-3);
    color: var(--color-text-faint);
    display: flex;
    pointer-events: none;
  }

  .search-input {
    box-sizing: border-box;
    width: 100%;
    padding: var(--space-2) var(--space-3) var(--space-2) calc(var(--space-3) + 14px + var(--space-2));
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm, 4px);
    color: var(--color-text);
    font-family: var(--font-body);
    font-size: var(--text-sm);
    outline: none;
    transition: border-color var(--ease-fast);
  }

  .search-input:focus {
    border-color: var(--color-text-faint);
  }

  .search-input::placeholder {
    color: var(--color-text-faint);
  }
</style>
