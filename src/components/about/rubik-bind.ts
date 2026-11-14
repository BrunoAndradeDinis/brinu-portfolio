import { gsap } from '../../utils/motion.ts';
import { STICKER_FILES } from '../../data/sticker-files.ts';
import {
  FACE_COLOURS,
  SCRAMBLE,
  applyMove,
  inLayer,
  inverse,
  solvedCube,
  type Axis,
  type Facing,
  type Move,
  type Piece,
} from './rubik-cube.ts';

const STICKER_IMAGE = '/stickers/sticker-04.svg';
/** One library sticker per square; sticker 04 is kept for the front it covers once the cube is solved. */
export const CUBE_PHOTOS: readonly string[] = STICKER_FILES.filter((file) => file !== STICKER_IMAGE).slice(0, 54);
const PRELOAD_MARGIN = '0px 0px 600px 0px';
const CUBE_SHARE = 0.78;
const GAP_SHARE = 0.04;
const TURN_SECONDS = 0.17;
/** The cube starts once this share of the portrait is on screen, so the visitor sees it from the first turn. */
export const START_VISIBLE_SHARE = 0.35;
const AXIS_VECTOR: Readonly<Record<Axis, readonly [number, number, number]>> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
const FACE_TRANSFORM: Readonly<Record<Facing, string>> = {
  '+z': 'rotateY(0deg)',
  '-z': 'rotateY(180deg)',
  '+x': 'rotateY(90deg)',
  '-x': 'rotateY(-90deg)',
  '+y': 'rotateX(-90deg)',
  '-y': 'rotateX(90deg)',
};

export type CubePhase = 'scrambled' | 'solving' | 'solved' | 'sticker' | 'portrait' | 'done';

interface PieceView {
  readonly element: HTMLElement;
  readonly stickers: Map<Facing, HTMLElement>;
  base: DOMMatrix;
}

function snap(matrix: DOMMatrix): DOMMatrix {
  const values = matrix.toFloat64Array().map((value, index) => (index < 12 ? Math.round(value) : value));
  return DOMMatrix.fromFloat64Array(Float64Array.from(values));
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Replaces the portrait's first appearance with a Rubik's cube that solves itself, shows sticker 04 on its
 * front face and settles into the portrait. Returns the teardown.
 */
export function bindRubikPortrait(host: HTMLElement, frame: HTMLElement, portrait: HTMLImageElement): () => void {
  if (prefersReducedMotion() || host.dataset.cubeBound === 'true') return () => {};
  host.dataset.cubeBound = 'true';

  const size = Math.round(Math.min(frame.offsetWidth, frame.offsetHeight) * CUBE_SHARE);
  const piece = size / 3;
  const pitch = piece * (1 + GAP_SHARE);

  const stage = document.createElement('div');
  stage.dataset.dossierCube = 'scrambled';
  stage.setAttribute('aria-hidden', 'true');
  stage.className = 'rubik-stage';
  stage.style.left = `${frame.offsetLeft}px`;
  stage.style.top = `${frame.offsetTop}px`;
  stage.style.width = `${frame.offsetWidth}px`;
  stage.style.height = `${frame.offsetHeight}px`;

  const root = document.createElement('div');
  root.className = 'rubik-root';
  root.style.width = root.style.height = `${size}px`;
  stage.append(root);

  let model: Piece[] = solvedCube();
  const views = new Map<string, PieceView>();
  let photoIndex = 0;
  for (const item of model) {
    const element = document.createElement('div');
    element.className = 'rubik-piece';
    element.dataset.cubePiece = item.id;
    element.style.width = element.style.height = `${piece}px`;
    element.style.margin = `${-piece / 2}px 0 0 ${-piece / 2}px`;
    const stickers = new Map<Facing, HTMLElement>();
    for (const sticker of item.stickers) {
      const face = document.createElement('span');
      face.className = 'rubik-sticker';
      face.dataset.cubeSticker = sticker.home;
      face.style.backgroundColor = FACE_COLOURS[sticker.home];
      face.style.transform = `${FACE_TRANSFORM[sticker.home]} translateZ(${piece / 2}px)`;
      const photo = document.createElement('span');
      photo.className = 'rubik-photo';
      photo.dataset.cubePhoto = CUBE_PHOTOS[photoIndex % CUBE_PHOTOS.length];
      photo.style.backgroundImage = `url("${photo.dataset.cubePhoto}")`;
      photoIndex += 1;
      face.append(photo);
      element.append(face);
      stickers.set(sticker.home, face);
    }
    const [x, y, z] = item.at;
    const base = new DOMMatrix().translate(x * pitch, y * pitch, z * pitch);
    element.style.transform = base.toString();
    root.append(element);
    views.set(item.id, { element, stickers, base });
  }

  const record = () => {
    for (const item of model) {
      const view = views.get(item.id) as PieceView;
      view.element.dataset.cubeAt = item.at.join(',');
      for (const sticker of item.stickers) (view.stickers.get(sticker.home) as HTMLElement).dataset.cubeFacing = sticker.facing;
    }
  };

  const turn = (move: Move, seconds: number, timeline?: gsap.core.Timeline, at?: number) => {
    // The layer is read when the turn starts: earlier turns in the timeline have moved pieces in and out of it.
    let moving: PieceView[] = [];
    const pick = () => {
      moving = model.filter((item) => inLayer(item, move)).map((item) => views.get(item.id) as PieceView);
    };
    const [ax, ay, az] = AXIS_VECTOR[move.axis];
    const settle = () => {
      for (const view of moving) {
        view.base = snap(new DOMMatrix().rotateAxisAngle(ax, ay, az, 90 * move.turns).multiply(view.base));
        view.element.style.transform = view.base.toString();
      }
      model = applyMove(model, move);
      record();
    };
    if (seconds === 0) {
      pick();
      settle();
      return;
    }
    const angle = { value: 0 };
    (timeline as gsap.core.Timeline).to(
      angle,
      {
        value: 90 * move.turns,
        duration: seconds,
        ease: 'power2.inOut',
        onStart: pick,
        onUpdate: () => {
          for (const view of moving) view.element.style.transform = `rotate3d(${ax}, ${ay}, ${az}, ${angle.value}deg) ${view.base.toString()}`;
        },
        onComplete: settle,
      },
      at
    );
  };

  for (const move of SCRAMBLE) turn(move, 0);
  frame.style.opacity = '0';

  const frontStickers = () =>
    model
      .filter((item) => item.at[2] === 1)
      .map((item) => {
        const front = item.stickers.find((sticker) => sticker.facing === '+z');
        return { at: item.at, element: (views.get(item.id) as PieceView).stickers.get(front?.home as Facing) as HTMLElement };
      });

  const slice = (element: HTMLElement, [x, y]: readonly number[], image: string, height: number) => {
    const layer = document.createElement('span');
    layer.className = 'rubik-slice';
    layer.dataset.cubeSlice = image === STICKER_IMAGE ? 'sticker' : 'portrait';
    layer.style.backgroundImage = `url("${image}")`;
    layer.style.backgroundSize = `${size}px ${height}px`;
    layer.style.backgroundPosition = `${-(x + 1) * piece}px ${-(y + 1) * piece - (height - size) / 2}px`;
    layer.style.opacity = '0';
    element.append(layer);
    return layer;
  };

  const setPhase = (phase: CubePhase) => () => {
    stage.dataset.dossierCube = phase;
  };

  const timeline = gsap.timeline({ paused: true });
  timeline.fromTo(root, { rotationX: -30, rotationY: -200, scale: 0.6, opacity: 0 }, { rotationX: -24, rotationY: 34, scale: 1, opacity: 1, duration: 0.5, ease: 'power3.out' });
  timeline.call(setPhase('solving'));
  for (const move of inverse(SCRAMBLE)) turn(move, TURN_SECONDS, timeline);
  timeline.call(setPhase('solved'));
  timeline.to(root, { rotationX: 0, rotationY: 0, duration: 0.35, ease: 'power2.inOut' });
  timeline.call(() => {
    stage.dataset.dossierCube = 'sticker';
    const ratio = portrait.naturalWidth > 0 ? portrait.naturalHeight / portrait.naturalWidth : 394 / 341;
    const front = frontStickers();
    const stickerSlices = front.map(({ at, element }) => slice(element, at, STICKER_IMAGE, size));
    const portraitSlices = front.map(({ at, element }) => slice(element, at, portrait.currentSrc || portrait.src, size * ratio));
    gsap.timeline()
      .to(stickerSlices, { opacity: 1, duration: 0.3, stagger: 0.03 })
      .call(setPhase('portrait'), undefined, '+=0.15')
      .to(portraitSlices, { opacity: 1, duration: 0.35, stagger: 0.03 })
      .to(frame, { opacity: 1, duration: 0.35, ease: 'power1.out' })
      .to(stage, { opacity: 0, scale: 1.04, duration: 0.35, ease: 'power1.out' }, '<')
      .call(() => {
        stage.dataset.dossierCube = 'done';
        stage.remove();
        frame.style.removeProperty('opacity');
      });
  });

  const preloader = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      preloader.disconnect();
      for (const file of CUBE_PHOTOS) new Image().src = file;
    },
    { rootMargin: PRELOAD_MARGIN }
  );
  preloader.observe(frame);

  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      host.append(stage);
      host.dataset.cubeStartedAt = String(performance.now());
      timeline.play();
    },
    { threshold: START_VISIBLE_SHARE }
  );
  observer.observe(frame);

  return () => {
    preloader.disconnect();
    observer.disconnect();
    timeline.kill();
    gsap.killTweensOf([frame, stage]);
    stage.remove();
    frame.style.removeProperty('opacity');
    delete host.dataset.cubeBound;
  };
}
