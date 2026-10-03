import { describe, expect, it } from "vite-plus/test";
import { active_href } from "./active_href.util";

describe("active_href", () => {
  const hrefs = ["/settings", "/settings/api-key", "/tasks"];

  it("lights an item on its own page", () => {
    expect(active_href("/tasks", hrefs)).toBe("/tasks");
  });

  it("lights the deepest item a nested page sits under", () => {
    expect(active_href("/settings/api-key/create", hrefs)).toBe(
      "/settings/api-key",
    );
    expect(active_href("/settings/profile", hrefs)).toBe("/settings");
  });

  it("does not light an item whose href is only a prefix of the path's segment", () => {
    expect(active_href("/tasksets", hrefs)).toBeUndefined();
  });
});
