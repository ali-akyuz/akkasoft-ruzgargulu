/**
 * Sayısal ve metinsel biçimlendiriciler
 */

export function formatPower(kw: number): string {
  if (kw >= 1000) {
    return `${(kw / 1000).toFixed(2)} MW`;
  }
  return `${kw.toFixed(0)} kW`;
}

export function formatWindSpeed(speed: number): string {
  return `${speed.toFixed(1)} m/s`;
}

export function formatCurrencyTRY(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(amount);
}

