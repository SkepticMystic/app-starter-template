<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import type { User } from "#lib/server/db/models/auth.model.js";
  import { App } from "#lib/utils/app.js";
  import EmailButton from "../primitives/EmailButton.svelte";
  import EmailDetails from "../primitives/EmailDetails.svelte";
  import EmailGreeting from "../primitives/EmailGreeting.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import EmailNote from "../primitives/EmailNote.svelte";
  import FallbackLink from "../primitives/FallbackLink.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  let {
    user,
    new_email,
    url,
  }: { user: Pick<User, "email" | "name">; new_email: string; url: string } =
    $props();
</script>

<EmailLayout>
  <h1
    style={S.h1}
    class="email-ink"
  >
    Approve your new email address
  </h1>
  <EmailGreeting name={user.name} />
  <p style={S.p}>
    Someone asked to change the email address on your {APP.NAME} account:
  </p>
  <EmailDetails
    rows={[
      { label: "From", value: user.email },
      { label: "To", value: new_email },
    ]}
  />
  <p style={S.p}>
    Approve it, and we'll send a link to the new address to confirm it.
  </p>
  <EmailButton
    href={url}
    label="Approve change"
  />
  <FallbackLink {url} />
  <EmailNote>
    Didn't ask for this? Don't approve it, and
    <a
      href={App.full_url("/auth/forgot-password").href}
      style="color:inherit;">reset your password</a
    >: someone may have access to your account.
  </EmailNote>
  <p
    style={S.small}
    class="email-muted"
  >
    The link expires in 1 hour.
  </p>
</EmailLayout>
