<script lang="ts">
  let obj = {
    src: "http://localhost:8000/static/assets/images/abyssus.jpg",
    alt: "yo",
  };

  let count = $state(0);
</script>

<h1>Home view</h1>

<button onclick={() => count++}>
  {count}
</button>

<img {...obj} />
