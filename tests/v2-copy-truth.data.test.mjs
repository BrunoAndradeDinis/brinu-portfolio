import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { formatPeriod } from '../src/data/localized.ts';
import { CAREER, EDUCATION, getLocalizedCareer, getLocalizedEducation } from '../src/data/career.ts';
import { ARSENAL, resolveEvidenceAnchor } from '../src/data/arsenal.ts';
import { PROFILE } from '../src/data/profile.ts';
import { DICTIONARIES } from '../src/i18n/dictionaries.ts';
import { ARSENAL_DECK, CAREER_DECK, EDUCATION_DECK, KNOWN_TECH, SOURCES } from './fixtures/copy-truth/deck.mjs';

const LOCALES = ['pt-br', 'en'];
const has = (text, token) => text.toLowerCase().includes(token.toLowerCase());
const escapeRe = (term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const techIn = (text) => KNOWN_TECH.filter((term) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(term)}(?=$|[^\\p{L}\\p{N}])`, 'iu').test(text));

test('TRUTH-01: the source deck lists every career and education entry', () => {
  assert.deepEqual(CAREER.map((entry) => entry.id).sort(), Object.keys(CAREER_DECK).sort());
  assert.deepEqual(EDUCATION.map((entry) => entry.id).sort(), Object.keys(EDUCATION_DECK).sort());
  for (const entry of Object.values(CAREER_DECK)) {
    for (const duty of entry.duties) assert.ok(SOURCES[duty.source], `duty ${duty.id} cites a known source`);
    for (const skill of entry.hardSkills) assert.ok(SOURCES[skill.source], `skill ${skill['pt-br']} cites a known source`);
  }
  for (const entry of Object.values(EDUCATION_DECK)) assert.ok(SOURCES[entry.source]);
});

test('TRUTH-02: hard skills appear in the deck for their entry', () => {
  for (const locale of LOCALES) {
    for (const entry of getLocalizedCareer(locale)) {
      const allowed = CAREER_DECK[entry.id].hardSkills.map((skill) => skill[locale]);
      assert.ok(entry.hardSkills.length > 0, `${locale} ${entry.id} lists hard skills`);
      for (const skill of entry.hardSkills) assert.ok(allowed.includes(skill), `${locale} ${entry.id}: "${skill}" is not in the deck`);
    }
  }
});

test('TRUTH-03: duties paraphrase a deck sentence', () => {
  for (const locale of LOCALES) {
    for (const entry of getLocalizedCareer(locale)) {
      const deck = CAREER_DECK[entry.id];
      const matched = entry.details.map((detail) =>
        deck.duties.filter((duty) => duty.tokens[locale].every((token) => has(detail, token))).map((duty) => duty.id)
      );
      matched.forEach((ids, index) => assert.equal(ids.length, 1, `${locale} ${entry.id} duty ${index} matches ${ids.length} deck duties`));
      entry.details.forEach((detail, index) => {
        const duty = deck.duties.find((item) => item.id === matched[index][0]);
        assert.equal(detail, duty.approved[locale], `${locale} ${entry.id} duty ${index} differs from the approved sentence for "${duty.ref.slice(0, 40)}…"`);
        const own = duty.tokens[locale];
        for (const term of techIn(detail)) {
          assert.ok(own.some((token) => has(token, term)) || deck.allowedStack.includes(term), `${locale} ${entry.id} duty ${index} adds "${term}" the source does not give it`);
        }
      });
      assert.deepEqual(matched.flat().sort(), deck.duties.map((duty) => duty.id).sort(), `${locale} ${entry.id} covers every deck duty once`);
      for (const term of techIn(entry.summary)) {
        assert.ok(deck.allowedStack.includes(term), `${locale} ${entry.id} summary names "${term}", absent from the deck`);
      }
    }
  }
});

test('TRUTH-04: period role and organization match the deck', () => {
  for (const locale of LOCALES) {
    for (const entry of getLocalizedCareer(locale)) {
      const deck = CAREER_DECK[entry.id];
      assert.equal(entry.role, deck.role[locale]);
      assert.equal(entry.org, deck.org);
      assert.equal(entry.period, formatPeriod(locale, deck.start, deck.end));
    }
  }
});

test('TRUTH-05: education entries are in the deck', () => {
  for (const locale of LOCALES) {
    for (const entry of getLocalizedEducation(locale)) {
      const deck = EDUCATION_DECK[entry.id];
      assert.equal(entry.institution, deck.institution);
      assert.match(entry.course, deck.course[locale], `${locale} ${entry.id} course`);
    }
  }
});

test('TRUTH-06: pt-br and en dossier lists have equal length', () => {
  const ptEntries = getLocalizedCareer('pt-br');
  const enEntries = getLocalizedCareer('en');
  ptEntries.forEach((pt, index) => {
    const en = enEntries[index];
    for (const key of ['details', 'hardSkills', 'softSkills']) assert.equal(pt[key].length, en[key].length, `${pt.id} ${key}`);
  });
  for (const entry of CAREER) {
    for (const key of ['details', 'hardSkills', 'softSkills']) {
      for (const item of entry.text[key]) assert.ok(item['pt-br'] && item.en, `${entry.id} ${key} has both locales`);
    }
  }
  const ptEducation = getLocalizedEducation('pt-br');
  const enEducation = getLocalizedEducation('en');
  assert.equal(ptEducation.length, enEducation.length);
  ptEducation.forEach((pt, index) => {
    assert.equal(pt.id, enEducation[index].id);
    for (const key of ['institution', 'course', 'period', 'status']) assert.ok(pt[key] && enEducation[index][key], `education ${pt.id} ${key} has both locales`);
  });
  for (const key of Object.keys(DICTIONARIES['pt-br'].about)) {
    assert.equal(typeof DICTIONARIES.en.about[key], typeof DICTIONARIES['pt-br'].about[key], `about.${key} has the same shape`);
  }
});

function flatten(value, prefix = '') {
  if (typeof value === 'string') return [[prefix, value]];
  if (Array.isArray(value)) return value.flatMap((item, index) => flatten(item, `${prefix}[${index}]`));
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => flatten(item, prefix ? `${prefix}.${key}` : key));
  return [];
}

test('TXT-01: pt-br and en dictionaries carry the same keys', () => {
  const keys = (locale) => flatten(DICTIONARIES[locale]).map(([key]) => key).sort();
  assert.deepEqual(keys('pt-br'), keys('en'));
});

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(full) : [full];
  });
}

test('TXT-02: location reads Franca / SP everywhere', () => {
  assert.equal(PROFILE.location.label, 'Franca / SP');
  for (const file of sourceFiles('src').filter((name) => /\.(ts|tsx|astro|css)$/.test(name))) {
    assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /Campinas/i, file);
  }
});

test('TXT-03: no fact sentence repeats across sections', () => {
  for (const locale of LOCALES) {
    const strings = [
      ...flatten(DICTIONARIES[locale]),
      ...getLocalizedCareer(locale).flatMap((entry) => [
        [`career.${entry.id}.summary`, entry.summary],
        ...entry.details.map((detail, index) => [`career.${entry.id}.details[${index}]`, detail]),
      ]),
    ];
    const seen = new Map();
    for (const [key, text] of strings) {
      const section = key.split('.')[0];
      for (const sentence of text.split(/(?<=[.!?])\s+/)) {
        const normal = sentence.replace(/\s+/g, ' ').trim().toLowerCase();
        if (normal.length < 25) continue;
        const first = seen.get(normal);
        if (first && first.section !== section) assert.fail(`${locale}: "${normal}" appears in ${first.key} and ${key}`);
        if (!first) seen.set(normal, { section, key });
      }
    }
  }
});

test('ARS-01: each arsenal skill resolves an evidence ref', () => {
  for (const domain of ARSENAL) {
    for (const skill of domain.skills) {
      assert.ok(skill.evidence.length > 0, `${skill.name} has evidence`);
      for (const ref of skill.evidence) assert.ok(resolveEvidenceAnchor(ref), `${skill.name}: ${ref} does not resolve`);
    }
  }
});

test('ARS-02: each arsenal skill maps to a deck source or is listed unproven', () => {
  const names = ARSENAL.flatMap((domain) => domain.skills.map((skill) => skill.name));
  assert.deepEqual(names.sort(), Object.keys(ARSENAL_DECK).sort());
  for (const [name, entry] of Object.entries(ARSENAL_DECK)) {
    if (entry.unproven) continue;
    assert.ok(entry.sources.length > 0 && entry.sources.every((source) => SOURCES[source]), `${name} cites known sources`);
  }
});
