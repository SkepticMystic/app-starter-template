import { describe, expect, it } from "vite-plus/test";
import { recorder } from "../../../../test/sql.mock";
import { OrganizationRepo } from "./organization.repo";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

describe("OrganizationRepo.get_membership", () => {
  it("reads one member of the org, by org and user", async () => {
    await OrganizationRepo.get_membership({ org_id: ORG_ID, user_id: USER_ID });

    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]?.sql).toMatch(/from "member"/);
    expect(recorder.calls[0]?.sql).toMatch(/"organization_id" = \$1/);
    expect(recorder.calls[0]?.sql).toMatch(/"user_id" = \$2/);
    expect(recorder.calls[0]?.sql).toMatch(/limit \$3/);
    expect(recorder.calls[0]?.params).toEqual([ORG_ID, USER_ID, 1]);
  });

  it("maps the row to the session's names", async () => {
    // Positional, as the driver answers a builder query.
    recorder.rows.push([["member-1", "admin"]]);

    await expect(
      OrganizationRepo.get_membership({ org_id: ORG_ID, user_id: USER_ID }),
    ).resolves.toEqual({
      ok: true,
      data: { member_id: "member-1", role: "admin" },
    });
  });

  it("answers undefined when there is no such member", async () => {
    await expect(
      OrganizationRepo.get_membership({ org_id: ORG_ID, user_id: USER_ID }),
    ).resolves.toEqual({ ok: true, data: undefined });
  });
});
