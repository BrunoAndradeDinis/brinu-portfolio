import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { gsap, p5Snap } from '../../utils/motion';

gsap.registerPlugin(Draggable, InertiaPlugin);

const SELECT_DURATION_S = 0.45;
const DRAG_SUPPRESS_CLICK_MS = 80;

export interface ArcanaDeckHandle {
  select(index: number): void;
  readonly selectedIndex: number;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function initArcanaDeck(root: HTMLElement): ArcanaDeckHandle | null {
  if (root.dataset.arcanaBound === 'true') return null;
  const track = root.querySelector<HTMLElement>('[data-arcana-track]');
  const viewport = root.querySelector<HTMLElement>('[data-arcana-viewport]');
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-arcana-card]'));
  if (!track || !viewport || cards.length === 0) return null;
  root.dataset.arcanaBound = 'true';
  root.classList.add('is-enhanced');

  const prev = root.querySelector<HTMLButtonElement>('[data-arcana-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-arcana-next]');
  const toggleOf = (card: HTMLElement) => card.querySelector<HTMLButtonElement>('[data-arcana-toggle]');
  const front = (card: HTMLElement) => card.querySelector<HTMLElement>('[data-arcana-front]');
  const back = (card: HTMLElement) => card.querySelector<HTMLElement>('[data-arcana-back]');

  let selected = 0;
  let lastDragAt = 0;
  let draggable: Draggable | null = null;

  const positions = (): number[] => {
    const center = viewport.clientWidth / 2;
    return cards.map((card) => {
      const item = card.parentElement as HTMLElement;
      return center - (item.offsetLeft + item.offsetWidth / 2);
    });
  };

  const nearestIndex = (x: number): number => {
    const all = positions();
    let best = 0;
    for (let i = 1; i < all.length; i++) {
      if (Math.abs(all[i] - x) < Math.abs(all[best] - x)) best = i;
    }
    return best;
  };

  const setFlipped = (card: HTMLElement, flipped: boolean) => {
    card.classList.toggle('is-flipped', flipped);
    toggleOf(card)?.setAttribute('aria-pressed', String(flipped));
    const frontFace = front(card);
    const backFace = back(card);
    if (frontFace) frontFace.toggleAttribute('inert', flipped);
    if (backFace) backFace.toggleAttribute('inert', !flipped);
  };

  const applySelection = (index: number) => {
    const clamped = Math.min(cards.length - 1, Math.max(0, index));
    selected = clamped;
    cards.forEach((card, i) => {
      const isSelected = i === clamped;
      card.classList.toggle('is-selected', isSelected);
      if (isSelected) card.setAttribute('aria-current', 'true');
      else card.removeAttribute('aria-current');
      const toggle = toggleOf(card);
      if (toggle) toggle.tabIndex = isSelected ? 0 : -1;
      if (!isSelected) setFlipped(card, false);
    });
    if (prev) prev.disabled = clamped === 0;
    if (next) next.disabled = clamped === cards.length - 1;
  };

  const select = (index: number, animate = true) => {
    applySelection(index);
    const x = positions()[selected];
    if (animate && !prefersReducedMotion()) {
      gsap.to(track, { x, duration: SELECT_DURATION_S, ease: p5Snap, overwrite: true, onUpdate: () => draggable?.update() });
    } else {
      gsap.set(track, { x });
      draggable?.update();
    }
  };

  const toggleSelected = () => {
    const card = cards[selected];
    setFlipped(card, !card.classList.contains('is-flipped'));
  };

  const activate = (index: number) => {
    if (performance.now() - lastDragAt < DRAG_SUPPRESS_CLICK_MS) return;
    if (index === selected) toggleSelected();
    else select(index);
  };

  cards.forEach((card, index) => {
    toggleOf(card)?.addEventListener('click', () => activate(index));
    front(card)?.addEventListener('click', () => activate(index));
    card.addEventListener('click', (event) => {
      if (index !== selected && !(event.target as HTMLElement).closest('a')) {
        if (performance.now() - lastDragAt >= DRAG_SUPPRESS_CLICK_MS) select(index);
      }
    });
    setFlipped(card, false);
  });

  prev?.addEventListener('click', () => select(selected - 1));
  next?.addEventListener('click', () => select(selected + 1));

  root.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    if (target.closest('a')) return;
    let handled = true;
    if (event.key === 'ArrowRight') select(selected + 1);
    else if (event.key === 'ArrowLeft') select(selected - 1);
    else if (event.key === 'Home') select(0);
    else if (event.key === 'End') select(cards.length - 1);
    else handled = false;
    if (handled) {
      event.preventDefault();
      toggleOf(cards[selected])?.focus({ preventScroll: true });
    }
  });

  const reduced = prefersReducedMotion();
  draggable = Draggable.create(track, {
    type: 'x',
    inertia: !reduced,
    allowContextMenu: true,
    dragClickables: true,
    minimumMovement: 6,
    edgeResistance: 0.85,
    snap: reduced
      ? undefined
      : {
          x: () => positions()[nearestIndex(gsap.getProperty(track, 'x') as number)],
        },
    onPress() {
      gsap.killTweensOf(track);
    },
    onDrag() {
      lastDragAt = performance.now();
    },
    onDragEnd() {
      lastDragAt = performance.now();
      if (reduced) select(nearestIndex(gsap.getProperty(track, 'x') as number), false);
    },
    onThrowUpdate() {
      lastDragAt = performance.now();
    },
    onThrowComplete() {
      lastDragAt = performance.now();
      applySelection(nearestIndex(gsap.getProperty(track, 'x') as number));
    },
  })[0];

  const resizeObserver = new ResizeObserver(() => select(selected, false));
  resizeObserver.observe(viewport);

  applySelection(0);
  select(0, false);
  requestAnimationFrame(() => select(selected, false));

  return {
    select: (index: number) => select(index),
    get selectedIndex() {
      return selected;
    },
  };
}
