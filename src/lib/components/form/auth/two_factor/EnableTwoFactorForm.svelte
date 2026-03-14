<script lang="ts">
  import Field from "$lib/components/ui/field/Field.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import type { ResultData } from "$lib/interfaces/result.type";
  import { enable_two_factor_remote } from "$lib/remote/auth/two_factor.remote";
  import { FormUtil } from "$lib/utils/form/form.util.svelte";
  import { toast } from "svelte-sonner";
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
  {...form.enhance(async (e) => {
    await e.submit();

    FormUtil.count_issue_metrics(form, "enable_two_factor_form");

    const res = form.result;
    if (res?.ok) {
      e.form.reset();

      on_success(res.data);
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  <Field
    label="Current Password"
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
    Enable Two-Factor Authentication
  </FormButton>

  <FormErrors {form} />
</form>
