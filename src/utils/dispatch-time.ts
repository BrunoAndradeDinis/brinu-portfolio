import type { Locale } from '../data/localized.ts';

const INTL_LOCALE: Readonly<Record<Locale, string>> = { 'pt-br': 'pt-BR', en: 'en' };

export function formatDispatchTime(date: Date, locale: Locale, timeZone?: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
    timeZoneName: 'short',
    timeZone,
  }).format(date);
}
