import {
  MOTION_DURATION,
  MOTION_EASE,
  ScrollTrigger,
  gsap,
  getNavClearanceOffset,
  jumpScrollTo,
  pauseScroll,
  resumeScroll,
  smoothScrollTo,
} from '../../utils/motion.ts';
import { CASE_REVEAL_ELEMENTS, createCaseSteps, elementOffsets } from './cases-reveal.ts';
import { typeText } from '../../utils/text-type-bind.ts';
import { bindCaseCubes } from './case-cubes-bind.ts';
import { SCROLL_TO_HASH_EVENT } from '../../utils/page-lifecycle.ts';

type Direction = 1 | -1;

// Wheel events closer together than this belong to one gesture (trackpad inertia, fast notches).
const GESTURE_GAP_MS = 180;
const SWIPE_MIN_PX = 40;
const PIN_SCROLL_PER_CASE = 0.5;
const KEY_DIRECTIONS: Readonly<Record<string, Direction>> = {
  ArrowDown: 1,
  PageDown: 1,
  ArrowUp: -1,
  PageUp: -1,
};

const REVEAL_RISE_PX = 28;
// A jump lands this far inside the pin, so a refresh that moves the pin start by a pixel still finds it pinned.
const PIN_ENTRY_NUDGE_PX = 6;
// Phones round the scroll to device pixels, so a jump to the exact pin edge can land short of it and stay pinned.
const PIN_EXIT_MARGIN_PX = 2;

function revealElementsOf(item: HTMLElement): HTMLElement[] {
  return CASE_REVEAL_ELEMENTS.flatMap((name) => {
    const element = item.querySelector<HTMLElement>(`[data-case-el="${name}"]`);
    return element ? [element] : [];
  });
}

function enableReveal(section: HTMLElement): (() => void) | null {
  const stage = section.querySelector<HTMLElement>('[data-cases-stage]');
  const list = section.querySelector<HTMLElement>('[data-cases-list]');
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-case-item]'));
  const nextButton = section.querySelector<HTMLButtonElement>('[data-cases-next]');
  if (!stage || !list || items.length === 0) return null;

  let revealTimeline: gsap.core.Timeline | null = null;

  const restoreStatic = () => {
    revealTimeline?.kill();
    revealTimeline = null;
    section.dataset.casesMode = 'static';
    section.style.removeProperty('--cases-clearance');
    delete section.dataset.casesPinned;
    if (nextButton) nextButton.hidden = true;
    items.forEach((item) => {
      delete item.dataset.caseActive;
      delete item.dataset.caseRevealed;
      gsap.set(revealElementsOf(item), { clearProps: 'opacity,visibility,transform' });
    });
  };

  section.style.setProperty('--cases-clearance', `${getNavClearanceOffset()}px`);
  section.dataset.casesMode = 'reveal';
  if (nextButton) nextButton.hidden = false;
  const everyCaseFits = items.every((item) => (item.firstElementChild as HTMLElement).offsetHeight <= list.clientHeight);
  if (!everyCaseFits) {
    restoreStatic();
    return null;
  }

  const steps = createCaseSteps(items.length);
  let locked = false;
  let lastWheelAt = Number.NEGATIVE_INFINITY;
  let touchStartY: number | null = null;
  let requestedIndex: number | null = null;
  const caseIndexOf = (hash: string) => (hash.startsWith('#case-') ? items.findIndex((item) => item.querySelector(`[id="${hash.slice(1)}"]`)) : -1);
  const hashIndex = caseIndexOf(decodeURIComponent(window.location.hash));
  if (hashIndex >= 0) requestedIndex = hashIndex;

  const markActive = (index: number) => {
    items.forEach((item, position) => {
      item.dataset.caseActive = String(position === index);
    });
    if (nextButton) nextButton.hidden = index === items.length - 1;
  };

  // A case the cubes assembled is already whole on screen, so it is shown as it stands, with no second reveal.
  const showAssembled = (index: number) => {
    revealTimeline?.kill();
    revealTimeline = null;
    markActive(index);
    gsap.set(revealElementsOf(items[index]), { autoAlpha: 1, y: 0 });
    items[index].dataset.caseRevealed = 'true';
  };

  const showCase = (index: number) => {
    revealTimeline?.kill();
    markActive(index);

    const active = items[index];
    const elements = revealElementsOf(active);
    const offsets = elementOffsets(elements.length, MOTION_DURATION.seconds);
    active.dataset.caseRevealed = 'false';
    const timeline = gsap.timeline({
      onComplete: () => {
        active.dataset.caseRevealed = 'true';
      },
    });
    elements.forEach((element, position) => {
      timeline.fromTo(
        element,
        { autoAlpha: 0, y: REVEAL_RISE_PX },
        { autoAlpha: 1, y: 0, duration: MOTION_DURATION.seconds, ease: MOTION_EASE.enter },
        offsets[position]
      );
      const typedBlocks = Array.from(element.querySelectorAll<HTMLElement>('[data-type]'));
      if (typedBlocks.length > 0) timeline.call(() => typedBlocks.forEach(typeText), undefined, offsets[position]);
    });
    revealTimeline = timeline;
  };

  const lock = (direction: number) => {
    locked = true;
    section.dataset.casesPinned = 'true';
    pauseScroll();
    if (requestedIndex !== null) {
      const index = requestedIndex;
      requestedIndex = null;
      showCase(steps.goTo(index).index);
      return;
    }
    showAssembled(steps.goTo(direction < 0 ? items.length - 1 : 0).index);
  };

  const release = () => {
    locked = false;
    resumeScroll();
    section.dataset.casesPinned = 'false';
  };

  showAssembled(0);
  const trigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top top',
    end: () => `+=${Math.round(window.innerHeight * PIN_SCROLL_PER_CASE) * items.length}`,
    pin: true,
    onToggle: (self) => {
      // Pausing or resuming Lenis emits a scroll that re-enters this callback before the toggle settles.
      if (self.isActive === locked) return;
      if (self.isActive) lock(self.direction);
      else release();
    },
  });

  // A jump from below the pin to above it crosses no toggle, so the section must still rewind to the first case.
  const rewindAbovePin = () => {
    if (locked || requestedIndex !== null || window.scrollY >= trigger.start || steps.index === 0) return;
    showAssembled(steps.goTo(0).index);
  };

  const step = (direction: Direction) => {
    const result = direction > 0 ? steps.next() : steps.previous();
    if (!result.done) {
      showCase(result.index);
      return;
    }
    jumpScrollTo(direction > 0 ? trigger.end + PIN_EXIT_MARGIN_PX : Math.max(0, trigger.start - PIN_EXIT_MARGIN_PX));
    ScrollTrigger.update();
  };

  const jumpToCase = (index: number) => {
    if (locked) {
      if (steps.index !== index) showCase(steps.goTo(index).index);
      return;
    }
    requestedIndex = index;
    jumpScrollTo(trigger.start + PIN_ENTRY_NUDGE_PX);
    ScrollTrigger.update();
    // A jump that lands inside the pin crosses no start, so the pin may be active without having toggled.
    const lockIfPinned = () => {
      if (!locked && trigger.isActive) lock(1);
    };
    lockIfPinned();
    requestAnimationFrame(lockIfPinned);
  };

  const onCaseLinkClick = (event: MouseEvent) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const href = (event.target as HTMLElement | null)?.closest('a[href^="#"]')?.getAttribute('href');
    if (href === `#${section.id}`) {
      event.preventDefault();
      if (window.location.hash !== href) history.replaceState(history.state, '', href);
      // The section link may be clicked from below the pin, where a smooth scroll would stop on the pin end.
      jumpToCase(0);
      return;
    }
    const index = href ? caseIndexOf(href) : -1;
    if (index < 0) return;
    event.preventDefault();
    if (locked) {
      showCase(steps.goTo(index).index);
      return;
    }
    requestedIndex = index;
    smoothScrollTo(trigger.start + PIN_ENTRY_NUDGE_PX, MOTION_DURATION.seconds);
  };

  const onScrollToHash = (event: Event) => {
    const index = caseIndexOf((event as CustomEvent<{ hash: string }>).detail.hash);
    if (index < 0) return;
    event.preventDefault();
    jumpToCase(index);
  };

  const acceptsInput = () => locked && !document.documentElement.classList.contains('cockpit-menu-open');

  const onWheel = (event: WheelEvent) => {
    const now = performance.now();
    const startsGesture = now - lastWheelAt > GESTURE_GAP_MS;
    lastWheelAt = now;
    if (!acceptsInput()) return;
    // Another scroll-lock owner (the menu) may have resumed Lenis while the section is still pinned.
    pauseScroll();
    event.preventDefault();
    event.stopPropagation();
    if (startsGesture && event.deltaY !== 0) step(event.deltaY > 0 ? 1 : -1);
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStartY = event.touches[0]?.clientY ?? null;
  };

  const onTouchMove = (event: TouchEvent) => {
    if (acceptsInput() && event.cancelable) event.preventDefault();
  };

  const onTouchEnd = (event: TouchEvent) => {
    const startY = touchStartY;
    touchStartY = null;
    if (startY === null || !acceptsInput()) return;
    const travelled = startY - (event.changedTouches[0]?.clientY ?? startY);
    if (Math.abs(travelled) >= SWIPE_MIN_PX) step(travelled > 0 ? 1 : -1);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const direction = KEY_DIRECTIONS[event.key];
    if (!direction || !acceptsInput()) return;
    event.preventDefault();
    step(direction);
  };

  window.addEventListener('scroll', rewindAbovePin, { passive: true });
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown);
  const onNextClick = () => step(1);
  nextButton?.addEventListener('click', onNextClick);
  document.addEventListener('click', onCaseLinkClick, { capture: true });
  window.addEventListener(SCROLL_TO_HASH_EVENT, onScrollToHash);

  const cardOf = (item: HTMLElement) => item.querySelector<HTMLElement>('[data-reveal-case]') as HTMLElement;
  const unbindCubes = bindCaseCubes({
    stage,
    firstCard: cardOf(items[0]),
    lastCard: cardOf(items[items.length - 1]),
    pinEnd: () => trigger.end,
  });

  return () => {
    unbindCubes();
    window.removeEventListener('scroll', rewindAbovePin);
    window.removeEventListener('wheel', onWheel, { capture: true });
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKeyDown);
    nextButton?.removeEventListener('click', onNextClick);
    document.removeEventListener('click', onCaseLinkClick, { capture: true });
    window.removeEventListener(SCROLL_TO_HASH_EVENT, onScrollToHash);
    trigger.kill();
    if (locked) release();
    restoreStatic();
  };
}

function bindJumpCutBadge(section: HTMLElement): () => void {
  const strip = section.querySelector<HTMLElement>('[data-tank-strip]');
  const badge = section.querySelector<HTMLElement>('[data-jump-cut-badge]');
  if (!strip || !badge) return () => {};
  const tween = gsap.fromTo(
    badge,
    { scale: 0.88 },
    {
      scrollTrigger: { trigger: strip, start: 'top 90%', end: 'top 50%', scrub: 0.6 },
      scale: 1,
      ease: 'power3.out',
      force3D: true,
    }
  );
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(badge, { clearProps: 'transform' });
  };
}

/** Turns the static cases list into the pinned reveal; the returned function restores the static list. */
export function bindCasesReveal(section: HTMLElement): () => void {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return () => {};

  const unbindBadge = bindJumpCutBadge(section);
  let disableReveal = enableReveal(section);
  let lastWidth = window.innerWidth;
  let destroyed = false;

  const onResize = () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    disableReveal?.();
    disableReveal = enableReveal(section);
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    window.removeEventListener('resize', onResize);
    reducedMotion.removeEventListener('change', onMotionPreference);
    disableReveal?.();
    disableReveal = null;
    unbindBadge();
  };

  function onMotionPreference(event: MediaQueryListEvent) {
    if (event.matches) destroy();
  }

  window.addEventListener('resize', onResize);
  reducedMotion.addEventListener('change', onMotionPreference);
  return destroy;
}
