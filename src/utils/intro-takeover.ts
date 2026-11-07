import { Flip } from 'gsap/Flip';
import { gsap, p5Overshoot, p5Snap } from './motion';
import { REDUCED_FADE_MS, SHORT_EXIT_MS, SKIP_MAX_MS, type IntroMode } from './intro-timing';

gsap.registerPlugin(Flip);

const BEAT_FLY_AT = 0.2;
const BEAT_SETTLE_AT = 0.7;
const SKIP_SETTLE_SCALE = 1.4;
const LETTER_ORDER = ['B', 'R', 'I', 'N', 'U'] as const;

export interface TakeoverOptions {
  preloader: HTMLElement;
  mode: IntroMode;
  skip: boolean;
  onComplete: () => void;
}

export interface TakeoverHandle {
  skip(): void;
}

function mark(name: string): void {
  performance.mark(name);
}

function createShard(color: 'red' | 'black'): HTMLElement {
  const shard = document.createElement('div');
  shard.dataset.introCut = color;
  shard.setAttribute('aria-hidden', 'true');
  Object.assign(shard.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '75vw',
    height: '100vh',
    zIndex: String(100001),
    pointerEvents: 'none',
    backgroundColor: color === 'red' ? 'var(--color-bebop-red)' : 'var(--color-space-base)',
    clipPath: 'polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)',
  });
  document.body.appendChild(shard);
  return shard;
}

function settleTargets() {
  return {
    header: document.querySelector<HTMLElement>('#comic-nav-header'),
    ticker: document.querySelector<HTMLElement>('[data-hero-ticker]'),
    panels: gsap.utils.toArray<HTMLElement>('[data-hero-manifesto]'),
    socials: gsap.utils.toArray<HTMLElement>('[data-hero-socials] a'),
    avatar: document.querySelector<HTMLElement>('#hero-avatar-badge'),
  };
}

function addSettle(tl: gsap.core.Timeline, at: number, fromAvatar: boolean): void {
  const { header, ticker, panels, socials, avatar } = settleTargets();
  const clear = { clearProps: 'transform,opacity,visibility' };
  tl.addLabel('settle', at);
  tl.call(() => mark('intro:beat-settle'), undefined, at);
  if (header) tl.from(header, { yPercent: -100, duration: 0.5, ease: p5Snap, ...clear }, at);
  if (ticker) tl.from(ticker, { yPercent: -100, opacity: 0, duration: 0.45, ease: p5Snap, ...clear }, at + 0.05);
  if (panels.length) tl.from(panels, { y: 60, opacity: 0, duration: 0.45, stagger: 0.08, ease: p5Overshoot, ...clear }, at + 0.05);
  if (socials.length) tl.from(socials, { x: 40, opacity: 0, duration: 0.4, stagger: 0.05, ease: p5Snap, ...clear }, at + 0.1);
  if (fromAvatar && avatar) tl.from(avatar, { scale: 1.3, opacity: 0, duration: 0.3, ease: p5Overshoot, ...clear }, at - 0.05);
}

export function runTakeover({ preloader, mode, skip, onComplete }: TakeoverOptions): TakeoverHandle {
  const letters = LETTER_ORDER.map((l) => preloader.querySelector<HTMLElement>(`[data-intro-letter="${l}"]`));
  const heroLetters = LETTER_ORDER.map((l) => document.querySelector<HTMLElement>(`[data-hero-letter="${l}"]`));
  const canFly = letters.every(Boolean) && heroLetters.every(Boolean);
  const effectiveMode: IntroMode = !canFly && mode !== 'reduced' ? 'reduced' : mode;
  const shards: HTMLElement[] = [];
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    shards.forEach((s) => s.remove());
    gsap.set(heroLetters.filter(Boolean), { clearProps: 'visibility' });
    onComplete();
  };

  const tl = gsap.timeline({ paused: false, onComplete: finish });
  let skipped = false;

  if (effectiveMode === 'reduced') {
    mark('intro:beat-reduced');
    tl.to(preloader, { opacity: 0, duration: REDUCED_FADE_MS / 1000, ease: 'none' });
    return { skip: () => { if (!skipped) { skipped = true; tl.progress(1); } } };
  }

  const hero = heroLetters as HTMLElement[];
  gsap.set(hero, { visibility: 'hidden' });
  const backdrop = preloader.querySelector<HTMLElement>('.intro-preloader__backdrop');
  const caption = preloader.querySelector<HTMLElement>('.intro-preloader__caption');

  if (skip) {
    skipped = true;
    tl.to(preloader, { opacity: 0, duration: 0.12, ease: 'none' }, 0);
    tl.set(hero, { visibility: 'visible' }, 0);
    addSettle(tl, 0.05, false);
    tl.timeScale(SKIP_SETTLE_SCALE);
  } else {
    const red = createShard('red');
    const black = createShard('black');
    shards.push(red, black);
    gsap.set(red, { xPercent: -140 });
    gsap.set(black, { xPercent: 240 });

    tl.call(() => mark('intro:beat-cut'), undefined, 0);
    tl.to(red, { xPercent: 240, duration: 0.35, ease: p5Snap }, 0);
    tl.to(black, { xPercent: -140, duration: 0.35, ease: p5Snap }, 0.05);
    if (caption) tl.to(caption, { opacity: 0, duration: 0.15 }, 0);
    if (backdrop) tl.set(backdrop, { autoAlpha: 0 }, 0.12);
    tl.to(preloader, { backgroundColor: 'rgba(8,8,8,0)', duration: 0.1, ease: 'none' }, 0.12);

    tl.addLabel('fly', BEAT_FLY_AT);
    tl.call(() => mark('intro:beat-fly'), undefined, BEAT_FLY_AT);
    letters.forEach((letter, index) => {
      const target = hero[index];
      if (!letter) return;
      const at = BEAT_FLY_AT + index * 0.04;
      const flight = Flip.fit(letter, target, { duration: 0.7, ease: p5Overshoot, scale: true, absolute: false }) as gsap.core.Tween;
      tl.add(flight, at);
      tl.set(target, { visibility: 'visible' }, at + 0.6);
      tl.to(letter, { opacity: 0, duration: 0.1, ease: 'none' }, at + 0.6);
    });

    addSettle(tl, BEAT_SETTLE_AT, true);

    if (mode === 'short') {
      tl.timeScale(tl.duration() / ((SHORT_EXIT_MS - 100) / 1000));
    }
  }

  tl.eventCallback('onUpdate', () => {
    if (!preloader.isConnected && !finished) tl.progress(1);
  });

  return {
    skip() {
      if (skipped || finished) return;
      skipped = true;
      tl.seek('settle', false);
      const remainingS = Math.max(0.1, tl.duration() - tl.time());
      tl.timeScale(Math.max(1, remainingS / ((SKIP_MAX_MS - 250) / 1000)));
    },
  };
}
