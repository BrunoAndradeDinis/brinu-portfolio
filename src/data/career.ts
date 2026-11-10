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
  readonly end: YearMonth | 'present';
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
        t('Desenvolvimento do site institucional da Magalu Cloud, em time de front-end e em trabalho remoto.', 'Building the Magalu Cloud corporate website as part of the frontend team, working remotely.'),
        t('Interfaces com Astro e Next.js, em TypeScript, com conteúdo gerenciado no Strapi CMS.', 'Interfaces built with Astro and Next.js in TypeScript, with content managed in Strapi CMS.'),
        t('Implementação a partir de protótipos no Figma e versionamento no GitLab.', 'Implementation from Figma prototypes, with versioning on GitLab.'),
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
        'Chamados de lojas, escritórios e CDs do ecossistema Magalu. Aqui comecei a automatizar o próprio trabalho: extensões de navegador, dashboards e formulários em Apps Script.',
        'Tickets from stores, offices and distribution centers across the Magalu ecosystem. This is where I started automating my own work: browser extensions, dashboards and Apps Script forms.'
      ),
      details: [
        t('Registro e tratativa de chamados sistêmicos e operacionais de lojas, escritórios e CDs, no Zendesk, com foco em resolver já no primeiro atendimento (first call resolution) ou encaminhar às squads responsáveis.', 'Logging and handling systemic and operational tickets from stores, offices and distribution centers in Zendesk, aiming at first call resolution or routing to the responsible squads.'),
        t('Correção de NFs, reprocessamento de pedidos e atualização de cadastros no Oracle.', 'Invoice corrections, order reprocessing and record updates in Oracle.'),
        t('Criei duas extensões de navegador: consulta de CNPJ pela API da CNPJA e consulta de dados e jornada de colaboradores internos.', 'Built two browser extensions: CNPJ lookup through the CNPJA API and a lookup of internal employee data and work-shift status.'),
        t('Colaborei em dashboards no Looker Studio com BigQuery e Google Sheets, e numa tabela interativa em Apps Script.', 'Contributed to Looker Studio dashboards backed by BigQuery and Google Sheets, and to an interactive Apps Script table.'),
        t('Criei um chatbot interno no Dialogflow para os processos do dia a dia e ensinei outros colaboradores a mantê-lo.', 'Built an internal Dialogflow chatbot for day-to-day processes and taught other colleagues how to maintain it.'),
        t('Ponto focal para dúvidas sobre processos de venda em erros sistêmicos.', 'Go-to contact for questions about sales processes during systemic errors.'),
      ],
      hardSkills: [t('Zendesk', 'Zendesk'), t('Google Workspace', 'Google Workspace'), t('Google Sheets e Apps Script', 'Google Sheets and Apps Script'), t('Looker Studio e BigQuery', 'Looker Studio and BigQuery'), t('Dialogflow', 'Dialogflow'), t('Extensões de navegador', 'Browser extensions')],
      softSkills: [t('Foco em resolver no primeiro contato', 'Focus on first-contact resolution'), t('Ponto focal para dúvidas de processo', 'Go-to contact for process questions'), t('Ensinar o que construí a outros colaboradores', 'Teaching colleagues what I built')],
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
      details: [
        t('Atendimento por telefone e e-mail, resolvendo intercorrências de pós-venda.', 'Phone and email support, resolving after-sales issues.'),
        t('Atualização cadastral de clientes do site e do app, correção de NFs e reprocessamento de pedidos.', 'Customer record updates for the website and app, invoice corrections and order reprocessing.'),
        t('Análise de risco de pedidos na aprovação, com decisões baseadas na ClearSale.', 'Order risk analysis at approval, with decisions based on ClearSale.'),
        t('Análise de suspeitas de fraude, fraudes confirmadas e chargeback em compras no cartão de crédito.', 'Analysis of suspected fraud, confirmed fraud and chargebacks on credit card orders.'),
        t('Cumprimento de SLAs e metas do backlog de chamados, com foco em qualidade e CSAT.', 'Meeting SLAs and ticket backlog targets, focused on quality and CSAT.'),
      ],
      hardSkills: [t('Prevenção contra fraude', 'Fraud prevention'), t('ClearSale', 'ClearSale'), t('Chargeback', 'Chargebacks'), t('Correção de NFs', 'Invoice corrections')],
      softSkills: [t('Comunicação', 'Communication'), t('Cumprimento de SLAs e metas', 'Meeting SLAs and targets'), t('Foco em qualidade e CSAT', 'Focus on quality and CSAT')],
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
