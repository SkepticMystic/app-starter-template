<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import EmailDetails from "../primitives/EmailDetails.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import { EMAIL_COLOR as C, EMAIL_STYLE as S } from "../email.theme.js";

  let {
    name,
    email,
    message,
  }: { name: string; email: string; message: string } = $props();

  // Split rather than `white-space: pre-wrap`, which Outlook ignores; every line stays escaped.
  const lines = $derived(message.split(/\r?\n/));
</script>

<EmailLayout reason="Sent from the contact form on {APP.NAME}.">
  <h1
    style={S.h1}
    class="email-ink"
  >
    New contact form message
  </h1>
  <EmailDetails
    rows={[
      { label: "Name", value: name },
      { label: "Email", value: email },
    ]}
  />
  <p
    class="email-subtle"
    style="margin:0 0 16px;padding:16px;border-radius:8px;background-color:{C.subtle};"
  >
    {#each lines as line, i (i)}{#if i > 0}<br />{/if}{line}{/each}
  </p>
  <p
    style={S.small}
    class="email-muted"
  >
    Reply to this email to answer {name} directly.
  </p>
</EmailLayout>
