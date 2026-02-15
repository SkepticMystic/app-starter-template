<script lang="ts">
  import { goto } from "$app/navigation";
  import FormButton from "$lib/components/form/FormButton.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import { create_organization_remote } from "$lib/remote/auth/organization/organization.remote";
  import { App } from "$lib/utils/app";
  import { toast } from "svelte-sonner";

  const form = create_organization_remote;
</script>

<article>
  <div class="text-center">
    <h1>Create Your Organization</h1>
    <p class="text-muted-foreground">
      Let's set up your workspace to get started
    </p>
  </div>

  <form
    class="space-y-6"
    {...form.enhance(async (e) => {
      await e.submit();

      const res = form.result;
      if (res?.ok) {
        toast.success("Organization created successfully");
        await goto(App.url("/"));
      } else if (res?.ok === false) {
        toast.error(res.error.message);
      }
    })}
  >
    <Field
      label="Organization Name"
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
      Create Organization
    </FormButton>
  </form>
</article>
