import { MOTION_DURATION, MOTION_EASE, gsap } from './motion.ts';

export interface PanelTransition {
  open(): void;
  close(): void;
  destroy(): void;
}

const GRID_BLUR_PX = 8;
const SCATTER_PX = 18;
const SCATTER_DEG = 4;

const scatterSign = (position: number) => (position % 2 === 0 ? -1 : 1);

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Blurs and disperses `grid` while the modal `panel` enters from the right; closing plays both moves back. */
export function createPanelTransition(panel: HTMLDialogElement, grid: HTMLElement, tiles: readonly HTMLElement[]): PanelTransition {
  const move = { duration: MOTION_DURATION.seconds, ease: MOTION_EASE.enter, overwrite: true } as const;

  const rest = () => {
    gsap.killTweensOf([panel, grid, ...tiles]);
    gsap.set(panel, { clearProps: 'transform' });
    gsap.set(grid, { clearProps: 'filter' });
    gsap.set(tiles, { clearProps: 'transform' });
  };

  panel.addEventListener('close', rest);

  return {
    open() {
      panel.showModal();
      if (prefersReducedMotion()) return;
      gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, ...move });
      gsap.to(grid, { filter: `blur(${GRID_BLUR_PX}px)`, ...move });
      gsap.to(tiles, {
        x: (position) => scatterSign(position) * SCATTER_PX,
        y: (position) => scatterSign(position + (position >> 1)) * SCATTER_PX,
        rotation: (position) => scatterSign(position) * SCATTER_DEG,
        ...move,
      });
    },
    close() {
      if (!panel.open) return;
      if (prefersReducedMotion()) {
        panel.close();
        return;
      }
      gsap.to(tiles, { x: 0, y: 0, rotation: 0, ...move });
      gsap.to(grid, { filter: 'blur(0px)', ...move });
      gsap.to(panel, { xPercent: 100, ...move, onComplete: () => panel.close() });
    },
    destroy() {
      panel.removeEventListener('close', rest);
      if (panel.open) panel.close();
      rest();
    },
  };
}
