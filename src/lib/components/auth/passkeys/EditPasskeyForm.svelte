<script lang="ts">
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Labeled from "$lib/components/ui/label/Labeled.svelte";
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
      dirty = res.data.passkey;
      on_update?.(res.data.passkey);
    }

    loader.reset();
  };
</script>

<form onsubmit={preventDefault(update_passkey)}>
  <Fieldset legend="Update Passkey">
    <div class="space-y-3">
      <Labeled label="Name">
        <Input type="text" placeholder="Name" bind:value={dirty.name} />
      </Labeled>

      <Button
        type="submit"
        icon="heroicons/tag"
        disabled={any_loading($loader)}
        loading={$loader["update_passkey"]}
      >
        Update Passkey
      </Button>
    </div>
  </Fieldset>
</form>
