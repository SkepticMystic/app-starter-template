import { describe, it, expect } from "vitest";
import { z } from "zod";
import { query_schema, where_schema } from "./query.schema";

describe("query_schema", () => {
  it("should validate basic query", () => {
    const schema = query_schema(z.object({
      name: where_schema.ilike()
    }));

    const result = schema.parse({
      where: { name: { ilike: "test" } },
      offset: 0,
      limit: 10
    });

    expect(result.where.name.ilike).toBe("test");
    expect(result.offset).toBe(0);
    expect(result.limit).toBe(10);
  });

  it("should apply defaults", () => {
    const schema = query_schema(z.object({
      name: where_schema.ilike()
    }));

    const result = schema.parse({
      where: { name: { ilike: "test" } }
    });

    expect(result.offset).toBe(0);
    expect(result.limit).toBe(10);
  });

  it("should enforce max limit", () => {
    const schema = query_schema(z.object({
      name: where_schema.ilike()
    }));

    expect(() => {
      schema.parse({
        where: { name: { ilike: "test" } },
        limit: 200
      });
    }).toThrow();
  });
});

describe("where_schema", () => {
  describe("ilike", () => {
    it("should validate ilike pattern", () => {
      const schema = where_schema.ilike();
      const result = schema.parse({ ilike: "test%" });
      expect(result.ilike).toBe("test%");
    });

    it("should allow optional", () => {
      const schema = where_schema.ilike();
      const result = schema.parse({});
      expect(result.ilike).toBeUndefined();
    });
  });

  describe("in", () => {
    it("should validate in array", () => {
      const schema = where_schema.in(z.string());
      const result = schema.parse({ in: ["a", "b"] });
      expect(result.in).toEqual(["a", "b"]);
    });
  });

  describe("date_range", () => {
    it("should validate date range", () => {
      const schema = where_schema.date_range();
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");
      
      const result = schema.parse({ gte: start, lte: end });
      expect(result.gte).toEqual(start);
      expect(result.lte).toEqual(end);
    });
  });
});
