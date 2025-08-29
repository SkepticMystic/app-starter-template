<script lang="ts">
  import { goto } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import Icon from "$lib/components/icons/Icon.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const";
  import { ROUTES } from "$lib/const/routes.const";
  import { TOAST } from "$lib/const/toast.const";
  import { App } from "$lib/utils/app";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-sonner";
  import { preventDefault } from "svelte/legacy";

  let {
    loader,
    email_hint,
    redirect_uri,
  }: {
    email_hint?: string;
    redirect_uri?: string;
    loader: Loader<`signup:${IAuth.ProviderId}`>;
  } = $props();

  const provider_id = "credential" satisfies IAuth.ProviderId;
  const provider = AUTH.PROVIDERS.MAP[provider_id];

  let form = $state({
    name: "",
    password: "",
    email: email_hint ?? "",
  });

  const signup_email = async () => {
    toast.dismiss();
    loader.load(`signup:${provider_id}`);

    try {
      const signup_res = await BetterAuthClient.signUp.email({
        ...form,
        // NOTE: This is called after email verification
        // The _actual_ redirect is below, to the VERIFY_EMAIL page
        callbackURL:
          redirect_uri ??
          App.url(ROUTES.HOME, { toast: TOAST.IDS.EMAIL_VERIFIED }),
      });

      console.log("signup_res", signup_res);

      if (signup_res.error) {
        console.warn("signup_res.error", signup_res.error);
        toast.warning(
          signup_res.error.message ?? "Signup failed. Please try again.",
        );
      } else {
        await goto(
          App.url(ROUTES.AUTH_VERIFY_EMAIL, {
            toast: TOAST.IDS.SIGNED_UP,
          }),
        );
      }
    } catch (error) {
      toast.error("Signup failed. Please try again.");
      console.error("Signup error:", error);
    }

    loader.reset();
  };
</script>

<form onsubmit={preventDefault(signup_email)}>
  <Fieldset legend="Signup with {provider.name}">
    <div class="space-y-3">
      <Label lbl="Name (optional)">
        <input
          type="text"
          class="input w-full"
          placeholder="Name"
          autocomplete="name"
          bind:value={form.name}
        />
      </Label>

      <Label lbl="Email">
        <input
          type="email"
          class="input w-full"
          placeholder="Email"
          autocomplete="email"
          disabled={!!email_hint}
          bind:value={form.email}
        />
      </Label>

      <Label lbl="Password">
        <input
          type="password"
          class="input w-full"
          placeholder="Password"
          autocomplete="new-password"
          bind:value={form.password}
        />
      </Label>

      <button
        type="submit"
        class="btn btn-primary w-full"
        disabled={!form.email || !form.password || any_loading($loader)}
      >
        <Loading loading={$loader[`signup:${provider_id}`]}>
          <Icon icon={provider.icon} />
        </Loading>
        Signup with {provider.name}
      </button>
    </div>
  </Fieldset>
</form>
