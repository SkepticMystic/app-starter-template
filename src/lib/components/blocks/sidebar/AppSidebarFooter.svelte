<script lang="ts">
  import { resolve } from "$app/paths";
  import { UserClient } from "$lib/clients/auth/user.client";
  import AvatarFallback from "$lib/components/ui/avatar/avatar-fallback.svelte";
  import AvatarImage from "$lib/components/ui/avatar/avatar-image.svelte";
  import AvatarRoot from "$lib/components/ui/avatar/avatar-root.svelte";
  import DropdownMenuContent from "$lib/components/ui/dropdown-menu/dropdown-menu-content.svelte";
  import DropdownMenuGroup from "$lib/components/ui/dropdown-menu/dropdown-menu-group.svelte";
  import DropdownMenuItem from "$lib/components/ui/dropdown-menu/dropdown-menu-item.svelte";
  import DropdownMenuLabel from "$lib/components/ui/dropdown-menu/dropdown-menu-label.svelte";
  import DropdownMenuRoot from "$lib/components/ui/dropdown-menu/dropdown-menu-root.svelte";
  import DropdownMenuSeparator from "$lib/components/ui/dropdown-menu/dropdown-menu-separator.svelte";
  import DropdownMenuTrigger from "$lib/components/ui/dropdown-menu/dropdown-menu-trigger.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import { useSidebar } from "$lib/components/ui/sidebar/context.svelte";
  import SidebarMenuButton from "$lib/components/ui/sidebar/sidebar-menu-button.svelte";
  import SidebarMenuItem from "$lib/components/ui/sidebar/sidebar-menu-item.svelte";
  import SidebarMenu from "$lib/components/ui/sidebar/sidebar-menu.svelte";
  import { get_active_subscription_remote } from "$lib/remote/subscription/subscription.remote";
  import { user } from "$lib/stores/session.store";

  const sidebar = useSidebar();
</script>

<SidebarMenu>
  <SidebarMenuItem>
    <DropdownMenuRoot>
      <DropdownMenuTrigger>
        {#snippet child({ props })}
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            {...props}
          >
            <AvatarRoot class="size-8 rounded-md">
              <AvatarImage
                src={$user?.image}
                alt={$user?.name}
              />

              <AvatarFallback class="rounded-md">
                {$user?.name.at(0) ?? ""}
              </AvatarFallback>
            </AvatarRoot>

            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-medium">{$user?.name}</span>
              <span class="truncate text-xs">{$user?.email}</span>
            </div>

            <Icon
              icon="lucide/chevrons-up-down"
              class="ms-auto size-4"
            />
          </SidebarMenuButton>
        {/snippet}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={4}
        class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-md"
        side={sidebar.isMobile ? "bottom" : "right"}
      >
        <DropdownMenuLabel class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
            <AvatarRoot class="size-8 rounded-md">
              <AvatarImage
                src={$user?.image}
                alt={$user?.name}
              />

              <AvatarFallback class="rounded-md">
                {$user?.name.at(0) ?? ""}
              </AvatarFallback>
            </AvatarRoot>

            <div class="grid flex-1 text-start text-sm leading-tight">
              <span class="truncate font-medium">{$user?.name}</span>
              <span class="truncate text-xs">{$user?.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            {#snippet child({ props })}
              <a
                {...props}
                href={resolve("/upgrade")}
              >
                <Icon icon="lucide/sparkles" />
                <span>
                  {get_active_subscription_remote().current
                    ? "View plan"
                    : "Upgrade to Pro"}
                </span>
              </a>
            {/snippet}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem>
            {#snippet child({ props })}
              <a
                {...props}
                href={resolve("/settings/account")}
              >
                <Icon icon="lucide/badge-check" />
                <span>Account</span>
              </a>
            {/snippet}
          </DropdownMenuItem>

          <DropdownMenuItem>
            {#snippet child({ props })}
              <a
                {...props}
                href={resolve("/settings/billing")}
              >
                <Icon icon="lucide/credit-card" />
                <span>Billing</span>
              </a>
            {/snippet}
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={() => UserClient.signout()}>
          <Icon icon="lucide/log-out" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenuRoot>
  </SidebarMenuItem>
</SidebarMenu>
