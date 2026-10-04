import { Repo } from "#lib/server/db/repos/index.repo.js";
import { PaystackClient } from "#lib/server/sdk/payment/paystack/paystack.payment.sdk.js";
import { EmailService } from "#lib/server/services/email.service.js";
import { RuntimeService } from "#lib/server/services/runtime/runtime.service.js";
import { result } from "#lib/utils/result.util.js";
import { APIError } from "better-auth";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vite-plus/test";
import { AccountDeletionService } from "./account_deletion.service.js";

const USER = { id: "u1", email: "u1@example.com", name: "Ada" };

const SOLO = "org-solo";
const SHARED = "org-shared";

/**
 * Queues `survey`'s three reads in order — memberships, the other members of
 * those orgs, live subscriptions — then `before`'s image read.
 */
const queue = (input: {
  memberships: { org_id: string; org_name: string; role: string }[];
  others?: { org_id: string; role: string }[];
  subscriptions?: { reference_id: string; code: string | null }[];
  images?: { external_id: string }[];
}) => {
  const query = vi.mocked(Repo.query);

  // Rows as drizzle answers them, from the flatter shapes the cases read.
  query.mockResolvedValueOnce(
    result.suc(
      input.memberships.map((m) => ({
        organizationId: m.org_id,
        role: m.role,
        organization: { name: m.org_name },
      })),
    ),
  );
  if (input.memberships.length) {
    query.mockResolvedValueOnce(
      result.suc(
        (input.others ?? []).map((m) => ({
          organizationId: m.org_id,
          role: m.role,
        })),
      ),
    );
  }
  query.mockResolvedValueOnce(
    result.suc(
      (input.subscriptions ?? []).map((s) => ({
        referenceId: s.reference_id,
        subscriptionCode: s.code,
      })),
    ),
  );
  query.mockResolvedValueOnce(result.suc(input.images ?? []));
};

/** Paystack's fetch-then-disable, as spies on the one shared client. */
const paystack = () => {
  const fetch = vi
    .spyOn(PaystackClient.subscription, "fetch")
    .mockResolvedValue({ unwrap: () => ({ email_token: "tok" }) } as never);
  const disable = vi
    .spyOn(PaystackClient.subscription, "disable")
    .mockResolvedValue({ unwrap: () => ({}) } as never);

  return { fetch, disable };
};

beforeEach(() => {
  // A transaction answered as a plain success.
  vi.mocked(Repo.query).mockResolvedValue(result.suc([]));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AccountDeletionService.blockers", () => {
  it("blocks the only owner of an org that has other members", async () => {
    queue({
      memberships: [{ org_id: SHARED, org_name: "Acme", role: "owner" }],
      others: [{ org_id: SHARED, role: "member" }],
    });

    const res = await AccountDeletionService.blockers(USER.id);

    expect(res).toEqual({
      ok: true,
      data: [
        {
          org_id: SHARED,
          org_name: "Acme",
          role: "owner",
          reason: "sole_owner",
        },
      ],
    });
  });

  it("lets an owner go when another owner remains", async () => {
    queue({
      memberships: [{ org_id: SHARED, org_name: "Acme", role: "owner" }],
      others: [{ org_id: SHARED, role: "owner" }],
    });

    await expect(AccountDeletionService.blockers(USER.id)).resolves.toEqual({
      ok: true,
      data: [],
    });
  });

  it("does not block on an org the user is alone in", async () => {
    queue({
      memberships: [{ org_id: SOLO, org_name: "Mine", role: "owner" }],
      subscriptions: [{ reference_id: SOLO, code: "SUB_1" }],
    });

    await expect(AccountDeletionService.blockers(USER.id)).resolves.toEqual({
      ok: true,
      data: [],
    });
  });

  it("blocks a subscription the user pays for an org that outlives them", async () => {
    queue({
      memberships: [{ org_id: SHARED, org_name: "Acme", role: "member" }],
      others: [{ org_id: SHARED, role: "owner" }],
      subscriptions: [{ reference_id: SHARED, code: "SUB_2" }],
    });

    const res = await AccountDeletionService.blockers(USER.id);

    expect(res).toMatchObject({
      ok: true,
      data: [{ org_id: SHARED, org_name: "Acme", reason: "pays_for_org" }],
    });
  });
});

describe("AccountDeletionService.before", () => {
  it("refuses with the reason, touching no billing", async () => {
    const { fetch } = paystack();
    queue({
      memberships: [{ org_id: SHARED, org_name: "Acme", role: "owner" }],
      others: [{ org_id: SHARED, role: "member" }],
    });

    await expect(AccountDeletionService.before(USER)).rejects.toThrow(
      /only owner of Acme/,
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("cancels a solo org's subscription at Paystack before allowing it", async () => {
    const { fetch, disable } = paystack();
    queue({
      memberships: [{ org_id: SOLO, org_name: "Mine", role: "owner" }],
      subscriptions: [{ reference_id: SOLO, code: "SUB_1" }],
    });

    await AccountDeletionService.before(USER);

    expect(fetch).toHaveBeenCalledWith("SUB_1");
    expect(disable).toHaveBeenCalledWith({
      body: { code: "SUB_1", token: "tok" },
    });
  });

  it("refuses when Paystack will not cancel, and leaves nothing for `after`", async () => {
    const { disable } = paystack();
    disable.mockRejectedValue(new Error("paystack down"));
    queue({
      memberships: [{ org_id: SOLO, org_name: "Mine", role: "owner" }],
      subscriptions: [{ reference_id: SOLO, code: "SUB_1" }],
    });

    await expect(AccountDeletionService.before(USER)).rejects.toBeInstanceOf(
      APIError,
    );

    vi.mocked(Repo.query).mockClear();
    await AccountDeletionService.after(USER);

    // No solo orgs were recorded, so no transaction ran.
    expect(Repo.query).not.toHaveBeenCalled();
  });
});

describe("AccountDeletionService.after", () => {
  it("deletes the solo orgs in one transaction and emails the user", async () => {
    paystack();
    queue({
      memberships: [{ org_id: SOLO, org_name: "Mine", role: "owner" }],
    });
    await AccountDeletionService.before(USER);

    vi.mocked(Repo.query).mockClear();
    await AccountDeletionService.after(USER);
    await RuntimeService.drain();

    expect(Repo.query).toHaveBeenCalledOnce();
    expect(EmailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: USER.email,
        subject: expect.stringContaining("has been deleted"),
      }),
    );
  });
});
