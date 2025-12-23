<script lang="ts">
  import { resolve } from "$app/paths";
  import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Logo from "$lib/components/ui/image/Logo.svelte";
  import { APP } from "$lib/const/app.const";
</script>

<article class="mx-auto mt-32 flex max-w-lg flex-col gap-y-7">
  <header class="flex flex-col items-center gap-4">
    <Logo size="size-16" />
    <h1>{APP.NAME}</h1>
    <p>{APP.DESCRIPTION}</p>
  </header>

  <section class="flex justify-center pb-10">
    <ButtonGroup>
      <ButtonGroup>
        <Button href="/tasks">Tasks</Button>
      </ButtonGroup>

      <ButtonGroup>
        <Button
          href="/profile"
          variant="secondary"
        >
          Profile
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  </section>

  <section id="contact">
    <h2>Contact</h2>
    <p>We'd love to hear from you!</p>

    <Button
      size="lg"
      icon="lucide/mail"
      href={resolve("/contact")}
    >
      Contact Us
    </Button>
  </section>
</article>
