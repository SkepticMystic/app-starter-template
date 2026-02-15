<script lang="ts">
  import { page } from "$app/state";
  import type { ResolvedPathname } from "$app/types";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import SidebarContent from "$lib/components/ui/sidebar/sidebar-content.svelte";
  import SidebarFooter from "$lib/components/ui/sidebar/sidebar-footer.svelte";
  import SidebarGroupContent from "$lib/components/ui/sidebar/sidebar-group-content.svelte";
  import SidebarGroupLabel from "$lib/components/ui/sidebar/sidebar-group-label.svelte";
  import SidebarGroup from "$lib/components/ui/sidebar/sidebar-group.svelte";
  import SidebarHeader from "$lib/components/ui/sidebar/sidebar-header.svelte";
  import SidebarMenuAction from "$lib/components/ui/sidebar/sidebar-menu-action.svelte";
  import SidebarMenuButton from "$lib/components/ui/sidebar/sidebar-menu-button.svelte";
  import SidebarMenuItem from "$lib/components/ui/sidebar/sidebar-menu-item.svelte";
  import SidebarRail from "$lib/components/ui/sidebar/sidebar-rail.svelte";
  import SidebarRoot from "$lib/components/ui/sidebar/sidebar-root.svelte";
  import { APP } from "$lib/const/app.const";
  import AppSidebarFooter from "./AppSidebarFooter.svelte";

  const groups: {
    label: string;
    items: {
      label: string;
      href: ResolvedPathname;
      icon: string;

      action?: { kind: "href"; href: string; icon: string };
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
            href: "/task#create",
            icon: "lucide/plus",
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
            href="/f"
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
            <SidebarMenuItem class="group">
              <SidebarMenuButton isActive={item.href === page.url.pathname}>
                {#snippet child({ props })}
                  <a
                    {...props}
                    href={item.href}
                  >
                    <Icon
                      icon={item.icon}
                      title={item.label}
                    />

                    <span>{item.label}</span>
                  </a>
                {/snippet}
              </SidebarMenuButton>

              {#if item.action}
                <SidebarMenuAction class="hidden group-hover:inline">
                  {#snippet child({ props })}
                    {#if item.action?.kind === "href"}
                      <a
                        {...props}
                        href={item.action.href}
                      >
                        <Icon icon={item.action.icon} />
                      </a>
                    {:else}{/if}
                  {/snippet}
                </SidebarMenuAction>
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
