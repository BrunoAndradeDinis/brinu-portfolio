import { useEffect, useRef, useState } from 'react';
import { useLocale } from '../../i18n/index';
import { layoutOrbit } from './orbit-layout';
import type { OrbitMemory, OrbitPalette } from './orbit-scene';

const NODES = layoutOrbit();

function readPalette(): OrbitPalette {
  const tokens = getComputedStyle(document.documentElement);
  const token = (name: string) => tokens.getPropertyValue(name).trim();
  return {
    ring: token('--color-muted-gray'),
    nodes: {
      frontend: token('--color-bebop-red'),
      backend: token('--color-paper-white'),
      quality: token('--color-muted-gray'),
    },
  };
}

function reportMemory(stage: HTMLElement, memory: OrbitMemory): void {
  stage.dataset.orbitGeometries = String(memory.geometries);
  stage.dataset.orbitTextures = String(memory.textures);
  stage.dataset.orbitPrograms = String(memory.programs);
}

export default function ArsenalOrbit() {
  const { dict } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [onScreen, setOnScreen] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!onScreen || !stage || !canvas) return;
    let disposeScene: (() => OrbitMemory) | null = null;
    let left = false;

    void import('./orbit-scene').then(({ createOrbitScene }) => {
      if (left) return;
      let reported = false;
      const scene = createOrbitScene(canvas, NODES, readPalette(), (points) => {
        points.forEach((point, index) => {
          const node = nodeRefs.current[index];
          if (node) node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%)`;
        });
        if (reported) return;
        reported = true;
        reportMemory(stage, scene.memory());
        stage.dataset.orbitState = 'running';
      });
      disposeScene = scene.dispose;
    });

    return () => {
      left = true;
      if (!disposeScene) return;
      reportMemory(stage, disposeScene());
      stage.dataset.orbitState = 'disposed';
    };
  }, [onScreen]);

  return (
    <div data-arsenal-orbit className="mx-auto w-full max-w-[72rem] min-w-0">
      <div
        ref={stageRef}
        data-orbit-stage
        role="group"
        aria-label={dict.about.skillsTitle}
        className="relative aspect-[2/3] w-full max-w-full overflow-hidden border-4 border-paper-white bg-space-surface-1 sm:aspect-[16/9] [&:not([data-orbit-state=running])_button]:invisible"
      >
        {onScreen && (
          <>
            <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 block h-full w-full max-w-full" />
            {NODES.map((node, index) => (
              <button
                key={node.name}
                ref={(element) => {
                  nodeRefs.current[index] = element;
                }}
                type="button"
                data-orbit-node={node.domainId}
                aria-label={node.name}
                className="group absolute top-0 left-0 size-11 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper-white"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-full left-1/2 hidden -translate-x-1/2 bg-space-base px-1 font-mono text-[10px] font-bold whitespace-nowrap text-paper-white uppercase sm:block md:text-xs"
                >
                  {node.name}
                </span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
