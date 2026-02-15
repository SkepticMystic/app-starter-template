import { disable_subscription_remote } from "$lib/remote/subscription/subscription.remote";
import { Client } from "../index.client";

export const SubscriptionClient = {
  disable: Client.wrap(disable_subscription_remote, {
    confirm:
      "Are you sure you want to cancel your subscription? You have still have access until the end of your billing cycle.",
    suc_msg: "Subscription cancelled",
  }),
};
