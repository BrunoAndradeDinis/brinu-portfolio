import { test } from 'node:test';
import assert from 'node:assert/strict';

const { sanitizeInput, MAX_INPUT_LENGTH } = await import('../src/utils/terminal/sanitize.ts');
const { COMMANDS, CONSOLE_COMMANDS, resolveCommand } = await import('../src/utils/terminal/registry.ts');
const { runCommand, completeInput } = await import('../src/utils/terminal/commands.ts');
const { getLocalizedCareer, getLocalizedEducation } = await import('../src/data/career.ts');
const { getLocalizedHobbies } = await import('../src/data/hobbies.ts');
const { getLocalizedArsenal } = await import('../src/data/arsenal.ts');
const { getLocalizedCases } = await import('../src/data/cases.ts');
const { PROFILE } = await import('../src/data/profile.ts');

const texts = (result) => result.lines.map((line) => line.text);

test('the sanitizer keeps only plain allowed text', () => {
  assert.equal(sanitizeInput('  HELP  '), 'help');
  assert.equal(sanitizeInput('cat\tcurriculo.txt\n'), 'cat curriculo.txt');
  assert.equal(sanitizeInput('he​lp'), 'help', 'zero-width space');
  assert.equal(sanitizeInput('‮help‬'), 'help', 'bidi overrides');
  assert.equal(sanitizeInput('﻿help\u0000\u0007'), 'help', 'BOM and C0 controls');
  assert.equal(sanitizeInput('\u0085help '), 'help', 'C1 and line separators become spaces');
  assert.equal(sanitizeInput('ｈｅｌｐ'), 'help', 'NFKC folds full-width letters');
  assert.equal(sanitizeInput('x'.repeat(500)).length, MAX_INPUT_LENGTH);
  assert.equal(sanitizeInput('   ​‍  '), '');
  assert.equal(MAX_INPUT_LENGTH, 120);
});

test('the registry resolves commands and aliases and nothing else', () => {
  const expected = ['help', 'clear', 'whoami', 'career', 'education', 'skills', 'hobbies', 'projects', 'ls', 'cat', 'download', 'lang', 'contact', 'status', 'cilada', 'exit'];
  assert.deepEqual(COMMANDS.map((command) => command.name), expected);
  const aliases = { ajuda: 'help', '?': 'help', limpar: 'clear', cls: 'clear', trajetoria: 'career', formacao: 'education', habilidades: 'skills', arsenal: 'skills', projetos: 'projects', baixar: 'download', idioma: 'lang', contato: 'contact', sair: 'exit', quemsou: 'whoami' };
  for (const [alias, name] of Object.entries(aliases)) assert.equal(resolveCommand(alias)?.name, name, alias);
  for (const word of ['rm', 'sudo', 'eval', 'constructor', '__proto__', 'tostring', 'help()']) assert.equal(resolveCommand(word), undefined, word);
  assert.deepEqual(CONSOLE_COMMANDS.map((command) => command.name), ['whoami', 'projects', 'contact', 'status', 'cilada']);
  assert.deepEqual(texts(runCommand('rm -rf /', 'pt-br')), ['rm: comando não encontrado. Digite help.']);
  assert.deepEqual(texts(runCommand('sudo', 'en')), ['sudo: command not found. Type help.']);
  assert.deepEqual(texts(runCommand('whoami now', 'pt-br')), ['uso: whoami']);
  assert.deepEqual(texts(runCommand('cat /etc/passwd', 'en')), ['cat: /etc/passwd: no such file']);
  assert.deepEqual(texts(runCommand('lang fr', 'pt-br')), ['uso: lang pt | lang en']);
  assert.deepEqual(runCommand('   ', 'pt-br').lines, []);
  assert.equal(runCommand('clear', 'pt-br').effect.type, 'clear');
  assert.deepEqual(runCommand('lang en', 'pt-br').effect, { type: 'locale', locale: 'en' });
  assert.deepEqual(runCommand('sair', 'pt-br').effect, { type: 'navigate', href: '/' });
  const help = runCommand('ajuda', 'pt-br').lines;
  assert.equal(help.length, COMMANDS.length + 1);
  assert.deepEqual(help.slice(1).map((line) => line.term), COMMANDS.map((command) => command.usage));
});

test('command output comes from the site data', () => {
  for (const locale of ['pt-br', 'en']) {
    const career = getLocalizedCareer(locale);
    const careerOut = texts(runCommand('career', locale)).join('\n');
    for (const entry of career) assert.ok(careerOut.includes(`${entry.role} @ ${entry.org}`) && careerOut.includes(entry.period), `${locale} career ${entry.id}`);
    assert.doesNotMatch(careerOut, /SAC|Customer Service|Magazine Luiza/);
    const education = texts(runCommand('education', locale)).filter((_, index) => index % 2 === 0);
    assert.deepEqual(education, getLocalizedEducation(locale).map((entry) => `${entry.institution.toUpperCase()} · ${entry.course}`));
    assert.match(education[1], /^AMPLI - ANHANGUERA/);
    const skills = texts(runCommand('skills', locale)).join('\n');
    for (const domain of getLocalizedArsenal(locale)) for (const skill of domain.skills) assert.ok(skills.includes(skill.name), skill.name);
    const hobbies = texts(runCommand('hobbies', locale));
    assert.deepEqual(hobbies.slice(0, 6), getLocalizedHobbies(locale).map((hobby) => `${hobby.rating} ${hobby.position.code}  ${hobby.name}`));
    const projects = texts(runCommand('projects', locale)).filter((_, index) => index % 2 === 0);
    assert.deepEqual(projects, getLocalizedCases(locale).map((project) => project.title));
    const whoami = texts(runCommand('whoami', locale));
    assert.equal(whoami[0], `${PROFILE.fullName} (@${PROFILE.handle})`);
    assert.equal(whoami[1], PROFILE.role[locale]);
    const resume = texts(runCommand('cat curriculo.txt', locale)).join('\n');
    assert.ok(resume.includes(PROFILE.email) && resume.includes(PROFILE.linkedin.url));
    for (const entry of getLocalizedEducation(locale)) assert.ok(resume.includes(entry.institution));
    const download = runCommand('download curriculo', locale).effect;
    assert.deepEqual(download, { type: 'download', filename: 'curriculo-bruno-dinis.pdf', href: '/curriculo-bruno-dinis.pdf' });
    assert.deepEqual(texts(runCommand('ls', locale)), ['curriculo.txt']);
    assert.match(texts(runCommand('cat curriculo.pdf', locale))[0], /^cat: curriculo.pdf: /);
  }
  const music = texts(runCommand('hobbies Música', 'pt-br'));
  assert.equal(music[0], '94 OUV · Ouvinte');
  assert.equal(music.length, 1 + 1 + 6 + 1);
  assert.equal(texts(runCommand('hobbies violao', 'pt-br'))[1], 'VIOLÃO & LUAUS', 'accents are optional');
  assert.equal(texts(runCommand('hobbies guitar', 'en'))[1], 'GUITAR & LUAUS');
  assert.match(texts(runCommand('hobbies futebol', 'pt-br'))[0], /hobby não encontrado. Opções: animes, musica, violao, skate, jogos, natureza/);
});

test('the résumé uses plain ATS sections, keywords and no hobbies', () => {
  const sections = {
    'pt-br': ['RESUMO PROFISSIONAL', 'COMPETÊNCIAS TÉCNICAS', 'EXPERIÊNCIA PROFISSIONAL', 'PROJETOS', 'FORMAÇÃO ACADÊMICA'],
    en: ['PROFESSIONAL SUMMARY', 'TECHNICAL SKILLS', 'PROFESSIONAL EXPERIENCE', 'PROJECTS', 'EDUCATION'],
  };
  for (const locale of ['pt-br', 'en']) {
    const resume = texts(runCommand('cat curriculo.txt', locale));
    assert.equal(resume[0], PROFILE.fullName.toUpperCase());
    const positions = sections[locale].map((title) => resume.indexOf(title));
    assert.ok(positions.every((position, index) => position > 0 && (index === 0 || position > positions[index - 1])), `${locale}: sections in order`);
    const body = resume.join('\n');
    for (const keyword of ['TypeScript', 'React', 'Next.js', 'Astro', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Jest', 'Playwright']) assert.ok(body.includes(keyword), `${locale}: ${keyword}`);
    for (const entry of getLocalizedCareer(locale)) assert.ok(body.includes(`${entry.role} | ${entry.org} | ${entry.period}`));
    for (const hobby of getLocalizedHobbies(locale)) assert.ok(!body.includes(hobby.name), `${locale}: no hobby ${hobby.name}`);
    assert.doesNotMatch(body, /[•·@]\s|Brinu/, `${locale}: no decorative glyphs or handle`);
  }
});

test('the menu and terminal résumé link points at a real PDF', async () => {
  const { readFile } = await import('node:fs/promises');
  const pdf = await readFile(new URL('../public/curriculo-bruno-dinis.pdf', import.meta.url));
  assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
});

test('tab completion finds commands and arguments', () => {
  assert.deepEqual(completeInput('hob', 'pt-br'), { value: 'hobbies ', options: ['hobbies'] });
  assert.deepEqual(completeInput('c', 'pt-br').options, ['clear', 'career', 'cat', 'contact', 'cilada']);
  assert.equal(completeInput('c', 'pt-br').value, null);
  assert.equal(completeInput('hobbies mu', 'pt-br').value, 'hobbies musica');
  assert.equal(completeInput('cat cur', 'pt-br').value, 'cat curriculo.txt');
  assert.equal(completeInput('download c', 'pt-br').value, 'download curriculo');
  assert.deepEqual(completeInput('lang ', 'pt-br').options, ['pt', 'en']);
  assert.deepEqual(completeInput('zzz', 'pt-br'), { value: null, options: [] });
});
