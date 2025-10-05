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
  const url = new URL(base + path);

  if (search) {
    add_search(url, search);
  }

  return url;
};

const strip_origin = (url: URL) => {
  return url.pathname + url.search + url.hash;
};

export const Url = {
  build,
  strip_origin,
};
