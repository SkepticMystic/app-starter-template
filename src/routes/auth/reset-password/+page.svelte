<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { TOAST } from "$lib/const/toast.const.js";
  import { reset_password_remote } from "$lib/remote/auth/user.remote";
  import { App } from "$lib/utils/app.js";
  import { toast } from "svelte-sonner";

  let { data } = $props();

  const form = reset_password_remote;
</script>

<article>
  <header>
    <h1>Reset Password</h1>
  </header>

  {#if data.search.token}
    <form
      class="space-y-3"
      {...form.enhance(async ({ submit }) => {
        await submit();

        const res = form.result;
        if (res?.ok) {
          toast.success("Password reset successfully");
          location.href = App.url("/auth/signin", {
            toast: TOAST.IDS.PASSWORD_RESET,
          });
        } else if (res?.error) {
          toast.error(res.error.message);
        }
      })}
    >
      <input {...form.fields.token.as("hidden", data.search.token)} />

      <Field
        label="New password"
        field={form.fields.new_password}
      >
        {#snippet input({ props, field })}
          <Input
            {...props}
            {...field?.as("password")}
            required
            autocomplete="new-password"
          />
        {/snippet}
      </Field>

      <Button
        type="submit"
        class="w-full"
        icon="lucide/key"
        loading={form.pending > 0}
      >
        Reset Password
      </Button>
    </form>
  {:else}
    <div class="alert alert-error">
      <span>Invalid or missing reset token ({data.search.error ?? ""})</span>
    </div>
  {/if}
</article>
