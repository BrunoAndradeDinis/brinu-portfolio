import {
  FIRST_SHOT_AT,
  advanceShots,
  createStarLayers,
  easeCamera,
  project,
  seeded,
  shotOpacity,
  spawnShot,
  twinkle,
  type Camera,
  type Shot,
  type ShotSchedule,
} from './star-sky.ts';

const SPRITE_PX = 32;
const MAX_PIXEL_RATIO = 2;
/** The prototype's comet texture is 256 x 16: it widens from the tail to 12 px at 236 px and rounds off at 256. */
const COMET = { shoulder: 236 / 256, halfWidth: 6 / 16 } as const;

function rgba(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function dotSprite(colour: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = SPRITE_PX;
  const context = sprite.getContext('2d') as CanvasRenderingContext2D;
  const half = SPRITE_PX / 2;
  const glow = context.createRadialGradient(half, half, 0, half, half, half);
  glow.addColorStop(0, rgba(colour, 1));
  glow.addColorStop(0.35, rgba(colour, 0.9));
  glow.addColorStop(1, rgba(colour, 0));
  context.fillStyle = glow;
  context.fillRect(0, 0, SPRITE_PX, SPRITE_PX);
  return sprite;
}

/** Draws the 404's star sky on `canvas`, sized to `root`; returns the teardown. */
export function bindStarSky(root: HTMLElement, canvas: HTMLCanvasElement): () => void {
  const context = canvas.getContext('2d');
  if (!context) return () => {};
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const random = seeded(1996);
  const layers = createStarLayers(random);
  const sprites = new Map(layers.map((layer) => [layer.colour, dotSprite(layer.colour)]));
  const pointer = { x: 0.4, y: -0.2 };
  const schedule: ShotSchedule = { shots: [], next: FIRST_SHOT_AT };
  let camera: Camera = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let last = performance.now();

  const drawShot = (shot: Shot) => {
    const speed = Math.hypot(shot.vx, shot.vy);
    const ux = shot.vx / speed;
    const uy = shot.vy / speed;
    const half = shot.length / 2;
    const head = project({ x: shot.x + ux * half, y: shot.y + uy * half, depth: shot.depth }, camera, width, height);
    const tail = project({ x: shot.x - ux * half, y: shot.y - uy * half, depth: shot.depth }, camera, width, height);
    const thickness = project(shot, camera, width, height, 3.2 + shot.depth / 500).size;
    const dx = head.x - tail.x;
    const dy = head.y - tail.y;
    const length = Math.hypot(dx, dy) || 1;
    const nx = -dy / length;
    const ny = dx / length;
    const shoulder = { x: tail.x + dx * COMET.shoulder, y: tail.y + dy * COMET.shoulder };
    const spread = thickness * COMET.halfWidth;
    const fill = context.createLinearGradient(tail.x, tail.y, head.x, head.y);
    fill.addColorStop(0, 'rgba(255, 255, 255, 0)');
    fill.addColorStop(0.85, 'rgba(255, 255, 255, 0.85)');
    fill.addColorStop(1, 'rgba(255, 255, 255, 1)');
    context.globalAlpha = shotOpacity(shot);
    context.fillStyle = fill;
    context.beginPath();
    context.moveTo(tail.x, tail.y);
    context.lineTo(shoulder.x + nx * spread, shoulder.y + ny * spread);
    context.quadraticCurveTo(head.x, head.y, shoulder.x - nx * spread, shoulder.y - ny * spread);
    context.closePath();
    context.fill();
  };

  const draw = (seconds: number) => {
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
    for (const layer of layers) {
      context.globalAlpha = twinkle(layer, seconds);
      const sprite = sprites.get(layer.colour) as HTMLCanvasElement;
      for (const star of layer.stars) {
        const dot = project(star, camera, width, height, layer.size);
        if (dot.x < -dot.size || dot.y < -dot.size || dot.x > width + dot.size || dot.y > height + dot.size) continue;
        context.drawImage(sprite, dot.x - dot.size / 2, dot.y - dot.size / 2, dot.size, dot.size);
      }
    }
    context.globalCompositeOperation = 'lighter';
    for (const shot of schedule.shots) drawShot(shot);
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
  };

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    width = root.clientWidth;
    height = root.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (still) draw(0);
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    camera = easeCamera(camera, pointer);
    advanceShots(schedule, dt, random, pointer, width / Math.max(1, height));
    draw(now / 1000);
    frame = requestAnimationFrame(tick);
  };

  const onPointerMove = (event: PointerEvent) => {
    const box = root.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = -(((event.clientY - box.top) / box.height) * 2 - 1);
  };

  const onVisibility = () => {
    cancelAnimationFrame(frame);
    if (document.visibilityState === 'visible') {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const observer = new ResizeObserver(resize);
  observer.observe(root);
  width = root.clientWidth;
  height = root.clientHeight;
  const aspect = width / Math.max(1, height);
  schedule.shots.push(spawnShot(random, pointer, aspect, 4), spawnShot(random, pointer, aspect, 9));
  resize();
  if (!still) {
    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('visibilitychange', onVisibility);
    frame = requestAnimationFrame(tick);
  }
  canvas.dataset.skyReady = still ? 'still' : 'moving';

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
