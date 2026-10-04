<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import type { User } from "#lib/server/db/models/auth.model.js";
  import { App } from "#lib/utils/app.js";
  import EmailGreeting from "../primitives/EmailGreeting.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  let { user }: { user: Pick<User, "email" | "name"> } = $props();
</script>

<EmailLayout
  reason="You're receiving this because your {APP.NAME} account was deleted."
>
  <h1
    style={S.h1}
    class="email-ink"
  >
    Your account has been deleted
  </h1>
  <EmailGreeting name={user.name} />
  <p style={S.p}>
    Your {APP.NAME} account, {user.email}, has been deleted. Thanks for using {APP.NAME}.
  </p>
  <p
    style={S.small}
    class="email-muted"
  >
    Didn't do this?
    <a
      href={App.full_url("/contact").href}
      style={S.link}>Contact us</a
    > right away.
  </p>
</EmailLayout>
