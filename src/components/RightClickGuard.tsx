import React, { useEffect, useState, useRef, useCallback } from 'react';
import { audioSynth } from '../utils/audio';

export const RightClickGuard: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const toastRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeToast = useCallback(() => {
    setIsOpen(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const openToast = useCallback(() => {
    setIsOpen(true);
    if (!audioSynth.isMuted()) {
      audioSynth.playKeypressBeep(720, 0.06, 0.15);
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    // Fecha automaticamente após 8 segundos se o usuário não interagir
    timerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 8000);
  }, []);

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      openToast();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeToast();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        toastRef.current &&
        !toastRef.current.contains(e.target as Node)
      ) {
        closeToast();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen, closeToast, openToast]);

  if (!isOpen) return null;

  return (
    <div
      ref={toastRef}
      data-right-click-toast
      role="alertdialog"
      aria-modal="true"
      aria-label="Alerta de interceptação de telemetria"
      className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-md rounded-2xl border-4 border-space-base bg-space-surface-1/95 p-4 sm:p-5 shadow-comic-lg text-paper-white backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* Faixa Superior com Etiqueta e Botão de Fechar */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-border/60">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-bebop-amber animate-ping" />
          <span className="font-mono text-xs font-black uppercase tracking-wider text-bebop-amber">
            // TELEMETRY INTERCEPTION DETECTED
          </span>
        </div>

        <button
          type="button"
          data-toast-close
          onClick={closeToast}
          aria-label="Fechar alerta"
          className="w-7 h-7 rounded-lg border-2 border-space-border bg-space-surface-2 flex items-center justify-center font-mono text-xs font-bold text-muted-gray hover:text-paper-white hover:border-bebop-red hover:bg-bebop-red/20 transition-all active:scale-95 shadow-comic-xs"
        >
          ✕
        </button>
      </div>

      {/* Conteúdo com Avatar de Brinu e Texto Cômico */}
      <div className="flex items-start gap-4">
        {/* Avatar Miniatura com Moldura de Quadrinhos */}
        <div className="relative shrink-0">
          <img
            src="/assets/brinu-avatar.jpg"
            alt="Bruno Dinis Avatar"
            width={60}
            height={60}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-space-base object-cover shadow-comic-xs"
          />
          <span className="absolute -bottom-1 -right-1 px-1 py-0.5 rounded bg-space-base font-mono text-[9px] font-bold text-acid-green border border-space-border">
            HQ
          </span>
        </div>

        {/* Mensagem Humorística Orientando para o F12 */}
        <div className="space-y-2">
          <p className="font-sans text-xs sm:text-sm font-medium leading-relaxed text-paper-white">
            <span className="font-bold text-bebop-amber">Ei cowboy!</span> Tentando inspecionar os circuitos pelo botão direito?
          </p>
          <p className="font-mono text-[11px] sm:text-xs text-muted-gray leading-normal">
            Pressione <kbd className="px-1.5 py-0.5 rounded bg-space-surface-2 border border-space-border font-bold text-acid-green shadow-comic-xs">F12</kbd> para abrir o terminal de bordo. Há um <span className="text-paper-white font-bold">cupom fiscal retrô</span> esperando por você no console DevTools! 🤫
          </p>
        </div>
      </div>

      {/* Rodapé com Dica de Fechamento */}
      <div className="mt-4 pt-2.5 border-t border-space-border/40 flex items-center justify-between text-[10px] font-mono text-muted-gray">
        <span>PRESS [ESC] OR CLICK OUTSIDE TO CLOSE</span>
        <span className="text-crt-cyan font-bold">DEVTOOLS READY</span>
      </div>
    </div>
  );
};

export default RightClickGuard;
