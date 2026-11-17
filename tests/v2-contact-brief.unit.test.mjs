import { test } from 'node:test';
import assert from 'node:assert/strict';

const { SERVICE_IDS, BUDGET_IDS, DEADLINE_IDS, CONTACT_BOUNDS, CONTACT_DEFAULTS } = await import('../src/data/contact-brief.ts');

test('contact brief ids, bounds and defaults match the design', () => {
  assert.deepEqual([...SERVICE_IDS], ['web-system', 'site', 'integration', 'job']);
  assert.deepEqual([...BUDGET_IDS], ['up-to-3k', '3k-8k', '8k-15k', 'over-15k', 'to-discuss']);
  assert.deepEqual([...DEADLINE_IDS], ['urgent', '1-3-months', 'flexible']);
  assert.deepEqual(CONTACT_BOUNDS, {
    name: { min: 2, max: 80 },
    company: { max: 80 },
    email: { max: 254 },
    message: { min: 20, max: 2000 },
    phoneDigits: { min: 10, max: 11 },
  });
  assert.deepEqual(CONTACT_DEFAULTS, { budget: 'to-discuss', deadline: 'flexible' });
});

const { sanitizeLine, sanitizeMultiline, digitsOnly, formatBrPhone } = await import('../src/utils/contact-sanitize.ts');

test('text fields drop markup, control and zero-width characters', () => {
  assert.equal(sanitizeLine('  <script>alert(1)</script>  Ana  '), 'scriptalert(1)/script Ana');
  assert.equal(sanitizeLine('<b>Ana</b>'), 'bAna/b');
  assert.equal(sanitizeLine('A\u200Bn\u200Ca\u200D\u2060\uFEFF'), 'Ana');
  assert.equal(sanitizeLine('A\u0000n\u0007a\u007F\u0085\u009F'), 'Ana');
  assert.equal(sanitizeLine('Ana    \t  Souza'), 'Ana Souza');
  assert.equal(sanitizeLine('Jose\u0301'), 'Jos\u00E9');
  assert.equal(sanitizeLine('Jose\u0301').length, 4);
  assert.equal(sanitizeMultiline('<i>ola</i>\u200B mundo\u0000'), 'iola/i mundo');
});

test('single-line fields lose CR LF while message keeps capped line breaks', () => {
  assert.equal(sanitizeLine('Ana\r\nBcc: x@y.z'), 'Ana Bcc: x@y.z');
  assert.equal(sanitizeLine('a\rb\nc\u2028d\u2029e'), 'a b c d e');
  assert.doesNotMatch(sanitizeLine('x\r\n\r\ny'), /[\r\n]/);
  assert.equal(sanitizeMultiline('linha 1\r\nlinha 2\rlinha 3'), 'linha 1\nlinha 2\nlinha 3');
  assert.equal(sanitizeMultiline('a\n\n\nb'), 'a\n\n\nb');
  assert.equal(sanitizeMultiline('a\n\n\n\n\n\nb'), 'a\n\n\nb');
  assert.equal(sanitizeMultiline('a   \n   b  c'), 'a\nb c');
  assert.doesNotMatch(sanitizeMultiline('a\r\nb'), /\r/);
});

test('whitespace-only fields count as empty', () => {
  assert.equal(sanitizeLine('   \t  '), '');
  assert.equal(sanitizeLine('\u200B\u200C\uFEFF'), '');
  assert.equal(sanitizeLine('\r\n \r\n'), '');
  assert.equal(sanitizeMultiline('\n\n  \u200B \n'), '');
});

test('whatsapp mask formats 10 and 11 digits and caps at 11', () => {
  assert.equal(digitsOnly('(16) 99123-4567'), '16991234567');
  assert.equal(digitsOnly('+55 abc'), '55');
  assert.equal(formatBrPhone('16991234567'), '(16) 99123-4567');
  assert.equal(formatBrPhone('1633334444'), '(16) 3333-4444');
  assert.equal(formatBrPhone('169912345678999'), '(16) 99123-4567');
  assert.equal(formatBrPhone(''), '');
  assert.equal(formatBrPhone('1'), '(1');
  assert.equal(formatBrPhone('169'), '(16) 9');
  assert.equal(formatBrPhone('1699123'), '(16) 9912-3');
});
