import { gsap, registerP5Eases } from '../../utils/motion.ts';
import { getLocalizedHobbies } from '../../data/hobbies.ts';
import { getLocale, LOCALE_CHANGE_EVENT, type Locale } from '../../i18n/index.ts';
import { renderRansomTitleDom } from '../p5/ransom.ts';

export const SCENE_SECONDS = 10;

const WIPE_SECONDS = 0.4;
const HIDDEN_WIPE = 'polygon(0% 0%, 0% 0%, -30% 100%, -30% 100%)';
const COVER_WIPE = 'polygon(0% 0%, 130% 0%, 100% 100%, -30% 100%)';
const EXIT_WIPE = 'polygon(130% 0%, 130% 0%, 100% 100%, 100% 100%)';

type Teardown = () => void;

function addDetail(timeline: gsap.core.Timeline, scene: HTMLElement, at: number): void {
  const all = (selector: string) => Array.from(scene.querySelectorAll<SVGElement>(selector));
  const one = (selector: string) => scene.querySelector<SVGElement>(selector);
  const live = SCENE_SECONDS - 1;
  const svgOrigin = { transformOrigin: '50% 50%' };

  const stars = all('[data-fm-star]');
  if (stars.length) {
    timeline.fromTo(stars, { opacity: 0.2 }, { opacity: 1, duration: 0.5, ease: 'sine.inOut', stagger: { each: 0.08, repeat: 15, yoyo: true } }, at);
    const comet = one('[data-fm-comet]');
    if (comet) timeline.fromTo(comet, { x: -260, y: -60, opacity: 0 }, { x: 60, y: 40, opacity: 1, duration: 1.4, ease: 'power2.in', repeat: 2, repeatDelay: 1.6 }, at + 1.2);
  }

  const vinyl = one('[data-fm-vinyl]');
  if (vinyl) timeline.fromTo(vinyl, { rotation: 0, ...svgOrigin }, { rotation: 360 * 6, duration: live, ease: 'none' }, at);
  const bars = all('[data-fm-bar]');
  if (bars.length) {
    timeline.fromTo(bars, { scaleY: 0.25, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.3, ease: 'power2.inOut', stagger: { each: 0.05, repeat: 25, yoyo: true } }, at);
  }

  const flames = all('[data-fm-flame]');
  if (flames.length) {
    timeline.fromTo(flames, { scaleY: 0.82, scaleX: 1.06, transformOrigin: '50% 100%' }, { scaleY: 1.12, scaleX: 0.94, duration: 0.18, ease: 'sine.inOut', stagger: { each: 0.09, repeat: 45, yoyo: true } }, at);
  }
  const strings = all('[data-fm-string]');
  if (strings.length) {
    timeline.fromTo(strings, { y: -1.5 }, { y: 1.5, duration: 0.06, ease: 'none', stagger: { each: 0.03, repeat: 60, yoyo: true } }, at + 2);
  }

  const deck = one('[data-fm-deck]');
  if (deck) {
    for (let flip = 0; flip < 3; flip += 1) {
      const start = at + 1.6 + flip * 2.6;
      timeline
        .to(deck, { y: -70, rotation: -12, duration: 0.35, ease: 'power2.out', ...svgOrigin }, start)
        .to(deck, { scaleY: -1, duration: 0.18, ease: 'none', yoyo: true, repeat: 1 }, start + 0.05)
        .to(deck, { y: 0, rotation: 0, duration: 0.35, ease: 'power2.in' }, start + 0.38);
    }
  }
  const speed = one('[data-fm-speed]');
  if (speed) timeline.fromTo(speed, { x: 30, opacity: 0 }, { x: -20, opacity: 1, duration: 0.6, ease: 'power1.out', repeat: 7, yoyo: true }, at + 1);

  const cells = all('[data-fm-cell]');
  if (cells.length) {
    timeline.fromTo(cells, { scale: 0.2, opacity: 0.2, ...svgOrigin }, { scale: 1, opacity: 1, duration: 0.25, ease: 'p5Overshoot', stagger: { each: 0.12, from: 'random', repeat: 7, yoyo: true, repeatDelay: 0.2 } }, at + 0.6);
  }
  const level = one('[data-fm-lvl]');
  if (level) timeline.fromTo(level, { scale: 0, rotation: -8, ...svgOrigin }, { scale: 1, rotation: 4, duration: 0.5, ease: 'p5Overshoot' }, at + 4.5);

  const sun = one('[data-fm-sun]');
  if (sun) timeline.fromTo(sun, { y: 60 }, { y: 0, duration: 3, ease: 'power2.out' }, at);
  const falls = all('[data-fm-fall]');
  if (falls.length) timeline.fromTo(falls, { strokeDashoffset: 0 }, { strokeDashoffset: -240, duration: live, ease: 'none' }, at);
}

function addScene(timeline: gsap.core.Timeline, scene: HTMLElement, index: number, scenes: HTMLElement[], wipes: HTMLElement[], channel: HTMLElement | null): void {
  const at = index * SCENE_SECONDS;
  const label = `CH ${String(index + 1).padStart(2, '0')}/${String(scenes.length).padStart(2, '0')}`;
  const sticker = scene.querySelector<HTMLElement>('[data-fm-sticker]');
  const name = scene.querySelector<HTMLElement>('[data-fm-name]');
  const tag = scene.querySelector<HTMLElement>('[data-fm-tag]');
  const ticker = scene.querySelector<HTMLElement>('[data-fm-ticker]');
  const detail = scene.querySelector<SVGElement>('.fm-detail');

  timeline.call(() => {
    scenes.forEach((other) => {
      other.style.visibility = other === scene ? 'visible' : 'hidden';
    });
    if (channel) channel.textContent = label;
  }, undefined, at);
  timeline.fromTo(wipes.slice().reverse(), { clipPath: COVER_WIPE }, { clipPath: EXIT_WIPE, duration: WIPE_SECONDS, ease: 'power3.in', stagger: 0.12 }, at);

  if (detail) timeline.fromTo(detail, { opacity: 0, x: 40 }, { opacity: 1, x: 0, duration: 0.5, ease: 'p5Snap' }, at + 0.15);
  if (name) timeline.fromTo(name, { opacity: 0, x: -50, skewX: -12 }, { opacity: 1, x: 0, skewX: 0, duration: 0.45, ease: 'p5Snap' }, at + 0.2);
  if (sticker) {
    timeline.fromTo(sticker, { scale: 0.2, rotation: -24, opacity: 0 }, { scale: 1, rotation: -4, opacity: 1, duration: 0.7, ease: 'p5Overshoot' }, at + 0.35);
    timeline.to(sticker, { y: -10, rotation: 3, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: 4 }, at + 1.1);
  }
  if (tag) timeline.fromTo(tag, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'p5Snap' }, at + 0.55);
  if (ticker) timeline.fromTo(ticker, { xPercent: 0 }, { xPercent: -45, duration: SCENE_SECONDS, ease: 'none' }, at);

  addDetail(timeline, scene, at);

  timeline.fromTo(wipes, { clipPath: HIDDEN_WIPE }, { clipPath: COVER_WIPE, duration: WIPE_SECONDS, ease: 'power3.out', stagger: 0.12, immediateRender: false }, at + SCENE_SECONDS - WIPE_SECONDS - 0.12);
}

function localize(root: HTMLElement, locale: Locale): void {
  getLocalizedHobbies(locale).forEach((hobby) => {
    const scene = root.querySelector<HTMLElement>(`[data-fm-scene="${hobby.id}"]`);
    if (!scene) return;
    const name = scene.querySelector<HTMLElement>('[data-fm-name]');
    if (name) renderRansomTitleDom(name, hobby.name, { reveal: true });
    const position = scene.querySelector<HTMLElement>('[data-fm-position]');
    if (position) position.textContent = `${hobby.position.code} // ${hobby.position.label}`;
    const ticker = scene.querySelector<HTMLElement>('[data-fm-ticker]');
    if (ticker) ticker.textContent = hobby.stats.map((stat) => stat.label).join('  ✦  ');
  });
}

/** Runs the 60s BRINU FM loop inside the contact panel; the returned function stops it. */
export function startBrinuFm(root: HTMLElement): Teardown {
  registerP5Eases();
  const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-fm-scene]'));
  const wipes = Array.from(root.querySelectorAll<HTMLElement>('[data-fm-wipe], [data-fm-wipe-ink]'));
  const channel = root.querySelector<HTMLElement>('[data-fm-channel]');
  const progress = root.querySelector<HTMLElement>('[data-fm-progress]');
  const toggle = root.querySelector<HTMLButtonElement>('[data-fm-toggle]');
  const pauseLabel = root.querySelector<HTMLElement>('[data-fm-pause-label]');
  const playLabel = root.querySelector<HTMLElement>('[data-fm-play-label]');

  localize(root, getLocale());

  const timeline = gsap.timeline({ repeat: -1, paused: true });
  scenes.forEach((scene, index) => addScene(timeline, scene, index, scenes, wipes, channel));
  if (progress) timeline.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: scenes.length * SCENE_SECONDS, ease: 'none' }, 0);

  let userPaused = false;
  let onScreen = false;

  const sync = () => {
    const playing = !userPaused && onScreen && !document.hidden;
    if (playing) timeline.play();
    else timeline.pause();
    root.dataset.fmState = userPaused ? 'paused' : playing ? 'playing' : 'idle';
    toggle?.setAttribute('aria-pressed', String(userPaused));
    if (pauseLabel) pauseLabel.hidden = userPaused;
    if (playLabel) playLabel.hidden = !userPaused;
  };

  const onToggle = () => {
    userPaused = !userPaused;
    sync();
  };
  const onLocale = () => localize(root, getLocale());
  const observer = new IntersectionObserver((entries) => {
    onScreen = entries[entries.length - 1]?.isIntersecting ?? false;
    sync();
  });

  observer.observe(root);
  toggle?.addEventListener('click', onToggle);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener(LOCALE_CHANGE_EVENT, onLocale);
  root.dataset.fmDuration = String(timeline.duration());
  root.dataset.fmScenes = String(scenes.length);

  return () => {
    observer.disconnect();
    toggle?.removeEventListener('click', onToggle);
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onLocale);
    timeline.kill();
    root.dataset.fmState = 'idle';
  };
}
