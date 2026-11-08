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
