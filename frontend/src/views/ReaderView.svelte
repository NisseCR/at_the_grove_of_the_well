<script lang="ts">
  import { onDestroy } from "svelte";
  import { router } from "@/stores/router.svelte";
  import { readerEngine } from "@/lib/engines/readerEngine";
  import ReaderIndex from "@/components/reader/ReaderIndex.svelte";
  import ReaderStory from "@/components/reader/ReaderStory.svelte";

  onDestroy(() => readerEngine.reset());
</script>

{#if router.slug}
  <ReaderStory />
{:else}
  <ReaderIndex />
{/if}
