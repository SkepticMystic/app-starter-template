import { db } from "#lib/server/db/drizzle.db.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { result } from "#lib/utils/result.util.js";
import { UserSessionService } from "./user_session.service.js";

/**
 * Everything this app holds about one user, as JSON they can take away
 * (GDPR art. 20). Columns are named, never `select *`, so a credential —
 * a password hash, an OAuth token, a passkey's public key, an API key's hash —
 * cannot ride along when someone adds one to a table.
 *
 * Read in one `repeatable read` transaction, so the parts agree with each
 * other: a task created mid-export is in every list or in none.
 */
const for_user = async (session: App.Session) => {
  const user_id = session.user.id;

  const snapshot = await Repo.query(
    db.transaction(
      async (tx) => {
        const user = await tx.query.user.findFirst({
          columns: {
            id: true,
            name: true,
            email: true,
            emailVerified: true,
            image: true,
            twoFactorEnabled: true,
            createdAt: true,
            updatedAt: true,
          },
          where: { id: user_id },
        });

        const sign_in_methods = await tx.query.account.findMany({
          columns: { providerId: true, accountId: true, createdAt: true },
          where: { userId: user_id },
        });

        const passkeys = await tx.query.passkey.findMany({
          columns: {
            name: true,
            deviceType: true,
            backedUp: true,
            createdAt: true,
          },
          where: { userId: user_id },
        });

        const memberships = await tx.query.member.findMany({
          columns: { id: true, role: true, createdAt: true },
          where: { userId: user_id },
          with: { organization: { columns: { id: true, name: true } } },
        });

        const invitations_sent = await tx.query.invitation.findMany({
          columns: {
            email: true,
            organizationId: true,
            role: true,
            status: true,
            expiresAt: true,
          },
          where: { inviterId: user_id },
        });

        const tasks = await tx.query.task.findMany({
          columns: {
            id: true,
            org_id: true,
            title: true,
            description: true,
            status: true,
            due_date: true,
            createdAt: true,
            updatedAt: true,
          },
          extras: {
            created_by_me: (t, { sql }) =>
              sql<boolean>`${t.user_id} = ${user_id}`,
          },
          where: {
            OR: [
              { user_id },
              // `in: []` compiles to `false`.
              { assigned_member_id: { in: memberships.map((m) => m.id) } },
            ],
          },
        });

        const images = await tx.query.image.findMany({
          columns: {
            url: true,
            org_id: true,
            resource_kind: true,
            resource_id: true,
            createdAt: true,
          },
          where: { user_id },
        });

        const subscriptions = await tx.query.paystackSubscription.findMany({
          columns: {
            plan: true,
            status: true,
            referenceId: true,
            periodStart: true,
            periodEnd: true,
            createdAt: true,
          },
          where: { userId: user_id },
        });

        const payments = await tx.query.paystackTransaction.findMany({
          columns: {
            reference: true,
            amount: true,
            currency: true,
            status: true,
            plan: true,
            product: true,
            createdAt: true,
          },
          where: { userId: user_id },
        });

        return {
          user,
          sign_in_methods,
          passkeys,
          memberships: memberships.map(({ id: _, ...m }) => m),
          invitations_sent,
          tasks,
          images,
          subscriptions,
          payments,
        };
      },
      { isolationLevel: "repeatable read", accessMode: "read only" },
    ),
  );
  if (!snapshot.ok) return snapshot;

  // Redis, not Postgres, so outside the snapshot.
  const sessions = await UserSessionService.list(session);

  return result.suc({
    exported_at: new Date(),
    ...snapshot.data,
    sessions: sessions.ok ? sessions.data.map(({ id: _, ...s }) => s) : null,
  });
};

export const AccountExportService = {
  for_user,
};
