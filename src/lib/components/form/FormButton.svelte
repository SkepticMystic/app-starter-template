<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import type { ComponentProps } from "svelte";

  let {
    form,
    children,
    ...rest
  }: {
    form: { pending: number };
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
