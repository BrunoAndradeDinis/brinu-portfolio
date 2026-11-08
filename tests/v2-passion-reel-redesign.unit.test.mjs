import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PASSION_DECK, FORBIDDEN_PHRASES } from './fixtures/passion-reel/deck.mjs';

const FIELDS = ['Headline', 'Credits', 'Highlight', 'CardTitle', 'CardSub'];
const toKey = { Headline: 'headline', Credits: 'credits', Highlight: 'highlight', CardTitle: 'cardTitle', CardSub: 'cardSub' };

test('copy deck: passionSlides carries the approved headline, credits, highlight and card in both locales', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const slides = DICTIONARIES[locale].filmstrip.passionSlides;
    PASSION_DECK[locale].forEach((frame, i) => {
      for (const field of FIELDS) {
        const key = `p${i + 1}${field}`;
        assert.equal(slides[key], frame[toKey[field]], `${locale} ${key}`);
      }
    });
  }
});

test('copy deck: removed third-party phrases do not appear in the passion dictionaries', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const text = JSON.stringify(DICTIONARIES[locale].filmstrip.passionSlides).toLowerCase();
    for (const phrase of FORBIDDEN_PHRASES) assert.ok(!text.includes(phrase), `${locale} still has "${phrase}"`);
  }
});

test('copy deck: both locales expose the same passionSlides keys', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  const pt = Object.keys(DICTIONARIES['pt-br'].filmstrip.passionSlides).sort();
  const en = Object.keys(DICTIONARIES.en.filmstrip.passionSlides).sort();
  assert.deepEqual(pt, en);
  assert.ok(pt.length >= 18 + 30, `expected at least 48 keys, got ${pt.length}`);
});

test('C1: six distinct passion-bg svgs exist and the old passion svgs are gone', async () => {
  const crypto = await import('node:crypto');
  const hashes = new Set();
  for (let i = 1; i <= 6; i++) {
    const file = `public/assets/filmstrip/passion-bg-${i}.svg`;
    assert.ok(fs.existsSync(file), `${file} must exist`);
    hashes.add(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'));
    assert.equal(fs.existsSync(`public/assets/filmstrip/passion-${i}.svg`), false, `old passion-${i}.svg must be removed`);
  }
  assert.equal(hashes.size, 6, 'the six backgrounds must have pairwise different content');
});

test('C2: passion backgrounds have no text elements and stay under 20 kB', () => {
  for (let i = 1; i <= 6; i++) {
    const file = `public/assets/filmstrip/passion-bg-${i}.svg`;
    const body = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(body, /<text[\s>]/i, `${file} must not contain <text>`);
    assert.doesNotMatch(body, /<tspan|<foreignObject/i, `${file} must not hold text via tspan or foreignObject`);
    assert.ok(fs.statSync(file).size < 20 * 1024, `${file} must be under 20 kB`);
  }
});
