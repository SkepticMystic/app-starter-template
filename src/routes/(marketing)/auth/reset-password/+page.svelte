<script lang="ts">
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";
  import CaptchaField from "#lib/components/form/auth/captcha/CaptchaField.svelte";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Alert from "#lib/components/ui/alert/Alert.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Card from "#lib/components/ui/card/Card.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Password from "#lib/components/ui/password/Password.svelte";
  import { reset_password_remote } from "#lib/remote/auth/user.remote.js";
  import { Toast } from "#lib/utils/toast.util.js";

  let { data } = $props();

  const form = reset_password_remote;

  let reset_captcha = $state<() => void>();
</script>

<article>
  <Card
    heading="h1"
    title="Reset password"
    description="Choose a new password for your account."
    class="mx-auto w-full max-w-xs"
  >
    {#snippet children()}
      {#if data.search.token}
        <form
          class="space-y-3"
          {...form.enhance(async ({ submit }) => {
            await submit();

            // A Turnstile token is single-use, whatever the outcome.
            reset_captcha?.();

            const res = form.result;
            if (res?.ok) {
              Toast.success("Password reset");
              await goto(resolve("auth/signin"));
            } else if (res?.error) {
              Toast.err(res.error);
            }
          })}
        >
          <input {...form.fields.token.as("hidden", data.search.token)} />

          <Field
            label="New password"
            field={form.fields.new_password}
          >
            {#snippet input({ props, field })}
              <Password
                {...props}
                {...field?.as("password")}
                required
                autocomplete="new-password"
              />
            {/snippet}
          </Field>

          <CaptchaField
            {form}
            bind:reset={reset_captcha}
          />

          <FormButton
            {form}
            class="w-full"
            icon="lucide/key"
          >
            Reset password
          </FormButton>

          <FormErrors {form} />
        </form>
      {:else}
        <div class="space-y-3">
          <Alert
            title="This reset link is invalid or has expired"
            variant="destructive"
            description={data.search.error
              ? `The link was rejected (${data.search.error}).`
              : "The link is missing its token."}
          />

          <Button
            class="w-full"
            icon="lucide/mail"
            href={resolve("auth/forgot-password")}
          >
            Request a new link
          </Button>
        </div>
      {/if}
    {/snippet}
  </Card>
</article>
