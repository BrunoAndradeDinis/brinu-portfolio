/**
 * motion.ts
 * Coordenador Unificado de Movimento e Física de Rolagem (AD-2).
 * Sincroniza o Lenis Smooth Scroll com o ticker do GSAP e o plugin ScrollTrigger.
 * Garante fonte única de verdade para scroll, navegação suave por âncoras,
 * controle de pausa para a cortina de abertura e respeito estrito a prefers-reduced-motion.
 */

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

let cachedEases: {
  readonly p5Snap: gsap.EaseFunction;
  readonly p5Overshoot: gsap.EaseFunction;
} | null = null;

export function registerP5Eases(): {
  readonly p5Snap: gsap.EaseFunction;
  readonly p5Overshoot: gsap.EaseFunction;
} {
  if (!cachedEases) {
    const snap = CustomEase.create('p5Snap', 'M0,0 C0.12,0.98 0.24,1 1,1');
    const overshoot = CustomEase.create('p5Overshoot', 'M0,0 C0.18,1.28 0.36,1 1,1');
    cachedEases = { p5Snap: snap, p5Overshoot: overshoot };
  }
  return cachedEases;
}

const initialEases = registerP5Eases();
export const p5Snap: gsap.EaseFunction = initialEases.p5Snap;
export const p5Overshoot: gsap.EaseFunction = initialEases.p5Overshoot;

// Estado singleton
let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;
let isInitialized = false;
let mediaQueryList: MediaQueryList | null = null;
let handleMediaChange: ((e: MediaQueryListEvent) => void) | null = null;
let handleAnchorClick: ((e: MouseEvent) => void) | null = null;
let handleViewportBgSync: (() => void) | null = null;

/**
 * Calcula a distância vertical do topo da viewport até pelo menos 8px abaixo dos controles compactos visíveis da nav.
 */
export function getNavClearanceOffset(): number {
  if (typeof document === 'undefined') return 80;
  const avatar = document.querySelector<HTMLElement>('#comic-nav-logo [data-nav-avatar]');
  const trigger = document.getElementById('cockpit-trigger-btn');
  const controlHeight = Math.max(
    avatar?.getBoundingClientRect().height ?? 0,
    trigger?.getBoundingClientRect().height ?? 0
  );
  const compactNavPadding = 8;
  const gap = 14;
  return Math.ceil(compactNavPadding + controlHeight + gap) || 80;
}

/**
 * Sincroniza o background-color do <html> e <body> com a seção que ocupa o topo da viewport.
 */
export function syncHtmlBackgroundToViewportTop(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const sections = Array.from(
    document.querySelectorAll<HTMLElement>('#main-content > section, footer[data-bebop-footer]')
  );
  if (sections.length === 0) return;

  const probeY = 8;
  let active: HTMLElement | null = null;

  for (const sec of sections) {
    const rect = sec.getBoundingClientRect();
    if (rect.top <= probeY && rect.bottom > probeY) {
      active = sec;
      break;
    }
  }

  if (!active) {
    const firstRect = sections[0]?.getBoundingClientRect();
    if (firstRect && firstRect.top > probeY) {
      active = sections[0] ?? null;
    } else {
      active = sections[sections.length - 1] ?? null;
    }
  }

  if (!active) return;
  const computedBg = window.getComputedStyle(active).backgroundColor;
  if (computedBg && computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'transparent') {
    document.documentElement.style.backgroundColor = computedBg;
    document.body.style.backgroundColor = computedBg;
  }
}

/**
 * Retorna a instância ativa do Lenis Smooth Scroll, se inicializada.
 */
export function getLenis(): Lenis | null {
  return lenisInstance;
}

/**
 * Salta imediatamente para a posição vertical informada, sem animação (usado após navegação entre páginas).
 */
export function jumpScrollTo(top: number): void {
  if (typeof window === 'undefined') return;
  if (lenisInstance) {
    lenisInstance.scrollTo(top, { immediate: true, force: true });
  } else {
    window.scrollTo({ top, behavior: 'auto' });
  }
}

/**
 * Pausa a física de rolagem (útil durante o intro preloader ou modais em tela cheia).
 */
export function pauseScroll(): void {
  if (lenisInstance) {
    lenisInstance.stop();
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('lenis-stopped');
  }
}

/**
 * Retoma a física de rolagem.
 */
export function resumeScroll(): void {
  if (lenisInstance) {
    lenisInstance.start();
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('lenis-stopped');
  }
}

/**
 * Intercepta cliques em âncoras de navegação interna (ex: href="#works")
 * e rola de forma interpolada e cinemática usando o Lenis.
 */
function setupAnchorInterception(): void {
  if (typeof document === 'undefined') return;

  handleAnchorClick = (event: MouseEvent) => {
    // Ignora cliques que não sejam com o botão principal (esquerdo) ou com teclas modificadoras (abrir em nova aba)
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href || href === '#' || href.length <= 1) return;

    // Evita conflitos com outros protocolos ou âncoras especiais
    let targetElement: HTMLElement | null = null;
    try {
      targetElement = document.querySelector(href);
    } catch {
      return;
    }

    if (!targetElement) return;

    event.preventDefault();

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const clearance = getNavClearanceOffset();
    const targetY = Math.max(
      0,
      window.scrollY + targetElement.getBoundingClientRect().top - clearance
    );

    if (lenisInstance && !prefersReducedMotion) {
      lenisInstance.scrollTo(targetY, {
        duration: 0.75,
        force: true,
      });
    } else {
      window.scrollTo({ top: targetY, behavior: 'auto' });
    }
  };

  document.addEventListener('click', handleAnchorClick);
}

/**
 * Inicializa a instância do Lenis e conecta ao ticker do GSAP e ScrollTrigger.
 */
function createLenis(): void {
  if (typeof window === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Se o usuário solicitou redução de movimento, mantemos o scroll nativo sem inércia
  if (prefersReducedMotion) {
    return;
  }

  // Instanciação do motor Lenis com parâmetros fluidos e responsivos
  lenisInstance = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    touchMultiplier: 1.5,
  });

  // Notifica o ScrollTrigger a cada passo de scroll do Lenis
  lenisInstance.on('scroll', ScrollTrigger.update);
  lenisInstance.on('scroll', syncHtmlBackgroundToViewportTop);

  // Sincroniza o RAF do Lenis ao ticker do GSAP para evitar corrida de quadros
  tickerCallback = (time: number) => {
    lenisInstance?.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);

  // Desativa o lag smoothing do GSAP para manter sincronismo absoluto com o scroll (AD-2)
  gsap.ticker.lagSmoothing(0);
}

/**
 * Inicializa o coordenador de movimento global.
 * Seguro para SSR e idempotente em hot module reloading (HMR).
 */
export function initMotionCoordinator(): void {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;

  isInitialized = true;

  // Criação do motor Lenis se não houver preferência de movimento reduzido
  createLenis();

  // Interceptação de âncoras suaves (#works, etc.)
  setupAnchorInterception();

  handleViewportBgSync = () => {
    syncHtmlBackgroundToViewportTop();
  };
  window.addEventListener('scroll', handleViewportBgSync, { passive: true });
  window.addEventListener('resize', handleViewportBgSync, { passive: true });
  syncHtmlBackgroundToViewportTop();

  // Monitora alterações dinâmicas de prefers-reduced-motion
  mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
  handleMediaChange = (e: MediaQueryListEvent) => {
    if (e.matches) {
      // Usuário ativou movimento reduzido: destrói Lenis
      if (tickerCallback) {
        gsap.ticker.remove(tickerCallback);
        tickerCallback = null;
      }
      if (lenisInstance) {
        lenisInstance.destroy();
        lenisInstance = null;
      }
    } else {
      // Usuário reativou movimento: recria Lenis
      if (!lenisInstance) {
        createLenis();
      }
    }
  };

  if ('addEventListener' in mediaQueryList) {
    mediaQueryList.addEventListener('change', handleMediaChange);
  }

  // Atualiza ScrollTrigger após o carregamento completo de fontes personalizadas
  if ('fonts' in document) {
    document.fonts.ready.then(() => {
      ScrollTrigger.refresh();
    });
  }

  // Trava scroll caso a cortina do preloader ainda esteja ativa no DOM
  const preloader = document.getElementById('intro-preloader');
  if (preloader && !preloader.classList.contains('is-exiting')) {
    pauseScroll();
    window.addEventListener(
      'intro-complete',
      () => {
        resumeScroll();
        ScrollTrigger.refresh();
      },
      { once: true }
    );
  }
}

/**
 * Destrói instâncias e limpa listeners (essencial para testes e HMR).
 */
export function destroyMotionCoordinator(): void {
  if (typeof window === 'undefined') return;

  if (handleAnchorClick) {
    document.removeEventListener('click', handleAnchorClick);
    handleAnchorClick = null;
  }

  if (handleViewportBgSync) {
    window.removeEventListener('scroll', handleViewportBgSync);
    window.removeEventListener('resize', handleViewportBgSync);
    handleViewportBgSync = null;
  }

  if (mediaQueryList && handleMediaChange && 'removeEventListener' in mediaQueryList) {
    mediaQueryList.removeEventListener('change', handleMediaChange);
    handleMediaChange = null;
    mediaQueryList = null;
  }

  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }

  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }

  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('lenis-stopped');
  }

  isInitialized = false;
}

// Re-exporta GSAP e ScrollTrigger para conveniência dos componentes da aplicação
export { gsap, ScrollTrigger };
