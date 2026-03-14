<script lang="ts">
  import UploadImagesForm from "$lib/components/form/image/UploadImagesForm.svelte";
  import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Logo from "$lib/components/ui/image/Logo.svelte";
  import { APP } from "$lib/const/app.const";
  import { user } from "$lib/stores/session.store";
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
          href="/settings/profile"
          variant="secondary"
        >
          Profile
        </Button>
      </ButtonGroup>
    </ButtonGroup>
  </section>
</article>

<UploadImagesForm
  resource_kind="user"
  resource_id={$user?.id ?? "test"}
/>
