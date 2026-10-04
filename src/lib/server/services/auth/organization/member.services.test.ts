import { beforeEach, describe, expect, it } from "vite-plus/test";
import { auth_mock } from "../../../../../test/auth.mock.js";
import { with_request } from "../../../../../test/helpers.js";
import { MemberService } from "./member.services.js";

const ORG = "11111111-1111-4111-8111-111111111111";
const MEMBER = "22222222-2222-4222-8222-222222222222";

beforeEach(() => {
  with_request();
});

describe("MemberService.update_role", () => {
  it("acts in the org the guard resolved, and answers what the table patches", async () => {
    const res = await MemberService.update_role({
      org_id: ORG,
      member_id: MEMBER,
      role: "admin",
    });

    expect(res).toEqual({ ok: true, data: { id: MEMBER, role: "admin" } });
    expect(auth_mock.updateMemberRole).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { organizationId: ORG, memberId: MEMBER, role: "admin" },
      }),
    );
  });
});
