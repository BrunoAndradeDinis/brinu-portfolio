export const MAX_INPUT_LENGTH = 120;

const SPACING_CONTROLS = /[\t\n\v\f\r\x85\p{Zl}\p{Zp}]/gu;
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Co}\p{Cn}]/gu;

/** Reduces raw terminal input to plain, lowercase, single-spaced text of at most 120 characters. */
export function sanitizeInput(raw: string): string {
  return raw
    .slice(0, MAX_INPUT_LENGTH * 4)
    .normalize('NFKC')
    .replace(SPACING_CONTROLS, ' ')
    .replace(INVISIBLE, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, MAX_INPUT_LENGTH)
    .trim();
}

export function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}
