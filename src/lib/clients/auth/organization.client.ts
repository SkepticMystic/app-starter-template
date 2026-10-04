import { invalidate } from "$app/navigation";
import {
  accept_invitation_remote,
  cancel_invitation_remote,
  resend_invitation_remote,
} from "#lib/remote/auth/organization/invitation.remote.js";
import {
  remove_member_remote,
  update_member_role_remote,
} from "#lib/remote/auth/organization/member.remote.js";
import {
  admin_delete_organization_remote,
  leave_organization_remote,
  owner_delete_organization_remote,
  set_active_organization_remote,
} from "#lib/remote/auth/organization/organization.remote.js";
import { Client } from "../index.client.js";

const set_active_org = async (org_id: string) => {
  const res = await set_active_organization_remote(org_id);

  // The UI reads the new org and role through `page.data.org`.
  await invalidate("app:session");

  return res;
};

export const OrganizationClient = {
  set_active: set_active_org,

  /** Leaves the active org. */
  leave: Client.wrap(leave_organization_remote, {
    confirm:
      "Leave this organization? You'll lose access to it until someone invites you back.",
    destructive: true,
    action_label: "Leave organization",
    suc_msg: "Left organization",
  }),

  delete: Client.wrap(owner_delete_organization_remote, {
    confirm:
      "Delete this organization? Every member loses access, its API keys stop working and its data is deleted. This cannot be undone.",
    destructive: true,
    action_label: "Delete organization",
    suc_msg: "Organization deleted",
  }),

  admin_delete: Client.wrap(
    (org_id: string) => admin_delete_organization_remote(org_id),
    {
      confirm:
        "Delete this organization? Every member loses access, its API keys stop working and its data is deleted. This cannot be undone.",
      destructive: true,
      action_label: "Delete organization",
      suc_msg: "Organization deleted",
    },
  ),

  invitation: {
    // Better-Auth makes the org active server-side, and the page reloads after.
    accept: Client.wrap(accept_invitation_remote, {
      suc_msg: "Invitation accepted",
    }),

    resend: Client.wrap(resend_invitation_remote, {
      suc_msg: "Invitation resent",
    }),

    cancel: Client.wrap(cancel_invitation_remote, {
      confirm:
        "Cancel this invitation? Its link will stop working. You can invite them again later.",
      destructive: true,
      action_label: "Cancel invitation",
    }),
  },

  member: {
    update_role: Client.wrap(update_member_role_remote, {
      suc_msg: "Member role updated",
      confirm:
        "Change this member's role? It changes what they can see and do in this organization.",
      action_label: "Change role",
    }),

    remove: Client.wrap(remove_member_remote, {
      confirm:
        "Remove this member? They lose access to this organization until someone invites them back.",
      destructive: true,
      action_label: "Remove member",
      suc_msg: "Member removed",
    }),
  },
};
