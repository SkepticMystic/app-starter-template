<script lang="ts">
  import { APP } from "#lib/const/app.const.js";
  import { ORGANIZATION } from "#lib/const/auth/organization.const.js";
  import type {
    Invitation,
    Organization,
    User,
  } from "#lib/server/db/models/auth.model.js";
  import { App } from "#lib/utils/app.js";
  import { Format } from "#lib/utils/format.util.js";
  import EmailButton from "../primitives/EmailButton.svelte";
  import EmailLayout from "../primitives/EmailLayout.svelte";
  import FallbackLink from "../primitives/FallbackLink.svelte";
  import { EMAIL_STYLE as S } from "../email.theme.js";

  let {
    organization,
    invitation,
    inviter,
  }: {
    organization: Pick<Organization, "name">;
    // Better-Auth hands the role over as a plain string.
    invitation: Pick<Invitation, "id" | "email" | "expiresAt"> & {
      role: string;
    };
    inviter: { user: Pick<User, "email" | "name"> };
  } = $props();

  const url = $derived(
    App.full_url("/auth/organization/accept-invite", {
      invite_id: invitation.id,
    }).href,
  );

  const roles: Record<string, { label: string } | undefined> =
    ORGANIZATION.ROLES.MAP;
  const role = $derived(
    roles[invitation.role]?.label.toLowerCase() ?? invitation.role,
  );
  const article = $derived(/^[aeiou]/i.test(role) ? "an" : "a");
  const from = $derived(inviter.user.name.trim() || inviter.user.email);
</script>

<EmailLayout
  reason="You're receiving this because {inviter.user
    .email} invited you to {APP.NAME}."
>
  <h1
    style={S.h1}
    class="email-ink"
  >
    Join {organization.name}
  </h1>
  <p style={S.p}>Hi,</p>
  <p style={S.p}>
    <strong>{from}</strong>{from === inviter.user.email
      ? ""
      : ` (${inviter.user.email})`} invited you to join
    <strong>{organization.name}</strong> on {APP.NAME} as {article}
    {role}.
  </p>
  <EmailButton
    href={url}
    label="Accept invitation"
  />
  <FallbackLink {url} />
  <!-- Relative, since the recipient's time zone is unknown here. -->
  <p
    style={S.small}
    class="email-muted"
  >
    The invitation expires {Format.relative(invitation.expiresAt)}. If you
    weren't expecting it, ignore this email.
  </p>
</EmailLayout>
