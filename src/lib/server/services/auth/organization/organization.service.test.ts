import { Repo } from "#lib/server/db/repos/index.repo.js";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { auth_mock } from "../../../../../test/auth.mock.js";
import { makeSession, with_request } from "../../../../../test/helpers.js";
import { OrganizationService } from "./organization.service.js";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";

/** The members read, the org row deleted, and its API keys deleted. */
const read_members = vi.mocked(Repo.query);
const delete_org = vi.mocked(Repo.delete_one);
const delete_keys = vi.mocked(Repo.delete);

/**
 * What deleting an org owes the sessions and keys that pointed at it. `member`
 * cascades with the row and nothing else does, so these pin the cleanup that
 * stops a deleted tenant's members acting in it and its keys verifying.
 */
beforeEach(() => {
  read_members.mockResolvedValue({
    ok: true,
    data: [{ userId: "u-1" }, { userId: "u-2" }],
  });
  delete_org.mockResolvedValue({ ok: true, data: undefined });
  delete_keys.mockResolvedValue({ ok: true, data: { row_count: 3 } });

  // Each member has one session in the deleted org and one elsewhere.
  auth_mock.internalAdapter.listSessions.mockImplementation(
    async (user_id: string) => [
      { token: `${user_id}:in`, org_id: ORG },
      { token: `${user_id}:out`, org_id: OTHER_ORG },
    ],
  );
});

const deleted_tokens = () =>
  auth_mock.internalAdapter.deleteSessions.mock.calls.flatMap(
    ([tokens]) => tokens as string[],
  );

describe("OrganizationService.admin_delete", () => {
  beforeEach(() => {
    with_request(makeSession({ role: "admin", orgId: OTHER_ORG }));
  });

  it("signs every member out of the deleted org, and only that org", async () => {
    const res = await OrganizationService.admin_delete(ORG);

    expect(res.ok).toBe(true);
    expect(deleted_tokens().toSorted()).toEqual(["u-1:in", "u-2:in"]);
  });

  it("deletes the org's API keys, which no foreign key reaches", async () => {
    await OrganizationService.admin_delete(ORG);

    expect(delete_keys).toHaveBeenCalledOnce();
  });

  it("reads the members before the row, since they cascade with it", async () => {
    await OrganizationService.admin_delete(ORG);

    const read = read_members.mock.invocationCallOrder[0]!;
    const deleted = delete_org.mock.invocationCallOrder[0]!;

    expect(read).toBeLessThan(deleted);
  });

  it("revokes nothing when the delete fails", async () => {
    delete_org.mockResolvedValue({
      ok: false,
      error: { message: "Not found", status: 404 },
    });

    const res = await OrganizationService.admin_delete(ORG);

    expect(res.ok).toBe(false);
    expect(auth_mock.internalAdapter.deleteSessions).not.toHaveBeenCalled();
    expect(delete_keys).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not a platform admin", async () => {
    with_request(makeSession({ role: "user", orgId: ORG }));

    const res = await OrganizationService.admin_delete(ORG);

    expect(res.ok).toBe(false);
    expect(delete_org).not.toHaveBeenCalled();
  });
});

describe("OrganizationService.owner_delete", () => {
  beforeEach(() => {
    with_request(makeSession({ orgId: ORG }));
  });

  it("signs the other members out too, not just the caller", async () => {
    const res = await OrganizationService.owner_delete(ORG);

    expect(res.ok).toBe(true);
    expect(auth_mock.deleteOrganization).toHaveBeenCalledOnce();
    expect(deleted_tokens().toSorted()).toEqual(["u-1:in", "u-2:in"]);
    expect(delete_keys).toHaveBeenCalledOnce();
  });
});
