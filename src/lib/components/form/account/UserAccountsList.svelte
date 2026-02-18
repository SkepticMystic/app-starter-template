<script lang="ts">
  import { AccountClient } from "$lib/clients/auth/account.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import Time from "$lib/components/ui/elements/Time.svelte";
  import Item from "$lib/components/ui/item/Item.svelte";
  import ItemList from "$lib/components/ui/item/ItemList.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth/auth.const";
  import { get_all_accounts_remote } from "$lib/remote/auth/account.remote";
  import { result } from "$lib/utils/result.util";

  const accounts = get_all_accounts_remote();

  let items = $derived(
    result.unwrap_or(accounts.current, []).map((acc) => {
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

<ItemList
  {items}
  empty={{
    loading: accounts.loading,
    icon: "lucide/user-plus",
    title: "No accounts linked",
    description: "Link an account to get started.",
  }}
>
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
          onclick={() =>
            AccountClient.unlink({
              accountId: item.accountId,
              providerId: item.provider_id,
            })}
        />
      {/snippet}
    </Item>
  {/snippet}
</ItemList>
