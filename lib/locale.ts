export const APP_LOCALE = 'es-ES';
export const APP_CURRENCY = 'EUR';

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
});

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'object' ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'object' ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return dateTimeFormatter.format(date);
}

export function formatCurrency(amount: number): string {
  return currencyFormatter.format(amount);
}

const TRANSACTION_TITLE_MAP: Record<string, string> = {
  'stamp collected': 'Sello añadido',
  'stamp added': 'Sello añadido',
  'stamp removed': 'Sello corregido',
  'reward redeemed': 'Recompensa canjeada',
  'card issued': 'Tarjeta emitida',
  'initial card creation': 'Creación inicial de tarjeta',
  'manual correction': 'Corrección manual',
};

export function translateTransactionTitle(title: string | undefined): string {
  if (!title) return '';
  const normalized = title.trim().toLowerCase();
  return TRANSACTION_TITLE_MAP[normalized] || title;
}

export function translateTransactionRemarks(remarks: string | undefined): string {
  if (!remarks) return '';
  const normalized = remarks.trim().toLowerCase();
  if (normalized === 'manual correction') return 'Corrección manual';
  if (normalized === 'initial card creation') return 'Creación inicial de tarjeta';
  return remarks;
}
