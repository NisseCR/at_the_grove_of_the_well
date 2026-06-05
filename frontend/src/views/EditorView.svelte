<script lang="ts">
  import { navigate } from "@/stores/router.svelte";
</script>

<div class="editor">
  <div class="bg"></div>

  <nav class="tabs">
    <button class="back" onclick={() => navigate("home")}>← Home</button>
  </nav>

  <div class="main">
    <div class="content">
      <!-- editor goes here -->
    </div>
  </div>
</div>

<style>
  .editor {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .bg {
    position: absolute;
    inset: 0;
    background-image: url("/controller-background.jpg");
    background-size: cover;
    background-position: center;
    filter: blur(var(--blur-bg)) brightness(0.35);
    transform: scale(1.08);
    z-index: 0;
  }

  .tabs {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-4) var(--space-6) 0;
    background: rgba(8, 6, 14, 0.75);
    backdrop-filter: blur(var(--blur-md));
    -webkit-backdrop-filter: blur(var(--blur-md));
    border-bottom: 1px solid var(--color-border);
  }

  .back {
    font-family: var(--font-body);
    font-size: var(--text-xs);
    color: var(--color-text-faint);
    padding: var(--space-2) var(--space-3);
    padding-bottom: var(--space-3);
    margin-right: var(--space-4);
    transition: color var(--ease-fast);
  }

  .back:hover {
    color: var(--color-text-muted);
  }

  .main {
    position: relative;
    z-index: 1;
    flex: 1;
    overflow: hidden;
  }

  .content {
    height: 100%;
    overflow-y: auto;
    padding: var(--space-6);
    padding-top: var(--space-10);
  }

  .content :global(> *) {
    max-width: var(--content-max-width);
    margin-inline: auto;
  }
</style>
