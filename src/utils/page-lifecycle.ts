import { ScrollTrigger, getNavClearanceOffset, jumpScrollTo } from './motion.ts';
import { applyDomTranslations, getLocale } from '../i18n/index.ts';

type Teardown = () => void;

const BEFORE_SWAP_TEARDOWNS = new Set<Teardown>();
let routerLifecycleInstalled = false;
let lastNavigationType: string | null = null;

export function onPageReady(init: () => void | Teardown): void {
  let initializedBody: HTMLElement | null = null;
  let activeTeardown: Teardown | null = null;

  const run = () => {
    if (initializedBody === document.body) return;
    initializedBody = document.body;
    const teardown = init();
    if (typeof teardown === 'function') {
      activeTeardown = teardown;
      BEFORE_SWAP_TEARDOWNS.add(teardown);
    }
  };

  const release = () => {
    if (!activeTeardown) return;
    activeTeardown();
    BEFORE_SWAP_TEARDOWNS.delete(activeTeardown);
    activeTeardown = null;
  };

  document.addEventListener('astro:before-swap', release);
  document.addEventListener('astro:page-load', run);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run, { once: true });
  } else {
    run();
  }
}

export function scrollToHashBelowNav(hash: string): boolean {
  if (!hash || hash.length <= 1) return false;
  let target: HTMLElement | null = null;
  try {
    target = document.querySelector<HTMLElement>(decodeURIComponent(hash));
  } catch {
    return false;
  }
  if (!target) return false;
  jumpScrollTo(Math.max(0, window.scrollY + target.getBoundingClientRect().top - getNavClearanceOffset()));
  return true;
}

function settleScrollAfterNavigation(): void {
  if (lastNavigationType === 'traverse') return;
  const apply = () => {
    if (!scrollToHashBelowNav(window.location.hash)) {
      if (!window.location.hash) jumpScrollTo(0);
    }
  };
  if (document.getElementById('intro-preloader')) {
    window.addEventListener('intro-complete', apply, { once: true });
    return;
  }
  apply();
}

export function installRouterLifecycle(): void {
  if (routerLifecycleInstalled || typeof document === 'undefined') return;
  routerLifecycleInstalled = true;

  let htmlSnapshot: { className: string; cssText: string } | null = null;

  document.addEventListener('astro:before-preparation', (event) => {
    lastNavigationType = (event as Event & { navigationType?: string }).navigationType ?? null;
  });

  document.addEventListener('astro:before-swap', (event) => {
    const incoming = (event as Event & { newDocument: Document }).newDocument;
    incoming.getElementById('intro-preloader')?.remove();
    htmlSnapshot = {
      className: document.documentElement.className,
      cssText: document.documentElement.style.cssText,
    };
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  });

  document.addEventListener('astro:after-swap', () => {
    if (htmlSnapshot) {
      document.documentElement.className = htmlSnapshot.className;
      document.documentElement.style.cssText = htmlSnapshot.cssText;
      htmlSnapshot = null;
    }
    applyDomTranslations(getLocale());
  });

  document.addEventListener('astro:page-load', settleScrollAfterNavigation);
}
