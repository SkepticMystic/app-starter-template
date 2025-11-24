<script lang="ts">
  import { resolve } from "$app/paths";
  import Button from "$lib/components/ui/button/button.svelte";

  let { data } = $props();
</script>

<article>
  <header class="flex items-center justify-between">
    <h1>{data.task.title}</h1>

    <Button
      variant="outline"
      icon="lucide/pencil"
      href={resolve("/tasks/[id]/edit", data.task)}
    >
      Edit task
    </Button>
  </header>

  <section>
    <pre>{JSON.stringify(data.task, null, 2)}</pre>
  </section>
</article>
