export type Locale = 'pt-br' | 'en';

export type Localized<T> = Readonly<Record<Locale, T>>;

type NonEmptyGuard<S extends string> = S extends '' ? never : unknown;

export function t<const P extends string, const E extends string>(
  pt: P & NonEmptyGuard<P>,
  en: E & NonEmptyGuard<E>
): Localized<string> {
  return { 'pt-br': pt, en };
}

export type YearMonth = `${number}-${number}`;

const MONTHS: Localized<readonly string[]> = {
  'pt-br': ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

const PRESENT: Localized<string> = { 'pt-br': 'atual', en: 'present' };

function formatMonth(locale: Locale, value: YearMonth): string {
  const [year, month] = value.split('-');
  const name = MONTHS[locale][Number(month) - 1];
  return locale === 'pt-br' ? `${name}/${year}` : `${name} ${year}`;
}

export function formatPeriod(locale: Locale, start: YearMonth, end: YearMonth | 'present'): string {
  const endLabel = end === 'present' ? PRESENT[locale] : formatMonth(locale, end);
  return `${formatMonth(locale, start)} – ${endLabel}`;
}
