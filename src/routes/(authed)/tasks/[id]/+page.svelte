<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { TaskClient } from "#lib/clients/tasks.client.js";
  import StatusBadge from "#lib/components/ui/badge/StatusBadge.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
  import DescriptionItem from "#lib/components/ui/description-list/DescriptionItem.svelte";
  import DescriptionList from "#lib/components/ui/description-list/DescriptionList.svelte";
  import Time from "#lib/components/ui/elements/Time.svelte";
  import Header from "#lib/components/ui/header/Header.svelte";
  import DetailLayout from "#lib/components/ui/layout/DetailLayout.svelte";
  import Page from "#lib/components/ui/layout/Page.svelte";
  import { TASKS } from "#lib/const/task.const.js";

  let { data } = $props();

  const task = $derived(data.task);
</script>

<Page>
  <Header
    title={task.title}
    back={{ href: resolve("/(authed)/tasks"), label: "Tasks" }}
  >
    {#snippet badges()}
      <StatusBadge status={TASKS.STATUS.MAP[task.status]} />
    {/snippet}

    {#snippet actions()}
      <Button
        variant="outline"
        icon="lucide/pencil"
        href={resolve("/(authed)/tasks/[id]/edit", task)}
      >
        Edit task
      </Button>

      <Button
        variant="destructive"
        icon="lucide/trash-2"
        onclick={() =>
          TaskClient.delete(task.id, {
            on_success: () => goto(resolve("/(authed)/tasks")),
          })}
      >
        Delete
      </Button>
    {/snippet}
  </Header>

  <DetailLayout>
    <Card title="Description">
      {#snippet children()}
        {#if task.description}
          <p class="whitespace-pre-wrap">{task.description}</p>
        {:else}
          <p class="text-sm text-muted-foreground">No description.</p>
        {/if}
      {/snippet}
    </Card>

    {#snippet aside()}
      <Card title="Details">
        {#snippet children()}
          <DescriptionList>
            <DescriptionItem label="Status">
              <StatusBadge status={TASKS.STATUS.MAP[task.status]} />
            </DescriptionItem>

            <DescriptionItem label="Assignee">
              {#if task.assignee}
                {task.assignee.user.name || task.assignee.user.email}
              {:else}
                <span class="text-muted-foreground">Unassigned</span>
              {/if}
            </DescriptionItem>

            <DescriptionItem label="Due">
              <Time
                date={task.due_date}
                show="datetime"
              />
            </DescriptionItem>

            <DescriptionItem label="Created">
              <Time
                date={task.createdAt}
                show="auto"
              />
            </DescriptionItem>

            <DescriptionItem label="Updated">
              <Time
                date={task.updatedAt}
                show="auto"
              />
            </DescriptionItem>
          </DescriptionList>
        {/snippet}
      </Card>
    {/snippet}
  </DetailLayout>
</Page>
