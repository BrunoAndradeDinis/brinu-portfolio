import type { MainCaseId } from './cases.ts';

export interface ShowcaseLayout {
  readonly name: string;
  readonly nameEm: number;
  readonly barStack: readonly [string, string, string];
  readonly ctaShort: string;
}

export const SHOWCASE_LAYOUT: Readonly<Record<MainCaseId, ShowcaseLayout>> = {
  'magalu-cloud': { name: 'MAGALU CLOUD', nameEm: 7.4, barStack: ['ASTRO', 'REACT', 'TAILWIND'], ctaShort: 'SITE' },
  uriana: { name: 'URIANA', nameEm: 6.6, barStack: ['NEXT.JS 14', 'PRISMA', 'POSTGRESQL'], ctaShort: 'DEMO' },
  efood: { name: 'EFOOD', nameEm: 6.2, barStack: ['REACT 18', 'REDUX TOOLKIT', 'TYPESCRIPT'], ctaShort: 'DEMO' },
  aurastream: { name: 'AURASTREAM', nameEm: 12, barStack: ['NEXT.JS', 'PUPPETEER', 'FFMPEG'], ctaShort: 'DEMO' },
};
