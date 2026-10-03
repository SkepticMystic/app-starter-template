<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { ResolvedPathname } from "$app/types";
  import Icon from "#lib/components/ui/icon/Icon.svelte";
  import SidebarContent from "#lib/components/ui/sidebar/sidebar-content.svelte";
  import SidebarFooter from "#lib/components/ui/sidebar/sidebar-footer.svelte";
  import SidebarGroupContent from "#lib/components/ui/sidebar/sidebar-group-content.svelte";
  import SidebarGroupLabel from "#lib/components/ui/sidebar/sidebar-group-label.svelte";
  import SidebarGroup from "#lib/components/ui/sidebar/sidebar-group.svelte";
  import SidebarHeader from "#lib/components/ui/sidebar/sidebar-header.svelte";
  import SidebarMenuAction from "#lib/components/ui/sidebar/sidebar-menu-action.svelte";
  import SidebarMenuButton from "#lib/components/ui/sidebar/sidebar-menu-button.svelte";
  import SidebarMenuItem from "#lib/components/ui/sidebar/sidebar-menu-item.svelte";
  import SidebarRail from "#lib/components/ui/sidebar/sidebar-rail.svelte";
  import SidebarRoot from "#lib/components/ui/sidebar/sidebar-root.svelte";
  import Tip from "#lib/components/ui/tooltip/Tip.svelte";
  import { APP } from "#lib/const/app.const.js";
  import AppSidebarFooter from "./AppSidebarFooter.svelte";

  const groups: {
    label: string;
    items: {
      label: string;
      href: ResolvedPathname;
      icon: string;

      /** `label` names the icon-only link: it is a screen reader's only word for it. */
      action?: { kind: "href"; href: string; icon: string; label: string };
    }[];
  }[] = [
    {
      label: "Features",
      items: [
        {
          href: "/tasks",
          label: "Tasks",
          icon: "lucide/check-square",

          action: {
            kind: "href",
            href: "/tasks",
            icon: "lucide/plus",
            label: "New task",
          },
        },
      ],
    },
  ];
</script>

<!-- NOTE: If you ever need to use SidebarInset instead, checkout the "Sidebar.Footer" section of this doc page:
 https://shadcn-svelte.com/docs/components/sidebar -->

<SidebarRoot collapsible="icon">
  <SidebarHeader>
    <SidebarMenuItem>
      <SidebarMenuButton>
        {#snippet child({ props })}
          <a
            {...props}
            href={resolve("home")}
          >
            <Icon icon="lucide/home" />
            <span> {APP.NAME} </span>
          </a>
        {/snippet}
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarHeader>

  <SidebarContent>
    {#each groups as group (group.label)}
      <SidebarGroup>
        <SidebarGroupLabel>
          {group.label}
        </SidebarGroupLabel>

        <SidebarGroupContent>
          {#each group.items as item (item.href)}
            <SidebarMenuItem>
              <!-- `tooltipContent` shows only while the sidebar is collapsed to icons, which is
                   when the label is gone; a native `title` on the icon showed always, or never on touch. -->
              <SidebarMenuButton
                isActive={item.href === page.url.pathname}
                tooltipContent={item.label}
              >
                {#snippet child({ props })}
                  <a
                    {...props}
                    href={item.href}
                  >
                    <Icon icon={item.icon} />

                    <span>{item.label}</span>
                  </a>
                {/snippet}
              </SidebarMenuButton>

              {#if item.action}
                {@const action = item.action}
                <!-- `showOnHover` fades rather than `hidden`s it, and shows it on focus-within too:
                     a `display: none` link is out of the tab order, so keyboards never reached it.
                     A `Tip` for its name, not a `title`, which reached neither. -->
                <Tip
                  content={action.label}
                  names_trigger
                  side="right"
                >
                  {#snippet child({ props: tip_props })}
                    <SidebarMenuAction
                      showOnHover
                      {...tip_props}
                    >
                      {#snippet child({ props })}
                        <a
                          {...props}
                          href={action.href}
                        >
                          <Icon icon={action.icon} />
                        </a>
                      {/snippet}
                    </SidebarMenuAction>
                  {/snippet}
                </Tip>
              {/if}
            </SidebarMenuItem>
          {/each}
        </SidebarGroupContent>
      </SidebarGroup>
    {/each}
  </SidebarContent>

  <SidebarFooter>
    <AppSidebarFooter />
  </SidebarFooter>

  <SidebarRail />
</SidebarRoot>
