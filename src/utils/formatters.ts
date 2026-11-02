export function formatPKR(amount: number): string {
  return `PKR ${amount.toLocaleString('en-PK')}`;
}

export function calculateDiscountPercent(originalPrice: number | null, currentPrice: number): number | null {
  if (!originalPrice || originalPrice <= currentPrice) return null;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}
