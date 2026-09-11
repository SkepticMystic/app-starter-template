import { describe, expect, it } from "vite-plus/test";
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

describe("Strings.mask_email", () => {
  it("keeps the domain and the outer characters of the local part", () => {
    expect(Strings.mask_email("ross@example.com")).toBe("r••s@example.com");
  });

  it("handles a two-character local part", () => {
    expect(Strings.mask_email("ab@example.com")).toBe("a•@example.com");
  });

  it("caps the number of dots so length is not leaked", () => {
    const masked = Strings.mask_email("averylonglocalpart@example.com");

    expect(masked).toBe("a•••••t@example.com");
  });

  it("refuses to guess at something that is not an address", () => {
    expect(Strings.mask_email("not-an-address")).toBe("•••");
  });
});

describe("Strings.pluralize", () => {
  it("is singular at exactly one", () => {
    expect(Strings.pluralize("item", 1)).toBe("item");
  });

  it("is plural at zero", () => {
    // The hand-rolled `count > 1 ? "s" : ""` spelling got this wrong.
    expect(Strings.pluralize("item", 0)).toBe("items");
  });

  it("takes an explicit plural", () => {
    expect(Strings.pluralize("entry", 3, "entries")).toBe("entries");
  });
});

describe("Strings.humanise", () => {
  it("raises the first letter and unhyphenates", () => {
    expect(Strings.humanise("no-answer")).toBe("No answer");
  });

  it("leaves the rest of the casing alone", () => {
    expect(Strings.humanise("api_key")).toBe("Api key");
  });
});
