import React, { useEffect, useState, useRef, useCallback } from 'react';
import { audioSynth } from '../utils/audio';

export const CiladaAlert: React.FC = () => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(6.0);

  const isActiveRef = useRef<boolean>(false);
  const originalTitleRef = useRef<string>('');
  const originalFaviconRef = useRef<string>('/favicon.svg');
  const titleIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Gera data URL de uma sirene vermelha desenhada via Canvas 2D
  const generateSirenFavicon = useCallback((phase: boolean): string => {
    if (typeof document === 'undefined') return '/favicon.svg';
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '/favicon.svg';

    // Fundo
    ctx.fillStyle = phase ? '#FE0000' : '#11111E';
    ctx.fillRect(0, 0, 32, 32);

    // Cúpula da sirene
    ctx.fillStyle = phase ? '#FFFFFF' : '#FE0000';
    ctx.beginPath();
    ctx.arc(16, 16, 10, Math.PI, 0);
    ctx.fill();

    // Base da sirene
    ctx.fillStyle = '#EBA602';
    ctx.fillRect(6, 16, 20, 6);

    return canvas.toDataURL('image/png');
  }, []);

  const deactivateAlarm = useCallback(() => {
    setIsActive(false);
    isActiveRef.current = false;

    // Limpa intervalos e timers
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

    // Restaura document.title
    if (originalTitleRef.current && typeof document !== 'undefined') {
      document.title = originalTitleRef.current;
    }

    // Restaura Favicon original
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

    // Salva título e favicon originais
    if (typeof document !== 'undefined') {
      originalTitleRef.current = document.title;
      const linkEl = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
      if (linkEl) {
        originalFaviconRef.current = linkEl.href;
      }
    }

    // Dispara alarme 8-bit se o áudio não estiver estritamente mutado
    if (!audioSynth.isMuted()) {
      audioSynth.playAlarm8Bit(6);
    }

    // 1. Alterna Title da aba a cada 400ms
    let toggleState = false;
    titleIntervalRef.current = setInterval(() => {
      toggleState = !toggleState;
      if (typeof document !== 'undefined') {
        document.title = toggleState
          ? '[ALERTA] É UMA CILADA, BRINU!'
          : '[SISTEMA] ALERTA DE SOBRECARGA';

        // Alterna favicon dinâmico
        const linkEl = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
        if (linkEl) {
          linkEl.href = generateSirenFavicon(toggleState);
        }
      }
    }, 400);

    // 2. Contagem regressiva de 6 segundos
    const startTime = Date.now();
    countdownIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, 6.0 - elapsed);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        deactivateAlarm();
      }
    }, 100);

    // 3. Timeout mestre de 6 segundos
    timeoutRef.current = setTimeout(() => {
      deactivateAlarm();
    }, 6000);
  }, [deactivateAlarm, generateSirenFavicon]);

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
      aria-label="Alerta crítico de emergência: É uma cilada, Brinu!"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-space-base/90 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-hidden"
    >
      {/* Vinheta Vermelha Pulsante de Alerta de Tubo CRT */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(254,0,0,0.35)_0%,rgba(17,17,30,0.95)_100%)] animate-pulse" />

      {/* Linhas de Varredura Scanlines CRT */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.4)_0px,rgba(0,0,0,0.4)_2px,transparent_2px,transparent_4px)]" />

      {/* Caixa de Diálogo Brutalista de Emergência */}
      <div className="relative w-full max-w-xl rounded-3xl border-4 border-bebop-red bg-space-surface-1 p-6 sm:p-8 md:p-10 text-paper-white shadow-[0_0_60px_rgba(254,0,0,0.7)]">
        {/* Cabeçalho de Alerta Vermelho */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-bebop-red/60">
          <div className="flex items-center gap-3">
            <span className="w-3.5 h-3.5 rounded-full bg-bebop-red animate-ping" />
            <span className="font-mono text-xs sm:text-sm font-black tracking-widest text-bebop-red uppercase">
              // EMERGENCY PROTOCOL • OVERLOAD
            </span>
          </div>

          <span className="font-mono text-xs font-bold text-bebop-amber">
            CODE: RED-1996
          </span>
        </div>

        {/* Mensagem Principal */}
        <div className="mt-6 text-center space-y-4">
          <div className="flex justify-center" aria-hidden="true">
            <div className="relative flex items-center justify-center p-3 rounded-2xl bg-bebop-red/20 border-2 border-bebop-red shadow-[0_0_24px_rgba(254,0,0,0.6)] animate-pulse">
              <svg className="size-10 sm:size-12 text-bebop-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>

          <h2
            data-cilada-title
            className="font-display text-2xl sm:text-4xl font-black uppercase tracking-tight text-bebop-red"
          >
            É UMA CILADA, BRINU!
          </h2>

          <p className="font-sans text-xs sm:text-sm text-paper-white leading-relaxed">
            Sensores de borda detectaram sobrecarga de telemetria! Não existem recompensas fáceis nesta galáxia...
          </p>

          <p className="font-mono text-[11px] sm:text-xs text-muted-gray italic">
            "Mantenha a calma, cowboy. Os sistemas retornarão ao normal em instantes."
          </p>
        </div>

        {/* Barra de Progresso do Tempo Restante */}
        <div className="mt-8 space-y-2">
          <div className="flex justify-between font-mono text-[11px] text-muted-gray">
            <span>TEMPO RESTANTE DE ALARME</span>
            <span data-cilada-timer className="font-bold text-bebop-red">
              {timeLeft.toFixed(1)}s
            </span>
          </div>

          <div className="h-3 w-full rounded-full border border-space-border bg-space-base overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-bebop-red transition-all duration-100 ease-linear shadow-[0_0_12px_#FE0000]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Botão de Desativação Manual */}
        <div className="mt-8">
          <button
            type="button"
            data-cilada-dismiss
            onClick={deactivateAlarm}
            className="w-full py-3.5 px-6 rounded-xl border-2 border-space-base bg-paper-white text-space-base font-mono font-black text-xs sm:text-sm uppercase tracking-wider hover:bg-bebop-red hover:text-paper-white hover:border-space-base transition-all duration-150 shadow-comic-sm active:translate-x-0.5 active:translate-y-0.5 inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg className="size-4 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span>DESATIVAR ALARME MANUALMENTE [ESC]</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CiladaAlert;
