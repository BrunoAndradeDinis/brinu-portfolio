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
      { id: 'site', approved: { 'pt-br': 'Construo o site institucional da Magalu Cloud, no time de front-end e em trabalho remoto.', en: 'I build the Magalu Cloud corporate website with the frontend team, working remotely.' }, source: 'magaluCloud', ref: 'Time de front-end do site institucional da Magalu Cloud', tokens: { 'pt-br': ['site institucional', 'time de front-end'], en: ['corporate website', 'frontend team'] } },
      { id: 'stack', approved: { 'pt-br': 'Uso Astro e Next.js, em TypeScript, com conteúdo no Strapi CMS.', en: 'I use Astro and Next.js in TypeScript, with content in Strapi CMS.' }, source: 'linkedin', ref: 'Astro, Next.js e Strapi CMS, competências listadas no cargo', tokens: { 'pt-br': ['Astro', 'Next.js', 'Strapi'], en: ['Astro', 'Next.js', 'Strapi'] } },
      { id: 'design', approved: { 'pt-br': 'Implemento a partir de protótipos no Figma e versiono no GitLab.', en: 'I implement from Figma prototypes and version on GitLab.' }, source: 'linkedin', ref: 'Figma e GitLab, competências listadas no cargo', tokens: { 'pt-br': ['Figma', 'GitLab'], en: ['Figma', 'GitLab'] } },
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
      { id: 'tickets', approved: { 'pt-br': 'Registrei e tratei chamados sistêmicos e operacionais de lojas, escritórios e CDs no Zendesk, com foco em resolver no primeiro atendimento (first call resolution) ou encaminhar às squads responsáveis.', en: 'Logged and handled systemic and operational tickets from stores, offices and distribution centers in Zendesk, aiming at first call resolution or routing to the responsible squads.' }, source: 'linkedin', ref: 'Registro e tratativa de chamados referente a problemas sistêmicos e operacionais de lojas, escritórios e CDs dentro do ecossistema Magalu e do CRM zendesk; responsável pelo atendimento backlog, pós vendas, chat, com foco no First call resolution, e redirecionamento para as squads responsáveis', tokens: { 'pt-br': ['Zendesk', 'first call resolution'], en: ['Zendesk', 'first call resolution'] } },
      { id: 'invoices', approved: { 'pt-br': 'Corrigi NFs, reprocessei pedidos e atualizei cadastros no Oracle.', en: 'Corrected invoices, reprocessed orders and updated records in Oracle.' }, source: 'linkedin', ref: 'Correção de NFs e reprocessamento de pedidos; criação e atualização de cadastros do sistema oracle', tokens: { 'pt-br': ['NFs', 'Oracle'], en: ['invoice', 'Oracle'] } },
      { id: 'extensions', approved: { 'pt-br': 'Criei duas extensões de navegador: consulta de CNPJ pela API da CNPJA e consulta de dados e jornada de colaboradores internos.', en: 'Built two browser extensions: CNPJ lookup through the CNPJA API and a lookup of internal employee data and work-shift status.' }, source: 'linkedin', ref: 'Responsável pela criação de 2 extensões de navegadores, uma para consulta de cnpj utilizando a API da CNPJA e outra de consulta de dados de colaboradores internos e seu status de jornada de trabalho', tokens: { 'pt-br': ['extensões de navegador', 'CNPJA'], en: ['browser extensions', 'CNPJA'] } },
      { id: 'dashboards', approved: { 'pt-br': 'Colaborei em dashboards no Looker Studio com BigQuery e Google Sheets, e numa tabela interativa em Apps Script.', en: 'Contributed to Looker Studio dashboards backed by BigQuery and Google Sheets, and to an interactive Apps Script table.' }, source: 'linkedin', ref: 'Colaborei em alguns Dashboards através do looker studio com consulta através do BigQuery e google sheets, e criamos uma tabela interativa com google scripts', tokens: { 'pt-br': ['Looker Studio', 'BigQuery'], en: ['Looker Studio', 'BigQuery'] } },
      { id: 'chatbot', approved: { 'pt-br': 'Criei um chatbot interno no Dialogflow para os processos do dia a dia e repassei o uso a outros colaboradores.', en: 'Built an internal Dialogflow chatbot for day-to-day processes and handed its use over to other colleagues.' }, source: 'linkedin', ref: 'Responsável pela criação de um chatbot de uso interno sobre os processos do dia-a-dia, com Dialogflow, e repassei como funciona a ferramenta a outros colaboradores', tokens: { 'pt-br': ['Dialogflow'], en: ['Dialogflow'] } },
      { id: 'contact', approved: { 'pt-br': 'Fui ponto focal para dúvidas sobre processos de venda em erros sistêmicos.', en: 'Was the go-to contact for questions about sales processes during systemic errors.' }, source: 'linkedin', ref: 'Ponto focal ativo para dúvidas em relação aos processos e procedimentos de vendas no caso de erros sistêmicos', tokens: { 'pt-br': ['Ponto focal'], en: ['Go-to contact'] } },
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
      { id: 'support', approved: { 'pt-br': 'Atendi clientes por telefone e e-mail, resolvendo intercorrências de pós-venda.', en: 'Supported customers by phone and email, resolving after-sales issues.' }, source: 'linkedin', ref: 'Atendimento ao cliente pelos canais telefônicos e via e-mail, buscando soluções eficientes para as intercorrências de pós vendas que os clientes apresentavam', tokens: { 'pt-br': ['telefone', 'e-mail'], en: ['phone', 'email'] } },
      { id: 'records', approved: { 'pt-br': 'Atualizei cadastros de clientes do site e do app, corrigi NFs e reprocessei pedidos.', en: 'Updated customer records for the website and app, corrected invoices and reprocessed orders.' }, source: 'linkedin', ref: 'Responsável por atualizações cadastrais dos clientes de site/APP; correção de NFs e reprocessamento de pedidos', tokens: { 'pt-br': ['site', 'NFs'], en: ['website', 'invoice'] } },
      { id: 'risk', approved: { 'pt-br': 'Analisei o risco dos pedidos na aprovação, decidindo com base na ClearSale.', en: 'Analyzed order risk at approval, deciding based on ClearSale.' }, source: 'linkedin', ref: 'Análise de risco dos pedidos na etapa de aprovação, tomando decisões com base na ClearSale (sistema de soluções antifraude)', tokens: { 'pt-br': ['ClearSale', 'risco'], en: ['ClearSale', 'risk'] } },
      { id: 'fraud', approved: { 'pt-br': 'Analisei suspeitas de fraude, fraudes confirmadas e chargeback em compras no cartão de crédito.', en: 'Analyzed suspected fraud, confirmed fraud and chargebacks on credit card orders.' }, source: 'linkedin', ref: 'Análise de suspeitas de fraudes, fraudes confirmadas e chargeback de pedidos feitos via cartão de crédito', tokens: { 'pt-br': ['fraude', 'chargeback'], en: ['fraud', 'chargebacks'] } },
      { id: 'sla', approved: { 'pt-br': 'Cumpri SLAs e metas do backlog de chamados, com foco em qualidade e CSAT.', en: 'Met SLAs and ticket backlog targets, focused on quality and CSAT.' }, source: 'linkedin', ref: 'Responsável por garantir o cumprimento dos SLAs, entrega das metas sobre o backlog de chamados, focado na qualidade e no alto nível de CSAT dos atendimentos', tokens: { 'pt-br': ['SLAs', 'CSAT'], en: ['SLAs', 'CSAT'] } },
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
