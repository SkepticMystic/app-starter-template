import { delete_apikey_remote } from "$lib/remote/auth/apikey.remote";
import { Client } from "../index.client";

export const APIKeyClient = {
  delete: Client.wrap(delete_apikey_remote, {
    confirm: "Are you sure you want to delete this API key?",
    suc_msg: "API key deleted",
  }),
};
