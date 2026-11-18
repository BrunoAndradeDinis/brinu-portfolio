export type TypeKind = 'label' | 'paragraph';

const MS_PER_CHAR = 40;
const LABEL_MIN_MS = 400;
const LABEL_MAX_MS = 600;
const PARAGRAPH_CAP_MS = 4000;

/** Total typing time in milliseconds for a block of `length` characters. */
export function typeDuration(length: number, kind: TypeKind): number {
  const natural = Math.max(0, length) * MS_PER_CHAR;
  if (kind === 'label') return Math.min(LABEL_MAX_MS, Math.max(LABEL_MIN_MS, natural));
  return Math.min(PARAGRAPH_CAP_MS, natural);
}

/** Characters visible `elapsedMs` after typing starts, from 0 up to `length`. */
export function visibleChars(length: number, kind: TypeKind, elapsedMs: number): number {
  const total = Math.max(0, length);
  const duration = typeDuration(total, kind);
  if (elapsedMs <= 0) return 0;
  if (duration === 0 || elapsedMs >= duration) return total;
  return Math.floor((total * elapsedMs) / duration);
}
