<script lang="ts">
  import { goto } from "$app/navigation";
  import { AuthClient } from "$lib/auth-client.js";
  import SocialSigninButton from "$lib/components/auth/SocialSigninButton.svelte";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const.js";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import { preventDefault } from "svelte/legacy";

  let { data } = $props();

  const loader = Loader<`signin:${IAuth.ProviderId}`>();

  let form = $state({
    password: "",
    email: data.search.email_hint ?? "",
  });

  const signin = async () => {
    loader.load("signin:email");

    try {
      const res = await AuthClient.signIn.email({
        ...form,
      });

      if (res.data) {
        await goto(data.search.redirect_uri ?? "/");
      } else {
        toast.warning(res.error.message ?? "Signin failed. Please try again.");
        console.warn(res.error);
      }
    } catch (error) {
      console.log(error);
      toast.error("Signin failed.");
    }

    loader.reset();
  };
</script>

<div class="mx-auto flex max-w-xs flex-col gap-5">
  {#if data.search.previous === "team-invite"}
    <p class="text-success">
      Team invite accepted, please sign in to continue.
    </p>
  {:else if data.search.previous === "reset-password"}
    <p class="text-success">
      Password reset successful, please sign in to continue.
    </p>
  {/if}

  <div class="flex flex-col gap-2">
    {#each AUTH.PROVIDERS.IDS as provider_id}
      {@const { is_sso } = AUTH.PROVIDERS.MAP[provider_id]}

      {#if is_sso}
        <SocialSigninButton {provider_id} {loader} />
      {/if}
    {/each}
  </div>

  <div class="divider">OR</div>

  <form onsubmit={preventDefault(signin)}>
    <Fieldset legend="Signin with email">
      <div class="space-y-3">
        <Label lbl="Email">
          <input
            type="email"
            class="input w-full"
            placeholder="Email"
            autocomplete="email"
            disabled={!!data.search.email_hint}
            bind:value={form.email}
          />
        </Label>

        <Label lbl="Password">
          <input
            type="password"
            class="input w-full"
            placeholder="Password"
            autocomplete="current-password"
            bind:value={form.password}
          />
        </Label>

        <button
          class="btn btn-primary"
          type="submit"
          disabled={!form.email || !form.password || any_loading($loader)}
        >
          <Loading loading={$loader["signin:email"]} />
          Signin
        </button>
      </div>
    </Fieldset>
  </form>

  <ul>
    <li>
      <a class="link" href={ROUTES.AUTH_SIGNUP}>Signup instead</a>
    </li>

    <li>
      <a class="link" href={ROUTES.AUTH_FORGOT_PASSWORD}> Forgot password? </a>
    </li>
  </ul>
</div>
