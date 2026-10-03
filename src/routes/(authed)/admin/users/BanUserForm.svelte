<script lang="ts">
  import { AdminClient } from "#lib/clients/auth/admin.client.js";
  import FormActions from "#lib/components/form/FormActions.svelte";
  import Button from "#lib/components/ui/button/button.svelte";
  import Field from "#lib/components/ui/field/Field.svelte";
  import Input from "#lib/components/ui/input/input.svelte";
  import NativeSelect from "#lib/components/ui/native-select/native-select.svelte";

  type Banned = Awaited<ReturnType<typeof AdminClient.ban_user>>;

  let {
    user_id,
    on_banned,
    on_cancel,
  }: {
    user_id: string;
    on_banned: (data: Extract<Banned, { ok: true }>["data"]) => unknown;
    on_cancel: () => void;
  } = $props();

  const DAY_SEC = 60 * 60 * 24;

  /** Seconds, as Better-Auth's `banExpiresIn` takes them. `""` is no expiry. */
  const DURATIONS = [
    { value: String(DAY_SEC), label: "1 day" },
    { value: String(DAY_SEC * 7), label: "1 week" },
    { value: String(DAY_SEC * 30), label: "30 days" },
    { value: "", label: "Until unbanned" },
  ];

  let reason = $state("");
  let duration = $state<string | undefined>(String(DAY_SEC * 7));
  let pending = $state(false);

  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    pending = true;

    // `confirm: null`: this dialog is the confirmation, and asking again on top of it is noise.
    const res = await AdminClient.ban_user(
      {
        userId: user_id,
        banReason: reason.trim() || undefined,
        banExpiresIn: duration ? Number(duration) : undefined,
      },
      { confirm: null, suc_msg: "User banned" },
    );

    pending = false;

    if (res.ok) on_banned(res.data);
  };
</script>

<form
  class="space-y-3"
  onsubmit={submit}
>
  <Field label="Reason">
    {#snippet input({ props })}
      <Input
        {...props}
        bind:value={reason}
        placeholder="Optional, kept on the user's record"
      />
    {/snippet}
  </Field>

  <Field label="Duration">
    {#snippet input({ props })}
      <NativeSelect
        {...props}
        bind:value={duration}
        options={DURATIONS}
      />
    {/snippet}
  </Field>

  <FormActions>
    <Button
      variant="ghost"
      onclick={on_cancel}
    >
      Cancel
    </Button>

    <Button
      type="submit"
      variant="destructive"
      loading={pending}
    >
      Ban user
    </Button>
  </FormActions>
</form>
