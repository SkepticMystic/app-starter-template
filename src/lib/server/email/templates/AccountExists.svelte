<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import type { User } from "#lib/server/db/models/auth.model.js";
  import { App } from "#lib/utils/app.js";
  import EmailButton from "../primitives/EmailButton.svelte";
  import EmailGreeting from "../primitives/EmailGreeting.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  /**
   * Answers a sign-up for an inbox that already has an account, which the form
   * itself answers as if it had worked. Names only the account's own address:
   * the one typed is the sender's to choose, `+tag` and all.
   */
  let { user }: { user: Pick<User, "email" | "name"> } = $props();
</script>

<EmailLayout>
  <h1
    style={S.h1}
    class="email-ink"
  >
    You already have an account
  </h1>
  <EmailGreeting name={user.name} />
  <p style={S.p}>
    Someone tried to create a new {APP.NAME} account with an address that reaches
    this inbox. You already have one, as {user.email}. Sign in with that address
    instead.
  </p>
  <EmailButton
    href={App.full_url("/auth/signin").href}
    label="Sign in"
  />
  <p
    style={S.small}
    class="email-muted"
  >
    Forgotten your password?
    <a
      href={App.full_url("/auth/forgot-password").href}
      style={S.link}>Reset it</a
    >
    for {user.email}. If you didn't try to sign up, ignore this email: no new
    account was created.
  </p>
</EmailLayout>
