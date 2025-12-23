<script
  lang="ts"
  generics="Input extends RemoteFormInput, Output extends unknown"
>
  import Button from "$lib/components/ui/button/button.svelte";
  import type { RemoteForm, RemoteFormInput } from "@sveltejs/kit";
  import type { ComponentProps } from "svelte";

  let {
    form,
    children,
    ...rest
  }: {
    form: RemoteForm<Input, Output>;
  } & Omit<ComponentProps<typeof Button>, "form" | "target" | "href"> =
    $props();
</script>

<Button
  type="submit"
  icon="lucide/send"
  loading={form.pending > 0}
  {...rest}
>
  {#if children}
    {@render children()}
  {:else}
    Submit
  {/if}
</Button>
