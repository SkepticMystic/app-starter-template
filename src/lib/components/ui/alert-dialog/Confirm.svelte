<script lang="ts">
  import { beforeNavigate } from "$app/navigation";
  import { Confirm } from "#lib/stores/confirm.svelte.js";
  import { onMount } from "svelte";
  import Input from "../input/input.svelte";
  import Label from "../label/label.svelte";
  import AlertDialogAction from "./alert-dialog-action.svelte";
  import AlertDialogCancel from "./alert-dialog-cancel.svelte";
  import AlertDialogContent from "./alert-dialog-content.svelte";
  import AlertDialogDescription from "./alert-dialog-description.svelte";
  import AlertDialogFooter from "./alert-dialog-footer.svelte";
  import AlertDialogHeader from "./alert-dialog-header.svelte";
  import AlertDialogTitle from "./alert-dialog-title.svelte";
  import AlertDialog from "./alert-dialog.svelte";

  /**
   * Renders whatever {@link Confirm.ask} is asking. Mounted once, in the root layout, beside
   * `<Sonner />`; nothing else imports this.
   *
   * An alert dialog rather than `Modal`, which becomes a bottom drawer on a phone: this is a
   * question the user must answer before the action runs, so it is `role="alertdialog"`, a
   * click outside does not dismiss it, and focus starts on Cancel — or on the field, when
   * there is something to type.
   */

  onMount(() => Confirm.register_host());

  // A question about this page does not survive leaving it: Back answers it "no".
  beforeNavigate(({ shallow }) => {
    if (shallow) return;

    return Confirm.settle(false);
  });

  const request = $derived(Confirm.request);
  const target = $derived(request?.type_to_confirm);
  const ready = $derived(
    request === null || Confirm.matches(request, Confirm.typed),
  );

  const confirm = () => {
    if (ready) Confirm.settle(true);
  };
</script>

<!-- Bound through a getter, not passed one way: a one-way `open` becomes a local override the
     moment bits-ui closes itself on Escape, and a later ask's `true` would not reopen it. -->
<AlertDialog
  bind:open={
    () => Confirm.open,
    (open) => {
      if (!open) Confirm.settle(false);
    }
  }
>
  <AlertDialogContent
    onCloseAutoFocus={(event) => {
      event.preventDefault();

      const target = Confirm.return_focus;
      requestAnimationFrame(() => target?.focus());
    }}
  >
    {#if request}
      <AlertDialogHeader>
        <AlertDialogTitle>{request.title}</AlertDialogTitle>

        {#if request.description}
          <AlertDialogDescription>{request.description}</AlertDialogDescription>
        {/if}
      </AlertDialogHeader>

      {#if target !== undefined}
        <!-- A form only so Enter submits; `confirm` refuses until the text matches. -->
        <form
          class="space-y-2"
          onsubmit={(event) => {
            event.preventDefault();
            confirm();
          }}
        >
          <Label for="confirm-type-to-confirm">
            <!-- `break-all`: the target can be a URL with nowhere to wrap. -->
            Type
            <span class="font-mono font-semibold break-all">{target}</span>
            to confirm
          </Label>

          <Input
            id="confirm-type-to-confirm"
            bind:value={Confirm.typed}
            autocomplete="off"
            spellcheck={false}
          />
        </form>
      {/if}

      <AlertDialogFooter>
        <AlertDialogCancel type="button">Cancel</AlertDialogCancel>

        <AlertDialogAction
          variant={request.destructive || target !== undefined
            ? "destructive"
            : "default"}
          disabled={!ready}
          onclick={confirm}
        >
          {request.action_label ?? "Continue"}
        </AlertDialogAction>
      </AlertDialogFooter>
    {/if}
  </AlertDialogContent>
</AlertDialog>
