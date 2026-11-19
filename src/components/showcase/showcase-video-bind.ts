import { gsap } from "../../utils/motion.ts";
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

const SLOT_NAMES = ["media", "second", "third"] as const;

function readAutoplay(): boolean {
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  return shouldAutoplay({
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: connection?.saveData === true,
  });
}

export function initShowcaseVideo(root: ParentNode): Teardown | undefined {
  const initialVideo = root.querySelector<HTMLVideoElement>("[data-showcase-video]");
  const track = root.querySelector<HTMLElement>("[data-showcase-track]");
  if (!initialVideo || !track) return undefined;

  const viewport = root.querySelector<HTMLElement>("[data-showcase-viewport]") ?? track;
  const button = root.querySelector<HTMLButtonElement>("[data-showcase-toggle]");
  const playLabel = button?.querySelector<HTMLElement>("[data-showcase-play]");
  const pauseLabel = button?.querySelector<HTMLElement>("[data-showcase-pause]");
  const stage = root.querySelector<HTMLElement>("[data-showcase-stage]") ?? viewport;
  const spacer = track.querySelector<HTMLElement>("[data-showcase-spacer]");

  const templateCard =
    track.querySelector<HTMLElement>('[data-showcase-card="third"]') ??
    track.querySelector<HTMLElement>('[data-showcase-card="second"]');
  if (templateCard && !track.querySelector("[data-showcase-card-clone]")) {
    const clone = templateCard.cloneNode(true) as HTMLElement;
    clone.removeAttribute("data-showcase-card");
    clone.setAttribute("data-showcase-card-clone", "");
    clone.setAttribute("aria-hidden", "true");
    if (spacer) {
      track.insertBefore(clone, spacer);
    } else {
      track.append(clone);
    }
  }

  track.dataset.carouselSteps = "0";
  track.scrollLeft = 0;
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    track.style.scrollSnapType = "none";
  }

  const getCards = () =>
    Array.from(track.querySelectorAll<HTMLElement>("figure[data-showcase-card], figure[data-showcase-card-clone]"));
  const activeCard = () => track.querySelector<HTMLElement>('[data-showcase-card="media"]') ?? getCards()[0];
  const activeVideo = () => activeCard()?.querySelector<HTMLVideoElement>("video") ?? initialVideo;
  const inactiveVideos = () =>
    getCards()
      .slice(1)
      .flatMap((c) => Array.from(c.querySelectorAll<HTMLVideoElement>("video")));

  let state: VideoState = initialVideoState(readAutoplay());
  let hoveredTarget: "active" | "next" = "active";
  let lastPointer: { x: number; y: number } | null = null;
  let sliding = false;
  let slideTimeline: gsap.core.Timeline | null = null;
  let disposed = false;

  const quickLeft = button ? gsap.quickTo(button, "left", { duration: 0.18, ease: "power3.out" }) : null;
  const quickTop = button ? gsap.quickTo(button, "top", { duration: 0.18, ease: "power3.out" }) : null;

  const playActive = () => {
    inactiveVideos().forEach((v) => v.pause());
    activeVideo()
      .play()
      .catch(() => dispatch("failed"));
  };

  const pauseAll = () => {
    getCards().forEach((c) => c.querySelector<HTMLVideoElement>("video")?.pause());
  };

  const render = () => {
    const isPlaying = state.status === "playing";
    const currentCard = activeCard();
    if (currentCard) currentCard.setAttribute("data-showcase-state", state.status);
    button?.setAttribute("aria-pressed", String(isPlaying));
    const showPause = hoveredTarget === "active" && isPlaying;
    if (playLabel) playLabel.hidden = showPause;
    if (pauseLabel) pauseLabel.hidden = !showPause;
  };

  const dispatch = (event: VideoEvent) => {
    if (disposed) return;
    const previous = state.status;
    state = nextVideoState(state, event);
    render();
    if (state.status === previous) return;
    if (state.status === "playing") {
      playActive();
    } else {
      pauseAll();
    }
  };

  const updateHoveredTarget = (clientX: number, clientY: number) => {
    const cards = getCards();
    const hitIndex = cards.findIndex((c) => {
      const r = c.getBoundingClientRect();
      return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
    });
    if (hitIndex === -1) {
      delete viewport.dataset.videoHover;
      return;
    }
    viewport.dataset.videoHover = "true";
    hoveredTarget = hitIndex === 0 ? "active" : "next";
    render();
  };

  const computeCursorCoords = (event: MouseEvent) => {
    const rect = viewport.getBoundingClientRect();
    const width = button?.offsetWidth || 84;
    const height = button?.offsetHeight || 44;
    const x = Math.min(Math.max(8, event.clientX - rect.left - width / 2), Math.max(8, rect.width - width - 8));
    const y = Math.min(Math.max(8, event.clientY - rect.top - height / 2), Math.max(8, rect.height - height - 8));
    return { x: Math.round(x), y: Math.round(y) };
  };

  const updateCursorPosition = (event: MouseEvent, immediate = false) => {
    lastPointer = { x: event.clientX, y: event.clientY };
    updateHoveredTarget(event.clientX, event.clientY);
    if (!button) return;
    const { x, y } = computeCursorCoords(event);
    button.style.bottom = "auto";
    if (immediate || !quickLeft || !quickTop || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(button, { left: x, top: y });
    } else {
      quickLeft(x);
      quickTop(y);
    }
  };

  const syncSlotAttributes = () => {
    const cards = getCards();
    cards.forEach((card, index) => {
      const slotName = SLOT_NAMES[index];
      const video = card.querySelector<HTMLVideoElement>("video");
      if (slotName) {
        card.setAttribute("data-showcase-card", slotName);
        card.removeAttribute("data-showcase-card-clone");
        card.removeAttribute("aria-hidden");
      } else {
        card.removeAttribute("data-showcase-card");
        card.setAttribute("data-showcase-card-clone", "");
        card.setAttribute("aria-hidden", "true");
      }
      if (index === 0) {
        video?.setAttribute("data-showcase-video", "");
        video?.removeAttribute("data-showcase-video-duplicate");
      } else {
        card.removeAttribute("data-showcase-state");
        video?.removeAttribute("data-showcase-video");
        video?.setAttribute("data-showcase-video-duplicate", "");
      }
    });
  };

  const rotateCards = () => {
    const cards = getCards();
    if (cards.length < 2) return;
    const outgoing = cards[0];
    const outgoingVideo = outgoing.querySelector<HTMLVideoElement>("video");
    if (outgoingVideo) {
      outgoingVideo.pause();
      try {
        outgoingVideo.currentTime = 0;
      } catch {}
    }

    if (spacer) {
      track.insertBefore(outgoing, spacer);
    } else {
      track.append(outgoing);
    }

    syncSlotAttributes();
    track.dataset.carouselSteps = String(Number(track.dataset.carouselSteps ?? "0") + 1);
  };

  const advanceCarousel = () => {
    if (sliding || disposed) return;
    const cards = getCards();
    if (cards.length < 2) return;
    sliding = true;

    track.style.scrollSnapType = "none";
    track.scrollLeft = 0;

    const outgoingVideo = cards[0].querySelector<HTMLVideoElement>("video");
    const incomingVideo = cards[1].querySelector<HTMLVideoElement>("video");
    outgoingVideo?.pause();

    const step = cards[1].offsetLeft - cards[0].offsetLeft;
    const finish = () => {
      slideTimeline = null;
      gsap.set(cards, { clearProps: "transform" });
      if (incomingVideo) gsap.set(incomingVideo, { clearProps: "transform" });
      rotateCards();
      track.scrollLeft = 0;
      sliding = false;
      if (lastPointer) updateHoveredTarget(lastPointer.x, lastPointer.y);
      state = { status: "playing", resumeWhenVisible: true };
      render();
      playActive();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || step <= 0) {
      finish();
      return;
    }

    if (incomingVideo) {
      incomingVideo.play().catch(() => {});
    }

    const tl = gsap.timeline({ onComplete: finish });
    tl.to(
      cards,
      {
        x: -step,
        duration: 0.8,
        ease: "power2.out",
        force3D: true,
      },
      0
    );
    if (incomingVideo) {
      tl.fromTo(
        incomingVideo,
        { scale: 1.02 },
        { scale: 1, duration: 0.8, ease: "power2.out", force3D: true },
        0
      );
    }
    slideTimeline = tl;
  };

  const onMouseEnter = (event: MouseEvent) => {
    updateCursorPosition(event, true);
  };
  const onMouseMove = (event: MouseEvent) => {
    updateCursorPosition(event, false);
  };
  const onMouseLeave = () => {
    lastPointer = null;
    hoveredTarget = "active";
    delete viewport.dataset.videoHover;
    render();
  };

  const onButtonClick = (event: MouseEvent) => {
    if (event.detail > 1) return;
    if (hoveredTarget === "next") {
      advanceCarousel();
    } else {
      dispatch("toggle");
    }
  };

  const onTrackClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || target.closest("[data-showcase-toggle]")) return;
    const nextCard = target.closest(
      '[data-showcase-card="second"], [data-showcase-card="third"], [data-showcase-card-clone]'
    );
    if (nextCard) {
      advanceCarousel();
    }
  };

  const onError = () => dispatch("failed");
  const onPageShow = (event: PageTransitionEvent) => {
    if (!event.persisted) return;
    pauseAll();
    state = initialVideoState(readAutoplay());
    render();
    if (state.status === "playing") playActive();
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const latest = entries[entries.length - 1];
      if (latest) dispatch(latest.isIntersecting ? "visible" : "hidden");
    },
    { threshold: 0.25 }
  );

  if (button) button.hidden = false;
  button?.addEventListener("click", onButtonClick);
  track.addEventListener("click", onTrackClick);
  viewport.addEventListener("mouseenter", onMouseEnter);
  viewport.addEventListener("mousemove", onMouseMove);
  viewport.addEventListener("mouseleave", onMouseLeave);
  track.addEventListener("error", onError, true);
  window.addEventListener("pageshow", onPageShow);
  render();
  if (state.status === "playing") playActive();
  observer.observe(stage);

  return () => {
    disposed = true;
    slideTimeline?.kill();
    observer.disconnect();
    button?.removeEventListener("click", onButtonClick);
    track.removeEventListener("click", onTrackClick);
    viewport.removeEventListener("mouseenter", onMouseEnter);
    viewport.removeEventListener("mousemove", onMouseMove);
    viewport.removeEventListener("mouseleave", onMouseLeave);
    track.removeEventListener("error", onError, true);
    window.removeEventListener("pageshow", onPageShow);
    pauseAll();
  };
}
