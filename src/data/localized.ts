export type Locale = 'pt-br' | 'en';

declare const LOCALIZED_BRAND: unique symbol;

export type Localized<T> = Readonly<Record<Locale, T>> & { readonly [LOCALIZED_BRAND]: true };

type NonEmptyGuard<S extends string> = S extends '' ? never : unknown;

export function t<const P extends string, const E extends string>(
  pt: P & NonEmptyGuard<P>,
  en: E & NonEmptyGuard<E>
): Localized<string> {
  const text: Readonly<Record<Locale, string>> = { 'pt-br': pt, en };
  return text as Localized<string>;
}

export type YearMonth = `${number}-${number}`;

const MONTHS: Readonly<Record<Locale, readonly string[]>> = {
  'pt-br': ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const PRESENT = t('atual', 'present');

function formatMonth(locale: Locale, value: YearMonth): string {
  const [year, month] = value.split('-');
  const name = MONTHS[locale][Number(month) - 1];
  return locale === 'pt-br' ? `${name}/${year}` : `${name} ${year}`;
}

export function formatPeriod(locale: Locale, start: YearMonth, end: YearMonth | 'present'): string {
  const endLabel = end === 'present' ? PRESENT[locale] : formatMonth(locale, end);
  return `${formatMonth(locale, start)} – ${endLabel}`;
}
