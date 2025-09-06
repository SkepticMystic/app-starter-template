<script lang="ts" generics="T extends Record<string, unknown>">
  import type { FsSuperForm } from "formsnap";
  import type { Writable } from "svelte/store";

  let props:
    | {
        form: undefined;
        message: Writable<App.Superforms.Message | undefined>;
      }
    | {
        form: FsSuperForm<T, App.Superforms.Message>;
        message: undefined;
      } = $props();

  if (!props.form && !props.message) {
    throw new Error(
      "FormMessage component requires either 'form' or 'message' prop.",
    );
  }

  const message = props.form ? props.form.message : props.message;
</script>

{#if $message}
  {#if !$message.ok && $message.error}
    <p class="text-warning">{$message.error}</p>
  {:else if $message.ok && $message.data}
    <p class="text-primary">{$message.data}</p>
  {/if}
{/if}
