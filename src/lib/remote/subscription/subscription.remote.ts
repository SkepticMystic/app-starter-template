import { query } from "$app/server";
import {
  guarded_command,
  guarded_form,
  USER,
} from "#lib/server/remote/guarded.js";
import { get_session } from "#lib/server/services/auth.service.js";
import { SubscriptionService } from "#lib/server/services/subscription/subscription.service.js";
import { result } from "#lib/utils/result.util.js";
import { z } from "zod";

export const get_active_subscription_remote = query(async () => {
  const session = await get_session();
  if (!session.ok) return undefined;
  else if (!session.data.session.org_id) {
    return undefined;
  }

  const res = await SubscriptionService.get_active(session.data).then((r) =>
    result.unwrap_or(r, undefined),
  );

  return res;
});

export const upgrade_plan_remote = guarded_form(
  USER,
  z.object({
    plan: z.string().trim().min(1, "Plan required"),
  }),
  async (input, { session }) => SubscriptionService.upgrade(input, session),
);

export const disable_subscription_remote = guarded_command(
  USER,
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
  USER,
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
