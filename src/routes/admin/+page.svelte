<script lang="ts">
  type Route = {
    href: string;
    label: string;
    routes?: Route[];
  };

  const routes: Route[] = [
    {
      label: "Users",
      href: "/admin/users",
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
        <a
          class="link link-primary"
          href={route.href}
        >
          {route.label}
        </a>

        {#if route.routes?.length}
          <ul class="list-inside list-disc pl-5">
            {#each route.routes as subroute (subroute.href)}
              <li>
                <a
                  class="link link-primary"
                  href={subroute.href}
                >
                  {subroute.label}
                </a>
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</article>
