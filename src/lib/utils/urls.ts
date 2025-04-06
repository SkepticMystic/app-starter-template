const build = (
  base: string,
  path: string,
  search?: Record<string, unknown>,
) => {
  const url = new URL(base + path);

  if (search) {
    for (const key in search) {
      url.searchParams.set(key, String(search[key]));
    }
  }

  return url;
};

export const Url = {
  build,
  strip_origin: (url: URL) => url.pathname + url.search,
};
