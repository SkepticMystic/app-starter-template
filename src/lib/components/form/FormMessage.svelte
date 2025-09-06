<script lang="ts">
  import type { FsSuperForm } from "formsnap";
  import type { Writable } from "svelte/store";

  let {
    form,
    message,
  }: {
    form?: FsSuperForm<any, App.Superforms.Message>;
    message?: Writable<App.Superforms.Message | undefined>;
  } = $props();

  if (!form && !message) {
    throw new Error(
      "FormMessage component requires either 'form' or 'message' prop.",
    );
  }

  const { message: resolved } = form ?? { message };
</script>

{#if $resolved}
  {#if !$resolved.ok && $resolved.error}
    <p class="text-warning">{$resolved.error}</p>
  {:else if $resolved.ok && $resolved.data}
    <p class="text-primary">{$resolved.data}</p>
  {/if}
{/if}
