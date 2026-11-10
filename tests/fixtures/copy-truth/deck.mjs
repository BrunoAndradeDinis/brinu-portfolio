export const SOURCES = {
  linkedin: 'LinkedIn profile read 2026-11-09 (About, Experience, Skills, Certifications)',
  github: 'github.com/BrunoAndradeDinis, 76 public repositories read 2026-11-09',
  magaluCloud: 'public https://magalu.cloud/ HTML, as recorded in src/data/cases.ts',
};

export const KNOWN_TECH = [
  'Astro', 'React', 'Next.js', 'Tailwind', 'TypeScript', 'Strapi', 'Figma', 'GitLab', 'Python',
  'Zendesk', 'Oracle', 'Apps Script', 'Dialogflow', 'Looker', 'BigQuery', 'ClearSale', 'Vue', 'Node',
];

export const CAREER_DECK = {
  'magalu-cloud': {
    org: 'Magalu Cloud',
    role: { 'pt-br': 'Desenvolvedor de front-end', en: 'Frontend Developer' },
    start: '2025-12',
    end: 'present',
    allowedStack: ['Astro', 'React', 'Next.js', 'Tailwind', 'TypeScript', 'Strapi', 'Figma', 'GitLab', 'Python'],
    hardSkills: [
      { 'pt-br': 'Astro', en: 'Astro', source: 'linkedin' },
      { 'pt-br': 'Next.js', en: 'Next.js', source: 'linkedin' },
      { 'pt-br': 'TypeScript', en: 'TypeScript', source: 'linkedin' },
      { 'pt-br': 'Strapi CMS', en: 'Strapi CMS', source: 'linkedin' },
      { 'pt-br': 'Figma', en: 'Figma', source: 'linkedin' },
      { 'pt-br': 'GitLab', en: 'GitLab', source: 'linkedin' },
      { 'pt-br': 'Python', en: 'Python', source: 'linkedin' },
    ],
    duties: [
      { id: 'site', source: 'magaluCloud', tokens: { 'pt-br': ['site institucional', 'time de front-end'], en: ['corporate website', 'frontend team'] } },
      { id: 'stack', source: 'linkedin', tokens: { 'pt-br': ['Astro', 'Next.js', 'Strapi'], en: ['Astro', 'Next.js', 'Strapi'] } },
      { id: 'design', source: 'linkedin', tokens: { 'pt-br': ['Figma', 'GitLab'], en: ['Figma', 'GitLab'] } },
    ],
  },
  luizalabs: {
    org: 'luizalabs',
    role: { 'pt-br': 'Assistente de helpdesk II', en: 'Helpdesk Assistant II' },
    start: '2019-11',
    end: '2025-11',
    allowedStack: ['Zendesk', 'Oracle', 'Apps Script', 'Dialogflow', 'Looker', 'BigQuery'],
    hardSkills: [
      { 'pt-br': 'Zendesk', en: 'Zendesk', source: 'linkedin' },
      { 'pt-br': 'Google Workspace', en: 'Google Workspace', source: 'linkedin' },
      { 'pt-br': 'Google Sheets e Apps Script', en: 'Google Sheets and Apps Script', source: 'linkedin' },
      { 'pt-br': 'Looker Studio e BigQuery', en: 'Looker Studio and BigQuery', source: 'linkedin' },
      { 'pt-br': 'Dialogflow', en: 'Dialogflow', source: 'linkedin' },
      { 'pt-br': 'Extensões de navegador', en: 'Browser extensions', source: 'linkedin' },
    ],
    duties: [
      { id: 'tickets', source: 'linkedin', tokens: { 'pt-br': ['Zendesk', 'first call resolution'], en: ['Zendesk', 'first call resolution'] } },
      { id: 'invoices', source: 'linkedin', tokens: { 'pt-br': ['NFs', 'Oracle'], en: ['invoice', 'Oracle'] } },
      { id: 'extensions', source: 'linkedin', tokens: { 'pt-br': ['extensões de navegador', 'CNPJA'], en: ['browser extensions', 'CNPJA'] } },
      { id: 'dashboards', source: 'linkedin', tokens: { 'pt-br': ['Looker Studio', 'BigQuery'], en: ['Looker Studio', 'BigQuery'] } },
      { id: 'chatbot', source: 'linkedin', tokens: { 'pt-br': ['Dialogflow'], en: ['Dialogflow'] } },
      { id: 'contact', source: 'linkedin', tokens: { 'pt-br': ['Ponto focal'], en: ['Go-to contact'] } },
    ],
  },
  'magazine-luiza': {
    org: 'Magazine Luiza',
    role: { 'pt-br': 'Atendente de SAC', en: 'Customer Service Agent' },
    start: '2017-06',
    end: '2019-10',
    allowedStack: ['ClearSale'],
    hardSkills: [
      { 'pt-br': 'Prevenção contra fraude', en: 'Fraud prevention', source: 'linkedin' },
      { 'pt-br': 'ClearSale', en: 'ClearSale', source: 'linkedin' },
      { 'pt-br': 'Chargeback', en: 'Chargebacks', source: 'linkedin' },
      { 'pt-br': 'Correção de NFs', en: 'Invoice corrections', source: 'linkedin' },
    ],
    duties: [
      { id: 'support', source: 'linkedin', tokens: { 'pt-br': ['telefone', 'e-mail'], en: ['phone', 'email'] } },
      { id: 'records', source: 'linkedin', tokens: { 'pt-br': ['site', 'NFs'], en: ['website', 'invoice'] } },
      { id: 'risk', source: 'linkedin', tokens: { 'pt-br': ['ClearSale', 'risco'], en: ['ClearSale', 'risk'] } },
      { id: 'fraud', source: 'linkedin', tokens: { 'pt-br': ['fraude', 'chargeback'], en: ['fraud', 'chargebacks'] } },
      { id: 'sla', source: 'linkedin', tokens: { 'pt-br': ['SLAs', 'CSAT'], en: ['SLAs', 'CSAT'] } },
    ],
  },
};

export const EDUCATION_DECK = {
  ampli: { institution: 'Ampli', course: { 'pt-br': /Desenvolvimento Web/, en: /Web Development/ }, source: 'linkedin' },
  ebac: { institution: 'EBAC', course: { 'pt-br': /Engenheiro.*Front/, en: /Frontend Engineer/ }, source: 'linkedin' },
  'full-stack-club': { institution: 'Full Stack Club', course: { 'pt-br': /Fullstack/i, en: /Fullstack/i }, source: 'linkedin' },
  alura: { institution: 'Alura', course: { 'pt-br': /programação/i, en: /programming/i }, source: 'linkedin' },
};

export const ARSENAL_DECK = {
  TypeScript: { sources: ['linkedin', 'github'] },
  'React / Next.js': { sources: ['linkedin', 'github'] },
  Astro: { sources: ['linkedin'] },
  'Tailwind CSS': { sources: ['linkedin', 'github'] },
  GSAP: { sources: ['github'] },
  'Node.js / Express': { sources: ['github'] },
  'PostgreSQL + Prisma': { sources: ['linkedin', 'github'] },
  MongoDB: { sources: ['linkedin', 'github'] },
  'Object Storage': { sources: ['github'] },
  'FFmpeg / streaming': { unproven: true },
  Jest: { sources: ['github'] },
  Playwright: { unproven: true },
  'Docker Compose': { sources: ['github'] },
  Zod: { sources: ['linkedin'] },
  'Figma / GitLab': { sources: ['linkedin'] },
};
