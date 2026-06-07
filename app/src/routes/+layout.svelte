<script lang="ts">
  import { Toaster } from "svelte-sonner";
  import "../app.css";

  const { children } = $props();
</script>

<Toaster theme="dark" position="bottom-right" richColors />
{@render children()}
