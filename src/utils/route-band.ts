import { MOTION_DURATION, MOTION_EASE, ROUTE_BAND_TIMING, gsap } from './motion.ts';
import { getLocale } from '../i18n/index.ts';
import type { Locale } from '../i18n/dictionaries.ts';
import { isCaseRoute, routeBandTitle } from '../data/route-titles.ts';

const PHASES = ['is-in', 'is-covered', 'is-out'] as const;
type Phase = (typeof PHASES)[number];

let installed = false;
let exitTimer: ReturnType<typeof setTimeout> | null = null;

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const findBand = (doc: Document = document) => doc.getElementById('route-band');

function paintBand(band: HTMLElement, pathname: string, locale: Locale): void {
  const title = routeBandTitle(pathname, locale);
  const name = band.querySelector<HTMLElement>('[data-route-band-name]');
  if (name) {
    name.textContent = title;
    name.style.setProperty('--chars', String(title.length));
  }
}

function setPhase(band: HTMLElement, phase: Phase | null): void {
  band.classList.remove(...PHASES);
  if (!phase) return;
  void band.offsetWidth;
  band.classList.add(phase);
}

function finishExit(band: HTMLElement): void {
  if (exitTimer) clearTimeout(exitTimer);
  exitTimer = setTimeout(() => setPhase(band, null), ROUTE_BAND_TIMING.exitMs);
}

export function installRouteBand(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener('astro:before-preparation', (event) => {
    const preparation = event as Event & { from: URL; to: URL; loader: () => Promise<void> };
    if (
      prefersReducedMotion() ||
      preparation.to.pathname === preparation.from.pathname ||
      (isCaseRoute(preparation.from.pathname) && isCaseRoute(preparation.to.pathname))
    ) {
      return;
    }
    const band = findBand();
    if (!band) return;
    if (exitTimer) clearTimeout(exitTimer);
    paintBand(band, preparation.to.pathname, getLocale());
    setPhase(band, 'is-in');
    const loadNextPage = preparation.loader;
    preparation.loader = async () => {
      await Promise.all([loadNextPage(), new Promise((resolve) => setTimeout(resolve, ROUTE_BAND_TIMING.coverMs))]);
    };
  });

  document.addEventListener('astro:before-swap', (event) => {
    const swap = event as Event & { to: URL; newDocument: Document };
    if (!findBand()?.classList.contains('is-in')) return;
    const next = findBand(swap.newDocument);
    if (!next) return;
    paintBand(next, swap.to.pathname, getLocale());
    next.classList.remove(...PHASES);
    next.classList.add('is-covered');
  });

  document.addEventListener('astro:page-load', () => {
    const band = findBand();
    if (!band) return;
    if (band.classList.contains('is-covered')) setPhase(band, 'is-out');
    if (band.classList.contains('is-out')) finishExit(band);
  });
}

const ENTRY_RISE_PX = 28;

export function enterRoute(content: HTMLElement): void {
  const band = findBand();
  const bandInFlight = band?.classList.contains('is-covered') || band?.classList.contains('is-out');
  if (!bandInFlight || prefersReducedMotion()) return;
  gsap.fromTo(
    content,
    { opacity: 0, y: ENTRY_RISE_PX },
    { opacity: 1, y: 0, duration: MOTION_DURATION.seconds, ease: MOTION_EASE.enter, clearProps: 'opacity,transform' }
  );
}
