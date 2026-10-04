<script lang="ts">
  import { AccountClient } from "#lib/clients/auth/account.client.js";
  import Button from "#lib/components/ui/button/button.svelte";
  import Time from "#lib/components/ui/elements/Time.svelte";
  import Item from "#lib/components/ui/item/Item.svelte";
  import ItemList from "#lib/components/ui/item/ItemList.svelte";
  import { AUTH, type IAuth } from "#lib/const/auth/auth.const.js";
  import { list_accounts_remote } from "#lib/remote/auth/account.remote.js";
  import { result } from "#lib/utils/result.util.js";

  const accounts = list_accounts_remote();

  let items = $derived(
    // The in-place alternative the rule suggests would mutate the rows held by
    // the remote query itself, not a copy of them.
    // oxlint-disable-next-line oxc/no-map-spread
    result.unwrap_or(accounts.current, []).map((acc) => {
      const provider_id = acc.providerId as IAuth.ProviderId;
      // A provider since removed from config still has rows to show and unlink.
      const known: { name: string; icon: string } | undefined =
        AUTH.PROVIDERS.MAP[provider_id];
      const provider = known ?? { name: acc.providerId, icon: "lucide/key" };

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
    description: "Accounts you sign in with will appear here.",
  }}
>
  {#snippet item(item)}
    <Item
      size="sm"
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
          icon="lucide/unlink"
          onclick={() =>
            AccountClient.unlink({
              id: item.accountId,
              providerId: item.provider_id,
            })}
        >
          Unlink
        </Button>
      {/snippet}
    </Item>
  {/snippet}
</ItemList>
