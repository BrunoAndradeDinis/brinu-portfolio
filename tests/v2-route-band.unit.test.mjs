import { test } from 'node:test';
import assert from 'node:assert/strict';

const { isCaseRoute, routeBandTitle } = await import('../src/data/route-titles.ts');

test('each route has its band title in both languages', () => {
  const expected = {
    '/': ['INÍCIO', 'HOME'],
    '/stickers': ['STICKERS', 'STICKERS'],
    '/stickers/': ['STICKERS', 'STICKERS'],
    '/whoami': ['WHOAMI', 'WHOAMI'],
    '/cases/magalu-cloud': ['CASES', 'CASES'],
    '/cases/uriana': ['CASES', 'CASES'],
    '/cases/efood/': ['CASES', 'CASES'],
    '/cases/aurastream': ['CASES', 'CASES'],
    '/cases/nope': ['404', '404'],
    '/404': ['404', '404'],
    '/nada-aqui': ['404', '404'],
  };
  for (const [path, [pt, en]] of Object.entries(expected)) {
    assert.equal(routeBandTitle(path, 'pt-br'), pt, `pt-br ${path}`);
    assert.equal(routeBandTitle(path, 'en'), en, `en ${path}`);
    assert.equal(isCaseRoute(path), pt === 'CASES', `isCaseRoute ${path}`);
  }
});
