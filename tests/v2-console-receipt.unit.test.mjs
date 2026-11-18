import { test } from 'node:test';
import assert from 'node:assert/strict';

const { buildReceipt } = await import('../src/utils/receipt.ts');
const { PROFILE } = await import('../src/data/profile.ts');
const { getLocalizedCases } = await import('../src/data/cases.ts');
const { getLocalizedCareer } = await import('../src/data/career.ts');
const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
const { CONSOLE_COMMANDS } = await import('../src/utils/terminal/registry.ts');

test('the receipt is built from the site data', () => {
  for (const locale of ['pt-br', 'en']) {
    const { header, body } = buildReceipt(locale);
    const lines = body.split('\n');
    const labels = DICTIONARIES[locale].receipt;
    assert.equal(header, labels.header);
    const value = (label) => lines.find((line) => line.startsWith(`${label}:`))?.slice(10);
    assert.equal(value(labels.operator), `${PROFILE.fullName} ("${PROFILE.handle}")`);
    assert.equal(value(labels.status), `${PROFILE.role[locale]} @ ${getLocalizedCareer(locale)[0].org}`);
    assert.equal(value(labels.base), PROFILE.location.remoteLabel[locale]);
    assert.equal(value(labels.email), PROFILE.email);
    assert.equal(value(labels.linkedin), PROFILE.linkedin.handle);
    assert.equal(value(labels.total), PROFILE.tagline[locale]);
    const items = lines.filter((line) => /^\d{2} {4}/.test(line)).map((line) => [line.slice(6).split('[')[0].trim(), line.match(/\[(.*)\]$/)[1]]);
    assert.deepEqual(items, [
      ['GitHub', `OK - ${PROFILE.github.handle}`],
      ['LinkedIn', `OK - ${PROFILE.linkedin.handle}`],
      ...getLocalizedCases(locale).map((project) => [project.title, project.status.toUpperCase()]),
    ]);
    const commands = lines.filter((line) => line.startsWith('  > ')).map((line) => line.slice(4).split(/\s+->/)[0].trim());
    assert.deepEqual(commands, [...CONSOLE_COMMANDS.map((command) => command.name), '/whoami']);
    for (const command of CONSOLE_COMMANDS) assert.ok(body.includes(DICTIONARIES[locale].whoami.commands[command.name]));
    assert.doesNotMatch(body, /COVERAGE 100%|Quake|Creative Lab|PROTOTYPES|100% CLEAN CODE|ONLINE 24\/7/i);
  }
  assert.match(buildReceipt('en').body, /OPERATOR:/);
  assert.match(buildReceipt('pt-br').body, /OPERADOR:/);
});
