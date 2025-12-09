<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import Field from "$lib/components/ui/field/Field.svelte";
  import Fieldset from "$lib/components/ui/field/Fieldset.svelte";
  import Input from "$lib/components/ui/input/input.svelte";
  import type { ResultData } from "$lib/interfaces/result.type";
  import { enable_two_factor_remote } from "$lib/remote/auth/two_factor.remote";
  import { toast } from "svelte-sonner";

  let {
    on_success,
  }: {
    on_success: (data: ResultData<NonNullable<typeof form.result>>) => void;
  } = $props();

  const form = enable_two_factor_remote;
</script>

<form
  class="space-y-3"
  {...form.enhance(async (e) => {
    await e.submit();

    const res = form.result;
    if (res?.ok) {
      e.form.reset();

      on_success(res.data);
    } else if (res?.error) {
      toast.error(res.error.message);
    }
  })}
>
  <Fieldset
    legend="Enable Two-Factor Authentication"
    description="You will need to provide your password."
  >
    <Field
      label="Password"
      field={form.fields.password}
    >
      {#snippet input({ props, field })}
        <Input
          {...props}
          {...field?.as("password")}
          autocomplete="current-password"
        />
      {/snippet}
    </Field>

    <Button
      type="submit"
      class="w-full"
      icon="lucide/lock"
      loading={form.pending > 0}
    >
      Enable Two-Factor Authentication
    </Button>
  </Fieldset>
</form>
