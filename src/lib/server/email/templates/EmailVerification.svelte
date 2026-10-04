<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import type { User } from "#lib/server/db/models/auth.model.js";
  import EmailButton from "../primitives/EmailButton.svelte";
  import EmailGreeting from "../primitives/EmailGreeting.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import FallbackLink from "../primitives/FallbackLink.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  // Also sent to a *new* address during an email change, where `user.email` is that address.
  let { url, user }: { url: string; user: Pick<User, "email" | "name"> } =
    $props();
</script>

<EmailLayout
  reason="You're receiving this because this address was used on {APP.NAME}."
>
  <h1
    style={S.h1}
    class="email-ink"
  >
    Verify your email
  </h1>
  <EmailGreeting name={user.name} />
  <p style={S.p}>
    Confirm that {user.email} is yours to finish setting up your {APP.NAME} account.
  </p>
  <EmailButton
    href={url}
    label="Verify email"
  />
  <FallbackLink {url} />
  <p
    style={S.small}
    class="email-muted"
  >
    The link expires in 1 hour. If you didn't sign up for {APP.NAME}, ignore
    this email.
  </p>
</EmailLayout>
