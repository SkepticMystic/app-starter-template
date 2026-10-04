<script lang="ts">
  import { page } from "$app/state";
  import { resolve } from "$app/paths";
  import Button from "#lib/components/ui/button/button.svelte";
  import Header from "#lib/components/ui/header/Header.svelte";
  import Item from "#lib/components/ui/item/Item.svelte";
  import { Format } from "#lib/utils/format.util.js";

  let { data } = $props();

  const first_name = $derived(page.data.user?.name.split(" ")[0]);

  const stats = $derived([
    {
      title: "Open tasks",
      icon: "lucide/list-todo",
      value: data.stats.open,
      href: resolve("/(authed)/tasks"),
    },
    {
      title: "Overdue",
      icon: "lucide/alarm-clock",
      value: data.stats.overdue,
      href: resolve("/(authed)/tasks"),
    },
    {
      title: "Members",
      icon: "lucide/users",
      value: data.stats.members,
      href: resolve("/(authed)/settings/organization"),
    },
  ]);
</script>

<article>
  <Header
    head_title="Home"
    title={first_name ? `Welcome back, ${first_name}` : "Welcome back"}
  />

  <section class="grid gap-3 sm:grid-cols-3">
    {#each stats as stat (stat.title)}
      <Item
        variant="outline"
        icon={stat.icon}
        title={stat.title}
        description={Format.number(stat.value)}
      >
        {#snippet actions()}
          <Button
            variant="ghost"
            icon="lucide/arrow-right"
            href={stat.href}
            tip="Go to {stat.title.toLowerCase()}"
          />
        {/snippet}
      </Item>
    {/each}
  </section>

  <section class="flex flex-wrap gap-2">
    <Button
      icon="lucide/plus"
      href={resolve("/(authed)/tasks")}
    >
      Go to tasks
    </Button>
    <Button
      variant="secondary"
      icon="lucide/user"
      href={resolve("/(authed)/settings/profile")}
    >
      Edit profile
    </Button>
  </section>
</article>
