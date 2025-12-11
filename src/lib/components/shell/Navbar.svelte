<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { ResolvedPathname } from "$app/types";
  import { BetterAuthClient } from "$lib/auth-client";
  import { AdminClient } from "$lib/clients/auth/admin.client";
  import { APP } from "$lib/const/app.const";
  import { session } from "$lib/stores/session.store";
  import { toast } from "svelte-sonner";
  import { getFlash } from "sveltekit-flash-message";
  import ButtonGroup from "../ui/button-group/button-group.svelte";
  import Button from "../ui/button/button.svelte";
  import DropdownMenu from "../ui/dropdown-menu/DropdownMenu.svelte";
  import ThemeSelector from "./ThemeSelector.svelte";

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

  const show_route = (route: Route, side?: Route["side"]) => {
    if (side && route.side !== side) {
      return false;
    } else if (route.authed !== !!$session?.data?.session) {
      return false;
    } else if (route.admin && $session?.data?.user?.role !== "admin") {
      return false;
    } else {
      return true;
    }
  };

  const signout = async () => {
    await BetterAuthClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.info("You have been signed out.");
          return goto(resolve("/auth/signin"));
        },
        onError: (error) => {
          console.error("Error signing out:", error);
          location.reload();
        },
      },
    });

    getFlash(page).set({
      level: "success",
      message: "You have been signed out.",
    });
  };
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
      <DropdownMenu
        variant="outline"
        title="Open menu"
        items={[
          {
            kind: "group",
            title: "My Account",
            items: routes.map((r) => ({
              icon: r.icon,
              title: r.label,
              href: resolve(r.href),
              hide: !show_route(r),
            })),
          },
          {
            kind: "item",
            title: "Sign out",
            onselect: signout,
            icon: "lucide/log-out",
            hide: !$session.data?.session,
          },

          {
            kind: "item",
            title: "Stop impersonating",
            icon: "lucide/stop-circle",
            hide: !$session.data?.session.impersonatedBy,
            onselect: () => AdminClient.stop_impersonating({}),
          },
        ]}
      ></DropdownMenu>
    </ButtonGroup>
  </ButtonGroup>
</nav>
