import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DECK } from './fixtures/dossier/deck.mjs';

test('copy deck: both locales carry the approved two-line bio, base line and rank labels', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    for (const [key, expected] of Object.entries(DECK[locale])) {
      assert.equal(DICTIONARIES[locale].about[key], expected, `${locale} about.${key}`);
    }
  }
});

test('copy deck: the bio lines state only approved facts', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const text = `${DICTIONARIES[locale].about.bioLine1} ${DICTIONARIES[locale].about.bioLine2}`;
    assert.match(text, /Magalu Cloud/);
    assert.match(text, /\b8\b/);
    assert.doesNotMatch(text, /Go\b|Kubernetes|GraphQL|Three\.js/);
  }
});

test('C20: dictionaries carry the two-line bio and drop the old bio, role heading and stats keys', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const about = DICTIONARIES[locale].about;
    for (const key of ['bioLine1', 'bioLine2', 'baseLine']) assert.ok(typeof about[key] === 'string' && about[key].length > 10, `${locale} about.${key}`);
    for (const gone of ['bioP1', 'bioP2', 'roleHeading', 'stats']) assert.equal(gone in about, false, `${locale} about.${gone} must be gone`);
  }
});
