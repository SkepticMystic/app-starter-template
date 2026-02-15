import { describe, expect, it } from "vitest";
import { Strings } from "./strings.util";

describe("Strings", () => {
  describe("slugify", () => {
    it("should convert basic string to lowercase slug", () => {
      expect(Strings.slugify("Hello World")).toBe("hello-world");
    });

    it("should replace multiple spaces with single hyphen", () => {
      expect(Strings.slugify("hello   world")).toBe("hello-world");
    });

    it("should remove special characters", () => {
      expect(Strings.slugify("Hello, World!")).toBe("hello-world");
      expect(Strings.slugify("Hello@World#Test")).toBe("helloworldtest");
    });

    it("should handle strings with numbers", () => {
      expect(Strings.slugify("Article 123")).toBe("article-123");
    });

    it("should handle strings with underscores", () => {
      expect(Strings.slugify("hello_world")).toBe("hello_world");
    });

    it("should handle empty string", () => {
      expect(Strings.slugify("")).toBe("");
    });

    it("should handle string with only special characters", () => {
      expect(Strings.slugify("!@#$%^&*()")).toBe("");
    });

    it("should handle mixed case with special chars", () => {
      expect(Strings.slugify("The Quick Brown Fox!")).toBe(
        "the-quick-brown-fox",
      );
    });
  });
});
