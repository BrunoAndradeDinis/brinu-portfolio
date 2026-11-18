import type { MainCaseId } from './cases.ts';
import { t, type Localized } from './localized.ts';

export interface ShowcaseCopy {
  readonly cta: Localized<string>;
  readonly kicker?: Localized<string>;
  readonly lead: Localized<string>;
  readonly note: Localized<string>;
}

export interface ShowcaseText {
  readonly alt: Localized<string>;
  readonly posterAlt?: Localized<string>;
  readonly tag?: Localized<string>;
  readonly highlight?: { readonly label: Localized<string>; readonly note: Localized<string> };
  readonly copy: ShowcaseCopy;
}

export const SHOWCASE_TEXT: Readonly<Record<MainCaseId, ShowcaseText>> = {
  'magalu-cloud': {
    alt: t('Página inicial do site da Magalu Cloud.', 'Home page of the Magalu Cloud website.'),
    posterAlt: t('Primeiro quadro da navegação no site da Magalu Cloud.', 'First frame of the Magalu Cloud website walkthrough.'),
    tag: t('VÍDEO · NAVEGAÇÃO NO SITE', 'VIDEO · SITE WALKTHROUGH'),
    copy: {
      cta: t('SITE NO AR', 'LIVE SITE'),
      lead: t(
        'Site institucional da nuvem brasileira da Magalu, feito pelo time de front-end do qual faço parte.',
        'Corporate website of the Brazilian Magalu cloud, built by the front-end team I am part of.'
      ),
      note: t(
        'Site estático em produção com JavaScript carregado sob demanda.',
        'Static site in production with JavaScript loaded on demand.'
      ),
    },
  },
  uriana: {
    alt: t('Dashboard do Uriana com indicadores de vendas.', 'Uriana dashboard with sales indicators.'),
    posterAlt: t('Primeiro quadro da navegação pelo Uriana.', 'First frame of the Uriana walkthrough.'),
    tag: t('VÍDEO · DASHBOARD, PRODUTOS, VENDAS', 'VIDEO · DASHBOARD, PRODUCTS, SALES'),
    copy: {
      cta: t('DEMO NO AR', 'LIVE DEMO'),
      lead: t(
        'Plataforma fullstack de estoque e vendas com dashboard de receita e PDV digital.',
        'Full-stack inventory and sales platform with a revenue dashboard and a digital point of sale.'
      ),
      note: t(
        'Estoque e venda gravados na mesma transação de banco.',
        'Stock and sale written in the same database transaction.'
      ),
    },
  },
  efood: {
    alt: t('Lista de restaurantes do eFood.', 'Restaurant list in eFood.'),
    posterAlt: t('Primeiro quadro da navegação pelo eFood.', 'First frame of the eFood walkthrough.'),
    tag: t('VÍDEO · NAVEGAÇÃO NO APP', 'VIDEO · APP WALKTHROUGH'),
    copy: {
      cta: t('DEMO NO AR', 'LIVE DEMO'),
      lead: t(
        'Plataforma de delivery: restaurantes, cardápio, carrinho, entrega, pagamento e confirmação.',
        'Delivery platform: restaurants, menu, cart, delivery, payment and confirmation.'
      ),
      note: t(
        'Checkout em etapas com validação de entrega e pagamento.',
        'Step-by-step checkout with delivery and payment validation.'
      ),
    },
  },
  aurastream: {
    tag: t('VÍDEO · PAINEL E ENGINE 24/7', 'VIDEO · PANEL & 24/7 ENGINE'),
    posterAlt: t(
      'Captura do painel AuraStream com upload de mídia e gerenciamento da transmissão.',
      'AuraStream panel media upload and live transmission management preview.'
    ),
    alt: t('Painel-Stream, o painel de acervo da AuraStream.', 'Painel-Stream, the AuraStream library panel.'),
    highlight: {
      label: t('PAINEL · ACESSO COM LOGIN', 'PANEL · LOGIN REQUIRED'),
      note: t('Engine + painel no ar, sem OBS', 'Engine + panel live, no OBS'),
    },
    copy: {
      cta: t('DEMO DO PAINEL', 'PANEL DEMO'),
      kicker: t('Projeto autoral · Object Storage da Magalu Cloud', 'Personal project · Magalu Cloud Object Storage'),
      lead: t(
        'Motor de transmissão 24/7 para o YouTube e o painel que gerencia o acervo, numa VM da Magalu Cloud.',
        '24/7 streaming engine for YouTube and the panel that manages the library, on a Magalu Cloud VM.'
      ),
      note: t(
        'Transmissão autônoma 24/7 sem software externo.',
        'Autonomous 24/7 streaming with no external software.'
      ),
    },
  },
};
