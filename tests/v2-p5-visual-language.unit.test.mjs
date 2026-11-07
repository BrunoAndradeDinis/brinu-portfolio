import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('C2: tokens.css declares each --color-* once without legacy color aliases', () => {
  const tokensPath = path.resolve('src/styles/tokens.css');
  const tokensCss = fs.readFileSync(tokensPath, 'utf8');

  const forbiddenAliases = [
    '--color-acid-green',
    '--color-crt-cyan',
    '--color-bebop-amber',
    '--color-contrast-pink',
  ];

  for (const alias of forbiddenAliases) {
    assert.equal(
      tokensCss.includes(alias),
      false,
      `tokens.css must not declare or reference forbidden alias ${alias}`
    );
  }

  const declarations = [...tokensCss.matchAll(/(--color-[a-z0-9-]+)\s*:/gi)].map((m) => m[1]);
  assert.ok(declarations.length >= 6, 'Expected canonical --color-* declarations in tokens.css');

  const counts = new Map();
  for (const name of declarations) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
  assert.deepEqual(
    duplicates,
    [],
    `Expected each --color-* token to be declared once, found duplicates: ${JSON.stringify(duplicates)}`
  );

  assert.ok(tokensCss.includes('--color-bebop-red: #FE0000'));
  assert.ok(tokensCss.includes('--color-space-base: #080808'));
  assert.ok(tokensCss.includes('--color-paper-white: #FBFAF4'));
});
