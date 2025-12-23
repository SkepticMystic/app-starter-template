import type { ResolvedPathname } from "$app/types";
import { APP } from "$lib/const/app.const";
import { Url } from "./urls";

const full_url = (
  path: ResolvedPathname,
  search?: URLSearchParams | Record<string, unknown>,
) => Url.build(APP.URL, path, search);

export const App = {
  full_url,

  url: (
    path: ResolvedPathname,
    search?:
      | URLSearchParams
      | { [key: string]: unknown; },
  ) => Url.strip_origin(full_url(path, search)) as ResolvedPathname,
};
