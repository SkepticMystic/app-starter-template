<script lang="ts">
  import { goto } from "$app/navigation";
  import { AuthClient } from "$lib/auth-client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { ROUTES } from "$lib/const/routes.const";
  import { App } from "$lib/utils/app";
  import { any_loading, Loader } from "$lib/utils/loader";
  import { toast } from "svelte-daisyui-toast";
  import { preventDefault } from "svelte/legacy";
  import type { PageProps } from "./$types";
  import { TOAST } from "$lib/const/toast.const";

  let { data }: PageProps = $props();

  const loader = Loader<"signup">();

  let form = $state({
    password: "",
    email: data.search.email_hint ?? "",
  });

  const signup = async () => {
    toast.set([]);
    loader.load("signup");

    try {
      const res = await AuthClient.signUp.email({
        ...form,
        name: "",
        callbackURL: App.url(ROUTES.HOME, { toast: TOAST.IDS.EMAIL_VERIFIED }),
      });

      if (res.data) {
        await goto(ROUTES.AUTH_VERIFY_EMAIL);
      } else {
        toast.warning(res.error.message ?? "Signup failed. Please try again.");
        console.warn(res.error);
      }
    } catch (error) {
      toast.error("Signup failed. Please try again.");
      console.error("Signup error:", error);
    }

    loader.reset();
  };
</script>

{#if data.search.team_token}
  <p class="my-3">
    You've been invited to join a team. Please signup to continue.
  </p>
{/if}

<form onsubmit={preventDefault(signup)} class="flex flex-col gap-3">
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
    <Loading loading={$loader["signup"]} />
    Signup
  </button>
</form>

<p class="my-3">
  <a class="link" href={ROUTES.AUTH_SIGNIN}>Sign in instead</a>
</p>
