import { describe, expect, it } from "vite-plus/test";
import { recorder } from "../../../../test/sql.mock.js";
import { AuditQuery } from "./audit.query.js";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const ORG_ID = "22222222-2222-4222-8222-222222222222";

describe("AuditQuery.insert", () => {
  it("appends one row and returns it", async () => {
    await AuditQuery.insert({
      type: "sign_in",
      user_id: USER_ID,
      metadata: { method: "passkey" },
    });

    const sql = recorder.calls[0]?.sql ?? "";
    expect(sql).toMatch(/^insert into "audit_event"/);
    expect(sql).toMatch(/returning/);
    // Unset columns take their defaults; node-postgres serialises the jsonb.
    expect(recorder.calls[0]?.params).toEqual([
      "sign_in",
      USER_ID,
      { method: "passkey" },
    ]);
  });
});

describe("AuditQuery.has_signed_in", () => {
  it("asks for any earlier sign-in, one row at most", async () => {
    await AuditQuery.has_signed_in({ user_id: USER_ID });

    const sql = recorder.calls[0]?.sql ?? "";
    expect(sql).toMatch(/from "audit_event"/);
    expect(sql).toMatch(/"user_id" = \$1/);
    expect(sql).toMatch(/"type" = \$2/);
    expect(sql).not.toMatch(/"device"|"created_at" >=/);
    expect(recorder.calls[0]?.params).toEqual([USER_ID, "sign_in", 1]);
  });

  it("narrows to one device since a moment, when asked", async () => {
    const since = new Date("2026-07-01T00:00:00Z");

    await AuditQuery.has_signed_in({
      user_id: USER_ID,
      device: "Chrome on macOS",
      since,
    });

    const sql = recorder.calls[0]?.sql ?? "";
    expect(sql).toMatch(/"device" = \$3/);
    expect(sql).toMatch(/"created_at" >= \$4/);
    expect(recorder.calls[0]?.params).toEqual([
      USER_ID,
      "sign_in",
      "Chrome on macOS",
      since.toISOString(),
      1,
    ]);
  });

  it("answers whether a row came back", async () => {
    recorder.rows.push([["event-1"]]);

    await expect(
      AuditQuery.has_signed_in({ user_id: USER_ID }),
    ).resolves.toEqual({ ok: true, data: true });
    await expect(
      AuditQuery.has_signed_in({ user_id: USER_ID }),
    ).resolves.toEqual({ ok: true, data: false });
  });
});

describe("AuditQuery.page", () => {
  it("reads the page newest first, and counts with the same filter", async () => {
    recorder.rows.push([["event-1", "sign_in"]], [[1]]);

    const res = await AuditQuery.page(
      { where: { org_id: ORG_ID }, offset: 25, limit: 25 },
      { id: true, type: true },
    );

    expect(res).toEqual({
      ok: true,
      data: { rows: [{ id: "event-1", type: "sign_in" }], total: 1 },
    });

    const [page, count] = recorder.calls;
    expect(page?.sql).toMatch(/"org_id" = \$1/);
    expect(page?.sql).toMatch(/order by .*"created_at" desc, .*"id" desc/);
    expect(page?.params).toEqual([ORG_ID, 25, 25]);
    expect(count?.sql).toMatch(/count\(\*\)/);
    expect(count?.sql).toMatch(/"org_id" = \$1/);
  });

  it("selects only the columns the view names", async () => {
    await AuditQuery.page(
      { where: { user_id: USER_ID }, offset: 0, limit: 10 },
      { type: true, createdAt: true },
    );

    expect(recorder.calls[0]?.sql).not.toMatch(/"actor_user_id"|"ip"/);
  });
});

describe("AuditQuery.people", () => {
  it("looks each person up once", async () => {
    await AuditQuery.people([USER_ID, null, USER_ID]);

    expect(recorder.calls).toHaveLength(1);
    expect(recorder.calls[0]?.sql).toMatch(/from "user"/);
    expect(recorder.calls[0]?.params).toEqual([USER_ID]);
  });

  it("asks nothing for a page that names nobody", async () => {
    const res = await AuditQuery.people([null]);

    expect(res.ok && res.data.size).toBe(0);
    expect(recorder.calls).toHaveLength(0);
  });
});
