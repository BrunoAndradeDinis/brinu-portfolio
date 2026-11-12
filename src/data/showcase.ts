import type { MainCaseId } from './cases.ts';
import type { Localized } from './localized.ts';
import { SHOWCASE_TEXT, type ShowcaseCopy } from './showcase-text.ts';

export type { ShowcaseCopy };

export interface ShowcaseImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly alt: Localized<string>;
}

export interface ShowcaseVideo {
  readonly mp4: string;
  readonly webm: string;
  readonly width: number;
  readonly height: number;
  readonly poster: ShowcaseImage;
  readonly tag: Localized<string>;
}

export interface ShowcaseHighlight {
  readonly label: Localized<string>;
  readonly value: string;
  readonly flow: string;
  readonly note: Localized<string>;
}

export interface ShowcaseMedia {
  readonly copy: ShowcaseCopy;
  readonly screenshot: ShowcaseImage;
  readonly sticker: { readonly src: string };
  readonly video?: ShowcaseVideo;
  readonly highlight?: ShowcaseHighlight;
}

const ROOT = '/assets/showcase';
const SCREEN = { width: 1280, height: 800 } as const;
const VIDEO = { width: 1024, height: 650 } as const;
const HIGHLIGHT = { value: '24/7', flow: 'Puppeteer → Xvfb → FFmpeg → RTMP' } as const;

function mediaFor(id: MainCaseId): ShowcaseMedia {
  const text = SHOWCASE_TEXT[id];
  const base = `${ROOT}/${id}/${id}`;
  const media = {
    copy: text.copy,
    screenshot: { src: `${base}-screenshot.webp`, ...SCREEN, alt: text.alt },
    sticker: { src: `${base}-sticker.svg` },
  };
  if (text.tag && text.posterAlt) {
    return {
      ...media,
      video: {
        mp4: `${base}.mp4`,
        webm: `${base}.webm`,
        ...VIDEO,
        poster: { src: `${base}-poster.webp`, ...SCREEN, alt: text.posterAlt },
        tag: text.tag,
      },
    };
  }
  return text.highlight ? { ...media, highlight: { ...HIGHLIGHT, ...text.highlight } } : media;
}

export const SHOWCASE_MEDIA: Readonly<Record<MainCaseId, ShowcaseMedia>> = {
  'magalu-cloud': mediaFor('magalu-cloud'),
  uriana: mediaFor('uriana'),
  efood: mediaFor('efood'),
  aurastream: mediaFor('aurastream'),
};
