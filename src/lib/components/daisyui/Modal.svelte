<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Dialog from "./Dialog.svelte";

  let {
    // NOTE: No default, we want to allow Dialog to use it's default
    class: klass,

    btn,
    content,
    actions,
  }: {
    class?: ClassValue;

    btn: Snippet<[HTMLDialogElement | undefined]>;
    content?: Snippet<[HTMLDialogElement | undefined]>;
    actions?: Snippet<[HTMLDialogElement | undefined]>;
  } = $props();

  let dialog: HTMLDialogElement | undefined = $state();
</script>

{@render btn(dialog)}

<Dialog class={klass} {content} {actions} bind:dialog></Dialog>
