import { captureException } from "@sentry/sveltekit";
import { Json } from "./json";

const add_search = (
  url: URL,
  search: URLSearchParams | Record<string, unknown>,
) => {
  const resolved =
    search instanceof URLSearchParams ? Object.fromEntries(search) : search;

  for (const key in resolved) {
    if (resolved[key] === undefined) continue;

    // `JSON.stringify` double-quotes every string value, so a search term
    // arrived as `?q=%22ross%22`. `str_or_stringify` passes strings through.
    url.searchParams.set(key, Json.str_or_stringify(resolved[key]));
  }

  return url;
};

const build = (
  base: string,
  path: string,
  search?: URLSearchParams | Record<string, unknown>,
) => {
  try {
    const url = new URL(base + path);

    if (search) {
      add_search(url, search);
    }

    return url;
  } catch (error) {
    captureException(error, {
      contexts: {
        url_build: { base, path },
      },
    });
    throw error;
  }
};

const strip_origin = (url: URL) => {
  return url.pathname + url.search + url.hash;
};

/**
 * Safely parse a URL, returning null on error instead of throwing
 *
 * @example
 * const url = Url.safe("https://example.com");
 * if (url) {
 *   console.log(url.hostname); // "example.com"
 * }
 */
const safe = (url: string | URL): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

/** What one key in a {@link set_params} patch may be set to. */
export type SearchParamValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | undefined;

/**
 * Patch a query string, returning the `?…` to hand to `goto`. Pure: navigation
 * stays at the call site.
 *
 * The four cases are deliberate and each has a control behind it. `undefined`
 * *keeps* a key, so a patch names only what it changes. `null` and `""` delete
 * it, which is what a cleared box and a select on "All" send. `false` is
 * written rather than dropped — an unticked checkbox is a real choice, and
 * treating it as absent is how a "Banned: No" filter silently becomes "Banned:
 * any". An array replaces the key with one param per element, so a multi-select
 * round-trips.
 */
const set_params = (
  base: string | URLSearchParams,
  patch: Record<string, SearchParamValue>,
) => {
  const params = new URLSearchParams(base);

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      params.delete(key);
      for (const item of value) params.append(key, item);
      continue;
    }

    if (value === null || value === "") {
      params.delete(key);
      continue;
    }

    params.set(key, String(value));
  }

  return `?${params}`;
};

export const Url = {
  build,
  strip_origin,
  add_search,
  safe,
  set_params,
};
