/**
 * All money in this application is an integer number of cents.
 * Floats are never used for money anywhere, including in transit.
 */

export function formatCents(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function marginCents(retailCents: number, baseCostCents: number): number {
  return retailCents - baseCostCents;
}

export function marginPercent(retailCents: number, baseCostCents: number): number {
  if (retailCents <= 0) return 0;
  return Math.round(((retailCents - baseCostCents) / retailCents) * 100);
}

export function sumLineTotals(items: { lineTotalCents: number }[]): number {
  return items.reduce((total, item) => total + item.lineTotalCents, 0);
}
