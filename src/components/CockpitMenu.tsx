import React, { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from 'gsap';
import { useLocale } from '../i18n/index.ts';
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

const HOME_SECTION_IDS = ['hero', 'works', 'about', 'lab', 'contact'] as const;

export function resolveActiveBladeId(
  pathname: string,
  visibleSectionId?: string
): string {
  if (typeof pathname === 'string' && pathname.includes('/whoami')) {
    return 'whoami';
  }
  if (
    visibleSectionId &&
    (HOME_SECTION_IDS as readonly string[]).includes(visibleSectionId)
  ) {
    return visibleSectionId;
  }
  return 'hero';
}

export function syncCockpitTriggerDom(isOpen: boolean): void {
  if (typeof document === 'undefined') return;
  const cockpitBtn = document.getElementById('cockpit-trigger-btn');
  const bar1 = document.getElementById('menu-bar-1');
  const bar2 = document.getElementById('menu-bar-2');
  const bar3 = document.getElementById('menu-bar-3');
  const overlay = document.getElementById('cockpit-menu-overlay');
  const header = document.getElementById('comic-nav-header');

  if (cockpitBtn) {
    cockpitBtn.setAttribute('aria-expanded', String(isOpen));
  }

  if (header) {
    header.dataset.cockpitOpen = String(isOpen);
  }

  if (overlay) {
    overlay.setAttribute('aria-hidden', String(!isOpen));
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
  const [activeBladeId, setActiveBladeId] = useState<string>('hero');
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const slashesRef = useRef<HTMLDivElement | null>(null);
  const bladesContainerRef = useRef<HTMLElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const isClosingRef = useRef<boolean>(false);

  const isReducedMotion = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const closeMenu = useCallback(() => {
    if (isClosingRef.current) return;

    syncCockpitTriggerDom(false);

    if (isReducedMotion()) {
      setIsOpen(false);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('lenis-stopped', 'cockpit-menu-open');
        document.body.classList.remove('lenis-stopped', 'cockpit-menu-open');
        document.documentElement.style.removeProperty('--cockpit-scrollbar-comp');
      }
      return;
    }

    isClosingRef.current = true;
    const blades = bladesContainerRef.current
      ? Array.from(bladesContainerRef.current.children)
      : [];
    const slashes = slashesRef.current
      ? Array.from(slashesRef.current.children)
      : [];

    const tl = gsap.timeline({
      onComplete: () => {
        setIsOpen(false);
        isClosingRef.current = false;
        if (typeof document !== 'undefined') {
          document.documentElement.classList.remove('lenis-stopped', 'cockpit-menu-open');
          document.body.classList.remove('lenis-stopped', 'cockpit-menu-open');
          document.documentElement.style.removeProperty('--cockpit-scrollbar-comp');
        document.documentElement.style.removeProperty('--cockpit-scrollbar-comp');
        }
      },
    });

    if (blades.length > 0) {
      tl.to(blades, {
        x: 40,
        opacity: 0,
        duration: 0.16,
        ease: 'power3.in',
        stagger: 0.02,
      });
    }

    if (slashes.length > 0) {
      tl.to(
        slashes,
        {
          xPercent: 100,
          duration: 0.22,
          ease: 'power3.in',
          stagger: 0.02,
        },
        '-=0.08'
      );
    }
  }, [isReducedMotion]);

  const openMenu = useCallback(() => {
    isClosingRef.current = false;
    if (
      typeof document !== 'undefined' &&
      !document.documentElement.classList.contains('cockpit-menu-open')
    ) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.setProperty(
        '--cockpit-scrollbar-comp',
        `${Math.max(0, scrollbarWidth)}px`
      );
      document.documentElement.classList.add('lenis-stopped', 'cockpit-menu-open');
      document.body.classList.add('lenis-stopped', 'cockpit-menu-open');
    }
    setIsOpen(true);
    syncCockpitTriggerDom(true);
    audioSynth.playKnobClick(960, 0.08);
  }, []);

  useEffect(() => {
    setIsMuted(audioSynth.isMuted());

    const initialTrigger = document.getElementById('cockpit-trigger-btn');
    if (!isOpen && initialTrigger?.getAttribute('aria-expanded') === 'true') {
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
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname;
    if (pathname.includes('/whoami')) {
      setActiveBladeId('whoami');
      return;
    }

    const hashId = window.location.hash.replace('#', '');
    setActiveBladeId(resolveActiveBladeId(pathname, hashId));

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            setActiveBladeId(resolveActiveBladeId(window.location.pathname, entry.target.id));
          }
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: 0.05 }
    );

    for (const secId of HOME_SECTION_IDS) {
      const el = document.getElementById(secId);
      if (el) observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const activeLink =
      bladesContainerRef.current?.querySelector<HTMLAnchorElement>('a[data-active-blade="true"]') ||
      bladesContainerRef.current?.querySelector<HTMLAnchorElement>('a');
    activeLink?.focus();

    if (isReducedMotion()) return;

    const blades = bladesContainerRef.current
      ? Array.from(bladesContainerRef.current.children)
      : [];
    const slashes = slashesRef.current
      ? Array.from(slashesRef.current.children)
      : [];

    const tl = gsap.timeline();
    if (slashes.length > 0) {
      tl.fromTo(
        slashes,
        { xPercent: -100, skewX: -22, opacity: 0.8 },
        {
          xPercent: 0,
          skewX: -12,
          opacity: 1,
          duration: 0.36,
          ease: 'power4.out',
          stagger: 0.04,
        }
      );
    }

    if (blades.length > 0) {
      tl.fromTo(
        blades,
        { x: -50, opacity: 0, skewX: -18 },
        {
          x: 0,
          opacity: 1,
          skewX: -12,
          duration: 0.34,
          ease: 'back.out(1.2)',
          stagger: 0.04,
        },
        '-=0.2'
      );
    }

    if (controlsRef.current) {
      tl.fromTo(
        controlsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.24, ease: 'power2.out' },
        '-=0.15'
      );
    }

    return () => {
      tl.kill();
    };
  }, [isOpen, isReducedMotion]);

  const handleToggleAudio = () => {
    const nextMuted = audioSynth.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      audioSynth.playSonarBlip(880, 0.06, 0.12);
    }
  };

  return (
    <div
      ref={overlayRef}
      id="cockpit-menu-overlay"
      role="dialog"
      aria-modal="true"
      aria-hidden={!isOpen}
      aria-label={t.menu.dialogAria}
      className={`fixed inset-0 w-screen h-screen min-h-dvh max-h-screen z-[9990] overflow-y-auto overflow-x-hidden bg-space-base text-paper-white select-none ${
        isOpen ? 'block' : 'hidden'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeMenu();
        }
      }}
    >
      {/* Persona 5 Angular Dynamic Slashes Background */}
      <div ref={slashesRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden z-0">
        <div
          data-slash-red
          className="absolute -top-1/4 -bottom-1/4 -left-1/4 w-[85vw] sm:w-[65vw] lg:w-[55vw] bg-bebop-red transform -skew-x-12 origin-top shadow-[20px_0_0_var(--color-paper-white)]"
        />
        <div
          data-slash-accent
          className="hidden sm:block absolute -top-1/4 -bottom-1/4 left-[55vw] lg:left-[45vw] w-[18vw] bg-space-surface-1/60 transform -skew-x-12 border-l-4 border-r-4 border-paper-white/20"
        />
        <div
          data-slash-stripe
          className="hidden lg:block absolute -top-1/4 -bottom-1/4 left-[60vw] w-[6vw] bg-paper-white transform -skew-x-12 opacity-95 shadow-[12px_0_0_var(--color-bebop-red)]"
        />
      </div>

      {/* Fullscreen Content Container */}
      <div className="relative z-10 w-full min-h-full box-border flex flex-col justify-between pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-8 px-4 sm:px-8 md:px-12 lg:px-20 max-w-7xl mx-auto">
        <div>
          {/* Header Row */}
          <div className="relative border-b-4 border-paper-white pb-5 mb-8">
            <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-paper-white leading-none">
              {t.menu.title}
            </h2>
          </div>

          {/* Oversized Persona 5 Navigation Blades */}
          <nav ref={bladesContainerRef} aria-label={t.menu.title} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-10">
            {COCKPIT_NAV_ITEMS.map((item, idx) => {
              const label = t.menu.navItems[item.labelKey];
              const isEven = idx % 2 === 0;
              const isActive = activeBladeId === item.id;
              return (
                <a
                  key={item.id}
                  href={item.href}
                  data-cockpit-link={item.id}
                  data-active-blade={isActive ? 'true' : 'false'}
                  aria-current={
                    isActive
                      ? item.href === '/whoami'
                        ? 'page'
                        : 'true'
                      : undefined
                  }
                  onClick={() => {
                    setActiveBladeId(item.id);
                    audioSynth.playKeypressBeep(740, 0.025, 0.06);
                    closeMenu();
                  }}
                  className={`group relative flex items-center justify-between border-4 border-paper-white px-5 sm:px-7 py-4 sm:py-5 font-display text-lg sm:text-2xl font-black uppercase tracking-wider transition-all duration-150 -skew-x-6 sm:-skew-x-12 ${
                    isActive
                      ? 'bg-bebop-red text-paper-white shadow-[8px_8px_0_var(--color-paper-white)] scale-[1.01]'
                      : isEven
                        ? 'bg-space-base text-paper-white hover:bg-bebop-red hover:text-paper-white shadow-[6px_6px_0_var(--color-bebop-red)]'
                        : 'bg-paper-white text-space-base hover:bg-bebop-red hover:text-paper-white shadow-[6px_6px_0_var(--color-bebop-red)]'
                  } hover:-translate-y-1`}
                >
                  <span className="truncate pr-3 skew-x-6 sm:skew-x-12">{label}</span>
                  <span className="font-mono text-xs sm:text-sm font-bold px-2.5 py-1 border-2 border-current shrink-0 skew-x-6 sm:skew-x-12">
                    {item.code}
                  </span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* System Controls: Language Switch & Audio Synth */}
        <div ref={controlsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-4 border-paper-white pt-6">
          {/* Language Switcher Box */}
          <div className="flex items-center justify-between border-3 border-paper-white bg-space-surface-1 px-5 py-3.5 shadow-[4px_4px_0_var(--color-bebop-red)]">
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-paper-white">
              {t.menu.languageLabel}
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-cockpit-lang="pt-br"
                aria-pressed={locale === 'pt-br'}
                onClick={() => setLocale('pt-br')}
                className={`px-3.5 py-1.5 font-mono text-xs font-black uppercase border-2 cursor-pointer transition-colors ${
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
                className={`px-3.5 py-1.5 font-mono text-xs font-black uppercase border-2 cursor-pointer transition-colors ${
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
          <div className="flex items-center justify-between border-3 border-paper-white bg-space-surface-1 px-5 py-3.5 shadow-[4px_4px_0_var(--color-bebop-red)]">
            <span className="font-mono text-xs sm:text-sm font-bold uppercase tracking-widest text-paper-white">
              {t.menu.audioLabel}
            </span>
            <button
              type="button"
              id="cockpit-audio-toggle"
              aria-pressed={!isMuted}
              onClick={handleToggleAudio}
              className={`px-3.5 py-1.5 font-mono text-xs font-black uppercase border-2 cursor-pointer transition-colors ${
                !isMuted
                  ? 'border-paper-white bg-bebop-red text-paper-white animate-pulse'
                  : 'border-paper-white/40 bg-space-base text-muted-gray hover:text-paper-white'
              }`}
            >
              {!isMuted ? 'ONLINE' : 'MUTED'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CockpitMenu;
