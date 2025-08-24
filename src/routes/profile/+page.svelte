<script lang="ts">
  import { goto } from "$app/navigation";
  import { UserClient } from "$lib/clients/user.client";
  import UserAccountsList from "$lib/components/auth/accounts/UserAccountsList.svelte";
  import AddPasskeyButton from "$lib/components/auth/passkeys/AddPasskeyButton.svelte";
  import UserPasskeysList from "$lib/components/auth/passkeys/UserPasskeysList.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { any_loading, Loader } from "$lib/utils/loader";
  import ChangePassword from "./changePassword.svelte";

  let { data } = $props();

  const loader = Loader<"delete_user">();

  const delete_user = async () => {
    loader.load("delete_user");

    const res = await UserClient.delete();
    if (res.ok) {
      await goto(ROUTES.AUTH_SIGNIN);
    }

    loader.reset();
  };
</script>

<div class="space-y-5">
  <h1 class="text-2xl">Profile</h1>

  <p>
    Logged in as <strong>{data.user.email}</strong>
    {#if data.user.name}
      (Name: <strong>{data.user.name}</strong>)
    {/if}
  </p>

  {#if data.accounts.find((acc) => acc.provider === "credential")}
    <div>
      <ChangePassword />
    </div>
  {/if}

  <div class="divider"><h2 class="text-xl">Passkeys</h2></div>

  <div>
    <AddPasskeyButton />

    <UserPasskeysList passkeys={data.passkeys} />
  </div>

  <div class="divider"><h2 class="text-xl">Accounts</h2></div>
  <UserAccountsList accounts={data.accounts} />

  <div class="divider"></div>

  <button
    class="btn btn-error"
    disabled={any_loading($loader)}
    onclick={delete_user}
  >
    <Loading loading={$loader["delete_user"]} />
    Delete User
  </button>
</div>
