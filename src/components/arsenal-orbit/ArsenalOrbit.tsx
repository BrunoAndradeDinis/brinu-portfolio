import { useEffect, useRef, useState } from 'react';
import { getLocalizedArsenal } from '../../data/arsenal';
import { useLocale } from '../../i18n/index';
import { audioSynth } from '../../utils/audio';
import { MOTION_DURATION, MOTION_EASE, gsap } from '../../utils/motion';
import { layoutOrbit } from './orbit-layout';
import type { OrbitMemory, OrbitPalette, OrbitScene } from './orbit-scene';

const NODES = layoutOrbit();
const PULSE_SCALE = 1.8;
const BLIP_HZ = [880, 660] as const;
const MUTE_CHANGE_EVENT = 'bebop:audio-mute-change';

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
  const { dict, locale } = useLocale();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodeRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nodeScales = useRef<number[]>([]);
  const sceneRef = useRef<OrbitScene | null>(null);
  const pulseRef = useRef<{ index: number; tween: gsap.core.Tween } | null>(null);
  const [onScreen, setOnScreen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [muted, setMuted] = useState(true);
  const skills = getLocalizedArsenal(locale).flatMap((domain) => domain.skills.map((skill) => ({ ...skill, domain: domain.title })));
  const active = activeIndex === null ? null : skills[activeIndex];

  useEffect(() => {
    const syncMuted = () => setMuted(audioSynth.isMuted());
    syncMuted();
    window.addEventListener(MUTE_CHANGE_EVENT, syncMuted);
    return () => window.removeEventListener(MUTE_CHANGE_EVENT, syncMuted);
  }, []);

  const pulse = (index: number) => {
    const beat = { scale: 1 };
    const tween = gsap.to(beat, {
      scale: PULSE_SCALE,
      duration: MOTION_DURATION.seconds / 2,
      ease: MOTION_EASE.fade,
      yoyo: true,
      repeat: 1,
      onUpdate: () => {
        sceneRef.current?.setNodeScale(index, beat.scale);
        nodeScales.current[index] = beat.scale;
      },
    });
    pulseRef.current = { index, tween };
  };

  const activate = (index: number) => {
    sceneRef.current?.setPaused(true);
    // Hover, focus and click all arrive for one tap; one pulse answers them.
    if (pulseRef.current?.index === index && pulseRef.current.tween.isActive()) return;
    setActiveIndex(index);
    pulse(index);
    audioSynth.playSonarBlip(BLIP_HZ[NODES[index].ring]);
  };
  const release = () => sceneRef.current?.setPaused(false);

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
          if (node) node.style.transform = `translate3d(${point.x}px, ${point.y}px, 0) translate(-50%, -50%) scale(${nodeScales.current[index] ?? 1})`;
        });
        if (reported) return;
        reported = true;
        reportMemory(stage, scene.memory());
        stage.dataset.orbitState = 'running';
      });
      disposeScene = scene.dispose;
      sceneRef.current = scene;
    });

    return () => {
      left = true;
      sceneRef.current = null;
      if (!disposeScene) return;
      reportMemory(stage, disposeScene());
      stage.dataset.orbitState = 'disposed';
    };
  }, [onScreen]);

  return (
    <div data-arsenal-orbit className="mx-auto w-full max-w-[72rem] min-w-0">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          data-orbit-sound
          aria-pressed={!muted}
          onClick={() => audioSynth.toggleMute()}
          className="cursor-pointer border-2 border-paper-white bg-space-base px-3 py-2 font-mono text-xs font-black text-paper-white uppercase transition-colors duration-100 hover:bg-bebop-red hover:text-space-base focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-paper-white aria-pressed:bg-bebop-red aria-pressed:text-space-base"
        >
          {muted ? dict.menu.audioMuted : dict.menu.audioOn}
        </button>
      </div>
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
                aria-pressed={index === activeIndex}
                onPointerEnter={() => activate(index)}
                onPointerLeave={release}
                onFocus={() => activate(index)}
                onBlur={release}
                onClick={() => activate(index)}
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
      <div data-orbit-evidence aria-live="polite" className="mt-4 min-h-32 border-l-4 border-bebop-red pl-4 text-paper-white">
        {active && (
          <>
            <p className="font-mono text-xs font-bold tracking-widest uppercase">{active.domain}</p>
            <h4 className="mt-1 font-display text-xl font-black break-words uppercase sm:text-2xl">{active.name}</h4>
            <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
              {active.evidence.map((evidence) => (
                <li key={evidence.ref}>
                  <a
                    href={`#${evidence.anchor}`}
                    data-orbit-evidence-link={evidence.ref}
                    className="inline-block border-2 border-bebop-red px-2 py-1 font-mono text-xs font-bold text-paper-white uppercase transition-colors duration-150 hover:bg-bebop-red hover:text-space-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-paper-white"
                  >
                    {evidence.label}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
