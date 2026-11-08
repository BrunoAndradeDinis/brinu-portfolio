import { MAIN_CASES, type MainCaseId } from "../data/cases.ts";

export function casePath(id: MainCaseId): string {
  return `/cases/${id}`;
}

export function caseStaticPaths(): { params: { id: MainCaseId } }[] {
  return MAIN_CASES.map(({ id }) => ({ params: { id } }));
}

export function nextCaseId(id: string): MainCaseId | null {
  const index = MAIN_CASES.findIndex((definition) => definition.id === id);
  if (index === -1) return null;
  return MAIN_CASES[(index + 1) % MAIN_CASES.length].id;
}
