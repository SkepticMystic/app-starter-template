<script lang="ts">
  import { resolve } from "$app/paths";
  import { PasskeyClient } from "$lib/clients/auth/passkey.client.js";
  import { UserClient } from "$lib/clients/auth/user.client";
  import ChangePasswordForm from "$lib/components/form/account/ChangePasswordForm.svelte";
  import UserAccountsList from "$lib/components/form/account/UserAccountsList.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Item from "$lib/components/ui/item/Item.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { get_account_by_provider_id_remote } from "$lib/remote/auth/account.remote.js";
  import UserPasskeysList from "./UserPasskeysList.svelte";

  let { data } = $props();

  let user = $derived(data.user);

  let has_credential_account = $derived(
    get_account_by_provider_id_remote("credential").current,
  );
</script>

<article>
  <header>
    <h1>Account</h1>
  </header>

  <section>
    <h2>Login Methods</h2>
    <UserAccountsList />
  </section>

  <Separator />

  <section>
    <div class="flex items-center justify-between gap-3">
      <h2>Passkeys</h2>

      <Button
        icon="lucide/fingerprint"
        onclick={() => PasskeyClient.create({})}
      >
        Add Passkey
      </Button>
    </div>

    <UserPasskeysList />
  </section>

  <Separator />

  <section class="">
    {#if has_credential_account}
      <Item
        variant="default"
        title="Change Password"
        description="Update your account password to keep your account secure"
      >
        {#snippet actions()}
          <Modal
            icon="lucide/lock"
            variant="secondary"
            title="Change Password"
            description="Change your account password"
          >
            {#snippet trigger()}
              Change
            {/snippet}

            {#snippet content({ close })}
              <ChangePasswordForm on_success={() => close()} />
            {/snippet}
          </Modal>
        {/snippet}
      </Item>

      {#if !user.twoFactorEnabled}
        <Item
          variant="default"
          title="Two-Factor Authentication"
          description="Add an extra layer of security to your account by requiring a second form of authentication when signing in"
        >
          {#snippet actions()}
            <Button
              icon="lucide/lock"
              href={resolve("/(authed)/settings/account/two-factor/enable")}
            >
              Enable
            </Button>
          {/snippet}
        </Item>
      {:else}
        <Item
          variant="default"
          title="Two-Factor Authentication"
          description="Two-factor authentication is currently enabled on your account. Disabling it will remove the extra layer of security from your account and make it more vulnerable to unauthorized access."
        >
          {#snippet actions()}
            <Button
              icon="lucide/lock"
              href={resolve("/(authed)/settings/account/two-factor/disable")}
              variant="destructive"
            >
              Disable
            </Button>
          {/snippet}
        </Item>
      {/if}
    {/if}

    <Item
      variant="muted"
      class="border-destructive/30 bg-destructive/10"
      title="Delete Account"
      description="Permanently delete your account and all associated data. This action cannot be undone."
    >
      {#snippet actions()}
        <Button
          icon="lucide/trash"
          variant="destructive"
          onclick={UserClient.request_deletion}
        >
          Delete
        </Button>
      {/snippet}
    </Item>
  </section>
</article>
