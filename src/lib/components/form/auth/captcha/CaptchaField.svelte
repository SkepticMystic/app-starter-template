<script
  lang="ts"
  generics="F extends RemoteFormInput"
>
  import type { RemoteForm, RemoteFormInput } from "$app/server";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Captcha from "./Captcha.svelte";

  let {
    form,
    reset = $bindable(),
  }: {
    form: RemoteForm<F & { captcha_token: string }, unknown>;
    reset: (() => void) | undefined;
  } = $props();
</script>

<Field field={form.fields.captcha_token}>
  {#snippet label()}
    <span class="sr-only">Captcha</span>
  {/snippet}

  {#snippet input({ props, field })}
    <Captcha
      {...props}
      {...field?.as("text")}
      bind:reset
    />
  {/snippet}
</Field>
