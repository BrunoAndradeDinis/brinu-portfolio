import { t, type Locale, type Localized } from './localized.ts';
import { MAIN_CASES } from './cases.ts';

const PAGE_TITLES: Readonly<Record<string, Localized<string>>> = {
  '/': t('INÍCIO', 'HOME'),
  '/stickers': t('STICKERS', 'STICKERS'),
  '/whoami': t('WHOAMI', 'WHOAMI'),
};

const CASES_TITLE = t('CASES', 'CASES');
const MISSING_TITLE = t('404', '404');

function normalize(pathname: string): string {
  const trimmed = pathname.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, '') : '/';
}

export function isCaseRoute(pathname: string): boolean {
  const path = normalize(pathname);
  const caseId = path.match(/^\/cases\/([^/]+)$/)?.[1];
  return MAIN_CASES.some((entry) => entry.id === caseId);
}

export function routeBandTitle(pathname: string, locale: Locale): string {
  const path = normalize(pathname);
  const page = PAGE_TITLES[path];
  if (page) return page[locale];
  return isCaseRoute(path) ? CASES_TITLE[locale] : MISSING_TITLE[locale];
}
