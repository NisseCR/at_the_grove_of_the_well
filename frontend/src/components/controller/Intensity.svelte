<!-- <script lang="ts">
  import { setIntensity } from "@/lib/transport"

  // Local value drives the slider — instant, no network involved
  let intensity = $state(0)

  function onInput(value: number) {
    intensity = value               // update slider immediately
    setIntensity(value)             // send over WebSocket
  }
</script>

<input type="range" min="0" max="1" step="0.01"
  value={intensity}
  oninput={(e) => onInput(Number(e.target.value))}
/> -->
