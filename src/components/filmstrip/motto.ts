import type { TranslationSchema } from '../../i18n/dictionaries';

export interface NarrativeToken {
  text: string;
  badgeClass?: string;
  badgeInnerClass?: string;
}

const BADGES = [
  {
    badgeClass:
      'inline-block border-2 sm:border-3 border-space-base bg-space-base px-2 sm:px-3 py-0.5 text-paper-white -skew-x-6 shadow-[3px_3px_0_var(--color-paper-white)] align-baseline my-1',
    badgeInnerClass: 'inline-block skew-x-6',
  },
  {
    badgeClass:
      'inline-block border-2 sm:border-3 border-space-base bg-paper-white px-2 sm:px-3 py-0.5 text-space-base skew-x-3 shadow-[3px_3px_0_var(--color-space-base)] align-baseline my-1',
    badgeInnerClass: 'inline-block -skew-x-3',
  },
  {
    badgeClass:
      'inline-block border-2 sm:border-3 border-space-base bg-space-base px-2 sm:px-3 py-0.5 text-bebop-red -skew-x-6 shadow-[3px_3px_0_var(--color-paper-white)] align-baseline my-1',
    badgeInnerClass: 'inline-block skew-x-6',
  },
] as const;

export function buildMottoTokens(dict: TranslationSchema): NarrativeToken[][] {
  const m = dict.filmstrip.motto;
  return [
    [
      { text: m.part1 },
      { text: m.highlight1, ...BADGES[0] },
      { text: m.part2 },
      { text: m.highlight2, ...BADGES[1] },
      { text: m.part3 },
      { text: m.highlight3, ...BADGES[2] },
    ],
  ];
}

export function mottoSentence(dict: TranslationSchema): string {
  return buildMottoTokens(dict)[0]
    .map((token) => token.text.trim())
    .join(' ');
}
