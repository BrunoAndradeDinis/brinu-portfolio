import { t, type Locale, type Localized } from './localized.ts';

export type ArchiveId =
  | 'jokenpo'
  | 'lista-de-contatos'
  | 'the-warriors'
  | 'armazem-do-pierre'
  | 'vue-apps'
  | 'doutor-agenda'
  | 'quake-log-parser'
  | 'brinu-portfolio-v2';

interface ArchiveLinkDefinition {
  readonly type: 'github' | 'demo';
  readonly url: string;
  readonly label: Localized<string>;
}

export interface ArchiveEntry {
  readonly id: ArchiveId;
  readonly stack: readonly string[];
  readonly links: readonly ArchiveLinkDefinition[];
  readonly inProgress?: true;
  readonly text: {
    readonly title: Localized<string>;
    readonly description: Localized<string>;
  };
}

export interface LocalizedArchiveEntry {
  id: ArchiveId;
  title: string;
  description: string;
  status: string | null;
  stack: string[];
  links: { type: 'github' | 'demo'; url: string; label: string }[];
}

const REPO = t('REPO', 'REPO');
const DEMO = t('DEMO', 'DEMO');
const IN_PROGRESS = t('Em construção', 'In progress');

export const ARCHIVE: readonly ArchiveEntry[] = [
  {
    id: 'jokenpo',
    stack: ['Next.js 14', 'TypeScript', 'Tailwind CSS'],
    links: [
      { type: 'github', url: 'https://github.com/BrunoAndradeDinis/jokenpo', label: REPO },
      { type: 'demo', url: 'https://jokenpo-three-psi.vercel.app', label: DEMO },
    ],
    text: {
      title: t('Jokenpo — Arena Franky', 'Jokenpo — Franky Arena'),
      description: t(
        'Pedra, papel e tesoura contra o computador, com placar e feedback a cada rodada.',
        'Rock, paper, scissors against the computer, with a scoreboard and feedback every round.'
      ),
    },
  },
  {
    id: 'lista-de-contatos',
    stack: ['React 19', 'TypeScript', 'Redux Toolkit', 'React Router', 'Vite'],
    links: [
      { type: 'github', url: 'https://github.com/BrunoAndradeDinis/lista-de-contatos', label: REPO },
      { type: 'demo', url: 'https://lista-de-contatos-swart-tau.vercel.app', label: DEMO },
    ],
    text: {
      title: t('Lista de Contatos', 'Contact List'),
      description: t(
        'CRUD de contatos com categorias, favoritos, filtros e persistência no navegador.',
        'Contact CRUD with categories, favorites, filters and in-browser persistence.'
      ),
    },
  },
  {
    id: 'the-warriors',
    stack: ['SCSS', 'jQuery', 'Slick', 'Gulp'],
    links: [
      { type: 'github', url: 'https://github.com/BrunoAndradeDinis/TheWarriors', label: REPO },
      { type: 'demo', url: 'https://the-warriors-gamma.vercel.app', label: DEMO },
    ],
    text: {
      title: t('The Warriors', 'The Warriors'),
      description: t(
        'Landing page do filme, responsiva, com carrossel e build automatizado no Gulp.',
        'Responsive landing page for the film, with a carousel and an automated Gulp build.'
      ),
    },
  },
  {
    id: 'armazem-do-pierre',
    stack: ['HTML', 'CSS', 'jQuery Validate', 'jQuery Mask'],
    links: [
      { type: 'github', url: 'https://github.com/BrunoAndradeDinis/exercicio_modulo14', label: REPO },
      { type: 'demo', url: 'https://armazem-do-pierre.vercel.app', label: DEMO },
    ],
    text: {
      title: t('Armazém do Pierre', "Pierre's General Store"),
      description: t(
        'Página inspirada em Stardew Valley, com carrosséis e formulário validado e mascarado.',
        'Stardew Valley inspired page, with carousels and a validated, masked form.'
      ),
    },
  },
  {
    id: 'vue-apps',
    stack: ['Vue 3', 'JavaScript'],
    links: [
      { type: 'github', url: 'https://github.com/BrunoAndradeDinis/to-do-list', label: t('REPO TO-DO', 'TO-DO REPO') },
      { type: 'demo', url: 'https://to-do-list-vue-js-orcin.vercel.app', label: t('DEMO TO-DO', 'TO-DO DEMO') },
      { type: 'github', url: 'https://github.com/BrunoAndradeDinis/calc-vue', label: t('REPO CALCULADORA', 'CALCULATOR REPO') },
      { type: 'demo', url: 'https://calc-vue-two.vercel.app', label: t('DEMO CALCULADORA', 'CALCULATOR DEMO') },
    ],
    text: {
      title: t('Apps em Vue', 'Vue Apps'),
      description: t('Lista de tarefas e calculadora aritmética em Vue.', 'To-do list and arithmetic calculator in Vue.'),
    },
  },
  {
    id: 'doutor-agenda',
    stack: ['Next.js', 'TypeScript', 'Drizzle ORM', 'PostgreSQL', 'better-auth'],
    links: [{ type: 'github', url: 'https://github.com/BrunoAndradeDinis/doutor-agenda', label: REPO }],
    inProgress: true,
    text: {
      title: t('Doutor Agenda', 'Doutor Agenda'),
      description: t(
        'Agenda de clínicas com autenticação e schema de médicos, pacientes e consultas.',
        'Clinic scheduling app with authentication and a schema for doctors, patients and appointments.'
      ),
    },
  },
  {
    id: 'quake-log-parser',
    stack: ['Node.js', 'TypeScript', 'Express', 'MongoDB', 'Jest', 'Docker Compose', 'Swagger'],
    links: [{ type: 'github', url: 'https://github.com/BrunoAndradeDinis/quake-log-backend-node', label: REPO }],
    text: {
      title: t('Quake Log Parser API', 'Quake Log Parser API'),
      description: t(
        'API REST que transforma logs do Quake III Arena em estatísticas no MongoDB, com cobertura mínima de 80% imposta pelo Jest.',
        'REST API that turns Quake III Arena logs into statistics in MongoDB, with a minimum 80% coverage enforced by Jest.'
      ),
    },
  },
  {
    id: 'brinu-portfolio-v2',
    stack: ['Astro 7', 'TypeScript', 'GSAP', 'Tailwind CSS', 'Playwright'],
    links: [{ type: 'github', url: 'https://github.com/BrunoAndradeDinis/brinu-portfolio', label: REPO }],
    text: {
      title: t('Este portfólio', 'This portfolio'),
      description: t(
        'Este site: Astro com ilhas, motion em GSAP e testes de ponta a ponta em Playwright.',
        'This site: Astro with islands, GSAP motion and end-to-end tests in Playwright.'
      ),
    },
  },
];

export function getLocalizedArchive(locale: Locale): LocalizedArchiveEntry[] {
  return ARCHIVE.map((entry) => ({
    id: entry.id,
    title: entry.text.title[locale],
    description: entry.text.description[locale],
    status: entry.inProgress ? IN_PROGRESS[locale] : null,
    stack: [...entry.stack],
    links: entry.links.map((link) => ({ type: link.type, url: link.url, label: link.label[locale] })),
  }));
}
