import { describe, it, expect } from "vitest";
import { formatUnitLabel } from "../utils/unit-utils";

describe("formatUnitLabel()", () => {
  it("returns '1 szt' for step=1, unit='szt'", () => {
    expect(formatUnitLabel(1, "szt")).toBe("1 szt");
  });

  it("returns '3 pkt' for step=3, unit='pkt'", () => {
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

  it("returns '5 kg' for step=5, unit='kg'", () => {
    expect(formatUnitLabel(5, "kg")).toBe("5 kg");
  });

  it("clamps step=0 to 1", () => {
    expect(formatUnitLabel(0, "szt")).toBe("1 szt");
  });

  it("trims whitespace from unit", () => {
    expect(formatUnitLabel(1, "  szt  ")).toBe("1 szt");
  });
});
