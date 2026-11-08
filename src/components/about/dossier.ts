import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { gsap, ScrollTrigger, p5Snap } from '../../utils/motion';
import { getLocalizedCareer } from '../../data/career';
import { LOCALE_CHANGE_EVENT, getLocale, type Locale } from '../../i18n';

gsap.registerPlugin(ScrambleTextPlugin);

const WIPE_FROM = 'polygon(0% 0%, 0% 0%, -14% 100%, 0% 100%)';
const WIPE_DURATION_S = 0.7;
const WIPE_STAGGER_S = 0.18;
const DECODE_DURATION_S = 0.9;

type DecodeField = 'period' | 'org';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fieldText(careerId: string, field: DecodeField, locale: Locale): string | null {
  const entry = getLocalizedCareer(locale).find((item) => item.id === careerId);
  return entry ? entry[field] : null;
}

export function initDossier(root: HTMLElement): void {
  if (root.dataset.dossierBound === 'true') return;
  root.dataset.dossierBound = 'true';
  if (prefersReducedMotion()) return;

  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-about-card]'));
  const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-career-entry]'));
  const active = new Map<HTMLElement, gsap.core.Tween>();

  const markDecoding = (el: HTMLElement, finalText: string) => {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', finalText);
  };
  const clearDecoding = (el: HTMLElement) => {
    el.removeAttribute('role');
    el.removeAttribute('aria-label');
  };

  const decode = (step: HTMLElement) => {
    const careerId = step.id.replace('career-', '');
    (['period', 'org'] as const).forEach((field) => {
      const el = step.querySelector<HTMLElement>(`[data-career-${field}]`);
      if (!el || el.dataset.decoded === 'true') return;
      el.dataset.decoded = 'true';
      const finalText = (el.textContent ?? '').trim();
      markDecoding(el, finalText);
      const tween = gsap.to(el, {
        duration: DECODE_DURATION_S,
        ease: 'none',
        scrambleText: { text: finalText, chars: 'upperCase', speed: 0.6 },
        onComplete: () => {
          el.textContent = finalText;
          clearDecoding(el);
          active.delete(el);
        },
      });
      active.set(el, tween);
    });
  };

  gsap.set(cards, { clipPath: WIPE_FROM, opacity: 1 });
  const rest = cards.map((card) => {
    gsap.set(card, { clearProps: 'clipPath' });
    const value = getComputedStyle(card).clipPath;
    gsap.set(card, { clipPath: WIPE_FROM });
    return value;
  });

  ScrollTrigger.create({
    trigger: root,
    start: 'top 75%',
    once: true,
    onEnter: () => {
      cards.forEach((card, index) => {
        gsap.to(card, {
          clipPath: rest[index],
          duration: WIPE_DURATION_S,
          delay: index * WIPE_STAGGER_S,
          ease: p5Snap,
          clearProps: 'clipPath',
        });
      });
    },
  });

  steps.forEach((step) => {
    ScrollTrigger.create({ trigger: step, start: 'top 85%', once: true, onEnter: () => decode(step) });
  });

  window.addEventListener(LOCALE_CHANGE_EVENT, () => {
    const locale = getLocale();
    active.forEach((tween, el) => {
      tween.kill();
      const step = el.closest<HTMLElement>('[data-career-entry]');
      const field: DecodeField = el.hasAttribute('data-career-period') ? 'period' : 'org';
      const text = step ? fieldText(step.id.replace('career-', ''), field, locale) : null;
      if (text !== null) el.textContent = text;
      clearDecoding(el);
    });
    active.clear();
  });
}
