import type { MainCaseId } from './cases.ts';
import type { Localized } from './localized.ts';
import { SHOWCASE_TEXT, type ShowcaseCopy } from './showcase-text.ts';

export type { ShowcaseCopy };

export interface ShowcaseImage {
  readonly src: string;
  readonly width: number;
  readonly height: number;
  readonly srcset?: string;
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
  readonly videos?: readonly ShowcaseVideo[];
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
    screenshot: {
      src: `${base}-screenshot.webp`,
      ...SCREEN,
      srcset: `${base}-screenshot-768.webp 768w, ${base}-screenshot.webp 1024w`,
      alt: text.alt,
    },
    sticker: { src: `${base}-sticker.svg` },
  };
  if (text.tag && text.posterAlt) {
    const mainVideo: ShowcaseVideo = {
      mp4: `${base}.mp4`,
      webm: `${base}.webm`,
      ...VIDEO,
      poster: { src: `${base}-poster.webp`, ...SCREEN, alt: text.posterAlt },
      tag: text.tag,
    };
    if (id === 'magalu-cloud') {
      const videos: ShowcaseVideo[] = [
        mainVideo,
        {
          mp4: `${ROOT}/magalu-cloud/magalu-cloud-virtual-machines.mp4`,
          webm: `${ROOT}/magalu-cloud/magalu-cloud-virtual-machines.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/magalu-cloud/magalu-cloud-virtual-machines-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/magalu-cloud/magalu-cloud-software-e-ti.mp4`,
          webm: `${ROOT}/magalu-cloud/magalu-cloud-software-e-ti.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/magalu-cloud/magalu-cloud-software-e-ti-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/magalu-cloud/magalu-cloud-precos.mp4`,
          webm: `${ROOT}/magalu-cloud/magalu-cloud-precos.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/magalu-cloud/magalu-cloud-precos-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/magalu-cloud/magalu-cloud-sobre-nos.mp4`,
          webm: `${ROOT}/magalu-cloud/magalu-cloud-sobre-nos.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/magalu-cloud/magalu-cloud-sobre-nos-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/magalu-cloud/magalu-cloud-clientes.mp4`,
          webm: `${ROOT}/magalu-cloud/magalu-cloud-clientes.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/magalu-cloud/magalu-cloud-clientes-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/magalu-cloud/magalu-cloud-blog.mp4`,
          webm: `${ROOT}/magalu-cloud/magalu-cloud-blog.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/magalu-cloud/magalu-cloud-blog-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/magalu-cloud/magalu-cloud-contato.mp4`,
          webm: `${ROOT}/magalu-cloud/magalu-cloud-contato.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/magalu-cloud/magalu-cloud-contato-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
      ];
      return { ...media, video: mainVideo, videos };
    }
    if (id === 'uriana') {
      const videos: ShowcaseVideo[] = [
        mainVideo,
        {
          mp4: `${ROOT}/uriana/uriana-realizar-venda.mp4`,
          webm: `${ROOT}/uriana/uriana-realizar-venda.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/uriana/uriana-realizar-venda-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/uriana/uriana-validar-estoque.mp4`,
          webm: `${ROOT}/uriana/uriana-validar-estoque.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/uriana/uriana-validar-estoque-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
      ];
      return { ...media, video: mainVideo, videos };
    }
    if (id === 'efood') {
      const videos: ShowcaseVideo[] = [
        mainVideo,
        {
          mp4: `${ROOT}/efood/efood-carrinho-entrega.mp4`,
          webm: `${ROOT}/efood/efood-carrinho-entrega.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/efood/efood-carrinho-entrega-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/efood/efood-pagamento-confirmacao.mp4`,
          webm: `${ROOT}/efood/efood-pagamento-confirmacao.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/efood/efood-pagamento-confirmacao-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
      ];
      return { ...media, video: mainVideo, videos };
    }
    if (id === 'aurastream') {
      const videos: ShowcaseVideo[] = [
        mainVideo,
        {
          mp4: `${ROOT}/aurastream/aurastream-iniciar-vm.mp4`,
          webm: `${ROOT}/aurastream/aurastream-iniciar-vm.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/aurastream/aurastream-iniciar-vm-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/aurastream/aurastream-transmissao-ao-vivo.mp4`,
          webm: `${ROOT}/aurastream/aurastream-transmissao-ao-vivo.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/aurastream/aurastream-transmissao-ao-vivo-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/aurastream/aurastream-desligar-vm.mp4`,
          webm: `${ROOT}/aurastream/aurastream-desligar-vm.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/aurastream/aurastream-desligar-vm-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
        {
          mp4: `${ROOT}/aurastream/aurastream-gestao-usuarios.mp4`,
          webm: `${ROOT}/aurastream/aurastream-gestao-usuarios.webm`,
          ...VIDEO,
          poster: { src: `${ROOT}/aurastream/aurastream-gestao-usuarios-poster.webp`, ...SCREEN, alt: text.posterAlt },
          tag: text.tag,
        },
      ];
      return { ...media, video: mainVideo, videos };
    }
    const videos: ShowcaseVideo[] = [mainVideo, mainVideo, mainVideo];
    return { ...media, video: mainVideo, videos };
  }
  return text.highlight ? { ...media, highlight: { ...HIGHLIGHT, ...text.highlight } } : media;
}

export const SHOWCASE_MEDIA: Readonly<Record<MainCaseId, ShowcaseMedia>> = {
  'magalu-cloud': mediaFor('magalu-cloud'),
  uriana: mediaFor('uriana'),
  efood: mediaFor('efood'),
  aurastream: mediaFor('aurastream'),
};
