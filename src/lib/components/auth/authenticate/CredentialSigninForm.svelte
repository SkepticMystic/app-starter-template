<script lang="ts">
  import { goto } from "$app/navigation";
  import { BetterAuthClient } from "$lib/auth-client.js";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { AUTH, type IAuth } from "$lib/const/auth.const.js";
  import { ROUTES } from "$lib/const/routes.const.js";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import { preventDefault } from "svelte/legacy";

  let {
    loader,
    email_hint,
    redirect_uri,
  }: {
    email_hint?: string;
    redirect_uri?: string;
    loader: Loader<`signin:${IAuth.ProviderId}`>;
  } = $props();

  const provider_id = "credential" satisfies IAuth.ProviderId;
  const provider = AUTH.PROVIDERS.MAP[provider_id];

  let form = $state({
    password: "",
    rememberMe: false,
    email: email_hint ?? "",
  });

  const signin = async () => {
    loader.load(`signin:${provider_id}`);

    try {
      const res = await BetterAuthClient.signIn.email({
        ...form,
      });

      if (res.data) {
        await goto(redirect_uri ?? ROUTES.HOME);
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

<form onsubmit={preventDefault(signin)}>
  <Fieldset legend="Signin with email">
    <div class="space-y-3">
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
          autocomplete="current-password"
          bind:value={form.password}
        />
      </Label>

      <div class="flex items-center justify-between">
        <label class="flex items-center gap-1.5">
          <input
            type="checkbox"
            class="checkbox"
            bind:checked={form.rememberMe}
          />
          <span>Remember me</span>
        </label>

        <button
          type="submit"
          class="btn btn-primary"
          disabled={!form.email || !form.password || any_loading($loader)}
        >
          <Loading loading={$loader[`signin:${provider_id}`]}>
            <!-- svelte-ignore svelte_component_deprecated -->
            <svelte:component this={provider.icon} />
          </Loading>
          Signin
        </button>
      </div>
    </div>
  </Fieldset>
</form>
