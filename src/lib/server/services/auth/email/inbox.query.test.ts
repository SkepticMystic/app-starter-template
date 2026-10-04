import { describe, expect, expectTypeOf, it } from "vite-plus/test";
import { recorder } from "../../../../../test/sql.mock.js";
import { InboxQuery } from "./inbox.query.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const EMAIL = "J.ohn+trial@googlemail.com";

// One application of `email_key_sql`, column or parameter.
const KEY = (subject: string) =>
  `regexp_replace(regexp_replace(regexp_replace(lower(${subject}), '\\+[^@]*@', '@'), '@googlemail\\.com$', '@gmail.com'), '\\.(?=[^@]*@gmail\\.com$)', '', 'g')`;

describe("InboxQuery.owner", () => {
  it("compares both sides by inbox key, so the index answers it", async () => {
    await InboxQuery.owner({ email: EMAIL }, { id: true });

    expect(recorder.calls).toHaveLength(1);

    const { sql, params } = recorder.calls[0] ?? { sql: "", params: [] };
    expect(sql).toMatch(/from "user"/);
    expect(sql).toContain(`${KEY('"d0"."email"')} = ${KEY("$1")}`);
    expect(sql).not.toMatch(/"id" <>/);
    expect(params).toEqual([EMAIL, 1]);
  });

  it("leaves out the account asking, when there is one", async () => {
    await InboxQuery.owner(
      { email: EMAIL, except_user_id: USER_ID },
      { id: true },
    );

    const { sql, params } = recorder.calls[0] ?? { sql: "", params: [] };
    expect(sql).toMatch(/"id" <> \$1/);
    expect(params).toEqual([USER_ID, EMAIL, 1]);
  });

  it("answers the projected row, typed to those columns", async () => {
    // Positional, as the driver answers a builder query.
    recorder.rows.push([["john@gmail.com", "John"]]);

    const res = await InboxQuery.owner(
      { email: EMAIL },
      { email: true, name: true },
    );

    expect(res).toEqual({
      ok: true,
      data: { email: "john@gmail.com", name: "John" },
    });
    expectTypeOf(res).toEqualTypeOf<
      App.Result<{ email: string; name: string } | undefined>
    >();
  });

  it("answers undefined when no account reaches that inbox", async () => {
    await expect(
      InboxQuery.owner({ email: EMAIL }, { id: true }),
    ).resolves.toEqual({ ok: true, data: undefined });
  });
});
