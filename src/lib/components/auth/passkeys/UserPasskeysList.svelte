<script lang="ts">
  import type { auth } from "$lib/auth";
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import List from "$lib/components/daisyui/List.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Modal from "$lib/components/daisyui/Modal.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import { Dates } from "$lib/utils/dates";
  import { Items } from "$lib/utils/items.util";
  import { any_loading, Loader } from "$lib/utils/loader";
  import EditPasskeyForm from "./EditPasskeyForm.svelte";

  let {
    passkeys = $bindable(),
  }: {
    passkeys: Awaited<ReturnType<typeof auth.api.listPasskeys>>;
  } = $props();

  const loader = Loader<`delete_passkey:${string}`>();

  const delete_passkey = async (passkey_id: string) => {
    loader.load(`delete_passkey:${passkey_id}`);

    const res = await PasskeysClient.delete(passkey_id);
    if (res.ok) {
      passkeys = Items.remove(passkeys, passkey_id);
    }

    loader.reset();
  };

  let items = $state(passkeys);
</script>

<List {items}>
  {#snippet row(passkey)}
    <Icon class="heroicons/finger-print" size="size-7" />

    <div>
      <p class="text-lg">
        {passkey.name || "Unnamed Passkey"}
      </p>
      <p class="text-xs font-semibold uppercase opacity-60">
        Connected on {Dates.show_date(passkey.createdAt)}
      </p>
    </div>

    <div class="flex gap-0.5">
      <Modal>
        {#snippet btn(dialog)}
          <button
            title="Edit Passkey"
            class="btn btn-square btn-info"
            onclick={() => dialog?.showModal()}
          >
            <Icon class="heroicons/pencil" />
          </button>
        {/snippet}

        {#snippet content(dialog)}
          <EditPasskeyForm
            {passkey}
            on_update={(updated) => {
              passkeys = Items.patch(passkeys, passkey.id, updated);
              dialog?.close();
            }}
          />
        {/snippet}
      </Modal>

      <button
        title="Delete Passkey"
        class="btn btn-square btn-warning"
        disabled={any_loading($loader)}
        onclick={() => delete_passkey(passkey.id)}
      >
        <Loading loading={$loader[`delete_passkey:${passkey.id}`]}>
          <Icon class="heroicons/x-mark" />
        </Loading>
      </button>
    </div>
  {/snippet}
</List>
