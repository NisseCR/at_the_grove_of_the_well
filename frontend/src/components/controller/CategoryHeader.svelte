<script lang="ts">
  interface Props {
    label: string;
  }

  const { label }: Props = $props();
</script>

<h3 class="category-header">{label}</h3>

<style>
  .category-header {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    letter-spacing: var(--tracking-wider);
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 1px solid var(--color-border);
  }
</style>
