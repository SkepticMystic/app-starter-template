<script lang="ts">
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import type { ResultData } from "#lib/interfaces/result.type.js";
  import { enable_two_factor_remote } from "#lib/remote/auth/two_factor.remote.js";
  import { FormUtil } from "#lib/utils/form/form.util.svelte.js";
  import FormButton from "../../FormButton.svelte";
  import FormErrors from "../../FormErrors.svelte";

  let {
    on_success,
  }: {
    on_success: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = enable_two_factor_remote;

  FormUtil.init(form, () => ({
    password: "",
  }));
</script>

<form
  class="space-y-3"
  {...FormUtil.enhance(form, {
    metric: "enable_two_factor_form",
    on_success: (data) => on_success(data),
    reset: true,
  })}
>
  <Field
    label="Current password"
    field={form.fields.password}
  >
    {#snippet input({ props, field })}
      <Input
        {...props}
        {...field?.as("password")}
        required
        autocomplete="current-password"
      />
    {/snippet}
  </Field>

  <FormButton
    {form}
    class="w-full"
    icon="lucide/lock"
  >
    Enable two-factor authentication
  </FormButton>

  <FormErrors {form} />
</form>
