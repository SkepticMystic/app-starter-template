import { describe, expect, it } from "vite-plus/test";
import { Authz } from "./authz.util.js";

const member = (role: string | null): Authz.Subject => ({
  user_role: "user",
  email_verified: true,
  org: { role },
});

/** The one evaluator behind the session guards and the client's UI gates. */
describe("Authz.deny", () => {
  it("passes an empty requirement for anyone verified", () => {
    expect(Authz.deny(member(null))).toBeNull();
  });

  it("refuses an unverified address unless the gate waives it", () => {
    const unverified = { ...member("owner"), email_verified: false };

    expect(Authz.deny(unverified)).toBe("email_unverified");
    expect(Authz.deny(unverified, { email_verified: false })).toBeNull();
  });

  it("asks the global role for the back office", () => {
    expect(Authz.deny(member("owner"), { admin: true })).toBe("not_admin");
    expect(
      Authz.deny({ ...member(null), user_role: "admin" }, { admin: true }),
    ).toBeNull();
  });

  it("checks global permissions against the global role", () => {
    expect(
      Authz.deny(
        { ...member(null), user_role: null },
        {
          permissions: { user: ["ban"] },
        },
      ),
    ).toBe("no_user_role");
    expect(Authz.deny(member(null), { permissions: { user: ["ban"] } })).toBe(
      "user_role",
    );
    expect(
      Authz.deny(
        { ...member(null), user_role: "admin" },
        { permissions: { user: ["ban"] } },
      ),
    ).toBeNull();
  });

  it("needs an org before it will ask about org permissions", () => {
    const orgless: Authz.Subject = { email_verified: true, org: null };

    expect(
      Authz.deny(orgless, { org_permissions: { organization: ["update"] } }),
    ).toBe("no_org");
  });

  it("refuses a subject that holds no role, rather than reading it as every grant", () => {
    expect(
      Authz.deny(member(null), {
        org_permissions: { organization: ["update"] },
      }),
    ).toBe("no_org_role");
  });

  it("checks the role's grant", () => {
    expect(
      Authz.deny(member("admin"), {
        org_permissions: { organization: ["delete"] },
      }),
    ).toBe("org_role");
    expect(
      Authz.deny(member("owner"), {
        org_permissions: { organization: ["delete"] },
      }),
    ).toBeNull();
  });
});

describe("Authz.can", () => {
  it("answers no without an org", () => {
    expect(Authz.can({ org: null }, { organization: ["update"] })).toBe(false);
  });

  it("refuses an unknown role id instead of throwing", () => {
    expect(Authz.can(member("superuser"), { organization: ["update"] })).toBe(
      false,
    );
  });

  it("grants if any of a comma-separated role's parts does", () => {
    expect(
      Authz.can(member("member,owner"), { organization: ["delete"] }),
    ).toBe(true);
  });

  it("matches Better-Auth's default org roles", () => {
    const deletes = (role: string) =>
      Authz.can(member(role), { organization: ["delete"] });
    const invites = (role: string) =>
      Authz.can(member(role), { invitation: ["create"] });

    expect([deletes("member"), deletes("admin"), deletes("owner")]).toEqual([
      false,
      false,
      true,
    ]);
    expect([invites("member"), invites("admin"), invites("owner")]).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("lets every member read org API keys, but only admins and owners manage them", () => {
    const reads = (role: string) =>
      Authz.can(member(role), { apiKey: ["read"] });
    const creates = (role: string) =>
      Authz.can(member(role), { apiKey: ["create", "delete"] });

    expect([reads("member"), reads("admin"), reads("owner")]).toEqual([
      true,
      true,
      true,
    ]);
    expect([creates("member"), creates("admin"), creates("owner")]).toEqual([
      false,
      true,
      true,
    ]);
  });
});
