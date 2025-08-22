<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { any_loading, Loader } from "$lib/utils/loader";
  import IconFingerprint from "~icons/heroicons/finger-print";

  const loader = Loader<"add_passkey">();

  const add_passkey = async () => {
    loader.load("add_passkey");

    const res = await PasskeysClient.create();
    if (res.ok) {
      await invalidateAll();
    }

    loader.reset();
  };
</script>

<button class="btn" onclick={add_passkey} disabled={any_loading($loader)}>
  <Loading loading={$loader["add_passkey"]}>
    <IconFingerprint />
  </Loading>
  Add Passkey
</button>
