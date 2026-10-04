<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import EmailCode from "../primitives/EmailCode.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  let {
    code,
    expires_in_minutes,
  }: { email: string; code: string; expires_in_minutes: number } = $props();
</script>

<EmailLayout
  reason="You're receiving this because someone tried to sign in to {APP.NAME} with this address."
>
  <h1
    style={S.h1}
    class="email-ink"
  >
    Your sign-in code
  </h1>
  <p style={S.p}>Enter this code to sign in to {APP.NAME}:</p>
  <EmailCode {code} />
  <p style={S.p}>
    It expires in {expires_in_minutes} minutes and works once. Never share it: {APP.NAME}
    will never ask you for it.
  </p>
  <p
    style={S.small}
    class="email-muted"
  >
    If you didn't try to sign in, you can ignore this email.
  </p>
</EmailLayout>
