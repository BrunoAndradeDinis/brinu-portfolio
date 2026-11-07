import { formatPeriod, t, type Locale, type Localized, type YearMonth } from './localized.ts';

export type CareerId = 'magalu-cloud' | 'luizalabs' | 'magazine-luiza';

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
  };
}

export type EducationId = 'ampli' | 'ebac' | 'full-stack-club' | 'alura';

export interface EducationEntry {
  readonly id: EducationId;
  readonly institution: string;
  readonly start: YearMonth;
  readonly end: YearMonth | 'present';
  readonly completed: boolean;
  readonly text: { readonly course: Localized<string> };
}

export interface LocalizedCareerEntry {
  id: CareerId;
  org: string;
  role: string;
  summary: string;
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
        'Chamados de lojas, escritórios e CDs do ecossistema Magalu. Aqui comecei a automatizar o próprio trabalho: extensões de navegador, dashboards e formulários em Apps Script.',
        'Tickets from stores, offices and distribution centers across the Magalu ecosystem. This is where I started automating my own work: browser extensions, dashboards and Apps Script forms.'
      ),
    },
  },
  {
    id: 'magazine-luiza',
    org: 'Magazine Luiza',
    start: '2017-06',
    end: '2019-10',
    text: {
      role: t('Atendente de SAC', 'Customer Service Agent'),
      summary: t(
        'Pós-venda por telefone e e-mail, análise antifraude e chargeback.',
        'After-sales support by phone and email, fraud analysis and chargebacks.'
      ),
    },
  },
];

export const EDUCATION: readonly EducationEntry[] = [
  {
    id: 'ampli',
    institution: 'Ampli',
    start: '2023-05',
    end: '2024-12',
    completed: true,
    text: { course: t('CST em Desenvolvimento Web', 'Associate Degree in Web Development') },
  },
  {
    id: 'ebac',
    institution: 'EBAC',
    start: '2024-11',
    end: '2026-06',
    completed: true,
    text: { course: t('Engenheiro de Front-end', 'Frontend Engineer') },
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
    end: 'present',
    completed: false,
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
