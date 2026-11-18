const HOT = 'data-scrollbar-hot';

function scroller(target: EventTarget | null): HTMLElement | null {
  if (target === document.documentElement) return document.documentElement;
  return target instanceof Element ? target.closest<HTMLElement>('.scroll-area') : null;
}

function overScrollbar(element: HTMLElement, x: number): boolean {
  if (element === document.documentElement) return x >= element.clientWidth;
  const start = element.getBoundingClientRect().left + element.clientLeft + element.clientWidth;
  const width = element.offsetWidth - element.clientWidth - element.clientLeft * 2;
  return width > 0 && x >= start && x < start + width;
}

export function installScrollbarHover(): void {
  let hot: HTMLElement | null = null;
  let dragging = false;

  const mark = (next: HTMLElement | null) => {
    if (next === hot) return;
    hot?.removeAttribute(HOT);
    next?.setAttribute(HOT, '');
    hot = next;
  };

  const track = (event: PointerEvent) => {
    if (dragging) return;
    const element = scroller(event.target);
    mark(element && overScrollbar(element, event.clientX) ? element : null);
  };

  document.addEventListener('pointermove', track, { passive: true });
  document.addEventListener('pointerdown', (event) => {
    track(event);
    dragging = hot !== null;
  });
  document.addEventListener('pointerup', (event) => {
    dragging = false;
    track(event);
  });
  document.addEventListener('pointerout', (event) => {
    if (!event.relatedTarget && !dragging) mark(null);
  });
  document.addEventListener('astro:before-swap', () => {
    dragging = false;
    mark(null);
  });
}
