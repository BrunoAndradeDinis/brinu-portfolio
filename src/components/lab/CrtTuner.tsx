import React, { useState, useRef, useEffect, useCallback } from 'react';
import { audioSynth } from '../../utils/audio';

interface PresetChannel {
  freq: number;
  id: 'green' | 'amber' | 'chromatic';
  name: string;
  tag: string;
  description: string;
  color: string;
}

const PRESETS: PresetChannel[] = [
  {
    freq: 92.4,
    id: 'green',
    name: 'PHOSPHOR GREEN',
    tag: 'CH 01 // 92.4 MHz',
    description: 'Modo Noturno CRT Verde-Fósforo de Alta Persistência',
    color: '#2EFE0C',
  },
  {
    freq: 98.7,
    id: 'amber',
    name: 'VINTAGE AMBER',
    tag: 'CH 02 // 98.7 MHz',
    description: 'Terminal Analógico Monocromático de Tubo Âmbar',
    color: '#EBA602',
  },
  {
    freq: 104.2,
    id: 'chromatic',
    name: 'CHROMATIC CRT',
    tag: 'CH 03 // 104.2 MHz',
    description: 'Distorção de Aberração Cromática & Scanlines de Tubo',
    color: '#30B5BB',
  },
];

const MIN_FREQ = 88.0;
const MAX_FREQ = 108.0;
const MIN_ANGLE = -135;
const MAX_ANGLE = 135;

export const CrtTuner: React.FC = () => {
  const [frequency, setFrequency] = useState<number>(92.4);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const lastSoundFreqRef = useRef<number>(92.4);

  // Calcula o ângulo do knob com base na frequência
  const freqToAngle = useCallback((freq: number): number => {
    const ratio = (freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
    return MIN_ANGLE + ratio * (MAX_ANGLE - MIN_ANGLE);
  }, []);

  // Calcula a frequência com base no ângulo
  const angleToFreq = useCallback((angle: number): number => {
    const clamped = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
    const ratio = (clamped - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
    const val = MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ);
    return Math.round(val * 10) / 10;
  }, []);

  // Detecta se a frequência atual está sintonizada em um preset
  const activePreset = PRESETS.find(
    (p) => Math.abs(p.freq - frequency) <= 0.35
  );

  // Dispara clique sonoro mecânico a cada salto perceptível
  const updateFrequency = useCallback(
    (newFreq: number) => {
      const clamped = Math.max(MIN_FREQ, Math.min(MAX_FREQ, Math.round(newFreq * 10) / 10));
      if (Math.abs(clamped - lastSoundFreqRef.current) >= 0.2) {
        audioSynth.playKnobClick(1000 + (clamped - MIN_FREQ) * 30);
        lastSoundFreqRef.current = clamped;
      }
      setFrequency(clamped);
    },
    []
  );

  // Tratamento de arraste do Knob
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

      // Ângulo em graus onde 0° é apontando para cima
      let deg = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90;
      if (deg > 180) deg -= 360;

      const newFreq = angleToFreq(deg);
      updateFrequency(newFreq);
    },
    [isDragging, angleToFreq, updateFrequency]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, handlePointerMove, handlePointerUp]);

  // Acessibilidade de Teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      updateFrequency(frequency + 0.1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      updateFrequency(frequency - 0.1);
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      updateFrequency(frequency + 1.0);
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      updateFrequency(frequency - 1.0);
    }
  };

  const currentAngle = freqToAngle(frequency);

  return (
    <div
      data-crt-tuner
      className="relative rounded-3xl border-4 border-space-base bg-space-surface-1/90 p-6 sm:p-8 md:p-10 shadow-comic-lg text-paper-white"
    >
      {/* Cabeçalho do Experimento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-space-border/60 gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-bebop-amber">
            // EXPERIMENT 01 • CRT FREQUENCY TUNER
          </span>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl font-black text-paper-white uppercase">
            RADIO INTERFACE CONTROLLER
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-muted-gray uppercase">DIAL STATUS:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wider ${
              activePreset
                ? 'bg-acid-green/15 text-acid-green border-acid-green/40'
                : 'bg-bebop-amber/15 text-bebop-amber border-bebop-amber/40 animate-pulse'
            }`}
          >
            <span>●</span>
            {activePreset ? 'SIGNAL LOCKED' : 'SEARCHING FREQ'}
          </span>
        </div>
      </div>

      {/* Área de Visualização e Controles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Coluna 1: Tela CRT de Monitoramento */}
        <div className="lg:col-span-7 flex flex-col">
          <div
            data-crt-screen
            data-active-mode={activePreset ? activePreset.id : 'static'}
            className="relative w-full aspect-[16/10] rounded-2xl border-4 border-space-base bg-space-base overflow-hidden shadow-comic-md transition-all duration-300"
            style={{
              boxShadow: activePreset
                ? `0 0 35px ${activePreset.color}25, 0 8px 0 #080808`
                : '0 8px 0 #080808',
            }}
          >
            {/* Scanlines CRT Overlay */}
            <div
              className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] opacity-60 mix-blend-overlay"
              aria-hidden="true"
            />

            {/* Iluminação / Efeito de Fósforo do Tubo */}
            <div
              className="absolute inset-0 z-10 transition-colors duration-500 pointer-events-none"
              style={{
                backgroundColor: activePreset ? `${activePreset.color}12` : 'rgba(255,255,255,0.02)',
              }}
            />

            {/* Conteúdo da Tela CRT */}
            <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-between font-mono">
              {/* Topo do Monitor */}
              <div className="flex items-center justify-between text-xs border-b border-space-border/40 pb-2">
                <span className="text-muted-gray text-[10px] tracking-widest uppercase">
                  MONITOR // CH: {frequency.toFixed(1)} MHz
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: activePreset ? activePreset.color : '#8A8A9E' }}
                >
                  {activePreset ? activePreset.tag : 'NO CARRIER'}
                </span>
              </div>

              {/* Centro: Osciloscópio / Visualizador de Onda */}
              <div className="my-auto py-4 flex flex-col items-center justify-center text-center">
                {activePreset ? (
                  <div className="w-full space-y-3">
                    <svg
                      className="w-full h-16 sm:h-20"
                      viewBox="0 0 400 80"
                      fill="none"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0 40 Q 25 10, 50 40 T 100 40 T 150 40 T 200 40 T 250 40 T 300 40 T 350 40 T 400 40"
                        stroke={activePreset.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        className="animate-pulse"
                      />
                    </svg>
                    <div
                      className="font-display text-lg sm:text-2xl font-black tracking-wider uppercase"
                      style={{ color: activePreset.color }}
                    >
                      {activePreset.name}
                    </div>
                    <p className="text-xs text-paper-white/80 max-w-md mx-auto">
                      {activePreset.description}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-6">
                    <div className="font-mono text-sm sm:text-base text-muted-gray tracking-widest animate-pulse">
                      • • • SCANNING ANALOG FREQUENCIES • • •
                    </div>
                    <p className="text-xs text-muted-gray/70">
                      Gire o knob analógico para sintonizar nos canais 92.4, 98.7 ou 104.2 MHz.
                    </p>
                  </div>
                )}
              </div>

              {/* Rodapé da Tela */}
              <div className="flex items-center justify-between text-[10px] text-muted-gray pt-2 border-t border-space-border/40">
                <span>BEBOP BROADCAST NET // 1996</span>
                <span>SYNC: ANALOG TUBE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna 2: Knob Analógico e Display de Controle */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          {/* Display Digital de Frequência */}
          <div className="w-full max-w-[18rem] rounded-xl border-2 border-space-base bg-space-surface-2/90 p-4 mb-6 shadow-comic-sm font-mono text-center">
            <span className="block text-[10px] font-bold text-muted-gray uppercase tracking-widest mb-1">
              CURRENT FREQUENCY
            </span>
            <div
              data-frequency-display
              className="text-3xl sm:text-4xl font-black text-paper-white tracking-wider"
            >
              {frequency.toFixed(1)}{' '}
              <span className="text-sm font-normal text-bebop-amber">MHz</span>
            </div>
          </div>

          {/* Knob Rotativo Analógico */}
          <div className="relative flex flex-col items-center select-none">
            {/* Anel com Ticks de Escala */}
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
              {/* Escala Graduada Externa */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-space-border/60" />

              {/* Marcador Min e Max */}
              <span className="absolute bottom-1 left-2 font-mono text-[10px] text-muted-gray font-bold">
                88.0
              </span>
              <span className="absolute bottom-1 right-2 font-mono text-[10px] text-muted-gray font-bold">
                108.0
              </span>

              {/* O Dial Físico (Rotativo) */}
              <div
                ref={knobRef}
                data-tuner-knob
                role="slider"
                tabIndex={0}
                aria-label="Sintonizador de Frequência CRT"
                aria-valuenow={frequency}
                aria-valuemin={MIN_FREQ}
                aria-valuemax={MAX_FREQ}
                onKeyDown={handleKeyDown}
                onPointerDown={() => setIsDragging(true)}
                className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-space-base bg-space-surface-2 shadow-comic-md cursor-grab active:cursor-grabbing focus:outline-none focus:ring-4 focus:ring-bebop-amber/50 transition-transform duration-75 flex items-center justify-center"
                style={{
                  transform: `rotate(${currentAngle}deg)`,
                }}
              >
                {/* Textura do Disco Central */}
                <div className="w-20 h-20 rounded-full border-2 border-space-border bg-space-base/80 flex items-center justify-center shadow-inner">
                  <div className="w-6 h-6 rounded-full bg-space-surface-1 border border-space-border/80" />
                </div>

                {/* Indicador de Posição / Traço do Knob */}
                <div className="absolute top-2.5 w-2 h-5 rounded bg-bebop-red shadow-comic-xs" />
              </div>
            </div>

            <span className="mt-3 font-mono text-xs text-muted-gray font-medium">
              [ ARRASTE OU USE AS SETAS ]
            </span>
          </div>

          {/* Botões de Atalho para Presets */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                data-preset-btn={p.id}
                onClick={() => updateFrequency(p.freq)}
                className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all duration-200 shadow-comic-xs ${
                  Math.abs(frequency - p.freq) < 0.1
                    ? 'bg-paper-white text-space-base border-paper-white shadow-comic-sm'
                    : 'bg-space-surface-2 border-space-border text-paper-white hover:border-bebop-amber hover:text-bebop-amber'
                }`}
              >
                {p.freq.toFixed(1)} MHz
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrtTuner;
