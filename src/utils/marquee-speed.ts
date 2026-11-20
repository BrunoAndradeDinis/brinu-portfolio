function durationSeconds(track: HTMLElement): number {
  return parseFloat(getComputedStyle(track).animationDuration.split(',')[0]) || 0;
}

/** Gives the follower track the same pixels-per-second scroll as the reference track; both loop over half their width. */
export function matchMarqueeSpeed(reference: HTMLElement, follower: HTMLElement): () => void {
  const referenceSeconds = durationSeconds(reference);
  if (!referenceSeconds) return () => {};

  const sync = () => {
    const referenceWidth = reference.scrollWidth;
    if (!referenceWidth) return;
    const pixelsPerSecond = referenceWidth / 2 / referenceSeconds;
    follower.style.animationDuration = `${(follower.scrollWidth / 2 / pixelsPerSecond).toFixed(2)}s`;
  };

  const observer = new ResizeObserver(sync);
  observer.observe(reference);
  observer.observe(follower);
  sync();
  return () => observer.disconnect();
}
