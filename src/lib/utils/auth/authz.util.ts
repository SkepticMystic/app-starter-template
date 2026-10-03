import {
  type AdminPermissions,
  check_role_permission,
} from "#lib/const/auth/access_control.const.js";
import {
  check_org_role_permission,
  type OrgPermissions,
} from "#lib/const/auth/organization_access_control.const.js";

/**
 * The one answer to "may they?", shared by the server's gates and the client's
 * UI. Each surface describes who is asking as a {@link Authz.Subject} and asks
 * here. Pure and synchronous, and free of Better-Auth's client, so server code
 * can import it.
 */
export namespace Authz {
  export type Subject = {
    /** The global `user.role` — `user | admin`. */
    user_role?: string | null;
    email_verified?: boolean;
    /** The active org, or `null`. `role` is null for a subject that holds no grant. */
    org: { role: string | null } | null;
  };

  /** What a gate asks for. An empty requirement is "signed in". */
  export type Requirement = {
    admin?: boolean;
    /** Defaults to required. */
    email_verified?: boolean;
    /** Global role permissions. */
    permissions?: AdminPermissions;
    /** Permissions in the active org. Needs an org. */
    org_permissions?: OrgPermissions;
  };

  export type Denial =
    | "email_unverified"
    | "not_admin"
    | "no_user_role"
    | "user_role"
    | "no_org"
    | "no_org_role"
    | "org_role";
}

/** Whether the subject's org role grants `permissions`. No org, or no role, is no grant. */
const can = (subject: Authz.Subject, permissions: OrgPermissions): boolean => {
  const role = subject.org?.role;

  return !!role && check_org_role_permission(role, permissions);
};

/**
 * The first reason `subject` fails `requirement`, or `null`. Ordered so the
 * reason named is the one a person would need to fix first.
 */
const deny = (
  subject: Authz.Subject,
  requirement: Authz.Requirement = {},
): Authz.Denial | null => {
  const { email_verified = true } = requirement;

  if (email_verified && subject.email_verified === false) {
    return "email_unverified";
  }

  if (requirement.admin && subject.user_role !== "admin") return "not_admin";

  if (requirement.permissions) {
    if (!subject.user_role) return "no_user_role";

    if (!check_role_permission(subject.user_role, requirement.permissions)) {
      return "user_role";
    }
  }

  if (requirement.org_permissions) {
    if (!subject.org) return "no_org";
    if (!subject.org.role) return "no_org_role";

    if (!can(subject, requirement.org_permissions)) return "org_role";
  }

  return null;
};

export const Authz = { can, deny };
