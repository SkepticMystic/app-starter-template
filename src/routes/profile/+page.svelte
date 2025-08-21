<script lang="ts">
  import { goto } from "$app/navigation";
  import { AuthClient } from "$lib/auth-client";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { user } from "$lib/stores/session";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import ChangePassword from "./changePassword.svelte";

  const loader = Loader<"delete_user">();

  const delete_user = async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;

    loader.load("delete_user");

    const res = await AuthClient.deleteUser();

    if (res.data) {
      toast.success("Account deleted successfully.", {
        clear_on_navigate: false,
      });

      await goto(ROUTES.AUTH_SIGNIN);
    } else {
      toast.error(
        res.error.message ?? "Failed to delete account. Please try again.",
      );
      console.warn(res.error);
    }

    loader.reset();
  };
</script>

<h1 class="text-2xl">Profile</h1>
<div class="my-3"></div>

{#if $user}
  <p class="text-lg">Welcome {$user.name}</p>

  <div class="my-5">
    <ChangePassword />
  </div>

  <div class="my-5">
    <button
      class="btn btn-error"
      disabled={any_loading($loader)}
      onclick={delete_user}
    >
      <Loading loading={$loader["delete_user"]} />
      Delete Account
    </button>
  </div>
{:else}
  <p class="text-lg">You are not logged in</p>
{/if}
