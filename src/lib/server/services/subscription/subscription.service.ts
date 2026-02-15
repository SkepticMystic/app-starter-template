import { getRequestEvent } from "$app/server";
import { auth } from "$lib/auth";
import { ERROR } from "$lib/const/error.const";
import { db } from "$lib/server/db/drizzle.db";
import type { Subscription } from "$lib/server/db/models/subscription.model";
import { Repo } from "$lib/server/db/repos/index.repo";
import { SubscriptionRepo } from "$lib/server/db/repos/subscription.repo";
import { App } from "$lib/utils/app";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { waitUntil } from "@vercel/functions";
import { APIError } from "better-auth";

const get_by_id = async (
  subscription_id: string,
  session: { session: { org_id: string } },
) => {
  try {
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
    Log.error(error, "SubscriptionService.get_by_id.error unknown");
    captureException(error);
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const get_active = async (session: {
  session: { org_id: string };
}): Promise<App.Result<Subscription | undefined>> => {
  const log = Log.child({ ctx: "SubscriptionService.get_active" });

  try {
    const res = await Repo.query(
      db.query.subscription.findFirst({
        where: {
          status: "active",
          referenceId: session.session.org_id,
        },
      }),
    );

    if (!res.ok) {
      return res;
    } else if (
      res.data &&
      res.data.cancelAtPeriodEnd &&
      res.data.periodEnd &&
      res.data.periodEnd < new Date()
    ) {
      waitUntil(
        SubscriptionRepo.update_by_id(res.data.id, {
          status: "canceled",
          cancelAtPeriodEnd: false,
        }),
      );

      return result.suc(undefined);
    }

    return res;
  } catch (error) {
    log.error(error, "error unknown");
    captureException(error);
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const upgrade = async (
  input: Pick<Subscription, "plan">,
  session: App.Session,
) => {
  try {
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

        callbackURL: App.full_url("/upgrade/verify").toString(),
        metadata: {
          cancel_action: App.full_url("/upgrade", { cancel: true }).toString(),
        },
      },
    });

    Log.info(res, "upgrade.res");

    if (!res.url) {
      return result.err({
        ...ERROR.INTERNAL_SERVER_ERROR,
        message: "Failed to get upgrade url",
      });
    }

    return result.suc({ url: res.url });
  } catch (error) {
    if (error instanceof APIError) {
      Log.info(error.body, "SubscriptionService.upgrade.error better-auth");

      return result.err({ message: error.message, status: error.statusCode });
    } else {
      Log.error(error, "SubscriptionService.upgrade.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const disable = async (
  subscription_id: string,
  session: { session: { org_id: string } },
) => {
  const log = Log.child({ ctx: "SubscriptionService.disable" });

  try {
    const subscription = await get_by_id(subscription_id, session);
    if (!subscription.ok) return subscription;
    else if (subscription.data.cancelAtPeriodEnd) {
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Subscription is already canceled",
      });
    } else if (!subscription.data.paystackSubscriptionCode) {
      log.error(subscription.data, "error no paystackSubscriptionCode");
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Subscription has no code",
      });
    }

    const res = await auth.api.disableSubscription({
      headers: getRequestEvent().request.headers,
      body: {
        referenceId: session.session.org_id,
        subscriptionCode: subscription.data.paystackSubscriptionCode,
      },
    });

    log.info(res, "res");

    return result.suc(res.status);
  } catch (error) {
    if (error instanceof APIError) {
      log.info(error.body, "error better-auth");

      return result.err({
        message: error.message,
        status: error.statusCode,
      });
    } else {
      log.error(error, "error unknown");
      captureException(error);
      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

const enable = async (
  subscription_id: string,
  session: { session: { org_id: string } },
) => {
  try {
    const subscription = await get_by_id(subscription_id, session);
    if (!subscription.ok) return subscription;
    else if (!subscription.data.paystackSubscriptionCode) {
      Log.error(
        subscription.data,
        "SubscriptionService.enable.error no paystackSubscriptionCode",
      );
      return result.err({
        ...ERROR.INVALID_INPUT,
        message: "Subscription has no code",
      });
    }

    const res = await auth.api.enableSubscription({
      headers: getRequestEvent().request.headers,
      body: {
        referenceId: session.session.org_id,
        subscriptionCode: subscription.data.paystackSubscriptionCode,
      },
    });

    Log.info(res, "SubscriptionService.enable.res");

    return result.suc(res.status);
  } catch (error) {
    if (error instanceof APIError) {
      Log.info(error.body, "SubscriptionService.enable.error better-auth");

      return result.err({ message: error.message, status: error.statusCode });
    } else {
      Log.error(error, "SubscriptionService.enable.error unknown");

      captureException(error);

      return result.err(ERROR.INTERNAL_SERVER_ERROR);
    }
  }
};

export const SubscriptionService = {
  get_active,
  upgrade,
  disable,
  enable,
};
