import { CAPTCHA_SECRET_KEY } from "$env/static/private";
import { ERROR } from "$lib/const/error.const";
import { AdapterService } from "$lib/server/services/adapter/adapter.service";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { z } from "zod";

const log = Log.child({ service: "Captcha" });

/**
 * `cdata`, `action` and `metadata.interactive` are optional because Turnstile
 * does not always send them — required, a perfectly ordinary response fails
 * `.parse()` and the verify call reports an internal error instead of an
 * outcome. `metadata` is widened for the same reason.
 */
const turnstile_response_schema = z.object({
  success: z.boolean(),
  "error-codes": z.array(z.string()),

  cdata: z.string().optional(),
  action: z.string().optional(),
  hostname: z.string().optional(),
  challenge_ts: z.string().optional(),
  messages: z.array(z.string()).optional(),
  metadata: z
    .object({
      interactive: z.boolean().optional(),
      result_with_testing_key: z.boolean().optional(),
    })
    .optional(),
});

type TurnstileResponse = z.output<typeof turnstile_response_schema>;

const verify = async (
  token: string,
): Promise<App.Result<TurnstileResponse>> => {
  try {
    const remoteip = AdapterService.get_ip() ?? undefined;

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          remoteip,
          response: token,
          secret: CAPTCHA_SECRET_KEY,
        }),
        /**
         * This fetch carried no signal, so a stalled Turnstile held the request
         * open until the function itself timed out. Turnstile sits on the
         * critical path of signup and sign-in, so this is a latency bound
         * rather than a runaway guard.
         */
        signal: AbortSignal.timeout(5_000),
      },
    );

    const json = await response.json();
    const data = turnstile_response_schema.parse(json);

    if (data.success) {
      return result.suc(data);
    } else {
      log.warn(data, "Failed to verify captcha token");
      return result.err(ERROR.FORBIDDEN);
    }
  } catch (error) {
    log.error(error, "error unknown");

    captureException(error);

    return result.err(ERROR.FORBIDDEN);
  }
};

export const CaptchaService = {
  verify,
};
