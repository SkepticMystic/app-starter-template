<script lang="ts">
  import { resolve } from "$app/paths";
  import Button from "#lib/components/ui/button/button.svelte";
  import Header from "#lib/components/ui/header/Header.svelte";
  import Item from "#lib/components/ui/item/Item.svelte";
  import Page from "#lib/components/ui/layout/Page.svelte";
  import { Format } from "#lib/utils/format.util.js";

  let { data } = $props();

  const sections = $derived([
    {
      title: "Users",
      icon: "lucide/users",
      description: `${Format.number(data.counts.users)} total`,
      href: resolve("/(authed)/admin/users"),
    },
    {
      title: "Organizations",
      icon: "lucide/building-2",
      description: `${Format.number(data.counts.organizations)} total`,
      href: resolve("/(authed)/admin/organizations"),
    },
    {
      title: "Security log",
      icon: "lucide/shield",
      description: "Sign-ins and account changes, across every user",
      href: resolve("/(authed)/admin/audit"),
    },
  ]);
</script>

<Page>
  <Header title="Admin" />

  <section class="grid gap-3 sm:grid-cols-2">
    {#each sections as section (section.href)}
      <Item
        variant="outline"
        icon={section.icon}
        title={section.title}
        description={section.description}
      >
        {#snippet actions()}
          <Button
            variant="outline"
            href={section.href}
          >
            Open
          </Button>
        {/snippet}
      </Item>
    {/each}
  </section>
</Page>
