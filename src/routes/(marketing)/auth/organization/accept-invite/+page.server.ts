import { auth } from "$lib/auth";
import { db } from "$lib/server/db/drizzle.db";
import { Repo } from "$lib/server/db/repos/index.repo";
import { InvitationService } from "$lib/server/services/auth/organization/invitation.service";
import { Strings } from "$lib/utils/strings.util";
import { error } from "@sveltejs/kit";
import { z } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ request, url }) => {
  const search = {
    invite_id: url.searchParams.get("invite_id"),
  };
  if (!search.invite_id) {
    error(400, "Missing invite ID");
  }

  /**
   * Validated BEFORE the query. `invitation.id` is a `uuid` column, so a
   * mangled link used to reach Postgres as a malformed literal, come back as
   * `22P02`, and surface to the reader as a 500 rather than "invalid invite".
   */
  if (!z.uuid().safeParse(search.invite_id).success) {
    return { search, prompt: "invalid_invite_id" as const };
  }

  const [session, invitation] = await Promise.all([
    auth.api.getSession({ headers: request.headers }),

    Repo.query(
      db.query.invitation.findFirst({
        where: { id: search.invite_id },

        columns: {
          id: true,
          email: true,
          status: true,
          expiresAt: true,
          inviterId: true,
          organizationId: true,
        },
      }),
    ),
  ]);

  /**
   * NOTE: `session` is deliberately never returned from this load. It carries
   * `session.token` — the bearer, which lives in an httpOnly cookie precisely
   * so it never reaches the page HTML — along with the whole user row. The
   * branches that need identity return an email and nothing else.
   */
  if (!session) {
    return {
      search,
      prompt: "signup_login" as const,
    };
  } else if (!invitation.ok) {
    return {
      search,
      prompt: "internal_server_error" as const,
    };
  } else if (!invitation.data) {
    return {
      search,
      prompt: "invalid_invite_id" as const,
    };
  } else if (
    /**
     * Lower-cased on BOTH sides, matching what Better-Auth's own
     * `acceptInvitation` compares. Comparing exactly turned an invitation the
     * server would happily accept into a dead end with no way out of it.
     */
    invitation.data.email.toLowerCase() !== session.user.email.toLowerCase()
  ) {
    return {
      search,
      inviter: null,
      invitation: null,
      organization: null,
      /**
       * Masked: this page is reachable by ANY signed-in user holding an invite
       * id, so showing the address in full turns a forwarded link into a way to
       * read who else was invited.
       */
      invited_email: Strings.mask_email(invitation.data.email),
      prompt: "wrong_account" as const,
    };
  } else if (!session.user.emailVerified) {
    /**
     * `requireEmailVerificationOnInvitation` is on, so without this branch the
     * accept button's only possible outcome was an error toast.
     */
    return {
      search,
      email: session.user.email,
      prompt: "email_not_verified" as const,
    };
  } else if (invitation.data.status !== "pending") {
    return {
      search,
      prompt: "invite_not_pending" as const,
    };
  } else if (invitation.data.expiresAt < new Date()) {
    return {
      search,
      prompt: "invite_expired" as const,
    };
  }

  const { inviterId, organizationId } = invitation.data;

  const [organization, inviter, member] = await Promise.all([
    Repo.query(
      db.query.organization.findFirst({
        columns: { name: true },

        where: { id: organizationId },
      }),
    ),

    Repo.query(
      db.query.user.findFirst({
        columns: { name: true, email: true },

        where: { id: inviterId },
      }),
    ),

    Repo.query(
      db.query.member.findFirst({
        columns: { id: true },

        where: {
          userId: session.user.id,
          organizationId: organizationId,
        },
      }),
    ),
  ]);

  if (!organization.ok || !organization.data) {
    error(400, "Invalid invitation: organization does not exist");
  } else if (!inviter.ok || !inviter.data) {
    error(400, "Invalid invitation: inviter does not exist");
  } else if (member.ok && member.data) {
    /**
     * A write from a `load`, which is justified here: this is the only request
     * that ever learns the invitation is moot, and nothing else will ever close
     * it. Idempotent and guarded on `status = 'pending'`, and its failure is
     * not surfaced — the page's job is to say "you are already a member", which
     * it can do either way.
     */
    await InvitationService.settle_for_existing_member(invitation.data.id);

    return {
      search,
      inviter: inviter.data,
      invitation: invitation.data,
      organization: organization.data,
      prompt: "already_member" as const,
    };
  } else {
    return {
      search,
      inviter: inviter.data,
      invitation: invitation.data,
      organization: organization.data,
      prompt: "accept_invite" as const,
    };
  }
};
