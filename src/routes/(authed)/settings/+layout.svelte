<script lang="ts">
  import { page } from "$app/state";
  import Icon from "#lib/components/ui/icon/Icon.svelte";
  import Page from "#lib/components/ui/layout/Page.svelte";
  import { SETTINGS } from "#lib/const/settings.const.js";
  import { can } from "#lib/utils/auth/permission.util.js";
  import { active_href } from "#lib/utils/nav/active_href.util.js";

  let { children } = $props();

  const visible = $derived(
    SETTINGS.NAV.filter(
      (item) =>
        (!item.org || page.data.org) &&
        (!item.permissions || can(item.permissions)),
    ),
  );

  // A subpage lights its section: `/settings/api-key/log` is "API keys".
  const active = $derived(
    active_href(
      page.url.pathname,
      visible.map((item) => item.href),
    ),
  );
</script>

<!-- The frame is here, so each settings page keeps a plain `<article>`. -->
<Page
  as="div"
  class="
    flex flex-col gap-4
    md:flex-row md:gap-8
  "
>
  <!-- A row that scrolls on a phone, a column beside the page from `md`. -->
  <nav
    aria-label="Settings"
    class="md:sticky md:top-20 md:w-48 md:shrink-0 md:self-start"
  >
    <p
      class="
        mb-2 hidden px-2 text-xs font-medium text-muted-foreground
        md:block
      "
    >
      Settings
    </p>

    <ul
      class="
        -mx-2 flex gap-1 overflow-x-auto px-2
        md:mx-0 md:flex-col md:overflow-visible md:px-0
      "
    >
      {#each visible as item (item.href)}
        <li class="shrink-0">
          <a
            href={item.href}
            aria-current={item.href === active ? "page" : undefined}
            class={[
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              item.href === active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
            ]}
          >
            <Icon
              icon={item.icon}
              class="size-4"
            />

            {item.label}
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="min-w-0 flex-1">
    {@render children()}
  </div>
</Page>
