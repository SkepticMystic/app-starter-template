<script lang="ts">
  import { goto } from "$app/navigation";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import type { Result } from "$lib/interfaces";
  import { user } from "$lib/stores/user";
  import { get_http_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import axios from "axios";
  import { toast } from "svelte-daisyui-toast";
  import ChangePassword from "./changePassword.svelte";

  const loader = Loader<"delete-user">();

  const deleteUser = async () => {
    if (!confirm("Are you sure you want to delete your account?")) return;

    loader.load("delete-user");

    try {
      const { data } = await axios.delete<Result>("/api/user");
      if (data.ok) await goto("/auth/signin");
    } catch (error) {
      console.log(error);
      toast.error(get_http_error_msg(error));
    }

    loader.reset();
  };
</script>

<h1 class="text-2xl">Profile</h1>
<div class="my-3"></div>

{#if $user}
  <p class="text-lg">Welcome {$user.email.split("@")[0]}</p>

  <div class="my-5">
    <ChangePassword />
  </div>

  <div class="my-5">
    <button
      class="btn btn-error"
      disabled={any_loading($loader)}
      onclick={deleteUser}
    >
      <Loading loading={$loader["delete-user"]} />
      Delete Account
    </button>
  </div>
{:else}
  <p class="text-lg">You are not logged in</p>
{/if}
