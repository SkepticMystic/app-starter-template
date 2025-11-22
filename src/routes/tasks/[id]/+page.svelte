<script lang="ts">
  let { data } = $props();
</script>

<article>
  <header>
    <h1>{data.task.title}</h1>
  </header>

  <section>
    <pre>{JSON.stringify(data.task, null, 2)}</pre>
  </section>
</article>
