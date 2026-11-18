type HintMode = "dblclick" | "rotate";

export const HINT_DURATION_MS = 3000;
export const HINT_SEEN_KEYS: Record<HintMode, string> = {
  dblclick: "brinu_showcase_hint_dblclick_seen",
  rotate: "brinu_showcase_hint_rotate_seen",
};

const seenThisLoad = new Set<HintMode>();

function hasSeen(mode: HintMode): boolean {
  if (seenThisLoad.has(mode)) return true;
  try {
    return window.localStorage.getItem(HINT_SEEN_KEYS[mode]) === "1";
  } catch {
    return false;
  }
}

function markSeen(mode: HintMode): void {
  seenThisLoad.add(mode);
  try {
    window.localStorage.setItem(HINT_SEEN_KEYS[mode], "1");
  } catch {}
}

export function initShowcaseHint(root: HTMLElement): () => void {
  const viewport = root.querySelector<HTMLElement>("[data-showcase-viewport]");
  const stage = root.querySelector<HTMLElement>("[data-showcase-stage]") ?? viewport;
  if (!viewport || !stage || !root.querySelector("[data-showcase-hint]")) return () => {};

  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const landscape = window.matchMedia("(orientation: landscape)");
  let timer = 0;
  let overActive = false;

  const hide = () => {
    window.clearTimeout(timer);
    delete root.dataset.showcaseHintOn;
  };

  const show = (mode: HintMode) => {
    if (hasSeen(mode)) return;
    markSeen(mode);
    window.clearTimeout(timer);
    root.dataset.showcaseHintMode = mode;
    root.dataset.showcaseHintOn = "";
    timer = window.setTimeout(hide, HINT_DURATION_MS);
  };

  const showRotate = () => {
    if (!finePointer.matches && !landscape.matches) show("rotate");
  };

  const onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    const rect = root.querySelector<HTMLElement>('[data-showcase-card="media"]')?.getBoundingClientRect();
    const inside =
      !!rect &&
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (inside && !overActive) show("dblclick");
    overActive = inside;
  };

  const onPointerLeave = () => {
    overActive = false;
  };

  let tapped = false;
  const onTouchStart = () => {
    if (tapped) return;
    tapped = true;
    showRotate();
  };

  const onOrientation = () => {
    if (landscape.matches) hide();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) showRotate();
    },
    { threshold: 0.5 }
  );

  viewport.addEventListener("pointermove", onPointerMove);
  viewport.addEventListener("pointerleave", onPointerLeave);
  viewport.addEventListener("touchstart", onTouchStart, { passive: true });
  landscape.addEventListener("change", onOrientation);
  observer.observe(stage);

  return () => {
    hide();
    observer.disconnect();
    viewport.removeEventListener("pointermove", onPointerMove);
    viewport.removeEventListener("pointerleave", onPointerLeave);
    viewport.removeEventListener("touchstart", onTouchStart);
    landscape.removeEventListener("change", onOrientation);
  };
}
