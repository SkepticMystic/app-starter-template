<script lang="ts">
  import { goto } from "$app/navigation";
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "$lib/auth-client";
  import { AdminClient } from "$lib/clients/admin.client";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { APP } from "$lib/const/app";
  import { TOAST } from "$lib/const/toast.const";
  import { session, user } from "$lib/stores/session";
  import { App } from "$lib/utils/app";
  import ThemeSelector from "./ThemeSelector.svelte";
  import ButtonGroup from "./ui/button-group/button-group.svelte";
  import Button from "./ui/button/button.svelte";
  import Icon from "./ui/icon/Icon.svelte";

  interface Route {
    side: "center" | "right";
    label: string;
    href: ResolvedPathname;
    icon: string;
    /** Only show if user is authenticated */
    authed: boolean;
    admin?: boolean;
  }

  const routes: Route[] = [
    {
      side: "right",
      label: "Team",
      href: "/organization",
      icon: "lucide/users",
      authed: true,
    },
    {
      side: "right",
      label: "Profile",
      href: "/profile",
      icon: "lucide/user",
      authed: true,
    },
    {
      side: "right",
      label: "Admin",
      href: "/admin",
      icon: "lucide/shield-check",
      authed: true,
      admin: true,
    },
    {
      side: "right",
      label: "Sign in",
      href: "/auth/signin",
      icon: "lucide/log-in",
      authed: false,
    },
    {
      side: "right",
      label: "Sign up",
      href: "/auth/signup",
      icon: "lucide/user-plus",
      authed: false,
    },
  ];

  const show_route = (
    user: typeof $user,
    route: Route,
    side?: Route["side"],
  ) => {
    if (side && route.side !== side) return false;
    if (route.authed !== !!user) return false;
    if (route.admin && user?.role !== "admin") return false;

    return true;
  };

  const signout = () =>
    BetterAuthClient.signOut({
      fetchOptions: {
        onSuccess: () =>
          goto(App.url("/auth/signin", { toast: TOAST.IDS.SIGNED_OUT })),
        onError: (error) => {
          console.error("Error signing out:", error);
          location.reload();
        },
      },
    });
</script>

<nav class="mx-auto flex h-16 max-w-5xl items-center justify-between px-3">
  <ButtonGroup>
    <Button
      href="/"
      size="lg"
      variant="link"
    >
      {APP.NAME}
    </Button>
  </ButtonGroup>

  <ButtonGroup>
    <ButtonGroup>
      <ThemeSelector />
    </ButtonGroup>

    <ButtonGroup>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger>
          {#snippet child({ props })}
            <Button
              {...props}
              variant="outline"
              icon="lucide/menu"
            ></Button>
          {/snippet}
        </DropdownMenu.Trigger>

        <DropdownMenu.Content align="end">
          <DropdownMenu.Group>
            <DropdownMenu.Label>My Account</DropdownMenu.Label>

            <DropdownMenu.Separator />

            {#each routes as r (r.href)}
              {#if show_route($user, r)}
                <DropdownMenu.Item onSelect={() => goto(r.href)}>
                  <Icon icon={r.icon} />
                  {r.label}
                </DropdownMenu.Item>
              {/if}
            {/each}

            {#if $user}
              <DropdownMenu.Item onSelect={signout}>
                <Icon icon="lucide/log-out" />
                Sign out
              </DropdownMenu.Item>
            {/if}

            {#if $session.data?.session.impersonatedBy}
              <DropdownMenu.Item
                onSelect={() => AdminClient.stop_impersonating()}
              >
                <Icon icon="lucide/stop-circle" />
                Stop impersonating
              </DropdownMenu.Item>
            {/if}
          </DropdownMenu.Group>
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </ButtonGroup>
  </ButtonGroup>
</nav>
