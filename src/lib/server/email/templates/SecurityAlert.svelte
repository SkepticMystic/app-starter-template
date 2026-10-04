<script lang="ts">
  import type { User } from "#lib/server/db/models/auth.model.js";
  import { App } from "#lib/utils/app.js";
  import EmailButton from "../primitives/EmailButton.svelte";
  import EmailDetails from "../primitives/EmailDetails.svelte";
  import EmailGreeting from "../primitives/EmailGreeting.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  /**
   * Tells the owner something changed on their account, with enough of where it came from to
   * recognise it — or not.
   */
  let {
    user,
    title,
    detail,
    when,
    device,
    location,
  }: {
    user: Pick<User, "name">;
    /** Usually the account's address; the old one, for an email change. */
    to: string;
    title: string;
    detail: string;
    when: string;
    device: string | null;
    location: string | null;
  } = $props();
</script>

<EmailLayout>
  <h1
    style={S.h1}
    class="email-ink"
  >
    {title}
  </h1>
  <EmailGreeting name={user.name} />
  <p style={S.p}>{detail}</p>
  <EmailDetails
    rows={[
      { label: "When", value: when },
      { label: "Device", value: device },
      { label: "Location", value: location },
    ]}
  />
  <p style={S.p}>
    If this was you, there's nothing to do. If it wasn't, reset your password
    now.
  </p>
  <EmailButton
    href={App.full_url("/auth/forgot-password").href}
    label="Reset password"
  />
  <p
    style={S.small}
    class="email-muted"
  >
    Then
    <a
      href={App.full_url("/settings/activity").href}
      style={S.link}>review your security activity</a
    >
    for anything else you don't recognise.
  </p>
</EmailLayout>
