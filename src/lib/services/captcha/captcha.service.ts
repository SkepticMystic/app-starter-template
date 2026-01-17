import { CAPTCHA_SECRET_KEY } from "$env/static/private";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { AdapterService } from "../adapter/adapter.service";

type TurnstileResponse = {
  success: boolean;
  "error-codes"?: string[] | undefined;
  challenge_ts?: string | undefined;
  hostname?: string | undefined;
  action?: string | undefined;
  cdata?: string | undefined;
  metadata?: { interactive: boolean } | undefined;
  messages?: string[] | undefined;
};

const verify = async (
  token: string,
): Promise<App.Result<TurnstileResponse>> => {
  try {
    const remoteip = AdapterService.get_ip() ?? undefined;

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          remoteip,
          response: token,
          secret: CAPTCHA_SECRET_KEY,
        }),
      },
    );

    const data = (await response.json()) as TurnstileResponse;

    if (data.success) {
      return result.suc(data);
    } else {
      Log.warn(data, "Failed to verify captcha token");
      return result.err(ERROR.FORBIDDEN);
    }
  } catch (error) {
    Log.error(error, "Failed to verify captcha token");

    captureException(error);

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

export const CaptchaService = {
  verify,
};
