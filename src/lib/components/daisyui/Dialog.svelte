<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import Icon from "../icons/Icon.svelte";

  let {
    dialog = $bindable(),
    class: klass = "modal-bottom",

    actions,
    content,
  }: {
    class?: ClassValue;
    dialog?: HTMLDialogElement;

    content?: Snippet<[HTMLDialogElement | undefined]>;
    actions?: Snippet<[HTMLDialogElement | undefined]>;
  } = $props();
</script>

<dialog class="modal {klass} sm:modal-middle" bind:this={dialog}>
  <div class="modal-box">
    <!-- Button to close the modal -->
    <form method="dialog" class="absolute top-1 right-1">
      <button class="btn btn-square btn-ghost">
        <Icon icon="heroicons/x-mark" />
      </button>
    </form>

    {@render content?.(dialog)}

    <div class="modal-action">
      {@render actions?.(dialog)}
    </div>
  </div>

  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
