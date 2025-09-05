<script lang="ts">
  import { goto } from "$app/navigation";
  import { UserClient } from "$lib/clients/user.client";
  import UserAccountsList from "$lib/components/auth/accounts/UserAccountsList.svelte";
  import AddPasskeyButton from "$lib/components/auth/passkeys/AddPasskeyButton.svelte";
  import UserPasskeysList from "$lib/components/auth/passkeys/UserPasskeysList.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import UserAvatar from "$lib/components/ui/avatar/UserAvatar.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import Dialog from "$lib/components/ui/dialog/dialog.svelte";
  import Separator from "$lib/components/ui/separator/separator.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import { any_loading, Loader } from "$lib/utils/loader";
  import ChangePasswordForm from "$lib/components/auth/accounts/ChangePasswordForm.svelte";

  let { data } = $props();
  let { passkeys, accounts } = $state(data);

  const loader = Loader<"delete_user">();

  const delete_user = async () => {
    loader.load("delete_user");

    const res = await UserClient.delete();
    if (res.ok) {
      await goto(
        App.url(ROUTES.AUTH_SIGNIN, { toast: TOAST.IDS.USER_DELETED }),
      );
    }

    loader.reset();
  };
</script>

<div class="space-y-9">
  <div class="space-y-3">
    <h1>Profile</h1>

    <div class="flex items-center gap-3">
      <UserAvatar class="size-14" user={data.user} />

      <div class="flex flex-col">
        {#if data.user.name}
          <strong>{data.user.name}</strong>
        {/if}
        {data.user.email}
      </div>
    </div>
  </div>

  <div class="space-y-3">
    <div class="flex items-center gap-3">
      <h2>Passkeys</h2>
      <!-- NOTE: Not even invalidateAll seems to get the new key loaded... -->
      <AddPasskeyButton
        on_added={() => {
          location.href = App.url(ROUTES.PROFILE, {
            toast: TOAST.IDS.PASSKEY_ADDED,
          });
        }}
      />
    </div>
    {#if passkeys.length}
      <UserPasskeysList bind:passkeys />
    {:else}
      <p>No passkeys added yet.</p>
    {/if}
  </div>

  <div class="space-y-3">
    <h2>Accounts</h2>
    <UserAccountsList bind:accounts />
  </div>

  <Separator />

  <div class="flex gap-2">
    {#if accounts.find((acc) => acc.provider === "credential")}
      <Dialog
        title="Change Password"
        description="Change your account password"
      >
        {#snippet trigger()}
          <Icon icon="heroicons/lock-closed" />
          Change Password
        {/snippet}

        {#snippet content({ close })}
          <ChangePasswordForm on_success={() => close()} />
        {/snippet}
      </Dialog>
    {/if}

    <Button
      variant="destructive"
      onclick={delete_user}
      icon="heroicons/trash"
      disabled={any_loading($loader)}
      loading={$loader["delete_user"]}
    >
      Delete user
    </Button>
  </div>
</div>
