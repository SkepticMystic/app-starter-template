import { command, getRequestEvent, query } from "$app/server";
import { auth } from "$lib/auth";
import { Log } from "$lib/utils/logger.util";
import { result } from "$lib/utils/result.util";
import { captureException } from "@sentry/sveltekit";
import { error } from "@sveltejs/kit";
import { APIError } from "better-auth";
import z from "zod";

export const get_all_members_remote = query(async () => {
  try {
    const members = await auth.api.listMembers({
      headers: getRequestEvent().request.headers,
    });

    return members.members;
  } catch (err) {
    if (err instanceof APIError) {
      Log.info(err, "get_all_members_remote.error better-auth");

      error(400, { message: err.message });
    } else {
      Log.error(err, "get_all_members_remote.error unknown");

      captureException(err);

      error(500, { message: "Internal server error" });
    }
  }
});

export const remove_member_remote = command(
  z.uuid(), // NOTE: member_email is allowed by BA, but we enforce member_id for the optimistic update on the client
  async (member_id) => {
    try {
      const res = await auth.api.removeMember({
        body: { memberIdOrEmail: member_id },
        headers: getRequestEvent().request.headers,
      });

      return res ? result.suc() : result.err({ message: "Failed to remove member" });
    } catch (error) {
      if (error instanceof APIError) {
        Log.info(error.body, "remove_member_remote.error better-auth");

        return result.err({ message: error.message });
      } else {
        Log.error(error, "remove_member_remote.error unknown");

        captureException(error);

        return result.err({ message: "Internal server error" });
      }
    }
  },
);
