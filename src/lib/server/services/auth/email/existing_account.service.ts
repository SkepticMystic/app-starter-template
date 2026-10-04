import type { User } from "#lib/server/db/models/auth.model.js";
import { Mailer } from "#lib/server/email/email.mailer.js";
import { RateLimiter } from "#lib/server/services/rate_limit/rate_limit.service.js";
import { Log } from "#lib/utils/logger.util.js";
import { result } from "#lib/utils/result.util.js";

const log = Log.child({ service: "ExistingAccount" });

// Per account, not per address typed or IP: a `+tag` or another IP is free,
// so only this bounds what a stranger can make one inbox receive.
const notice_limiter = new RateLimiter("auth:signup:existing_account", {
  max_tokens: 2,
  refill_rate: 2,
  refill_interval: 86_400,
});

/**
 * Tells an account's owner that someone tried to sign up with their inbox.
 * The sign-up itself is answered as if it had worked, so this is how the
 * person who tried — if it was the owner — learns which address to sign in
 * with. Only to a verified address, so it never becomes a way to mail a
 * stranger.
 */
const notify = async (
  user: Pick<User, "id" | "email" | "name" | "emailVerified">,
): Promise<App.Result<{ sent: boolean }>> => {
  if (!user.emailVerified) return result.suc({ sent: false });

  const rate = await notice_limiter.enforce(user.id);
  if (!rate.ok) {
    log.info({ user_id: user.id }, "notify.limited");
    return result.suc({ sent: false });
  }

  const sent = await Mailer.send("account-exists", { user });
  if (!sent.ok) {
    log.warn({ user_id: user.id, error: sent.error }, "notify.send_failed");
    return sent;
  }

  return result.suc({ sent: true });
};

export const ExistingAccountService = { notify };
