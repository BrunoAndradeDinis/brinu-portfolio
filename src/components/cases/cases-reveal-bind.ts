import {
  ScrollTrigger,
  gsap,
  getNavClearanceOffset,
  jumpScrollTo,
  pauseScroll,
  resumeScroll,
} from '../../utils/motion.ts';
import { createCaseSteps } from './cases-reveal.ts';

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

const rootClasses = () => document.documentElement.classList;

function enableReveal(section: HTMLElement): (() => void) | null {
  const stage = section.querySelector<HTMLElement>('[data-cases-stage]');
  const list = section.querySelector<HTMLElement>('[data-cases-list]');
  const items = Array.from(section.querySelectorAll<HTMLElement>('[data-case-item]'));
  if (!stage || !list || items.length === 0) return null;

  const restoreStatic = () => {
    section.dataset.casesMode = 'static';
    section.style.removeProperty('--cases-clearance');
    delete section.dataset.casesPinned;
    items.forEach((item) => delete item.dataset.caseActive);
  };

  section.style.setProperty('--cases-clearance', `${getNavClearanceOffset()}px`);
  section.dataset.casesMode = 'reveal';
  const everyCaseFits = items.every((item) => (item.firstElementChild as HTMLElement).offsetHeight <= list.clientHeight);
  if (!everyCaseFits) {
    restoreStatic();
    return null;
  }

  const steps = createCaseSteps(items.length);
  let locked = false;
  let lastWheelAt = Number.NEGATIVE_INFINITY;
  let touchStartY: number | null = null;

  const showCase = (index: number) => {
    items.forEach((item, position) => {
      item.dataset.caseActive = String(position === index);
    });
  };

  const lock = (direction: number) => {
    locked = true;
    section.dataset.casesPinned = 'true';
    pauseScroll();
    showCase(steps.goTo(direction < 0 ? items.length - 1 : 0).index);
  };

  const release = () => {
    locked = false;
    resumeScroll();
    section.dataset.casesPinned = 'false';
  };

  showCase(0);
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

  const step = (direction: Direction) => {
    const result = direction > 0 ? steps.next() : steps.previous();
    if (!result.done) {
      showCase(result.index);
      return;
    }
    jumpScrollTo(direction > 0 ? trigger.end : Math.max(0, trigger.start - 1));
    ScrollTrigger.update();
  };

  const acceptsInput = () => locked && !rootClasses().contains('cockpit-menu-open');

  const onWheel = (event: WheelEvent) => {
    const now = performance.now();
    const startsGesture = now - lastWheelAt > GESTURE_GAP_MS;
    lastWheelAt = now;
    if (!acceptsInput()) return;
    // Another scroll-lock owner (the menu) may have resumed Lenis while the section is still pinned.
    if (!rootClasses().contains('lenis-stopped')) pauseScroll();
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

  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchmove', onTouchMove, { passive: false });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('keydown', onKeyDown);

  return () => {
    window.removeEventListener('wheel', onWheel, { capture: true });
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchmove', onTouchMove);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('keydown', onKeyDown);
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
    { scale: 0.88, opacity: 0.7 },
    {
      scrollTrigger: { trigger: strip, start: 'top 90%', end: 'top 50%', scrub: 0.6 },
      scale: 1,
      opacity: 1,
      ease: 'power3.out',
      force3D: true,
    }
  );
  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    gsap.set(badge, { clearProps: 'transform,opacity' });
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
