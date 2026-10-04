<script lang="ts">
  import { SessionClient } from "#lib/clients/auth/session.client.js";
  import Badge from "#lib/components/ui/badge/badge.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Time from "#lib/components/ui/elements/Time.svelte";
  import Item from "#lib/components/ui/item/Item.svelte";
  import ItemList from "#lib/components/ui/item/ItemList.svelte";
  import { list_sessions_remote } from "#lib/remote/auth/session.remote.js";
  import { result } from "#lib/utils/result.util.js";

  const sessions = list_sessions_remote();

  const items = $derived(result.unwrap_or(sessions.current, []));
  const has_others = $derived(items.some((s) => !s.current));
</script>

<div class="space-y-3">
  <ItemList
    {items}
    empty={{
      loading: sessions.loading,
      icon: "lucide/monitor-smartphone",
      title: "No sessions",
      description: "Sessions you sign in with appear here",
    }}
  >
    {#snippet item(session)}
      <Item
        size="sm"
        icon="lucide/monitor-smartphone"
      >
        {#snippet title()}
          {session.device}
          {#if session.current}
            <Badge variant="secondary">This device</Badge>
          {/if}
        {/snippet}

        {#snippet description()}
          {[session.ip_address, session.country].filter(Boolean).join(" · ")}
          {#if session.ip_address || session.country}·{/if}
          Active <Time
            date={session.last_active_at}
            show="relative"
          />
        {/snippet}

        {#snippet actions()}
          {#if !session.current}
            <Button
              icon="lucide/log-out"
              variant="destructive"
              tip="Sign out this session"
              onclick={() => SessionClient.revoke(session.id)}
            />
          {/if}
        {/snippet}
      </Item>
    {/snippet}
  </ItemList>

  {#if has_others}
    <Button
      icon="lucide/log-out"
      variant="secondary"
      onclick={() => SessionClient.revoke_others(undefined)}
    >
      Sign out everywhere else
    </Button>
  {/if}
</div>
