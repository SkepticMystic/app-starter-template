import { delete_apikey_remote } from "#lib/remote/auth/apikey.remote.js";
import { Client } from "../index.client.js";

export const APIKeyClient = {
  delete: Client.wrap(delete_apikey_remote, {
    confirm: "Delete this API key? Anything still using it will stop working.",
    destructive: true,
    action_label: "Delete API key",
    suc_msg: "API key deleted",
  }),
};
