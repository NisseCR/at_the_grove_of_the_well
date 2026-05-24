<script lang="ts">
  import SceneRenderer from "@/components/scene/SceneRenderer.svelte";
  import ConnectionIndicator from "@/components/ui/ConnectionIndicator.svelte";
</script>

<div class="player">
  <SceneRenderer />
  <ConnectionIndicator />
</div>

<style>
  .player {
    position: fixed;
    inset: 0;
    background: #0a0a0a;
    overflow: hidden;
  }
</style>
