import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DICTIONARIES } from '../src/i18n/dictionaries.ts';

const html = fs.readFileSync('dist/index.html', 'utf8');
const footer = html.slice(html.indexOf('<footer'), html.indexOf('</footer>') + '</footer>'.length);
const decode = (text) => text.replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');

test('CLOSE-01: the built footer has no closing block', () => {
  assert.ok(footer.includes('data-bebop-footer'), 'footer present in the built page');
  const text = decode(footer);
  assert.equal(text.includes('data-footer-signature'), false);
  assert.equal(text.includes('TRANSMISSÃO CONCLUÍDA // PROTOCOLO BRINU V2'), false);
  assert.equal(text.includes('"SEE YOU SPACE COWBOY…"'), false);
  assert.equal(text.includes("YOU'RE GONNA CARRY THAT WEIGHT."), false);
});

test('CLOSE-02: dictionaries drop the closing block keys', () => {
  for (const locale of ['pt-br', 'en']) {
    for (const key of ['badge', 'signature', 'subtitle']) {
      assert.equal(key in DICTIONARIES[locale].footer, false, `${locale} footer.${key}`);
    }
  }
});

test('CLOSE-03: the footer keeps its links and legal lines', () => {
  const text = decode(footer);
  for (const hook of ['data-footer-github-link', 'data-footer-linkedin-link', 'data-footer-email-link', 'data-footer-whoami-link', 'data-footer-stickers-link', 'data-footer-back-to-top']) {
    assert.ok(text.includes(hook), hook);
  }
  const pt = DICTIONARIES['pt-br'].footer;
  for (const line of [pt.copyright, pt.engineeredIn, pt.stackLine, pt.privacyLine, pt.ticker]) assert.ok(text.includes(line), line);
});
