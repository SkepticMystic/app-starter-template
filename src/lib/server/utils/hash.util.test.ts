import { describe, expect, it } from "vite-plus/test";
import { HashUtil } from "./hash.util";

describe("HashUtil", () => {
  it("hashes to lowercase hex SHA-256", async () => {
    await expect(HashUtil.sha256("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  it("keys an address the same however it is cased or padded", async () => {
    const [a, b] = await Promise.all([
      HashUtil.email_key("Jane@Example.com "),
      HashUtil.email_key("jane@example.com"),
    ]);

    expect(a).toBe(b);
    expect(a).not.toContain("jane");
  });
});
