import {
  initialVideoState,
  nextVideoState,
  shouldAutoplay,
  type VideoEvent,
  type VideoState,
} from "../../utils/showcase-video.ts";

type Teardown = () => void;

interface NetworkInformationLike {
  saveData?: boolean;
}

function readAutoplay(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return shouldAutoplay({
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: connection?.saveData === true,
  });
}

export function initShowcaseVideo(root: ParentNode): Teardown | undefined {
  const video = root.querySelector<HTMLVideoElement>("[data-showcase-video]");
  if (!video) return undefined;
  const button = root.querySelector<HTMLButtonElement>("[data-showcase-toggle]");
  const card = video.closest<HTMLElement>("[data-showcase-card]") ?? video;

  let state: VideoState = initialVideoState(readAutoplay());
  let disposed = false;

  const render = () => {
    const isPlaying = state.status === "playing";
    card.setAttribute("data-showcase-state", state.status);
    button?.setAttribute("aria-pressed", String(isPlaying));
  };

  const dispatch = (event: VideoEvent) => {
    if (disposed) return;
    const previous = state.status;
    state = nextVideoState(state, event);
    render();
    if (state.status === previous) return;
    if (state.status === "playing") {
      video.play().catch(() => dispatch("failed"));
    } else {
      video.pause();
    }
  };

  const onToggle = () => dispatch("toggle");
  const onError = () => dispatch("failed");
  const onPageShow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    video.pause();
    state = initialVideoState(readAutoplay());
    render();
    if (state.status === "playing") video.play().catch(() => dispatch("failed"));
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const latest = entries[entries.length - 1];
      if (latest) dispatch(latest.isIntersecting ? "visible" : "hidden");
    },
    { threshold: 0.25 }
  );

  if (button) button.hidden = false;
  button?.addEventListener("click", onToggle);
  video.addEventListener("error", onError, true);
  window.addEventListener("pageshow", onPageShow);
  render();
  if (state.status === "playing") video.play().catch(() => dispatch("failed"));
  observer.observe(card);

  return () => {
    disposed = true;
    observer.disconnect();
    button?.removeEventListener("click", onToggle);
    video.removeEventListener("error", onError, true);
    window.removeEventListener("pageshow", onPageShow);
    video.pause();
  };
}
