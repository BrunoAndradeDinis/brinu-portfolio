import { ScrollTrigger, gsap } from '../../utils/motion.ts';
import { layoutCubes, type Cube } from './case-cubes.ts';

type CubesRole = 'enter' | 'exit';

const ASSEMBLE_END = 0.7;
const TURN_SPAN = 0.2;
const TURN_DURATION = 0.1;
const SCATTER_SPAN = 0.2;
const EXIT_START = 0.001;
const EXIT_REACH = 1.4;
const EXIT_SCROLL_VH = 0.6;

function edgeColour(background: string): string {
  const match = background.match(/\d+(\.\d+)?/g);
  if (!match) return 'rgb(8, 8, 8)';
  const [r, g, b] = match.map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b < 96 ? 'rgb(251, 250, 244)' : 'rgb(8, 8, 8)';
}

function buildCubes(card: HTMLElement, role: CubesRole): { layer: HTMLElement; cubes: HTMLElement[]; layout: Cube[] } {
  const host = card.parentElement as HTMLElement;
  const width = card.offsetWidth;
  const height = card.offsetHeight;
  const layout = layoutCubes(width, height, window.innerWidth * 0.5, window.innerHeight * 0.5, role === 'enter' ? 7 : 11);
  const background = getComputedStyle(card).backgroundColor;
  const edge = edgeColour(background);

  const layer = document.createElement('div');
  layer.dataset.caseCubes = role;
  layer.setAttribute('aria-hidden', 'true');
  layer.className = 'case-cubes';
  layer.style.left = `${card.offsetLeft}px`;
  layer.style.top = `${card.offsetTop}px`;
  layer.style.width = `${width}px`;
  layer.style.height = `${height}px`;

  const cubes = layout.map((cube) => {
    const element = document.createElement('span');
    element.dataset.caseCube = `${cube.col}-${cube.row}`;
    element.className = 'case-cube';
    element.style.left = `${cube.left}px`;
    element.style.top = `${cube.top}px`;
    element.style.width = `${cube.width}px`;
    element.style.height = `${cube.height}px`;
    element.style.backgroundColor = background;
    element.style.borderColor = edge;
    layer.append(element);
    return element;
  });
  host.append(layer);
  return { layer, cubes, layout };
}

export interface CaseCubesOptions {
  readonly stage: HTMLElement;
  readonly firstCard: HTMLElement;
  readonly lastCard: HTMLElement;
  readonly pinEnd: () => number;
}

/**
 * Scrubs the first card in from cubes as the stage scrolls up to its pin, and breaks the last card
 * into cubes that scatter with the scroll once the pin is released. Returns the teardown.
 */
export function bindCaseCubes({ stage, firstCard, lastCard, pinEnd }: CaseCubesOptions): () => void {
  const enter = buildCubes(firstCard, 'enter');
  const exit = buildCubes(lastCard, 'exit');

  const enterTimeline = gsap.timeline({ paused: true });
  enterTimeline.set(firstCard, { autoAlpha: 0 }, 0);
  enter.cubes.forEach((cube, index) => {
    const { fromX, fromY, fromRotation, turnAt } = enter.layout[index];
    enterTimeline.fromTo(
      cube,
      { x: fromX, y: fromY, rotation: fromRotation, rotationX: 70, scale: 0.4, opacity: 0 },
      { x: 0, y: 0, rotation: 0, rotationX: 0, scale: 1, opacity: 1, duration: ASSEMBLE_END - turnAt * 0.15, ease: 'power2.out' },
      turnAt * 0.15
    );
    enterTimeline.to(cube, { rotationY: 90, opacity: 0, duration: TURN_DURATION, ease: 'power1.in' }, ASSEMBLE_END + turnAt * TURN_SPAN);
  });
  enterTimeline.set(firstCard, { autoAlpha: 1 }, ASSEMBLE_END);

  const enterTrigger = ScrollTrigger.create({
    trigger: stage,
    start: 'top bottom',
    end: 'top top',
    scrub: true,
    animation: enterTimeline,
  });

  const exitTimeline = gsap.timeline({ paused: true });
  gsap.set(exit.layer, { autoAlpha: 0 });
  exitTimeline.set(exit.layer, { autoAlpha: 1 }, EXIT_START);
  exitTimeline.set(lastCard, { autoAlpha: 0 }, EXIT_START);
  exit.cubes.forEach((cube, index) => {
    const { fromX, fromY, fromRotation, turnAt } = exit.layout[index];
    exitTimeline.fromTo(
      cube,
      { x: 0, y: 0, rotation: 0, rotationY: 0, scale: 1, opacity: 1 },
      {
        x: fromX * EXIT_REACH,
        y: fromY * EXIT_REACH,
        rotation: -fromRotation,
        rotationY: 120,
        scale: 0.5,
        opacity: 0,
        duration: 1 - EXIT_START - SCATTER_SPAN,
        ease: 'power1.in',
        immediateRender: false,
      },
      EXIT_START + (1 - turnAt) * SCATTER_SPAN
    );
  });

  const exitTrigger = ScrollTrigger.create({
    trigger: stage,
    start: () => pinEnd(),
    end: () => pinEnd() + Math.round(window.innerHeight * EXIT_SCROLL_VH),
    scrub: true,
    animation: exitTimeline,
  });

  return () => {
    enterTrigger.kill();
    exitTrigger.kill();
    enterTimeline.kill();
    exitTimeline.kill();
    enter.layer.remove();
    exit.layer.remove();
    gsap.set([firstCard, lastCard], { clearProps: 'opacity,visibility' });
  };
}
