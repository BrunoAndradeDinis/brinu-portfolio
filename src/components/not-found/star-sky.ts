export interface StarLayerSpec {
  readonly count: number;
  readonly near: number;
  readonly far: number;
  readonly size: number;
  readonly colour: string;
  readonly opacity: number;
}

export interface Star {
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

export interface StarLayer extends StarLayerSpec {
  readonly stars: readonly Star[];
  readonly phase: number;
  readonly speed: number;
}

export interface Camera {
  readonly x: number;
  readonly y: number;
}

export interface Shot {
  x: number;
  y: number;
  readonly depth: number;
  readonly vx: number;
  readonly vy: number;
  readonly length: number;
  age: number;
  readonly life: number;
}

/** Far to near, as the prototype layers them: three paper-white layers and one red one. */
export const STAR_LAYERS: readonly StarLayerSpec[] = [
  { count: 380, near: 1500, far: 2400, size: 6, colour: '#FBFAF4', opacity: 0.55 },
  { count: 260, near: 800, far: 1500, size: 5, colour: '#FBFAF4', opacity: 0.75 },
  { count: 120, near: 250, far: 800, size: 4, colour: '#FBFAF4', opacity: 0.95 },
  { count: 26, near: 400, far: 2000, size: 6, colour: '#FE0000', opacity: 0.9 },
];

/** tan(30deg): half of the prototype's 60 degree field of view. */
export const HALF_FOV_TAN = Math.tan(Math.PI / 6);
export const PARALLAX = { x: 70, y: 45, ease: 0.025 } as const;
/** The camera looks at (share * camera, depth ahead), as the prototype's `lookAt(tx * 0.2, ty * 0.2, -1000)`: the view pivots, so far stars follow the pointer and near ones move against it. */
export const LOOK = { share: 0.2, depth: 1000 } as const;
export const MAX_SHOTS = 5;
export const SHOT_GAP = { min: 3, spread: 3 } as const;

export function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Scatters each layer's stars across the view at their depth, wider than the screen so parallax never shows an edge. */
export function createStarLayers(random: () => number): StarLayer[] {
  return STAR_LAYERS.map((spec) => ({
    ...spec,
    phase: random() * Math.PI * 2,
    speed: 0.25 + random() * 0.4,
    stars: Array.from({ length: spec.count }, () => {
      const depth = spec.near + random() * (spec.far - spec.near);
      return { x: (random() * 2 - 1) * depth * HALF_FOV_TAN * 2.6, y: (random() * 2 - 1) * depth * HALF_FOV_TAN * 1.5, depth };
    }),
  }));
}

/**
 * Screen position and dot size of a point at `depth`, seen from `camera` at (x, y, 0) looking at
 * (LOOK.share * x, LOOK.share * y, -LOOK.depth), through a 60 degree perspective with size attenuation.
 */
export function project(point: { x: number; y: number; depth: number }, camera: Camera, width: number, height: number, size = 0) {
  const scale = height / 2 / HALF_FOV_TAN;
  const back = [camera.x * (1 - LOOK.share), camera.y * (1 - LOOK.share), LOOK.depth];
  const backLength = Math.hypot(back[0], back[1], back[2]);
  const z = [back[0] / backLength, back[1] / backLength, back[2] / backLength];
  const rightLength = Math.hypot(z[2], z[0]);
  const x = [z[2] / rightLength, 0, -z[0] / rightLength];
  const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
  const rel = [point.x - camera.x, point.y - camera.y, -point.depth];
  const along = (axis: number[]) => rel[0] * axis[0] + rel[1] * axis[1] + rel[2] * axis[2];
  const distance = -along(z);
  return {
    x: width / 2 + (along(x) * scale) / distance,
    y: height / 2 - (along(y) * scale) / distance,
    size: (size * height) / 2 / distance,
  };
}

/** The layer's opacity at `seconds`: it breathes between 56% and 100% of its base, as the prototype's 0.78 +/- 0.22. */
export function twinkle(layer: Pick<StarLayer, 'opacity' | 'phase' | 'speed'>, seconds: number): number {
  return layer.opacity * (0.78 + 0.22 * Math.sin(seconds * layer.speed * Math.PI * 2 + layer.phase));
}

/** Pointer position in -1..1 on both axes (y up) eases the camera toward at most `PARALLAX.x` / `PARALLAX.y`. */
export function easeCamera(camera: Camera, pointer: { x: number; y: number }): Camera {
  const px = Math.max(-1, Math.min(1, pointer.x));
  const py = Math.max(-1, Math.min(1, pointer.y));
  return { x: camera.x + (px * PARALLAX.x - camera.x) * PARALLAX.ease, y: camera.y + (py * PARALLAX.y - camera.y) * PARALLAX.ease };
}

/** A shooting star that enters from the side away from the pointer and crosses the view. */
export function spawnShot(random: () => number, pointer: { x: number; y: number }, aspect: number, preAge = 0): Shot {
  const depth = 500 + random() * 1300;
  const sx = -(pointer.x >= 0 ? 1 : -1) * (0.55 + random() * 0.5);
  const sy = -(pointer.y >= 0 ? 1 : -1) * (0.3 + random() * 0.6);
  let vx = -sx * aspect;
  let vy = -sy;
  const norm = Math.hypot(vx, vy);
  vx /= norm;
  vy /= norm;
  const speed = depth * 0.075;
  const shot: Shot = {
    x: sx * depth * HALF_FOV_TAN * aspect,
    y: sy * depth * HALF_FOV_TAN,
    depth,
    vx: vx * speed,
    vy: vy * speed,
    length: 140 + random() * 120,
    age: preAge,
    life: 13 + random() * 5,
  };
  shot.x += shot.vx * preAge;
  shot.y += shot.vy * preAge;
  return shot;
}

export interface ShotSchedule {
  readonly shots: Shot[];
  next: number;
}

export const FIRST_SHOT_AT = 2.5;

/**
 * Advances every shooting star by `dt` seconds, drops the ones past their life, and spawns a new one when the
 * gap has run out and fewer than `MAX_SHOTS` are in flight; the next gap is three to six seconds. Returns the spawned shot.
 */
export function advanceShots(schedule: ShotSchedule, dt: number, random: () => number, pointer: { x: number; y: number }, aspect: number): Shot | null {
  let spawned: Shot | null = null;
  schedule.next -= dt;
  if (schedule.next <= 0 && schedule.shots.length < MAX_SHOTS) {
    spawned = spawnShot(random, pointer, aspect);
    schedule.shots.push(spawned);
    schedule.next = SHOT_GAP.min + random() * SHOT_GAP.spread;
  }
  for (let index = schedule.shots.length - 1; index >= 0; index -= 1) {
    const shot = schedule.shots[index];
    shot.age += dt;
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    if (shot.age > shot.life) schedule.shots.splice(index, 1);
  }
  return spawned;
}

/** 0..1: fades in over two seconds and out over the last three. */
export function shotOpacity(shot: Pick<Shot, 'age' | 'life'>): number {
  return Math.max(0, Math.min(shot.age / 2, 1) * Math.min((shot.life - shot.age) / 3, 1)) * 0.9;
}
