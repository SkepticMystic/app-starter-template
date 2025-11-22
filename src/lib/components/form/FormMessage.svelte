<script
  lang="ts"
  generics="T extends Record<string, unknown>"
>
  import type { FsSuperForm } from "formsnap";

  let {
    form,
  }: {
    form: FsSuperForm<T, App.Superforms.Message>;
  } = $props();

  const { message } = form;
</script>

{#if $message}
  {#if !$message.ok && $message.error}
    <p class="text-warning">{$message.error}</p>
  {:else if $message.ok && $message.data}
    <p class="text-primary">{$message.data}</p>
  {/if}
{/if}
