<script lang="ts">
  import FormButton from "$lib/components/form/FormButton.svelte";
  import FormErrors from "$lib/components/form/FormErrors.svelte";
  import CopyButton from "$lib/components/ui/copy-button/copy-button.svelte";
  import FieldGroup from "$lib/components/ui/field/field-group.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Fieldset from "$lib/components/ui/field/Fieldset.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import Item from "$lib/components/ui/item/Item.svelte";
  import NativeSelect from "$lib/components/ui/native-select/native-select.svelte";
  import { create_apikey_remote } from "$lib/remote/auth/apikey.remote";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import type { ApiKey } from "@better-auth/api-key";
  import { toast } from "svelte-sonner";

  const form = create_apikey_remote;

  FormUtil.init(form, () => ({
    name: "",
    expiresIn: "",
  }));

  let apikey: ApiKey | undefined = $state(undefined);
</script>

<article>
  <header>
    <h1>Create an API Key</h1>
  </header>

  <form
    {...form.enhance(async (e) => {
      await e.submit();

      FormUtil.count_issue_metrics(form, "create_apikey_form");

      const res = form.result;
      console.log(res);
      if (res?.ok) {
        e.form.reset();
        toast.success("API key created", {
          description:
            "Copy it to your clipboard to use it in your applications.",
        });

        apikey = res.data;
      } else if (res?.error) {
        toast.error(res.error.message);
      }
    })}
  >
    <Fieldset>
      <FieldGroup>
        <Field
          label="Name"
          orientation="responsive"
          field={form.fields.name}
        >
          {#snippet input({ props, field })}
            <Input
              {...props}
              {...field?.as("text")}
              placeholder="API key name"
            />
          {/snippet}
        </Field>

        <Field
          label="Expires In"
          orientation="responsive"
          field={form.fields.expiresIn}
        >
          {#snippet input({ props, field })}
            <NativeSelect
              {...props}
              {...field?.as("text")}
              placeholder="Expires in"
              options={[
                { value: (60 * 60 * 24).toFixed(), label: "1 day" },
                { value: (60 * 60 * 24 * 7).toFixed(), label: "1 week" },
                { value: (60 * 60 * 24 * 30).toFixed(), label: "1 month" },
                { value: (60 * 60 * 24 * 365).toFixed(), label: "1 year" },
                { value: undefined, label: "Never" },
              ]}
            />
          {/snippet}
        </Field>
      </FieldGroup>

      <FormButton
        {form}
        disabled={Boolean(apikey)}
      >
        Create API Key
      </FormButton>

      <FormErrors {form} />
    </Fieldset>
  </form>

  {#if apikey}
    <section>
      <Item
        title="API Key Created"
        description="Copy it to your clipboard to use it in your applications."
      >
        {#snippet actions()}
          <CopyButton text={apikey?.key ?? ""}>Copy</CopyButton>
        {/snippet}

        <output class="font-mono text-sm wrap-anywhere">{apikey.key}</output>

        {#snippet footer()}
          <p class="font-bold">It won't be shown again!</p>
        {/snippet}
      </Item>
    </section>
  {/if}
</article>
