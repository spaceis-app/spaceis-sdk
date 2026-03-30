import { describe, it, expect } from "vitest";
import { fp, esc, getErrorMessage } from "../utils/helpers";
import { SpaceISError } from "@spaceis/sdk";

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

describe("esc() — escape HTML special characters", () => {
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

  it("converts non-string values to string first", () => {
    expect(esc(123 as any)).toBe("123");
  });
});

describe("getErrorMessage()", () => {
  it("returns default message for falsy input", () => {
    expect(getErrorMessage(null)).toBe("An error occurred");
    expect(getErrorMessage(undefined)).toBe("An error occurred");
  });

  it("extracts message from regular Error", () => {
    expect(getErrorMessage(new Error("Something broke"))).toBe("Something broke");
  });

  it("extracts message from SpaceISError", () => {
    const err = new SpaceISError("Server error", 500);
    expect(getErrorMessage(err)).toBe("Server error");
  });

  it("extracts first field error from validation SpaceISError", () => {
    const err = new SpaceISError("Validation failed", 422, {
      email: ["Email is required"],
    });
    expect(getErrorMessage(err)).toBe("email: Email is required");
  });

  it("returns default for non-error objects", () => {
    expect(getErrorMessage({ foo: "bar" })).toBe("An error occurred");
  });
});
