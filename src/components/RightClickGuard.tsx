import React, { useEffect, useState, useRef, useCallback } from 'react';
import { audioSynth } from '../utils/audio';
import { useLocale } from '../i18n/index';

export const RightClickGuard: React.FC = () => {
  const { dict: t } = useLocale();
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
      aria-label={t.rightClick.dialogAria}
      className="fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] sm:max-w-md border-4 border-paper-white bg-space-base p-4 sm:p-5 shadow-[6px_6px_0_var(--color-bebop-red)] text-paper-white animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-bebop-red">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-bebop-red animate-ping" />
          <span className="font-mono text-xs font-black uppercase tracking-wider text-bebop-red">
            {t.rightClick.tag}
          </span>
        </div>

        <button
          type="button"
          data-toast-close
          onClick={closeToast}
          aria-label={t.rightClick.closeAria}
          className="w-7 h-7 border-2 border-paper-white bg-bebop-red flex items-center justify-center font-mono text-xs font-bold text-paper-white hover:bg-paper-white hover:text-space-base transition-all active:scale-95 cursor-pointer"
        >
          <svg className="size-3.5 shrink-0" aria-hidden="true" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <img
            src="/assets/brinu-avatar.jpg"
            alt="Bruno Dinis Avatar"
            width={60}
            height={60}
            className="w-14 h-14 sm:w-16 sm:h-16 border-2 border-paper-white object-cover shadow-[3px_3px_0_var(--color-bebop-red)]"
          />
          <span className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-bebop-red font-mono text-[9px] font-bold text-paper-white border border-paper-white">
            HQ
          </span>
        </div>

        <div className="space-y-2">
          <p className="font-sans text-xs sm:text-sm font-bold leading-relaxed text-paper-white">
            {t.rightClick.headline}
          </p>
          <p className="font-mono text-[11px] sm:text-xs text-muted-gray leading-normal">
            {t.rightClick.body}
          </p>
        </div>
      </div>

      <div className="mt-4 pt-2.5 border-t border-paper-white/30 flex items-center justify-between text-[10px] font-mono text-muted-gray">
        <span>{t.rightClick.escHint}</span>
        <span className="text-bebop-red font-bold">{t.rightClick.readyBadge}</span>
      </div>
    </div>
  );
};

export default RightClickGuard;
