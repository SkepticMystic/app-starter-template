import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";

const get_url = (input: {
  seed: string;
  style?: string;
  format?: string;
  version?: string;
}): App.Result<string> => {
  try {
    const resolved = Object.assign(
      {
        format: "svg",
        version: "9.x",
        style: "lorelei",
      },
      input,
    );

    const url = new URL("https://api.dicebear.com");

    url.pathname = `${resolved.version}/${resolved.style}/${resolved.format}`;

    url.searchParams.set("seed", resolved.seed);

    console.log(url.toString());

    return result.suc(url.toString());
  } catch (error) {
    Log.error(error, "dicebear.get_url.error");
    captureException(error, { extra: { input } });
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

export const Dicebear = {
  get_url,
};
