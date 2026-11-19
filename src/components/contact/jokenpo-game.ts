import { gsap, registerP5Eases } from '../../utils/motion.ts';
import { audioSynth } from '../../utils/audio.ts';
import { getDictionary, getLocale, LOCALE_CHANGE_EVENT } from '../../i18n/index.ts';
import {
  EMPTY_SCORE,
  JOKENPO_CHOICES,
  addResult,
  decideWinner,
  randomChoice,
  type JokenpoChoice,
  type JokenpoResult,
  type JokenpoScore,
} from '../../utils/jokenpo.ts';

type Teardown = () => void;

const COUNT_BEAT_S = 0.32;
const KEY_CHOICES: Readonly<Record<string, JokenpoChoice>> = { '1': 'pedra', '2': 'papel', '3': 'tesoura' };

interface Round {
  readonly player: JokenpoChoice;
  readonly cpu: JokenpoChoice;
  readonly result: JokenpoResult;
}

function crestResult(crest: HTMLElement, outcome: 'win' | 'lose' | 'draw', towardCenter: number): gsap.core.Timeline {
  const timeline = gsap.timeline();
  if (outcome === 'win') {
    timeline
      .to(crest, { y: -16, rotation: towardCenter * -8, scale: 1.1, duration: 0.2, ease: 'power2.out' })
      .to(crest, { filter: 'drop-shadow(0 0 10px rgba(254, 0, 0, 0.9))', duration: 0.12 }, 0)
      .to(crest, { y: 0, rotation: 0, scale: 1, duration: 0.55, ease: 'bounce.out' })
      .to(crest, { x: 3, duration: 0.05, repeat: 5, yoyo: true, ease: 'none' }, 0.25)
      .to(crest, { filter: 'drop-shadow(0 0 0px rgba(254, 0, 0, 0))', duration: 0.4 }, 0.5);
  } else if (outcome === 'lose') {
    timeline
      .to(crest, { x: towardCenter * -10, rotation: towardCenter * -12, duration: 0.1, ease: 'power3.out' })
      .to(crest, { x: towardCenter * 5, duration: 0.06, repeat: 3, yoyo: true, ease: 'none' })
      .to(crest, { x: 0, rotation: towardCenter * -4, y: 6, duration: 0.45, ease: 'power2.out' });
  } else {
    timeline.to(crest, { x: towardCenter * 10, rotation: towardCenter * 4, duration: 0.18, ease: 'power2.out', yoyo: true, repeat: 1 });
  }
  return timeline;
}

function animateTitle(root: HTMLElement): gsap.core.Timeline {
  const chars = Array.from(root.querySelectorAll<HTMLElement>('[data-jk-char]'));
  const slash = root.querySelector('[data-jk-slash]');
  const star = root.querySelector('[data-jk-star]');
  const timeline = gsap.timeline();
  if (slash) timeline.fromTo(slash, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 0.35, ease: 'p5Snap' }, 0);
  if (star) timeline.fromTo(star, { scale: 0, rotation: -90, transformOrigin: '50% 50%' }, { scale: 1, rotation: 0, duration: 0.5, ease: 'p5Overshoot' }, 0.15);
  timeline.fromTo(
    chars,
    { y: -40, scale: 1.6, opacity: 0, rotation: (index) => (index % 2 ? 24 : -24) },
    { y: 0, scale: 1, opacity: 1, rotation: (_index, target: HTMLElement) => parseFloat(getComputedStyle(target).getPropertyValue('--jk-rot')) || 0, duration: 0.32, ease: 'p5Overshoot', stagger: 0.045 },
    0.1
  );
  timeline.to(chars, {
    rotation: (_index, target: HTMLElement) => (parseFloat(getComputedStyle(target).getPropertyValue('--jk-rot')) || 0) + gsap.utils.random(-2.5, 2.5),
    y: () => gsap.utils.random(-1.5, 1.5),
    duration: 0.18,
    ease: 'steps(2)',
    repeat: -1,
    repeatRefresh: true,
    repeatDelay: 0.9,
    stagger: { each: 0.05, from: 'random' },
  });
  return timeline;
}

/** Runs the jokenpô panel; the returned function stops it and its title animation. */
export function startJokenpo(root: HTMLElement): Teardown {
  registerP5Eases();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-jk-choice]'));
  const reset = root.querySelector<HTMLButtonElement>('[data-jk-reset]');
  const live = root.querySelector<HTMLElement>('[data-jk-result]');
  const count = root.querySelector<HTMLElement>('[data-jk-count]');
  const splash = root.querySelector<HTMLElement>('[data-jk-splash]');
  const slots = {
    player: root.querySelector<HTMLElement>('[data-jk-slot="player"]'),
    cpu: root.querySelector<HTMLElement>('[data-jk-slot="cpu"]'),
  };
  const picks = {
    player: root.querySelector<HTMLElement>('[data-jk-pick="player"]'),
    cpu: root.querySelector<HTMLElement>('[data-jk-pick="cpu"]'),
  };
  const sides = {
    player: root.querySelectorAll<HTMLElement>('[data-jk-avatar="player"], [data-jk-side="player"]'),
    cpu: root.querySelectorAll<HTMLElement>('[data-jk-avatar="cpu"], [data-jk-side="cpu"]'),
  };
  const crests = {
    player: root.querySelector<HTMLElement>('[data-jk-crest="player"]'),
    cpu: root.querySelector<HTMLElement>('[data-jk-crest="cpu"]'),
  };
  const logos = {
    player: root.querySelector<HTMLElement>('[data-jk-avatar="player"]'),
    cpu: root.querySelector<HTMLElement>('[data-jk-avatar="cpu"]'),
  };
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let crestTimelines: gsap.core.Timeline[] = [];
  const tallies = {
    win: root.querySelector<HTMLElement>('[data-jk-score="win"]'),
    lose: root.querySelector<HTMLElement>('[data-jk-score="lose"]'),
    draw: root.querySelector<HTMLElement>('[data-jk-score="draw"]'),
  };

  let score: JokenpoScore = EMPTY_SCORE;
  let lastRound: Round | null = null;
  let busy = false;
  let roundTimeline: gsap.core.Timeline | null = null;
  const titleTimeline = reduced ? null : animateTitle(root);

  const copy = () => getDictionary(getLocale()).jokenpo;
  const iconOf = (choice: JokenpoChoice) => {
    const icon = root.querySelector<HTMLImageElement>(`[data-jk-choice="${choice}"] img`)?.cloneNode(true) as HTMLImageElement | undefined;
    if (icon) icon.loading = 'eager';
    return icon;
  };
  const resultWord = (result: JokenpoResult) => ({ vitoria: copy().win, derrota: copy().lose, empate: copy().draw })[result];
  const resultLine = (result: JokenpoResult) => ({ vitoria: copy().winLine, derrota: copy().loseLine, empate: copy().drawLine })[result];

  const setSlot = (side: 'player' | 'cpu', choice: JokenpoChoice | null) => {
    const slot = slots[side];
    const pick = picks[side];
    if (slot) {
      const icon = choice ? iconOf(choice) : undefined;
      if (icon) slot.replaceChildren(icon);
      else slot.innerHTML = '<span class="jk-empty" aria-hidden="true">?</span>';
    }
    if (pick) pick.textContent = choice ? copy()[choice] : '- - -';
  };

  const renderScore = () => {
    (Object.keys(tallies) as (keyof JokenpoScore)[]).forEach((key) => {
      const tally = tallies[key];
      if (tally) tally.textContent = String(score[key]);
    });
  };

  const renderSplash = (result: JokenpoResult | null) => {
    if (!splash) return;
    if (!result) {
      splash.replaceChildren();
      delete splash.dataset.result;
      splash.style.visibility = 'hidden';
      return;
    }
    const word = document.createElement('span');
    word.textContent = resultWord(result);
    splash.replaceChildren(word);
    splash.dataset.result = result;
    splash.style.visibility = 'visible';
  };

  const dimLoser = (result: JokenpoResult | null) => {
    const loser = result === 'derrota' ? 'player' : result === 'vitoria' ? 'cpu' : null;
    (['player', 'cpu'] as const).forEach((side) => {
      sides[side].forEach((element) => {
        if (side === loser) element.dataset.jkDim = '';
        else delete element.dataset.jkDim;
      });
    });
  };

  const resetCrests = () => {
    crestTimelines.forEach((timeline) => timeline.kill());
    crestTimelines = [];
    const elements = [crests.player, crests.cpu].filter((crest): crest is HTMLElement => crest !== null);
    gsap.killTweensOf(elements);
    gsap.set(elements, { clearProps: 'transform,filter' });
  };

  const animateCrests = (result: JokenpoResult) => {
    if (reduced || !crests.player || !crests.cpu) return;
    const outcome = { vitoria: ['win', 'lose'], derrota: ['lose', 'win'], empate: ['draw', 'draw'] }[result] as ['win' | 'lose' | 'draw', 'win' | 'lose' | 'draw'];
    crestTimelines = [crestResult(crests.player, outcome[0], 1), crestResult(crests.cpu, outcome[1], -1)];
  };

  const hover = (side: 'player' | 'cpu', active: boolean) => {
    const logo = logos[side];
    if (!logo || reduced) return;
    gsap.to(logo, active
      ? { scale: 1.08, rotation: side === 'player' ? -7 : 7, duration: 0.35, ease: 'p5Overshoot', overwrite: 'auto' }
      : { scale: 1, rotation: 0, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
  };

  const announce = (round: Round | null) => {
    if (!live) return;
    live.textContent = round ? `${copy()[round.player]} × ${copy()[round.cpu]} — ${resultLine(round.result)}` : '';
  };

  const setBusy = (value: boolean) => {
    busy = value;
    root.dataset.jokenpoState = value ? 'playing' : 'ready';
    buttons.forEach((button) => button.setAttribute('aria-disabled', String(value)));
  };

  const finish = (round: Round) => {
    lastRound = round;
    score = addResult(score, round.result);
    setSlot('cpu', round.cpu);
    renderScore();
    renderSplash(round.result);
    dimLoser(round.result);
    animateCrests(round.result);
    announce(round);
    if (round.result === 'vitoria') audioSynth.playBountyAcquired();
    setBusy(false);
  };

  const play = (player: JokenpoChoice) => {
    if (busy) return;
    const cpu = randomChoice();
    const round: Round = { player, cpu, result: decideWinner(player, cpu) };
    setBusy(true);
    audioSynth.playKnobClick(960, 0.08);
    buttons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.jkChoice === player)));
    setSlot('player', player);
    setSlot('cpu', null);
    renderSplash(null);
    dimLoser(null);
    resetCrests();
    announce(null);

    if (reduced || !count) {
      finish(round);
      return;
    }

    roundTimeline?.kill();
    const timeline = gsap.timeline({ onComplete: () => { roundTimeline = null; } });
    ['JO', 'KEN', 'PÔ!'].forEach((beat, index) => {
      const at = index * COUNT_BEAT_S;
      timeline.call(() => {
        count.textContent = beat;
        count.style.visibility = 'visible';
        audioSynth.playKeypressBeep(520 + index * 160, 0.03, 0.05);
      }, undefined, at);
      timeline.fromTo(count, { scale: 1.8, rotation: index % 2 ? 8 : -8, opacity: 0 }, { scale: 1, rotation: 0, opacity: 1, duration: 0.2, ease: 'p5Overshoot' }, at);
    });
    const revealAt = COUNT_BEAT_S * 3;
    timeline.call(() => {
      count.style.visibility = 'hidden';
      finish(round);
    }, undefined, revealAt);
    if (slots.cpu) timeline.fromTo(slots.cpu, { rotationY: 90 }, { rotationY: 0, duration: 0.3, ease: 'p5Snap' }, revealAt);
    if (splash) timeline.fromTo(splash, { scale: 0.4, rotation: -14 }, { scale: 1, rotation: 0, duration: 0.4, ease: 'p5Overshoot' }, revealAt + 0.05);
    roundTimeline = timeline;
  };

  const onChoice = (event: MouseEvent) => {
    const choice = (event.currentTarget as HTMLButtonElement).dataset.jkChoice as JokenpoChoice;
    if (JOKENPO_CHOICES.includes(choice)) play(choice);
  };

  const onReset = () => {
    roundTimeline?.kill();
    roundTimeline = null;
    if (count) count.style.visibility = 'hidden';
    score = EMPTY_SCORE;
    lastRound = null;
    buttons.forEach((button) => button.setAttribute('aria-pressed', 'false'));
    setSlot('player', null);
    setSlot('cpu', null);
    renderScore();
    renderSplash(null);
    dimLoser(null);
    resetCrests();
    announce(null);
    setBusy(false);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const choice = KEY_CHOICES[event.key];
    if (!choice || event.ctrlKey || event.metaKey || event.altKey) return;
    if (!root.contains(document.activeElement)) return;
    event.preventDefault();
    play(choice);
  };

  const onLocale = () => {
    if (busy) return;
    setSlot('player', lastRound?.player ?? null);
    setSlot('cpu', lastRound?.cpu ?? null);
    renderSplash(lastRound?.result ?? null);
    announce(lastRound);
  };

  const hoverHandlers = (['player', 'cpu'] as const).map((side) => ({
    side,
    enter: () => hover(side, true),
    leave: () => hover(side, false),
  }));
  const onChoiceFocus = () => hover('player', true);
  const onChoiceBlur = () => hover('player', false);

  const titleObserver = new IntersectionObserver((entries) => {
    if (!titleTimeline) return;
    if (entries[entries.length - 1]?.isIntersecting) titleTimeline.play();
    else titleTimeline.pause();
  });

  buttons.forEach((button) => {
    button.disabled = false;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', onChoice);
  });
  reset?.addEventListener('click', onReset);
  root.addEventListener('keydown', onKeyDown);
  if (canHover && !reduced) {
    hoverHandlers.forEach(({ side, enter, leave }) => {
      logos[side]?.addEventListener('mouseenter', enter);
      logos[side]?.addEventListener('mouseleave', leave);
    });
  }
  if (!reduced) {
    buttons.forEach((button) => {
      button.addEventListener('focus', onChoiceFocus);
      button.addEventListener('blur', onChoiceBlur);
    });
  }
  window.addEventListener(LOCALE_CHANGE_EVENT, onLocale);
  titleObserver.observe(root);
  setBusy(false);

  return () => {
    titleObserver.disconnect();
    titleTimeline?.kill();
    roundTimeline?.kill();
    buttons.forEach((button) => button.removeEventListener('click', onChoice));
    reset?.removeEventListener('click', onReset);
    root.removeEventListener('keydown', onKeyDown);
    hoverHandlers.forEach(({ side, enter, leave }) => {
      logos[side]?.removeEventListener('mouseenter', enter);
      logos[side]?.removeEventListener('mouseleave', leave);
    });
    buttons.forEach((button) => {
      button.removeEventListener('focus', onChoiceFocus);
      button.removeEventListener('blur', onChoiceBlur);
    });
    resetCrests();
    window.removeEventListener(LOCALE_CHANGE_EVENT, onLocale);
    root.dataset.jokenpoState = 'loading';
  };
}
