import { APP } from "$lib/const/app";
import type { IToast } from "$lib/const/toast.const";
import type { PartiallyTypedObject } from "$lib/interfaces";
import { Url } from "./urls";

const full_url = (path: string, search: Record<string, unknown>) =>
  Url.build(APP.URL, path, search);

export const App = {
  full_url,

  url: (path: string, search: PartiallyTypedObject<{ toast?: IToast.Id }>) =>
    Url.strip_origin(full_url(path, search)),
};
