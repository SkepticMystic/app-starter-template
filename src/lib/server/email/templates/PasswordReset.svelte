<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import type { User } from "#lib/server/db/models/auth.model.js";
  import EmailButton from "../primitives/EmailButton.svelte";
  import EmailGreeting from "../primitives/EmailGreeting.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import FallbackLink from "../primitives/FallbackLink.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  let { url, user }: { url: string; user: Pick<User, "email" | "name"> } =
    $props();
</script>

<EmailLayout>
  <h1
    style={S.h1}
    class="email-ink"
  >
    Reset your password
  </h1>
  <EmailGreeting name={user.name} />
  <p style={S.p}>
    Someone asked to reset the password for your {APP.NAME} account, {user.email}.
    Choose a new one here:
  </p>
  <EmailButton
    href={url}
    label="Reset password"
  />
  <FallbackLink {url} />
  <p
    style={S.small}
    class="email-muted"
  >
    The link expires in 1 hour and works once. If you didn't ask for this,
    ignore this email: your password stays as it is.
  </p>
</EmailLayout>
