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
  assert.equal(getLocalizedArchive('pt-br').find((e) => e.id === 'doutor-agenda').status, 'Em construção');
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
