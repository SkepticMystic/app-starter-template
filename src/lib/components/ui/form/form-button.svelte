<script
  lang="ts"
  generics="T extends Record<string, unknown>, M"
>
  import {
    Root as Button,
    type ButtonProps,
  } from "$lib/components/ui/button/index.js";
  import type { Readable } from "svelte/store";
  import type { SuperForm } from "sveltekit-superforms";

  let {
    form,
    ref = $bindable(null),
    ...button
  }: Omit<ButtonProps, "form"> & {
    form: SuperForm<T, M> & { pending?: Readable<boolean> };
  } = $props();

  let { submitting, pending, delayed } = form;
</script>

<Button
  bind:ref
  type="submit"
  loading={$delayed || $pending}
  disabled={$submitting || $pending}
  {...button}
/>
