<script lang="ts">
  import { PasskeyClient } from "$lib/clients/auth/passkey.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";
  import Time from "$lib/components/ui/elements/Time.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Item from "$lib/components/ui/item/Item.svelte";
  import ItemList from "$lib/components/ui/item/ItemList.svelte";
  import { get_all_passkeys_remote } from "$lib/remote/auth/passkey.remote";
  import { result } from "$lib/utils/result.util";
  import EditPasskeyForm from "./EditPasskeyForm.svelte";

  const passkeys = get_all_passkeys_remote();
</script>

<ItemList
  items={result.unwrap_or(passkeys.current ?? result.suc([]), [])}
  empty={{
    icon: "lucide/fingerprint",
    title: "No Passkeys",
    description: "Add a passkey to your account to use it here",
  }}
>
  {#snippet item(passkey)}
    <Item
      icon="lucide/fingerprint"
      title={passkey.name || "Unnamed Passkey"}
    >
      {#snippet description()}
        Connected on <Time
          date={passkey.createdAt}
          show="date"
        />
      {/snippet}

      {#snippet actions()}
        <Dialog
          size="icon"
          title="Edit Passkey"
          description="Update your passkey"
        >
          {#snippet trigger()}
            <Icon icon="lucide/pencil" />
          {/snippet}

          {#snippet content()}
            <EditPasskeyForm {passkey} />
          {/snippet}
        </Dialog>

        <Button
          icon="lucide/x"
          variant="destructive"
          title="Delete Passkey"
          onclick={() => PasskeyClient.delete(passkey.id)}
        />
      {/snippet}
    </Item>
  {/snippet}
</ItemList>
