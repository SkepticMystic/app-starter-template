import type { ActionError, HTTPError } from "$lib/interfaces/errors";
import { Json } from "./json";

const errToString = (err: unknown) => {
  if (err instanceof Error) {
    return err.message;
  } else {
    return Json.str_or_stringify(err);
  }
};

export const get_http_error_msg = (err: unknown) =>
  (<HTTPError>err)?.response?.data?.message ?? errToString(err);
export const get_action_error_msg = (err: unknown) =>
  (<ActionError>err)?.response?.data?.error?.message ?? errToString(err);
