import {
  HALF_FOV_TAN,
  MAX_SHOTS,
  SHOT_GAP,
  createStarLayers,
  easeCamera,
  project,
  seeded,
  shotOpacity,
  spawnShot,
  twinkle,
  type Camera,
  type Shot,
} from './star-sky.ts';

const SPRITE_PX = 32;
const MAX_PIXEL_RATIO = 2;

function dotSprite(colour: string): HTMLCanvasElement {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = SPRITE_PX;
  const context = sprite.getContext('2d') as CanvasRenderingContext2D;
  const half = SPRITE_PX / 2;
  const glow = context.createRadialGradient(half, half, 0, half, half, half);
  glow.addColorStop(0, colour);
  glow.addColorStop(0.35, colour);
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
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
  const shots: Shot[] = [];
  const pointer = { x: 0.4, y: -0.2 };
  let camera: Camera = { x: 0, y: 0 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let last = performance.now();
  let nextShot = 2.5;

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    width = root.clientWidth;
    height = root.clientHeight;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (still) draw(0);
  };

  const drawShot = (shot: Shot) => {
    const head = project(shot, camera, width, height);
    const scale = height / 2 / HALF_FOV_TAN;
    const length = (shot.length * scale) / shot.depth;
    const speed = Math.hypot(shot.vx, shot.vy);
    const dx = (-shot.vx / speed) * length;
    const dy = (shot.vy / speed) * length;
    const tail = context.createLinearGradient(head.x + dx, head.y + dy, head.x, head.y);
    tail.addColorStop(0, 'rgba(251, 250, 244, 0)');
    tail.addColorStop(0.85, 'rgba(251, 250, 244, 0.85)');
    tail.addColorStop(1, 'rgba(251, 250, 244, 1)');
    context.globalAlpha = shotOpacity(shot);
    context.strokeStyle = tail;
    context.lineWidth = Math.max(1, ((3.2 + shot.depth / 500) * scale) / shot.depth);
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(head.x + dx, head.y + dy);
    context.lineTo(head.x, head.y);
    context.stroke();
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
    for (const shot of shots) drawShot(shot);
    context.globalCompositeOperation = 'source-over';
    context.globalAlpha = 1;
  };

  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    camera = easeCamera(camera, pointer);
    nextShot -= dt;
    if (nextShot <= 0 && shots.length < MAX_SHOTS) {
      shots.push(spawnShot(random, pointer, width / Math.max(1, height)));
      nextShot = SHOT_GAP.min + random() * SHOT_GAP.spread;
    }
    for (let index = shots.length - 1; index >= 0; index -= 1) {
      const shot = shots[index];
      shot.age += dt;
      shot.x += shot.vx * dt;
      shot.y += shot.vy * dt;
      if (shot.age > shot.life) shots.splice(index, 1);
    }
    draw(now / 1000);
    frame = requestAnimationFrame(tick);
  };

  const onPointerMove = (event: PointerEvent) => {
    const box = root.getBoundingClientRect();
    pointer.x = ((event.clientX - box.left) / box.width) * 2 - 1;
    pointer.y = -(((event.clientY - box.top) / box.height) * 2 - 1);
  };

  const onVisibility = () => {
    if (still) return;
    cancelAnimationFrame(frame);
    if (document.visibilityState === 'visible') {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };

  const observer = new ResizeObserver(resize);
  observer.observe(root);
  resize();
  if (still) {
    draw(0);
  } else {
    const aspect = width / Math.max(1, height);
    shots.push(spawnShot(random, pointer, aspect, 4), spawnShot(random, pointer, aspect, 9));
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
