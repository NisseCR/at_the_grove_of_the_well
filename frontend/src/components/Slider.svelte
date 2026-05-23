<script lang="ts">
  interface Props {
    value?: number;
    onChange?: (value: number) => void;
  }

  let { value = $bindable(0), onChange }: Props = $props();

  function onInput(e: Event) {
    value = Number((e.target as HTMLInputElement).value);
    onChange?.(value);
  }
</script>

<div class="slider-wrap">
  <label for="intensity">Intensity</label>
  <input
    id="intensity"
    type="range"
    min="0"
    max="1"
    step="0.01"
    {value}
    oninput={onInput}
  />
  <span class="readout">{Math.round(value * 100)}%</span>
</div>

<style>
  .slider-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--pico-muted-color);
  }

  .readout {
    font-size: 0.8rem;
    color: var(--pico-muted-color);
    text-align: right;
  }
</style>
