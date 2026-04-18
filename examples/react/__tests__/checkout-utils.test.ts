import { describe, it, expect } from "vitest";
import {
  calcPaymentFee,
  commissionPercent,
  isSafeRedirect,
} from "@/features/checkout/checkout-utils";

describe("calcPaymentFee()", () => {
  it("returns 0 when commission is 0 (falsy)", () => {
    expect(calcPaymentFee(1000, 0)).toBe(0);
  });

  it("returns 0 when commission is 1 (no surcharge)", () => {
    expect(calcPaymentFee(1000, 1)).toBe(0);
  });

  it("returns 0 when commission is below 1", () => {
    expect(calcPaymentFee(1000, 0.9)).toBe(0);
  });

  it("returns 0 when commission is NaN (falsy)", () => {
    expect(calcPaymentFee(1000, NaN)).toBe(0);
  });

  it("calculates 5% fee on 1000 cents → 50", () => {
    expect(calcPaymentFee(1000, 1.05)).toBe(50);
  });

  it("calculates 5% fee on 99 cents → 5 (Math.round(4.95))", () => {
    expect(calcPaymentFee(99, 1.05)).toBe(5);
  });

  it("calculates 20% fee on 99 cents → 20 (Math.round(19.8))", () => {
    expect(calcPaymentFee(99, 1.2)).toBe(20);
  });

  it("calculates 5% fee on 0 base → 0", () => {
    expect(calcPaymentFee(0, 1.05)).toBe(0);
  });
});

describe("commissionPercent()", () => {
  it("returns 0 when commission is 0 (falsy)", () => {
    expect(commissionPercent(0)).toBe(0);
  });

  it("returns 0 when commission is 1 (no surcharge)", () => {
    expect(commissionPercent(1)).toBe(0);
  });

  it("returns 0 when commission is below 1", () => {
    expect(commissionPercent(0.9)).toBe(0);
  });

  it("returns 5 for commission 1.05", () => {
    expect(commissionPercent(1.05)).toBe(5);
  });

  it("returns 20 for commission 1.2", () => {
    expect(commissionPercent(1.2)).toBe(20);
  });

  it("returns 16 for commission 1.155 (Math.round(15.5) = 16 in JS)", () => {
    expect(commissionPercent(1.155)).toBe(16);
  });

  it("returns 0 for NaN (falsy)", () => {
    expect(commissionPercent(NaN)).toBe(0);
  });
});

describe("isSafeRedirect()", () => {
  it("accepts https URL", () => {
    expect(isSafeRedirect("https://example.com/x")).toBe(true);
  });

  it("accepts http URL", () => {
    expect(isSafeRedirect("http://example.com")).toBe(true);
  });

  it("rejects javascript: protocol", () => {
    expect(isSafeRedirect("javascript:alert(1)")).toBe(false);
  });

  it("rejects data: protocol", () => {
    expect(isSafeRedirect("data:text/html,<h1>xss</h1>")).toBe(false);
  });

  it("rejects file: protocol", () => {
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
    expect(isSafeRedirect(42)).toBe(false);
  });

  it("accepts relative URL like /checkout/thanks (resolves to http://localhost)", () => {
    expect(isSafeRedirect("/checkout/thanks")).toBe(true);
  });
});
