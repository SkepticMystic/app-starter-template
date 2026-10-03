import { disable_subscription_remote } from "#lib/remote/subscription/subscription.remote.js";
import { Client } from "../index.client";

export const SubscriptionClient = {
  disable: Client.wrap(disable_subscription_remote, {
    confirm:
      "Cancel your subscription? You keep access until the end of your billing cycle.",
    destructive: true,
    action_label: "Cancel subscription",
    suc_msg: "Subscription cancelled",
  }),
};
