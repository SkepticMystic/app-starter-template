<script lang="ts">
  import { dev } from "$app/environment";
  import { PasskeyClient } from "$lib/clients/auth/passkey.client.js";
  import { UserClient } from "$lib/clients/auth/user.client";
  import ChangePasswordForm from "$lib/components/auth/accounts/ChangePasswordForm.svelte";
  import UserAccountsList from "$lib/components/auth/accounts/UserAccountsList.svelte";
  import UserPasskeysList from "$lib/components/auth/passkeys/UserPasskeysList.svelte";
  import DisableTwoFactorForm from "$lib/components/auth/two_factor/DisableTwoFactorForm.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Modal from "$lib/components/ui/modal/modal.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { get_account_by_provider_id_remote } from "$lib/remote/auth/account.remote.js";
  import EnableTwoFactorFlow from "./EnableTwoFactorFlow.svelte";

  let { data } = $props();

  let user = $state(data.user);

  let has_credential_account = $derived(
    get_account_by_provider_id_remote("credential").current,
  );
</script>

<article>
  <header>
    <h1>Profile</h1>
  </header>

  <section class="flex items-center gap-3">
    <UserAvatar
      {user}
      class="size-14"
    />

    <div>
      {#if user.name}
        <p>
          <strong>{user.name}</strong>
        </p>
      {/if}
      <p>{user.email}</p>
      {#if dev}
        <code>{user.id}</code>
      {/if}
    </div>
  </section>

  <section>
    <h2>Accounts</h2>
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

  <section class="flex flex-wrap gap-2">
    {#if has_credential_account}
      <Modal
        title="Change Password"
        description="Change your account password"
      >
        {#snippet trigger()}
          <Icon icon="lucide/lock" />
          Change Password
        {/snippet}

        {#snippet content({ close })}
          <ChangePasswordForm on_success={() => close()} />
        {/snippet}
      </Modal>

      {#if !user.twoFactorEnabled}
        <Modal>
          {#snippet trigger()}
            <Icon icon="lucide/lock" />
            Enable Two-Factor Authentication
          {/snippet}

          {#snippet content({ close })}
            <EnableTwoFactorFlow
              on_success={() => {
                user.twoFactorEnabled = true;
                close();
              }}
            />
          {/snippet}
        </Modal>
      {:else}
        <Modal>
          {#snippet trigger_child({ props })}
            <Button
              {...props}
              icon="lucide/lock"
              variant="destructive"
            >
              Disable Two-Factor Authentication
            </Button>
          {/snippet}

          {#snippet content({ close })}
            <DisableTwoFactorForm
              on_success={() => {
                user.twoFactorEnabled = false;
                close();
              }}
            />
          {/snippet}
        </Modal>
      {/if}
    {/if}

    <Button
      icon="lucide/trash"
      variant="destructive"
      onclick={UserClient.request_deletion}
    >
      Delete my account
    </Button>
  </section>
</article>
