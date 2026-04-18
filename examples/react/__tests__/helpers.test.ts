import { describe, it, expect } from "vitest";
import { fp, esc, getErrorMessage } from "@/lib/helpers";
import { SpaceISError } from "@spaceis/react";

describe("fp() — format price from cents", () => {
  it("formats 1299 cents to contain '12'", () => {
    expect(fp(1299)).toContain("12");
  });

  it("formats 0 cents to contain '0'", () => {
    expect(fp(0)).toContain("0");
  });

  it("formats 100 cents to contain '1'", () => {
    expect(fp(100)).toContain("1");
  });

  it("includes currency indicator", () => {
    expect(fp(1299).length).toBeGreaterThan(2);
  });
});

describe("esc() — escape HTML", () => {
  it("escapes angle brackets", () => {
    expect(esc("<div>")).toBe("&lt;div&gt;");
  });

  it("escapes ampersand", () => {
    expect(esc("a & b")).toBe("a &amp; b");
  });

  it("escapes double quotes", () => {
    expect(esc('"hello"')).toBe("&quot;hello&quot;");
  });

  it("handles null and undefined as empty string", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
  });

  it("converts non-string values", () => {
    expect(esc(123 as any)).toBe("123");
  });
});

describe("getErrorMessage()", () => {
  it("returns default for falsy input", () => {
    expect(getErrorMessage(null)).toBe("An error occurred");
    expect(getErrorMessage(undefined)).toBe("An error occurred");
  });

  it("extracts message from Error", () => {
    expect(getErrorMessage(new Error("broke"))).toBe("broke");
  });

  it("extracts message from SpaceISError", () => {
    const err = new SpaceISError("Server error", 500);
    expect(getErrorMessage(err)).toBe("Server error");
  });

  it("extracts first field error from validation", () => {
    const err = new SpaceISError("Validation", 422, {
      email: ["Email required"],
    });
    expect(getErrorMessage(err)).toBe("email: Email required");
  });

  it("returns default for unknown objects", () => {
    expect(getErrorMessage({ foo: "bar" })).toBe("An error occurred");
  });
});

