export type SupportedLocale = 'pt-br' | 'en';

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

export interface SkillCategory {
  id: string;
  arcana: string;
  rank: string;
  title: string;
  subtitle: string;
  variant: 'red' | 'black' | 'white';
  skills: string[];
}

export const PROJECT_CASES_BY_LOCALE: Record<SupportedLocale, ProjectCase[]> = {
  'pt-br': [
    {
      id: 'aurastream',
      reelNumber: 'CASE 01',
      arcanaCode: 'ARCANA // CHARIOT',
      category: 'CLOUD BACKEND & STREAMING',
      badge: '24/7 LIVE ENGINE',
      title: 'AuraStream Engine & Painel-Stream',
      subtitle: 'Flagship Fullstack & Nuvem Magalu Cloud',
      status: 'Em Produção Contínua',
      description:
        'Engine de transmissão e infraestrutura de nuvem resiliente operando pipelines de áudio e vídeo 24/7 de alta disponibilidade.',
      challenge:
        'Manter stream de áudio e vídeo ininterrupto para o YouTube (24/7) de maneira autônoma com baixo consumo de CPU/memória em máquina virtual na Magalu Cloud, gerenciando upload e edição atômica de metadados diretamente em buckets S3 sem banco intermediário.',
      solution:
        'Pipeline headless onde o backend orquestra decodificação de áudio e composição de vídeo em tempo real via Xvfb e FFmpeg, conectado a painel de controle reativo em Next.js 16 com telemetria remota bidirecional.',
      metric:
        'Transmissão autônoma 24/7 sem travamento de buffer e telemetria remota instantânea.',
      stack: [
        'Next.js 16',
        'TypeScript',
        'Node.js',
        'FFmpeg',
        'Xvfb',
        'Magalu Cloud',
        'S3',
      ],
      track: 1,
      links: [
        {
          label: 'ENGINE REPO',
          url: 'https://github.com/BrunoAndradeDinis/auraStream',
          type: 'github',
          ariaLabel:
            'Acessar repositório da AuraStream Engine no GitHub (abre em nova aba)',
        },
        {
          label: 'CONTROL PLANE',
          url: 'https://github.com/BrunoAndradeDinis/painel-stream',
          type: 'github',
          ariaLabel:
            'Acessar repositório do Painel de Controle no GitHub (abre em nova aba)',
        },
      ],
    },
    {
      id: 'quake-log-parser',
      reelNumber: 'CASE 02',
      arcanaCode: 'ARCANA // EMPEROR',
      category: 'CONCURRENCY & TELEMETRY',
      badge: 'HIGH-THROUGHPUT',
      title: 'Quake Log Parser API',
      subtitle: 'Backend Engineering & Parsing Concorrente',
      status: 'Concluído',
      description:
        'Parser assíncrono de logs de partidas em tempo real construído com TypeScript estrito, Docker e suíte completa de testes automatizados.',
      challenge:
        'Processar streams brutos e desestruturados de logs de partidas do Quake 3 Arena com múltiplos eventos concorrentes (InitGame, Kill, ShutdownGame).',
      solution:
        'Algoritmo de parsing resiliente com expressões regulares otimizadas para agregação de estatísticas (ranking de frags por jogador e causas de morte agrupadas por armas), exposto em API RESTful documentada com Swagger.',
      metric:
        '100% de cobertura nos parsers centrais com Jest e isolamento via Docker Compose.',
      stack: [
        'Node.js',
        'TypeScript',
        'Express',
        'MongoDB',
        'Jest',
        'Docker',
        'Swagger',
      ],
      track: 1,
      links: [
        {
          label: 'GITHUB REPO',
          url: 'https://github.com/BrunoAndradeDinis/quake-log-backend-node',
          type: 'github',
          ariaLabel:
            'Acessar repositório da Quake Log Parser API no GitHub (abre em nova aba)',
        },
      ],
    },
    {
      id: 'jokenpo-franky',
      reelNumber: 'CASE 03',
      arcanaCode: 'ARCANA // STRENGTH',
      category: 'GAMIFIED STATE MACHINE',
      badge: 'INTERACTIVE UI',
      title: 'Jokenpo — Arena Franky',
      subtitle: 'Frontend Gamificado & Máquina de Estados',
      status: 'Online',
      description:
        'Arena interativa orientada a eventos com animações táteis fluidas e máquina de estados determinística.',
      challenge:
        'Construir fluxo de jogo responsivo com máquina de estados previsível, placar reativo em tempo real e feedback instantâneo.',
      solution:
        'Gerenciamento de estado declarativo com feedback visual e sonoro imediato em cada rodada sobre arquitetura modular em Next.js 14.',
      metric:
        'Interação instantânea com baixa latência de entrada (INP < 50ms).',
      stack: [
        'Next.js 14',
        'TypeScript',
        'Tailwind CSS',
        'React Hooks',
        'State Machine',
      ],
      track: 2,
      links: [
        {
          label: 'LIVE DEMO',
          url: 'https://jokenpo-three-psi.vercel.app',
          type: 'demo',
          ariaLabel: 'Jogar online na Arena Franky (abre em nova aba)',
        },
        {
          label: 'GITHUB REPO',
          url: 'https://github.com/BrunoAndradeDinis/jokenpo',
          type: 'github',
          ariaLabel:
            'Acessar repositório do Jokenpo no GitHub (abre em nova aba)',
        },
      ],
    },
    {
      id: 'the-warriors',
      reelNumber: 'CASE 04',
      arcanaCode: 'ARCANA // DEATH',
      category: 'EDITORIAL NOIR & AUTOMATION',
      badge: 'BRUTALIST WEB',
      title: 'The Warriors',
      subtitle: 'Design Editorial Cult & Pipeline Gulp',
      status: 'Online',
      description:
        'Design editorial cru de alta fidelidade homenageando o clássico cult, com arquitetura frontend minimalista e pipeline Gulp.',
      challenge:
        'Criar layout temático imersivo de fidelidade cinematográfica sem frameworks pesados, montando pipeline de build customizado.',
      solution:
        'Pipeline Gulp configurado manualmente para compilação SCSS modular, minificação e compressão de ativos sobre HTML5 semântico.',
      metric:
        'Bundle ultra-enxuto com carregamento imediato e zero dependências de runtime.',
      stack: [
        'HTML5 Semântico',
        'SCSS Grid',
        'JavaScript Vanilla',
        'Gulp Pipeline',
      ],
      track: 2,
      links: [
        {
          label: 'LIVE DEMO',
          url: 'https://the-warriors-gamma.vercel.app',
          type: 'demo',
          ariaLabel: 'Visitar demo online de The Warriors (abre em nova aba)',
        },
        {
          label: 'GITHUB REPO',
          url: 'https://github.com/BrunoAndradeDinis/TheWarriors',
          type: 'github',
          ariaLabel:
            'Acessar repositório de The Warriors no GitHub (abre em nova aba)',
        },
      ],
    },
  ],
  en: [
    {
      id: 'aurastream',
      reelNumber: 'CASE 01',
      arcanaCode: 'ARCANA // CHARIOT',
      category: 'CLOUD BACKEND & STREAMING',
      badge: '24/7 LIVE ENGINE',
      title: 'AuraStream Engine & Painel-Stream',
      subtitle: 'Flagship Fullstack & Magalu Cloud Infrastructure',
      status: 'Live in Production',
      description:
        'Resilient cloud broadcast engine orchestrating high-availability 24/7 audio and video streaming pipelines.',
      challenge:
        'Sustain uninterrupted 24/7 YouTube audio/video broadcasting autonomously with minimal CPU/RAM footprint on a Magalu Cloud VM, handling direct S3 uploads and atomic metadata edits without database overhead.',
      solution:
        'Headless pipeline where the backend orchestrates real-time audio decoding and video composition via Xvfb and FFmpeg, paired with a reactive Next.js 16 control plane and bidirectional telemetry.',
      metric:
        'Autonomous 24/7 broadcast with zero buffer stalls and instant remote telemetry.',
      stack: [
        'Next.js 16',
        'TypeScript',
        'Node.js',
        'FFmpeg',
        'Xvfb',
        'Magalu Cloud',
        'S3',
      ],
      track: 1,
      links: [
        {
          label: 'ENGINE REPO',
          url: 'https://github.com/BrunoAndradeDinis/auraStream',
          type: 'github',
          ariaLabel:
            'Open AuraStream Engine repository on GitHub (opens in new tab)',
        },
        {
          label: 'CONTROL PLANE',
          url: 'https://github.com/BrunoAndradeDinis/painel-stream',
          type: 'github',
          ariaLabel:
            'Open Control Plane repository on GitHub (opens in new tab)',
        },
      ],
    },
    {
      id: 'quake-log-parser',
      reelNumber: 'CASE 02',
      arcanaCode: 'ARCANA // EMPEROR',
      category: 'CONCURRENCY & TELEMETRY',
      badge: 'HIGH-THROUGHPUT',
      title: 'Quake Log Parser API',
      subtitle: 'Backend Engineering & Concurrent Parsing',
      status: 'Completed',
      description:
        'Asynchronous match-log parser built with strict TypeScript, Docker isolation, and automated test suites.',
      challenge:
        'Process raw, unstructured Quake 3 Arena server logs containing concurrent match lifecycle events (InitGame, Kill, ShutdownGame).',
      solution:
        'Resilient parsing engine with optimized regular expressions for frag ranking and kill-means aggregation, exposed through a Swagger-documented RESTful API.',
      metric:
        '100% unit test coverage on core parsers with Jest and reproducible Docker Compose environments.',
      stack: [
        'Node.js',
        'TypeScript',
        'Express',
        'MongoDB',
        'Jest',
        'Docker',
        'Swagger',
      ],
      track: 1,
      links: [
        {
          label: 'GITHUB REPO',
          url: 'https://github.com/BrunoAndradeDinis/quake-log-backend-node',
          type: 'github',
          ariaLabel:
            'Open Quake Log Parser API repository on GitHub (opens in new tab)',
        },
      ],
    },
    {
      id: 'jokenpo-franky',
      reelNumber: 'CASE 03',
      arcanaCode: 'ARCANA // STRENGTH',
      category: 'GAMIFIED STATE MACHINE',
      badge: 'INTERACTIVE UI',
      title: 'Jokenpo — Franky Arena',
      subtitle: 'Gamified Frontend & Deterministic State Machine',
      status: 'Online',
      description:
        'Event-driven retro arena featuring tactile animations and a deterministic round state machine.',
      challenge:
        'Design a responsive game loop with predictable state transitions, live score tracking, and immediate audiovisual feedback.',
      solution:
        'Declarative state management with instant visual and sound cues on every turn built on a modular Next.js 14 architecture.',
      metric:
        'Snappy responsiveness with ultra-low input latency (INP < 50ms).',
      stack: [
        'Next.js 14',
        'TypeScript',
        'Tailwind CSS',
        'React Hooks',
        'State Machine',
      ],
      track: 2,
      links: [
        {
          label: 'LIVE DEMO',
          url: 'https://jokenpo-three-psi.vercel.app',
          type: 'demo',
          ariaLabel: 'Play Franky Arena live demo (opens in new tab)',
        },
        {
          label: 'GITHUB REPO',
          url: 'https://github.com/BrunoAndradeDinis/jokenpo',
          type: 'github',
          ariaLabel: 'Open Jokenpo repository on GitHub (opens in new tab)',
        },
      ],
    },
    {
      id: 'the-warriors',
      reelNumber: 'CASE 04',
      arcanaCode: 'ARCANA // DEATH',
      category: 'EDITORIAL NOIR & AUTOMATION',
      badge: 'BRUTALIST WEB',
      title: 'The Warriors',
      subtitle: 'Cult Editorial Design & Gulp Build Pipeline',
      status: 'Online',
      description:
        'High-contrast editorial tribute to the cult classic film, engineered with semantic HTML5 and a custom Gulp automation pipeline.',
      challenge:
        'Deliver a cinematic layout without heavy frontend frameworks while automating asset compilation and minification.',
      solution:
        'Handcrafted Gulp pipeline orchestrating modular SCSS compilation, minification, and image optimization over strict semantic HTML5.',
      metric:
        'Zero-dependency runtime bundle with instant first paint and clean semantic structure.',
      stack: [
        'Semantic HTML5',
        'SCSS Grid',
        'Vanilla JavaScript',
        'Gulp Pipeline',
      ],
      track: 2,
      links: [
        {
          label: 'LIVE DEMO',
          url: 'https://the-warriors-gamma.vercel.app',
          type: 'demo',
          ariaLabel: 'Visit The Warriors live demo (opens in new tab)',
        },
        {
          label: 'GITHUB REPO',
          url: 'https://github.com/BrunoAndradeDinis/TheWarriors',
          type: 'github',
          ariaLabel:
            'Open The Warriors repository on GitHub (opens in new tab)',
        },
      ],
    },
  ],
};

export const SKILL_CATEGORIES_BY_LOCALE: Record<
  SupportedLocale,
  SkillCategory[]
> = {
  'pt-br': [
    {
      id: 'core',
      arcana: 'CONFIDANT 01 // EMPEROR',
      rank: 'RANK MAX',
      title: 'Engenharia Core & Backends',
      subtitle: 'APIs concorrentes de alta vazão e sistemas distribuídos',
      variant: 'red',
      skills: [
        'Go (Golang)',
        'Node.js & TypeScript',
        'Sistemas Concorrentes',
        'REST & GraphQL APIs',
        'Arquitetura Orientada a Eventos',
        'I/O de Alta Performance',
      ],
    },
    {
      id: 'cloud',
      arcana: 'CONFIDANT 02 // CHARIOT',
      rank: 'RANK MAX',
      title: 'Cloud & Media Streaming',
      subtitle: 'Infraestrutura resiliente e pipelines de vídeo 24/7',
      variant: 'black',
      skills: [
        'Magalu Cloud (VM & S3)',
        'Docker & Kubernetes',
        'FFmpeg & Vídeo HLS',
        'Linux & Redes',
        'Automação CI/CD',
        'Cache Distribuído',
      ],
    },
    {
      id: 'creative',
      arcana: 'CONFIDANT 03 // MAGICIAN',
      rank: 'RANK MAX',
      title: 'Creative Technologist',
      subtitle: 'Brutalismo tátil, movimento 60fps e interfaces autorais',
      variant: 'white',
      skills: [
        'Astro 5 & Next.js',
        'GSAP & Lenis Motion',
        'Tailwind CSS v4 & Tokens',
        'Web Audio API Nativa',
        'Three.js & WebGL 2.0',
        'Persona 5 / Bebop Brutalist UI',
      ],
    },
    {
      id: 'quality',
      arcana: 'CONFIDANT 04 // JUSTICE',
      rank: 'RANK MAX',
      title: 'Qualidade & Observabilidade',
      subtitle: 'Verificação automatizada, SOLID e resiliência em produção',
      variant: 'red',
      skills: [
        'Playwright E2E Suites',
        'Testes Unitários & Contratos',
        'Arquitetura Limpa & SOLID',
        'Acessibilidade WCAG AA',
        'Telemetria & Logs',
        'Deploy Zero-Downtime',
      ],
    },
  ],
  en: [
    {
      id: 'core',
      arcana: 'CONFIDANT 01 // EMPEROR',
      rank: 'RANK MAX',
      title: 'Core Engineering & Backends',
      subtitle: 'High-throughput concurrent APIs and distributed systems',
      variant: 'red',
      skills: [
        'Go (Golang)',
        'Node.js & TypeScript',
        'Concurrent Systems',
        'REST & GraphQL APIs',
        'Event-Driven Architecture',
        'High-Throughput I/O',
      ],
    },
    {
      id: 'cloud',
      arcana: 'CONFIDANT 02 // CHARIOT',
      rank: 'RANK MAX',
      title: 'Cloud & Media Streaming',
      subtitle: 'Resilient cloud infrastructure and 24/7 video pipelines',
      variant: 'black',
      skills: [
        'Magalu Cloud (VM & S3)',
        'Docker & Kubernetes',
        'FFmpeg & HLS Video',
        'Linux & Networking',
        'CI/CD Automation',
        'Distributed Caching',
      ],
    },
    {
      id: 'creative',
      arcana: 'CONFIDANT 03 // MAGICIAN',
      rank: 'RANK MAX',
      title: 'Creative Technologist',
      subtitle: 'Tactile brutalism, 60fps motion, and expressive interfaces',
      variant: 'white',
      skills: [
        'Astro 5 & Next.js',
        'GSAP & Lenis Motion',
        'Tailwind CSS v4 & Tokens',
        'Native Web Audio API',
        'Three.js & WebGL 2.0',
        'Persona 5 / Bebop Brutalist UI',
      ],
    },
    {
      id: 'quality',
      arcana: 'CONFIDANT 04 // JUSTICE',
      rank: 'RANK MAX',
      title: 'Quality & Observability',
      subtitle: 'Automated verification, SOLID architecture, and production resiliency',
      variant: 'red',
      skills: [
        'Playwright E2E Suites',
        'Unit & Contract Testing',
        'Clean Architecture & SOLID',
        'WCAG AA Accessibility',
        'Telemetry & Structured Logs',
        'Zero-Downtime Deploy',
      ],
    },
  ],
};

export const PROJECT_CASES: ProjectCase[] = PROJECT_CASES_BY_LOCALE['pt-br'];

export function getLocalizedCases(locale: SupportedLocale): ProjectCase[] {
  return PROJECT_CASES_BY_LOCALE[locale] ?? PROJECT_CASES_BY_LOCALE['pt-br'];
}

export function getLocalizedSkillCategories(
  locale: SupportedLocale
): SkillCategory[] {
  return (
    SKILL_CATEGORIES_BY_LOCALE[locale] ?? SKILL_CATEGORIES_BY_LOCALE['pt-br']
  );
}
