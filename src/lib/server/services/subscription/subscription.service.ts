import { getRequestEvent } from "$app/server";
import { ServiceUtil } from "#lib/server/services/service.util.js";
import { checkout_url } from "#lib/server/sdk/payment/paystack/paystack.payment.sdk.js";
import { auth } from "#lib/auth.js";
import { ERROR } from "#lib/const/error.const.js";
import { db } from "#lib/server/db/drizzle.db.js";
import type { Subscription } from "#lib/server/db/models/subscription.model.js";
import { Repo } from "#lib/server/db/repos/index.repo.js";
import { SubscriptionRepo } from "#lib/server/db/repos/subscription.repo.js";
import { App } from "#lib/utils/app.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";
import { captureException } from "@sentry/sveltekit";
import { RuntimeService } from "../runtime/runtime.service";

const log = Log.child({ service: "SubscriptionService" });

const get_by_id = async (subscription_id: string, session: App.Session) => {
  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const res = await SubscriptionRepo.get_by_id(subscription_id);
    if (!res.ok) {
      return res;
    } else if (!res.data) {
      return result.err(ERROR.NOT_FOUND);
    } else if (res.data.referenceId !== session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    return result.suc(res.data);
  } catch (error) {
    return ServiceUtil.internal(error, { log, scope: "get_by_id" });
  }
};

const get_active = async (session: {
  session: Pick<App.Session["session"], "org_id">;
}): Promise<App.Result<Subscription | undefined>> => {
  const l = log.child({ method: "get_active" });

  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const res = await Repo.query(
      db.query.paystackSubscription.findFirst({
        where: {
          status: "active",
          referenceId: session.session.org_id,
        },
        orderBy: { createdAt: "desc" },
      }),
    );

    if (!res.ok) {
      return res;
    } else if (
      res.data?.cancelAtPeriodEnd &&
      res.data.periodEnd &&
      res.data.periodEnd < new Date()
    ) {
      const { id } = res.data;

      RuntimeService.defer(async () =>
        SubscriptionRepo.update_by_id(id, {
          status: "canceled",
          cancelAtPeriodEnd: false,
        }),
      );

      return result.suc(undefined);
    }

    return res;
  } catch (error) {
    l.error(error, "error unknown");
    captureException(error);
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const upgrade = async (
  input: Pick<Subscription, "plan">,
  session: App.Session,
) => {
  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const existing = await get_active(session);
    if (!existing.ok) return existing;
    else if (existing.data?.plan === input.plan) {
      return result.err({
        ...ERROR.DUPLICATE,
        path: ["plan"],
        message: "You already have an active subscription to this plan",
      });
    }

    const res = await auth.api.upgradeSubscription({
      headers: getRequestEvent().request.headers,
      body: {
        plan: input.plan,
        referenceId: session.session.org_id,

        // NOTE: There is no billing UI yet. Both of these pointed at
        // `/settings/subscription{,/verify}`, which have never existed, so
        // Paystack redirected the user to a 404 on both paths. Subscriptions
        // are org-scoped (`referenceId` is the org), so org settings is the
        // nearest real page — it does not render subscription state, so a
        // completed payment currently lands without confirmation.
        callbackURL: App.full_url("/settings/organization").toString(),
        metadata: {
          cancel_action: App.full_url("/settings/organization", {
            cancel: true,
          }).toString(),
        },
      },
    });

    if (!res) {
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to start the plan change",
      });
    }

    // `url` is null for "scheduled" and "prorated": Paystack applied the change
    // against the stored card, so there is nowhere to send the buyer.
    return result.suc({ kind: res.kind, url: checkout_url(res) });
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "upgrade" }),
    });
  }
};

const disable = async (subscription_id: string, session: App.Session) => {
  const l = log.child({ method: "disable" });

  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const subscription = await get_by_id(subscription_id, session);
    if (!subscription.ok) return subscription;
    else if (subscription.data.cancelAtPeriodEnd) {
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Subscription is already canceled",
      });
    } else if (!subscription.data.subscriptionCode) {
      l.error({ subscription_id }, "error no subscriptionCode");

      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Subscription has no code",
      });
    }

    const res = await auth.api.disableSubscription({
      headers: getRequestEvent().request.headers,
      body: {
        referenceId: session.session.org_id,
        subscriptionCode: subscription.data.subscriptionCode,
      },
    });

    return result.suc(res.status);
  } catch (error) {
    return ServiceUtil.ba_error(error, { log: l });
  }
};

const enable = async (subscription_id: string, session: App.Session) => {
  try {
    if (!session.session.org_id) {
      return result.err(ERROR.FORBIDDEN);
    }

    const subscription = await get_by_id(subscription_id, session);
    if (!subscription.ok) return subscription;
    else if (!subscription.data.subscriptionCode) {
      log.error({ subscription_id }, "enable.error no subscriptionCode");
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Subscription has no code",
      });
    }

    const res = await auth.api.enableSubscription({
      headers: getRequestEvent().request.headers,
      body: {
        referenceId: session.session.org_id,
        subscriptionCode: subscription.data.subscriptionCode,
      },
    });

    return result.suc(res.status);
  } catch (error) {
    return ServiceUtil.ba_error(error, {
      log: log.child({ method: "enable" }),
    });
  }
};

export const SubscriptionService = {
  get_active,
  upgrade,
  disable,
  enable,
};
