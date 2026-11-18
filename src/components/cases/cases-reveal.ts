export const CASE_REVEAL_ELEMENTS = ['title', 'meta', 'media', 'summary', 'link'] as const;
export type CaseRevealElement = (typeof CASE_REVEAL_ELEMENTS)[number];

const REVEAL_OVERLAP = 0.5;

export interface CaseStep {
  readonly index: number;
  /** True when the move would leave the list, so the caller releases the pin. */
  readonly done: boolean;
}

export interface CaseSteps {
  readonly index: number;
  next(): CaseStep;
  previous(): CaseStep;
  goTo(index: number): CaseStep;
}

export function createCaseSteps(count: number): CaseSteps {
  const last = Math.max(0, count - 1);
  let current = 0;
  const move = (target: number): CaseStep => {
    const done = target < 0 || target > last;
    if (!done) current = target;
    return { index: current, done };
  };
  return {
    get index() {
      return current;
    },
    next: () => move(current + 1),
    previous: () => move(current - 1),
    goTo: (index) => {
      current = Math.min(last, Math.max(0, Math.trunc(index)));
      return { index: current, done: false };
    },
  };
}

/** Start time of each element, in the unit of `duration`; each one starts while the previous is still running. */
export function elementOffsets(elementCount: number, duration: number): number[] {
  return Array.from({ length: Math.max(0, elementCount) }, (_, position) => position * duration * (1 - REVEAL_OVERLAP));
}
