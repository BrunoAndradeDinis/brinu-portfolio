import { PROFILE } from '../data/profile.ts';

export type Locale = 'pt-br' | 'en';

export interface TranslationSchema {
  a11y: {
    skipToContent: string;
    preloaderAria: string;
    mainNavAria: string;
    heroPortraitAlt: string;
    labNavAria: string;
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
      lab: string;
      contact: string;
      whoami: string;
    };
    languageLabel: string;
    audioLabel: string;
    audioOn: string;
    audioMuted: string;
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
  lab: {
    sectionAria: string;
    actTag: string;
    title: string;
    statusBadge: string;
    domainLine: string;
    indexLabel: string;
    hint: string;
    openCase: string;
    prevAria: string;
    nextAria: string;
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
    directTag: string;
    directCta: string;
    dispatchPill: string;
    codeBaseLabel: string;
    careerLogLabel: string;
    stationBaseLabel: string;
    stationBaseValue: string;
  };
  dispatch: {
    headerTitle: string;
    headerSub: string;
    nameLabel: string;
    namePlaceholder: string;
    nameError: string;
    emailLabel: string;
    emailPlaceholder: string;
    emailRequiredError: string;
    emailInvalidError: string;
    messageLabel: string;
    messagePlaceholder: string;
    messageEmptyError: string;
    messageShortError: string;
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
  whoami: {
    skipCta: string;
    onlineBadge: string;
    footerHint: string;
    returnHomeCta: string;
    sessionComplete: string;
    steps: {
      whoamiOut: string;
      uptimeOut: string;
      locationOut: string;
      missionOut: string;
      skillsOut: string;
      philosophyOut: string;
    };
  };
}

export const ptBrDict: TranslationSchema = {
  a11y: {
    skipToContent: 'PULAR PARA O CONTEÚDO PRINCIPAL',
    preloaderAria: 'Abertura do portfólio',
    mainNavAria: 'Navegação principal',
    heroPortraitAlt: 'Retrato estilo HQ noir de Bruno Dinis',
    labNavAria: 'Cartas do Arcana Deck',
  },
  meta: {
    title: 'Bruno Dinis // Brinu — Desenvolvedor Frontend & Creative Developer',
    description:
      'Portfólio de Bruno de Andrade Dinis (Brinu), Desenvolvedor Frontend na Magalu Cloud: Astro, React, TypeScript e motion com GSAP, em Franca / SP.',
    whoamiTitle: 'Bruno Dinis // Brinu — Terminal Confidant /whoami',
    whoamiDescription:
      'Terminal interativo de Bruno Dinis (Brinu): trajetória, stack e projetos.',
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
      hero: '01 // INÍCIO & MANIFESTO',
      works: '02 // ARQUIVO DE PROJETOS',
      about: '03 // DOSSIÊ CONFIDANT & SKILLS',
      lab: '04 // ARCANA DECK',
      contact: '05 // ENVIAR PROPOSTA',
      whoami: '06 // TERMINAL /WHOAMI',
    },
    languageLabel: 'IDIOMA DA INTERFACE',
    audioLabel: 'SÍNTESE DE ÁUDIO WEB',
    audioOn: 'ÁUDIO: ATIVO',
    audioMuted: 'ÁUDIO: MUDO',
    escHint: 'PRESSIONE [ESC] OU SELECIONE UM DESTINO',
  },
  hero: {
    ticker:
      '• DESENVOLVEDOR FRONTEND • MAGALU CLOUD • CREATIVE DEVELOPER • PAI DA HELENA • FRANCA / SP • SEE YOU SPACE COWBOY •',
    avatarAria:
      'Avatar oficial de Bruno Dinis em moldura brutalista. Clique para interagir.',
    bubbleDefault: PROFILE.family['pt-br'],
    stamp: PROFILE.stampLabel['pt-br'],
    phrases: [
      PROFILE.family['pt-br'],
      'É uma cilada, Brinu!',
      PROFILE.role['pt-br'],
      'Base: Franca / SP • Remoto',
      'Astro, React & motion de autor',
    ],
    manifestoLeftLine1: '8 ANOS DE MAGALU',
    manifestoLeftLine2: 'DO ATENDIMENTO',
    manifestoLeftLine3: 'AO FRONT-END',
    craftCta: 'A ENGENHARIA COMEÇOU',
    craftAria: 'Explorar projetos selecionados',
    manifestoRightLine1: 'INTERFACES',
    manifestoRightLine2: 'COM PERSONALIDADE',
    manifestoRightLine3: 'E CÓDIGO LIMPO',
    socialAria: 'Canais Oficiais de Contato e Perfis Sociais',
  },
  filmstrip: {
    sectionAria: 'Esteira de Filme Parallax & Manifesto Editorial',
    tag: '// REEL PARALLAX :: CORTE BRUTALISTA 2.5°',
    heading: 'CADA FRAME, UM PROJETO ENTREGUE',
    passionTag: '// REEL PARALLAX 02 :: ARQUIVO DE PAIXÕES & CULTURA -2.5°',
    slides: {
      s1Title: 'AuraStream Engine — Transmissão 24/7',
      s2Title: 'Quake III Log Parser API',
      s3Title: 'Jokenpo — Arena Franky',
      s4Title: 'The Warriors — Landing Page',
      s5Title: 'Magalu Cloud — Site Institucional',
      s6Title: 'Pai da Helena & Creative Developer',
      s1Reel: 'FRAME 01 // AURASTREAM',
      s2Reel: 'FRAME 02 // QUAKE LOG API',
      s3Reel: 'FRAME 03 // ARENA FRANKY',
      s4Reel: 'FRAME 04 // THE WARRIORS',
      s5Reel: 'FRAME 05 // MAGALU CLOUD',
      s6Reel: 'FRAME 06 // SPACE COWBOY',
      s1Alt: 'Frame 01: AuraStream Engine, transmissão 24/7 com FFmpeg e Xvfb',
      s2Alt: 'Frame 02: Quake Log Parser API com Jest e Docker Compose',
      s3Alt: 'Frame 03: Jokenpo, Arena Franky',
      s4Alt: 'Frame 04: The Warriors, landing page com pipeline Gulp',
      s5Alt: 'Frame 05: site institucional da Magalu Cloud',
      s6Alt: 'Frame 06: Space Cowboy, pai da Helena e creative developer',
    },
    passionSlides: {
      p1Reel: 'FRAME 01 // BANDA MEDULLA',
      p1Title: 'Keops & Raony // Rock Alternativo BR',
      p1Alt: 'Storyboard Paixão 01: Banda Medulla com Keops e Raony',
      p2Reel: 'FRAME 02 // ONE PIECE',
      p2Title: 'Eiichiro Oda // Monkey D. Luffy & Nakamas',
      p2Alt: 'Storyboard Paixão 02: One Piece e Chapéus de Palha',
      p3Reel: 'FRAME 03 // COWBOY BEBOP',
      p3Title: 'Spike Spiegel // Shinichiro Watanabe & Yoko Kanno',
      p3Alt: 'Storyboard Paixão 03: Cowboy Bebop Space Jazz Noir',
      p4Reel: 'FRAME 04 // AKIRA 1988',
      p4Title: 'Katsuhiro Otomo // Neo-Tokyo Cyberpunk',
      p4Alt: 'Storyboard Paixão 04: Akira e Cyberpunk Neo-Tokyo',
      p5Reel: 'FRAME 05 // CAFÉ ESPECIAL',
      p5Title: 'V60 Drip // Extração, Moagem & Torra',
      p5Alt: 'Storyboard Paixão 05: Ritual de Café Especial V60',
      p6Reel: 'FRAME 06 // CULINÁRIA & STREET FOOD',
      p6Title: 'Izakaya & Comfort Food // Culinária Afetiva',
      p6Alt: 'Storyboard Paixão 06: Gastronomia Afetiva e Street Food',
      p1Headline: 'MEDULLA',
      p1Credits: 'KEOPS & RAONY // ROCK ALTERNATIVO BR',
      p1Highlight: 'GUITARRA ALTA, LETRA COM CHÃO',
      p1CardTitle: 'ENERGIA BRUTA',
      p1CardSub: '// GUITARRA',
      p2Headline: 'ONE PIECE',
      p2Credits: 'EIICHIRO ODA // MONKEY D. LUFFY',
      p2Highlight: 'LIBERDADE, CORAGEM & NAKAMAS',
      p2CardTitle: 'AVENTURA EM ALTO-MAR',
      p2CardSub: '// O TESOURO É A JORNADA',
      p3Headline: 'COWBOY BEBOP',
      p3Credits: 'SHINICHIRO WATANABE & YOKO KANNO',
      p3Highlight: 'JAZZ, NOIR & ESPAÇO',
      p3CardTitle: 'SPACE JAZZ NOIR',
      p3CardSub: '// ESTILO ACIMA DE TUDO',
      p4Headline: 'AKIRA',
      p4Credits: 'KATSUHIRO OTOMO // NEO-TOKYO, 1988',
      p4Highlight: 'VELOCIDADE, NEON & CAOS',
      p4CardTitle: 'CYBERPUNK',
      p4CardSub: '// 1988',
      p5Headline: 'CAFÉ ESPECIAL',
      p5Credits: 'HARIO V60 // EXTRAÇÃO, MOAGEM & TORRA',
      p5Highlight: 'RITUAL DIÁRIO // 93°C // PROPORÇÃO 1:16',
      p5CardTitle: 'POUR OVER',
      p5CardSub: '// CLAREZA & NOTAS',
      p6Headline: 'STREET FOOD & SOUL',
      p6Credits: 'IZAKAYA & COMFORT FOOD // CULINÁRIA AFETIVA',
      p6Highlight: 'ALQUIMIA DE SABORES // FOGO, TEMPO & MEMÓRIA',
      p6CardTitle: 'UMAMI & AFETO',
      p6CardSub: '// COMIDA QUE CONECTA',
    },
    motto: {
      part1: 'APRENDI A RESOLVER',
      highlight1: 'PROBLEMAS',
      part2: 'ATENDENDO',
      highlight2: 'PESSOAS',
      part3: '— HOJE EU RESOLVO COM',
      highlight3: 'INTERFACES.',
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
    bioLine1: 'Frontend na Magalu Cloud: Astro, React e Tailwind no site institucional.',
    bioLine2: 'Antes, 8 anos de SAC e helpdesk no ecossistema Magalu, onde aprendi a automatizar o próprio trabalho.',
    baseLine: 'Franca / SP · Remoto · Pai da Helena',
    rankLabel: 'RANK',
    currentMarker: 'ATUAL',
    portraitAlt: 'Retrato ilustrado de Bruno Dinis',
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
  lab: {
    sectionAria: 'Arcana Deck: Baralho de Projetos Selecionados',
    actTag: '[ ATO III // ARCANA DECK • GSAP, CSS 3D & TECLADO ]',
    title: 'ARCANA DECK',
    statusBadge: 'STATUS: INTERATIVO // ARRASTE & VIRE',
    domainLine: 'GSAP DRAGGABLE • CSS 3D • NAVEGAÇÃO POR TECLADO',
    indexLabel: 'CARTAS //',
    hint: 'ARRASTE, USE AS SETAS E PRESSIONE ENTER PARA VIRAR A CARTA',
    openCase: 'VER CASE COMPLETO',
    prevAria: 'Carta anterior',
    nextAria: 'Próxima carta',
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
    actTag: '[ ATO IV // BOUNTY BOARD • TRANSMISSÃO DIRETA ]',
    title: 'VAMOS CONVERSAR',
    availableBadge: 'DISPONÍVEL PARA PROJETOS DE ALTO IMPACTO',
    leadText:
      'Tem um produto que precisa de um frontend rápido, acessível e com personalidade? Vamos conversar.',
    subText:
      'Desenvolvo software com rigor arquitetural SOLID, código limpo e identidade visual marcante a partir de Franca / SP para todo o mundo.',
    directTag: '// CANAL DIRETO DE COMUNICAÇÃO',
    directCta: 'ENVIAR PROPOSTA DIRETA',
    dispatchPill: 'DISPARAR',
    codeBaseLabel: 'CÓDIGO FONTE //',
    careerLogLabel: 'TRAJETÓRIA //',
    stationBaseLabel: 'BASE DE OPERAÇÃO //',
    stationBaseValue: PROFILE.location.remoteLabel['pt-br'],
  },
  dispatch: {
    headerTitle: '// CONSOLE DE TRANSMISSÃO DE PROPOSTA',
    headerSub: 'CANAL DIRETO VERIFICADO',
    nameLabel: '01 // SEU NOME OU EMPRESA (CODENAME)',
    namePlaceholder: 'Ex: Akira Kurusu / Phantom Corp',
    nameError: 'Identificador/Nome obrigatório.',
    emailLabel: '02 // SEU E-MAIL DE RETORNO',
    emailPlaceholder: 'Ex: contato@empresa.com',
    emailRequiredError: 'E-mail de retorno obrigatório.',
    emailInvalidError: 'Formato de e-mail inválido.',
    messageLabel: '03 // ESCOPO DO PROJETO OU PROPOSTA',
    messagePlaceholder: 'Descreva o desafio técnico, objetivos e prazos...',
    messageEmptyError: 'A mensagem da proposta não pode ficar vazia.',
    messageShortError: 'A proposta deve conter pelo menos 10 caracteres.',
    submitCta: 'TRANSMITIR PROPOSTA',
    receiptSuccess: 'TRANSMISSÃO PREPARADA // 100% VALIDADA!',
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
      '• SEE YOU SPACE COWBOY • 2026 BRINU.DEV • FRANCA / SP • DESENVOLVEDOR FRONTEND • PERSONA BRUTALIST UI •',
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
  whoami: {
    skipCta: 'PULAR DIGITAÇÃO',
    onlineBadge: 'ONLINE',
    footerHint: 'PRESSIONE QUALQUER TECLA PARA PULAR OU RETORNE AO PORTFÓLIO',
    returnHomeCta: 'RETORNAR AO PORTFÓLIO PRINCIPAL',
    sessionComplete: '[SESSÃO CONCLUÍDA // TELEMETRIA 100% VERIFICADA — FRANCA / SP]',
    steps: {
      whoamiOut: `${PROFILE.fullName} (@${PROFILE.handle}) — ${PROFILE.role['pt-br']}`,
      uptimeOut: `${PROFILE.family['pt-br']} · Desenvolvedor frontend na Magalu Cloud`,
      locationOut: `${PROFILE.location.remoteLabel['pt-br']} (${PROFILE.email})`,
      missionOut:
        'Frontend na Magalu Cloud • Streaming 24/7 com a AuraStream na Magalu Cloud',
      skillsOut:
        'total 8\ndrwxr-xr-x  astro/       react-19/    typescript/  tailwind/\ndrwxr-xr-x  gsap/        playwright/  docker/      solid-arch/',
      philosophyOut:
        '"Arquitetura limpa SOLID, interfaces acessíveis e direção de arte inegociável."',
    },
  },
};

export const enDict = {
  a11y: {
    skipToContent: 'SKIP TO MAIN CONTENT',
    preloaderAria: 'Portfolio opening',
    mainNavAria: 'Main navigation',
    heroPortraitAlt: 'Noir comic-style portrait of Bruno Dinis',
    labNavAria: 'Arcana Deck cards',
  },
  meta: {
    title: 'Bruno Dinis // Brinu — Frontend Developer & Creative Developer',
    description:
      'Portfolio of Bruno de Andrade Dinis (Brinu), Frontend Developer at Magalu Cloud: Astro, React, TypeScript and GSAP motion, based in Franca / SP, Brazil.',
    whoamiTitle: 'Bruno Dinis // Brinu — Confidant Terminal /whoami',
    whoamiDescription:
      'Interactive terminal of Bruno Dinis (Brinu): career, stack and projects.',
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
      hero: '01 // HOME & MANIFESTO',
      works: '02 // BOUNTY ARCHIVE (WORKS)',
      about: '03 // CONFIDANT DOSSIER & SKILLS',
      lab: '04 // ARCANA DECK',
      contact: '05 // TRANSMIT A BOUNTY',
      whoami: '06 // TERMINAL /WHOAMI',
    },
    languageLabel: 'INTERFACE LANGUAGE',
    audioLabel: 'WEB AUDIO SYNTHESIS',
    audioOn: 'AUDIO: ON',
    audioMuted: 'AUDIO: MUTED',
    escHint: 'PRESS [ESC] OR SELECT A DESTINATION',
  },
  hero: {
    ticker:
      '• FRONTEND DEVELOPER • MAGALU CLOUD • CREATIVE DEVELOPER • HELENA\'S DAD • FRANCA / SP • SEE YOU SPACE COWBOY •',
    avatarAria:
      'Official avatar of Bruno Dinis in brutalist frame. Click to interact.',
    bubbleDefault: PROFILE.family.en,
    stamp: PROFILE.stampLabel.en,
    phrases: [
      PROFILE.family.en,
      "It's a trap, Brinu!",
      PROFILE.role.en,
      'Base: Franca / SP • Remote',
      'Astro, React & signature motion',
    ],
    manifestoLeftLine1: '8 YEARS AT MAGALU',
    manifestoLeftLine2: 'FROM SUPPORT',
    manifestoLeftLine3: 'TO FRONTEND',
    craftCta: 'THE CRAFT HAS BEGUN',
    craftAria: 'Explore selected works: The Craft Has Begun',
    manifestoRightLine1: 'INTERFACES',
    manifestoRightLine2: 'WITH PERSONALITY',
    manifestoRightLine3: 'AND CLEAN CODE',
    socialAria: 'Official Contact Channels and Social Profiles',
  },
  filmstrip: {
    sectionAria: 'Filmstrip Storyboard Parallax & Editorial Manifesto',
    tag: '// PARALLAX REEL :: 2.5° BRUTALIST CUT',
    heading: 'EVERY FRAME, A SHIPPED PROJECT',
    passionTag: '// REEL PARALLAX 02 :: PASSIONS & CULTURAL ARCHIVE -2.5°',
    slides: {
      s1Title: 'AuraStream Engine — 24/7 Broadcast',
      s2Title: 'Quake III Log Parser API',
      s3Title: 'Jokenpo — Franky Arena',
      s4Title: 'The Warriors — Landing Page',
      s5Title: 'Magalu Cloud — Corporate Website',
      s6Title: 'Helena\'s Dad & Creative Developer',
      s1Reel: 'FRAME 01 // AURASTREAM',
      s2Reel: 'FRAME 02 // QUAKE LOG API',
      s3Reel: 'FRAME 03 // FRANKY ARENA',
      s4Reel: 'FRAME 04 // THE WARRIORS',
      s5Reel: 'FRAME 05 // MAGALU CLOUD',
      s6Reel: 'FRAME 06 // SPACE COWBOY',
      s1Alt: 'Frame 01: AuraStream Engine, 24/7 broadcast with FFmpeg and Xvfb',
      s2Alt: 'Frame 02: Quake Log Parser API with Jest and Docker Compose',
      s3Alt: 'Frame 03: Jokenpo, Franky Arena',
      s4Alt: 'Frame 04: The Warriors, landing page with a Gulp pipeline',
      s5Alt: 'Frame 05: Magalu Cloud corporate website',
      s6Alt: 'Frame 06: Space Cowboy, Helena\'s dad and creative developer',
    },
    passionSlides: {
      p1Reel: 'FRAME 01 // MEDULLA BAND',
      p1Title: 'Keops & Raony // Brazilian Alternative Rock',
      p1Alt: 'Passion Storyboard Frame 01: Medulla Band with Keops and Raony',
      p2Reel: 'FRAME 02 // ONE PIECE',
      p2Title: 'Eiichiro Oda // Monkey D. Luffy & Nakamas',
      p2Alt: 'Passion Storyboard Frame 02: One Piece and Straw Hat Pirates',
      p3Reel: 'FRAME 03 // COWBOY BEBOP',
      p3Title: 'Spike Spiegel // Shinichiro Watanabe & Yoko Kanno',
      p3Alt: 'Passion Storyboard Frame 03: Cowboy Bebop Space Jazz Noir',
      p4Reel: 'FRAME 04 // AKIRA 1988',
      p4Title: 'Katsuhiro Otomo // Neo-Tokyo Cyberpunk',
      p4Alt: 'Passion Storyboard Frame 04: Akira and Cyberpunk Neo-Tokyo',
      p5Reel: 'FRAME 05 // SPECIALTY COFFEE',
      p5Title: 'V60 Drip // Extraction, Grind & Roast',
      p5Alt: 'Passion Storyboard Frame 05: Specialty Coffee V60 Ritual',
      p6Reel: 'FRAME 06 // GASTRONOMY & STREET FOOD',
      p6Title: 'Izakaya & Comfort Food // Soul Kitchen',
      p6Alt: 'Passion Storyboard Frame 06: Soul Food and Street Kitchen',
      p1Headline: 'MEDULLA',
      p1Credits: 'KEOPS & RAONY // BRAZILIAN ALT ROCK',
      p1Highlight: 'LOUD GUITARS, GROUNDED LYRICS',
      p1CardTitle: 'RAW ENERGY',
      p1CardSub: '// GUITAR',
      p2Headline: 'ONE PIECE',
      p2Credits: 'EIICHIRO ODA // MONKEY D. LUFFY',
      p2Highlight: 'FREEDOM, COURAGE & NAKAMA',
      p2CardTitle: 'ADVENTURE AT SEA',
      p2CardSub: '// THE TREASURE IS THE JOURNEY',
      p3Headline: 'COWBOY BEBOP',
      p3Credits: 'SHINICHIRO WATANABE & YOKO KANNO',
      p3Highlight: 'JAZZ, NOIR & SPACE',
      p3CardTitle: 'SPACE JAZZ NOIR',
      p3CardSub: '// STYLE ABOVE ALL',
      p4Headline: 'AKIRA',
      p4Credits: 'KATSUHIRO OTOMO // NEO-TOKYO, 1988',
      p4Highlight: 'SPEED, NEON & CHAOS',
      p4CardTitle: 'CYBERPUNK',
      p4CardSub: '// 1988',
      p5Headline: 'SPECIALTY COFFEE',
      p5Credits: 'HARIO V60 // EXTRACTION, GRIND & ROAST',
      p5Highlight: 'DAILY RITUAL // 93°C // 1:16 RATIO',
      p5CardTitle: 'POUR OVER',
      p5CardSub: '// CLARITY & NOTES',
      p6Headline: 'STREET FOOD & SOUL',
      p6Credits: 'IZAKAYA & COMFORT FOOD // SOUL KITCHEN',
      p6Highlight: 'FLAVOR ALCHEMY // FIRE, TIME & MEMORY',
      p6CardTitle: 'UMAMI & AFFECTION',
      p6CardSub: '// FOOD THAT CONNECTS',
    },
    motto: {
      part1: 'I LEARNED TO SOLVE',
      highlight1: 'PROBLEMS',
      part2: 'BY HELPING',
      highlight2: 'PEOPLE',
      part3: '— TODAY I SOLVE THEM WITH',
      highlight3: 'INTERFACES.',
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
    bioLine1: 'Frontend at Magalu Cloud: Astro, React and Tailwind on the corporate website.',
    bioLine2: 'Before that, 8 years of support and helpdesk across the Magalu ecosystem, where I learned to automate my own work.',
    baseLine: "Franca / SP · Remote · Helena's dad",
    rankLabel: 'RANK',
    currentMarker: 'CURRENT',
    portraitAlt: 'Illustrated portrait of Bruno Dinis',
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
  lab: {
    sectionAria: 'Arcana Deck: Selected Projects Card Deck',
    actTag: '[ ACT III // ARCANA DECK • GSAP, CSS 3D & KEYBOARD ]',
    title: 'ARCANA DECK',
    statusBadge: 'STATUS: INTERACTIVE // DRAG & FLIP',
    domainLine: 'GSAP DRAGGABLE • CSS 3D • KEYBOARD NAVIGATION',
    indexLabel: 'CARDS //',
    hint: 'DRAG, USE THE ARROW KEYS AND PRESS ENTER TO FLIP THE CARD',
    openCase: 'VIEW FULL CASE',
    prevAria: 'Previous card',
    nextAria: 'Next card',
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
    actTag: '[ ACT IV // BOUNTY BOARD • DIRECT TRANSMISSION ]',
    title: 'LET’S TALK',
    availableBadge: 'AVAILABLE FOR HIGH-IMPACT CONTRACTS',
    leadText:
      'Have a product that needs a fast, accessible frontend with personality? Let’s talk.',
    subText:
      'I engineer software with strict SOLID architecture, clean code, and unmistakable visual identity from Franca / SP, Brazil to the world.',
    directTag: '// DIRECT FREQUENCY COMMUNICATION',
    directCta: 'TRANSMIT DIRECT PROPOSAL',
    dispatchPill: 'DISPATCH',
    codeBaseLabel: 'CODE BASE //',
    careerLogLabel: 'CAREER LOG //',
    stationBaseLabel: 'STATION BASE //',
    stationBaseValue: PROFILE.location.remoteLabel.en,
  },
  dispatch: {
    headerTitle: '// BOUNTY DISPATCH CONSOLE',
    headerSub: 'VERIFIED DIRECT CHANNEL',
    nameLabel: '01 // SENDER CODENAME (YOUR NAME / COMPANY)',
    namePlaceholder: 'e.g. Akira Kurusu / Phantom Corp',
    nameError: 'Sender name/codename is required.',
    emailLabel: '02 // RETURN FREQUENCY (YOUR EMAIL)',
    emailPlaceholder: 'e.g. contact@company.com',
    emailRequiredError: 'Return email address is required.',
    emailInvalidError: 'Invalid email address format.',
    messageLabel: '03 // CONTRACT PAYLOAD (PROJECT SCOPE)',
    messagePlaceholder: 'Describe the technical challenge, goals, and timeline...',
    messageEmptyError: 'Proposal payload cannot be empty.',
    messageShortError: 'Proposal payload must be at least 10 characters.',
    submitCta: 'TRANSMIT CONTRACT PAYLOAD',
    receiptSuccess: 'TRANSMISSION PREPARED // 100% VALIDATED!',
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
      '• SEE YOU SPACE COWBOY • 2026 BRINU.DEV • FRANCA / SP • FRONTEND DEVELOPER • PERSONA BRUTALIST UI •',
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
  whoami: {
    skipCta: 'SKIP TYPING',
    onlineBadge: 'ONLINE',
    footerHint: 'PRESS ANY KEY TO SKIP OR RETURN TO MAIN PORTFOLIO',
    returnHomeCta: 'RETURN TO MAIN PORTFOLIO',
    sessionComplete: '[SESSION COMPLETE // 100% TELEMETRY VERIFIED — FRANCA / SP]',
    steps: {
      whoamiOut: `${PROFILE.fullName} (@${PROFILE.handle}) — ${PROFILE.role.en}`,
      uptimeOut: `${PROFILE.family.en} · Frontend developer at Magalu Cloud`,
      locationOut: `${PROFILE.location.remoteLabel.en} (${PROFILE.email})`,
      missionOut:
        'Frontend at Magalu Cloud • 24/7 streaming with AuraStream on Magalu Cloud',
      skillsOut:
        'total 8\ndrwxr-xr-x  astro/       react-19/    typescript/  tailwind/\ndrwxr-xr-x  gsap/        playwright/  docker/      solid-arch/',
      philosophyOut:
        '"Clean SOLID architecture, accessible interfaces, and uncompromising art direction."',
    },
  },
} satisfies TranslationSchema;

export const DICTIONARIES: Record<Locale, TranslationSchema> = {
  'pt-br': ptBrDict,
  en: enDict,
};
