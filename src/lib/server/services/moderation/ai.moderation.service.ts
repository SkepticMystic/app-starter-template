import { OPENAI_API_KEY } from "$env/static/private";
import { ERROR } from "$lib/const/error.const";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException, metrics } from "@sentry/sveltekit";
import { transformUrl } from "unpic";
import { z } from "zod";

const log = Log.child({ service: "AIModeration" });

type MultiModalInput =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "image_url";
      image_url: { url: string };
    };

// type ModerationCategory =
//   | "sexual"
//   | "sexual/minors"
//   | "harassment"
//   | "harassment/threatening"
//   | "hate"
//   | "hate/threatening"
//   | "illicit"
//   | "illicit/violent"
//   | "self-harm"
//   | "self-harm/intent"
//   | "self-harm/instructions"
//   | "violence"
//   | "violence/graphic";

// type ModerationResponse = {
//   /** "modr-970d409ef3bef3b70c73d8232df86e7d"; */
//   id: string;
//   /** "omni-moderation-latest"; */
//   model: string;
//   results: [
//     {
//       flagged: boolean;
//       categories: Record<ModerationCategory, number>;
//       category_scores: Record<ModerationCategory, number>;
//       category_applied_input_types: Record<
//         ModerationCategory,
//         ("image" | "text")[]
//       >;
//     },
//   ];
// };

const response_schema = z.object({
  id: z.string(),
  model: z.string(),
  results: z.array(
    z.object({
      flagged: z.boolean(),
      categories: z.record(z.string(), z.number()),
      category_scores: z.record(z.string(), z.number()),
      category_applied_input_types: z.record(z.string(), z.array(z.enum(["image", "text"]))),
    }),
  ),
});

const moderate = async (input: {
  input: string | MultiModalInput[];
}): Promise<App.Result<{ flagged: boolean }[]>> => {
  try {
    const start_ms = Date.now();

    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: input.input,
        model: "omni-moderation-latest",
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      log.error(data, "moderate.error response");

      // {
      //   error: {
      //     message: 'Could not download file from URL provided: http://localhost:5173/settings/profile.',
      //     type: 'invalid_request_error',
      //     param: 'input',
      //     code: 'image_url_unavailable'
      //   }
      // }

      captureException(data.error);

      return result.err(ERROR.INVALID_INPUT);
    }

    const json = await response.json();
    const data = response_schema.parse(json);

    log.info(data.results, "data.results");

    metrics.distribution("AIModerationService.moderate.latency", Date.now() - start_ms, {
      unit: "milliseconds",
      attributes: {
        provider: "openai",
        model: data.model,

        input_count: typeof input.input === "string" ? 1 : input.input.length,
      },
    });

    return result.suc(data.results.map((r) => ({ flagged: r.flagged })));
  } catch (error) {
    log.error(error, "moderate.error unknown");

    captureException(error, { extra: { input } });

    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }
};

const moderate_one = async (input: MultiModalInput): Promise<App.Result<{ flagged: boolean }>> => {
  const res = await moderate({ input: [input] });

  if (!res.ok) return res;

  const r = res.data.at(0);
  if (r === undefined) {
    return result.err(ERROR.INTERNAL_SERVER_ERROR);
  }

  return result.suc(r);
};

const image = async (url: string): Promise<App.Result<{ flagged: boolean }>> => {
  const moderation_url = transformUrl({
    url,
    width: 250,
    height: 250,
    format: "auto",
    quality: "auto",
  });
  if (!moderation_url) {
    log.warn({ url }, "image moderation_url is null");
  }

  const res = await moderate_one({
    type: "image_url",
    image_url: { url: moderation_url ?? url },
  });

  return res;
};

export const AIModerationService = {
  moderate,
  moderate_one,
  image,
};
