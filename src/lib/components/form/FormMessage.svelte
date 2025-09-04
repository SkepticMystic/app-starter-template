<script lang="ts">
  import type { Writable } from "svelte/store";

  let {
    message,
  }: {
    message: Writable<App.Superforms.Message | undefined>;
  } = $props();
</script>

{#if $message}
  {#if !$message.ok && $message.error}
    <p class="text-warning">{$message.error}</p>
  {:else if $message.ok && $message.data}
    <p class="text-primary">{$message.data}</p>
  {/if}
{/if}
