<script lang="ts">
  import type { auth } from "$lib/auth";
  import { AccountsClient } from "$lib/clients/accounts.client";
  import Time from "$lib/components/Time.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Item from "$lib/components/ui/item/Item.svelte";
  import ItemList from "$lib/components/ui/item/ItemList.svelte";
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
      if (res.ok) {
        accounts = accounts.filter((acc) => acc.providerId !== providerId);
      }
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

<ItemList {items}>
  {#snippet item(item)}
    <Item
      icon={item.icon}
      title={item.name}
    >
      {#snippet description()}
        Connected on <Time
          date={item.createdAt}
          show="datetime"
        />
      {/snippet}

      {#snippet actions()}
        <Button
          variant="destructive"
          title="Unlink Account"
          icon="lucide/unlink"
          onclick={() => unlink_account(item.provider_id)}
        />
      {/snippet}
    </Item>
  {/snippet}
</ItemList>
