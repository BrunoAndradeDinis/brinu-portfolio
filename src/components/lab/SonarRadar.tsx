import React, { useEffect, useRef, useState, useCallback } from 'react';
import { audioSynth } from '../../utils/audio';

interface RadarTarget {
  id: string;
  name: string;
  category: string;
  angleDeg: number; // 0 to 360
  distance: number; // 0.1 to 0.95
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
    color: '#2EFE0C', // Acid Green
    metrics: '99.98% Uptime • HLS 24/7',
    lastPingTime: 0,
  },
  {
    id: 'quake-log',
    name: 'Quake Log Parser',
    category: 'CONCURRENT BACKEND',
    angleDeg: 128,
    distance: 0.46,
    color: '#2EFE0C',
    metrics: 'O(N) Concurrency • Go & Node',
    lastPingTime: 0,
  },
  {
    id: 'jokenpo',
    name: 'Jokenpo Arena Franky',
    category: 'CREATIVE FRONTEND',
    angleDeg: 215,
    distance: 0.78,
    color: '#EBA602', // Bebop Amber
    metrics: 'Interactive Canvas • Sound FX',
    lastPingTime: 0,
  },
  {
    id: 'the-warriors',
    name: 'The Warriors',
    category: 'EDITORIAL DESIGN',
    angleDeg: 295,
    distance: 0.58,
    color: '#30B5BB', // CRT Cyan
    metrics: '90s Cult Cinema • Gulp Pipeline',
    lastPingTime: 0,
  },
  {
    id: 'painel-stream',
    name: 'Painel-Stream Control',
    category: 'TELEMETRY & S3 STORAGE',
    angleDeg: 342,
    distance: 0.35,
    color: '#FE0000', // Bebop Red
    metrics: 'Magalu Cloud S3 • Next.js 16',
    lastPingTime: 0,
  },
];

export const SonarRadar: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [activeTarget, setActiveTarget] = useState<RadarTarget>(INITIAL_TARGETS[0]);
  const targetsRef = useRef<RadarTarget[]>(INITIAL_TARGETS);
  const beamAngleRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Sincroniza estado de mudo com o áudio global
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

  // Loop principal de renderização Canvas 2D
  const renderRadar = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const dt = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    // Velocidade de rotação: ~60 graus por segundo (uma volta a cada 6 segundos)
    const prevAngle = beamAngleRef.current;
    const nextAngle = (prevAngle + 60 * dt) % 360;
    beamAngleRef.current = nextAngle;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) * 0.90;

    // Limpa fundo escuro militar
    ctx.clearRect(0, 0, width, height);

    // 1. Fundo do escopo circular
    const bgGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    bgGrad.addColorStop(0, 'rgba(8, 8, 8, 0.95)');
    bgGrad.addColorStop(0.75, 'rgba(17, 17, 30, 0.95)');
    bgGrad.addColorStop(1, 'rgba(26, 26, 46, 1)');
    ctx.fillStyle = bgGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // 2. Anéis concêntricos de alcance (25%, 50%, 75%, 100%)
    const ringFractions = [0.25, 0.5, 0.75, 1.0];
    ringFractions.forEach((frac, idx) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * frac, 0, Math.PI * 2);
      ctx.strokeStyle = idx === 3 ? 'rgba(46, 254, 12, 0.7)' : 'rgba(46, 254, 12, 0.2)';
      ctx.lineWidth = idx === 3 ? 3 : 1;
      if (idx !== 3) ctx.setLineDash([4, 6]);
      else ctx.setLineDash([]);
      ctx.stroke();
    });

    // 3. Eixos e mira em cruz (+)
    ctx.beginPath();
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(46, 254, 12, 0.25)';
    ctx.lineWidth = 1;
    // Horizontal
    ctx.moveTo(centerX - radius, centerY);
    ctx.lineTo(centerX + radius, centerY);
    // Vertical
    ctx.moveTo(centerX, centerY - radius);
    ctx.lineTo(centerX, centerY + radius);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Feixe rotativo e gradiente de varredura (Sweep Sector)
    const beamRad = (nextAngle - 90) * (Math.PI / 180);
    const sweepArcRad = 0.55; // ~31 graus de cauda

    // Desenha o setor de fósforo residual
    const sweepGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    sweepGrad.addColorStop(0, 'rgba(46, 254, 12, 0.35)');
    sweepGrad.addColorStop(1, 'rgba(46, 254, 12, 0.05)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, beamRad - sweepArcRad, beamRad);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();
    ctx.restore();

    // Linha frontal do feixe (borda brilhante)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + radius * Math.cos(beamRad), centerY + radius * Math.sin(beamRad));
    ctx.strokeStyle = 'rgba(46, 254, 12, 0.95)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 5. Verificação e renderização dos Alvos (Blips)
    targetsRef.current.forEach((target) => {
      // Checa se o feixe acabou de passar pelo alvo
      const targetAngle = target.angleDeg;
      let angleDiff = nextAngle - targetAngle;
      if (angleDiff < 0) angleDiff += 360;

      // Se o feixe cruzou o alvo nesta janela
      if (angleDiff <= (nextAngle - prevAngle + 360) % 360 && angleDiff < 8) {
        if (time - target.lastPingTime > 2000) {
          target.lastPingTime = time;
          setActiveTarget(target);
          if (!audioSynth.isMuted()) {
            audioSynth.playSonarBlip(880, 0.05, 0.15);
          }
        }
      }

      // Calcula intensidade do brilho baseado no tempo do último ping
      const elapsed = (time - target.lastPingTime) / 1000;
      const decayDuration = 2.2;
      const intensity = target.lastPingTime > 0 ? Math.max(0, 1 - elapsed / decayDuration) : 0;

      const targetRad = (target.angleDeg - 90) * (Math.PI / 180);
      const targetDistPx = radius * target.distance;
      const targetX = centerX + targetDistPx * Math.cos(targetRad);
      const targetY = centerY + targetDistPx * Math.sin(targetRad);

      // Ponto base do alvo
      ctx.beginPath();
      ctx.arc(targetX, targetY, 4, 0, Math.PI * 2);
      ctx.fillStyle = intensity > 0.1 ? target.color : 'rgba(138, 138, 158, 0.5)';
      ctx.fill();

      // Aura de pulso luminescente
      if (intensity > 0.01) {
        ctx.beginPath();
        ctx.arc(targetX, targetY, 6 + (1 - intensity) * 14, 0, Math.PI * 2);
        ctx.strokeStyle = target.color;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = intensity * 0.8;
        ctx.stroke();
        ctx.globalAlpha = 1.0;
      }

      // Rótulo de texto do alvo
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

    // Limita dpr para performance máxima (regra AD-1)
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
      className="relative rounded-3xl border-4 border-space-base bg-space-surface-1/90 p-6 sm:p-8 md:p-10 shadow-comic-lg text-paper-white"
    >
      {/* Cabeçalho do Experimento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-space-border/60 gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-bebop-amber">
            // EXPERIMENT 02 • BOUNTY SONAR RADAR
          </span>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl font-black text-paper-white uppercase">
            MILITARY 360° ACOUSTIC SWEEP
          </h3>
        </div>

        {/* Controles de Áudio e Status */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            data-radar-audio-toggle
            onClick={toggleSound}
            aria-label="Alternar áudio do sonar"
            className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 shadow-comic-xs ${
              !isMuted
                ? 'bg-acid-green/15 text-acid-green border-acid-green shadow-comic-sm'
                : 'bg-space-surface-2 border-space-border text-muted-gray hover:text-paper-white'
            }`}
          >
            {!isMuted ? (
              <svg className="size-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
              </svg>
            ) : (
              <svg className="size-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5.586 15H2v-6h3.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            )}
            <span>{!isMuted ? 'SONAR AUDIO: ON' : 'SONAR AUDIO: MUTED'}</span>
          </button>
        </div>
      </div>

      {/* Grid Principal: Canvas do Radar e Painel de Telemetria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Coluna do Canvas 2D */}
        <div className="lg:col-span-7 flex justify-center items-center">
          <div className="relative w-full max-w-[28rem] aspect-square rounded-full border-4 border-space-base shadow-comic-lg p-2 bg-space-surface-2/60">
            <canvas
              ref={canvasRef}
              data-radar-canvas
              role="img"
              aria-label="Radar militar interativo Bounty Sonar em 360 graus com varredura contínua e alvos detectados"
              className="w-full h-full rounded-full cursor-crosshair block"
            />
          </div>
        </div>

        {/* Coluna de Telemetria de Alvo Detectado */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="rounded-2xl border-2 border-space-border/80 bg-space-surface-2/80 p-5 font-mono shadow-comic-sm">
            <div className="flex items-center justify-between pb-3 border-b border-space-border/50 text-xs">
              <span className="text-bebop-amber font-bold tracking-wider uppercase">
                TARGET TELEMETRY //
              </span>
              <span className="inline-flex items-center gap-1.5 text-acid-green font-bold text-[11px]">
                <span className="w-2 h-2 rounded-full bg-acid-green animate-ping" />
                ACQUIRED
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <span className="text-[10px] text-muted-gray uppercase block tracking-wider">
                  IDENTIFIED CONTACT
                </span>
                <h4
                  data-target-name
                  className="font-display text-xl sm:text-2xl font-black text-paper-white uppercase mt-0.5"
                >
                  {activeTarget.name}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                <div className="rounded border border-space-border/60 bg-space-base/60 p-2.5">
                  <span className="text-[10px] text-muted-gray uppercase block">AZIMUTH</span>
                  <span className="font-bold text-acid-green">{activeTarget.angleDeg.toFixed(1)}°</span>
                </div>
                <div className="rounded border border-space-border/60 bg-space-base/60 p-2.5">
                  <span className="text-[10px] text-muted-gray uppercase block">DISTANCE</span>
                  <span className="font-bold text-crt-cyan">{(activeTarget.distance * 100).toFixed(0)} km</span>
                </div>
              </div>

              <div className="rounded border border-space-border/60 bg-space-base/60 p-2.5 text-xs">
                <span className="text-[10px] text-muted-gray uppercase block">SPECIFICATION</span>
                <span className="text-paper-white font-semibold">{activeTarget.metrics}</span>
              </div>
            </div>
          </div>

          {/* Lista de Alvos Sintonizáveis */}
          <div>
            <span className="font-mono text-xs text-muted-gray uppercase tracking-wider block mb-2 font-bold">
              TARGET MANIFEST (5 CONTACTS)
            </span>
            <div className="flex flex-wrap gap-2">
              {INITIAL_TARGETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  data-select-target={t.id}
                  onClick={() => {
                    setActiveTarget(t);
                    t.lastPingTime = performance.now();
                    if (!audioSynth.isMuted()) {
                      audioSynth.playSonarBlip(880, 0.05, 0.15);
                    }
                  }}
                  className={`px-2.5 py-1 rounded border font-mono text-[11px] font-semibold transition-all duration-200 shadow-comic-xs ${
                    activeTarget.id === t.id
                      ? 'bg-paper-white text-space-base border-paper-white shadow-comic-sm font-bold'
                      : 'bg-space-surface-2 border-space-border text-paper-white hover:border-acid-green hover:text-acid-green'
                  }`}
                >
                  {t.name}
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
