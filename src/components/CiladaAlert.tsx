import React, { useEffect, useState, useRef, useCallback } from 'react';
import { audioSynth } from '../utils/audio';
import { useLocale } from '../i18n/index';

export const CiladaAlert: React.FC = () => {
  const { dict: t } = useLocale();
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(6.0);

  const isActiveRef = useRef<boolean>(false);
  const originalTitleRef = useRef<string>('');
  const originalFaviconRef = useRef<string>('/favicon.svg');
  const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generateSirenFavicon = useCallback((phase: boolean): string => {
    if (typeof document === 'undefined') return '/favicon.svg';
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '/favicon.svg';

    ctx.fillStyle = phase ? '#FE0000' : '#080808';
    ctx.fillRect(0, 0, 32, 32);

    ctx.fillStyle = phase ? '#FBFAF4' : '#FE0000';
    ctx.beginPath();
    ctx.arc(16, 16, 10, Math.PI, 0);
    ctx.fill();

    ctx.fillStyle = '#FBFAF4';
    ctx.fillRect(6, 16, 20, 6);

    return canvas.toDataURL('image/png');
  }, []);

  const deactivateAlarm = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;

    if (titleIntervalRef.current) {
      clearInterval(titleIntervalRef.current);
      titleIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (originalTitleRef.current && typeof document !== 'undefined') {
      document.title = originalTitleRef.current;
    }

    if (typeof document !== 'undefined') {
      const linkEl = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (linkEl && originalFaviconRef.current) {
        linkEl.href = originalFaviconRef.current;
      }
    }
  }, []);

  const triggerAlarm = useCallback(() => {
    if (isActiveRef.current) return;

    setIsActive(true);
    isActiveRef.current = true;
    setTimeLeft(6.0);

    if (typeof document !== 'undefined') {
      originalTitleRef.current = document.title;
      const linkEl = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (linkEl) {
        originalFaviconRef.current = linkEl.href;
      }
    }

    if (!audioSynth.isMuted()) {
      audioSynth.playAlarm8Bit(6);
    }

    let toggleState = false;
    titleIntervalRef.current = setInterval(() => {
      toggleState = !toggleState;
      if (typeof document !== 'undefined') {
        document.title = toggleState
          ? `[ALERT] ${t.cilada.title}`
          : `[SYSTEM] ${t.cilada.tag}`;

        const linkEl = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
        if (linkEl) {
          linkEl.href = generateSirenFavicon(toggleState);
        }
      }
    }, 400);

    const startTime = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, 6.0 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        deactivateAlarm();
      }
    }, 100);

    timeoutRef.current = setTimeout(() => {
      deactivateAlarm();
    }, 6000);
  }, [deactivateAlarm, generateSirenFavicon, t.cilada.title, t.cilada.tag]);

  useEffect(() => {
    const handleCiladaEvent = () => {
      triggerAlarm();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isActiveRef.current) {
        deactivateAlarm();
      }
    };

    window.addEventListener('bebop:cilada-trigger', handleCiladaEvent);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('bebop:cilada-trigger', handleCiladaEvent);
      window.removeEventListener('keydown', handleKeyDown);
      deactivateAlarm();
    };
  }, [triggerAlarm, deactivateAlarm]);

  if (!isActive) return null;

  const progressPercent = Math.min(100, Math.max(0, (timeLeft / 6.0) * 100));

  return (
    <div
      data-cilada-overlay
      role="alertdialog"
      aria-modal="true"
      aria-label={t.cilada.dialogAria}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-space-base/95 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(254,0,0,0.35)_0%,rgba(8,8,8,0.95)_100%)] animate-pulse" />

      <div className="relative w-full max-w-xl border-4 border-paper-white bg-space-base p-6 sm:p-8 md:p-10 text-paper-white shadow-[10px_10px_0_var(--color-bebop-red)]">
        <div className="flex items-center justify-between pb-4 border-b-2 border-bebop-red">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 bg-bebop-red animate-ping" />
            <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-bebop-red uppercase">
              {t.cilada.tag}
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-paper-white">
            CODE: RED-1996
          </span>
        </div>

        <div className="mt-6 text-center space-y-4">
          <div className="flex justify-center" aria-hidden="true">
            <div className="relative flex items-center justify-center p-3 bg-bebop-red border-2 border-paper-white shadow-[4px_4px_0_var(--color-paper-white)]">
              <svg className="size-10 sm:size-12 text-paper-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h2
            data-cilada-title
            className="font-display text-2xl sm:text-4xl font-black uppercase tracking-tight text-bebop-red"
          >
            {t.cilada.title}
          </h2>

          <p className="font-sans text-xs sm:text-sm text-paper-white leading-relaxed">
            {t.cilada.body}
          </p>

          <p className="font-mono text-[11px] sm:text-xs text-muted-gray italic">
            {t.cilada.quote}
          </p>
        </div>

        <div className="mt-8 space-y-2">
          <div className="flex justify-between font-mono text-[11px] text-muted-gray">
            <span>{t.cilada.timerLabel}</span>
            <span data-cilada-timer className="font-bold text-bebop-red">
              {timeLeft.toFixed(1)}s
            </span>
          </div>

          <div className="h-3 w-full border-2 border-paper-white bg-space-base overflow-hidden p-0.5">
            <div
              className="h-full bg-bebop-red transition-all duration-100 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-8">
          <button
            type="button"
            data-cilada-dismiss
            onClick={deactivateAlarm}
            className="w-full py-3.5 px-6 border-2 border-paper-white bg-bebop-red text-paper-white font-mono font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-paper-white hover:text-space-base transition-all duration-150 shadow-[4px_4px_0_var(--color-paper-white)] inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.cilada.dismissCta}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiladaAlert;
