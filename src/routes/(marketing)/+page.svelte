<script lang="ts">
  import { resolve } from "$app/paths";
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
