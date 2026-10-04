import { TIME } from "#lib/const/time.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import type { AuditEvent } from "#lib/server/db/models/audit.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { UserAgentUtil } from "#lib/utils/user_agent.util.js";
import { AdapterService } from "../adapter/adapter.service.js";
import { RuntimeService } from "../runtime/runtime.service.js";
import { AuditQuery } from "./audit.query.js";
import {
  AuditCapture,
  type AuditDraft,
  type EndpointCall,
} from "./audit_capture.js";
import { SecurityAlertService } from "./security_alert.service.js";

const log = Log.child({ service: "Audit" });

/** Where an event came from, read while its request is still the current one. */
type Origin = {
  ip: string | null;
  user_agent: string | null;
  device: string | null;
  country: string | null;
};

const NO_ORIGIN: Origin = {
  ip: null,
  user_agent: null,
  device: null,
  country: null,
};

/** A sign-in from a device unseen for this long is a new one. */
const DEVICE_MEMORY_MS = 90 * TIME.DAY;

/**
 * An account that gains a sign-in method this long after it was created
 * linked one, rather than being created with it.
 */
const LINK_GRACE_MS = TIME.MIN;

/**
 * The request's address, browser and country. Outside a request (a script, a
 * test) there is none, and an event is recorded without it rather than lost.
 */
const origin = (): Origin => {
  try {
    const user_agent = AdapterService.get_user_agent()?.slice(0, 512) ?? null;
    const device = UserAgentUtil.describe(user_agent);

    return {
      ip: AdapterService.get_ip(),
      user_agent,
      device: user_agent ? device : null,
      country: AdapterService.get_geo().country ?? null,
    };
  } catch {
    return NO_ORIGIN;
  }
};

/**
 * Whether `device` is new to this account: it has signed in before, and never
 * from this device within {@link DEVICE_MEMORY_MS}. A first sign-in is not
 * "new" — there is nothing to compare it to — and neither is a device too
 * vague to tell apart.
 */
const is_new_device = async (
  user_id: string,
  device: string | null,
): Promise<App.Result<boolean>> => {
  if (!device || device === UserAgentUtil.describe(null)) {
    return result.suc(false);
  }

  const [before, seen] = await Promise.all([
    AuditQuery.has_signed_in({ user_id }),
    AuditQuery.has_signed_in({
      user_id,
      device,
      since: new Date(Date.now() - DEVICE_MEMORY_MS),
    }),
  ]);
  if (!before.ok) return before;
  if (!seen.ok) return seen;

  return result.suc(before.data && !seen.data);
};

/**
 * Writes one event and sends its alert, if it has one. Answers the row, or
 * `null` for a draft that names no account after all — a failed sign-in for an
 * address nobody owns.
 */
const record = async (
  draft: AuditDraft,
  from: Origin = NO_ORIGIN,
): Promise<App.Result<AuditEvent | null>> => {
  let user_id = draft.user_id;

  if (!user_id && draft.email) {
    const owner = await Repo.query(
      db.query.user.findFirst({
        columns: { id: true },
        where: { email: draft.email.trim().toLowerCase() },
      }),
    );
    if (!owner.ok) return owner;
    if (!owner.data) return result.suc(null);

    user_id = owner.data.id;
  }

  const metadata = { ...draft.metadata };

  if (draft.type === "sign_in" && user_id) {
    const fresh = await is_new_device(user_id, from.device);
    // Unknown is not new: a failed lookup must not mail everyone.
    if (fresh.ok && fresh.data) metadata.new_device = true;
  }

  const inserted = await AuditQuery.insert({
    type: draft.type,
    user_id,
    // Acting on yourself is not "by" anyone else.
    actor_user_id:
      draft.actor_user_id && draft.actor_user_id !== user_id
        ? draft.actor_user_id
        : null,
    org_id: draft.org_id ?? null,
    metadata,
    ...from,
  });
  if (!inserted.ok) {
    log.warn({ type: draft.type }, "record.insert_failed");
    return inserted;
  }

  const alerted = await SecurityAlertService.notify(inserted.data);
  if (!alerted.ok) {
    log.warn({ type: draft.type }, "record.alert_failed");
  }

  return inserted;
};

/**
 * Records `drafts` after the response, with the current request's origin.
 * Never throws and never delays the auth call it describes: a lost row is
 * logged, not a failed sign-in.
 */
const record_later = (drafts: AuditDraft[]): void => {
  if (!drafts.length) return;

  const from = origin();

  RuntimeService.defer(async () => {
    await Promise.all(drafts.map((draft) => record(draft, from)));
  });
};

/** From the audit plugin's after-hook, for every Better-Auth endpoint call. */
const after_endpoint = (call: EndpointCall): void => {
  record_later(AuditCapture.capture(call));
};

/**
 * `account.create` fires for a sign-up's first account too, and only a later
 * one is a link. That includes an implicit link — a trusted provider's
 * sign-in attaching itself to an existing password account — which is the
 * one the owner most needs to hear about.
 */
const on_account_created = (account: {
  userId: string;
  providerId: string;
  createdAt: Date;
}): void => {
  const from = origin();

  RuntimeService.defer(async () => {
    const user = await Repo.query(
      db.query.user.findFirst({
        columns: { createdAt: true },
        where: { id: account.userId },
      }),
    );
    if (!user.ok || !user.data) return;

    const age = account.createdAt.getTime() - user.data.createdAt.getTime();
    if (age < LINK_GRACE_MS) return;

    await record(
      {
        type: "account_linked",
        user_id: account.userId,
        metadata: { provider: account.providerId },
      },
      from,
    );
  });
};

/**
 * `/reset-password` runs with no session and answers only `{ status }`, so
 * the path alone cannot say whose password it was: Better-Auth's
 * `onPasswordReset` can.
 */
const on_password_reset = (user: { id: string }): void => {
  record_later([{ type: "password_reset", user_id: user.id }]);
};

/** @see AuditCapture.account_deleted */
const on_account_deleted = (
  account: { userId: string; providerId: string },
  call: Pick<EndpointCall, "path" | "session">,
): void => {
  record_later(AuditCapture.account_deleted(account, call));
};

export const AuditService = {
  record,
  after_endpoint,
  on_account_created,
  on_account_deleted,
  on_password_reset,
};
