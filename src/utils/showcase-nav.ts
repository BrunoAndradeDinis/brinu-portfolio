import { MAIN_CASES, type MainCaseId } from "../data/cases.ts";
import { casePath } from "./case-pages.ts";

export interface ShowcaseTile {
  id: MainCaseId;
  index: number;
  current: boolean;
  href: string;
}

export interface ShowcaseNeighbors {
  prev: MainCaseId;
  next: MainCaseId;
}

function indexOfCase(id: string): number {
  return MAIN_CASES.findIndex((definition) => definition.id === id);
}

export function showcasePosition(id: string): string | null {
  const index = indexOfCase(id);
  if (index === -1) return null;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(index + 1)} / ${pad(MAIN_CASES.length)}`;
}

export function showcaseNeighbors(id: string): ShowcaseNeighbors | null {
  const index = indexOfCase(id);
  if (index === -1) return null;
  const total = MAIN_CASES.length;
  return {
    prev: MAIN_CASES[(index - 1 + total) % total].id,
    next: MAIN_CASES[(index + 1) % total].id,
  };
}

export function showcaseTiles(currentId: string): ShowcaseTile[] {
  if (indexOfCase(currentId) === -1) return [];
  return MAIN_CASES.map(({ id }, index) => ({
    id,
    index: index + 1,
    current: id === currentId,
    href: casePath(id),
  }));
}
