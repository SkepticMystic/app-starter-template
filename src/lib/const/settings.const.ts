import type { ResolvedPathname } from "$app/types";
import type { OrgPermissions } from "#lib/const/auth/organization_access_control.const.js";

type SettingsNavItem = {
  label: string;
  href: ResolvedPathname;
  icon: string;
  /** Cosmetic — each page guards itself with the same grant. */
  permissions?: OrgPermissions;
  /** The page redirects a session with no active org to `/onboarding`. */
  org?: true;
};

/**
 * Settings is you and your organization: who you are, how you sign in, who is in the org, how
 * other systems reach it. What the app itself does belongs in the sidebar's feature groups.
 *
 * Listed by the settings layout and the sidebar's account menu alike, so the two cannot drift.
 */
const NAV: readonly SettingsNavItem[] = [
  { label: "Profile", href: "/settings/profile", icon: "lucide/user" },
  { label: "Account", href: "/settings/account", icon: "lucide/badge-check" },
  {
    label: "Security activity",
    href: "/settings/activity",
    icon: "lucide/shield",
  },
  {
    label: "Organization",
    href: "/settings/organization",
    icon: "lucide/building-2",
    org: true,
  },
  {
    label: "Organization activity",
    href: "/settings/organization/activity",
    icon: "lucide/history",
    org: true,
    permissions: { audit: ["read"] },
  },
  {
    label: "API keys",
    href: "/settings/api-key",
    icon: "lucide/key",
    org: true,
    permissions: { apiKey: ["read"] },
  },
];

export const SETTINGS = { NAV };
