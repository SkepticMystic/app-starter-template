import { captureException } from "@sentry/sveltekit";

const add_search = (
  url: URL,
  search: URLSearchParams | Record<string, unknown>,
) => {
  const resolved =
    search instanceof URLSearchParams ? Object.fromEntries(search) : search;

  for (const key in resolved) {
    if (resolved[key] === undefined) continue;

    url.searchParams.set(key, String(resolved[key]));
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
const safe = (url: string): URL | null => {
  try {
    return new URL(url);
  } catch {
    return null;
  }
};

export const Url = {
  build,
  strip_origin,
  add_search,
  safe,
};
