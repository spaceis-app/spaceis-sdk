import { describe, it, expect } from "vitest";
import { formatUnitLabel } from "@/features/products/unit-utils";

describe("formatUnitLabel()", () => {
  it("formats step 1 with unit 'szt'", () => {
    expect(formatUnitLabel(1, "szt")).toBe("1 szt");
  });

  it("formats step 3 with unit 'pkt'", () => {
    expect(formatUnitLabel(3, "pkt")).toBe("3 pkt");
  });

  it("falls back to 'szt' when unit is null", () => {
    expect(formatUnitLabel(1, null)).toBe("1 szt");
  });

  it("falls back to 'szt' when unit is undefined", () => {
    expect(formatUnitLabel(1, undefined)).toBe("1 szt");
  });

  it("falls back to 'szt' when unit is empty string", () => {
    expect(formatUnitLabel(1, "")).toBe("1 szt");
  });

  it("formats step 5 with unit 'kg'", () => {
    expect(formatUnitLabel(5, "kg")).toBe("5 kg");
  });

  it("treats step 0 as 1", () => {
    expect(formatUnitLabel(0, "szt")).toBe("1 szt");
  });

  it("trims whitespace from unit", () => {
    expect(formatUnitLabel(1, "  szt  ")).toBe("1 szt");
  });
});
