<script lang="ts">
  import { AuthClient } from "$lib/auth-client";
  import { ROUTES } from "$lib/const/routes.const";
  import { user } from "$lib/stores/session";
  import { onMount } from "svelte";
  import { themeChange } from "theme-change";
  import IconBars3 from "../icons/IconBarThree.svelte";
  import { goto } from "$app/navigation";

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
      href: "/team",
      authed: true,
    },
    {
      side: "right",
      label: "Profile",
      href: "/profile",
      authed: true,
    },
    {
      side: "right",
      label: "Admin",
      href: "/admin",
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
    AuthClient.signOut({
      fetchOptions: { onSuccess: () => goto(ROUTES.AUTH_SIGNIN) },
    });
  };
</script>

<nav class="navbar bg-base-100 px-5">
  <div class="navbar-start">
    <a href="/" class="btn btn-ghost text-xl normal-case">Generic App</a>
  </div>

  <div class="navbar-center hidden lg:flex">
    <ul class="flex items-center gap-5">
      {#each routes as r}
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
      <!-- svelte-ignore a11y_label_has_associated_control -->
      <label tabindex="0" class="btn btn-ghost btn-square">
        <IconBars3 />
      </label>
      <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
      <ul
        tabindex="0"
        class="menu-compact menu dropdown-content rounded-box bg-base-100 mt-3 w-40 p-2 shadow-sm"
      >
        <!-- Shows all routes, not just those for a given `side` -->
        {#each routes as r}
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
      <select
        class="select select-bordered select-sm text-xs"
        data-choose-theme
      >
        {#each ["acid", "autumn", "black", "bumblebee", "business", "cmyk", "coffee", "corporate", "cupcake", "cyberpunk", "dracula", "emerald", "fantasy", "forest", "garden", "halloween", "lemonade", "light", "lofi", "luxury", "night", "pastel", "retro", "valentine", "winter"] as theme}
          <option value={theme}>{theme}</option>
        {/each}
      </select>

      {#each routes as r}
        {#if show_route($user, r, "right")}
          {@const { href, label } = r}
          <li>
            <a class="link" {href}>{label}</a>
          </li>
        {/if}
      {/each}

      {#if $user}
        <li>
          <button class="btn btn-ghost btn-sm" onclick={signout}>
            Sign out
          </button>
        </li>
      {/if}
    </ul>
  </div>
</nav>
