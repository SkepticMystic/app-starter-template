import { command, form, query } from "$app/server";
import {
  get_session,
  safe_get_session,
} from "$lib/server/services/auth.service";
import { SubscriptionService } from "$lib/server/services/subscription/subscription.service";
import { result } from "$lib/utils/result.util";
import z from "zod";

export const get_active_subscription_remote = query(async () => {
  const session = await safe_get_session();
  if (!session) return undefined;

  const res = await SubscriptionService.get_active(session).then((r) =>
    result.unwrap_or(r, undefined),
  );

  return res;
});

export const upgrade_plan_remote = form(
  z.object({
    plan: z.string().trim().min(1, "Plan required"),
  }),
  async (input) => {
    const session = await get_session();

    const res = await SubscriptionService.upgrade(input, session);

    return res;
  },
);

export const disable_subscription_remote = command(
  z.object({
    subscription_id: z.uuid(),
  }),
  async (input) => {
    const session = await get_session();

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

export const enable_subscription_remote = command(
  z.object({
    subscription_id: z.uuid(),
  }),
  async (input) => {
    const session = await get_session();

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
