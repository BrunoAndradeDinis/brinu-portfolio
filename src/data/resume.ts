import { PROFILE } from './profile.ts';
import { getLocalizedCareer, getLocalizedEducation, type CareerId } from './career.ts';
import { getLocalizedCases, type MainCaseId } from './cases.ts';
import { DICTIONARIES } from '../i18n/dictionaries.ts';
import { t, type Locale, type Localized } from './localized.ts';

type Keyword = string | Localized<string>;

interface SkillGroup {
  readonly label: Localized<string>;
  readonly keywords: readonly Keyword[];
}

const HEADLINE = t(
  'Desenvolvedor Frontend | Full Stack | React | Next.js | TypeScript',
  'Frontend Developer | Full Stack | React | Next.js | TypeScript'
);

const LOCATION = t('Franca, SP, Brasil | Disponível para trabalho remoto', 'Franca, SP, Brazil | Open to remote work');

const SUMMARY = t(
  'Desenvolvedor Frontend e Full Stack com experiência em TypeScript, JavaScript, React, Next.js e Astro. No time de front-end da Magalu Cloud, desenvolvo o site institucional com Astro, Next.js e Tailwind CSS, implementando interfaces responsivas a partir de protótipos no Figma, com conteúdo no Strapi CMS e versionamento no GitLab. Em projetos full stack, construo APIs REST com Node.js e Express, modelo dados com PostgreSQL, Prisma e MongoDB, valido com Zod, escrevo testes automatizados com Jest e Playwright e uso Docker Compose e Object Storage (S3) na Magalu Cloud. No ecossistema Magalu desde 2019, com histórico em automação de processos com Google Apps Script, BigQuery e Looker Studio.',
  'Frontend and Full Stack Developer experienced in TypeScript, JavaScript, React, Next.js and Astro. On the Magalu Cloud frontend team, I build the corporate website with Astro, Next.js and Tailwind CSS, implementing responsive interfaces from Figma prototypes, with content in Strapi CMS and version control on GitLab. In full stack projects, I build REST APIs with Node.js and Express, model data with PostgreSQL, Prisma and MongoDB, validate with Zod, write automated tests with Jest and Playwright, and use Docker Compose and Object Storage (S3) on Magalu Cloud. Part of the Magalu ecosystem since 2019, with a track record in process automation using Google Apps Script, BigQuery and Looker Studio.'
);

const SKILL_GROUPS: readonly SkillGroup[] = [
  { label: t('Linguagens', 'Languages'), keywords: ['TypeScript', 'JavaScript', 'HTML5', 'CSS3', 'SQL', 'Python'] },
  { label: t('Frontend', 'Frontend'), keywords: ['React', 'Next.js', 'Astro', 'Tailwind CSS', 'Redux Toolkit', 'RTK Query', 'styled-components', 'Formik', 'Yup', 'GSAP', t('Design Responsivo', 'Responsive Design'), t('Acessibilidade (WCAG)', 'Accessibility (WCAG)')] },
  { label: t('Backend e Banco de Dados', 'Backend and Databases'), keywords: ['Node.js', 'Express', t('APIs REST', 'REST APIs'), 'Server Actions', 'WebSocket', 'JWT', 'Prisma', 'PostgreSQL', 'MongoDB'] },
  { label: t('Cloud e DevOps', 'Cloud and DevOps'), keywords: ['Magalu Cloud', 'Object Storage (S3)', 'Docker Compose', 'FFmpeg', 'Git', 'GitLab', 'GitHub'] },
  { label: t('Testes e Qualidade', 'Testing and Quality'), keywords: ['Jest', 'Playwright', t('Testes E2E', 'E2E Testing'), 'Zod'] },
  { label: t('Ferramentas', 'Tools'), keywords: ['Figma', 'Strapi CMS', 'Google Apps Script', 'BigQuery', 'Looker Studio', 'Dialogflow', 'Zendesk'] },
];

const ACHIEVEMENTS: Readonly<Record<CareerId, readonly Localized<string>[]>> = {
  'magalu-cloud': [
    t('Desenvolvo e mantenho o site institucional da Magalu Cloud (magalu.cloud) no time de front-end, em regime remoto.', 'Develop and maintain the Magalu Cloud corporate website (magalu.cloud) on the frontend team, working remotely.'),
    t('Implemento páginas e componentes com Astro, Next.js, React, TypeScript e Tailwind CSS a partir de protótipos no Figma.', 'Implement pages and components with Astro, Next.js, React, TypeScript and Tailwind CSS from Figma prototypes.'),
    t('Integro conteúdo gerenciado no Strapi CMS (headless CMS) e versiono o código no GitLab.', 'Integrate content managed in Strapi CMS (headless CMS) and version code on GitLab.'),
  ],
  luizalabs: [
    t('Desenvolvi duas extensões de navegador para uso interno: consulta de CNPJ via API da CNPJA e consulta de dados e jornada de colaboradores.', 'Developed two internal browser extensions: CNPJ lookup through the CNPJA API and a lookup of employee data and work-shift status.'),
    t('Colaborei na construção de dashboards no Looker Studio com BigQuery e Google Sheets, e de uma tabela interativa em Google Apps Script.', 'Contributed to Looker Studio dashboards backed by BigQuery and Google Sheets, and to an interactive Google Apps Script table.'),
    t('Criei um chatbot interno no Dialogflow para os processos do dia a dia e repassei o uso a outros colaboradores.', 'Built an internal Dialogflow chatbot for day-to-day processes and handed its use over to other colleagues.'),
    t('Tratei chamados sistêmicos e operacionais de lojas, escritórios e centros de distribuição no Zendesk, com foco em first call resolution e escalonamento para as squads responsáveis.', 'Handled systemic and operational tickets from stores, offices and distribution centers in Zendesk, focusing on first call resolution and escalation to the responsible squads.'),
  ],
};

const TECHNOLOGIES = t('Tecnologias', 'Technologies');

const PROJECT_IDS: readonly MainCaseId[] = ['uriana', 'aurastream', 'efood'];

const RULE = '-'.repeat(60);

function keyword(value: Keyword, locale: Locale): string {
  return typeof value === 'string' ? value : value[locale];
}

export function buildResume(locale: Locale): string {
  const labels = DICTIONARIES[locale].whoami.resume;
  const heading = (title: string) => ['', title, RULE];
  const projects = getLocalizedCases(locale).filter((project) => (PROJECT_IDS as readonly string[]).includes(project.id));
  return [
    PROFILE.fullName.toUpperCase(),
    HEADLINE[locale],
    LOCATION[locale],
    `E-mail: ${PROFILE.email} | GitHub: ${PROFILE.github.url}`,
    `LinkedIn: ${PROFILE.linkedin.url}`,
    ...heading(labels.summary),
    SUMMARY[locale],
    ...heading(labels.skills),
    ...SKILL_GROUPS.map((group) => `${group.label[locale]}: ${group.keywords.map((value) => keyword(value, locale)).join(', ')}`),
    ...heading(labels.experience),
    ...getLocalizedCareer(locale).flatMap((entry, index) => [
      ...(index > 0 ? [''] : []),
      `${entry.role} | ${entry.org} | ${entry.period}`,
      ...ACHIEVEMENTS[entry.id].map((achievement) => `- ${achievement[locale]}`),
      ...(entry.hardSkills.length > 0 ? [`- ${TECHNOLOGIES[locale]}: ${entry.hardSkills.join(', ')}`] : []),
    ]),
    ...heading(labels.projects),
    ...projects.flatMap((project, index) => [
      ...(index > 0 ? [''] : []),
      `${project.title} | ${project.subtitle.replaceAll(' • ', ' - ')}`,
      `- ${project.description}`,
      `- ${project.solution}`,
      `- Stack: ${project.stack.join(', ')}`,
    ]),
    ...heading(labels.education),
    ...getLocalizedEducation(locale).map((entry) => `${entry.course} | ${entry.institution} | ${entry.period} | ${entry.status}`),
  ].join('\n');
}
