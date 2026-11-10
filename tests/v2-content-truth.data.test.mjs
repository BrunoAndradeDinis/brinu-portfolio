import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { formatPeriod } from '../src/data/localized.ts';
import * as casesModule from '../src/data/cases.ts';

const { MAIN_CASES, getLocalizedCases } = casesModule;
const byId = (id) => MAIN_CASES.find((c) => c.id === id);
const urlsOf = (definition) => definition.links.map((l) => l.url);

function typeCheck(file) {
  return spawnSync(
    'npx',
    [
      'tsc', '--ignoreConfig', '--noEmit', '--strict', '--skipLibCheck',
      '--target', 'es2022', '--module', 'esnext', '--moduleResolution', 'bundler',
      '--allowImportingTsExtensions', file,
    ],
    { encoding: 'utf8' }
  );
}

test('C17: type check rejects missing or empty localized text', () => {
  assert.equal(typeCheck('tests/fixtures/content-truth/valid.ts').status, 0, 'valid fixture must type check');
  const missing = typeCheck('tests/fixtures/content-truth/missing-en.ts');
  assert.notEqual(missing.status, 0, 'text without en must fail the type check');
  const empty = typeCheck('tests/fixtures/content-truth/empty-pt.ts');
  assert.notEqual(empty.status, 0, 'empty pt text must fail the type check');
  const bypass = typeCheck('tests/fixtures/content-truth/literal-bypass.ts');
  assert.notEqual(bypass.status, 0, 'a literal object must not satisfy Localized<string>');
  assert.match(bypass.stdout + bypass.stderr, /LOCALIZED_BRAND|not assignable/);
});

test('T1: formatPeriod renders localized month ranges', () => {
  assert.equal(formatPeriod('pt-br', '2025-12', 'present'), 'dez/2025 – atual');
  assert.equal(formatPeriod('en', '2025-12', 'present'), 'Dec 2025 – present');
  assert.equal(formatPeriod('pt-br', '2017-06', '2019-10'), 'jun/2017 – out/2019');
  assert.equal(formatPeriod('en', '2019-11', '2025-11'), 'Nov 2019 – Nov 2025');
});

test('C7: magalu cloud case links only to magalu.cloud', () => {
  const magalu = byId('magalu-cloud');
  assert.equal(magalu.links.length, 1);
  assert.equal(magalu.links[0].type, 'external');
  assert.equal(magalu.links[0].url, 'https://magalu.cloud/');
  assert.ok(!magalu.links.some((l) => l.type === 'github'));
});

test('C8: magalu cloud subtitle credits the team in both locales', () => {
  const magalu = byId('magalu-cloud');
  assert.match(magalu.text.subtitle['pt-br'], /\btime\b/i);
  assert.match(magalu.text.subtitle.en, /\bteam\b/i);
});

test('C9: magalu cloud stack matches the approved list', () => {
  assert.deepEqual([...byId('magalu-cloud').stack], [
    'Astro', 'React', 'Tailwind CSS', 'Next.js', 'TypeScript', 'Figma', 'Strapi CMS', 'GitLab',
  ]);
});

test('C10: aurastream stack names puppeteer websocket and next.js 15/16', () => {
  const stack = byId('aurastream').stack;
  assert.ok(stack.includes('Puppeteer'));
  assert.ok(stack.includes('WebSocket'));
  assert.ok(stack.includes('Next.js 15/16'));
  assert.ok(!stack.includes('Next.js 16'), 'aurastream runs next 15.5; the stack must not claim only 16');
});

test('C11: aurastream links both repos and the panel demo', () => {
  assert.deepEqual(urlsOf(byId('aurastream')).sort(), [
    'https://github.com/BrunoAndradeDinis/auraStream',
    'https://github.com/BrunoAndradeDinis/painel-stream',
    'https://painel-stream.vercel.app',
  ].sort());
  const demo = byId('aurastream').links.find((l) => l.url === 'https://painel-stream.vercel.app');
  assert.equal(demo.type, 'demo');
});

test('C12: uriana links repo and demo with its fullstack stack', () => {
  const uriana = byId('uriana');
  assert.deepEqual(urlsOf(uriana).sort(), ['https://github.com/Dinis-s-Acount/Uriana', 'https://uriana.vercel.app'].sort());
  for (const tech of ['Prisma', 'PostgreSQL', 'Zod', 'next-safe-action']) {
    assert.ok(uriana.stack.includes(tech), `uriana stack misses ${tech}`);
  }
});

test('C13: efood links repo and demo with redux toolkit and rtk query', () => {
  const efood = byId('efood');
  assert.deepEqual(urlsOf(efood).sort(), ['https://efood-nine-sepia.vercel.app', 'https://github.com/BrunoAndradeDinis/efood'].sort());
  assert.ok(efood.stack.includes('Redux Toolkit'));
  assert.ok(efood.stack.includes('RTK Query'));
});

test('T2: main cases are the four approved ids in order', () => {
  assert.deepEqual(MAIN_CASES.map((c) => c.id), ['magalu-cloud', 'uriana', 'efood', 'aurastream']);
  assert.deepEqual(
    getLocalizedCases('pt-br').map((c) => c.reelNumber),
    ['CASE 01', 'CASE 02', 'CASE 03', 'CASE 04']
  );
  assert.equal(byId('quake-log-parser'), undefined);
});

test('C16: every link url is declared once in src/data', () => {
  const files = ['cases.ts', 'archive.ts', 'career.ts']
    .map((f) => `src/data/${f}`)
    .filter((f) => fs.existsSync(f));
  const source = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const urls = source.match(/https?:\/\/[^\s'"`]+/g) ?? [];
  assert.ok(urls.length > 0);
  const counts = urls.reduce((acc, url) => acc.set(url, (acc.get(url) ?? 0) + 1), new Map());
  const repeated = [...counts].filter(([, n]) => n > 1).map(([url]) => url);
  assert.deepEqual(repeated, [], `urls declared more than once: ${repeated.join(', ')}`);
  for (const file of ['cases.ts', 'archive.ts', 'career.ts', 'arsenal.ts'].map((f) => `src/data/${f}`)) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /BY_LOCALE/, `${file} still branches whole records by locale`);
  }
});

test('C18: cases module has no unused project cases export', () => {
  assert.equal('PROJECT_CASES' in casesModule, false);
  assert.equal('PROJECT_CASES_BY_LOCALE' in casesModule, false);
});

test('T2: main cases have both locales filled for every text field', () => {
  for (const definition of MAIN_CASES) {
    for (const [field, value] of Object.entries(definition.text)) {
      for (const locale of ['pt-br', 'en']) {
        assert.ok(value[locale]?.trim(), `${definition.id}.${field}.${locale} is empty`);
      }
    }
  }
});

const { ARCHIVE, getLocalizedArchive } = await import('../src/data/archive.ts');

test('T3: archive holds the eight approved entries with their links', () => {
  assert.deepEqual(ARCHIVE.map((e) => e.id), [
    'jokenpo', 'lista-de-contatos', 'the-warriors', 'armazem-do-pierre',
    'vue-apps', 'doutor-agenda', 'quake-log-parser', 'brinu-portfolio-v2',
  ]);
  const links = Object.fromEntries(ARCHIVE.map((e) => [e.id, e.links.map((l) => `${l.type} ${l.url}`)]));
  assert.deepEqual(links['jokenpo'], ['github https://github.com/BrunoAndradeDinis/jokenpo', 'demo https://jokenpo-three-psi.vercel.app']);
  assert.deepEqual(links['doutor-agenda'], ['github https://github.com/BrunoAndradeDinis/doutor-agenda']);
  assert.deepEqual(links['vue-apps'], [
    'github https://github.com/BrunoAndradeDinis/to-do-list',
    'demo https://to-do-list-vue-js-orcin.vercel.app',
    'github https://github.com/BrunoAndradeDinis/calc-vue',
    'demo https://calc-vue-two.vercel.app',
  ]);
  for (const entry of ARCHIVE) {
    assert.ok(entry.links.some((l) => l.type === 'github'), `${entry.id} needs a repository link`);
    for (const locale of ['pt-br', 'en']) {
      assert.ok(entry.text.title[locale].trim() && entry.text.description[locale].trim(), `${entry.id} ${locale} text`);
    }
  }
  assert.deepEqual(ARCHIVE.filter((e) => e.inProgress).map((e) => e.id), ['doutor-agenda']);
  assert.equal(getLocalizedArchive('pt-br').find((e) => e.id === 'doutor-agenda').status, 'Em andamento');
  assert.equal(getLocalizedArchive('en').find((e) => e.id === 'doutor-agenda').status, 'In progress');
  assert.equal(getLocalizedArchive('en').find((e) => e.id === 'jokenpo').status, null);
});

test('C14: quake is an archive entry that states the 80 percent jest threshold', () => {
  assert.equal(MAIN_CASES.some((c) => c.id === 'quake-log-parser'), false);
  const quake = ARCHIVE.find((e) => e.id === 'quake-log-parser');
  assert.ok(quake, 'quake-log-parser must be in the archive');
  assert.deepEqual(quake.links.map((l) => l.url), ['https://github.com/BrunoAndradeDinis/quake-log-backend-node']);
  for (const locale of ['pt-br', 'en']) {
    assert.match(quake.text.description[locale], /80%/);
    assert.match(quake.text.description[locale], /Jest/);
    assert.doesNotMatch(quake.text.description[locale], /100%/);
  }
});

const { CAREER, EDUCATION, getLocalizedCareer, getLocalizedEducation } = await import('../src/data/career.ts');

test('T4: career lists three roles newest first with linkedin dates', () => {
  assert.deepEqual(CAREER.map((c) => c.id), ['magalu-cloud', 'luizalabs', 'magazine-luiza']);
  const pt = getLocalizedCareer('pt-br');
  const en = getLocalizedCareer('en');
  assert.deepEqual(pt.map((c) => c.period), ['dez/2025 – atual', 'nov/2019 – nov/2025', 'jun/2017 – out/2019']);
  assert.deepEqual(en.map((c) => c.period), ['Dec 2025 – present', 'Nov 2019 – Nov 2025', 'Jun 2017 – Oct 2019']);
  assert.deepEqual(pt.map((c) => c.role), ['Desenvolvedor de front-end', 'Assistente de helpdesk II', 'Atendente de SAC']);
  assert.deepEqual(
    pt.find((c) => c.id === 'luizalabs').automations.map((a) => [a.name, a.repoUrl]),
    [
      ['Consulta CNPJ', 'https://github.com/BrunoAndradeDinis/consultaCNPJ'],
      ['sheetScriptForm', 'https://github.com/BrunoAndradeDinis/sheetScriptForm'],
      ['Mapa de Desempenho', 'https://github.com/BrunoAndradeDinis/mapaDeDesempenho'],
    ]
  );
});

test('T4: education lists the four approved entries without fatec', () => {
  assert.deepEqual(EDUCATION.map((e) => e.id), ['ampli', 'ebac', 'full-stack-club', 'alura']);
  assert.deepEqual(
    getLocalizedEducation('pt-br').map((e) => [e.institution, e.status]),
    [['Ampli', 'Concluído'], ['EBAC', 'Concluído'], ['Full Stack Club', 'Em andamento'], ['Alura', 'Em andamento']]
  );
  assert.deepEqual(getLocalizedEducation('en').map((e) => e.status), ['Completed', 'Completed', 'In progress', 'In progress']);
  assert.doesNotMatch(fs.readFileSync('src/data/career.ts', 'utf8'), /fatec/i);
});

const { ARSENAL, getArsenalCounter, resolveEvidenceAnchor, getLocalizedArsenal } = await import('../src/data/arsenal.ts');

test('C19: arsenal has the three approved domains', () => {
  assert.deepEqual(ARSENAL.map((d) => d.title['pt-br']), ['Frontend & Motion', 'Backend & Dados', 'Qualidade & Ferramentas']);
  assert.deepEqual(ARSENAL.map((d) => d.title.en), ['Frontend & Motion', 'Backend & Data', 'Quality & Tooling']);
});

test('C20: each arsenal domain has four to five skills', () => {
  for (const domain of ARSENAL) {
    assert.ok(domain.skills.length >= 4 && domain.skills.length <= 5, `${domain.id} has ${domain.skills.length} skills`);
  }
});

test('C21: every arsenal evidence resolves to an existing anchor', () => {
  const caseIds = new Set(MAIN_CASES.map((c) => `case-${c.id}`));
  const archiveIds = new Set(ARCHIVE.map((a) => `archive-${a.id}`));
  const careerIds = new Set(CAREER.map((c) => `career-${c.id}`));
  for (const domain of ARSENAL) {
    for (const skill of domain.skills) {
      assert.ok(skill.evidence.length > 0, `${skill.name} has no evidence`);
      for (const ref of skill.evidence) {
        const anchor = resolveEvidenceAnchor(ref);
        assert.ok(anchor, `${skill.name} evidence ${ref} does not resolve`);
        assert.ok(caseIds.has(anchor) || archiveIds.has(anchor) || careerIds.has(anchor), `${anchor} is not a rendered id`);
      }
    }
  }
  assert.equal(resolveEvidenceAnchor('case:quake-log-parser'), null);
  assert.equal(resolveEvidenceAnchor('archive:does-not-exist'), null);
  assert.equal(resolveEvidenceAnchor('nonsense'), null);
});

test('T5: arsenal counter and localized evidence labels come from the data', () => {
  assert.equal(getArsenalCounter('pt-br'), '3 DOMÍNIOS • 15 SKILLS COM PROVA');
  assert.equal(getArsenalCounter('en'), '3 DOMAINS • 15 SKILLS WITH PROOF');
  const prisma = getLocalizedArsenal('en').flatMap((d) => d.skills).find((s) => s.name === 'PostgreSQL + Prisma');
  assert.deepEqual(prisma.evidence, [{ ref: 'case:uriana', anchor: 'case-uriana', label: 'Uriana' }]);
});

const { PROFILE, buildPersonJsonLd } = await import('../src/data/profile.ts');

test('C1: profile role is frontend developer and creative developer', () => {
  assert.equal(PROFILE.role['pt-br'], 'Desenvolvedor Frontend & Creative Developer');
  assert.equal(PROFILE.role.en, 'Frontend Developer & Creative Developer');
});

test('C4: json-ld job title is the en role and has no birth date', () => {
  const jsonLd = buildPersonJsonLd();
  assert.equal(jsonLd.jobTitle, 'Frontend Developer & Creative Developer');
  assert.equal('birthDate' in jsonLd, false);
  assert.doesNotMatch(JSON.stringify(jsonLd), /1996-|"1996"/);
});

const { ptBrDict, enDict } = await import('../src/i18n/dictionaries.ts');

test('T7: dictionaries carry the approved copy deck in both locales', () => {
  const hero = (d) => [
    d.hero.manifestoLeftLine1, d.hero.manifestoLeftLine2, d.hero.manifestoLeftLine3,
    d.hero.manifestoRightLine1, d.hero.manifestoRightLine2, d.hero.manifestoRightLine3,
  ];
  assert.deepEqual(hero(ptBrDict), ['8 ANOS DE MAGALU', 'DO ATENDIMENTO', 'AO FRONT-END', 'INTERFACES', 'COM PERSONALIDADE', 'E CÓDIGO LIMPO']);
  assert.deepEqual(hero(enDict), ['8 YEARS AT MAGALU', 'FROM SUPPORT', 'TO FRONTEND', 'INTERFACES', 'WITH PERSONALITY', 'AND CLEAN CODE']);
  assert.equal(ptBrDict.filmstrip.heading, 'CADA FRAME, UM PROJETO ENTREGUE');
  assert.equal(enDict.filmstrip.heading, 'EVERY FRAME, A SHIPPED PROJECT');
  assert.match(ptBrDict.about.bioLine1, /^Frontend na Magalu Cloud/);
  assert.match(ptBrDict.about.bioLine2, /8 anos de SAC e helpdesk no ecossistema Magalu/);
  assert.match(enDict.about.bioLine1, /^Frontend at Magalu Cloud/);
  assert.match(ptBrDict.about.baseLine, /Franca \/ SP · Remoto · Pai da Helena$/);
  assert.match(ptBrDict.meta.title, /Desenvolvedor Frontend/);
  assert.match(ptBrDict.meta.description, /Desenvolvedor Frontend/);
  assert.match(ptBrDict.hero.ticker, /DESENVOLVEDOR FRONTEND/);
  assert.doesNotMatch(JSON.stringify(ptBrDict) + JSON.stringify(enDict), /golang/i);
});

test('T7: footer stack line names the astro version the site runs', () => {
  const astroMajor = JSON.parse(fs.readFileSync('node_modules/astro/package.json', 'utf8')).version.split('.')[0];
  for (const dict of [ptBrDict, enDict]) {
    assert.match(dict.footer.stackLine, new RegExp(`ASTRO ${astroMajor}\\b`));
  }
});

test('C17: every localized field in the data modules has both locales filled', () => {
  const modules = { MAIN_CASES, ARCHIVE, CAREER, EDUCATION, ARSENAL };
  let checked = 0;
  const walk = (value, trail) => {
    if (!value || typeof value !== 'object') return;
    const keys = Object.keys(value);
    if (keys.length === 2 && keys.includes('pt-br') && keys.includes('en')) {
      for (const locale of ['pt-br', 'en']) {
        if (typeof value[locale] === 'string') {
          assert.ok(value[locale].trim(), `${trail}.${locale} is empty`);
          checked += 1;
        }
      }
      return;
    }
    for (const [key, child] of Object.entries(value)) walk(child, `${trail}.${key}`);
  };
  for (const [name, data] of Object.entries(modules)) walk(data, name);
  assert.ok(checked > 150, `expected to check every localized string, checked ${checked}`);
});
