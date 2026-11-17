const LINE_BREAKS = /\r\n|[\r\u2028\u2029]/g;
const LONE_SURROGATES = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const INVISIBLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu;
const ANGLE_BRACKETS = /[<>]/g;
const ORPHAN_MARKS = /(^|\s)\p{M}+/gu;

function clean(raw: string): string {
  return raw
    .replace(LONE_SURROGATES, '')
    .replace(LINE_BREAKS, '\n')
    .replace(/\t/g, ' ')
    .replace(INVISIBLE, '')
    .replace(ANGLE_BRACKETS, '')
    .normalize('NFC');
}

export function sanitizeLine(raw: string): string {
  return clean(raw).replace(/\s+/g, ' ').replace(ORPHAN_MARKS, '$1').trim();
}

export function sanitizeMultiline(raw: string): string {
  return clean(raw)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').replace(ORPHAN_MARKS, '$1').trim())
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  return /[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut;
}

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

const BR_COUNTRY_CODE = '55';
const BR_MAX_DIGITS = 11;

export function phoneDigits(raw: string): string {
  const international = raw.trim().startsWith('+');
  let digits = digitsOnly(raw);
  if (!international && digits.startsWith('00')) return stripCountryCode(digits.slice(2), true);
  if (international) return stripCountryCode(digits, true);
  if (digits.startsWith('0')) digits = digits.replace(/^0+/, '');
  return digits.length > BR_MAX_DIGITS ? stripCountryCode(digits, false) : digits;
}

function stripCountryCode(digits: string, explicit: boolean): string {
  if (digits.startsWith(BR_COUNTRY_CODE) && (explicit || digits.length > BR_MAX_DIGITS)) return digits.slice(BR_COUNTRY_CODE.length);
  return digits;
}

export function formatBrPhone(raw: string): string {
  const digits = phoneDigits(raw);
  if (digits.length > BR_MAX_DIGITS) return digits;
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${area}) ${rest}`;
  const split = digits.length === 11 ? 5 : 4;
  return `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
