/**
 * Money formatting utilities
 */

export function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function formatStakes(cents: number): string {
  if (cents >= 100) {
    return centsToDisplay(cents);
  }
  return `${cents}¢`;
}