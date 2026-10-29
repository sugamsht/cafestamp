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

const REWARD_TRANSLATIONS_ES: Record<string, string> = {
  'free coffee or breakfast': 'Café o Desayuno Gratis',
  'free coffee': 'Café Gratis',
  'free jumbo cookie': 'Galleta Gigante Gratis',
  'free handcrafted drink': 'Bebida Artesanal Gratis',
  'free slice + soda': 'Porción de Pizza + Refresco Gratis',
  'free drink': 'Bebida Gratis',
  'free breakfast': 'Desayuno Gratis',
};

const REWARD_TRANSLATIONS_EN: Record<string, string> = {
  'café o desayuno gratis': 'Free Coffee or Breakfast',
  'cafe o desayuno gratis': 'Free Coffee or Breakfast',
  'café gratis': 'Free Coffee',
  'cafe gratis': 'Free Coffee',
  'galleta gigante gratis': 'Free Jumbo Cookie',
  'bebida artesanal gratis': 'Free Handcrafted Drink',
  'porción de pizza + refresco gratis': 'Free Slice + Soda',
  'porcion de pizza + refresco gratis': 'Free Slice + Soda',
  'bebida gratis': 'Free Drink',
  'desayuno gratis': 'Free Breakfast',
};

export function translateRewardName(reward: string | undefined, lang: Language = 'es'): string {
  if (!reward) return '';
  const normalized = reward.trim().toLowerCase();
  if (lang === 'es') {
    return REWARD_TRANSLATIONS_ES[normalized] || reward;
  }
  return REWARD_TRANSLATIONS_EN[normalized] || reward;
}

const CAMPAIGN_NAMES_ES: Record<string, string> = {
  'specialty coffee': 'Café de Especialidad',
  'cookie classic': 'Galleta Clásica',
  'midnight brew': 'Café de Medianoche',
  'pizza party': 'Fiesta de la Pizza',
};

const CAMPAIGN_NAMES_EN: Record<string, string> = {
  'café de especialidad': 'Specialty Coffee',
  'cafe de especialidad': 'Specialty Coffee',
  'galleta clásica': 'Cookie Classic',
  'galleta clasica': 'Cookie Classic',
  'café de medianoche': 'Midnight Brew',
  'cafe de medianoche': 'Midnight Brew',
  'fiesta de la pizza': 'Pizza Party',
};

export function translateCampaignName(name: string | undefined, lang: Language = 'es'): string {
  if (!name) return '';
  const normalized = name.trim().toLowerCase();
  if (lang === 'es') {
    return CAMPAIGN_NAMES_ES[normalized] || name;
  }
  return CAMPAIGN_NAMES_EN[normalized] || name;
}

const CAMPAIGN_DESC_ES: Record<string, string> = {
  'loyalty card for cafés and coffee roasters in spain.': 'Tarjeta de fidelización para cafeterías y tostadores de café en España.',
  'the original warm and cozy cookie loyalty card.': 'La tarjeta de fidelización original de galletas artesanas.',
  'dark and sophisticated coffee shop vibes.': 'Ambiente de cafetería sofisticado y exclusivo.',
  'fun and vibrant styles for the best slice in town.': 'Estilo divertido para la mejor pizzería de la ciudad.',
};

const CAMPAIGN_DESC_EN: Record<string, string> = {
  'tarjeta de fidelización para cafeterías y tostadores de café en españa.': 'Loyalty card for cafés and coffee roasters in Spain.',
  'tarjeta de fidelizacion para cafeterias y tostadores de cafe en espana.': 'Loyalty card for cafés and coffee roasters in Spain.',
  'la tarjeta de fidelización original de galletas artesanas.': 'The original warm and cozy cookie loyalty card.',
  'la tarjeta de fidelizacion original de galletas artesanas.': 'The original warm and cozy cookie loyalty card.',
  'ambiente de cafetería sofisticado y exclusivo.': 'Dark and sophisticated coffee shop vibes.',
  'ambiente de cafeteria sofisticado y exclusivo.': 'Dark and sophisticated coffee shop vibes.',
  'estilo divertido para la mejor pizzería de la ciudad.': 'Fun and vibrant styles for the best slice in town.',
  'estilo divertido para la mejor pizzeria de la ciudad.': 'Fun and vibrant styles for the best slice in town.',
};

export function translateCampaignDescription(desc: string | undefined, lang: Language = 'es'): string {
  if (!desc) return '';
  const normalized = desc.trim().toLowerCase();
  if (lang === 'es') {
    return CAMPAIGN_DESC_ES[normalized] || desc;
  }
  return CAMPAIGN_DESC_EN[normalized] || desc;
}

export function translateTagline(tagline: string | undefined, lang: Language = 'es', totalStamps?: number): string {
  if (!tagline) return '';
  const trimmed = tagline.trim();

  if (lang === 'en') {
    const matchEs = trimmed.match(/^disfruta de (\d+) consumiciones y la siguiente corre por nuestra cuenta\.?$/i);
    if (matchEs) {
      return `Enjoy ${matchEs[1]} drinks and the next one is on us`;
    }
    const matchStampsEs = trimmed.match(/^consigue (\d+) sellos para:\s*(.*)$/i);
    if (matchStampsEs) {
      return `Collect ${matchStampsEs[1]} stamps for: ${translateRewardName(matchStampsEs[2], 'en')}`;
    }
    if (/^disfruta de/i.test(trimmed)) {
      return trimmed.replace(/^disfruta de (\d+) consumiciones y la siguiente corre por nuestra cuenta\.?/i, 'Enjoy $1 drinks and the next one is on us');
    }
  } else {
    const matchEn = trimmed.match(/^enjoy (\d+) (?:drinks|items|coffees|consumptions) and the next (?:one )?is on us\.?$/i);
    if (matchEn) {
      return `Disfruta de ${matchEn[1]} consumiciones y la siguiente corre por nuestra cuenta`;
    }
    const matchStampsEn = trimmed.match(/^collect (\d+) stamps for:\s*(.*)$/i);
    if (matchStampsEn) {
      return `Consigue ${matchStampsEn[1]} sellos para: ${translateRewardName(matchStampsEn[2], 'es')}`;
    }
  }

  return tagline;
}
