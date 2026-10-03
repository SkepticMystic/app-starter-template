<script lang="ts">
  import { OrganizationClient } from "#lib/clients/auth/organization.client.js";
  import { Toast } from "#lib/utils/toast.util.js";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import { create_organization_remote } from "#lib/remote/auth/organization/organization.remote.js";
  import { App } from "#lib/utils/app.js";

  const form = create_organization_remote;
</script>

<article>
  <header class="text-center">
    <h1>Create your organization</h1>
    <p class="text-muted-foreground">
      Let's set up your workspace to get started
    </p>
  </header>

  <form
    class="space-y-6"
    {...form.enhance(async (e) => {
      await e.submit();

      const res = form.result;

      if (res?.ok) {
        Toast.success("Organization created");

        await OrganizationClient.set_active(res.data.id);
        // BetterAuthClient.$store.notify("$sessionSignal");

        window.location.href = App.url("/settings/organization");
      } else if (res?.ok === false) {
        Toast.err(res.error);
      }
    })}
  >
    <Field
      label="Organization name"
      field={form.fields.name}
    >
      {#snippet input({ props, field })}
        <Input
          {...props}
          {...field?.as("text")}
          required
          placeholder="Acme Inc."
          autocomplete="organization"
        />
      {/snippet}
    </Field>

    <FormButton
      {form}
      class="w-full"
    >
      Create organization
    </FormButton>

    <FormErrors {form} />
  </form>
</article>
