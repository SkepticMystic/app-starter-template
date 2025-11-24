<script lang="ts">
  import { PasskeyClient } from "$lib/clients/auth/passkey.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import type { MaybePromise } from "$lib/interfaces";

  let {
    on_added,
  }: {
    // NOTE: No passkey is returned from the BetterAuthClient on creation...
    // So we just dispatch the event with no payload
    on_added?: () => MaybePromise<void>;
  } = $props();

  const add_passkey = () =>
    PasskeyClient.create().then((res) => res.ok && on_added?.());
</script>

<Button
  onclick={add_passkey}
  icon="lucide/fingerprint">Add Passkey</Button
>
