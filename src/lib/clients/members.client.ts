import { BetterAuthClient } from "$lib/auth-client";
import { err, suc } from "$lib/utils/result.util";
import { Client } from "./index.client";

export const MembersClient = {
  remove_member: (member_id: string) =>
    Client.request(
      async () => {
        if (!confirm(`Are you sure you want to remove this member?`)) {
          return err();
        }

        const res = await BetterAuthClient.organization.removeMember({
          memberIdOrEmail: member_id,
        });

        if (res.data) {
          return suc(res.data);
        } else {
          console.warn("Failed to remove member:", res.error);
          return err(
            res.error?.message ?? "Failed to remove member. Please try again.",
          );
        }
      },
      { toast: { suc: "Member removed successfully." } },
    ),
};
