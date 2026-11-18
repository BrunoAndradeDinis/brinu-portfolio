import { MOTION_EASE, gsap } from '../../utils/motion.ts';
import { isCaseRoute } from '../../data/route-titles.ts';
import { typeText } from '../../utils/text-type-bind.ts';

export const CARD_CLIP_FULL = 'polygon(0% 1.5%, 3% 0%, 100% 0.8%, 99.4% 100%, 2% 99%)';
export const CARD_CLIP_COLLAPSED = 'polygon(0% 1.5%, 0% 0%, 0% 0.8%, 0% 100%, 0% 99%)';

export const SHOWCASE_EXIT_STEPS = ['bar', 'copy', 'second', 'media', 'rail', 'site'] as const;
export const SHOWCASE_ENTER_STEPS = ['rail', 'name', 'media', 'second', 'sticker', 'site', 'bar', 'copy'] as const;

interface ShowcaseParts {
  readonly rail: HTMLElement | null;
  readonly banner: HTMLElement | null;
  readonly names: HTMLElement[];
  readonly firstCard: HTMLElement | null;
  readonly secondCard: HTMLElement | null;
  readonly sticker: HTMLElement | null;
  readonly site: HTMLElement | null;
  readonly position: HTMLElement | null;
  readonly barStack: HTMLElement[];
  readonly copyItems: HTMLElement[];
}

function collectParts(showcase: HTMLElement): ShowcaseParts {
  const noteLine = showcase.querySelector<HTMLElement>('[data-showcase-note-line]');
  const otherCopy = Array.from(
    showcase.querySelectorAll<HTMLElement>(
      '[data-showcase-copy-title], [data-showcase-kicker], [data-showcase-lead], [data-showcase-chip]'
    )
  );
  const noteTarget = noteLine ?? showcase.querySelector<HTMLElement>('[data-showcase-note]');

  return {
    rail: showcase.querySelector<HTMLElement>('[data-showcase-rail]'),
    banner: showcase.querySelector<HTMLElement>('[data-showcase-banner]'),
    names: Array.from(showcase.querySelectorAll<HTMLElement>('[data-showcase-name]')),
    firstCard: showcase.querySelector<HTMLElement>('[data-showcase-card="media"]'),
    secondCard: showcase.querySelector<HTMLElement>('[data-showcase-card="second"]'),
    sticker: showcase.querySelector<HTMLElement>('[data-showcase-sticker]'),
    site: showcase.querySelector<HTMLElement>('[data-showcase-site]'),
    position: showcase.querySelector<HTMLElement>('[data-showcase-position]'),
    barStack: Array.from(showcase.querySelectorAll<HTMLElement>('[data-showcase-bar-stack]')),
    copyItems: noteTarget ? [...otherCopy, noteTarget] : otherCopy,
  };
}

function isDisplayed(node: HTMLElement | null): node is HTMLElement {
  if (!node) return false;
  if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') return true;
  return window.getComputedStyle(node).display !== 'none';
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function resetShowcaseStyles(showcase: HTMLElement): void {
  const parts = collectParts(showcase);
  const all = [
    parts.rail,
    parts.banner,
    ...parts.names,
    parts.firstCard,
    parts.secondCard,
    parts.sticker,
    parts.site,
    parts.position,
    ...parts.barStack,
    ...parts.copyItems,
  ].filter((node): node is HTMLElement => node !== null);

  gsap.killTweensOf(all);
  gsap.set(all, { clearProps: 'transform,transformOrigin,clipPath,opacity,visibility' });
  showcase.dataset.showcaseTransition = 'idle';
}

export function prepareShowcaseEnter(showcase: HTMLElement): void {
  const parts = collectParts(showcase);
  showcase.dataset.showcaseTransition = 'entering';

  if (parts.rail) {
    parts.rail.style.transformOrigin = 'left center';
    parts.rail.style.transform = 'scaleX(0)';
  }
  if (parts.banner) {
    parts.banner.style.clipPath = 'inset(0% 100% 0% 0%)';
  }
  parts.names.forEach((node) => {
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
  });
  if (parts.firstCard) {
    parts.firstCard.style.clipPath = CARD_CLIP_COLLAPSED;
  }
  if (parts.secondCard) {
    parts.secondCard.style.clipPath = CARD_CLIP_COLLAPSED;
  }
  if (parts.sticker) {
    parts.sticker.style.opacity = '0';
    parts.sticker.style.visibility = 'hidden';
    parts.sticker.style.transform = 'scale(0.55)';
  }
  if (parts.site) {
    parts.site.style.opacity = '0';
    parts.site.style.visibility = 'hidden';
    parts.site.style.transform = 'translateX(105%)';
  }
  if (parts.position) {
    parts.position.style.opacity = '0';
    parts.position.style.visibility = 'hidden';
    parts.position.style.transform = 'translateX(-16px)';
  }
  parts.barStack.forEach((node) => {
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.transform = 'translateX(-18px)';
    node.style.clipPath = 'inset(0% 100% 0% 0%)';
  });
  parts.copyItems.forEach((node) => {
    node.style.opacity = '0';
    node.style.visibility = 'hidden';
    node.style.transform = 'translateY(18px)';
  });
}

let activeExit: { timeline: gsap.core.Timeline; resolve: () => void } | null = null;
let activeEnter: { timeline: gsap.core.Timeline; showcase: HTMLElement } | null = null;
let pendingCaseEnter = false;
let installed = false;

function cancelActiveExit(): void {
  if (!activeExit) return;
  const current = activeExit;
  activeExit = null;
  current.timeline.kill();
  current.resolve();
}

function cancelActiveEnter(): void {
  if (!activeEnter) return;
  const current = activeEnter;
  activeEnter = null;
  current.timeline.kill();
  resetShowcaseStyles(current.showcase);
}

export function exitShowcase(showcase: HTMLElement): Promise<void> {
  cancelActiveExit();
  cancelActiveEnter();

  if (prefersReducedMotion()) {
    showcase.dataset.showcaseTransition = 'idle';
    return Promise.resolve();
  }

  const parts = collectParts(showcase);
  showcase.dataset.showcaseTransition = 'exiting';

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (activeExit?.timeline === timeline) activeExit = null;
      resolve();
    };

    const timeline = gsap.timeline({ onComplete: finish });
    activeExit = { timeline, resolve: finish };

    const visibleStackReversed = parts.barStack.filter(isDisplayed).reverse();
    for (const item of visibleStackReversed) {
      timeline.to(
        item,
        { x: -18, clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 0, duration: 0.08, ease: MOTION_EASE.fade },
        '>'
      );
    }
    if (isDisplayed(parts.position)) {
      timeline.to(parts.position, { x: -16, autoAlpha: 0, duration: 0.08, ease: MOTION_EASE.fade }, '>');
    }

    const visibleCopyReversed = parts.copyItems.filter(isDisplayed).reverse();
    if (visibleCopyReversed.length > 0) {
      timeline.to(
        visibleCopyReversed,
        { y: 16, autoAlpha: 0, duration: 0.1, stagger: 0.06, ease: MOTION_EASE.fade },
        0
      );
    }

    if (parts.sticker) {
      timeline.to(parts.sticker, { scale: 0.55, autoAlpha: 0, duration: 0.16, ease: MOTION_EASE.fade }, 0.04);
    }
    if (parts.secondCard) {
      timeline.fromTo(
        parts.secondCard,
        { clipPath: CARD_CLIP_FULL },
        { clipPath: CARD_CLIP_COLLAPSED, duration: 0.2, ease: MOTION_EASE.enter },
        0.06
      );
    }

    if (parts.firstCard) {
      timeline.fromTo(
        parts.firstCard,
        { clipPath: CARD_CLIP_FULL },
        { clipPath: CARD_CLIP_COLLAPSED, duration: 0.22, ease: MOTION_EASE.enter },
        '>'
      );
    }

    if (parts.names.length > 0) {
      timeline.to(parts.names, { autoAlpha: 0, duration: 0.12, ease: MOTION_EASE.fade }, '>');
    }
    if (isDisplayed(parts.rail)) {
      timeline.to(
        parts.rail,
        { scaleX: 0, transformOrigin: 'left center', duration: 0.18, ease: MOTION_EASE.enter },
        '<'
      );
    }
    if (isDisplayed(parts.banner)) {
      timeline.fromTo(
        parts.banner,
        { clipPath: 'inset(0% 0% 0% 0%)' },
        { clipPath: 'inset(0% 100% 0% 0%)', duration: 0.18, ease: MOTION_EASE.enter },
        '<'
      );
    }

    if (parts.site) {
      timeline.to(parts.site, { xPercent: 105, autoAlpha: 0, duration: 0.16, ease: MOTION_EASE.enter }, '<0.04');
    }
  });
}

export function enterShowcase(showcase: HTMLElement): gsap.core.Timeline {
  cancelActiveEnter();

  if (prefersReducedMotion()) {
    resetShowcaseStyles(showcase);
    return gsap.timeline();
  }

  const parts = collectParts(showcase);
  showcase.dataset.showcaseTransition = 'entering';

  const timeline = gsap.timeline({
    onComplete: () => {
      if (activeEnter?.timeline === timeline) activeEnter = null;
      resetShowcaseStyles(showcase);
    },
  });
  activeEnter = { timeline, showcase };

  if (isDisplayed(parts.rail)) {
    timeline.fromTo(
      parts.rail,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 0.2, ease: MOTION_EASE.enter, clearProps: 'transform,transformOrigin' },
      0
    );
  }
  if (isDisplayed(parts.banner)) {
    timeline.fromTo(
      parts.banner,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.2, ease: MOTION_EASE.enter, clearProps: 'clipPath' },
      0
    );
  }
  if (parts.names.length > 0) {
    timeline.fromTo(
      parts.names,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.16, ease: MOTION_EASE.fade, clearProps: 'opacity,visibility' },
      '>-0.06'
    );
    timeline.call(() => parts.names.forEach(typeText), undefined, '<');
  }

  if (parts.firstCard) {
    timeline.fromTo(
      parts.firstCard,
      { clipPath: CARD_CLIP_COLLAPSED },
      { clipPath: CARD_CLIP_FULL, duration: 0.24, ease: MOTION_EASE.enter, clearProps: 'clipPath' },
      '>'
    );
  }

  if (parts.secondCard) {
    timeline.fromTo(
      parts.secondCard,
      { clipPath: CARD_CLIP_COLLAPSED },
      { clipPath: CARD_CLIP_FULL, duration: 0.22, ease: MOTION_EASE.enter, clearProps: 'clipPath' },
      '>'
    );
  }
  if (parts.sticker) {
    timeline.fromTo(
      parts.sticker,
      { scale: 0.55, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.18, ease: 'p5Overshoot', clearProps: 'transform,opacity,visibility' },
      '>-0.06'
    );
  }

  if (parts.site) {
    timeline.fromTo(
      parts.site,
      { xPercent: 105, autoAlpha: 0 },
      { xPercent: 0, autoAlpha: 1, duration: 0.18, ease: MOTION_EASE.enter, clearProps: 'transform,opacity,visibility' },
      '<'
    );
  }

  const visibleCopy = parts.copyItems.filter(isDisplayed);
  if (visibleCopy.length > 0) {
    timeline.fromTo(
      visibleCopy,
      { y: 18, autoAlpha: 0 },
      {
        y: 0,
        autoAlpha: 1,
        duration: 0.14,
        stagger: 0.08,
        ease: MOTION_EASE.enter,
        clearProps: 'transform,opacity,visibility',
      },
      '>'
    );
  }

  if (isDisplayed(parts.position)) {
    timeline.fromTo(
      parts.position,
      { x: -16, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.12, ease: MOTION_EASE.enter, clearProps: 'transform,opacity,visibility' },
      '<'
    );
  }

  const visibleStack = parts.barStack.filter(isDisplayed);
  for (const item of visibleStack) {
    timeline.fromTo(
      item,
      { x: -18, clipPath: 'inset(0% 100% 0% 0%)', autoAlpha: 0 },
      {
        x: 0,
        clipPath: 'inset(0% 0% 0% 0%)',
        autoAlpha: 1,
        duration: 0.12,
        ease: MOTION_EASE.enter,
        clearProps: 'transform,clipPath,opacity,visibility',
      },
      '>'
    );
  }

  return timeline;
}

export function installShowcaseTransition(): void {
  if (installed || typeof document === 'undefined') return;
  installed = true;

  document.addEventListener('astro:before-preparation', (event) => {
    const preparation = event as Event & { from: URL; to: URL; loader: () => Promise<void> };
    const caseToCase =
      !prefersReducedMotion() &&
      preparation.to.pathname !== preparation.from.pathname &&
      isCaseRoute(preparation.from.pathname) &&
      isCaseRoute(preparation.to.pathname);

    if (!caseToCase) {
      cancelActiveExit();
      cancelActiveEnter();
      pendingCaseEnter = false;
      return;
    }

    const showcase = document.querySelector<HTMLElement>('[data-showcase]');
    if (!showcase) return;

    pendingCaseEnter = true;
    const loadNextPage = preparation.loader;
    const exitPromise = exitShowcase(showcase);
    preparation.loader = async () => {
      await Promise.all([loadNextPage(), exitPromise]);
    };
  });

  document.addEventListener('astro:before-swap', (event) => {
    const swap = event as Event & { to: URL; newDocument: Document };
    if (!pendingCaseEnter || prefersReducedMotion() || !isCaseRoute(swap.to.pathname)) return;
    const nextShowcase = swap.newDocument.querySelector<HTMLElement>('[data-showcase]');
    if (nextShowcase) prepareShowcaseEnter(nextShowcase);
  });

  document.addEventListener('astro:page-load', () => {
    if (!pendingCaseEnter) return;
    pendingCaseEnter = false;
    const showcase = document.querySelector<HTMLElement>('[data-showcase]');
    if (showcase) enterShowcase(showcase);
  });
}
