import { describe, it, expect } from "vitest";
import { SpaceISError } from "../error";

describe("SpaceISError", () => {
  describe("constructor", () => {
    it("sets message, status, and name", () => {
      const err = new SpaceISError("Something went wrong", 500);

      expect(err.message).toBe("Something went wrong");
      expect(err.status).toBe(500);
      expect(err.name).toBe("SpaceISError");
    });

    it("is an instance of Error", () => {
      const err = new SpaceISError("Oops", 400);
      expect(err).toBeInstanceOf(Error);
      expect(err).toBeInstanceOf(SpaceISError);
    });

    it("sets errors to null when not provided", () => {
      const err = new SpaceISError("Oops", 400);
      expect(err.errors).toBeNull();
    });

    it("sets errors to null when explicitly passed null", () => {
      const err = new SpaceISError("Oops", 400, null);
      expect(err.errors).toBeNull();
    });

    it("stores errors when provided", () => {
      const errors = { email: ["Required", "Invalid format"], name: ["Too short"] };
      const err = new SpaceISError("Validation failed", 422, errors);
      expect(err.errors).toEqual(errors);
    });
  });

  describe("isValidation", () => {
    it("returns true for status 422", () => {
      const err = new SpaceISError("Validation error", 422);
      expect(err.isValidation).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(new SpaceISError("Not found", 404).isValidation).toBe(false);
      expect(new SpaceISError("Server error", 500).isValidation).toBe(false);
      expect(new SpaceISError("Unauthorized", 401).isValidation).toBe(false);
    });
  });

  describe("isNotFound", () => {
    it("returns true for status 404", () => {
      const err = new SpaceISError("Not found", 404);
      expect(err.isNotFound).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(new SpaceISError("Validation", 422).isNotFound).toBe(false);
      expect(new SpaceISError("Server error", 500).isNotFound).toBe(false);
      expect(new SpaceISError("OK", 200).isNotFound).toBe(false);
    });
  });

  describe("isRateLimited", () => {
    it("returns true for status 429", () => {
      const err = new SpaceISError("Too many requests", 429);
      expect(err.isRateLimited).toBe(true);
    });

    it("returns false for other statuses", () => {
      expect(new SpaceISError("Not found", 404).isRateLimited).toBe(false);
      expect(new SpaceISError("Server error", 500).isRateLimited).toBe(false);
      expect(new SpaceISError("Validation", 422).isRateLimited).toBe(false);
    });
  });

  describe("fieldError", () => {
    it("returns the first error message for an existing field", () => {
      const err = new SpaceISError("Invalid", 422, {
        email: ["The email is required.", "Must be a valid email."],
        name: ["Too short"],
      });

      expect(err.fieldError("email")).toBe("The email is required.");
      expect(err.fieldError("name")).toBe("Too short");
    });

    it("returns undefined for a field that has no errors", () => {
      const err = new SpaceISError("Invalid", 422, { email: ["Required"] });
      expect(err.fieldError("phone")).toBeUndefined();
    });

    it("returns undefined when errors is null", () => {
      const err = new SpaceISError("Error", 500);
      expect(err.fieldError("email")).toBeUndefined();
    });
  });

  describe("allFieldErrors", () => {
    it("returns empty array when errors is null", () => {
      const err = new SpaceISError("Error", 500);
      expect(err.allFieldErrors()).toEqual([]);
    });

    it("returns all errors as 'field: message' strings", () => {
      const err = new SpaceISError("Invalid", 422, {
        email: ["Required", "Invalid format"],
        name: ["Too short"],
      });

      const result = err.allFieldErrors();

      expect(result).toContain("email: Required");
      expect(result).toContain("email: Invalid format");
      expect(result).toContain("name: Too short");
      expect(result).toHaveLength(3);
    });

    it("returns empty array for an empty errors object", () => {
      const err = new SpaceISError("Invalid", 422, {});
      expect(err.allFieldErrors()).toEqual([]);
    });

    it("handles a single field with a single message", () => {
      const err = new SpaceISError("Invalid", 422, {
        password: ["Must be at least 8 characters."],
      });

      expect(err.allFieldErrors()).toEqual(["password: Must be at least 8 characters."]);
    });
  });
});
