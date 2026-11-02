import React, { useState, useRef, useEffect, useCallback } from 'react';
import { audioSynth } from '../../utils/audio';
import { useLocale } from '../../i18n/index';

interface PresetChannel {
  freq: number;
  id: 'crimson' | 'phantom' | 'noir';
  tag: string;
  color: string;
}

const PRESET_CONFIGS: readonly PresetChannel[] = [
  {
    freq: 92.4,
    id: 'crimson',
    tag: 'CH 01 // 92.4 MHz',
    color: '#FE0000',
  },
  {
    freq: 98.7,
    id: 'phantom',
    tag: 'CH 02 // 98.7 MHz',
    color: '#FBFAF4',
  },
  {
    freq: 104.2,
    id: 'noir',
    tag: 'CH 03 // 104.2 MHz',
    color: '#FE0000',
  },
] as const;

const MIN_FREQ = 88.0;
const MAX_FREQ = 108.0;
const MIN_ANGLE = -135;
const MAX_ANGLE = 135;

export const CrtTuner: React.FC = () => {
  const { dict: t } = useLocale();
  const [frequency, setFrequency] = useState<number>(92.4);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const knobRef = useRef<HTMLDivElement>(null);
  const lastSoundFreqRef = useRef<number>(92.4);

  const freqToAngle = useCallback((freq: number): number => {
    const ratio = (freq - MIN_FREQ) / (MAX_FREQ - MIN_FREQ);
    return MIN_ANGLE + ratio * (MAX_ANGLE - MIN_ANGLE);
  }, []);

  const angleToFreq = useCallback((angle: number): number => {
    const clamped = Math.max(MIN_ANGLE, Math.min(MAX_ANGLE, angle));
    const ratio = (clamped - MIN_ANGLE) / (MAX_ANGLE - MIN_ANGLE);
    const val = MIN_FREQ + ratio * (MAX_FREQ - MIN_FREQ);
    return Math.round(val * 10) / 10;
  }, []);

  const activePreset = PRESET_CONFIGS.find(
    (p) => Math.abs(p.freq - frequency) <= 0.35
  );

  const getPresetCopy = (id: PresetChannel['id']) => {
    if (id === 'crimson') {
      return {
        name: t.lab.tuner.presets.crimsonName,
        description: t.lab.tuner.presets.crimsonDesc,
      };
    }
    if (id === 'phantom') {
      return {
        name: t.lab.tuner.presets.phantomName,
        description: t.lab.tuner.presets.phantomDesc,
      };
    }
    return {
      name: t.lab.tuner.presets.noirName,
      description: t.lab.tuner.presets.noirDesc,
    };
  };

  const updateFrequency = useCallback((newFreq: number) => {
    const clamped = Math.max(
      MIN_FREQ,
      Math.min(MAX_FREQ, Math.round(newFreq * 10) / 10)
    );
    if (Math.abs(clamped - lastSoundFreqRef.current) >= 0.2) {
      audioSynth.playKnobClick(1000 + (clamped - MIN_FREQ) * 30);
      lastSoundFreqRef.current = clamped;
    }
    setFrequency(clamped);
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;

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
  const presetCopy = activePreset ? getPresetCopy(activePreset.id) : null;

  return (
    <div
      data-crt-tuner
      className="relative border-4 border-paper-white bg-space-surface-1 p-6 sm:p-8 md:p-10 shadow-[8px_8px_0_var(--color-bebop-red)] text-paper-white"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b-2 border-bebop-red gap-4">
        <div>
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-bebop-red">
            {t.lab.tuner.tag}
          </span>
          <h3 className="mt-1 font-display text-2xl sm:text-3xl font-black text-paper-white uppercase">
            {t.lab.tuner.title}
          </h3>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-muted-gray uppercase">{t.lab.tuner.statusLabel}</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 border-2 text-[11px] font-bold uppercase tracking-wider ${
              activePreset
                ? 'bg-bebop-red text-paper-white border-paper-white'
                : 'bg-space-base text-paper-white border-paper-white animate-pulse'
            }`}
          >
            <span>■</span>
            {activePreset ? t.lab.tuner.locked : t.lab.tuner.searching}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col">
          <div
            data-crt-screen
            data-active-mode={activePreset ? activePreset.id : 'static'}
            className="relative w-full aspect-[16/10] border-4 border-paper-white bg-space-base overflow-hidden shadow-[6px_6px_0_var(--color-bebop-red)] transition-all duration-300"
          >
            <div className="relative z-10 h-full p-5 sm:p-6 flex flex-col justify-between font-mono">
              <div className="flex items-center justify-between text-xs border-b border-paper-white/30 pb-2">
                <span className="text-muted-gray text-[10px] tracking-widest uppercase">
                  MONITOR // CH: {frequency.toFixed(1)} MHz
                </span>
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: activePreset ? activePreset.color : '#C7C6BF' }}
                >
                  {activePreset ? activePreset.tag : t.lab.tuner.noCarrier}
                </span>
              </div>

              <div className="my-auto py-4 flex flex-col items-center justify-center text-center">
                {activePreset && presetCopy ? (
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
                      {presetCopy.name}
                    </div>
                    <p className="text-xs text-paper-white/90 max-w-md mx-auto">
                      {presetCopy.description}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-6">
                    <div className="font-mono text-sm sm:text-base text-bebop-red tracking-widest animate-pulse">
                      {t.lab.tuner.scanning}
                    </div>
                    <p className="text-xs text-muted-gray">
                      {t.lab.tuner.hint}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-muted-gray pt-2 border-t border-paper-white/30">
                <span>PHANTOM BROADCAST // 1996</span>
                <span className="text-bebop-red font-bold">SYNC: ANALOG</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col items-center justify-center">
          <div className="w-full max-w-[18rem] border-2 border-paper-white bg-space-base p-4 mb-6 shadow-[4px_4px_0_var(--color-bebop-red)] font-mono text-center">
            <span className="block text-[10px] font-bold text-muted-gray uppercase tracking-widest mb-1">
              {t.lab.tuner.freqLabel}
            </span>
            <div
              data-frequency-display
              className="text-3xl sm:text-4xl font-black text-paper-white tracking-wider"
            >
              {frequency.toFixed(1)}{' '}
              <span className="text-sm font-normal text-bebop-red">MHz</span>
            </div>
          </div>

          <div className="relative flex flex-col items-center select-none">
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-paper-white/40" />
              <span className="absolute bottom-1 left-2 font-mono text-[10px] text-muted-gray font-bold">
                88.0
              </span>
              <span className="absolute bottom-1 right-2 font-mono text-[10px] text-muted-gray font-bold">
                108.0
              </span>

              <div
                ref={knobRef}
                data-tuner-knob
                role="slider"
                tabIndex={0}
                aria-label={t.lab.tuner.title}
                aria-valuenow={frequency}
                aria-valuemin={MIN_FREQ}
                aria-valuemax={MAX_FREQ}
                onKeyDown={handleKeyDown}
                onPointerDown={() => setIsDragging(true)}
                className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-paper-white bg-space-base shadow-[4px_4px_0_var(--color-bebop-red)] cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-bebop-red transition-transform duration-75 flex items-center justify-center"
                style={{
                  transform: `rotate(${currentAngle}deg)`,
                }}
              >
                <div className="w-20 h-20 rounded-full border-2 border-bebop-red bg-space-surface-1 flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-bebop-red border border-paper-white" />
                </div>
                <div className="absolute top-2.5 w-2 h-5 bg-bebop-red border border-paper-white" />
              </div>
            </div>

            <span className="mt-3 font-mono text-xs text-muted-gray font-medium">
              {t.lab.tuner.dragHint}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {PRESET_CONFIGS.map((p) => (
              <button
                key={p.id}
                type="button"
                data-preset-btn={p.id}
                onClick={() => updateFrequency(p.freq)}
                className={`px-3 py-1.5 border-2 font-mono text-xs font-bold transition-all duration-150 cursor-pointer ${
                  Math.abs(frequency - p.freq) < 0.1
                    ? 'bg-bebop-red text-paper-white border-paper-white shadow-[3px_3px_0_var(--color-paper-white)]'
                    : 'bg-space-base border-paper-white text-paper-white hover:bg-paper-white hover:text-space-base'
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
