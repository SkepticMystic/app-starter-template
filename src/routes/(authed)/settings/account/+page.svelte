<script lang="ts">
  import { resolve } from "$app/paths";
  import Header from "#lib/components/ui/header/Header.svelte";
  import { PasskeyClient } from "#lib/clients/auth/passkey.client.js";
  import { UserClient } from "#lib/clients/auth/user.client.js";
  import ChangeEmailForm from "#lib/components/form/account/ChangeEmailForm.svelte";
  import ChangePasswordForm from "#lib/components/form/account/ChangePasswordForm.svelte";
  import UserAccountsList from "#lib/components/form/account/UserAccountsList.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Item from "#lib/components/ui/item/Item.svelte";
  import Modal from "#lib/components/ui/modal/modal.svelte";
  import Separator from "#lib/components/ui/separator/separator.svelte";
  import { get_account_by_provider_id_remote } from "#lib/remote/auth/account.remote.js";
  import { account_deletion_blockers_remote } from "#lib/remote/auth/user.remote.js";
  import { result } from "#lib/utils/result.util.js";
  import UserPasskeysList from "./UserPasskeysList.svelte";
  import UserSessionsList from "./UserSessionsList.svelte";

  let { data } = $props();

  let user = $derived(data.account);

  const credential_account = $derived(
    get_account_by_provider_id_remote("credential").current,
  );
  const has_credential_account = $derived(
    credential_account?.ok === true && credential_account.data !== null,
  );

  // Checked again when the deletion runs; this only spares a dead-end email.
  const deletion_blockers = $derived(
    result.unwrap_or(account_deletion_blockers_remote().current, []),
  );
</script>

<article>
  <Header title="Account" />

  <section>
    <Item
      variant="default"
      title="Email address"
    >
      {#snippet description()}
        {user.email}
      {/snippet}

      {#snippet actions()}
        <Modal
          icon="lucide/mail"
          variant="secondary"
          title="Change email"
          description={user.emailVerified
            ? "We'll email your current address to approve it, then verify the new one."
            : "We'll send a verification link to the new address."}
        >
          {#snippet trigger()}
            Change
          {/snippet}

          {#snippet content({ close })}
            <ChangeEmailForm on_success={() => close()} />
          {/snippet}
        </Modal>
      {/snippet}
    </Item>
  </section>

  <Separator />

  <section>
    <h2>Sign-in methods</h2>
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
        Add passkey
      </Button>
    </div>

    <UserPasskeysList />
  </section>

  <Separator />

  <section>
    <h2>Sessions</h2>

    <UserSessionsList />
  </section>

  <Separator />

  <section>
    {#if has_credential_account}
      <Item
        variant="default"
        title="Change password"
        description="Update your account password to keep your account secure"
      >
        {#snippet actions()}
          <Modal
            icon="lucide/lock"
            variant="secondary"
            title="Change password"
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
          title="Two-factor authentication"
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
          title="Two-factor authentication"
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
      variant="default"
      title="Export your data"
      description="Download everything we hold about you as a JSON file"
    >
      {#snippet actions()}
        <Button
          icon="lucide/download"
          variant="secondary"
          onclick={() => UserClient.export_data(undefined)}
        >
          Export
        </Button>
      {/snippet}
    </Item>

    <Item
      variant="muted"
      class="border-destructive/30 bg-destructive/10"
      title="Delete account"
    >
      {#snippet description()}
        {#if deletion_blockers.length}
          Before you can delete your account:
          <ul class="mt-1 list-disc pl-5">
            {#each deletion_blockers as blocker (blocker.org_id + blocker.reason)}
              <li>
                {#if blocker.reason === "sole_owner"}
                  Make someone else an owner of <strong
                    >{blocker.org_name}</strong
                  >, or delete it
                {:else}
                  Cancel the subscription you pay for in <strong
                    >{blocker.org_name}</strong
                  >
                {/if}
              </li>
            {/each}
          </ul>
        {:else}
          Permanently delete your account and all associated data. Organizations
          only you belong to are deleted with it, and their subscriptions
          cancelled. This cannot be undone.
        {/if}
      {/snippet}

      {#snippet actions()}
        <Button
          icon="lucide/trash"
          variant="destructive"
          disabled={deletion_blockers.length > 0}
          tip={deletion_blockers.length
            ? {
                content: "Resolve the items listed first",
                disabled_trigger: true,
              }
            : null}
          onclick={UserClient.request_deletion}
        >
          Delete
        </Button>
      {/snippet}
    </Item>
  </section>
</article>
