<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ButtonGroup from "#lib/components/ui/button-group/button-group.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import FooterBlock from "#lib/components/blocks/footer/FooterBlock.svelte";
  import { APP } from "#lib/const/app.const.js";

  let { children } = $props();
</script>

<div class="flex min-h-screen w-full flex-col">
  <header>
    <nav class="mx-auto flex h-16 max-w-5xl items-center justify-between px-3">
      <Button
        href={resolve("")}
        variant="ghost"
      >
        {APP.NAME}
      </Button>

      <ButtonGroup>
        {#if page.data.user}
          <Button href={resolve("home")}>Home</Button>
        {:else}
          <Button href={resolve("auth/signup")}>Sign up</Button>
          <Button href={resolve("auth/signin")}>Sign in</Button>
        {/if}
      </ButtonGroup>
    </nav>
  </header>

  <main
    class="
    mx-auto mt-1 mb-12 w-full max-w-4xl grow px-2
    sm:px-3
    md:px-5
  "
  >
    {@render children?.()}
  </main>

  <FooterBlock />
</div>
