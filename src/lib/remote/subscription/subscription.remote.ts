import {
  guarded_command,
  guarded_form,
  guarded_query,
  ORG,
} from "#lib/server/remote/guarded.js";
import { SubscriptionService } from "#lib/server/services/subscription/subscription.service.js";
import { z } from "zod";

export const get_active_subscription_remote = guarded_query(
  ORG,
  async ({ session }) => SubscriptionService.get_active(session),
);

export const upgrade_plan_remote = guarded_form(
  ORG,
  z.object({
    // Plan names are stored lowercased (`subscription.model.ts`).
    plan: z.string().trim().toLowerCase().min(1, "Plan required").max(64),
  }),
  async (input, { session }) => SubscriptionService.upgrade(input, session),
);

export const disable_subscription_remote = guarded_command(
  ORG,
  z.object({
    subscription_id: z.uuid(),
  }),
  async (input, { session }) => {
    const res = await SubscriptionService.disable(
      input.subscription_id,
      session,
    );

    if (res.ok) {
      await get_active_subscription_remote().refresh();
    }

    return res;
  },
);

export const enable_subscription_remote = guarded_command(
  ORG,
  z.object({
    subscription_id: z.uuid(),
  }),
  async (input, { session }) => {
    const res = await SubscriptionService.enable(
      input.subscription_id,
      session,
    );

    if (res.ok) {
      await get_active_subscription_remote().refresh();
    }

    return res;
  },
);
