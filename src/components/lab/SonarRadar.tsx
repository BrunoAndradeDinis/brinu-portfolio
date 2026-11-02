import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioSynth } from '../../utils/audio';
import { useLocale } from '../../i18n/index';

interface RadarTarget {
  id: string;
  name: string;
  category: string;
  angleDeg: number;
  distance: number;
  color: string;
  metrics: string;
  lastPingTime: number;
}

const INITIAL_TARGETS: RadarTarget[] = [
  {
    id: 'aurastream',
    name: 'AuraStream Engine',
    category: 'CLOUD STREAMING',
    angleDeg: 42,
    distance: 0.68,
    color: '#FE0000',
    metrics: '99.98% Uptime • HLS 24/7',
    lastPingTime: 0,
  },
  {
    id: 'quake-log',
    name: 'Quake Log Parser',
    category: 'CONCURRENT BACKEND',
    angleDeg: 128,
    distance: 0.46,
    color: '#FBFAF4',
    metrics: 'O(N) Concurrency • Go & Node',
    lastPingTime: 0,
  },
  {
    id: 'jokenpo',
    name: 'Jokenpo Arena Franky',
    category: 'CREATIVE FRONTEND',
    angleDeg: 215,
    distance: 0.78,
    color: '#FE0000',
    metrics: 'Interactive Canvas • Sound FX',
    lastPingTime: 0,
  },
  {
    id: 'the-warriors',
    name: 'The Warriors',
    category: 'EDITORIAL DESIGN',
    angleDeg: 295,
    distance: 0.58,
    color: '#FBFAF4',
    metrics: '90s Cult Cinema • Gulp Pipeline',
    lastPingTime: 0,
  },
  {
    id: 'painel-stream',
    name: 'Painel-Stream Control',
    category: 'TELEMETRY & S3 STORAGE',
    angleDeg: 342,
    distance: 0.35,
    color: '#FE0000',
    metrics: 'Magalu Cloud S3 • Next.js 16',
    lastPingTime: 0,
  },
];

export const SonarRadar: React.FC = () => {
  const { dict: t } = useLocale();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [activeTarget, setActiveTarget] = useState<RadarTarget>(INITIAL_TARGETS[0]);
  const targetsRef = useRef<RadarTarget[]>(INITIAL_TARGETS);
  const beamAngleRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  useEffect(() => {
    setIsMuted(audioSynth.isMuted());

    const handleMuteChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ muted: boolean }>;
      if (customEvent.detail) {
        setIsMuted(customEvent.detail.muted);
      }
    };

    window.addEventListener('bebop:audio-mute-change', handleMuteChange);
    return () => {
      window.removeEventListener('bebop:audio-mute-change', handleMuteChange);
    };
  }, []);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    audioSynth.setMuted(nextMuted);
    setIsMuted(nextMuted);
    if (!nextMuted) {
      audioSynth.playSonarBlip(880, 0.08, 0.2);
    }
  };

  const renderRadar = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const prevAngle = beamAngleRef.current;
    const nextAngle = (prevAngle + 60 * dt) % 360;
    beamAngleRef.current = nextAngle;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.9;

    ctx.clearRect(0, 0, width, height);

    const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGrad.addColorStop(0, 'rgba(8, 8, 8, 0.98)');
    bgGrad.addColorStop(1, 'rgba(13, 13, 13, 1)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    const ringFractions = [0.25, 0.5, 0.75, 1.0];
    ringFractions.forEach((frac, idx) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * frac, 0, Math.PI * 2);
      ctx.strokeStyle =
        idx === 3 ? 'rgba(254, 0, 0, 0.85)' : 'rgba(251, 250, 244, 0.22)';
      ctx.lineWidth = idx === 3 ? 3 : 1;
      if (idx !== 3) ctx.setLineDash([4, 6]);
      else ctx.setLineDash([]);
      ctx.stroke();
    });

    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(251, 250, 244, 0.25)';
    ctx.lineWidth = 1;
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
    ctx.setLineDash([]);

    const beamRad = (nextAngle - 90) * (Math.PI / 180);
    const sweepArcRad = 0.55;

    const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    sweepGrad.addColorStop(0, 'rgba(254, 0, 0, 0.4)');
    sweepGrad.addColorStop(1, 'rgba(254, 0, 0, 0.05)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, beamRad - sweepArcRad, beamRad);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius * Math.cos(beamRad), centerY + radius * Math.sin(beamRad));
    ctx.strokeStyle = 'rgba(254, 0, 0, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    targetsRef.current.forEach((target) => {
      const targetAngle = target.angleDeg;
      let angleDiff = nextAngle - targetAngle;
      if (angleDiff < 0) angleDiff += 360;

      if (angleDiff <= (nextAngle - prevAngle + 360) % 360 && angleDiff < 8) {
        if (time - target.lastPingTime > 2000) {
          target.lastPingTime = time;
          setActiveTarget(target);
          if (!audioSynth.isMuted()) {
            audioSynth.playSonarBlip(880, 0.05, 0.15);
          }
        }
      }

      const elapsed = (time - target.lastPingTime) / 1000;
      const decayDuration = 2.2;
      const intensity =
        target.lastPingTime > 0 ? Math.max(0, 1 - elapsed / decayDuration) : 0;

      const targetRad = (target.angleDeg - 90) * (Math.PI / 180);
      const targetDistPx = radius * target.distance;
      const targetX = centerX + targetDistPx * Math.cos(targetRad);
      const targetY = centerY + targetDistPx * Math.sin(targetRad);

      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
      ctx.fillStyle = intensity > 0.1 ? target.color : 'rgba(199, 198, 191, 0.5)';
      ctx.fill();

      if (intensity > 0.01) {
        ctx.beginPath();
        ctx.arc(targetX, targetY, 6 + (1 - intensity) * 14, 0, Math.PI * 2);
        ctx.strokeStyle = target.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = intensity * 0.85;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      if (intensity > 0.25) {
        ctx.font = '10px "Space Mono", monospace';
        ctx.fillStyle = target.color;
        ctx.fillText(target.id.toUpperCase(), targetX + 8, targetY + 3);
      }
    });

    animFrameRef.current = requestAnimationFrame(renderRadar);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    animFrameRef.current = requestAnimationFrame(renderRadar);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [renderRadar]);

  return (
    <div
      data-sonar-radar
      className="relative border-4 border-paper-white bg-space-surface-1 p-6 sm:p-8 md:p-10 shadow-[8px_8px_0_var(--color-bebop-red)] text-paper-white"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-2 border-bebop-red gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-bebop-red">
            {t.lab.sonar.tag}
          </span>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl font-black text-paper-white uppercase">
            {t.lab.sonar.title}
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-radar-audio-toggle
            onClick={toggleSound}
            aria-label={t.lab.sonar.title}
            className={`px-3 py-1.5 border-2 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-150 cursor-pointer ${
              !isMuted
                ? 'bg-bebop-red text-paper-white border-paper-white shadow-[3px_3px_0_var(--color-paper-white)]'
                : 'bg-space-base border-paper-white text-paper-white hover:bg-paper-white hover:text-space-base'
            }`}
          >
            <span>{!isMuted ? t.lab.sonar.audioOn : t.lab.sonar.audioMuted}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex justify-center items-center">
          <div className="relative w-full max-w-[28rem] aspect-square rounded-full border-4 border-paper-white shadow-[6px_6px_0_var(--color-bebop-red)] p-2 bg-space-base">
            <canvas
              ref={canvasRef}
              data-radar-canvas
              role="img"
              aria-label={t.lab.sonar.title}
              className="w-full h-full rounded-full cursor-crosshair block"
            />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="border-2 border-paper-white bg-space-base p-5 font-mono shadow-[4px_4px_0_var(--color-bebop-red)]">
            <div className="flex items-center justify-between pb-3 border-b border-paper-white/30 text-xs">
              <span className="text-bebop-red font-bold tracking-wider uppercase">
                {t.lab.sonar.telemetryTag}
              </span>
              <span className="inline-flex items-center gap-1.5 text-paper-white font-bold text-[11px]">
                <span className="w-2 h-2 bg-bebop-red animate-ping" />
                {t.lab.sonar.acquired}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] text-muted-gray uppercase block tracking-wider">
                  {t.lab.sonar.contactLabel}
                </span>
                <h4
                  data-target-name
                  className="font-display text-xl sm:text-2xl font-black text-paper-white uppercase mt-0.5"
                >
                  {activeTarget.name}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="border border-paper-white/40 bg-space-surface-1 p-2.5">
                  <span className="text-[10px] text-muted-gray uppercase block">
                    {t.lab.sonar.azimuthLabel}
                  </span>
                  <span className="font-bold text-bebop-red">
                    {activeTarget.angleDeg.toFixed(1)}°
                  </span>
                </div>
                <div className="border border-paper-white/40 bg-space-surface-1 p-2.5">
                  <span className="text-[10px] text-muted-gray uppercase block">
                    {t.lab.sonar.distanceLabel}
                  </span>
                  <span className="font-bold text-paper-white">
                    {(activeTarget.distance * 100).toFixed(0)} km
                  </span>
                </div>
              </div>

              <div className="border border-paper-white/40 bg-space-surface-1 p-2.5 text-xs">
                <span className="text-[10px] text-muted-gray uppercase block">
                  {t.lab.sonar.specLabel}
                </span>
                <span className="text-paper-white font-semibold">
                  {activeTarget.metrics}
                </span>
              </div>
            </div>
          </div>

          <div>
            <span className="font-mono text-xs text-muted-gray uppercase tracking-wider block mb-2 font-bold">
              {t.lab.sonar.manifestLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {INITIAL_TARGETS.map((targetItem) => (
                <button
                  key={targetItem.id}
                  type="button"
                  data-select-target={targetItem.id}
                  onClick={() => {
                    setActiveTarget(targetItem);
                    targetItem.lastPingTime = performance.now();
                    if (!audioSynth.isMuted()) {
                      audioSynth.playSonarBlip(880, 0.05, 0.15);
                    }
                  }}
                  className={`px-2.5 py-1 border-2 font-mono text-[11px] font-bold transition-all duration-150 cursor-pointer ${
                    activeTarget.id === targetItem.id
                      ? 'bg-bebop-red text-paper-white border-paper-white shadow-[3px_3px_0_var(--color-paper-white)]'
                      : 'bg-space-base border-paper-white text-paper-white hover:bg-paper-white hover:text-space-base'
                  }`}
                >
                  {targetItem.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonarRadar;
