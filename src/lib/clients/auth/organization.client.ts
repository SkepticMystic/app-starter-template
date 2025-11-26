import { BetterAuthClient } from "$lib/auth-client";
import { Client } from "../index.client";

// TODO: Implement org.leave()
export const OrganizationClient = {
  set_active: (organizationId: string | undefined) =>
    Client.better_auth(
      () => BetterAuthClient.organization.setActive({ organizationId }),
      { toast: { success: "Active organization updated." } },
    ),

  delete: (organizationId: string) =>
    Client.better_auth(
      () => BetterAuthClient.organization.delete({ organizationId }),
      {
        confirm: "Are you sure you want to delete this organization?",
        toast: { success: "Organization deleted successfully." },
      },
    ),
};
