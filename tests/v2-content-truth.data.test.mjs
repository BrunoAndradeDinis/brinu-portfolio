import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { formatPeriod } from '../src/data/localized.ts';

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
