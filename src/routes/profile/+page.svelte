<script lang="ts">
  import { PasskeyClient } from "$lib/clients/auth/passkey.client.js";
  import { UserClient } from "$lib/clients/auth/user.client";
  import ChangePasswordForm from "$lib/components/auth/accounts/ChangePasswordForm.svelte";
  import UserAccountsList from "$lib/components/auth/accounts/UserAccountsList.svelte";
  import UserPasskeysList from "$lib/components/auth/passkeys/UserPasskeysList.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";
  import Icon from "$lib/components/ui/icon/Icon.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { get_account_by_provider_id_remote } from "$lib/remote/auth/account.remote.js";

  let { data } = $props();

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
      class="size-14"
      user={data.user}
    />

    <div>
      {#if data.user.name}
        <p>
          <strong>{data.user.name}</strong>
        </p>
      {/if}
      <p>{data.user.email}</p>
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
        onclick={() => PasskeyClient.create()}
      >
        Add Passkey
      </Button>
    </div>

    <UserPasskeysList />
  </section>

  <Separator />

  <section class="flex gap-2">
    {#if has_credential_account}
      <Dialog
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
      </Dialog>
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
