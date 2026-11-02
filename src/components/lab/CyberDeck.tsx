import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { audioSynth } from '../../utils/audio';
import { useLocale } from '../../i18n/index';

const CARTRIDGE_CODE_SNIPPET = `// PHANTOM ZERO-G CORE PIPELINE v4.2
export class QuantumStreamPipeline {
  private readonly buffer: Float32Array;
  private readonly sampleRate = 48000;

  constructor(private readonly channels: number = 2) {
    this.buffer = new Float32Array(1024 * channels);
  }

  public synthesizeFrame(deltaMs: number): FramePacket {
    const frequency = 440.0 * Math.pow(2, (deltaMs % 12) / 12);
    return {
      status: "NOMINAL",
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      vramAllocated: "34.2 MB",
      renderEngine: "WebGL 2.0 / Three.js Core",
      telemetryHz: frequency.toFixed(1) + " Hz"
    };
  }
}`;

export const CyberDeck: React.FC = () => {
  const { dict: t } = useLocale();
  const mountRef = useRef<HTMLDivElement>(null);
  const [isEjected, setIsEjected] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cartridgeGroupRef = useRef<THREE.Group | null>(null);
  const ledMeshRef = useRef<THREE.Mesh | null>(null);
  const ledLightRef = useRef<THREE.PointLight | null>(null);
  const animFrameRef = useRef<number>(0);

  const isDraggingRef = useRef<boolean>(false);
  const prevPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const angularVelocityRef = useRef<{ x: number; y: number }>({
    x: 0.005,
    y: 0.01,
  });
  const targetEjectProgressRef = useRef<number>(0);
  const currentEjectProgressRef = useRef<number>(0);

  useEffect(() => {
    setIsMuted(audioSynth.isMuted());
    const handleMute = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail) {
        setIsMuted(customEvent.detail.muted);
      }
    };
    window.addEventListener('bebop:audio-mute-change', handleMute);
    return () => {
      window.removeEventListener('bebop:audio-mute-change', handleMute);
    };
  }, []);

  const handleToggleEject = useCallback(() => {
    const nextEjected = !isEjected;
    setIsEjected(nextEjected);
    targetEjectProgressRef.current = nextEjected ? 1 : 0;

    if (!audioSynth.isMuted()) {
      if (nextEjected) {
        audioSynth.playKeypressBeep(720, 0.08, 0.2);
        setTimeout(() => audioSynth.playAlarm8Bit(2), 90);
      } else {
        audioSynth.playKnobClick(900, 0.12);
        setTimeout(() => audioSynth.playSonarBlip(660, 0.04, 0.15), 60);
      }
    }
  }, [isEjected]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 7.8);
    cameraRef.current = camera;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambientLight = new THREE.AmbientLight(0xfbfaf4, 1.1);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfbfaf4, 2.2);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

    const rimRedLight = new THREE.PointLight(0xfe0000, 3.2, 15);
    rimRedLight.position.set(-4, -2, -3);
    scene.add(rimRedLight);

    const ledPointLight = new THREE.PointLight(0xfbfaf4, 1.5, 4);
    ledPointLight.position.set(0.9, 1.6, 0.45);
    scene.add(ledPointLight);
    ledLightRef.current = ledPointLight;

    const cartridgeGroup = new THREE.Group();
    cartridgeGroupRef.current = cartridgeGroup;

    const bodyGeometry = new THREE.BoxGeometry(2.8, 3.8, 0.55);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x080808,
      roughness: 0.35,
      metalness: 0.7,
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    cartridgeGroup.add(bodyMesh);

    const ridgeGeometry = new THREE.BoxGeometry(2.2, 0.08, 0.06);
    const ridgeMaterial = new THREE.MeshStandardMaterial({
      color: 0xfe0000,
      roughness: 0.4,
      metalness: 0.6,
    });
    for (let i = 0; i < 4; i++) {
      const ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
      ridge.position.set(0, 1.1 + i * 0.18, 0.28);
      cartridgeGroup.add(ridge);
    }

    const pinGeometry = new THREE.BoxGeometry(2.1, 0.35, 0.15);
    const pinMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbfaf4,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0xfbfaf4,
      emissiveIntensity: 0.12,
    });
    const pinMesh = new THREE.Mesh(pinGeometry, pinMaterial);
    pinMesh.position.set(0, -1.95, 0);
    cartridgeGroup.add(pinMesh);

    const labelGeometry = new THREE.PlaneGeometry(2.2, 1.6);
    const labelMaterial = new THREE.MeshStandardMaterial({
      color: 0xfe0000,
      roughness: 0.4,
      metalness: 0.3,
    });
    const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
    labelMesh.position.set(0, -0.2, 0.285);
    cartridgeGroup.add(labelMesh);

    const borderGeometry = new THREE.EdgesGeometry(labelGeometry);
    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xfbfaf4,
      linewidth: 2,
    });
    const borderMesh = new THREE.LineSegments(borderGeometry, borderMaterial);
    borderMesh.position.set(0, -0.2, 0.287);
    cartridgeGroup.add(borderMesh);

    const ledGeometry = new THREE.SphereGeometry(0.09, 16, 16);
    const ledMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbfaf4,
      emissive: 0xfbfaf4,
      emissiveIntensity: 1.8,
      roughness: 0.1,
    });
    const ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
    ledMesh.position.set(0.9, 1.55, 0.29);
    cartridgeGroup.add(ledMesh);
    ledMeshRef.current = ledMesh;

    scene.add(cartridgeGroup);

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevPointerRef.current = { x: clientX, y: clientY };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - prevPointerRef.current.x;
      const deltaY = clientY - prevPointerRef.current.y;
      prevPointerRef.current = { x: clientX, y: clientY };

      angularVelocityRef.current = {
        x: deltaY * 0.008,
        y: deltaX * 0.008,
      };

      if (cartridgeGroupRef.current) {
        cartridgeGroupRef.current.rotation.y += angularVelocityRef.current.y;
        cartridgeGroupRef.current.rotation.x += angularVelocityRef.current.x;
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    domEl.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    const handleResize = () => {
      if (!container || !cameraRef.current || !rendererRef.current) return;
      const newWidth = container.clientWidth || 360;
      const newHeight = container.clientHeight || 360;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    const startTime = performance.now();

    const animate = () => {
      const elapsedTime = (performance.now() - startTime) / 1000;

      const targetProgress = targetEjectProgressRef.current;
      currentEjectProgressRef.current +=
        (targetProgress - currentEjectProgressRef.current) * 0.08;
      const ejectProg = currentEjectProgressRef.current;

      if (cartridgeGroupRef.current) {
        if (!isDraggingRef.current) {
          cartridgeGroupRef.current.rotation.y += angularVelocityRef.current.y;
          cartridgeGroupRef.current.rotation.x += angularVelocityRef.current.x;

          angularVelocityRef.current.x *= 0.94;
          angularVelocityRef.current.y *= 0.94;

          if (Math.abs(angularVelocityRef.current.y) < 0.002) {
            cartridgeGroupRef.current.rotation.y += 0.004;
          }
        }

        const floatOffset = Math.sin(elapsedTime * 1.6) * 0.12;
        const tiltOffset = Math.cos(elapsedTime * 1.1) * 0.05;

        cartridgeGroupRef.current.position.y = floatOffset + ejectProg * 1.2;
        cartridgeGroupRef.current.position.z = ejectProg * 0.8;
        cartridgeGroupRef.current.rotation.z = tiltOffset - ejectProg * 0.25;
      }

      if (ledMeshRef.current && ledLightRef.current) {
        const isCurrentlyEjected = ejectProg > 0.5;
        const colorHex = isCurrentlyEjected ? 0xfe0000 : 0xfbfaf4;
        (ledMeshRef.current.material as THREE.MeshStandardMaterial).color.setHex(
          colorHex
        );
        (
          ledMeshRef.current.material as THREE.MeshStandardMaterial
        ).emissive.setHex(colorHex);
        ledLightRef.current.color.setHex(colorHex);
      }

      renderer?.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();

      domEl.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);

      domEl.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer?.dispose();
      renderer?.forceContextLoss();
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggleEject();
    } else if (e.key === 'ArrowLeft' && cartridgeGroupRef.current) {
      cartridgeGroupRef.current.rotation.y -= 0.15;
    } else if (e.key === 'ArrowRight' && cartridgeGroupRef.current) {
      cartridgeGroupRef.current.rotation.y += 0.15;
    } else if (e.key === 'ArrowUp' && cartridgeGroupRef.current) {
      cartridgeGroupRef.current.rotation.x -= 0.15;
    } else if (e.key === 'ArrowDown' && cartridgeGroupRef.current) {
      cartridgeGroupRef.current.rotation.x += 0.15;
    }
  };

  return (
    <div
      data-cyber-deck
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={t.lab.deck.title}
      className="relative border-4 border-paper-white bg-space-surface-1 p-6 sm:p-8 md:p-10 shadow-[8px_8px_0_var(--color-bebop-red)] text-paper-white focus:outline-none focus:ring-2 focus:ring-bebop-red"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-2 border-bebop-red gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-bebop-red">
            {t.lab.deck.tag}
          </span>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl font-black text-paper-white uppercase">
            {t.lab.deck.title}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-deck-audio-toggle
            onClick={() => {
              const nextMuted = !isMuted;
              audioSynth.setMuted(nextMuted);
              setIsMuted(nextMuted);
              if (!nextMuted) {
                audioSynth.playKeypressBeep(720, 0.08, 0.2);
              }
            }}
            aria-label={t.lab.deck.title}
            className={`px-3 py-1.5 border-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-150 cursor-pointer ${
              !isMuted
                ? 'bg-bebop-red text-paper-white border-paper-white shadow-[3px_3px_0_var(--color-paper-white)]'
                : 'bg-space-base border-paper-white text-paper-white hover:bg-paper-white hover:text-space-base'
            }`}
          >
            <span>{!isMuted ? t.lab.deck.audioOn : t.lab.deck.audioMuted}</span>
          </button>

          <div
            data-cartridge-status
            className={`px-3 py-1.5 border-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-150 ${
              !isEjected
                ? 'bg-space-base text-paper-white border-paper-white'
                : 'bg-bebop-red text-paper-white border-paper-white animate-pulse'
            }`}
          >
            <span className="w-2 h-2 bg-current" />
            <span>{!isEjected ? t.lab.deck.docked : t.lab.deck.ejected}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[24rem] aspect-square border-4 border-paper-white bg-space-base shadow-[6px_6px_0_var(--color-bebop-red)] overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center">
            <div
              ref={mountRef}
              data-deck-canvas-container
              className="w-full h-full"
              role="img"
              aria-label={t.lab.deck.title}
            />

            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none text-[10px] font-mono text-paper-white bg-space-base/90 px-2.5 py-1 border border-paper-white/40">
              <span>{t.lab.deck.dragHint}</span>
              <span className="text-bebop-red font-bold">{t.lab.deck.dampingLabel}</span>
            </div>
          </div>

          <div className="mt-6 w-full max-w-[24rem]">
            <button
              type="button"
              data-deck-eject-btn
              onClick={handleToggleEject}
              className={`w-full py-3.5 px-6 border-2 border-paper-white font-mono font-black text-xs sm:text-sm tracking-widest uppercase transition-all duration-150 shadow-[4px_4px_0_var(--color-paper-white)] flex items-center justify-center gap-3 cursor-pointer ${
                !isEjected
                  ? 'bg-bebop-red text-paper-white hover:bg-paper-white hover:text-space-base'
                  : 'bg-paper-white text-space-base hover:bg-bebop-red hover:text-paper-white'
              }`}
            >
              <span>{!isEjected ? '⏏' : '⬇'}</span>
              <span>{!isEjected ? t.lab.deck.ejectBtn : t.lab.deck.reinsertBtn}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div
            data-deck-drawer
            className="border-2 border-paper-white bg-space-base p-5 font-mono shadow-[4px_4px_0_var(--color-bebop-red)]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-paper-white/30 text-xs">
              <span className="text-bebop-red font-bold tracking-wider uppercase">
                {isEjected ? t.lab.deck.decryptedHeader : t.lab.deck.lockedHeader}
              </span>
              <span
                className={`font-bold text-[11px] ${
                  isEjected ? 'text-paper-white' : 'text-muted-gray'
                }`}
              >
                {isEjected ? t.lab.deck.dumpActive : t.lab.deck.dumpLocked}
              </span>
            </div>

            <div className="mt-4">
              <div className="text-[10px] text-muted-gray uppercase mb-2 flex items-center justify-between">
                <span>MODULE: PHANTOM_STREAM_PIPELINE.TS</span>
                <span className="text-bebop-red font-bold">SECTOR: 0x7F4A</span>
              </div>

              <pre
                data-code-block
                className="border border-paper-white/40 bg-space-surface-1 p-3.5 text-[11px] leading-relaxed text-paper-white overflow-x-auto font-mono max-h-56"
              >
                <code>
                  {isEjected
                    ? CARTRIDGE_CODE_SNIPPET
                    : t.lab.deck.lockedCodeComment}
                </code>
              </pre>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-mono text-muted-gray border-t border-paper-white/30 pt-3">
            <span>{t.lab.deck.keyboardHint}</span>
            <span className="text-bebop-red font-bold">WEBGL 2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CyberDeck;
