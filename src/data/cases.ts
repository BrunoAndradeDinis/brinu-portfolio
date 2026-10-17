/**
 * cases.ts
 * Especificação de dados tipados dos 4 Projetos Autorais de Bruno Dinis.
 * Fonte canônica: _bmad-output/spec-brinu-portfolio/cases.md.
 */

export interface ProjectLink {
  label: string;
  url: string;
  type: 'github' | 'demo' | 'external';
  ariaLabel: string;
}

export interface ProjectCase {
  id: string;
  reelNumber: string;
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
  borderColor: 'bebop-red' | 'acid-green';
  shadowColor: string;
  links: ProjectLink[];
}

export const PROJECT_CASES: ProjectCase[] = [
  {
    id: 'aurastream',
    reelNumber: 'REEL 01',
    category: 'CLOUD BACKEND & STREAMING',
    badge: 'DISTRIBUTED',
    title: 'AuraStream Engine & Painel-Stream',
    subtitle: 'Flagship Fullstack & Nuvem Magalu Cloud',
    status: 'Concluído / Em evolução contínua',
    description:
      'Engine de transmissão e infraestrutura de nuvem resiliente operando pipelines de áudio e vídeo 24/7 de alta disponibilidade.',
    challenge:
      'Manter stream de áudio e vídeo ininterrupto para o YouTube (24/7) de maneira autônoma com baixo consumo de CPU/memória em máquina virtual na Magalu Cloud, gerenciando upload e edição atômica de metadados diretamente em buckets S3 sem sobrecarga de banco intermediário.',
    solution:
      'Pipeline headless onde o backend orquestra decodificação de áudio e composição de vídeo em tempo real via Xvfb e FFmpeg, conectado a painel de controle reativo em Next.js 16 com telemetria remota bidirecional.',
    metric: 'Transmissão autônoma 24/7 sem travamento de buffer e telemetria remota instantânea.',
    stack: ['Next.js 16', 'TypeScript', 'Node.js', 'FFmpeg', 'Xvfb', 'Magalu Cloud', 'S3'],
    track: 1,
    borderColor: 'bebop-red',
    shadowColor: 'rgba(254,0,0,0.4)',
    links: [
      {
        label: 'ENGINE REPO ↗',
        url: 'https://github.com/BrunoAndradeDinis/auraStream',
        type: 'github',
        ariaLabel: 'Acessar repositório da AuraStream Engine no GitHub (abre em nova aba)',
      },
      {
        label: 'CONTROL PLANE ↗',
        url: 'https://github.com/BrunoAndradeDinis/painel-stream',
        type: 'github',
        ariaLabel: 'Acessar repositório do Painel de Controle no GitHub (abre em nova aba)',
      },
    ],
  },
  {
    id: 'quake-log-parser',
    reelNumber: 'REEL 02',
    category: 'CONCURRENCY & TELEMETRY',
    badge: 'PARSER',
    title: 'Quake Log Parser API',
    subtitle: 'Backend Engineering & Parsing Concorrente',
    status: 'Concluído',
    description:
      'Parser assíncrono de logs de partidas em tempo real construído com TypeScript puro, Docker e testes automatizados.',
    challenge:
      'Processar streams brutos e desestruturados de logs de partidas do Quake 3 Arena com múltiplos eventos concorrentes (InitGame, Kill, ShutdownGame).',
    solution:
      'Algoritmo de parsing resiliente com expressões regulares otimizadas para agregação de estatísticas (ranking de frags por jogador e causas de morte agrupadas por armas), exposto em API RESTful documentada com Swagger.',
    metric: '100% de cobertura nos parsers centrais com Jest e isolamento de dependências via Docker Compose.',
    stack: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'Jest', 'Docker', 'Swagger'],
    track: 1,
    borderColor: 'bebop-red',
    shadowColor: 'rgba(254,0,0,0.4)',
    links: [
      {
        label: 'GITHUB REPO ↗',
        url: 'https://github.com/BrunoAndradeDinis/quake-log-backend-node',
        type: 'github',
        ariaLabel: 'Acessar repositório da Quake Log Parser API no GitHub (abre em nova aba)',
      },
    ],
  },
  {
    id: 'jokenpo-franky',
    reelNumber: 'REEL 03',
    category: 'FRONTEND GAMIFIED & STATE FLOW',
    badge: 'GAMIFIED',
    title: 'Jokenpo - Arena Franky',
    subtitle: 'Frontend Gamificado & Máquina de Estados',
    status: 'Concluído / Online',
    description:
      'Arena retrô com lógica orientada a eventos, animações táteis a 60 FPS e experiência imersiva de jogo inspirada em One Piece.',
    challenge:
      'Construir fluxo de jogo responsivo e intuitivo com lógica de máquina de estados simples e placar reativo em tempo real com temática One Piece.',
    solution:
      'Gerenciamento de estado declarativo com feedback visual e sonoro imediato em cada rodada com arquitetura modular em Next.js 14.',
    metric: 'Aplicação com alta retenção de uso e resposta imediata (INP < 50ms a 60 FPS).',
    stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS', 'React Hooks', 'State Machine'],
    track: 2,
    borderColor: 'acid-green',
    shadowColor: 'rgba(46,254,12,0.3)',
    links: [
      {
        label: 'LIVE DEMO ↗',
        url: 'https://jokenpo-three-psi.vercel.app',
        type: 'demo',
        ariaLabel: 'Jogar online na Arena Franky (abre em nova aba)',
      },
      {
        label: 'GITHUB REPO ↗',
        url: 'https://github.com/BrunoAndradeDinis/jokenpo',
        type: 'github',
        ariaLabel: 'Acessar repositório do Jokenpo no GitHub (abre em nova aba)',
      },
    ],
  },
  {
    id: 'the-warriors',
    reelNumber: 'REEL 04',
    category: 'EDITORIAL NOIR & AUTOMATION',
    badge: 'NOIR DESIGN',
    title: 'The Warriors',
    subtitle: 'Design Editorial Cult & Pipeline Gulp',
    status: 'Concluído / Online',
    description:
      'Design editorial cru de alta fidelidade homenageando o clássico cult, com arquitetura frontend minimalista e pipeline Gulp.',
    challenge:
      'Criar layout temático imersivo de fidelidade cinematográfica sem frameworks utilitários pesados, montando pipeline de automação customizado.',
    solution:
      'Pipeline Gulp completo configurado manualmente para compilação SCSS avançada, minificação e compressão de imagens em semântica HTML5 estrita.',
    metric: 'Domínio profundo dos fundamentos da web moderna e otimização artesanal de bundle.',
    stack: ['HTML5 Semântico', 'SCSS Grid', 'JavaScript Vanilla', 'Gulp Pipeline'],
    track: 2,
    borderColor: 'acid-green',
    shadowColor: 'rgba(46,254,12,0.3)',
    links: [
      {
        label: 'LIVE DEMO ↗',
        url: 'https://the-warriors-gamma.vercel.app',
        type: 'demo',
        ariaLabel: 'Visitar demo online de The Warriors (abre em nova aba)',
      },
      {
        label: 'GITHUB REPO ↗',
        url: 'https://github.com/BrunoAndradeDinis/TheWarriors',
        type: 'github',
        ariaLabel: 'Acessar repositório de The Warriors no GitHub (abre em nova aba)',
      },
    ],
  },
];
