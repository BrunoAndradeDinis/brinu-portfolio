export interface AutoplayContext {
  reducedMotion: boolean;
  saveData: boolean;
}

export type VideoStatus = "idle" | "playing" | "paused";

export interface VideoState {
  readonly status: VideoStatus;
  readonly resumeWhenVisible: boolean;
}

export type VideoEvent = "toggle" | "hidden" | "visible" | "failed";

export function shouldAutoplay({ reducedMotion, saveData }: AutoplayContext): boolean {
  return !reducedMotion && !saveData;
}

export function initialVideoState(autoplay: boolean): VideoState {
  return { status: autoplay ? "playing" : "idle", resumeWhenVisible: false };
}

export function nextVideoState(state: VideoState, event: VideoEvent): VideoState {
  switch (event) {
    case "toggle":
      return {
        status: state.status === "playing" ? "paused" : "playing",
        resumeWhenVisible: false,
      };
    case "hidden":
      return state.status === "playing" ? { status: "paused", resumeWhenVisible: true } : state;
    case "visible":
      return state.resumeWhenVisible && state.status === "paused"
        ? { status: "playing", resumeWhenVisible: false }
        : state;
    case "failed":
      return { status: "idle", resumeWhenVisible: false };
  }
}
