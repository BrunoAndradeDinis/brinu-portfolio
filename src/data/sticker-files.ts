export const STICKER_COUNT = 32;

export function stickerFile(position: number): string {
  return `/stickers/sticker-${String(position).padStart(2, '0')}.svg`;
}

export const STICKER_FILES: readonly string[] = Array.from({ length: STICKER_COUNT }, (_, index) => stickerFile(index + 1));
