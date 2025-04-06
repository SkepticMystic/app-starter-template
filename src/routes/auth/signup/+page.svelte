<script lang="ts">
  import { set_href } from "$lib/auth/client";
  import Fieldset from "$lib/components/daisyui/Fieldset.svelte";
  import Label from "$lib/components/daisyui/Label.svelte";
  import Loading from "$lib/components/daisyui/Loading.svelte";
  import { get_action_error_msg } from "$lib/utils/errors";
  import { any_loading, Loader } from "$lib/utils/loader";
  import type { ActionResult } from "@sveltejs/kit";
  import axios from "axios";
  import { toast } from "svelte-daisyui-toast";
  import { preventDefault } from "svelte/legacy";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  const loader = Loader<"signup">();

  let form = $state({
    password: "",
    email: data.search.email_hint,
  });

  const signup = async () => {
    toast.set([]);
    loader.load("signup");

    try {
      const { data } = await axios.postForm<ActionResult>("", form);

      if (data.type === "redirect") {
        toast.success("Sign up successful");
        set_href(data.location);
      } else {
        toast.error("Something went wrong");
      }
    } catch (error) {
      console.log(error);
      toast.error(get_action_error_msg(error));
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
  <a class="link" href="/auth/signin">Sign in instead</a>
</p>
