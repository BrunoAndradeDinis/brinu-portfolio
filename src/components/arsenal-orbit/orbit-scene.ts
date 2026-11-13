import {
  BufferGeometry,
  CircleGeometry,
  EllipseCurve,
  LineBasicMaterial,
  LineLoop,
  Material,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Scene,
  Texture,
  WebGLRenderer,
} from 'three';
import { ORBIT_ELLIPSES, type OrbitNode } from './orbit-layout.ts';

export interface OrbitPalette {
  readonly ring: string;
  readonly nodes: Readonly<Record<OrbitNode['domainId'], string>>;
}

export interface OrbitPoint {
  readonly x: number;
  readonly y: number;
}

/** GPU resources the renderer still tracks; all zero once the scene is disposed. */
export interface OrbitMemory {
  readonly geometries: number;
  readonly textures: number;
  readonly programs: number;
}

export interface OrbitScene {
  setNodeScale(index: number, scale: number): void;
  setPaused(paused: boolean): void;
  memory(): OrbitMemory;
  dispose(): OrbitMemory;
}

const NODE_RADIUS = 0.07;
const NODE_SIDES = [3, 4, 6] as const;
const RADIANS_PER_SECOND = 0.06;
const VIEW_MARGIN = 0.45;
const RING_SEGMENTS = 96;

/**
 * Draws the rings and one node per skill on `canvas`, and reports each node's centre in CSS pixels
 * relative to the canvas on every frame. A portrait canvas turns the ellipses upright.
 */
export function createOrbitScene(
  canvas: HTMLCanvasElement,
  nodes: readonly OrbitNode[],
  palette: OrbitPalette,
  onFrame: (points: readonly OrbitPoint[]) => void
): OrbitScene {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 5;

  const ringMaterial = new LineBasicMaterial({ color: palette.ring });
  const rings = ORBIT_ELLIPSES.map(({ rx, ry }) => {
    const outline = new EllipseCurve(0, 0, rx, ry).getPoints(RING_SEGMENTS);
    const ring = new LineLoop(new BufferGeometry().setFromPoints(outline), ringMaterial);
    scene.add(ring);
    return ring;
  });

  const domainIds = [...new Set(nodes.map((node) => node.domainId))];
  const meshes = nodes.map((node) => {
    const sides = NODE_SIDES[domainIds.indexOf(node.domainId) % NODE_SIDES.length];
    const mesh = new Mesh(new CircleGeometry(NODE_RADIUS, sides), new MeshBasicMaterial({ color: palette.nodes[node.domainId] }));
    scene.add(mesh);
    return mesh;
  });

  const [, outer] = ORBIT_ELLIPSES;
  const longSide = outer.rx + VIEW_MARGIN;
  const shortSide = outer.ry + VIEW_MARGIN;
  let width = 0;
  let height = 0;
  let upright = false;
  let unitsPerPixel = 1;

  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (width === 0 || height === 0) return;
    upright = height > width;
    const across = upright ? shortSide : longSide;
    const along = upright ? longSide : shortSide;
    unitsPerPixel = Math.max((2 * across) / width, (2 * along) / height);
    camera.left = (-width * unitsPerPixel) / 2;
    camera.right = (width * unitsPerPixel) / 2;
    camera.top = (height * unitsPerPixel) / 2;
    camera.bottom = (-height * unitsPerPixel) / 2;
    camera.updateProjectionMatrix();
    rings.forEach((ring) => {
      ring.rotation.z = upright ? Math.PI / 2 : 0;
    });
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  let paused = false;
  let turned = 0;
  let previousTime: number | null = null;
  let frame = 0;

  const render = (time: number) => {
    frame = requestAnimationFrame(render);
    if (previousTime !== null && !paused) turned += ((time - previousTime) / 1000) * RADIANS_PER_SECOND;
    previousTime = time;
    if (width === 0 || height === 0) return;
    const points = nodes.map((node, index) => {
      const { rx, ry } = ORBIT_ELLIPSES[node.ring];
      const angle = node.angle + (node.ring === 0 ? turned : -turned);
      const along = rx * Math.cos(angle);
      const across = ry * Math.sin(angle);
      const x = upright ? across : along;
      const y = upright ? along : across;
      meshes[index].position.set(x, y, 0);
      return { x: width / 2 + x / unitsPerPixel, y: height / 2 - y / unitsPerPixel };
    });
    renderer.render(scene, camera);
    onFrame(points);
  };
  frame = requestAnimationFrame(render);

  const memory = (): OrbitMemory => ({
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    programs: renderer.info.programs?.length ?? 0,
  });

  return {
    setNodeScale(index, scale) {
      meshes[index]?.scale.setScalar(scale);
    },
    setPaused(next) {
      paused = next;
    },
    memory,
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      scene.traverse((object) => {
        const { geometry, material } = object as Partial<Mesh>;
        geometry?.dispose();
        for (const entry of ([] as Material[]).concat(material ?? [])) {
          Object.values(entry).forEach((value) => {
            if (value instanceof Texture) value.dispose();
          });
          entry.dispose();
        }
      });
      scene.clear();
      const remaining = memory();
      renderer.dispose();
      renderer.forceContextLoss();
      return remaining;
    },
  };
}
