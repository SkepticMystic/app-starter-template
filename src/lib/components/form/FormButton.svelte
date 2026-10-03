<script lang="ts">
  import Button from "#lib/components/ui/button/button.svelte";
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

<!-- No default icon: a paper plane on "Save changes" said "send". A form that sends something
  passes one. -->
<Button
  type="submit"
  loading={form.pending > 0}
  {...rest}
>
  {#if children}
    {@render children()}
  {:else}
    Save
  {/if}
</Button>
