import { describe, expect, expectTypeOf, it } from "vite-plus/test";
import { recorder } from "../../../../test/sql.mock.js";
import { MembershipQuery } from "./membership.query.js";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

const input = { org_id: ORG_ID, user_id: USER_ID };

describe("MembershipQuery.for_user", () => {
  it("reads one member of the org, by org and user", async () => {
    await MembershipQuery.for_user(input, { id: true, role: true });

    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]?.sql).toMatch(/from "member"/);
    expect(recorder.calls[0]?.sql).toMatch(/"organization_id" = \$1/);
    expect(recorder.calls[0]?.sql).toMatch(/"user_id" = \$2/);
    expect(recorder.calls[0]?.sql).toMatch(/limit \$3/);
    expect(recorder.calls[0]?.params).toEqual([ORG_ID, USER_ID, 1]);
  });

  it("selects only the columns the caller names", async () => {
    await MembershipQuery.for_user(input, { role: true });

    const sql = recorder.calls[0]?.sql ?? "";
    expect(sql).toMatch(/"role"/);
    expect(sql).not.toMatch(/"created_at"|"user_id" as|"id" as/);
  });

  it("answers the projected row, typed to those columns", async () => {
    // Positional, as the driver answers a builder query.
    recorder.rows.push([["member-1", "admin"]]);

    const res = await MembershipQuery.for_user(input, { id: true, role: true });

    expect(res).toEqual({ ok: true, data: { id: "member-1", role: "admin" } });
    expectTypeOf(res).toEqualTypeOf<
      App.Result<{ id: string; role: "admin" | "member" | "owner" } | undefined>
    >();
  });

  it("answers undefined when there is no such member", async () => {
    await expect(
      MembershipQuery.for_user(input, { id: true }),
    ).resolves.toEqual({ ok: true, data: undefined });
  });

  it("refuses an empty or unknown projection at compile time", () => {
    // Never called: `pnpm check` enforces the directives, not the run.
    const refused = () => [
      // @ts-expect-error `{}` would select every column
      MembershipQuery.for_user(input, {}),
      // @ts-expect-error not a column of `member`
      MembershipQuery.for_user(input, { nope: true }),
    ];

    expect(refused).toBeTypeOf("function");
  });
});
