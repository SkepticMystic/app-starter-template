<script lang="ts">
  import { OrganizationClient } from "#lib/clients/auth/organization.client.js";
  import { Toast } from "#lib/utils/toast.util.js";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import { create_organization_remote } from "#lib/remote/auth/organization/organization.remote.js";
  import { goto } from "$app/navigation";
  import { resolve } from "$app/paths";

  const form = create_organization_remote;

  // Set when the org was created but switching to it failed, so a retry
  // switches rather than creating a second org.
  let created_id = $state<string>();

  const enter = async (org_id: string) => {
    const res = await OrganizationClient.set_active(org_id);
    if (!res.ok) {
      created_id = org_id;
      Toast.err(res.error);
      return;
    }

    await goto(resolve("/(authed)/settings/organization"));
  };
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
      if (created_id) return enter(created_id);

      await e.submit();

      const res = form.result;

      if (res?.ok) {
        Toast.success("Organization created");

        await enter(res.data.id);
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
