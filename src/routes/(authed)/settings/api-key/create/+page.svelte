<script lang="ts">
  import { resolve } from "$app/paths";
  import Header from "#lib/components/ui/header/Header.svelte";
  import FormActions from "#lib/components/form/FormActions.svelte";
  import FormButton from "#lib/components/form/FormButton.svelte";
  import { Toast } from "#lib/utils/toast.util.js";
  import FormErrors from "#lib/components/form/FormErrors.svelte";
  import CopyButton from "#lib/components/ui/copy-button/copy-button.svelte";
  import FieldGroup from "#lib/components/ui/field/field-group.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Fieldset from "#lib/components/ui/field/Fieldset.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import Item from "#lib/components/ui/item/Item.svelte";
  import NativeSelect from "#lib/components/ui/native-select/native-select.svelte";
  import { create_apikey_remote } from "#lib/remote/auth/apikey.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import type { ApiKey } from "@better-auth/api-key";

  const form = create_apikey_remote;

  FormUtil.init(form, () => ({
    name: "",
    expiresIn: "",
  }));

  let apikey: ApiKey | undefined = $state(undefined);
</script>

<article>
  <Header
    title="Create an API key"
    back={{ href: resolve("/(authed)/settings/api-key"), label: "API keys" }}
  />

  <form
    {...form.enhance(async (e) => {
      await e.submit();

      FormUtil.count_issue_metrics(form, "create_apikey_form");

      const res = form.result;
      if (res?.ok) {
        e.element.reset();
        Toast.success({
          title: "API key created",
          description:
            "Copy it to your clipboard to use it in your applications.",
        });

        apikey = res.data;
      } else if (res?.error) {
        Toast.err(res.error);
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
          label="Expires in"
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

      <FormErrors {form} />

      <FormActions cancel_href={resolve("/(authed)/settings/api-key")}>
        <FormButton
          {form}
          disabled={Boolean(apikey)}
        >
          Create API key
        </FormButton>
      </FormActions>
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
