<script lang="ts">
  import { goto } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client";
  import { APP } from "$lib/const/app";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { user } from "$lib/stores/session";
  import { App } from "$lib/utils/app";
  import { onMount } from "svelte";
  import { themeChange } from "theme-change";
  import Icon from "../icons/Icon.svelte";
  import ThemeSelector from "./ThemeSelector.svelte";

  onMount(() => themeChange(false));

  interface Route {
    side: "center" | "right";
    label: string;
    href: string;
    /** Only show if user is authenticated */
    authed: boolean;
    admin?: boolean;
  }

  const routes: Route[] = [
    {
      side: "center",
      label: "Tasks",
      href: "/tasks",
      authed: true,
    },
    {
      side: "center",
      label: "Projects",
      href: "/projects",
      authed: true,
    },
    {
      side: "right",
      label: "Team",
      href: ROUTES.ORGANIZATION,
      authed: true,
    },
    {
      side: "right",
      label: "Profile",
      href: ROUTES.PROFILE,
      authed: true,
    },
    {
      side: "right",
      label: "Admin",
      href: ROUTES.ADMIN,
      authed: true,
      admin: true,
    },
    {
      side: "right",
      label: "Sign in",
      href: ROUTES.AUTH_SIGNIN,
      authed: false,
    },
    {
      side: "right",
      label: "Sign up",
      href: ROUTES.AUTH_SIGNUP,
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

  const signout = () => {
    BetterAuthClient.signOut({
      fetchOptions: {
        onSuccess: () =>
          goto(App.url(ROUTES.AUTH_SIGNIN, { toast: TOAST.IDS.SIGNED_OUT })),
      },
    });
  };
</script>

<nav class="navbar bg-base-100 px-5">
  <div class="navbar-start">
    <a href="/" class="btn text-xl normal-case btn-ghost">{APP.NAME}</a>
  </div>

  <div class="navbar-center hidden lg:flex">
    <ul class="flex items-center gap-5">
      {#each routes as r (r.href)}
        {#if show_route($user, r, "center")}
          {@const { href, label } = r}
          <li>
            <a class="link" {href}>{label}</a>
          </li>
        {/if}
      {/each}
    </ul>
  </div>

  <!-- Mobile menu -->
  <div class="navbar-end flex lg:hidden">
    <div class="dropdown dropdown-left z-50">
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <label tabindex="0" class="btn btn-square btn-ghost">
        <Icon class="heroicons/bars-3" />
      </label>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <ul
        tabindex="0"
        class="menu-compact dropdown-content menu mt-3 w-40 rounded-box bg-base-100 p-2 shadow-sm"
      >
        <!-- Shows all routes, not just those for a given `side` -->
        {#each routes as r (r.href)}
          {#if show_route($user, r)}
            {@const { href, label } = r}
            <li>
              <a class="link" {href}>{label}</a>
            </li>
          {/if}
        {/each}

        {#if $user}
          <li>
            <button class="link" onclick={signout}> Sign out </button>
          </li>
        {/if}
      </ul>
    </div>
  </div>

  <div class="navbar-end hidden lg:flex">
    <ul class="flex items-center gap-5">
      <ThemeSelector />

      {#each routes as r (r.href)}
        {#if show_route($user, r, "right")}
          {@const { href, label } = r}
          <li>
            <a class="link" {href}>{label}</a>
          </li>
        {/if}
      {/each}

      {#if $user}
        <li>
          <button class="link" onclick={signout}> Sign out </button>
        </li>
      {/if}
    </ul>
  </div>
</nav>
