<script lang="ts">
  import type { ResolvedPathname } from "$app/types";
  import Anchor from "$lib/components/ui/anchor/Anchor.svelte";

  type Route = {
    label: string;
    routes?: Route[];
    href: ResolvedPathname;
  };

  const routes: Route[] = [
    {
      label: "Users",
      href: "/admin/users",
    },
    {
      label: "Organizations",
      href: "/admin/organizations",
    },
  ];
</script>

<article>
  <header>
    <h1>Admin</h1>
  </header>

  <ul class="list-inside list-disc">
    {#each routes as route (route.href)}
      <li>
        <Anchor href={route.href}>
          {route.label}
        </Anchor>

        {#if route.routes?.length}
          <ul class="list-inside list-disc pl-5">
            {#each route.routes as subroute (subroute.href)}
              <li>
                <Anchor href={subroute.href}>
                  {subroute.label}
                </Anchor>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</article>
