<script lang="ts">
  import { onMount } from "svelte";
  import { sceneService } from "@/lib/services/sceneService";

  let sceneName = $state("");
  let sceneSrc = $state("");

  onMount(async () => {
    const scene = await sceneService.fetchScene("abyssus");
    sceneName = scene.name;
    sceneSrc = scene.background.src;
  });
</script>

<h1>Abyssus test</h1>
<p>{sceneName}</p>
<img src={sceneSrc} alt="scene" />
