import { STICKERS } from '../../data/stickers';

const TAP_DURATION_MS = 1200;

export function initStickerSwap(logo: HTMLElement): void {
  if (logo.dataset.stickerBound === 'true') return;
  const badge = logo.querySelector<HTMLElement>('[data-nav-avatar]');
  if (!badge) return;
  logo.dataset.stickerBound = 'true';

  const stickerImg = document.createElement('img');
  stickerImg.setAttribute('data-nav-sticker', '');
  stickerImg.alt = '';
  stickerImg.setAttribute('aria-hidden', 'true');
  stickerImg.decoding = 'async';
  stickerImg.draggable = false;
  badge.appendChild(stickerImg);

  const loaded: string[] = [];
  let lastFile: string | null = null;
  let tapTimer: ReturnType<typeof setTimeout> | null = null;

  const preload = () => {
    STICKERS.forEach((sticker) => {
      const probe = new Image();
      probe.onload = () => {
        if (!loaded.includes(sticker.file)) loaded.push(sticker.file);
      };
      probe.src = sticker.file;
    });
  };
  if (document.readyState === 'complete') setTimeout(preload, 0);
  else window.addEventListener('load', () => setTimeout(preload, 0), { once: true });

  const clearTap = () => {
    if (tapTimer) clearTimeout(tapTimer);
    tapTimer = null;
  };

  const hide = () => {
    clearTap();
    delete badge.dataset.stickerActive;
  };

  const pick = (): string | null => {
    if (loaded.length === 0) return null;
    const pool = loaded.length > 1 ? loaded.filter((file) => file !== lastFile) : loaded;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const show = () => {
    const file = pick();
    if (!file) return;
    lastFile = file;
    stickerImg.src = file;
    badge.dataset.stickerActive = 'true';
  };

  stickerImg.addEventListener('error', () => {
    const failed = new URL(stickerImg.src, window.location.href).pathname;
    const index = loaded.indexOf(failed);
    if (index >= 0) loaded.splice(index, 1);
    hide();
  });

  logo.addEventListener('pointerdown', (event) => {
    logo.dataset.pointerType = event.pointerType;
  });
  logo.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    show();
  });
  logo.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    hide();
  });
  logo.addEventListener('focus', () => {
    if (logo.matches(':focus-visible')) show();
  });
  logo.addEventListener('blur', hide);
  logo.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'touch') return;
    clearTap();
    show();
    tapTimer = setTimeout(hide, TAP_DURATION_MS);
  });
}
