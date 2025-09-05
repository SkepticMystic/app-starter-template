<script lang="ts">
  import { goto } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client";
  import { AdminClient } from "$lib/clients/admin.client";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { APP } from "$lib/const/app";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { session, user } from "$lib/stores/session";
  import { App } from "$lib/utils/app";
  import type { ClassValue } from "svelte/elements";
  import Icon from "../icons/Icon.svelte";
  import Button from "../ui/button/button.svelte";
  import ThemeSelector from "./ThemeSelector.svelte";

  interface Route {
    side: "center" | "right";
    label: string;
    href: string;
    icon: ClassValue;
    /** Only show if user is authenticated */
    authed: boolean;
    admin?: boolean;
  }

  const routes: Route[] = [
    {
      side: "right",
      label: "Team",
      href: ROUTES.ORGANIZATION,
      icon: "lucide/users",
      authed: true,
    },
    {
      side: "right",
      label: "Profile",
      href: ROUTES.PROFILE,
      icon: "lucide/user",
      authed: true,
    },
    {
      side: "right",
      label: "Admin",
      href: ROUTES.ADMIN,
      icon: "lucide/shield-check",
      authed: true,
      admin: true,
    },
    {
      side: "right",
      label: "Sign in",
      href: ROUTES.AUTH_SIGNIN,
      icon: "lucide/log-in",
      authed: false,
    },
    {
      side: "right",
      label: "Sign up",
      href: ROUTES.AUTH_SIGNUP,
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
          goto(App.url(ROUTES.AUTH_SIGNIN, { toast: TOAST.IDS.SIGNED_OUT })),
        onError: (error) => {
          console.error("Error signing out:", error);
          location.reload();
        },
      },
    });
</script>

<nav
  class="bg-base-100 mx-auto flex h-16 max-w-5xl items-center justify-between"
>
  <div>
    <Button href="/" size="lg" variant="link">
      {APP.NAME}
    </Button>
  </div>

  <div class="mr-3 flex gap-1">
    <ThemeSelector />

    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} variant="outline" icon="lucide/menu"></Button>
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
  </div>
</nav>
