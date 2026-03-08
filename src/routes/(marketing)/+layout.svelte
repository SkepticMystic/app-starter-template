<script lang="ts">
  import { resolve } from "$app/paths";
  import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { APP } from "$lib/const/app.const";
  import { user } from "$lib/stores/session.store";

  let { children } = $props();
</script>

<div class="flex min-h-screen w-full flex-col">
  <header>
    <nav class="mx-auto flex h-16 max-w-5xl items-center justify-between px-3">
      <Button
        href="/"
        variant="ghost"
      >
        {APP.NAME}
      </Button>

      <ButtonGroup>
        {#if $user}
          <ButtonGroup>
            <Button href={resolve("/home")}>Home</Button>
          </ButtonGroup>
        {:else}
          <ButtonGroup>
            <Button href={resolve("/auth/signup")}>Signup</Button>
          </ButtonGroup>

          <ButtonGroup>
            <Button href={resolve("/auth/signin")}>Login</Button>
          </ButtonGroup>
        {/if}
      </ButtonGroup>
    </nav>
  </header>

  <main class="
    mx-auto mt-1 mb-12 w-full max-w-4xl grow px-2
    sm:px-3
    md:px-5
  ">
    {@render children?.()}
  </main>
</div>
