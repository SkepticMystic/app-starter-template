import { APIKeyRepo } from "#lib/server/db/repos/apikey.repo.js";
import { OrganizationRepo } from "#lib/server/db/repos/organization.repo.js";
import { beforeEach, describe, expect, it } from "vite-plus/test";
import { auth_mock } from "../../../../../test/auth.mock.js";
import {
  makeSession,
  mocks,
  with_request,
} from "../../../../../test/helpers.js";
import { OrganizationService } from "./organization.service.js";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "22222222-2222-4222-8222-222222222222";

/**
 * What deleting an org owes the sessions and keys that pointed at it. `member`
 * cascades with the row and nothing else does, so these pin the cleanup that
 * stops a deleted tenant's members acting in it and its keys verifying.
 */
beforeEach(() => {
  mocks(OrganizationRepo).list_member_user_ids.mockResolvedValue({
    ok: true,
    data: ["u-1", "u-2"],
  });
  mocks(OrganizationRepo).delete_by_id.mockResolvedValue({
    ok: true,
    data: undefined,
  });
  mocks(APIKeyRepo).delete_by_reference.mockResolvedValue({
    ok: true,
    data: { row_count: 3 },
  });

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

    expect(mocks(APIKeyRepo).delete_by_reference).toHaveBeenCalledWith({
      org_id: ORG,
    });
  });

  it("reads the members before the row, since they cascade with it", async () => {
    await OrganizationService.admin_delete(ORG);

    const read =
      mocks(OrganizationRepo).list_member_user_ids.mock.invocationCallOrder[0]!;
    const deleted =
      mocks(OrganizationRepo).delete_by_id.mock.invocationCallOrder[0]!;

    expect(read).toBeLessThan(deleted);
  });

  it("revokes nothing when the delete fails", async () => {
    mocks(OrganizationRepo).delete_by_id.mockResolvedValue({
      ok: false,
      error: { message: "Not found", status: 404 },
    });

    const res = await OrganizationService.admin_delete(ORG);

    expect(res.ok).toBe(false);
    expect(auth_mock.internalAdapter.deleteSessions).not.toHaveBeenCalled();
    expect(mocks(APIKeyRepo).delete_by_reference).not.toHaveBeenCalled();
  });

  it("refuses a caller who is not a platform admin", async () => {
    with_request(makeSession({ role: "user", orgId: ORG }));

    const res = await OrganizationService.admin_delete(ORG);

    expect(res.ok).toBe(false);
    expect(mocks(OrganizationRepo).delete_by_id).not.toHaveBeenCalled();
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
    expect(mocks(APIKeyRepo).delete_by_reference).toHaveBeenCalledWith({
      org_id: ORG,
    });
  });
});
