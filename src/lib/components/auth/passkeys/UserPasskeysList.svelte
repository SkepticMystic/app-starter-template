<script lang="ts">
  import { invalidateAll } from "$app/navigation";
  import type { auth } from "$lib/auth";
  import { PasskeysClient } from "$lib/clients/passkeys.client";
  import { Dates } from "$lib/utils/dates";
  import { any_loading, Loader } from "$lib/utils/loader";
  import IconXMark from "~icons/heroicons/x-mark";

  let {
    passkeys,
  }: {
    passkeys: Awaited<ReturnType<typeof auth.api.listPasskeys>>;
  } = $props();

  const loader = Loader<`delete_passkey:${string}`>();

  const delete_passkey = async (passkey_id: string) => {
    loader.load(`delete_passkey:${passkey_id}`);

    const res = await PasskeysClient.delete(passkey_id);
    if (res.ok) {
      await invalidateAll();
    }

    loader.reset();
  };
</script>

<div class="flex flex-col gap-2">
  {#each passkeys as passkey}
    <div class="rounded-box border p-3 shadow-md">
      <div class="flex justify-between">
        <div class="flex flex-col">
          <span class="font-bold">{passkey.name}</span>
          <span class="text-neutral-content text-sm">
            Added on {Dates.show_date(passkey.createdAt)}
          </span>
        </div>

        <button
          title="Delete Passkey"
          class="btn btn-square"
          disabled={any_loading($loader)}
          onclick={() => delete_passkey(passkey.id)}
        >
          <IconXMark />
        </button>
      </div>
    </div>
  {/each}
</div>
