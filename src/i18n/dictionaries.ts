import { PROFILE } from '../data/profile.ts';

export type Locale = 'pt-br' | 'en';

export interface TranslationSchema {
  a11y: {
    skipToContent: string;
  };
  meta: {
    title: string;
    description: string;
    whoamiTitle: string;
    whoamiDescription: string;
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
    baseLabel: string;
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
    };
    p1: string;
    p2: string;
    p3Part1: string;
    p3Highlight1: string;
    p3Part2: string;
    p3Highlight2: string;
    p3Part3: string;
    p3Highlight3: string;
    p3Part4: string;
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
  };
  about: {
    sectionAria: string;
    actTag: string;
    title: string;
    statusBadge: string;
    domainLine: string;
    operatorTag: string;
    roleHeading: string;
    bioP1: string;
    bioP2: string;
    portraitAlt: string;
    careerTitle: string;
    educationTitle: string;
    automationsLabel: string;
    stats: {
      roleLabel: string;
      roleValue: string;
      baseLabel: string;
      baseValue: string;
      coreLabel: string;
      coreValue: string;
      stackLabel: string;
      stackValue: string;
    };
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
    navTuner: string;
    navSonar: string;
    navDeck: string;
    tuner: {
      tag: string;
      title: string;
      statusLabel: string;
      locked: string;
      searching: string;
      noCarrier: string;
      scanning: string;
      hint: string;
      freqLabel: string;
      dragHint: string;
      presets: {
        crimsonName: string;
        crimsonDesc: string;
        phantomName: string;
        phantomDesc: string;
        noirName: string;
        noirDesc: string;
      };
    };
    sonar: {
      tag: string;
      title: string;
      audioOn: string;
      audioMuted: string;
      telemetryTag: string;
      acquired: string;
      contactLabel: string;
      azimuthLabel: string;
      distanceLabel: string;
      specLabel: string;
      manifestLabel: string;
    };
    deck: {
      tag: string;
      title: string;
      audioOn: string;
      audioMuted: string;
      docked: string;
      ejected: string;
      dragHint: string;
      dampingLabel: string;
      ejectBtn: string;
      reinsertBtn: string;
      decryptedHeader: string;
      lockedHeader: string;
      dumpActive: string;
      dumpLocked: string;
      lockedCodeComment: string;
      keyboardHint: string;
    };
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
    badge: string;
    signature: string;
    subtitle: string;
    backToTop: string;
    backToTopAria: string;
    copyright: string;
    engineeredIn: string;
    stackLine: string;
    privacyLine: string;
  };
  rightClick: {
    dialogAria: string;
    tag: string;
    closeAria: string;
    headline: string;
    body: string;
    escHint: string;
    readyBadge: string;
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
  },
  meta: {
    title: 'Bruno Dinis // Brinu — Desenvolvedor Frontend & Creative Developer',
    description:
      'Portfólio de Bruno de Andrade Dinis (Brinu), Desenvolvedor Frontend na Magalu Cloud: Astro, React, TypeScript e motion com GSAP, em Franca / SP.',
    whoamiTitle: 'Bruno Dinis // Brinu — Terminal Confidant /whoami',
    whoamiDescription:
      'Terminal interativo de Bruno Dinis (Brinu): trajetória, stack e projetos.',
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
      lab: '04 // CREATIVE LAB',
      contact: '05 // ENVIAR PROPOSTA',
      whoami: '06 // TERMINAL /WHOAMI',
    },
    languageLabel: 'IDIOMA DA INTERFACE',
    audioLabel: 'SÍNTESE DE ÁUDIO WEB',
    audioOn: 'ÁUDIO: ATIVO',
    audioMuted: 'ÁUDIO: MUDO',
    baseLabel: `BASE: ${PROFILE.location.remoteLabel['pt-br'].toUpperCase()}`,
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
    },
    p1: 'EU NÃO LEMBRO MAIS COMO A WEB ERA ANTES DISSO… E NÃO PARECE QUE ESTAMOS NA REALIDADE BASE NESTE EXATO MOMENTO.',
    p2: 'A ÚNICA CERTEZA ALÉM DA PERCEPÇÃO SENSORIAL É QUE ESTOU AQUI PARA ARQUITETAR SISTEMAS RESILIENTES E SALVAR O FRONTEND DESSA CORRIDA MONÓTONA.',
    p3Part1: 'O ',
    p3Highlight1: 'CÓDIGO SEM ALMA',
    p3Part2: '… REINOU POR TEMPO DEMAIS… DE ',
    p3Highlight2: 'NUVENS DISTRIBUÍDAS',
    p3Part3: ' A INTERFACES DE IMPACTO BRUTALISTA… A ',
    p3Highlight3: 'ARTE DO SPACE COWBOY',
    p3Part4: ' FINALMENTE COMEÇOU.',
  },
  works: {
    sectionAria: 'Arquivo de Projetos Autorais de Bruno Dinis',
    jumpCutBadge: "3, 2, 1 LET'S JAM",
    jumpCutSub: '// CORTE 02 :: ARQUIVO DE PROJETOS SELECIONADOS',
    sessionTag: '[ SESSÃO #01 ]',
    actTag: '[ ATO I // SELECTED WORKS :: PROJETOS EM DESTAQUE ]',
    title: 'BOUNTY ARCHIVE',
    countLabel: 'PROJETOS SELECIONADOS // 4 CASES',
    domainLabel: 'FRONTEND EM PRODUÇÃO :: FULLSTACK TYPESCRIPT :: CREATIVE DEV',
    challengeLabel: '// DESAFIO TÉCNICO',
    solutionLabel: ':: SOLUÇÃO ARQUITETURAL',
    metricLabel: '[ IMPACTO ]',
    archiveTag: '// ARQUIVO • PROJETOS MENORES COM DEMO',
    archiveTitle: 'ARQUIVO',
  },
  about: {
    sectionAria: 'Dossiê Confidant do Operador: Bruno Dinis',
    actTag: '[ ATO II // DOSSIÊ CONFIDANT • REGISTRO 1996 ]',
    title: 'DOSSIER: BRINU',
    statusBadge: 'STATUS: ATIVO // EM PRODUÇÃO',
    domainLine: PROFILE.tagline['pt-br'].toUpperCase(),
    operatorTag: 'OPERADOR: BRINU',
    roleHeading: 'DESENVOLVEDOR FRONTEND & CRIADOR',
    bioP1:
      'Desenvolvedor frontend no time da Magalu Cloud, construindo com Astro, React e Tailwind. Antes do código, foram 8 anos no ecossistema Magalu entre SAC e helpdesk — onde comecei a automatizar o próprio trabalho com extensões, dashboards e chatbots.',
    bioP2:
      'Fora do expediente, levo direção de arte para a web: interfaces angulares inspiradas em Persona 5 e Cowboy Bebop, com motion de 60fps. Pai da Helena, operando de Franca / SP.',
    portraitAlt: 'Retrato ilustrado de Bruno Dinis',
    careerTitle: 'TRAJETÓRIA',
    educationTitle: 'FORMAÇÃO',
    automationsLabel: 'AUTOMAÇÕES',
    stats: {
      roleLabel: 'PAPEL ATUAL //',
      roleValue: PROFILE.role['pt-br'],
      baseLabel: 'BASE ATUAL //',
      baseValue: PROFILE.location.remoteLabel['pt-br'],
      coreLabel: 'NÚCLEO HUMANO //',
      coreValue: PROFILE.family['pt-br'],
      stackLabel: 'ARSENAL PRINCIPAL //',
      stackValue: 'Astro • React/Next.js • TypeScript • Tailwind • GSAP',
    },
    skillsTag: '// MATRIZ DE HABILIDADES • CONFIDANT RANKS',
    skillsTitle: 'ARSENAL TÉCNICO // 3 DOMÍNIOS',
  },
  lab: {
    sectionAria: 'Creative Lab: Experimentos Visuais e Áudio Sintetizado',
    actTag: '[ ATO III // CREATIVE LAB • WEBGL, CANVAS & WEB AUDIO ]',
    title: 'CREATIVE LAB',
    statusBadge: 'STATUS: INTERATIVO // 60FPS',
    domainLine: 'WEB AUDIO NATIVO • SHADERS • THREE.JS • CANVAS 2D',
    indexLabel: 'EXPERIMENTOS //',
    navTuner: '01 // SINTONIZADOR CRT',
    navSonar: '02 // RADAR SONAR',
    navDeck: '03 // CYBER DECK 3D',
    tuner: {
      tag: '// EXPERIMENTO 01 • SINTONIZADOR ANALÓGICO',
      title: 'CONTROLADOR DE FREQUÊNCIA',
      statusLabel: 'SINAL:',
      locked: 'SINAL TRAVADO',
      searching: 'BUSCANDO FREQ',
      noCarrier: 'SEM PORTADORA',
      scanning: '• • • VARRENDO FREQUÊNCIAS ANALÓGICAS • • •',
      hint: 'Gire o dial ou use os atalhos para sintonizar 92.4, 98.7 ou 104.2 MHz.',
      freqLabel: 'FREQUÊNCIA ATUAL',
      dragHint: '[ ARRASTE O DIAL OU USE AS SETAS ]',
      presets: {
        crimsonName: 'CRIMSON REBELLION',
        crimsonDesc: 'Canal de Alta Tensão Vermelho Carmesim — Persona Brutalist Mode',
        phantomName: 'STARK MONOCHROME',
        phantomDesc: 'Canal de Contraste Puro Branco Papel sobre Preto Absoluto',
        noirName: 'OVERDRIVE PULSE',
        noirDesc: 'Modulação de Pulso Analógico de Alta Frequência',
      },
    },
    sonar: {
      tag: '// EXPERIMENTO 02 • RADAR DE PROJETOS',
      title: 'VARREDURA ACÚSTICA 360°',
      audioOn: 'ÁUDIO SONAR: ATIVO',
      audioMuted: 'ÁUDIO SONAR: MUDO',
      telemetryTag: 'TELEMETRIA DO ALVO //',
      acquired: 'LOCALIZADO',
      contactLabel: 'PROJETO IDENTIFICADO',
      azimuthLabel: 'AZIMUTE',
      distanceLabel: 'ALCANCE',
      specLabel: 'ESPECIFICAÇÃO TÉCNICA',
      manifestLabel: 'ALVOS NO RADAR (5 SISTEMAS)',
    },
    deck: {
      tag: '// EXPERIMENTO 03 • ZERO-G CYBER DECK',
      title: 'CARTUCHO 3D & EJEÇÃO MECÂNICA',
      audioOn: 'ÁUDIO DECK: ATIVO',
      audioMuted: 'ÁUDIO DECK: MUDO',
      docked: 'CARTUCHO: ACOPLADO',
      ejected: 'CARTUCHO: EJETADO',
      dragHint: 'ARRASTE PARA GIRAR 360°',
      dampingLabel: 'INÉRCIA ZERO-G',
      ejectBtn: 'EJETAR CARTUCHO // DECODIFICAR CÓDIGO',
      reinsertBtn: 'ACOPLAR CARTUCHO // TRAVAR MEMÓRIA',
      decryptedHeader: 'MEMÓRIA DECODIFICADA //',
      lockedHeader: 'MEMÓRIA PROTEGIDA //',
      dumpActive: 'DUMP: ATIVO',
      dumpLocked: 'BLOQUEADO',
      lockedCodeComment:
        '// [ACESSO PROTEGIDO]\n// EJETE O CARTUCHO 3D PARA INSPECIONAR O PIPELINE DE STREAMING.',
      keyboardHint: 'TECLADO: [SETAS] GIRAR • [ESPAÇO] EJETAR',
    },
  },
  contact: {
    sectionAria: 'Contato e Envio de Propostas — Bounty Board',
    actTag: '[ ATO IV // BOUNTY BOARD • TRANSMISSÃO DIRETA ]',
    title: 'TRANSMIT A BOUNTY',
    availableBadge: 'DISPONÍVEL PARA PROJETOS DE ALTO IMPACTO',
    leadText:
      'Tem um desafio complexo de engenharia, precisa de uma arquitetura distribuída resiliente ou quer construir uma interface memorável?',
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
    statusValue: `${PROFILE.email} (${PROFILE.location.label})`,
    timestampKey: 'CARIMBO:',
    sendEmailCopy: 'ABRIR NO CLIENTE DE E-MAIL',
    newTransmission: 'NOVA MENSAGEM',
  },
  footer: {
    sectionAria: 'Rodapé do Portfólio e Encerramento',
    ticker:
      '• SEE YOU SPACE COWBOY • 2026 BRINU.DEV • FRANCA / SP • ARQUITETURA DISTRIBUÍDA • PERSONA BRUTALIST UI •',
    badge: 'TRANSMISSÃO CONCLUÍDA // PROTOCOLO BRINU V2',
    signature: '"SEE YOU SPACE COWBOY…"',
    subtitle: "YOU'RE GONNA CARRY THAT WEIGHT.",
    backToTop: 'VOLTAR AO TOPO',
    backToTopAria: 'Voltar suavemente ao topo da página',
    copyright: '© 2026 BRUNO DE ANDRADE DINIS (BRINU) // TODOS OS DIREITOS RESERVADOS.',
    engineeredIn: `PROJETADO & ENGENHEIRADO EM ${PROFILE.location.label.toUpperCase()}`,
    stackLine: 'ASTRO 5 • REACT 19 • TAILWIND V4 • GSAP • THREE.JS • SOLID',
    privacyLine: 'ZERO COOKIES • ZERO RASTREAMENTO • ALTA PERFORMANCE',
  },
  rightClick: {
    dialogAria: 'Alerta de inspeção técnica',
    tag: '// INSPEÇÃO TÉCNICA DETECTADA',
    closeAria: 'Fechar alerta',
    headline: 'Ei visitante! Inspecionando a estrutura pelo botão direito?',
    body: 'Pressione F12 para abrir o DevTools. O recibo completo de telemetria e comandos interativos já estão prontos no console.',
    escHint: 'PRESSIONE [ESC] OU CLIQUE FORA PARA FECHAR',
    readyBadge: 'DEVTOOLS PRONTO',
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
        '"Arquitetura limpa SOLID, código resiliente na nuvem e direção de arte inegociável."',
    },
  },
};

export const enDict = {
  a11y: {
    skipToContent: 'SKIP TO MAIN CONTENT',
  },
  meta: {
    title: 'Bruno Dinis // Brinu — Frontend Developer & Creative Developer',
    description:
      'Portfolio of Bruno de Andrade Dinis (Brinu), Frontend Developer at Magalu Cloud: Astro, React, TypeScript and GSAP motion, based in Franca / SP, Brazil.',
    whoamiTitle: 'Bruno Dinis // Brinu — Confidant Terminal /whoami',
    whoamiDescription:
      'Interactive terminal of Bruno Dinis (Brinu): career, stack and projects.',
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
      lab: '04 // CREATIVE LAB',
      contact: '05 // TRANSMIT A BOUNTY',
      whoami: '06 // TERMINAL /WHOAMI',
    },
    languageLabel: 'INTERFACE LANGUAGE',
    audioLabel: 'WEB AUDIO SYNTHESIS',
    audioOn: 'AUDIO: ON',
    audioMuted: 'AUDIO: MUTED',
    baseLabel: `BASE: ${PROFILE.location.remoteLabel.en.toUpperCase()}`,
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
    },
    p1: 'I DO NOT REALLY REMEMBER WHAT THE WEB WAS BEFORE THIS… AND IN SOME WAYS IT DOES NOT FEEL LIKE WE ARE IN BASE REALITY IN THE CURRENT MOMENT.',
    p2: 'THE ONE THING I AM SURE OF BEYOND SENSORY PERCEPTION IS THAT I AM HERE TO ENGINEER RESILIENT SYSTEMS AND SAVE THE FRONTEND FROM THIS MONOTONOUS RAT RACE.',
    p3Part1: 'THE ',
    p3Highlight1: 'BORING CODE',
    p3Part2: '… IT HAS RULED FOR TOO LONG… FROM ',
    p3Highlight2: 'DISTRIBUTED CLOUD',
    p3Part3: ' PIPELINES TO EXPRESSIVE BRUTALIST INTERFACES… THE ',
    p3Highlight3: 'SPACE COWBOY',
    p3Part4: ' CRAFT HAS FINALLY BEGUN.',
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
    metricLabel: '[ IMPACT ]',
    archiveTag: '// ARCHIVE • SMALLER PROJECTS WITH DEMOS',
    archiveTitle: 'ARCHIVE',
  },
  about: {
    sectionAria: 'Confidant Operator Dossier: Bruno Dinis',
    actTag: '[ ACT II // CONFIDANT DOSSIER • LOG 1996 ]',
    title: 'DOSSIER: BRINU',
    statusBadge: 'STATUS: ACTIVE // DEPLOYED',
    domainLine: PROFILE.tagline.en.toUpperCase(),
    operatorTag: 'OPERATOR: BRINU',
    roleHeading: 'FRONTEND DEVELOPER & MAKER',
    bioP1:
      'Frontend developer on the Magalu Cloud team, building with Astro, React and Tailwind. Before code, I spent 8 years in the Magalu ecosystem between customer service and helpdesk — where I started automating my own work with extensions, dashboards and chatbots.',
    bioP2:
      'Off the clock, I bring art direction to the web: angular interfaces inspired by Persona 5 and Cowboy Bebop, with 60fps motion. Helena\'s dad, based in Franca / SP.',
    portraitAlt: 'Illustrated portrait of Bruno Dinis',
    careerTitle: 'CAREER',
    educationTitle: 'EDUCATION',
    automationsLabel: 'AUTOMATIONS',
    stats: {
      roleLabel: 'CURRENT ROLE //',
      roleValue: PROFILE.role.en,
      baseLabel: 'STATION BASE //',
      baseValue: PROFILE.location.remoteLabel.en,
      coreLabel: 'HUMAN CORE //',
      coreValue: PROFILE.family.en,
      stackLabel: 'CORE ARSENAL //',
      stackValue: 'Astro • React/Next.js • TypeScript • Tailwind • GSAP',
    },
    skillsTag: '// SKILL MATRIX • CONFIDANT RANKS',
    skillsTitle: 'TECHNICAL ARSENAL // 3 DOMAINS',
  },
  lab: {
    sectionAria: 'Creative Lab: Visual Experiments and Synthesized Web Audio',
    actTag: '[ ACT III // CREATIVE LAB • WEBGL, CANVAS & WEB AUDIO ]',
    title: 'CREATIVE LAB',
    statusBadge: 'STATUS: INTERACTIVE // 60FPS',
    domainLine: 'NATIVE WEB AUDIO • SHADERS • THREE.JS • CANVAS 2D',
    indexLabel: 'EXPERIMENTS //',
    navTuner: '01 // CRT TUNER',
    navSonar: '02 // SONAR RADAR',
    navDeck: '03 // 3D CYBER DECK',
    tuner: {
      tag: '// EXPERIMENT 01 • ANALOG FREQUENCY TUNER',
      title: 'RADIO INTERFACE CONTROLLER',
      statusLabel: 'SIGNAL:',
      locked: 'SIGNAL LOCKED',
      searching: 'SEARCHING FREQ',
      noCarrier: 'NO CARRIER',
      scanning: '• • • SCANNING ANALOG FREQUENCIES • • •',
      hint: 'Rotate the dial or click presets to lock onto 92.4, 98.7, or 104.2 MHz.',
      freqLabel: 'CURRENT FREQUENCY',
      dragHint: '[ DRAG DIAL OR USE ARROW KEYS ]',
      presets: {
        crimsonName: 'CRIMSON REBELLION',
        crimsonDesc: 'High-Voltage Crimson Red Channel — Persona Brutalist Mode',
        phantomName: 'STARK MONOCHROME',
        phantomDesc: 'Pure Paper White on Pitch Black High-Contrast Channel',
        noirName: 'OVERDRIVE PULSE',
        noirDesc: 'High-Frequency Analog Pulse Modulation',
      },
    },
    sonar: {
      tag: '// EXPERIMENT 02 • PROJECT SONAR RADAR',
      title: '360° ACOUSTIC SWEEP',
      audioOn: 'SONAR AUDIO: ON',
      audioMuted: 'SONAR AUDIO: MUTED',
      telemetryTag: 'TARGET TELEMETRY //',
      acquired: 'ACQUIRED',
      contactLabel: 'IDENTIFIED SYSTEM',
      azimuthLabel: 'AZIMUTH',
      distanceLabel: 'RANGE',
      specLabel: 'TECHNICAL SPECIFICATION',
      manifestLabel: 'RADAR TARGETS (5 SYSTEMS)',
    },
    deck: {
      tag: '// EXPERIMENT 03 • ZERO-G CYBER DECK',
      title: '3D DATA CASSETTE & MECHANICAL EJECT',
      audioOn: 'DECK AUDIO: ON',
      audioMuted: 'DECK AUDIO: MUTED',
      docked: 'CARTRIDGE: DOCKED',
      ejected: 'CARTRIDGE: EJECTED',
      dragHint: 'DRAG TO ROTATE 360°',
      dampingLabel: 'ZERO-G INERTIA',
      ejectBtn: 'EJECT CARTRIDGE // DECRYPT SOURCE LOGS',
      reinsertBtn: 'DOCK CARTRIDGE // LOCK MEMORY',
      decryptedHeader: 'MEMORY BANK DECRYPTED //',
      lockedHeader: 'PROTECTED CARTRIDGE MEMORY //',
      dumpActive: 'DUMP: ACTIVE',
      dumpLocked: 'LOCKED',
      lockedCodeComment:
        '// [ACCESS PROTECTED]\n// EJECT THE 3D CARTRIDGE TO INSPECT THE STREAMING PIPELINE SOURCE.',
      keyboardHint: 'KEYBOARD: [ARROWS] ROTATE • [SPACE] EJECT',
    },
  },
  contact: {
    sectionAria: 'Contact and Project Proposals — Bounty Board',
    actTag: '[ ACT IV // BOUNTY BOARD • DIRECT TRANSMISSION ]',
    title: 'TRANSMIT A BOUNTY',
    availableBadge: 'AVAILABLE FOR HIGH-IMPACT CONTRACTS',
    leadText:
      'Have a demanding engineering challenge, need a resilient distributed architecture, or want to build an unforgettable interface?',
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
    statusValue: `${PROFILE.email} (${PROFILE.location.label})`,
    timestampKey: 'TIMESTAMP:',
    sendEmailCopy: 'OPEN IN EMAIL CLIENT',
    newTransmission: 'NEW TRANSMISSION',
  },
  footer: {
    sectionAria: 'Portfolio Footer and Sign-off',
    ticker:
      '• SEE YOU SPACE COWBOY • 2026 BRINU.DEV • FRANCA / SP • DISTRIBUTED SYSTEMS • PERSONA BRUTALIST UI •',
    badge: 'TRANSMISSION COMPLETE // BRINU V2 PROTOCOL',
    signature: '"SEE YOU SPACE COWBOY…"',
    subtitle: "YOU'RE GONNA CARRY THAT WEIGHT.",
    backToTop: 'BACK TO TOP',
    backToTopAria: 'Scroll smoothly back to top',
    copyright: '© 2026 BRUNO DE ANDRADE DINIS (BRINU) // ALL RIGHTS RESERVED.',
    engineeredIn: `DESIGNED & ENGINEERED IN ${PROFILE.location.label.toUpperCase()}`,
    stackLine: 'ASTRO 5 • REACT 19 • TAILWIND V4 • GSAP • THREE.JS • SOLID',
    privacyLine: 'NO COOKIES • ZERO TRACKING • PURE BRUTALIST PERFORMANCE',
  },
  rightClick: {
    dialogAria: 'Technical inspection alert',
    tag: '// TECHNICAL INSPECTION DETECTED',
    closeAria: 'Close alert',
    headline: 'Hey visitor! Inspecting the circuits via right-click?',
    body: 'Press F12 to open DevTools. The full telemetry receipt and interactive console commands are waiting for you.',
    escHint: 'PRESS [ESC] OR CLICK OUTSIDE TO CLOSE',
    readyBadge: 'DEVTOOLS READY',
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
        '"Clean SOLID architecture, resilient cloud code, and uncompromising art direction."',
    },
  },
} satisfies TranslationSchema;

export const DICTIONARIES: Record<Locale, TranslationSchema> = {
  'pt-br': ptBrDict,
  en: enDict,
};
