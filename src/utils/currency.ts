export const CURRENCIES: Record<string, string> = {
  XOF: 'FCFA',
  EUR: '€',
  USD: '$',
  GBP: '£',
};

export function formatCurrency(amount: number, currency = 'XOF'): string {
  const symbol = CURRENCIES[currency] || currency;
  const formatted = new Intl.NumberFormat('fr-FR').format(amount);
  return `${formatted} ${symbol}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
