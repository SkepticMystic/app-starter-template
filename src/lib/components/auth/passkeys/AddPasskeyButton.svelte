<script lang="ts">
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import type { MaybePromise } from "$lib/interfaces";
  import { any_loading, Loader } from "$lib/utils/loader";

  let {
    on_added,
  }: {
    // NOTE: No passkey is returned from the BetterAuthClient on creation...
    // So we just dispatch the event with no payload
    on_added?: () => MaybePromise<void>;
  } = $props();

  const loader = Loader<"add_passkey">();

  const add_passkey = async () => {
    loader.load("add_passkey");

    const res = await PasskeysClient.create();
    if (res.ok) {
      await on_added?.();
    }

    loader.reset();
  };
</script>

<Button
  onclick={add_passkey}
  icon="heroicons/finger-print"
  disabled={any_loading($loader)}
  loading={$loader["add_passkey"]}
>
  Add Passkey
</Button>
