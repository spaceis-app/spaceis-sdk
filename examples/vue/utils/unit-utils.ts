/**
 * Format the quantity shown next to a unit price — e.g. `"1 szt"` or `"3 szt"`.
 * Mirrors the vanilla/php/react pattern so all examples speak the same way about unit.
 */
export function formatUnitLabel(step: number, unit: string | null | undefined): string {
  const u = (unit || "szt").trim() || "szt";
  const n = step > 1 ? step : 1;
  return `${n} ${u}`;
}
