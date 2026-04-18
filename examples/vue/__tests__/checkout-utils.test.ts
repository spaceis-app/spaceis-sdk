import { describe, it, expect } from "vitest";
import {
  calcPaymentFee,
  commissionPercent,
  isSafeRedirect,
} from "../utils/checkout-utils";

describe("calcPaymentFee()", () => {
  it("returns 0 when commission is undefined", () => {
    expect(calcPaymentFee(1000, undefined as unknown as number)).toBe(0);
  });

  it("returns 0 when commission is 0", () => {
    expect(calcPaymentFee(1000, 0)).toBe(0);
  });

  it("returns 0 when commission is NaN", () => {
    expect(calcPaymentFee(1000, NaN)).toBe(0);
  });

  it("returns 0 when commission is exactly 1 (no surcharge)", () => {
    expect(calcPaymentFee(1000, 1)).toBe(0);
  });

  it("returns 0 when commission < 1", () => {
    expect(calcPaymentFee(1000, 0.9)).toBe(0);
  });

  it("returns 50 for base=1000, commission=1.05", () => {
    expect(calcPaymentFee(1000, 1.05)).toBe(50);
  });

  it("returns 20 for base=99, commission=1.2 (rounds 19.8 → 20)", () => {
    expect(calcPaymentFee(99, 1.2)).toBe(20);
  });
});

describe("commissionPercent()", () => {
  it("returns 0 when commission is 0", () => {
    expect(commissionPercent(0)).toBe(0);
  });

  it("returns 0 when commission is 1", () => {
    expect(commissionPercent(1)).toBe(0);
  });

  it("returns 0 when commission is undefined", () => {
    expect(commissionPercent(undefined as unknown as number)).toBe(0);
  });

  it("returns 5 for commission=1.05", () => {
    expect(commissionPercent(1.05)).toBe(5);
  });

  it("returns 20 for commission=1.2", () => {
    expect(commissionPercent(1.2)).toBe(20);
  });

  it("returns Math.round(15.5)=16 for commission=1.155", () => {
    expect(commissionPercent(1.155)).toBe(Math.round((1.155 - 1) * 100));
  });
});

describe("isSafeRedirect()", () => {
  it("accepts https URL", () => {
    expect(isSafeRedirect("https://example.com/x")).toBe(true);
  });

  it("accepts http URL", () => {
    expect(isSafeRedirect("http://example.com")).toBe(true);
  });

  it("rejects javascript: URL", () => {
    expect(isSafeRedirect("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: URL", () => {
    expect(isSafeRedirect("data:text/html,<h1>x</h1>")).toBe(false);
  });

  it("rejects file: URL", () => {
    expect(isSafeRedirect("file:///etc/passwd")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isSafeRedirect("")).toBe(false);
  });

  it("rejects null", () => {
    expect(isSafeRedirect(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(isSafeRedirect(undefined)).toBe(false);
  });

  it("rejects number", () => {
    expect(isSafeRedirect(123)).toBe(false);
  });

  it("accepts relative path (resolves against origin)", () => {
    expect(isSafeRedirect("/checkout/thanks")).toBe(true);
  });

  it("rejects truly malformed URL (invalid scheme)", () => {
    expect(isSafeRedirect("ftp://bad.example.com")).toBe(false);
  });
});
