<script lang="ts">
  import { goto } from "$app/navigation";
  import { UserClient } from "$lib/clients/user.client";
  import UserAccountsList from "$lib/components/auth/accounts/UserAccountsList.svelte";
  import AddPasskeyButton from "$lib/components/auth/passkeys/AddPasskeyButton.svelte";
  import UserPasskeysList from "$lib/components/auth/passkeys/UserPasskeysList.svelte";
  import Card from "$lib/components/Card.svelte";
  import Button from "$lib/components/ui/button/button.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import { any_loading, Loader } from "$lib/utils/loader";
  import ChangePassword from "./changePassword.svelte";

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
  <div>
    <h1>Profile</h1>
    <p>
      Logged in as <strong>{data.user.email}</strong>
      {#if data.user.name}
        ({data.user.name})
      {/if}
    </p>
  </div>

  {#if accounts.find((acc) => acc.provider === "credential")}
    <Card
      class="max-w-xs"
      title="Change Password"
      description="Change your account password."
    >
      {#snippet content()}
        <ChangePassword form_input={data.forms.change_password_form_input} />
      {/snippet}
    </Card>
  {/if}

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

  <h2>Accounts</h2>
  <UserAccountsList bind:accounts />

  <Button
    variant="destructive"
    onclick={delete_user}
    icon="heroicons/trash"
    disabled={any_loading($loader)}
    loading={$loader["delete_user"]}
  >
    Delete User
  </Button>
</div>
