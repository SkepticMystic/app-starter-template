<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Card from "$lib/components/ui/card/Card.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { request_password_reset_remote } from "$lib/remote/auth/user.remote";
  import { toast } from "svelte-sonner";

  const form = request_password_reset_remote;
</script>

<article>
  <Card
    title="Forgot your password?"
    description="Enter your email to reset it"
    class="mx-auto w-full max-w-xs"
  >
    {#snippet content()}
      <form
        class="space-y-3"
        {...form.enhance(async ({ submit }) => {
          await submit();

          const res = request_password_reset_remote.result;
          if (res?.ok) {
            toast.success(res.data.message);
          } else if (res?.error.message) {
            toast.error(res.error.message);
          }
        })}
      >
        <Field
          label="Email"
          field={form.fields.email}
        >
          {#snippet input({ props, field })}
            <Input
              {...props}
              {...field?.as("email")}
              required
              autofocus
              autocomplete="email"
            />
          {/snippet}
        </Field>

        <Button
          type="submit"
          class="w-full"
          icon="lucide/mail"
          loading={form.pending > 0}
        >
          Request password reset
        </Button>
      </form>
    {/snippet}
  </Card>
</article>
