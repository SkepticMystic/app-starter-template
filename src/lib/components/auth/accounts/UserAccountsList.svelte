<script lang="ts">
  import type { auth } from "$lib/auth";
  import { AccountsClient } from "$lib/clients/accounts.client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { Dates } from "$lib/utils/dates";
  import { any_loading, Loader } from "$lib/utils/loader";
  import IconXMark from "~icons/heroicons/x-mark";

  let {
    accounts = $bindable(),
  }: {
    accounts: Awaited<ReturnType<typeof auth.api.listUserAccounts>>;
  } = $props();

  const loader = Loader<`unlink_account:${IAuth.ProviderId}`>();

  const unlink_account = async (
    provider_id: IAuth.ProviderId,
    account_id?: string,
  ) => {
    loader.load(`unlink_account:${provider_id}`);

    const res = await AccountsClient.unlink(provider_id, account_id);
    if (res.ok) {
      accounts = accounts.filter((account) => account.provider !== provider_id);
    }

    loader.reset();
  };
</script>

<div class="flex flex-col gap-2">
  {#each AUTH.PROVIDERS.IDS as provider_id (provider_id)}
    {@const provider = AUTH.PROVIDERS.MAP[provider_id]}

    {@const provider_accounts = accounts.filter(
      (account) => account.provider === provider_id,
    )}

    {#each provider_accounts as account (account.id)}
      <div class="rounded-box border p-3 shadow-md">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <svelte:component this={provider.icon} class="h-8 w-8" />

            <div class="flex flex-col">
              <span class="font-bold">{provider.name}</span>
              <span class="text-sm">
                Added on {Dates.show_date(account.createdAt)}
              </span>
            </div>
          </div>

          <button
            title="Unlink Account"
            class="btn btn-square"
            disabled={any_loading($loader)}
            onclick={() => unlink_account(provider_id)}
          >
            <Loading loading={$loader[`unlink_account:${provider_id}`]}>
              <IconXMark />
            </Loading>
          </button>
        </div>
      </div>
    {/each}
  {/each}
</div>
