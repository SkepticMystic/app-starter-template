import type { ZxcvbnFactory } from "@zxcvbn-ts/core";

/**
 * zxcvbn, with the common and English dictionaries. Several megabytes, which
 * is why it lives under `server/`: SvelteKit refuses it in a client bundle, so
 * the password meter cannot quietly pull it back in. The meter estimates
 * instead (`#lib/utils/auth/password_strength.util.ts`); this is the verdict.
 *
 * Imported on first use, since the dictionaries cost ~185ms at module load and
 * only the forms that set a password ever ask.
 */

let zxcvbn: Promise<ZxcvbnFactory> | undefined;

const load = async () => {
  const [{ ZxcvbnFactory }, common, en] = await Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    import("@zxcvbn-ts/language-en"),
  ]);

  return new ZxcvbnFactory({
    graphs: common.adjacencyGraphs,
    dictionary: { ...common.dictionary, ...en.dictionary },
  });
};

/** zxcvbn's 0–4 score for `password`. */
export const password_score = async (password: string) => {
  // A failed load is forgotten, or it would be memoised for the process.
  zxcvbn ??= load().catch((error: unknown) => {
    zxcvbn = undefined;
    throw error;
  });

  return (await zxcvbn).check(password).score;
};
