import { MAIN_CASES, type MainCaseId } from "../data/cases.ts";

export function casePath(id: string): string {
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

export interface CaseMeta {
  title: string;
  description: string;
}

export function caseMeta(
  project: { title: string; description: string },
  titleSuffix: string
): CaseMeta {
  return { title: `${project.title} // ${titleSuffix}`, description: project.description };
}

export function parseCaseIdFromPath(pathname: string): string | null {
  const match = /^\/cases\/([^/]+?)\/?$/.exec(pathname);
  return match ? match[1] : null;
}
