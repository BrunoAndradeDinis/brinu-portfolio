import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocale } from '../i18n/index.ts';
import { PROFILE } from '../data/profile.ts';
import { audioSynth } from '../utils/audio.ts';

export interface CockpitNavItem {
  id: string;
  code: string;
  labelKey: 'hero' | 'works' | 'about' | 'lab' | 'contact' | 'whoami';
  href: string;
}

export const COCKPIT_NAV_ITEMS: readonly CockpitNavItem[] = [
  { id: 'hero', code: '00', labelKey: 'hero', href: '#hero' },
  { id: 'works', code: '01', labelKey: 'works', href: '#works' },
  { id: 'about', code: '02', labelKey: 'about', href: '#about' },
  { id: 'lab', code: '03', labelKey: 'lab', href: '#lab' },
  { id: 'contact', code: '04', labelKey: 'contact', href: '#contact' },
  { id: 'whoami', code: '05', labelKey: 'whoami', href: '/whoami' },
] as const;

export function syncCockpitTriggerDom(isOpen: boolean): void {
  if (typeof document === 'undefined') return;
  const cockpitBtn = document.getElementById('cockpit-trigger-btn');
  const bar1 = document.getElementById('menu-bar-1');
  const bar2 = document.getElementById('menu-bar-2');
  const bar3 = document.getElementById('menu-bar-3');

  if (cockpitBtn) {
    cockpitBtn.setAttribute('aria-expanded', String(isOpen));
  }

  if (bar1 && bar2 && bar3) {
    if (isOpen) {
      bar1.classList.add('rotate-45', 'translate-y-[6.5px]', 'sm:translate-y-[8.5px]');
      bar2.classList.add('opacity-0', 'scale-x-0');
      bar3.classList.add('-rotate-45', '-translate-y-[6.5px]', 'sm:-translate-y-[8.5px]');
    } else {
      bar1.classList.remove('rotate-45', 'translate-y-[6.5px]', 'sm:translate-y-[8.5px]');
      bar2.classList.remove('opacity-0', 'scale-x-0');
      bar3.classList.remove('-rotate-45', '-translate-y-[6.5px]', 'sm:-translate-y-[8.5px]');
    }
  }
}

export const CockpitMenu: React.FC = () => {
  const { locale, dict: t, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    syncCockpitTriggerDom(false);
    if (typeof document !== 'undefined') {
      document.body.classList.remove('lenis-stopped');
    }
  }, []);

  const openMenu = useCallback(() => {
    setIsOpen(true);
    syncCockpitTriggerDom(true);
    audioSynth.playKnobClick(960, 0.08);
    if (typeof document !== 'undefined') {
      document.body.classList.add('lenis-stopped');
    }
  }, []);

  useEffect(() => {
    setIsMuted(audioSynth.isMuted());

    const initialTrigger = document.getElementById('cockpit-trigger-btn');
    if (initialTrigger?.getAttribute('aria-expanded') === 'true') {
      openMenu();
    }

    const handleCockpitEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ isOpen?: boolean }>).detail;
      const next = typeof detail?.isOpen === 'boolean' ? detail.isOpen : !isOpen;
      if (next) {
        openMenu();
      } else {
        closeMenu();
      }
    };

    const handleAudioMuteChange = (e: Event) => {
      const detail = (e as CustomEvent<{ muted: boolean }>).detail;
      if (detail && typeof detail.muted === 'boolean') {
        setIsMuted(detail.muted);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        closeMenu();
        const triggerBtn = document.getElementById('cockpit-trigger-btn');
        triggerBtn?.focus();
      }
    };

    window.addEventListener('cockpit:open', handleCockpitEvent);
    window.addEventListener('bebop:audio-mute-change', handleAudioMuteChange);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('cockpit:open', handleCockpitEvent);
      window.removeEventListener('bebop:audio-mute-change', handleAudioMuteChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, openMenu, closeMenu]);

  useEffect(() => {
    if (isOpen) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  const handleToggleAudio = () => {
    const nextMuted = audioSynth.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      audioSynth.playSonarBlip(880, 0.06, 0.12);
    }
  };

  return (
    <div
      id="cockpit-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      aria-label={t.menu.dialogAria}
      className={
        isOpen
          ? 'fixed inset-0 z-[9995] flex items-center justify-center bg-space-base/95 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto'
          : 'hidden'
      }
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeMenu();
        }
      }}
    >
      <div className="relative w-full max-w-4xl border-4 border-paper-white bg-space-base p-5 sm:p-8 md:p-10 shadow-[10px_10px_0_var(--color-bebop-red)]">
        {/* Diagonal Red Ribbon Accent */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-3 right-6 bg-bebop-red px-4 py-1 font-mono text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-paper-white border-2 border-paper-white -skew-x-12"
        >
          {t.menu.headerTag}
        </div>

        {/* Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-4 border-bebop-red pb-4 mb-6">
          <div>
            <h2 className="font-display text-2xl sm:text-4xl font-black uppercase tracking-tight text-paper-white">
              {t.menu.title}
            </h2>
            <p className="font-mono text-xs text-muted-gray mt-1">
              {t.menu.baseLabel} // {PROFILE.email}
            </p>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            id="cockpit-close-btn"
            onClick={closeMenu}
            className="border-3 border-paper-white bg-bebop-red px-4 py-2 font-mono text-xs sm:text-sm font-black uppercase tracking-widest text-paper-white shadow-[4px_4px_0_var(--color-paper-white)] transition-transform duration-150 hover:-translate-y-0.5 hover:bg-paper-white hover:text-space-base cursor-pointer"
          >
            {t.menu.closeLabel}
          </button>
        </div>

        {/* Skewed Persona 5 Navigation Blades */}
        <nav aria-label={t.menu.title} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-8">
          {COCKPIT_NAV_ITEMS.map((item, idx) => {
            const label = t.menu.navItems[item.labelKey];
            const isEven = idx % 2 === 0;
            return (
              <a
                key={item.id}
                href={item.href}
                data-cockpit-link={item.id}
                onClick={() => {
                  audioSynth.playKeypressBeep(740, 0.025, 0.06);
                  closeMenu();
                }}
                className={`group relative flex items-center justify-between border-3 border-paper-white px-4 py-3.5 font-display text-sm sm:text-base font-black uppercase tracking-wider transition-all duration-150 ${
                  isEven
                    ? 'bg-space-surface-1 text-paper-white hover:bg-bebop-red hover:text-paper-white'
                    : 'bg-paper-white text-space-base hover:bg-bebop-red hover:text-paper-white'
                } shadow-[4px_4px_0_var(--color-bebop-red)] hover:-translate-y-0.5`}
              >
                <span className="truncate pr-2">{label}</span>
                <span className="font-mono text-xs font-bold px-2 py-0.5 border border-current shrink-0">
                  {item.code}
                </span>
              </a>
            );
          })}
        </nav>

        {/* System Controls: Language Switch & Audio Synth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t-2 border-paper-white/30 pt-6">
          {/* Language Switcher Box */}
          <div className="flex items-center justify-between border-2 border-paper-white bg-space-surface-1 px-4 py-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-paper-white">
              {t.menu.languageLabel}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-cockpit-lang="pt-br"
                aria-pressed={locale === 'pt-br'}
                onClick={() => setLocale('pt-br')}
                className={`px-3 py-1 font-mono text-xs font-black uppercase border-2 cursor-pointer transition-colors ${
                  locale === 'pt-br'
                    ? 'border-paper-white bg-bebop-red text-paper-white'
                    : 'border-paper-white/40 bg-space-base text-muted-gray hover:text-paper-white'
                }`}
              >
                PT-BR
              </button>
              <button
                type="button"
                data-cockpit-lang="en"
                aria-pressed={locale === 'en'}
                onClick={() => setLocale('en')}
                className={`px-3 py-1 font-mono text-xs font-black uppercase border-2 cursor-pointer transition-colors ${
                  locale === 'en'
                    ? 'border-paper-white bg-bebop-red text-paper-white'
                    : 'border-paper-white/40 bg-space-base text-muted-gray hover:text-paper-white'
                }`}
              >
                EN
              </button>
            </div>
          </div>

          {/* Audio Synthesizer Control */}
          <div className="flex items-center justify-between border-2 border-paper-white bg-space-surface-1 px-4 py-3">
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-paper-white">
              {t.menu.audioLabel}
            </span>
            <button
              type="button"
              id="cockpit-audio-toggle"
              aria-pressed={!isMuted}
              onClick={handleToggleAudio}
              className={`px-3 py-1 font-mono text-xs font-black uppercase border-2 cursor-pointer transition-colors ${
                !isMuted
                  ? 'border-paper-white bg-bebop-red text-paper-white'
                  : 'border-paper-white bg-space-base text-paper-white hover:bg-paper-white hover:text-space-base'
              }`}
            >
              {isMuted ? t.menu.audioMuted : t.menu.audioOn}
            </button>
          </div>
        </div>

        {/* Footer Escape Hint */}
        <div className="mt-5 flex items-center justify-between font-mono text-[11px] text-muted-gray">
          <span>{t.menu.escHint}</span>
          <span className="text-bebop-red font-bold uppercase tracking-widest">
            {PROFILE.location.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CockpitMenu;
