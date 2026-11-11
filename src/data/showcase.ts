import type { MainCaseId } from './cases.ts';
import { t, type Localized } from './localized.ts';

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
  readonly screenshot: ShowcaseImage;
  readonly sticker: { readonly src: string };
  readonly video?: ShowcaseVideo;
  readonly highlight?: ShowcaseHighlight;
}

const ROOT = '/assets/showcase';
const SCREEN = { width: 1280, height: 800 } as const;
const VIDEO = { width: 1024, height: 650 } as const;

function files(id: MainCaseId) {
  return {
    screenshot: `${ROOT}/${id}/${id}-screenshot.webp`,
    sticker: `${ROOT}/${id}/${id}-sticker.svg`,
    poster: `${ROOT}/${id}/${id}-poster.webp`,
    mp4: `${ROOT}/${id}/${id}.mp4`,
    webm: `${ROOT}/${id}/${id}.webm`,
  };
}

function video(id: MainCaseId, tag: Localized<string>, posterAlt: Localized<string>): ShowcaseVideo {
  const file = files(id);
  return {
    mp4: file.mp4,
    webm: file.webm,
    ...VIDEO,
    poster: { src: file.poster, ...SCREEN, alt: posterAlt },
    tag,
  };
}

function screenshot(id: MainCaseId, alt: Localized<string>): ShowcaseImage {
  return { src: files(id).screenshot, ...SCREEN, alt };
}

export const SHOWCASE_MEDIA: Readonly<Record<MainCaseId, ShowcaseMedia>> = {
  'magalu-cloud': {
    screenshot: screenshot(
      'magalu-cloud',
      t('Página inicial do site da Magalu Cloud.', 'Home page of the Magalu Cloud website.')
    ),
    sticker: { src: files('magalu-cloud').sticker },
    video: video(
      'magalu-cloud',
      t('VÍDEO · NAVEGAÇÃO NO SITE', 'VIDEO · SITE WALKTHROUGH'),
      t('Primeiro quadro da navegação no site da Magalu Cloud.', 'First frame of the Magalu Cloud website walkthrough.')
    ),
  },
  uriana: {
    screenshot: screenshot(
      'uriana',
      t('Dashboard do Uriana com indicadores de vendas.', 'Uriana dashboard with sales indicators.')
    ),
    sticker: { src: files('uriana').sticker },
    video: video(
      'uriana',
      t('VÍDEO · DASHBOARD, PRODUTOS, VENDAS', 'VIDEO · DASHBOARD, PRODUCTS, SALES'),
      t('Primeiro quadro da navegação pelo Uriana.', 'First frame of the Uriana walkthrough.')
    ),
  },
  efood: {
    screenshot: screenshot(
      'efood',
      t('Lista de restaurantes do eFood.', 'Restaurant list in eFood.')
    ),
    sticker: { src: files('efood').sticker },
    video: video(
      'efood',
      t('VÍDEO · NAVEGAÇÃO NO APP', 'VIDEO · APP WALKTHROUGH'),
      t('Primeiro quadro da navegação pelo eFood.', 'First frame of the eFood walkthrough.')
    ),
  },
  aurastream: {
    screenshot: screenshot(
      'aurastream',
      t('Painel-Stream, o painel de acervo da AuraStream.', 'Painel-Stream, the AuraStream library panel.')
    ),
    sticker: { src: files('aurastream').sticker },
    highlight: {
      label: t('PAINEL · ACESSO COM LOGIN', 'PANEL · LOGIN REQUIRED'),
      value: '24/7',
      flow: 'Puppeteer → Xvfb → FFmpeg → RTMP',
      note: t('Engine + painel no ar, sem OBS', 'Engine + panel live, no OBS'),
    },
  },
};
