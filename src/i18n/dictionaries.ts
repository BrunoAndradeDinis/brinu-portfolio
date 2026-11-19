import { PROFILE } from '../data/profile.ts';
import type { BudgetId, DeadlineId, ServiceId } from '../data/contact-brief.ts';
import type { ContactErrorCode } from '../utils/contact-brief.ts';

export type Locale = 'pt-br' | 'en';

export interface TranslationSchema {
  a11y: {
    skipToContent: string;
    preloaderAria: string;
    mainNavAria: string;
    heroPortraitAlt: string;
  };
  meta: {
    title: string;
    description: string;
    whoamiTitle: string;
    whoamiDescription: string;
    stickersTitle: string;
    stickersDescription: string;
  };
  preloader: {
    sceneTag: string;
    skipPrompt: string;
  };
  nav: {
    topAria: string;
    worksCta: string;
    worksCtaShort: string;
    worksAria: string;
    menuTriggerAria: string;
    langToggleAria: string;
  };
  menu: {
    dialogAria: string;
    headerTag: string;
    title: string;
    closeLabel: string;
    navItems: {
      hero: string;
      works: string;
      about: string;
      contact: string;
      whoami: string;
    };
    languageLabel: string;
    downloadCvLabel: string;
    audioOn: string;
    audioMuted: string;
    casesCta: string;
    socialsAria: string;
    linkedinAria: string;
    githubAria: string;
    escHint: string;
  };
  hero: {
    ticker: string;
    avatarAria: string;
    bubbleDefault: string;
    stamp: string;
    phrases: readonly [string, string, string, string, string];
    manifestoLeftLine1: string;
    manifestoLeftLine2: string;
    manifestoLeftLine3: string;
    craftCta: string;
    craftAria: string;
    manifestoRightLine1: string;
    manifestoRightLine2: string;
    manifestoRightLine3: string;
    socialAria: string;
  };
  filmstrip: {
    sectionAria: string;
    tag: string;
    heading: string;
    passionTag: string;
    slides: {
      s1Title: string;
      s2Title: string;
      s3Title: string;
      s4Title: string;
      s5Title: string;
      s6Title: string;
      s1Reel: string;
      s2Reel: string;
      s3Reel: string;
      s4Reel: string;
      s5Reel: string;
      s6Reel: string;
      s1Alt: string;
      s2Alt: string;
      s3Alt: string;
      s4Alt: string;
      s5Alt: string;
      s6Alt: string;
    };
    passionSlides: {
      p1Reel: string;
      p1Title: string;
      p1Alt: string;
      p2Reel: string;
      p2Title: string;
      p2Alt: string;
      p3Reel: string;
      p3Title: string;
      p3Alt: string;
      p4Reel: string;
      p4Title: string;
      p4Alt: string;
      p5Reel: string;
      p5Title: string;
      p5Alt: string;
      p6Reel: string;
      p6Title: string;
      p6Alt: string;
      p1Headline: string;
      p1Credits: string;
      p1Highlight: string;
      p1CardTitle: string;
      p1CardSub: string;
      p2Headline: string;
      p2Credits: string;
      p2Highlight: string;
      p2CardTitle: string;
      p2CardSub: string;
      p3Headline: string;
      p3Credits: string;
      p3Highlight: string;
      p3CardTitle: string;
      p3CardSub: string;
      p4Headline: string;
      p4Credits: string;
      p4Highlight: string;
      p4CardTitle: string;
      p4CardSub: string;
      p5Headline: string;
      p5Credits: string;
      p5Highlight: string;
      p5CardTitle: string;
      p5CardSub: string;
      p6Headline: string;
      p6Credits: string;
      p6Highlight: string;
      p6CardTitle: string;
      p6CardSub: string;
    };
    motto: {
      part1: string;
      highlight1: string;
      part2: string;
      highlight2: string;
      part3: string;
      highlight3: string;
    };
  };
  works: {
    sectionAria: string;
    jumpCutBadge: string;
    jumpCutSub: string;
    sessionTag: string;
    actTag: string;
    title: string;
    countLabel: string;
    domainLabel: string;
    challengeLabel: string;
    solutionLabel: string;
    metricLabel: string;
    archiveTag: string;
    archiveTitle: string;
    openCase: string;
  };
  notFound: {
    actTag: string;
    title: string;
    hint: string;
    back: string;
    seeYouLead: string;
    seeYouAccent: string;
    seeYouTail: string;
  };
  showcase: {
    caseLabel: string;
    prevAria: string;
    nextAria: string;
    controlsAria: string;
    play: string;
    pause: string;
    tilesAria: string;
    stackAria: string;
    stageAria: string;
    fullscreenOpenAria: string;
    hintDoubleClick: string;
    hintRotate: string;
    hintTitle: string;
    fullscreenPrev: string;
    fullscreenNext: string;
    fullscreenHint: string;
  };
  casePage: {
    sectionAria: string;
    actTag: string;
    backToWorks: string;
    nextCase: string;
    titleSuffix: string;
  };
  about: {
    sectionAria: string;
    actTag: string;
    title: string;
    statusBadge: string;
    domainLine: string;
    operatorTag: string;
    bioLine1: string;
    bioLine2: string;
    baseLine: string;
    rankLabel: string;
    currentMarker: string;
    portraitAlt: string;
    portraitReplayHint: string;
    careerTitle: string;
    educationTitle: string;
    automationsLabel: string;
    tabInfo: string;
    tabDetails: string;
    tabLearned: string;
    hardSkillsLabel: string;
    softSkillsLabel: string;
    skillsTag: string;
    skillsTitle: string;
  };
  hobbies: {
    title: string;
    listAria: string;
  };
  panel: {
    closeLabel: string;
  };
  stickers: {
    sectionAria: string;
    actTag: string;
    title: string;
    hint: string;
    downloadLabel: string;
    downloadAria: string;
  };
  contact: {
    sectionAria: string;
    actTag: string;
    title: string;
    availableBadge: string;
    leadText: string;
    subText: string;
    directEmailLabel: string;
    codeBaseLabel: string;
    careerLogLabel: string;
    stationBaseLabel: string;
    stationBaseValue: string;
  };
  jokenpo: {
    kicker: string;
    playerAlt: string;
    cpuAlt: string;
    prompt: string;
    pedra: string;
    papel: string;
    tesoura: string;
    win: string;
    lose: string;
    draw: string;
    winLine: string;
    loseLine: string;
    drawLine: string;
    scoreTitle: string;
    winsLabel: string;
    drawsLabel: string;
    lossesLabel: string;
    reset: string;
  };
  dispatch: {
    headerTitle: string;
    headerSub: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    companyLabel: string;
    companyPlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    servicesLegend: string;
    budgetLegend: string;
    deadlineLegend: string;
    optionalTag: string;
    services: Readonly<Record<ServiceId, string>>;
    budgets: Readonly<Record<BudgetId, string>>;
    deadlines: Readonly<Record<DeadlineId, string>>;
    errors: Readonly<Record<ContactErrorCode, string>>;
    mailSubjectPrefix: string;
    mail: Readonly<Record<'name' | 'company' | 'email' | 'phone' | 'services' | 'budget' | 'deadline' | 'message', string>>;
    companyKey: string;
    phoneKey: string;
    servicesKey: string;
    budgetKey: string;
    deadlineKey: string;
    missingPrefix: string;
    sendingCta: string;
    honeypotLabel: string;
    fallbackLead: string;
    toastSuccessTitle: string;
    toastSuccessBody: string;
    toastErrorTitle: string;
    toastErrorBody: string;
    toastRateLimitedTitle: string;
    toastRateLimitedBody: string;
    submitCta: string;
    receiptSuccess: string;
    codenameKey: string;
    frequencyKey: string;
    statusKey: string;
    statusValue: string;
    timestampKey: string;
    sendEmailCopy: string;
    newTransmission: string;
  };
  footer: {
    sectionAria: string;
    ticker: string;
    backToTop: string;
    backToTopAria: string;
    copyright: string;
    engineeredIn: string;
    stackLine: string;
    privacyLine: string;
  };
  cilada: {
    dialogAria: string;
    tag: string;
    title: string;
    body: string;
    quote: string;
    timerLabel: string;
    dismissCta: string;
  };
  receipt: {
    header: string;
    title: string;
    operator: string;
    status: string;
    base: string;
    email: string;
    linkedin: string;
    item: string;
    description: string;
    value: string;
    total: string;
    commands: string;
    terminal: string;
  };
  whoami: {
    skipCta: string;
    onlineBadge: string;
    footerHint: string;
    returnHomeCta: string;
    promptLabel: string;
    inputPlaceholder: string;
    helpHeader: string;
    usage: string;
    notFound: string;
    noFile: string;
    hobbiesHint: string;
    hobbyOptions: string;
    downloaded: string;
    langSet: string;
    contactOut: string;
    ciladaOut: string;
    exitOut: string;
    options: string;
    commands: {
      help: string;
      clear: string;
      whoami: string;
      career: string;
      education: string;
      skills: string;
      hobbies: string;
      projects: string;
      ls: string;
      cat: string;
      download: string;
      lang: string;
      contact: string;
      status: string;
      cilada: string;
      exit: string;
    };
    resume: {
      summary: string;
      skills: string;
      experience: string;
      projects: string;
      education: string;
    };
  };
}

export const ptBrDict: TranslationSchema = {
  a11y: {
    skipToContent: 'PULAR PARA O CONTEÚDO PRINCIPAL',
    preloaderAria: 'Abertura do portfólio',
    mainNavAria: 'Navegação principal',
    heroPortraitAlt: 'Retrato estilo HQ noir de Bruno Dinis',
  },
  meta: {
    title: 'Bruno Dinis // Brinu — Desenvolvedor Frontend & Full Stack | Sistemas Web Sob Medida',
    description:
      'Portfólio e serviços de Bruno de Andrade Dinis (Brinu), Desenvolvedor Frontend & Full Stack na Magalu Cloud. Desenvolvimento de sistemas web, painéis, APIs e sites de alta performance com Astro, React, Next.js, Node.js, TypeScript e PostgreSQL em Franca / SP.',
    whoamiTitle: 'Bruno Dinis // Brinu — Terminal Confidant /whoami',
    whoamiDescription:
      'Terminal interativo de Bruno Dinis (Brinu): arquitetura full stack, stack e projetos em produção.',
    stickersTitle: 'Stickers do Brinu // Bruno Dinis',
    stickersDescription: 'Stickers originais do Brinu em SVG, para baixar e usar.',
  },
  preloader: {
    sceneTag: '[ 1996 // ATO 01 ]',
    skipPrompt: 'CLIQUE OU PRESSIONE QUALQUER TECLA PARA AVANÇAR',
  },
  nav: {
    topAria: 'Ir para o topo da página — Bruno Dinis (Brinu)',
    worksCta: 'PROJETOS',
    worksCtaShort: 'CASES',
    worksAria: 'Ir para a seção de projetos selecionados',
    menuTriggerAria: 'Abrir Menu Principal Persona',
    langToggleAria: 'Alternar idioma entre Português e Inglês',
  },
  menu: {
    dialogAria: 'Menu de Comando Principal',
    headerTag: '// PHANTOM COCKPIT • MENU DE COMANDO',
    title: 'TAKE YOUR TIME',
    closeLabel: 'FECHAR [ESC]',
    navItems: {
      hero: 'INÍCIO & SERVIÇOS',
      works: 'PROJETOS',
      about: 'TRAJETÓRIA',
      contact: 'ORÇAMENTO',
      whoami: 'TERMINAL',
    },
    languageLabel: 'IDIOMA DA INTERFACE',
    downloadCvLabel: '↓ BAIXAR CURRÍCULO',
    audioOn: 'ÁUDIO: ATIVO',
    audioMuted: 'ÁUDIO: MUDO',
    casesCta: 'CASES →',
    socialsAria: 'Redes de Bruno Dinis',
    linkedinAria: 'Abrir o LinkedIn de Bruno Dinis (abre em nova aba)',
    githubAria: 'Abrir o GitHub de Bruno Dinis (abre em nova aba)',
    escHint: 'PRESSIONE [ESC] OU SELECIONE UM DESTINO',
  },
  hero: {
    ticker:
      '• DESENVOLVEDOR FRONTEND & FULL STACK • SISTEMAS WEB SOB MEDIDA • MAGALU CLOUD • REACT, NEXT.JS, ASTRO & NODE.JS • FRANCA / SP • REMOTO •',
    avatarAria:
      'Avatar oficial de Bruno Dinis em moldura brutalista. Clique para interagir.',
    bubbleDefault: PROFILE.family['pt-br'],
    stamp: PROFILE.stampLabel['pt-br'],
    phrases: [
      PROFILE.family['pt-br'],
      'Do banco de dados à interface em produção',
      PROFILE.role['pt-br'],
      'Base: Franca / SP • Remoto',
      'React, Next.js, Astro, Node.js & PostgreSQL',
    ],
    manifestoLeftLine1: 'DO BANCO DE DADOS',
    manifestoLeftLine2: 'À INTERFACE',
    manifestoLeftLine3: 'EM PRODUÇÃO',
    craftCta: 'VER PROJETOS E SERVIÇOS',
    craftAria: 'Explorar projetos e serviços de desenvolvimento web full stack',
    manifestoRightLine1: 'SISTEMAS WEB',
    manifestoRightLine2: 'ESCALÁVEIS E',
    manifestoRightLine3: 'SOB MEDIDA',
    socialAria: 'Canais Oficiais de Contato e Perfis Sociais',
  },
  filmstrip: {
    sectionAria: 'Esteira de Projetos & Soluções Full Stack',
    tag: '// REEL PARALLAX :: PROJETOS REAIS EM PRODUÇÃO 2.5°',
    heading: 'CADA FRAME, UM PROJETO ENTREGUE',
    passionTag: '// REEL PARALLAX 02 :: SERVIÇOS & SOLUÇÕES FULL STACK -2.5°',
    slides: {
      s1Title: 'AuraStream Engine — Transmissão 24/7',
      s2Title: 'Quake III Log Parser API',
      s3Title: 'Jokenpo — Arena Franky',
      s4Title: 'The Warriors — Landing Page',
      s5Title: 'Magalu Cloud — Site Institucional',
      s6Title: 'Sistemas Web, APIs & Automação',
      s1Reel: 'FRAME 01 // AURASTREAM',
      s2Reel: 'FRAME 02 // QUAKE LOG API',
      s3Reel: 'FRAME 03 // ARENA FRANKY',
      s4Reel: 'FRAME 04 // THE WARRIORS',
      s5Reel: 'FRAME 05 // MAGALU CLOUD',
      s6Reel: 'FRAME 06 // ARQUITETURA FULL STACK',
      s1Alt: 'Frame 01: AuraStream Engine, transmissão 24/7 com FFmpeg e Xvfb',
      s2Alt: 'Frame 02: Quake Log Parser API com Jest e Docker Compose',
      s3Alt: 'Frame 03: Jokenpo, Arena Franky',
      s4Alt: 'Frame 04: The Warriors, landing page com pipeline Gulp',
      s5Alt: 'Frame 05: site institucional da Magalu Cloud',
      s6Alt: 'Frame 06: Desenvolvimento Full Stack de sistemas web, APIs e automações',
    },
    passionSlides: {
      p1Reel: 'SERVIÇO 01 // APLICAÇÕES WEB & SAAS',
      p1Title: 'Next.js, React & TypeScript // Produto Completo',
      p1Alt: 'Serviço Full Stack 01: Desenvolvimento de aplicações web e plataformas SaaS',
      p2Reel: 'SERVIÇO 02 // SITES DE ALTA PERFORMANCE',
      p2Title: 'Astro, Tailwind CSS & SEO Técnico',
      p2Alt: 'Serviço Full Stack 02: Sites institucionais e landing pages rápidas com Astro',
      p3Reel: 'SERVIÇO 03 // DASHBOARDS & GESTÃO',
      p3Title: 'PostgreSQL, Prisma & Indicadores em Tempo Real',
      p3Alt: 'Serviço Full Stack 03: Painéis administrativos, PDV e gestão de estoque',
      p4Reel: 'SERVIÇO 04 // APIS & AUTOMAÇÃO',
      p4Title: 'Node.js, WebSockets, Extensões & Scripts',
      p4Alt: 'Serviço Full Stack 04: APIs REST, WebSockets e automação de processos',
      p5Reel: 'SERVIÇO 05 // CLOUD & INFRAESTRUTURA',
      p5Title: 'Magalu Cloud, Object Storage S3 & Docker',
      p5Alt: 'Serviço Full Stack 05: Deploy em nuvem, containers Docker e Object Storage',
      p6Reel: 'SERVIÇO 06 // ARQUITETURA & TESTES',
      p6Title: 'SOLID, Testes Automatizados Jest & Playwright',
      p6Alt: 'Serviço Full Stack 06: Arquitetura limpa SOLID e testes automatizados',
      p1Headline: 'SISTEMAS WEB',
      p1Credits: 'NEXT.JS • REACT • TYPESCRIPT',
      p1Highlight: 'DO PROTÓTIPO AO PRODUTO EM PRODUÇÃO',
      p1CardTitle: 'PONTA A PONTA',
      p1CardSub: '// FULL STACK',
      p2Headline: 'ALTA PERFORMANCE',
      p2Credits: 'ASTRO • TAILWIND CSS • SEO TÉCNICO',
      p2Highlight: 'CARREGAMENTO RÁPIDO, ACESSIBILIDADE & CONVERSÃO',
      p2CardTitle: 'VELOCIDADE REAL',
      p2CardSub: '// FRONTEND',
      p3Headline: 'PAINÉIS & DADOS',
      p3Credits: 'POSTGRESQL • PRISMA • ZOD',
      p3Highlight: 'TRANSAÇÕES SEGURAS & CONTROLE OPERACIONAL',
      p3CardTitle: 'DADOS CONSISTENTES',
      p3CardSub: '// BACKEND & DB',
      p4Headline: 'APIS & AUTOMAÇÃO',
      p4Credits: 'NODE.JS • EXPRESS • WEBSOCKETS',
      p4Highlight: 'INTEGRAÇÃO DE SISTEMAS & REDUÇÃO DE TRABALHO MANUAL',
      p4CardTitle: 'FLUXO CONTÍNUO',
      p4CardSub: '// INTEGRAÇÕES',
      p5Headline: 'DEPLOY & NUVEM',
      p5Credits: 'DOCKER • MAGALU CLOUD • OBJECT STORAGE',
      p5Highlight: 'AMBIENTES REPRODUTÍVEIS & SERVIÇOS 24/7',
      p5CardTitle: 'PRODUÇÃO ESTÁVEL',
      p5CardSub: '// CLOUD & DOCKER',
      p6Headline: 'CÓDIGO CONFIÁVEL',
      p6Credits: 'SOLID • JEST • PLAYWRIGHT',
      p6Highlight: 'SOFTWARE FÁCIL DE MANTER E EVOLUIR',
      p6CardTitle: 'RIGOR TÉCNICO',
      p6CardSub: '// QUALIDADE',
    },
    motto: {
      part1: 'TRANSFORMO REGRAS DE',
      highlight1: 'NEGÓCIO',
      part2: 'EM',
      highlight2: 'SISTEMAS WEB',
      part3: 'RÁPIDOS, SEGUROS E EM',
      highlight3: 'PRODUÇÃO.',
    },
  },
  works: {
    sectionAria: 'Arquivo de Projetos Autorais de Bruno Dinis',
    jumpCutBadge: "3, 2, 1 LET'S JAM",
    jumpCutSub: '// CORTE 02 :: ARQUIVO DE PROJETOS SELECIONADOS',
    sessionTag: '[ SESSÃO #01 ]',
    actTag: '[ ATO I // SELECTED WORKS :: PROJETOS EM DESTAQUE ]',
    title: 'ARQUIVO DE PROJETOS',
    countLabel: 'PROJETOS SELECIONADOS // 4 CASES',
    domainLabel: 'FRONTEND EM PRODUÇÃO :: FULLSTACK TYPESCRIPT :: CREATIVE DEV',
    challengeLabel: '// DESAFIO TÉCNICO',
    solutionLabel: ':: SOLUÇÃO ARQUITETURAL',
    metricLabel: '[ ENTREGA ]',
    archiveTag: '// ARQUIVO • PROJETOS MENORES E ESTUDOS',
    archiveTitle: 'ARQUIVO',
    openCase: 'ABRIR CASE',
  },
  notFound: {
    actTag: '[ ERRO 404 // SINAL PERDIDO ]',
    title: 'PÁGINA NÃO ENCONTRADA',
    hint: 'Este endereço não existe neste portfólio.',
    back: '← VOLTAR AO INÍCIO',
    seeYouLead: 'SEE YOU',
    seeYouAccent: 'GITHUB',
    seeYouTail: 'COWBOY',
  },
  showcase: {
    caseLabel: 'CASE',
    prevAria: 'Case anterior',
    nextAria: 'Próximo case',
    controlsAria: 'Navegação entre cases',
    play: 'PLAY',
    pause: 'PAUSE',
    tilesAria: 'Todos os cases',
    stackAria: 'Tecnologias do case',
    stageAria: 'Mídia do case',
    fullscreenOpenAria: 'Clique duas vezes no vídeo ou pressione F para assistir em tela cheia',
    hintDoubleClick: 'CLIQUE 2X',
    hintRotate: 'VIRE A TELA',
    hintTitle: 'Clique 2x para ampliar',
    fullscreenPrev: 'Vídeo anterior',
    fullscreenNext: 'Próximo vídeo',
    fullscreenHint: 'USE ← → OU DESLIZE PARA NAVEGAR • ESC PARA FECHAR',
  },
  casePage: {
    sectionAria: 'Página do case',
    actTag: '[ CASE FILE // PÁGINA DO PROJETO ]',
    backToWorks: '← VOLTAR AOS PROJETOS',
    nextCase: 'PRÓXIMO CASE →',
    titleSuffix: 'Bruno Dinis // Brinu',
  },
  about: {
    sectionAria: 'Dossiê Confidant do Operador: Bruno Dinis',
    actTag: '[ ATO II // DOSSIÊ CONFIDANT • REGISTRO 1996 ]',
    title: 'DOSSIÊ: BRINU',
    statusBadge: 'STATUS: ATIVO // EM PRODUÇÃO',
    domainLine: PROFILE.tagline['pt-br'].toUpperCase(),
    operatorTag: 'OPERADOR: BRINU',
    bioLine1: 'Desenvolvedor de sistemas web full stack com TypeScript, Node.js e PostgreSQL.',
    bioLine2: 'Em 8 anos no ecossistema Magalu, evoluí do suporte técnico para a engenharia criando extensões, APIs, dashboards e automações reais.',
    baseLine: 'Franca / SP · Remoto · Projetos Full Stack & Consultoria',
    rankLabel: 'RANK',
    currentMarker: 'ATUAL',
    portraitAlt: 'Retrato ilustrado de Bruno Dinis',
    portraitReplayHint: 'Clique duas vezes, ou aperte Enter, para montar o cubo de novo',
    careerTitle: 'TRAJETÓRIA',
    educationTitle: 'FORMAÇÃO',
    automationsLabel: 'AUTOMAÇÕES',
    tabInfo: 'INFO',
    tabDetails: 'FUNÇÕES',
    tabLearned: 'APRENDIZADOS',
    hardSkillsLabel: 'HARD SKILLS',
    softSkillsLabel: 'SOFT SKILLS',
    skillsTag: '// MATRIZ DE HABILIDADES • CONFIDANT RANKS',
    skillsTitle: 'ARSENAL TÉCNICO',
  },
  hobbies: {
    title: 'HOBBIES',
    listAria: 'Hobbies',
  },
  panel: {
    closeLabel: 'Fechar',
  },
  stickers: {
    sectionAria: 'Biblioteca de stickers do Brinu',
    actTag: '[ EXTRA // STICKERS • ARQUIVOS SVG ]',
    title: 'STICKERS',
    hint: 'CLIQUE NUM STICKER PARA BAIXAR O SVG',
    downloadLabel: 'BAIXAR SVG',
    downloadAria: 'Baixar o sticker:',
  },
  contact: {
    sectionAria: 'Contato e Envio de Propostas — Bounty Board',
    actTag: '[ ATO III // BOUNTY BOARD • TRANSMISSÃO DIRETA ]',
    title: 'VAMOS CONVERSAR',
    availableBadge: 'DISPONÍVEL PARA PROJETOS FULL STACK & NOVOS SISTEMAS',
    leadText:
      'Precisa tirar um sistema web do papel, criar um painel de gestão ou lançar um site de alta performance? Vamos conversar.',
    subText:
      'Desenvolvimento Web Full Stack ponta a ponta — da modelagem de dados e APIs em Node.js/TypeScript até interfaces rápidas em React, Next.js e Astro, de Franca / SP para todo o mundo.',
    directEmailLabel: 'E-MAIL DIRETO //',
    codeBaseLabel: 'CÓDIGO FONTE //',
    careerLogLabel: 'TRAJETÓRIA //',
    stationBaseLabel: 'BASE DE OPERAÇÃO //',
    stationBaseValue: PROFILE.location.remoteLabel['pt-br'],
  },
  jokenpo: {
    kicker: 'MINIGAME // JOKENPÔ',
    playerAlt: 'Você — Chapéus de Palha',
    cpuAlt: 'Computador — Franky',
    prompt: 'Faça sua próxima jogada:',
    pedra: 'PEDRA',
    papel: 'PAPEL',
    tesoura: 'TESOURA',
    win: 'VITÓRIA',
    lose: 'DERROTA',
    draw: 'EMPATE',
    winLine: 'Você ganhou!',
    loseLine: 'Você perdeu!',
    drawLine: 'Empate!',
    scoreTitle: 'Placar do jogo',
    winsLabel: 'Vitórias',
    drawsLabel: 'Empates',
    lossesLabel: 'Derrotas',
    reset: 'Reiniciar jogo',
  },
  dispatch: {
    headerTitle: '// SOLICITAR ORÇAMENTO OU PROPOSTA TÉCNICA',
    headerSub: 'CANAL DIRETO VERIFICADO',
    nameLabel: '01 // SEU NOME',
    namePlaceholder: 'Ex: Ana Souza',
    companyLabel: '02 // EMPRESA',
    companyPlaceholder: 'Ex: Acme Tecnologia',
    emailLabel: '03 // SEU E-MAIL DE RETORNO',
    emailPlaceholder: 'Ex: contato@empresa.com',
    phoneLabel: '04 // WHATSAPP',
    phonePlaceholder: '(16) 99999-9999',
    servicesLegend: '05 // QUAL SERVIÇO VOCÊ PROCURA?',
    budgetLegend: '06 // QUAL O ORÇAMENTO DISPONÍVEL?',
    deadlineLegend: '07 // QUAL O PRAZO DESEJADO?',
    messageLabel: '08 // DETALHES DO PROJETO',
    messagePlaceholder: 'Conte sobre o sistema web, painel, site ou integração, objetivos e prazo estimado...',
    optionalTag: '(OPCIONAL)',
    services: {
      'web-system': 'Sistema web / painel',
      site: 'Site / landing page',
      integration: 'Integração / API / manutenção',
      job: 'Oportunidade de vaga',
    },
    budgets: {
      'up-to-3k': 'Até R$ 3.000',
      '3k-8k': 'R$ 3.000 – R$ 8.000',
      '8k-15k': 'R$ 8.000 – R$ 15.000',
      'over-15k': 'Acima de R$ 15.000',
      'to-discuss': 'A combinar',
    },
    deadlines: {
      urgent: 'Urgente (até 1 mês)',
      '1-3-months': '1 a 3 meses',
      flexible: 'Flexível',
    },
    errors: {
      'name-length': 'Informe um nome entre 2 e 80 caracteres.',
      'email-required': 'E-mail de retorno obrigatório.',
      'email-invalid': 'Formato de e-mail inválido.',
      'phone-invalid': 'Informe DDD + número (10 ou 11 dígitos).',
      'services-required': 'Selecione pelo menos um serviço.',
      'message-length': 'Descreva o projeto entre 20 e 2000 caracteres.',
    },
    mailSubjectPrefix: '[Bounty Contract]',
    mail: {
      name: 'Nome',
      company: 'Empresa',
      email: 'E-mail',
      phone: 'WhatsApp',
      services: 'Serviços',
      budget: 'Orçamento',
      deadline: 'Prazo',
      message: 'Detalhes do projeto',
    },
    companyKey: 'EMPRESA:',
    phoneKey: 'WHATSAPP:',
    servicesKey: 'SERVIÇOS:',
    budgetKey: 'ORÇAMENTO:',
    deadlineKey: 'PRAZO:',
    missingPrefix: 'PARA ENVIAR, AJUSTE:',
    sendingCta: 'TRANSMITINDO...',
    honeypotLabel: 'Não preencha este campo',
    fallbackLead: 'O ENVIO FALHOU? MANDE PELO SEU E-MAIL:',
    toastSuccessTitle: 'PROPOSTA ENVIADA!',
    toastSuccessBody: 'Recebi sua mensagem e respondo no e-mail informado.',
    toastErrorTitle: 'FALHA NA TRANSMISSÃO',
    toastErrorBody: 'Não consegui enviar agora. Suas respostas continuam no formulário: tente de novo ou use o e-mail abaixo.',
    toastRateLimitedTitle: 'LIMITE DE ENVIOS ATINGIDO',
    toastRateLimitedBody: 'Muitos envios na última hora. Tente mais tarde ou use o e-mail abaixo.',
    submitCta: 'ENVIAR PROPOSTA DE PROJETO',
    receiptSuccess: 'TRANSMISSÃO ENVIADA // 100% CONFIRMADA!',
    codenameKey: 'REMETENTE:',
    frequencyKey: 'E-MAIL:',
    statusKey: 'DESTINO:',
    statusValue: PROFILE.email,
    timestampKey: 'CARIMBO:',
    sendEmailCopy: 'ABRIR NO CLIENTE DE E-MAIL',
    newTransmission: 'NOVA MENSAGEM',
  },
  footer: {
    sectionAria: 'Rodapé do Portfólio e Encerramento',
    ticker:
      '• SEE YOU GITHUB COWBOY • 2026 BRINU.DEV • FRANCA / SP • DESENVOLVEDOR FRONTEND & FULL STACK • SISTEMAS WEB SOB MEDIDA •',
    backToTop: 'VOLTAR AO TOPO',
    backToTopAria: 'Voltar suavemente ao topo da página',
    copyright: '© 2026 BRUNO DE ANDRADE DINIS (BRINU) // TODOS OS DIREITOS RESERVADOS.',
    engineeredIn: `PROJETADO & DESENVOLVIDO EM ${PROFILE.location.label.toUpperCase()}`,
    stackLine: 'ASTRO 7 • REACT 19 • TAILWIND V4 • GSAP • SOLID',
    privacyLine: 'ZERO COOKIES • ZERO RASTREAMENTO',
  },
  cilada: {
    dialogAria: 'Alerta de emergência: É uma cilada, Brinu!',
    tag: '// PROTOCOLO DE EMERGÊNCIA • SOBRECARGA',
    title: 'É UMA CILADA, BRINU!',
    body: 'Sensores detectaram três cliques rápidos no emblema! Protocolo de alerta máximo acionado.',
    quote: '"Mantenha a calma, cowboy. Os sistemas retornarão ao normal em instantes."',
    timerLabel: 'TEMPO RESTANTE DO ALARME',
    dismissCta: 'DESATIVAR ALARME AGORA [ESC]',
  },
  receipt: {
    header: 'TELEMETRIA DETECTADA — BEM-VINDO A BORDO, COWBOY',
    title: '[RECIBO] PHANTOM & BEBOP BOUNTY #1996',
    operator: 'OPERADOR',
    status: 'STATUS',
    base: 'BASE',
    email: 'E-MAIL',
    linkedin: 'LINKEDIN',
    item: 'ITEM',
    description: 'DESCRIÇÃO',
    value: 'STATUS',
    total: 'TOTAL',
    commands: 'COMANDOS DO CONSOLE',
    terminal: 'terminal interativo com todos os comandos (digite help)',
  },
  whoami: {
    skipCta: 'PULAR DIGITAÇÃO',
    onlineBadge: 'ONLINE',
    footerHint: 'DIGITE help PARA VER OS COMANDOS',
    returnHomeCta: 'RETORNAR AO PORTFÓLIO PRINCIPAL',
    promptLabel: 'Comando do terminal',
    inputPlaceholder: 'digite help',
    helpHeader: 'COMANDOS DISPONÍVEIS',
    usage: 'uso:',
    notFound: 'comando não encontrado. Digite help.',
    noFile: 'arquivo não encontrado',
    hobbiesHint: 'Digite hobbies <nome> para ver a carta.',
    hobbyOptions: 'hobby não encontrado. Opções:',
    downloaded: 'baixado.',
    langSet: 'Idioma: português.',
    contactOut: 'Abrindo um e-mail para',
    ciladaOut: '[ALERTA] Protocolo cilada ativado.',
    exitOut: 'Voltando ao portfólio...',
    options: 'Opções:',
    commands: {
      help: 'lista os comandos disponíveis',
      clear: 'limpa a tela',
      whoami: 'quem é o operador',
      career: 'trajetória profissional',
      education: 'formação',
      skills: 'o arsenal técnico',
      hobbies: 'lista os hobbies ou mostra a carta de um',
      projects: 'os quatro cases',
      ls: 'lista os arquivos',
      cat: 'imprime o currículo',
      download: 'baixa o currículo em PDF',
      lang: 'troca o idioma',
      contact: 'abre um e-mail para o Bruno',
      status: 'status do operador',
      cilada: 'dispara o alarme de cilada',
      exit: 'volta ao portfólio',
    },
    resume: {
      summary: 'RESUMO PROFISSIONAL',
      skills: 'COMPETÊNCIAS TÉCNICAS',
      experience: 'EXPERIÊNCIA PROFISSIONAL',
      projects: 'PROJETOS',
      education: 'FORMAÇÃO ACADÊMICA',
    },
  },
};

export const enDict = {
  a11y: {
    skipToContent: 'SKIP TO MAIN CONTENT',
    preloaderAria: 'Portfolio opening',
    mainNavAria: 'Main navigation',
    heroPortraitAlt: 'Noir comic-style portrait of Bruno Dinis',
  },
  meta: {
    title: 'Bruno Dinis // Brinu — Frontend & Full Stack Developer | Custom Web Systems',
    description:
      'Portfolio and services of Bruno de Andrade Dinis (Brinu), Frontend & Full Stack Developer at Magalu Cloud. Building web systems, dashboards, APIs and high-performance websites with Astro, React, Next.js, Node.js, TypeScript and PostgreSQL from Franca / SP, Brazil.',
    whoamiTitle: 'Bruno Dinis // Brinu — Confidant Terminal /whoami',
    whoamiDescription:
      'Interactive terminal of Bruno Dinis (Brinu): full stack architecture, stack and production projects.',
    stickersTitle: 'Brinu stickers // Bruno Dinis',
    stickersDescription: 'Original Brinu stickers in SVG, free to download and use.',
  },
  preloader: {
    sceneTag: '[ 1996 // ACT 01 ]',
    skipPrompt: 'CLICK OR PRESS ANY KEY TO PROCEED',
  },
  nav: {
    topAria: 'Scroll to top of page — Bruno Dinis (Brinu)',
    worksCta: 'SELECTED WORKS',
    worksCtaShort: 'WORKS',
    worksAria: 'Jump to selected works section',
    menuTriggerAria: 'Open Persona Command Menu',
    langToggleAria: 'Switch language between Portuguese and English',
  },
  menu: {
    dialogAria: 'Primary Command Menu',
    headerTag: '// PHANTOM COCKPIT • COMMAND MENU',
    title: 'TAKE YOUR TIME',
    closeLabel: 'CLOSE [ESC]',
    navItems: {
      hero: 'HOME & SERVICES',
      works: 'PROJECTS',
      about: 'CAREER & STACK',
      contact: 'GET A QUOTE',
      whoami: 'TERMINAL',
    },
    languageLabel: 'INTERFACE LANGUAGE',
    downloadCvLabel: '↓ DOWNLOAD RÉSUMÉ',
    audioOn: 'AUDIO: ON',
    audioMuted: 'AUDIO: MUTED',
    casesCta: 'CASES →',
    socialsAria: 'Bruno Dinis on the web',
    linkedinAria: "Open Bruno Dinis's LinkedIn (opens in new tab)",
    githubAria: "Open Bruno Dinis's GitHub (opens in new tab)",
    escHint: 'PRESS [ESC] OR SELECT A DESTINATION',
  },
  hero: {
    ticker:
      '• FRONTEND & FULL STACK DEVELOPER • CUSTOM WEB SYSTEMS • MAGALU CLOUD • REACT, NEXT.JS, ASTRO & NODE.JS • FRANCA / SP • REMOTE •',
    avatarAria:
      'Official avatar of Bruno Dinis in brutalist frame. Click to interact.',
    bubbleDefault: PROFILE.family.en,
    stamp: PROFILE.stampLabel.en,
    phrases: [
      PROFILE.family.en,
      'From database to production interface',
      PROFILE.role.en,
      'Base: Franca / SP • Remote',
      'React, Next.js, Astro, Node.js & PostgreSQL',
    ],
    manifestoLeftLine1: 'FROM DATABASE',
    manifestoLeftLine2: 'TO PRODUCTION',
    manifestoLeftLine3: 'INTERFACE',
    craftCta: 'VIEW PROJECTS & SERVICES',
    craftAria: 'Explore full stack web development projects and services',
    manifestoRightLine1: 'CUSTOM &',
    manifestoRightLine2: 'SCALABLE',
    manifestoRightLine3: 'WEB SYSTEMS',
    socialAria: 'Official Contact Channels and Social Profiles',
  },
  filmstrip: {
    sectionAria: 'Filmstrip of Projects & Full Stack Solutions',
    tag: '// PARALLAX REEL :: LIVE PRODUCTION PROJECTS 2.5°',
    heading: 'EVERY FRAME, A SHIPPED PROJECT',
    passionTag: '// REEL PARALLAX 02 :: FULL STACK SERVICES & SOLUTIONS -2.5°',
    slides: {
      s1Title: 'AuraStream Engine — 24/7 Broadcast',
      s2Title: 'Quake III Log Parser API',
      s3Title: 'Jokenpo — Franky Arena',
      s4Title: 'The Warriors — Landing Page',
      s5Title: 'Magalu Cloud — Corporate Website',
      s6Title: 'Web Systems, APIs & Automation',
      s1Reel: 'FRAME 01 // AURASTREAM',
      s2Reel: 'FRAME 02 // QUAKE LOG API',
      s3Reel: 'FRAME 03 // FRANKY ARENA',
      s4Reel: 'FRAME 04 // THE WARRIORS',
      s5Reel: 'FRAME 05 // MAGALU CLOUD',
      s6Reel: 'FRAME 06 // FULL STACK ARCHITECTURE',
      s1Alt: 'Frame 01: AuraStream Engine, 24/7 broadcast with FFmpeg and Xvfb',
      s2Alt: 'Frame 02: Quake Log Parser API with Jest and Docker Compose',
      s3Alt: 'Frame 03: Jokenpo, Franky Arena',
      s4Alt: 'Frame 04: The Warriors, landing page with a Gulp pipeline',
      s5Alt: 'Frame 05: Magalu Cloud corporate website',
      s6Alt: 'Frame 06: Full Stack development of web systems, APIs and automations',
    },
    passionSlides: {
      p1Reel: 'SERVICE 01 // WEB APPS & SAAS',
      p1Title: 'Next.js, React & TypeScript // Complete Product',
      p1Alt: 'Full Stack Service 01: Web application and SaaS platform development',
      p2Reel: 'SERVICE 02 // HIGH-PERFORMANCE SITES',
      p2Title: 'Astro, Tailwind CSS & Technical SEO',
      p2Alt: 'Full Stack Service 02: Fast corporate websites and landing pages with Astro',
      p3Reel: 'SERVICE 03 // DASHBOARDS & MANAGEMENT',
      p3Title: 'PostgreSQL, Prisma & Real-Time Metrics',
      p3Alt: 'Full Stack Service 03: Admin dashboards, POS and inventory management',
      p4Reel: 'SERVICE 04 // APIS & AUTOMATION',
      p4Title: 'Node.js, WebSockets, Extensions & Scripts',
      p4Alt: 'Full Stack Service 04: REST APIs, WebSockets and workflow automation',
      p5Reel: 'SERVICE 05 // CLOUD & INFRASTRUCTURE',
      p5Title: 'Magalu Cloud, S3 Object Storage & Docker',
      p5Alt: 'Full Stack Service 05: Cloud deployment, Docker containers and Object Storage',
      p6Reel: 'SERVICE 06 // ARCHITECTURE & TESTING',
      p6Title: 'SOLID, Automated Testing with Jest & Playwright',
      p6Alt: 'Full Stack Service 06: Clean SOLID architecture and automated testing',
      p1Headline: 'WEB SYSTEMS',
      p1Credits: 'NEXT.JS • REACT • TYPESCRIPT',
      p1Highlight: 'FROM PROTOTYPE TO LIVE PRODUCT',
      p1CardTitle: 'END TO END',
      p1CardSub: '// FULL STACK',
      p2Headline: 'HIGH PERFORMANCE',
      p2Credits: 'ASTRO • TAILWIND CSS • TECHNICAL SEO',
      p2Highlight: 'FAST LOAD, ACCESSIBILITY & CONVERSION',
      p2CardTitle: 'REAL SPEED',
      p2CardSub: '// FRONTEND',
      p3Headline: 'PANELS & DATA',
      p3Credits: 'POSTGRESQL • PRISMA • ZOD',
      p3Highlight: 'SAFE TRANSACTIONS & OPERATIONAL CONTROL',
      p3CardTitle: 'CONSISTENT DATA',
      p3CardSub: '// BACKEND & DB',
      p4Headline: 'APIS & AUTOMATION',
      p4Credits: 'NODE.JS • EXPRESS • WEBSOCKETS',
      p4Highlight: 'SYSTEM INTEGRATION & LESS MANUAL WORK',
      p4CardTitle: 'SEAMLESS FLOW',
      p4CardSub: '// INTEGRATIONS',
      p5Headline: 'CLOUD & DEPLOY',
      p5Credits: 'DOCKER • MAGALU CLOUD • OBJECT STORAGE',
      p5Highlight: 'REPRODUCIBLE ENVIRONMENTS & 24/7 SERVICES',
      p5CardTitle: 'STABLE PRODUCTION',
      p5CardSub: '// CLOUD & DOCKER',
      p6Headline: 'RELIABLE CODE',
      p6Credits: 'SOLID • JEST • PLAYWRIGHT',
      p6Highlight: 'SOFTWARE BUILT TO MAINTAIN AND SCALE',
      p6CardTitle: 'TECHNICAL RIGOR',
      p6CardSub: '// QUALITY',
    },
    motto: {
      part1: 'I TURN',
      highlight1: 'BUSINESS',
      part2: 'RULES INTO FAST, RELIABLE',
      highlight2: 'WEB SYSTEMS',
      part3: 'IN',
      highlight3: 'PRODUCTION.',
    },
  },
  works: {
    sectionAria: 'Bounty Archive: Selected Works by Bruno Dinis',
    jumpCutBadge: "3, 2, 1 LET'S JAM",
    jumpCutSub: '// CUT 02 :: SELECTED BOUNTY ARCHIVE',
    sessionTag: '[ SESSION #01 ]',
    actTag: '[ ACT I // SELECTED WORKS :: BOUNTY ARCHIVE ]',
    title: 'BOUNTY ARCHIVE',
    countLabel: 'SELECTED WORKS // 4 CASES',
    domainLabel: 'PRODUCTION FRONTEND :: FULLSTACK TYPESCRIPT :: CREATIVE DEV',
    challengeLabel: '// TECHNICAL CHALLENGE',
    solutionLabel: ':: ARCHITECTURAL SOLUTION',
    metricLabel: '[ DELIVERED ]',
    archiveTag: '// ARCHIVE • SMALLER PROJECTS AND STUDIES',
    archiveTitle: 'ARCHIVE',
    openCase: 'OPEN CASE',
  },
  notFound: {
    actTag: '[ ERROR 404 // SIGNAL LOST ]',
    title: 'PAGE NOT FOUND',
    hint: 'This address does not exist in this portfolio.',
    back: '← BACK TO START',
    seeYouLead: 'SEE YOU',
    seeYouAccent: 'GITHUB',
    seeYouTail: 'COWBOY',
  },
  showcase: {
    caseLabel: 'CASE',
    prevAria: 'Previous case',
    nextAria: 'Next case',
    controlsAria: 'Case navigation',
    play: 'PLAY',
    pause: 'PAUSE',
    tilesAria: 'All cases',
    stackAria: 'Case technologies',
    stageAria: 'Case media',
    fullscreenOpenAria: 'Double-click the video or press F to watch it in fullscreen',
    hintDoubleClick: 'DOUBLE CLICK',
    hintRotate: 'ROTATE YOUR PHONE',
    hintTitle: 'Double-click to enlarge',
    fullscreenPrev: 'Previous video',
    fullscreenNext: 'Next video',
    fullscreenHint: 'USE ← → OR SWIPE TO NAVIGATE • ESC TO CLOSE',
  },
  casePage: {
    sectionAria: 'Case page',
    actTag: '[ CASE FILE // PROJECT PAGE ]',
    backToWorks: '← BACK TO PROJECTS',
    nextCase: 'NEXT CASE →',
    titleSuffix: 'Bruno Dinis // Brinu',
  },
  about: {
    sectionAria: 'Confidant Operator Dossier: Bruno Dinis',
    actTag: '[ ACT II // CONFIDANT DOSSIER • LOG 1996 ]',
    title: 'DOSSIER: BRINU',
    statusBadge: 'STATUS: ACTIVE // DEPLOYED',
    domainLine: PROFILE.tagline.en.toUpperCase(),
    operatorTag: 'OPERATOR: BRINU',
    bioLine1: 'Full stack web developer with TypeScript, Node.js and PostgreSQL.',
    bioLine2: 'Across 8 years in the Magalu ecosystem, I grew from technical support into engineering by building extensions, APIs, dashboards and real automations.',
    baseLine: 'Franca / SP · Remote · Full Stack Projects & Consulting',
    rankLabel: 'RANK',
    currentMarker: 'CURRENT',
    portraitAlt: 'Illustrated portrait of Bruno Dinis',
    portraitReplayHint: 'Double-click, or press Enter, to solve the cube again',
    careerTitle: 'CAREER',
    educationTitle: 'EDUCATION',
    automationsLabel: 'AUTOMATIONS',
    tabInfo: 'INFO',
    tabDetails: 'DUTIES',
    tabLearned: 'LEARNED',
    hardSkillsLabel: 'HARD SKILLS',
    softSkillsLabel: 'SOFT SKILLS',
    skillsTag: '// SKILL MATRIX • CONFIDANT RANKS',
    skillsTitle: 'TECHNICAL ARSENAL',
  },
  hobbies: {
    title: 'HOBBIES',
    listAria: 'Hobbies',
  },
  panel: {
    closeLabel: 'Close',
  },
  stickers: {
    sectionAria: 'Brinu sticker library',
    actTag: '[ BONUS // STICKERS • SVG FILES ]',
    title: 'STICKERS',
    hint: 'CLICK A STICKER TO DOWNLOAD THE SVG',
    downloadLabel: 'DOWNLOAD SVG',
    downloadAria: 'Download the sticker:',
  },
  contact: {
    sectionAria: 'Contact and Project Proposals — Bounty Board',
    actTag: '[ ACT III // BOUNTY BOARD • DIRECT TRANSMISSION ]',
    title: 'LET’S TALK',
    availableBadge: 'AVAILABLE FOR FULL STACK PROJECTS & NEW SYSTEMS',
    leadText:
      'Need to launch a custom web system, build a management dashboard, or ship a high-performance website? Let’s talk.',
    subText:
      'End-to-end Full Stack Web Development — from database modeling and Node.js/TypeScript APIs to fast interfaces in React, Next.js, and Astro, from Franca / SP, Brazil to the world.',
    directEmailLabel: 'DIRECT EMAIL //',
    codeBaseLabel: 'CODE BASE //',
    careerLogLabel: 'CAREER LOG //',
    stationBaseLabel: 'STATION BASE //',
    stationBaseValue: PROFILE.location.remoteLabel.en,
  },
  jokenpo: {
    kicker: 'MINIGAME // ROCK PAPER SCISSORS',
    playerAlt: 'You — Straw Hats',
    cpuAlt: 'Computer — Franky',
    prompt: 'Make your next move:',
    pedra: 'ROCK',
    papel: 'PAPER',
    tesoura: 'SCISSORS',
    win: 'VICTORY',
    lose: 'DEFEAT',
    draw: 'DRAW',
    winLine: 'You won!',
    loseLine: 'You lost!',
    drawLine: 'Draw!',
    scoreTitle: 'Scoreboard',
    winsLabel: 'Wins',
    drawsLabel: 'Draws',
    lossesLabel: 'Losses',
    reset: 'Restart game',
  },
  dispatch: {
    headerTitle: '// REQUEST A QUOTE OR TECHNICAL PROPOSAL',
    headerSub: 'VERIFIED DIRECT CHANNEL',
    nameLabel: '01 // YOUR NAME',
    namePlaceholder: 'e.g. Ana Souza',
    companyLabel: '02 // COMPANY',
    companyPlaceholder: 'e.g. Acme Technology',
    emailLabel: '03 // RETURN FREQUENCY (YOUR EMAIL)',
    emailPlaceholder: 'e.g. contact@company.com',
    phoneLabel: '04 // WHATSAPP',
    phonePlaceholder: '(16) 99999-9999',
    servicesLegend: '05 // WHAT SERVICE ARE YOU LOOKING FOR?',
    budgetLegend: '06 // WHAT IS YOUR AVAILABLE BUDGET?',
    deadlineLegend: '07 // WHAT IS YOUR DESIRED TIMELINE?',
    messageLabel: '08 // PROJECT DETAILS',
    messagePlaceholder: 'Tell me about the web system, dashboard, site or integration, goals, and timeline...',
    optionalTag: '(OPTIONAL)',
    services: {
      'web-system': 'Web system / dashboard',
      site: 'Website / landing page',
      integration: 'Integration / API / maintenance',
      job: 'Job opportunity',
    },
    budgets: {
      'up-to-3k': 'Up to R$ 3,000',
      '3k-8k': 'R$ 3,000 – R$ 8,000',
      '8k-15k': 'R$ 8,000 – R$ 15,000',
      'over-15k': 'Over R$ 15,000',
      'to-discuss': 'To be discussed',
    },
    deadlines: {
      urgent: 'Urgent (within 1 month)',
      '1-3-months': '1 to 3 months',
      flexible: 'Flexible',
    },
    errors: {
      'name-length': 'Enter a name between 2 and 80 characters.',
      'email-required': 'Return email address is required.',
      'email-invalid': 'Invalid email address format.',
      'phone-invalid': 'Enter area code + number (10 or 11 digits).',
      'services-required': 'Select at least one service.',
      'message-length': 'Describe the project in 20 to 2000 characters.',
    },
    mailSubjectPrefix: '[Bounty Contract]',
    mail: {
      name: 'Name',
      company: 'Company',
      email: 'Email',
      phone: 'WhatsApp',
      services: 'Services',
      budget: 'Budget',
      deadline: 'Timeline',
      message: 'Project details',
    },
    companyKey: 'COMPANY:',
    phoneKey: 'WHATSAPP:',
    servicesKey: 'SERVICES:',
    budgetKey: 'BUDGET:',
    deadlineKey: 'TIMELINE:',
    missingPrefix: 'TO SEND, FIX:',
    sendingCta: 'TRANSMITTING...',
    honeypotLabel: 'Leave this field empty',
    fallbackLead: 'SEND FAILED? USE YOUR E-MAIL:',
    toastSuccessTitle: 'BRIEF SENT!',
    toastSuccessBody: 'I got your message and will reply at the e-mail you gave.',
    toastErrorTitle: 'TRANSMISSION FAILED',
    toastErrorBody: "I couldn't send it right now. Your answers are still in the form: try again or use the e-mail link below.",
    toastRateLimitedTitle: 'SEND LIMIT REACHED',
    toastRateLimitedBody: 'Too many sends in the last hour. Try again later or use the e-mail link below.',
    submitCta: 'SEND PROJECT PROPOSAL',
    receiptSuccess: 'TRANSMISSION SENT // 100% CONFIRMED!',
    codenameKey: 'SENDER:',
    frequencyKey: 'EMAIL:',
    statusKey: 'TARGET:',
    statusValue: PROFILE.email,
    timestampKey: 'TIMESTAMP:',
    sendEmailCopy: 'OPEN IN EMAIL CLIENT',
    newTransmission: 'NEW TRANSMISSION',
  },
  footer: {
    sectionAria: 'Portfolio Footer and Sign-off',
    ticker:
      '• SEE YOU GITHUB COWBOY • 2026 BRINU.DEV • FRANCA / SP • FRONTEND & FULL STACK DEVELOPER • CUSTOM WEB SYSTEMS •',
    backToTop: 'BACK TO TOP',
    backToTopAria: 'Scroll smoothly back to top',
    copyright: '© 2026 BRUNO DE ANDRADE DINIS (BRINU) // ALL RIGHTS RESERVED.',
    engineeredIn: `DESIGNED & BUILT IN ${PROFILE.location.label.toUpperCase()}`,
    stackLine: 'ASTRO 7 • REACT 19 • TAILWIND V4 • GSAP • SOLID',
    privacyLine: 'NO COOKIES • ZERO TRACKING',
  },
  cilada: {
    dialogAria: "Emergency alert: It's a trap, Brinu!",
    tag: '// EMERGENCY PROTOCOL • OVERLOAD',
    title: "IT'S A TRAP, BRINU!",
    body: 'Sensors detected a triple-click on the emblem! Maximum alert protocol engaged.',
    quote: '"Stay calm, cowboy. Systems will return to normal shortly."',
    timerLabel: 'REMAINING ALARM TIME',
    dismissCta: 'DEACTIVATE ALARM NOW [ESC]',
  },
  receipt: {
    header: 'TELEMETRY DETECTED — WELCOME ABOARD, COWBOY',
    title: '[RECEIPT] PHANTOM & BEBOP BOUNTY #1996',
    operator: 'OPERATOR',
    status: 'STATUS',
    base: 'BASE',
    email: 'EMAIL',
    linkedin: 'LINKEDIN',
    item: 'ITEM',
    description: 'DESCRIPTION',
    value: 'STATUS',
    total: 'TOTAL',
    commands: 'CONSOLE COMMANDS',
    terminal: 'interactive terminal with every command (type help)',
  },
  whoami: {
    skipCta: 'SKIP TYPING',
    onlineBadge: 'ONLINE',
    footerHint: 'TYPE help TO SEE THE COMMANDS',
    returnHomeCta: 'RETURN TO MAIN PORTFOLIO',
    promptLabel: 'Terminal command',
    inputPlaceholder: 'type help',
    helpHeader: 'AVAILABLE COMMANDS',
    usage: 'usage:',
    notFound: 'command not found. Type help.',
    noFile: 'no such file',
    hobbiesHint: 'Type hobbies <name> to see the card.',
    hobbyOptions: 'no such hobby. Options:',
    downloaded: 'downloaded.',
    langSet: 'Language: English.',
    contactOut: 'Opening an email to',
    ciladaOut: '[ALERT] Cilada protocol fired.',
    exitOut: 'Back to the portfolio...',
    options: 'Options:',
    commands: {
      help: 'lists the available commands',
      clear: 'clears the screen',
      whoami: 'who the operator is',
      career: 'career history',
      education: 'education',
      skills: 'the technical arsenal',
      hobbies: 'lists the hobbies or shows one card',
      projects: 'the four cases',
      ls: 'lists the files',
      cat: 'prints the résumé',
      download: 'saves the résumé as a PDF',
      lang: 'switches the language',
      contact: 'opens an email to Bruno',
      status: 'operator status',
      cilada: 'fires the cilada alarm',
      exit: 'returns to the portfolio',
    },
    resume: {
      summary: 'PROFESSIONAL SUMMARY',
      skills: 'TECHNICAL SKILLS',
      experience: 'PROFESSIONAL EXPERIENCE',
      projects: 'PROJECTS',
      education: 'EDUCATION',
    },
  },
} satisfies TranslationSchema;

export const DICTIONARIES: Record<Locale, TranslationSchema> = {
  'pt-br': ptBrDict,
  en: enDict,
};
