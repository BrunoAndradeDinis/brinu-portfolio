import { t, type Locale, type Localized } from './localized.ts';

export type SupportedLocale = Locale;

export interface ProjectLink {
  label: string;
  url: string;
  type: 'github' | 'demo' | 'external';
  ariaLabel: string;
}

export interface ProjectCase {
  id: string;
  reelNumber: string;
  arcanaCode: string;
  category: string;
  badge: string;
  title: string;
  subtitle: string;
  status: string;
  description: string;
  challenge: string;
  solution: string;
  metric: string;
  stack: string[];
  track: 1 | 2;
  links: ProjectLink[];
}

export type MainCaseId = 'magalu-cloud' | 'uriana' | 'efood' | 'aurastream';

interface CaseLinkDefinition {
  readonly type: ProjectLink['type'];
  readonly url: string;
  readonly label: Localized<string>;
  readonly ariaLabel: Localized<string>;
}

export interface CaseDefinition {
  readonly id: MainCaseId;
  readonly track: 1 | 2;
  readonly arcanaCode: string;
  readonly stack: readonly string[];
  readonly links: readonly CaseLinkDefinition[];
  readonly text: {
    readonly reelNumber: Localized<string>;
    readonly category: Localized<string>;
    readonly badge: Localized<string>;
    readonly title: Localized<string>;
    readonly subtitle: Localized<string>;
    readonly status: Localized<string>;
    readonly description: Localized<string>;
    readonly challenge: Localized<string>;
    readonly solution: Localized<string>;
    readonly metric: Localized<string>;
  };
}

export const MAIN_CASES: readonly CaseDefinition[] = [
  {
    id: 'magalu-cloud',
    track: 1,
    arcanaCode: 'ARCANA // EMPRESS',
    stack: ['Astro', 'React', 'Tailwind CSS', 'Next.js', 'TypeScript', 'Figma', 'Strapi CMS', 'GitLab'],
    links: [
      {
        type: 'external',
        url: 'https://magalu.cloud/',
        label: t('SITE NO AR', 'LIVE SITE'),
        ariaLabel: t(
          'Abrir o site institucional da Magalu Cloud (abre em nova aba)',
          'Open the Magalu Cloud corporate website (opens in new tab)'
        ),
      },
    ],
    text: {
      reelNumber: t('CASE 01', 'CASE 01'),
      category: t('FRONTEND EM PRODUÇÃO', 'PRODUCTION FRONTEND'),
      badge: t('TRABALHO DE TIME', 'TEAM WORK'),
      title: t('Site Institucional Magalu Cloud', 'Magalu Cloud Corporate Website'),
      subtitle: t('Frontend em produção • Time Magalu Cloud', 'Production frontend • Magalu Cloud team'),
      status: t('No ar', 'Live'),
      description: t(
        'Site institucional da nuvem brasileira da Magalu, construído pelo time de front-end do qual faço parte.',
        'Corporate website of Magalu’s Brazilian cloud, built by the frontend team I am part of.'
      ),
      challenge: t(
        'Apresentar os produtos de uma nuvem brasileira em páginas rápidas, acessíveis e fiéis ao design.',
        'Present the products of a Brazilian cloud in fast, accessible pages that stay true to the design.'
      ),
      solution: t(
        'Arquitetura de ilhas do Astro: HTML estático com componentes React hidratados só quando entram na tela ou quando o navegador fica ocioso, estilizados com Tailwind CSS.',
        'Astro islands architecture: static HTML with React components hydrated only when they scroll into view or the browser is idle, styled with Tailwind CSS.'
      ),
      metric: t(
        'Site estático em produção com JavaScript carregado sob demanda.',
        'Static site in production with JavaScript loaded on demand.'
      ),
    },
  },
  {
    id: 'uriana',
    track: 1,
    arcanaCode: 'ARCANA // HIEROPHANT',
    stack: ['Next.js 14', 'TypeScript', 'Prisma', 'PostgreSQL', 'Zod', 'next-safe-action', 'Tailwind CSS', 'Recharts'],
    links: [
      {
        type: 'github',
        url: 'https://github.com/Dinis-s-Acount/Uriana',
        label: t('REPO NO GITHUB', 'GITHUB REPO'),
        ariaLabel: t(
          'Acessar o repositório do Uriana no GitHub (abre em nova aba)',
          'Open the Uriana repository on GitHub (opens in new tab)'
        ),
      },
      {
        type: 'demo',
        url: 'https://uriana.vercel.app',
        label: t('DEMO NO AR', 'LIVE DEMO'),
        ariaLabel: t('Abrir a demo do Uriana (abre em nova aba)', 'Open the Uriana demo (opens in new tab)'),
      },
    ],
    text: {
      reelNumber: t('CASE 02', 'CASE 02'),
      category: t('FULLSTACK & DADOS', 'FULLSTACK & DATA'),
      badge: t('ESTOQUE & VENDAS', 'INVENTORY & SALES'),
      title: t('Uriana', 'Uriana'),
      subtitle: t('Gestão de estoque e vendas', 'Inventory and sales management'),
      status: t('No ar', 'Live'),
      description: t(
        'Plataforma fullstack de estoque e vendas com dashboard de receita e PDV digital.',
        'Fullstack inventory and sales platform with a revenue dashboard and a digital point of sale.'
      ),
      challenge: t(
        'Gestão de estoque e vendas com indicadores em tempo real e estoque sempre consistente.',
        'Inventory and sales management with real-time indicators and stock that is always consistent.'
      ),
      solution: t(
        'Next.js com server actions validadas por Zod (next-safe-action), camada de acesso a dados separada, Prisma e dashboard com receita dos últimos 14 dias; o estoque baixa na mesma transação da venda. Evolução do Stockly, com demo no ar.',
        'Next.js with server actions validated by Zod (next-safe-action), a separate data-access layer, Prisma and a dashboard with the last 14 days of revenue; stock is decremented in the same transaction as the sale. An evolution of Stockly, with a live demo.'
      ),
      metric: t(
        'Estoque e venda gravados na mesma transação de banco.',
        'Stock and sale written in the same database transaction.'
      ),
    },
  },
  {
    id: 'efood',
    track: 2,
    arcanaCode: 'ARCANA // TEMPERANCE',
    stack: ['React 18', 'TypeScript', 'Redux Toolkit', 'RTK Query', 'Formik', 'Yup', 'styled-components'],
    links: [
      {
        type: 'github',
        url: 'https://github.com/BrunoAndradeDinis/efood',
        label: t('REPO NO GITHUB', 'GITHUB REPO'),
        ariaLabel: t(
          'Acessar o repositório do eFood no GitHub (abre em nova aba)',
          'Open the eFood repository on GitHub (opens in new tab)'
        ),
      },
      {
        type: 'demo',
        url: 'https://efood-nine-sepia.vercel.app',
        label: t('DEMO NO AR', 'LIVE DEMO'),
        ariaLabel: t('Abrir a demo do eFood (abre em nova aba)', 'Open the eFood demo (opens in new tab)'),
      },
    ],
    text: {
      reelNumber: t('CASE 03', 'CASE 03'),
      category: t('FRONTEND REACT', 'REACT FRONTEND'),
      badge: t('FLUXO DE COMPRA', 'CHECKOUT FLOW'),
      title: t('eFood', 'eFood'),
      subtitle: t('Delivery com carrinho e checkout', 'Food delivery with cart and checkout'),
      status: t('No ar', 'Live'),
      description: t(
        'Plataforma de delivery: restaurantes, cardápio, carrinho, entrega, pagamento e confirmação do pedido.',
        'Food delivery platform: restaurants, menu, cart, delivery, payment and order confirmation.'
      ),
      challenge: t(
        'Fluxo completo de delivery: cardápio, carrinho, entrega, pagamento e confirmação.',
        'Complete delivery flow: menu, cart, delivery, payment and confirmation.'
      ),
      solution: t(
        'React + TypeScript com Redux Toolkit e RTK Query para a API, formulários com Formik e Yup, styled-components.',
        'React + TypeScript with Redux Toolkit and RTK Query for the API, forms with Formik and Yup, styled-components.'
      ),
      metric: t(
        'Checkout em etapas com validação de entrega e pagamento.',
        'Step-by-step checkout with delivery and payment validation.'
      ),
    },
  },
  {
    id: 'aurastream',
    track: 2,
    arcanaCode: 'ARCANA // CHARIOT',
    stack: ['Next.js 15/16', 'TypeScript', 'Node.js', 'Puppeteer', 'WebSocket', 'FFmpeg', 'Xvfb', 'Magalu Cloud', 'S3'],
    links: [
      {
        type: 'github',
        url: 'https://github.com/BrunoAndradeDinis/auraStream',
        label: t('REPO DA ENGINE', 'ENGINE REPO'),
        ariaLabel: t(
          'Acessar o repositório da AuraStream Engine no GitHub (abre em nova aba)',
          'Open the AuraStream Engine repository on GitHub (opens in new tab)'
        ),
      },
      {
        type: 'github',
        url: 'https://github.com/BrunoAndradeDinis/painel-stream',
        label: t('REPO DO PAINEL', 'PANEL REPO'),
        ariaLabel: t(
          'Acessar o repositório do Painel-Stream no GitHub (abre em nova aba)',
          'Open the Painel-Stream repository on GitHub (opens in new tab)'
        ),
      },
      {
        type: 'demo',
        url: 'https://painel-stream.vercel.app',
        label: t('DEMO DO PAINEL', 'PANEL DEMO'),
        ariaLabel: t(
          'Abrir a demo do Painel-Stream (abre em nova aba)',
          'Open the Painel-Stream demo (opens in new tab)'
        ),
      },
    ],
    text: {
      reelNumber: t('CASE 04', 'CASE 04'),
      category: t('STREAMING & NUVEM', 'STREAMING & CLOUD'),
      badge: t('TRANSMISSÃO 24/7', '24/7 BROADCAST'),
      title: t('AuraStream Engine & Painel-Stream', 'AuraStream Engine & Painel-Stream'),
      subtitle: t('Projeto autoral • usa o Object Storage da Magalu Cloud', 'Personal project • uses Magalu Cloud Object Storage'),
      status: t('Em produção', 'In production'),
      description: t(
        'Motor de transmissão 24/7 para o YouTube e o painel que gerencia o acervo, rodando numa VM da Magalu Cloud.',
        '24/7 YouTube broadcast engine and the panel that manages its library, running on a Magalu Cloud VM.'
      ),
      challenge: t(
        'Transmitir áudio e vídeo para o YouTube 24/7, sem OBS, numa VM da Magalu Cloud.',
        'Broadcast audio and video to YouTube 24/7, without OBS, on a Magalu Cloud VM.'
      ),
      solution: t(
        'Puppeteer renderiza a cena num display virtual (Xvfb), o FFmpeg captura e envia por RTMP; WebSocket sincroniza estado com o painel, que gerencia o acervo no Object Storage (S3) com login JWT.',
        'Puppeteer renders the scene on a virtual display (Xvfb), FFmpeg captures it and pushes it over RTMP; WebSocket keeps state in sync with the panel, which manages the library on Object Storage (S3) behind a JWT login.'
      ),
      metric: t(
        'Transmissão autônoma 24/7 sem software de transmissão externo.',
        'Autonomous 24/7 broadcast with no external streaming software.'
      ),
    },
  },
];

function localizeCase(definition: CaseDefinition, locale: Locale): ProjectCase {
  const { text } = definition;
  return {
    id: definition.id,
    arcanaCode: definition.arcanaCode,
    track: definition.track,
    stack: [...definition.stack],
    reelNumber: text.reelNumber[locale],
    category: text.category[locale],
    badge: text.badge[locale],
    title: text.title[locale],
    subtitle: text.subtitle[locale],
    status: text.status[locale],
    description: text.description[locale],
    challenge: text.challenge[locale],
    solution: text.solution[locale],
    metric: text.metric[locale],
    links: definition.links.map((link) => ({
      type: link.type,
      url: link.url,
      label: link.label[locale],
      ariaLabel: link.ariaLabel[locale],
    })),
  };
}

export function getLocalizedCases(locale: SupportedLocale): ProjectCase[] {
  return MAIN_CASES.map((definition) => localizeCase(definition, locale));
}
