export const INTRO_MIN_MS = 1200;
export const INTRO_CAP_MS = 3000;
export const EXIT_MAX_MS = 1400;
export const SKIP_MAX_MS = 700;
export const SHORT_EXIT_MS = 600;
export const REDUCED_FADE_MS = 200;
export const INTRO_SEEN_KEY = 'brinu_intro_seen';

export type IntroMode = 'full' | 'short' | 'reduced';

export interface ExitDelayInput {
  elapsedMs: number;
  fontsReady: boolean;
  avatarReady: boolean;
}

export interface IntroModeInput {
  reducedMotion: boolean;
  seenThisSession: boolean;
}

/** Milliseconds left until the exit may start; 0 means start now. */
export function computeExitDelay({ elapsedMs, fontsReady, avatarReady }: ExitDelayInput): number {
  const limit = fontsReady && avatarReady ? INTRO_MIN_MS : INTRO_CAP_MS;
  return Math.max(0, limit - elapsedMs);
}

export function resolveIntroMode({ reducedMotion, seenThisSession }: IntroModeInput): IntroMode {
  if (reducedMotion) return 'reduced';
  return seenThisSession ? 'short' : 'full';
}

/** Counter value shown while loading: eases to 99 over the minimum time and holds there. */
export function counterValueAt(elapsedMs: number): number {
  const t = Math.min(1, Math.max(0, elapsedMs / INTRO_MIN_MS));
  return Math.min(99, Math.floor((1 - (1 - t) ** 2) * 99));
}
