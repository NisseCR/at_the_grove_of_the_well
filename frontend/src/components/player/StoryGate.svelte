<script lang="ts">
  interface Props {
    onbegin: () => void;
  }

  const { onbegin }: Props = $props();

  let fading = $state(false);

  function handleClick() {
    fading = true;
    setTimeout(onbegin, 800);
  }
</script>

<div class="gate" class:fading onclick={handleClick}>
  <span>Begin story</span>
</div>

<style>
  .gate {
    position: fixed;
    inset: 0;
    background: var(--color-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 800ms ease;
  }

  .gate.fading {
    opacity: 0;
  }

  span {
    font-family: var(--font-display);
    font-size: 3rem;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: capitalize;
    color: var(--color-accent);
    animation: breathe 3s ease-in-out infinite;
  }

  @keyframes breathe {
    0%, 100% { opacity: 0.45; }
    50%       { opacity: 0.85; }
  }
</style>
