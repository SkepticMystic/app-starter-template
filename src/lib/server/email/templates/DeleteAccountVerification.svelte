<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import type { User } from "#lib/server/db/models/auth.model.js";
  import { App } from "#lib/utils/app.js";
  import EmailButton from "../primitives/EmailButton.svelte";
  import EmailGreeting from "../primitives/EmailGreeting.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import EmailNote from "../primitives/EmailNote.svelte";
  import FallbackLink from "../primitives/FallbackLink.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  let { user, url }: { user: Pick<User, "email" | "name">; url: string } =
    $props();
</script>

<EmailLayout>
  <h1
    style={S.h1}
    class="email-ink"
  >
    Confirm account deletion
  </h1>
  <EmailGreeting name={user.name} />
  <p style={S.p}>
    Someone asked to permanently delete your {APP.NAME} account, {user.email}.
    This can't be undone.
  </p>
  <EmailButton
    href={url}
    label="Delete my account"
    variant="danger"
  />
  <FallbackLink {url} />
  <EmailNote>
    Didn't ask for this? Ignore this email and
    <a
      href={App.full_url("/auth/forgot-password").href}
      style="color:inherit;">reset your password</a
    >: someone may have access to your account.
  </EmailNote>
  <p
    style={S.small}
    class="email-muted"
  >
    The link expires in 24 hours.
  </p>
</EmailLayout>
