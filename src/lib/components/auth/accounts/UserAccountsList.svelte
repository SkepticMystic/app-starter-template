<script lang="ts">
  import type { auth } from "$lib/auth";
  import { AccountsClient } from "$lib/clients/accounts.client";
  import List from "$lib/components/daisyui/List.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { Dates } from "$lib/utils/dates";
  import { any_loading, Loader } from "$lib/utils/loader";

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

  let items = $state(
    accounts.map((acc) => {
      const provider_id = acc.provider as IAuth.ProviderId;
      const provider = AUTH.PROVIDERS.MAP[provider_id];

      return {
        ...acc,
        provider_id,
        name: provider.name,
        icon: provider.icon,
      };
    }),
  );
</script>

<List {items}>
  {#snippet row(item)}
    <Icon class={item.icon} size="size-7" />

    <div>
      <p class="text-lg">
        {item.name}
      </p>
      <p class="text-xs font-semibold uppercase opacity-60">
        Connected on {Dates.show_date(item.createdAt)}
      </p>
    </div>

    <div class="flex gap-0.5">
      <button
        title="Unlink Account"
        class="btn btn-square btn-warning"
        disabled={any_loading($loader)}
        onclick={() => unlink_account(item.provider_id)}
      >
        <Loading loading={$loader[`unlink_account:${item.provider_id}`]}>
          <Icon class="heroicons/link-slash" />
        </Loading>
      </button>
    </div>
  {/snippet}
</List>
