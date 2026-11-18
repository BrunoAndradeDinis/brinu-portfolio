import { gsap } from '../../utils/motion.ts';

const COLOURS = ['#FE0000', '#FBFAF4', '#080808'] as const;
const SPAWN_GAP_MS = 18;
const MAX_ALIVE = 48;
const REACH_PX = 72;
const LIFE_SECONDS = 0.9;

/** Maps a viewport point into `frame`'s own untransformed box, so particles start under the cursor on a tilted frame. */
function toFrame(frame: HTMLElement, clientX: number, clientY: number): { x: number; y: number } {
  const box = frame.getBoundingClientRect();
  const transform = getComputedStyle(frame).transform;
  const matrix = transform === 'none' ? new DOMMatrix() : new DOMMatrix(transform);
  const point = matrix.inverse().transformPoint(new DOMPoint(clientX - (box.left + box.width / 2), clientY - (box.top + box.height / 2)));
  return { x: point.x + frame.offsetWidth / 2, y: point.y + frame.offsetHeight / 2 };
}

/** Sheds small brand-coloured squares from the cursor while it moves over `frame`. Returns the teardown. */
export function bindPortraitParticles(frame: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const layer = document.createElement('span');
  layer.className = 'portrait-particles';
  layer.dataset.portraitParticles = '';
  layer.setAttribute('aria-hidden', 'true');
  frame.append(layer);

  let lastSpawn = Number.NEGATIVE_INFINITY;
  let serial = 0;

  const spawn = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const now = performance.now();
    if (now - lastSpawn < SPAWN_GAP_MS || layer.childElementCount >= MAX_ALIVE) return;
    lastSpawn = now;
    const local = toFrame(frame, event.clientX, event.clientY);
    const size = 7 + (serial % 6);
    const particle = document.createElement('span');
    particle.className = 'portrait-particle';
    particle.style.width = particle.style.height = `${size}px`;
    particle.style.left = `${local.x - size / 2}px`;
    particle.style.top = `${local.y - size / 2}px`;
    particle.style.backgroundColor = COLOURS[serial % COLOURS.length];
    layer.append(particle);
    const angle = serial * 2.399963;
    serial += 1;
    gsap.fromTo(
      particle,
      { x: 0, y: 0, rotation: 0, scale: 1 },
      { x: Math.cos(angle) * REACH_PX, y: Math.sin(angle) * REACH_PX, rotation: 180, scale: 0.6, duration: LIFE_SECONDS, ease: 'power2.out' }
    );
    gsap.fromTo(particle, { opacity: 1 }, { opacity: 0, duration: LIFE_SECONDS, ease: 'power2.in', onComplete: () => particle.remove() });
  };

  frame.addEventListener('pointermove', spawn);

  return () => {
    frame.removeEventListener('pointermove', spawn);
    gsap.killTweensOf(layer.children);
    layer.remove();
  };
}
