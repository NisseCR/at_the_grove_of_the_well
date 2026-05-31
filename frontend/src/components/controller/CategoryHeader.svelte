<script lang="ts">
  interface Props {
    label: string;
  }

  const { label }: Props = $props();
</script>

<h3 class="category-header">{label}</h3>

<style>
  .category-header {
    font-family: var(--font-display);
    font-size: var(--text-base);
    letter-spacing: var(--tracking-wide);
    text-transform: capitalize;
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }
</style>
