<script lang="ts">
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
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

<button
  class="btn btn-secondary"
  onclick={add_passkey}
  disabled={any_loading($loader)}
>
  <Loading loading={$loader["add_passkey"]}>
    <Icon icon="heroicons/finger-print" />
  </Loading>
  Add Passkey
</button>
