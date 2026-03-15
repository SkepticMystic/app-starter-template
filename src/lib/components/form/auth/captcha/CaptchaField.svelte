<script
  lang="ts"
  generics="F extends RemoteFormInput"
>
  import Field from "$lib/components/ui/field/Field.svelte";
  import type { RemoteForm, RemoteFormInput } from "@sveltejs/kit";
  import Captcha from "./Captcha.svelte";

  let {
    form,
    reset = $bindable(),
  }: {
    form: RemoteForm<F & { captcha_token: string }, unknown>;
    reset: (() => void) | undefined;
  } = $props();
</script>

<Field
  label=""
  field={form.fields.captcha_token}
>
  {#snippet input({ props, field })}
    <Captcha
      {...props}
      {...field?.as("text")}
      bind:reset
    />
  {/snippet}
</Field>
