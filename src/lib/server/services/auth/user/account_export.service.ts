import { db } from "#lib/server/db/drizzle.db.js";
import {
  AccountTable,
  InvitationTable,
  MemberTable,
  OrganizationTable,
  PasskeyTable,
  UserTable,
} from "#lib/server/db/models/auth.model.js";
import { ImageTable } from "#lib/server/db/models/image.model.js";
import {
  PaystackTransactionTable,
  SubscriptionTable,
} from "#lib/server/db/models/subscription.model.js";
import { TaskTable } from "#lib/server/db/models/task.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { result } from "#lib/utils/result.util.js";
import { operators as o } from "drizzle-orm";
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
        const [user] = await tx
          .select({
            id: UserTable.id,
            name: UserTable.name,
            email: UserTable.email,
            email_verified: UserTable.emailVerified,
            image: UserTable.image,
            two_factor_enabled: UserTable.twoFactorEnabled,
            created_at: UserTable.createdAt,
            updated_at: UserTable.updatedAt,
          })
          .from(UserTable)
          .where(o.eq(UserTable.id, user_id));

        const sign_in_methods = await tx
          .select({
            provider: AccountTable.providerId,
            account_id: AccountTable.accountId,
            created_at: AccountTable.createdAt,
          })
          .from(AccountTable)
          .where(o.eq(AccountTable.userId, user_id));

        const passkeys = await tx
          .select({
            name: PasskeyTable.name,
            device_type: PasskeyTable.deviceType,
            backed_up: PasskeyTable.backedUp,
            created_at: PasskeyTable.createdAt,
          })
          .from(PasskeyTable)
          .where(o.eq(PasskeyTable.userId, user_id));

        const memberships = await tx
          .select({
            member_id: MemberTable.id,
            org_id: OrganizationTable.id,
            org_name: OrganizationTable.name,
            role: MemberTable.role,
            joined_at: MemberTable.createdAt,
          })
          .from(MemberTable)
          .innerJoin(
            OrganizationTable,
            o.eq(OrganizationTable.id, MemberTable.organizationId),
          )
          .where(o.eq(MemberTable.userId, user_id));

        const member_ids = memberships.map((m) => m.member_id);

        const invitations_sent = await tx
          .select({
            email: InvitationTable.email,
            org_id: InvitationTable.organizationId,
            role: InvitationTable.role,
            status: InvitationTable.status,
            expires_at: InvitationTable.expiresAt,
          })
          .from(InvitationTable)
          .where(o.eq(InvitationTable.inviterId, user_id));

        const tasks = await tx
          .select({
            id: TaskTable.id,
            org_id: TaskTable.org_id,
            title: TaskTable.title,
            description: TaskTable.description,
            status: TaskTable.status,
            due_date: TaskTable.due_date,
            created_by_me: o.eq(TaskTable.user_id, user_id),
            created_at: TaskTable.createdAt,
            updated_at: TaskTable.updatedAt,
          })
          .from(TaskTable)
          .where(
            o.or(
              o.eq(TaskTable.user_id, user_id),
              member_ids.length
                ? o.inArray(TaskTable.assigned_member_id, member_ids)
                : undefined,
            ),
          );

        const images = await tx
          .select({
            url: ImageTable.url,
            org_id: ImageTable.org_id,
            resource_kind: ImageTable.resource_kind,
            resource_id: ImageTable.resource_id,
            created_at: ImageTable.createdAt,
          })
          .from(ImageTable)
          .where(o.eq(ImageTable.user_id, user_id));

        const subscriptions = await tx
          .select({
            plan: SubscriptionTable.plan,
            status: SubscriptionTable.status,
            reference_id: SubscriptionTable.referenceId,
            period_start: SubscriptionTable.periodStart,
            period_end: SubscriptionTable.periodEnd,
            created_at: SubscriptionTable.createdAt,
          })
          .from(SubscriptionTable)
          .where(o.eq(SubscriptionTable.userId, user_id));

        const payments = await tx
          .select({
            reference: PaystackTransactionTable.reference,
            amount: PaystackTransactionTable.amount,
            currency: PaystackTransactionTable.currency,
            status: PaystackTransactionTable.status,
            plan: PaystackTransactionTable.plan,
            product: PaystackTransactionTable.product,
            created_at: PaystackTransactionTable.createdAt,
          })
          .from(PaystackTransactionTable)
          .where(o.eq(PaystackTransactionTable.userId, user_id));

        return {
          user,
          sign_in_methods,
          passkeys,
          memberships: memberships.map(({ member_id: _, ...m }) => m),
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
