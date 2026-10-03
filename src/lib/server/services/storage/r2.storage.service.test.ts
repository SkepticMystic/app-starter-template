import { NotFound, S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { Readable } from "node:stream";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { R2Service } from "./r2.storage.service";

vi.mock("@aws-sdk/lib-storage", () => ({
  Upload: vi.fn(
    class {
      done = vi.fn(async () => ({ Key: "streamed" }));
    },
  ),
}));

const send = vi.spyOn(S3Client.prototype, "send");

beforeEach(() => {
  send.mockReset();
  vi.mocked(Upload).mockClear();
});

describe("R2Service.head", () => {
  it("reports an object's size and metadata", async () => {
    send.mockResolvedValueOnce({
      ContentLength: 42,
      Metadata: { channels: "2" },
    } as never);

    await expect(R2Service.head("a/b")).resolves.toEqual({
      ok: true,
      data: { exists: true, size: 42, metadata: { channels: "2" } },
    });
  });

  it("answers a typed miss as exists: false, not an error", async () => {
    send.mockRejectedValueOnce(
      new NotFound({ message: "NotFound", $metadata: {} }),
    );

    await expect(R2Service.head("missing")).resolves.toEqual({
      ok: true,
      data: { exists: false, size: null, metadata: undefined },
    });
  });

  // HEAD has no body, so some endpoints yield only the status.
  it("answers a bare 404 as a miss too", async () => {
    send.mockRejectedValueOnce(
      Object.assign(new Error("UnknownError"), {
        $metadata: { httpStatusCode: 404 },
      }),
    );

    const res = await R2Service.head("missing");

    expect(res.ok && res.data.exists).toBe(false);
  });

  it("fails when the bucket cannot be reached, rather than reading as empty", async () => {
    send.mockRejectedValueOnce(new Error("ECONNRESET"));

    const res = await R2Service.head("a/b");

    expect(res.ok).toBe(false);
  });
});

describe("R2Service.put", () => {
  it("sends a buffer as one PutObject", async () => {
    send.mockResolvedValueOnce({ ETag: "x" } as never);

    const res = await R2Service.put({
      key: "a/b",
      body: new Uint8Array([1, 2, 3]),
      content_type: "application/octet-stream",
      content_length: 3,
    });

    expect(res.ok).toBe(true);
    expect(send).toHaveBeenCalledOnce();
    expect(Upload).not.toHaveBeenCalled();
  });

  it.each([
    ["a Node stream", () => Readable.from([new Uint8Array([1])])],
    ["a web stream", () => new Blob([new Uint8Array([1])]).stream()],
  ])("streams %s through Upload, with no Content-Length", async (_, body) => {
    const res = await R2Service.put({
      key: "a/b",
      body: body(),
      content_type: "application/octet-stream",
      content_length: 1,
    });

    expect(res).toEqual({ ok: true, data: { Key: "streamed" } });
    expect(send).not.toHaveBeenCalled();
    expect(vi.mocked(Upload).mock.calls[0]?.[0].params).not.toHaveProperty(
      "ContentLength",
    );
  });
});
