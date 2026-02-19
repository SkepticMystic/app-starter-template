import { describe, expect, it } from "vitest";
import { Arrays, type Resource } from "./array.util";

describe("Arrays", () => {
  type TestResource = Resource<{ name: string; value: number }>;

  const createResource = (
    id: string,
    name: string,
    value: number,
  ): TestResource => ({
    id,
    name,
    value,
  });

  const testData: TestResource[] = [
    createResource("1", "first", 10),
    createResource("2", "second", 20),
    createResource("3", "third", 30),
  ];

  describe("find", () => {
    it("should find resource by id", () => {
      const result = Arrays.find(testData, "2");
      expect(result).toEqual({ id: "2", name: "second", value: 20 });
    });

    it("should return undefined for non-existent id", () => {
      const result = Arrays.find(testData, "999");
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty array", () => {
      const result = Arrays.find([], "1");
      expect(result).toBeUndefined();
    });
  });

  describe("add", () => {
    it("should add item to end by default", () => {
      const newItem = createResource("4", "fourth", 40);
      const result = Arrays.add(testData, newItem);
      expect(result).toHaveLength(4);
      expect(result[3]).toEqual(newItem);
      expect(result).not.toBe(testData);
    });

    it("should add item to front when specified", () => {
      const newItem = createResource("0", "zeroth", 0);
      const result = Arrays.add(testData, newItem, { front: true });
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(newItem);
    });

    it("should not mutate original array", () => {
      const original = [...testData];
      const newItem = createResource("4", "fourth", 40);
      Arrays.add(testData, newItem);
      expect(testData).toEqual(original);
    });
  });

  describe("patch", () => {
    it("should update resource by id", () => {
      const result = Arrays.patch(testData, "2", { value: 99 });
      expect(result[1]).toEqual({ id: "2", name: "second", value: 99 });
    });

    it("should only update matching resource", () => {
      const result = Arrays.patch(testData, "2", { name: "updated" });
      expect(result[0]).toEqual(testData[0]);
      expect(result[1]).toEqual({ id: "2", name: "updated", value: 20 });
      expect(result[2]).toEqual(testData[2]);
    });

    it("should return unchanged array if id not found", () => {
      const result = Arrays.patch(testData, "999", { value: 999 });
      expect(result).toEqual(testData);
      expect(result).not.toBe(testData);
    });

    it("should not mutate original array", () => {
      const original = [...testData];
      Arrays.patch(testData, "1", { value: 999 });
      expect(testData).toEqual(original);
    });

    it("should handle partial updates", () => {
      const result = Arrays.patch(testData, "1", { name: "updated" });
      expect(result[0]).toEqual({ id: "1", name: "updated", value: 10 });
    });
  });

  describe("remove", () => {
    it("should remove resource by id", () => {
      const result = Arrays.remove(testData, "2");
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: "1", name: "first", value: 10 },
        { id: "3", name: "third", value: 30 },
      ]);
    });

    it("should return unchanged array if id not found", () => {
      const result = Arrays.remove(testData, "999");
      expect(result).toEqual(testData);
      expect(result).not.toBe(testData);
    });

    it("should not mutate original array", () => {
      const original = [...testData];
      Arrays.remove(testData, "1");
      expect(testData).toEqual(original);
    });

    it("should handle removing from single-item array", () => {
      const single = [createResource("1", "only", 1)];
      const result = Arrays.remove(single, "1");
      expect(result).toEqual([]);
    });
  });

  describe("filter", () => {
    it("should filter resources by id list", () => {
      const result = Arrays.filter(testData, ["1", "3"]);
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: "1", name: "first", value: 10 },
        { id: "3", name: "third", value: 30 },
      ]);
    });

    it("should return empty array for no matches", () => {
      const result = Arrays.filter(testData, ["999", "888"]);
      expect(result).toEqual([]);
    });

    it("should handle empty id list", () => {
      const result = Arrays.filter(testData, []);
      expect(result).toEqual([]);
    });

    it("should not mutate original array", () => {
      const original = [...testData];
      Arrays.filter(testData, ["1", "2"]);
      expect(testData).toEqual(original);
    });

    it("should handle duplicate ids in filter list", () => {
      const result = Arrays.filter(testData, ["1", "1", "2"]);
      expect(result).toHaveLength(2);
      expect(result).toEqual([
        { id: "1", name: "first", value: 10 },
        { id: "2", name: "second", value: 20 },
      ]);
    });

    it("should maintain original order", () => {
      const result = Arrays.filter(testData, ["3", "1"]);
      expect(result[0]?.id).toBe("1");
      expect(result[1]?.id).toBe("3");
    });
  });
});
