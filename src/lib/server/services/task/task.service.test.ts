import { Repo } from "#lib/server/db/repos/index.repo.js";
import { result } from "#lib/utils/result.util.js";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { makeSession } from "../../../../test/helpers";
import { TaskService } from "./task.service";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const ASSIGNEE_ID = "33333333-3333-4333-8333-333333333333";
const TASK_ID = "44444444-4444-4444-8444-444444444444";

const session = makeSession({ orgId: ORG_ID });

const task = { id: TASK_ID, title: "Ship it" };

beforeEach(() => {
  vi.mocked(Repo.insert_one).mockResolvedValue(result.suc(task));
  vi.mocked(Repo.update_one).mockResolvedValue(result.suc(task));
});

describe("TaskService — the assignee", () => {
  it("creates a task assigned to a member of the caller's org", async () => {
    vi.mocked(Repo.exists).mockResolvedValue(result.suc(true));

    const res = await TaskService.create(
      { title: "Ship it", assigned_member_id: ASSIGNEE_ID },
      session,
    );

    expect(res).toEqual({ ok: true, data: task });
    expect(Repo.exists).toHaveBeenCalledOnce();
  });

  it("refuses to create a task assigned to another org's member", async () => {
    vi.mocked(Repo.exists).mockResolvedValue(result.suc(false));

    const res = await TaskService.create(
      { title: "Ship it", assigned_member_id: ASSIGNEE_ID },
      session,
    );

    expect(res).toMatchObject({
      ok: false,
      error: { code: "INVALID_INPUT", path: ["assigned_member_id"] },
    });
    expect(Repo.insert_one).not.toHaveBeenCalled();
  });

  it("refuses to reassign a task to another org's member", async () => {
    vi.mocked(Repo.exists).mockResolvedValue(result.suc(false));

    const res = await TaskService.update(
      { id: TASK_ID, assigned_member_id: ASSIGNEE_ID },
      session,
    );

    expect(res).toMatchObject({ ok: false, error: { code: "INVALID_INPUT" } });
    expect(Repo.update_one).not.toHaveBeenCalled();
  });

  it("does not look up an unassigned task's assignee", async () => {
    const res = await TaskService.create({ title: "Ship it" }, session);

    expect(res.ok).toBe(true);
    expect(Repo.exists).not.toHaveBeenCalled();
  });

  it("passes a failed lookup through rather than assigning", async () => {
    vi.mocked(Repo.exists).mockResolvedValue(
      result.err({
        status: 500,
        level: "error",
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      }),
    );

    const res = await TaskService.update(
      { id: TASK_ID, assigned_member_id: ASSIGNEE_ID },
      session,
    );

    expect(res).toMatchObject({
      ok: false,
      error: { code: "INTERNAL_SERVER_ERROR" },
    });
    expect(Repo.update_one).not.toHaveBeenCalled();
  });
});
