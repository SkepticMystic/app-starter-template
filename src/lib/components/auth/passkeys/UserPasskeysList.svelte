<script lang="ts">
  import { PasskeyClient } from "$lib/clients/auth/passkey.client";
  import Button from "$lib/components/ui/button/button.svelte";
  import Time from "$lib/components/ui/elements/Time.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Item from "$lib/components/ui/item/Item.svelte";
  import ItemList from "$lib/components/ui/item/ItemList.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
  import { get_all_passkeys_remote } from "$lib/remote/auth/passkey.remote";
  import { result } from "$lib/utils/result.util";
  import EditPasskeyForm from "./EditPasskeyForm.svelte";

  const passkeys = get_all_passkeys_remote();
</script>

<ItemList
  items={result.unwrap_or(passkeys.current, [])}
  empty={{
    loading: passkeys.loading,
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
        Connected on <Time date={passkey.createdAt} />
      {/snippet}

      {#snippet actions()}
        <Modal
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
        </Modal>

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
