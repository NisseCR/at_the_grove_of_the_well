<script lang="ts">
  interface Props {
    onbegin: () => void;
  }

  const { onbegin }: Props = $props();
</script>

<div class="gate" onclick={onbegin}>
  <span>Begin story</span>
</div>

<style>
  .gate {
    position: fixed;
    inset: 0;
    background: #0a0a0a;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  span {
    color: #fff;
    font-size: 1.5rem;
    letter-spacing: 0.15em;
  }
</style>
