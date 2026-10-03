<script lang="ts">
  import { afterNavigate } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { ResolvedPathname } from "$app/types";
  import Icon from "#lib/components/ui/icon/Icon.svelte";
  import Logo from "#lib/components/ui/image/Logo.svelte";
  import { useSidebar } from "#lib/components/ui/sidebar/context.svelte.js";
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
  import type { OrgPermissions } from "#lib/const/auth/organization_access_control.const.js";
  import { can } from "#lib/utils/auth/permission.util.js";
  import { active_href } from "#lib/utils/nav/active_href.util.js";
  import AppSidebarFooter from "./AppSidebarFooter.svelte";

  const sidebar = useSidebar();

  // Below `md` the sidebar is a Sheet over the page, and a link inside it does not close it: the
  // page changed underneath while the menu kept covering it. Every navigation, footer menu included.
  afterNavigate(() => sidebar.setOpenMobile(false));

  const groups: {
    label: string;
    items: {
      label: string;
      href: ResolvedPathname;
      icon: string;

      /** Cosmetic — the destination guards itself with the same `get_session` gate. */
      permissions?: OrgPermissions;

      /** The platform's back office: `user.role`, which no org grant reaches. */
      platform_admin?: true;

      /**
       * `label` names the icon-only link: it is a screen reader's only word for it.
       * `permissions` mirrors the destination's gate where it is narrower than the item's.
       */
      action?: {
        kind: "href";
        href: string;
        icon: string;
        label: string;
        permissions?: OrgPermissions;
      };
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
    {
      // Last, and only for platform admins: nothing else in the app links to `/admin`.
      label: "Platform",
      items: [
        {
          href: "/admin",
          label: "Admin",
          icon: "lucide/shield",
          platform_admin: true,
        },
      ],
    },
  ];

  const allowed = (gate: { permissions?: OrgPermissions }) =>
    !gate.permissions || can(gate.permissions);

  // A group whose every item is hidden would otherwise render as a bare label.
  const visible_groups = $derived(
    groups
      .map(({ label, items }) => ({
        label,
        items: items.filter(
          (item) =>
            allowed(item) &&
            (!item.platform_admin || page.data.user?.is_admin === true),
        ),
      }))
      .filter((group) => group.items.length > 0),
  );

  /** The item the current page sits under, nested pages included. */
  const active = $derived(
    active_href(
      page.url.pathname,
      visible_groups.flatMap(({ items }) => items.map(({ href }) => href)),
    ),
  );
</script>

<!-- NOTE: If you ever need to use SidebarInset instead, checkout the "Sidebar.Footer" section of this doc page:
 https://shadcn-svelte.com/docs/components/sidebar -->

<SidebarRoot collapsible="icon">
  <SidebarHeader>
    <SidebarMenuItem>
      <!-- `lg` so the mark is exactly the collapsed rail's `size-8` (that size drops its padding). -->
      <SidebarMenuButton
        size="lg"
        tooltipContent={APP.NAME}
      >
        {#snippet child({ props })}
          <a
            {...props}
            href={resolve("home")}
          >
            <Logo
              size="size-8"
              show_name
              class="text-base"
            />
          </a>
        {/snippet}
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarHeader>

  <SidebarContent>
    {#each visible_groups as group (group.label)}
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
                isActive={item.href === active}
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

              {#if item.action && allowed(item.action)}
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
