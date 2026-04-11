const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
  JPY: '\u00A5',
  CAD: 'CA$',
  AUD: 'A$',
  INR: '\u20B9',
  SAR: '\uFDFC',
  AED: 'AED',
};

export function getCurrencySymbol(currency: string | undefined): string {
  if (!currency) return '$';
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function formatPrice(amount: string | number | null | undefined, currency?: string): string {
  if (amount == null) return '0.00';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.00';
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${num.toFixed(2)}`;
}