import { ERROR } from "#lib/const/error.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import {
  APIKeyTable,
  OrganizationTable,
} from "#lib/server/db/models/auth.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { PaystackClient } from "#lib/server/sdk/payment/paystack/paystack.payment.sdk.js";
import { EmailService } from "#lib/server/services/email.service.js";
import { RuntimeService } from "#lib/server/services/runtime/runtime.service.js";
import { run_chunked } from "#lib/utils/async/chunked.util.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { APIError } from "better-auth";
import { operators as o } from "drizzle-orm";

const log = Log.child({ service: "AccountDeletion" });

/**
 * What deleting a user owes everything that pointed at them. The database
 * cascades rows keyed by `user_id` — memberships, sessions, images, the
 * subscription row — but not what lives elsewhere or outlives a membership:
 *
 * - an org the user was the only member of would be left with no members, so
 *   it goes too, with its API keys (`referenceId` has no foreign key);
 * - its Paystack subscription would keep charging a card after the row that
 *   tracked it cascaded away, so it is cancelled at Paystack first;
 * - image files live at the host, not in the table.
 *
 * Runs from Better-Auth's `databaseHooks.user.delete`, so the self-service
 * confirmation link and an admin's `removeUser` both go through it.
 */

export type DeletionBlocker = {
  org_id: string;
  org_name: string;
  reason: "sole_owner" | "pays_for_org";
};

type Survey = {
  blockers: DeletionBlocker[];
  /** Orgs the user is the only member of; deleted with them. */
  solo_org_ids: string[];
  /** Live Paystack subscriptions of those orgs, cancelled before the delete. */
  subscription_codes: string[];
};

type Cleanup = { solo_org_ids: string[]; external_ids: string[] };

/**
 * `before` to `after`, per user, in this process. Both run inside the same
 * `deleteUser` call, so the entry never has to cross a request.
 */
const pending = new Map<string, Cleanup>();

const is_owner = (role: string) => role.split(",").includes("owner");

const LIVE_STATUSES = ["active", "trialing"] as const;

/** Read-only: what would stop the deletion, and what it would take with it. */
const survey = async (user_id: string): Promise<App.Result<Survey>> => {
  const rows = await Repo.query(
    db.query.member.findMany({
      columns: { organizationId: true, role: true },
      where: { userId: user_id },
      with: { organization: { columns: { name: true } } },
    }),
  );
  if (!rows.ok) return rows;

  const memberships = rows.data.map((m) => ({
    org_id: m.organizationId,
    org_name: m.organization.name,
    role: m.role,
  }));
  const org_ids = memberships.map((m) => m.org_id);

  const others = org_ids.length
    ? await Repo.query(
        db.query.member.findMany({
          columns: { organizationId: true, role: true },
          where: { organizationId: { in: org_ids }, userId: { ne: user_id } },
        }),
      )
    : result.suc([]);
  if (!others.ok) return others;

  const blockers: DeletionBlocker[] = [];
  const solo_org_ids: string[] = [];

  for (const membership of memberships) {
    const rest = others.data.filter(
      (m) => m.organizationId === membership.org_id,
    );

    if (!rest.length) {
      solo_org_ids.push(membership.org_id);
    } else if (
      is_owner(membership.role) &&
      !rest.some((m) => is_owner(m.role))
    ) {
      blockers.push({ ...membership, reason: "sole_owner" });
    }
  }

  const subscriptions = await Repo.query(
    db.query.paystackSubscription.findMany({
      columns: { referenceId: true, subscriptionCode: true },
      where: {
        status: { in: [...LIVE_STATUSES] },
        cancelAtPeriodEnd: false,
        // `in: []` compiles to `false`, so no solo orgs leaves just the user.
        OR: [{ userId: user_id }, { referenceId: { in: solo_org_ids } }],
      },
    }),
  );
  if (!subscriptions.ok) return subscriptions;

  const subscription_codes: string[] = [];

  for (const sub of subscriptions.data) {
    if (solo_org_ids.includes(sub.referenceId)) {
      if (sub.subscriptionCode) subscription_codes.push(sub.subscriptionCode);
    } else {
      // Their card pays for an org that outlives them; cancelling it here
      // would quietly downgrade everyone else in it.
      const org = memberships.find((m) => m.org_id === sub.referenceId);

      blockers.push({
        org_id: sub.referenceId,
        org_name: org?.org_name ?? "An organization",
        reason: "pays_for_org",
      });
    }
  }

  return result.suc({ blockers, solo_org_ids, subscription_codes });
};

/** What stops `user_id` from deleting their account, for the settings page to show first. */
const blockers = async (
  user_id: string,
): Promise<App.Result<DeletionBlocker[]>> => {
  const res = await survey(user_id);
  if (!res.ok) return res;

  return result.suc(res.data.blockers);
};

const describe = (blocker: DeletionBlocker) =>
  blocker.reason === "sole_owner"
    ? `you are the only owner of ${blocker.org_name}`
    : `you pay for ${blocker.org_name}'s subscription`;

/**
 * Paystack disables a subscription by code plus its `email_token`, which this
 * app does not store, so it is fetched first — what the plugin's own
 * `disableSubscription` does.
 */
const cancel_at_paystack = async (code: string): Promise<App.Result<null>> => {
  try {
    const subscription = (
      await PaystackClient.subscription.fetch(code)
    ).unwrap() as { email_token?: string | null } | undefined;

    const token = subscription?.email_token;
    if (!token) {
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Paystack returned no email token for the subscription",
      });
    }

    (
      await PaystackClient.subscription.disable({ body: { code, token } })
    ).unwrap();

    return result.suc(null);
  } catch (error) {
    log.error({ err: error, code }, "cancel_at_paystack.error");
    captureException(error, { extra: { code } });

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

/**
 * Refuses by throwing, which Better-Auth relays to whoever asked — the
 * confirmation link or the admin. Billing is cancelled here, before anything
 * is deleted: a deletion that cannot stop the charges does not happen.
 */
const before = async (user: { id: string }): Promise<void> => {
  const l = log.child({ method: "before", user_id: user.id });

  // A previous attempt whose delete then failed left its entry; a refusal
  // below must not let `after` act on that.
  pending.delete(user.id);

  const res = await survey(user.id);
  if (!res.ok) {
    throw new APIError("INTERNAL_SERVER_ERROR", {
      message: "Could not check what deleting this account affects.",
    });
  }

  const { blockers: refusals, solo_org_ids, subscription_codes } = res.data;

  if (refusals.length) {
    throw new APIError("BAD_REQUEST", {
      message: `This account can't be deleted yet: ${refusals.map(describe).join("; ")}. Transfer ownership, or delete the organization, first.`,
    });
  }

  for (const code of subscription_codes) {
    // oxlint-disable-next-line no-await-in-loop -- stop at the first refusal, before cancelling more
    const cancelled = await cancel_at_paystack(code);
    if (!cancelled.ok) {
      throw new APIError("INTERNAL_SERVER_ERROR", {
        message:
          "We couldn't cancel your subscription, so your account was not deleted. Try again in a moment.",
      });
    }
  }

  const images = await Repo.query(
    db.query.image.findMany({
      columns: { external_id: true },
      where: { OR: [{ user_id: user.id }, { org_id: { in: solo_org_ids } }] },
    }),
  );

  pending.set(user.id, {
    solo_org_ids,
    // A failed read costs orphaned files, not the deletion.
    external_ids: images.ok ? images.data.map((i) => i.external_id) : [],
  });

  l.info(
    {
      solo_orgs: solo_org_ids.length,
      cancelled: subscription_codes.length,
      images: images.ok ? images.data.length : null,
    },
    "before.ok",
  );
};

/** Bounds the file cleanup, which runs after the response. */
const CLEANUP_BUDGET_MS = 20_000;

/**
 * The user row is gone by now, so nothing here may refuse: every failure is
 * logged and filed instead.
 */
const after = async (user: { id: string; email: string; name: string }) => {
  const l = log.child({ method: "after", user_id: user.id });

  const cleanup = pending.get(user.id) ?? {
    solo_org_ids: [],
    external_ids: [],
  };
  pending.delete(user.id);

  const { solo_org_ids, external_ids } = cleanup;

  if (solo_org_ids.length) {
    // One transaction: keys that outlive their org would keep verifying.
    const orgs = await Repo.query(
      db.transaction(async (tx) => {
        await tx
          .delete(APIKeyTable)
          .where(o.inArray(APIKeyTable.referenceId, solo_org_ids));

        return tx
          .delete(OrganizationTable)
          .where(o.inArray(OrganizationTable.id, solo_org_ids));
      }),
    );

    if (!orgs.ok) {
      l.error({ solo_org_ids }, "after.orgs_not_deleted");
      captureException(new Error("Deleted user left solo organizations"), {
        extra: { user_id: user.id, solo_org_ids },
      });
    }
  }

  if (external_ids.length) {
    RuntimeService.defer(async () => {
      // Lazily: `auth.ts` imports this module, and the Cloudinary SDK is no
      // reason to slow every request's import graph for a rare path.
      const { ImageHostingService: ImageHosting } =
        await import("#lib/server/services/image/image_hosting.service.js");

      const outcomes = await run_chunked({
        items: external_ids,
        concurrency: 5,
        deadline: Date.now() + CLEANUP_BUDGET_MS,
        handler: async (id) => {
          const res = await ImageHosting.delete(id);
          if (!res.ok) throw new Error(res.error.message);
        },
      });

      const failed =
        external_ids.length -
        outcomes.filter((r) => r.outcome.status === "fulfilled").length;
      if (failed) {
        l.warn(
          { failed, total: external_ids.length },
          "after.images_left_at_host",
        );
      }
    });
  }

  RuntimeService.defer(async () => {
    const templates = (await import("#lib/const/email.const.js")).EMAIL
      .TEMPLATES;

    await EmailService.send(templates["user-deleted"]({ user }));
  });
};

export const AccountDeletionService = {
  blockers,
  before,
  after,
};
