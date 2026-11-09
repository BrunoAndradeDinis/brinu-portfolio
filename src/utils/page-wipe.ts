const WIPE_COVER_MS = 140;
const WIPE_LEAVE_MS = 220;
const WIPE_CLASSES = ['is-covering', 'is-leaving', 'is-wiping'] as const;

let installed = false;
let leaveTimer: ReturnType<typeof setTimeout> | null = null;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function resetWipe(overlay: HTMLElement): void {
  if (leaveTimer) clearTimeout(leaveTimer);
  leaveTimer = null;
  overlay.classList.remove(...WIPE_CLASSES);
  const blade = overlay.querySelector<HTMLElement>('.p5-wipe-blade-red');
  if (!blade) return;
  blade.style.transition = 'none';
  void blade.offsetWidth;
  blade.style.transition = '';
}

function coverScreen(overlay: HTMLElement): void {
  resetWipe(overlay);
  overlay.classList.add('is-covering');
}

function revealPage(overlay: HTMLElement): void {
  if (!overlay.classList.contains('is-covering')) return;
  void overlay.offsetWidth;
  overlay.classList.remove('is-covering');
  overlay.classList.add('is-leaving');
  leaveTimer = setTimeout(() => resetWipe(overlay), WIPE_LEAVE_MS);
}

function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function installPageWipe(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener('astro:before-preparation', (event) => {
    if (prefersReducedMotion()) return;
    const overlay = document.getElementById('p5-wipe-overlay');
    if (!overlay) return;

    const preparation = event as Event & { loader: () => Promise<void> };
    const loadNextPage = preparation.loader;
    coverScreen(overlay);
    preparation.loader = async () => {
      await Promise.all([loadNextPage(), waitFor(WIPE_COVER_MS)]);
    };
  });

  document.addEventListener('astro:page-load', () => {
    const overlay = document.getElementById('p5-wipe-overlay');
    if (overlay) revealPage(overlay);
  });
}
