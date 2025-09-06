<script lang="ts">
  import type { auth } from "$lib/auth";
  import { AccountsClient } from "$lib/clients/accounts.client";
  import List from "$lib/components/daisyui/List.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Time from "$lib/components/Time.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";

  let {
    accounts = $bindable(),
  }: {
    accounts: Awaited<ReturnType<typeof auth.api.listUserAccounts>>;
  } = $props();

  const unlink_account = async (
    providerId: IAuth.ProviderId,
    accountId?: string,
  ) =>
    AccountsClient.unlink({ providerId, accountId }).then((res) => {
      res.ok &&
        (accounts = accounts.filter((acc) => acc.providerId !== providerId));
    });

  let items = $state(
    accounts.map((acc) => {
      const provider_id = acc.providerId as IAuth.ProviderId;
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
    <Icon icon={item.icon} size="size-7" />

    <div class="grow">
      <p class="text-lg">
        {item.name}
      </p>
      <p class="text-xs font-semibold uppercase opacity-60">
        Connected on <Time date={item.createdAt} show="datetime" />
      </p>
    </div>

    <div class="flex gap-0.5">
      <Button
        variant="destructive"
        title="Unlink Account"
        icon="heroicons/link-slash"
        onclick={() => unlink_account(item.provider_id)}
      />
    </div>
  {/snippet}
</List>
