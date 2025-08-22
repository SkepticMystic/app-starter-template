<script lang="ts">
  import { goto } from "$app/navigation";
  import { AuthClient } from "$lib/auth-client";
  import SocialSigninButton from "$lib/components/auth/SocialSigninButton.svelte";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import { preventDefault } from "svelte/legacy";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const loader = Loader<`signup:email` | `signin:${IAuth.ProviderId}`>();

  let form = $state({
    password: "",
    email: data.search.email_hint ?? "",
  });

  const signup_email = async () => {
    toast.set([]);
    loader.load("signup:email");

    try {
      const signup_res = await AuthClient.signUp.email({
        ...form,
        name: "",
        callbackURL: App.url(ROUTES.HOME, { toast: TOAST.IDS.EMAIL_VERIFIED }),
      });

      console.log("signup_res", signup_res);

      if (signup_res.error) {
        console.warn("signup_res.error", signup_res.error);
        toast.warning(
          signup_res.error.message ?? "Signup failed. Please try again.",
        );
      } else {
        await goto(ROUTES.AUTH_VERIFY_EMAIL);
      }
    } catch (error) {
      toast.error("Signup failed. Please try again.");
      console.error("Signup error:", error);
    }

    loader.reset();
  };
</script>

<div class="flex flex-col gap-5">
  {#if data.search.team_token}
    <p>You've been invited to join a team. Please signup to continue.</p>
  {/if}

  <form onsubmit={preventDefault(signup_email)} class="flex flex-col gap-3">
    <Fieldset legend="Signup">
      <div class="flex flex-col gap-2">
        <Label lbl="Email">
          <input
            class="input"
            type="email"
            placeholder="Email"
            autocomplete="email"
            disabled={!!data.search.email_hint}
            bind:value={form.email}
          />
        </Label>

        <Label lbl="Password">
          <input
            class="input"
            type="password"
            autocomplete="new-password"
            placeholder="Password"
            bind:value={form.password}
          />
        </Label>
      </div>
    </Fieldset>

    <button
      class="btn btn-primary w-fit"
      type="submit"
      disabled={!form.email || !form.password || any_loading($loader)}
    >
      <Loading loading={$loader["signup:email"]} />
      Signup
    </button>
  </form>

  <div class="divider">OR</div>

  <div class="flex flex-col gap-3">
    {#each AUTH.PROVIDERS.IDS as provider_id}
      {@const { is_sso } = AUTH.PROVIDERS.MAP[provider_id]}

      {#if is_sso}
        <SocialSigninButton {provider_id} {loader} />
      {/if}
    {/each}
  </div>

  <p>
    <a class="link" href={ROUTES.AUTH_SIGNIN}>Sign in instead</a>
  </p>
</div>
