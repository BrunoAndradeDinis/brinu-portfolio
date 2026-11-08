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
