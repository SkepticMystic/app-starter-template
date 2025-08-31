<script lang="ts">
  let { data } = $props();
</script>

<pre>{JSON.stringify(data.task, null, 2)}</pre>
