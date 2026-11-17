const LINE_BREAKS = /\r\n|[\r\u2028\u2029]/g;
const INVISIBLE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF]/g;
const ANGLE_BRACKETS = /[<>]/g;

function clean(raw: string): string {
  return raw
    .normalize('NFC')
    .replace(LINE_BREAKS, '\n')
    .replace(/\t/g, ' ')
    .replace(INVISIBLE, '')
    .replace(ANGLE_BRACKETS, '');
}

export function sanitizeLine(raw: string): string {
  return clean(raw).replace(/\s+/g, ' ').trim();
}

export function sanitizeMultiline(raw: string): string {
  return clean(raw)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function formatBrPhone(raw: string): string {
  const digits = digitsOnly(raw).slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  const area = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (rest.length <= 4) return `(${area}) ${rest}`;
  const split = digits.length === 11 ? 5 : 4;
  return `(${area}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}
