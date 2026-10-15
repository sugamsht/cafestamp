import { Language } from './i18n/translations';

export const APP_CURRENCY = 'EUR';

export function getLocale(lang: Language = 'es'): string {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

export function formatDate(value: string | number | Date | null | undefined, lang: Language = 'es'): string {
  if (!value) return '';
  const date = typeof value === 'object' ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getLocale(lang), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(value: string | number | Date | null | undefined, lang: Language = 'es'): string {
  if (!value) return '';
  const date = typeof value === 'object' ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(getLocale(lang), {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: lang === 'en',
  }).format(date);
}

export function formatCurrency(amount: number, lang: Language = 'es'): string {
  return new Intl.NumberFormat(getLocale(lang), {
    style: 'currency',
    currency: APP_CURRENCY,
  }).format(amount);
}

const TX_TITLES_ES: Record<string, string> = {
  'stamp collected': 'Sello añadido',
  'stamp added': 'Sello añadido',
  'stamp removed': 'Sello corregido',
  'reward redeemed': 'Recompensa canjeada',
  'card issued': 'Tarjeta emitida',
  'initial card creation': 'Creación inicial de tarjeta',
  'manual correction': 'Corrección manual',
};

const TX_TITLES_EN: Record<string, string> = {
  'sello añadido': 'Stamp added',
  'sello corregido': 'Stamp removed',
  'recompensa canjeada': 'Reward redeemed',
  'tarjeta emitida': 'Card issued',
  'creación inicial de tarjeta': 'Initial card creation',
  'corrección manual': 'Manual correction',
};

export function translateTransactionTitle(title: string | undefined, lang: Language = 'es'): string {
  if (!title) return '';
  const normalized = title.trim().toLowerCase();
  if (lang === 'es') {
    return TX_TITLES_ES[normalized] || title;
  }
  return TX_TITLES_EN[normalized] || title;
}

export function translateTransactionRemarks(remarks: string | undefined, lang: Language = 'es'): string {
  if (!remarks) return '';
  const normalized = remarks.trim().toLowerCase();
  if (lang === 'es') {
    if (normalized === 'manual correction') return 'Corrección manual';
    if (normalized === 'initial card creation') return 'Creación inicial de tarjeta';
  } else {
    if (normalized === 'corrección manual') return 'Manual correction';
    if (normalized === 'creación inicial de tarjeta') return 'Initial card creation';
  }
  return remarks;
}
