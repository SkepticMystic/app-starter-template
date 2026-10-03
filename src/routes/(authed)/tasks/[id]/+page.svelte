<script lang="ts">
  import { resolve } from "$app/paths";
  import Header from "#lib/components/ui/header/Header.svelte";
  import Button from "#lib/components/ui/button/button.svelte";

  let { data } = $props();
</script>

<article>
  <Header
    title={data.task.title}
    back={{ href: resolve("/(authed)/tasks"), label: "Tasks" }}
  >
    {#snippet actions()}
      <Button
        variant="outline"
        icon="lucide/pencil"
        href={resolve("/(authed)/tasks/[id]/edit", data.task)}
      >
        Edit task
      </Button>
    {/snippet}
  </Header>

  <section>
    <pre>{JSON.stringify(data.task, null, 2)}</pre>
  </section>
</article>
