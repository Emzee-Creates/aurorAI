// src/utils/formatters.ts
export function formatNumber(
  value: number | null | undefined,
  opts: { minimumFractionDigits?: number; maximumFractionDigits?: number } = {}
) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = opts;
  return value.toLocaleString("en-US", {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}
