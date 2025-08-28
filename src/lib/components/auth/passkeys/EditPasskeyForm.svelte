<script lang="ts">
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import { any_loading, Loader } from "$lib/utils/loader";
  import type { Passkey } from "better-auth/plugins/passkey";
  import { preventDefault } from "svelte/legacy";

  let {
    // NOTE: Not bindable, we use a local dirty copy instead
    // Then emit updates via on_update
    passkey,
    on_update,
  }: {
    passkey: Passkey;
    on_update: (passkey: Passkey) => void;
  } = $props();

  const loader = Loader<"update_passkey">();

  let dirty: Passkey = $state({ ...passkey });

  const update_passkey = async () => {
    loader.load("update_passkey");

    const res = await PasskeysClient.update(passkey.id, dirty);
    if (res.ok) {
      passkey = { ...res.data.passkey };
      on_update?.(res.data.passkey);
    }

    loader.reset();
  };
</script>

<form onsubmit={preventDefault(update_passkey)}>
  <Fieldset legend="Update Passkey">
    <div class="space-y-3">
      <Label lbl="Name">
        <input
          type="text"
          class="input"
          placeholder="Name"
          bind:value={dirty.name}
        />
      </Label>

      <button
        type="submit"
        class="btn btn-primary"
        disabled={any_loading($loader)}
      >
        <Loading loading={$loader["update_passkey"]}>
          <Icon class="heroicons/tag" />
        </Loading>
        Update Passkey
      </button>
    </div>
  </Fieldset>
</form>
