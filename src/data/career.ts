import { formatPeriod, t, type Locale, type Localized, type YearMonth } from './localized.ts';

export type CareerId = 'magalu-cloud' | 'luizalabs';

interface Automation {
  readonly id: string;
  readonly name: string;
  readonly repoUrl: string;
}

export interface CareerEntry {
  readonly id: CareerId;
  readonly org: string;
  readonly start: YearMonth;
  readonly end: YearMonth | 'present';
  readonly automations?: readonly Automation[];
  readonly text: {
    readonly role: Localized<string>;
    readonly summary: Localized<string>;
    readonly details: readonly Localized<string>[];
    readonly hardSkills: readonly Localized<string>[];
    readonly softSkills: readonly Localized<string>[];
  };
}

export type EducationId = 'ampli' | 'ebac' | 'full-stack-club' | 'alura';

export interface EducationEntry {
  readonly id: EducationId;
  readonly institution: string;
  readonly start: YearMonth;
  readonly end: YearMonth | 'present' | null;
  readonly completed: boolean;
  readonly text: { readonly course: Localized<string> };
}

export interface LocalizedCareerEntry {
  id: CareerId;
  org: string;
  role: string;
  summary: string;
  details: string[];
  hardSkills: string[];
  softSkills: string[];
  period: string;
  automations: Automation[];
}

export interface LocalizedEducationEntry {
  id: EducationId;
  institution: string;
  course: string;
  period: string;
  status: string;
}

export const CAREER: readonly CareerEntry[] = [
  {
    id: 'magalu-cloud',
    org: 'Magalu Cloud',
    start: '2025-12',
    end: 'present',
    text: {
      role: t('Desenvolvedor de front-end', 'Frontend Developer'),
      summary: t(
        'Time de front-end do site institucional da Magalu Cloud, com Astro, React e Tailwind.',
        'Frontend team behind the Magalu Cloud corporate website, with Astro, React and Tailwind.'
      ),
      details: [
        t('Construo o site institucional da Magalu Cloud, no time de front-end e em trabalho remoto.', 'I build the Magalu Cloud corporate website with the frontend team, working remotely.'),
        t('Uso Astro e Next.js, em TypeScript, com conteúdo no Strapi CMS.', 'I use Astro and Next.js in TypeScript, with content in Strapi CMS.'),
        t('Implemento a partir de protótipos no Figma e versiono no GitLab.', 'I implement from Figma prototypes and version on GitLab.'),
      ],
      hardSkills: [t('Astro', 'Astro'), t('Next.js', 'Next.js'), t('TypeScript', 'TypeScript'), t('Strapi CMS', 'Strapi CMS'), t('Figma', 'Figma'), t('GitLab', 'GitLab'), t('Python', 'Python')],
      softSkills: [],
    },
  },
  {
    id: 'luizalabs',
    org: 'luizalabs',
    start: '2019-11',
    end: '2025-11',
    automations: [
      { id: 'consulta-cnpj', name: 'Consulta CNPJ', repoUrl: 'https://github.com/BrunoAndradeDinis/consultaCNPJ' },
      { id: 'sheet-script-form', name: 'sheetScriptForm', repoUrl: 'https://github.com/BrunoAndradeDinis/sheetScriptForm' },
      { id: 'mapa-de-desempenho', name: 'Mapa de Desempenho', repoUrl: 'https://github.com/BrunoAndradeDinis/mapaDeDesempenho' },
    ],
    text: {
      role: t('Assistente de helpdesk II', 'Helpdesk Assistant II'),
      summary: t(
        'Automação de processos e desenvolvimento de ferramentas internas para o ecossistema Magalu: extensões de navegador, dashboards no Looker Studio com BigQuery e aplicações em Apps Script.',
        'Workflow automation and internal tooling across the Magalu ecosystem: browser extensions, Looker Studio dashboards backed by BigQuery, and Apps Script applications.'
      ),
      details: [
        t('Criei duas extensões de navegador: consulta de CNPJ pela API da CNPJA e consulta de dados e jornada de colaboradores internos.', 'Built two browser extensions: CNPJ lookup through the CNPJA API and a lookup of internal employee data and work-shift status.'),
        t('Colaborei em dashboards no Looker Studio com BigQuery e Google Sheets, e numa tabela interativa em Apps Script.', 'Contributed to Looker Studio dashboards backed by BigQuery and Google Sheets, and to an interactive Apps Script table.'),
        t('Criei um chatbot interno no Dialogflow para os processos do dia a dia e repassei o uso a outros colaboradores.', 'Built an internal Dialogflow chatbot for day-to-day processes and handed its use over to other colleagues.'),
        t('Registrei e tratei chamados sistêmicos e operacionais de lojas, escritórios e CDs no Zendesk, com foco em resolver no primeiro atendimento (first call resolution) ou encaminhar às squads responsáveis.', 'Logged and handled systemic and operational tickets from stores, offices and distribution centers in Zendesk, aiming at first call resolution or routing to the responsible squads.'),
      ],
      hardSkills: [t('Extensões de navegador', 'Browser extensions'), t('Google Sheets e Apps Script', 'Google Sheets and Apps Script'), t('Looker Studio e BigQuery', 'Looker Studio and BigQuery'), t('Dialogflow', 'Dialogflow'), t('Google Workspace', 'Google Workspace'), t('Zendesk', 'Zendesk')],
      softSkills: [t('Foco em resolver no primeiro contato', 'Focus on first-contact resolution'), t('Ponto focal para dúvidas de processo', 'Go-to contact for process questions'), t('Repassar o que construí a outros colaboradores', 'Handing what I built over to colleagues')],
    },
  },
];

export const EDUCATION: readonly EducationEntry[] = [
  {
    id: 'ebac',
    institution: 'EBAC',
    start: '2024-11',
    end: '2026-06',
    completed: true,
    text: { course: t('Engenheiro de Front-end', 'Frontend Engineer') },
  },
  {
    id: 'ampli',
    institution: 'Ampli - Anhanguera',
    start: '2023-05',
    end: '2024-12',
    completed: true,
    text: { course: t('Desenvolvimento Web', 'Web Development') },
  },
  {
    id: 'full-stack-club',
    institution: 'Full Stack Club',
    start: '2025-06',
    end: 'present',
    completed: false,
    text: { course: t('Developer Fullstack', 'Fullstack Developer') },
  },
  {
    id: 'alura',
    institution: 'Alura',
    start: '2022-05',
    end: '2023-02',
    completed: true,
    text: { course: t('Formação técnica em programação', 'Technical programming track') },
  },
];

const STATUS = {
  completed: t('Concluído', 'Completed'),
  inProgress: t('Em andamento', 'In progress'),
};

export function getLocalizedCareer(locale: Locale): LocalizedCareerEntry[] {
  return CAREER.map((entry) => ({
    id: entry.id,
    org: entry.org,
    role: entry.text.role[locale],
    summary: entry.text.summary[locale],
    details: entry.text.details.map((item) => item[locale]),
    hardSkills: entry.text.hardSkills.map((item) => item[locale]),
    softSkills: entry.text.softSkills.map((item) => item[locale]),
    period: formatPeriod(locale, entry.start, entry.end),
    automations: [...(entry.automations ?? [])],
  }));
}

export function getLocalizedEducation(locale: Locale): LocalizedEducationEntry[] {
  return EDUCATION.map((entry) => ({
    id: entry.id,
    institution: entry.institution,
    course: entry.text.course[locale],
    period: formatPeriod(locale, entry.start, entry.end),
    status: (entry.completed ? STATUS.completed : STATUS.inProgress)[locale],
  }));
}
