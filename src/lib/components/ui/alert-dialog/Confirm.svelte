<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { Confirm } from "#lib/stores/confirm.svelte.js";
  import { Toast } from "#lib/utils/toast.util.js";
  import { onMount, type Component } from "svelte";

  /**
   * Answers {@link Confirm.ask}. Mounted once, in the root layout, beside `<Sonner />`.
   *
   * It registers as the host at once but loads `ConfirmDialog` only on the first ask: the
   * dialog is bits-ui's whole dialog stack, which most page views would download and never
   * open. `ask` has already set `open` by then, so the dialog mounts open.
   */

  onMount(() => Confirm.register_host());

  // A question about this page does not survive leaving it: Back answers it "no".
  beforeNavigate(({ shallow }) => {
    if (shallow) return;

    return Confirm.settle(false);
  });

  let Dialog = $state<Component>();

  const load = async () => {
    try {
      Dialog = (await import("./ConfirmDialog.svelte")).default;
    } catch {
      // Unanswered, the ask would hold its button disabled for good.
      Confirm.settle(false);
      Toast.error({
        title: "Couldn't ask to confirm",
        description: "Reload the page and try again.",
      });
    }
  };

  // `request` is never cleared, so once loaded the dialog stays mounted; a failed load is
  // retried by the next ask, which sets a new request.
  $effect(() => {
    if (Confirm.request && !Dialog) void load();
  });
</script>

{#if Dialog}
  <Dialog />
{/if}
