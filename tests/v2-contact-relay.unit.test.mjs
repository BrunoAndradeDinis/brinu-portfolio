import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const RELAY_SOURCE = readFileSync(new URL('../apps-script/contact-relay.js', import.meta.url), 'utf8');
const RECIPIENT = 'owner@example.com';

function loadRelay({ sendThrows = false, recipient = RECIPIENT } = {}) {
  const sent = [];
  const store = new Map();
  const context = vm.createContext({
    MailApp: {
      sendEmail(message) {
        if (sendThrows) throw new Error('quota');
        sent.push(message);
      },
    },
    CacheService: {
      getScriptCache: () => ({ get: (key) => store.get(key) ?? null, put: (key, value) => store.set(key, value) }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => (key === 'RECIPIENT' ? recipient : null) }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content) => ({ content, mimeType: null, setMimeType(type) { this.mimeType = type; return this; } }),
    },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (algorithm, value) => [...createHash(algorithm).update(value, 'utf8').digest()],
      base64EncodeWebSafe: (bytes) => Buffer.from(bytes).toString('base64url'),
    },
  });
  vm.runInContext(RELAY_SOURCE, context);
  const post = (body) => {
    const output = context.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } });
    assert.equal(output.mimeType, 'application/json');
    return JSON.parse(output.content);
  };
  const setNow = (ms) => vm.runInContext(`Date.now = () => ${ms};`, context);
  return { post, sent, setNow };
}

const VALID = {
  name: 'Ana Souza',
  company: 'Hana Studio',
  email: 'Ana@Example.com',
  phone: '+55 16 99123-4567',
  services: ['web-system', 'site'],
  budget: '8k-15k',
  deadline: '1-3-months',
  message: 'Preciso de um painel interno com login e relatórios.',
  website: '',
};

test('relay mails a valid brief to the recipient', () => {
  const relay = loadRelay();
  assert.deepEqual(relay.post(VALID), { ok: true });
  assert.equal(relay.sent.length, 1);
  const [mail] = relay.sent;
  assert.equal(mail.to, RECIPIENT);
  assert.equal(mail.replyTo, 'ana@example.com');
  assert.equal(mail.subject, '[Portfolio] Nova proposta: Ana Souza // Hana Studio');
  assert.equal(
    mail.body,
    [
      'Nome: Ana Souza',
      'Empresa: Hana Studio',
      'E-mail: ana@example.com',
      'WhatsApp: (16) 99123-4567',
      'Serviços: Sistema web / painel, Site / landing page',
      'Orçamento: R$ 8.000 – R$ 15.000',
      'Prazo: 1 a 3 meses',
      '',
      'Detalhes do projeto:',
      'Preciso de um painel interno com login e relatórios.',
    ].join('\n'),
  );

  const jobOnly = loadRelay();
  assert.deepEqual(jobOnly.post({ ...VALID, company: '', phone: '', services: ['job'] }), { ok: true });
  assert.equal(jobOnly.sent[0].subject, '[Portfolio] Nova proposta: Ana Souza');
  assert.doesNotMatch(jobOnly.sent[0].body, /Empresa|WhatsApp|Orçamento|Prazo/);
});

test('relay rejects invalid briefs without mailing', () => {
  const invalid = [
    'not json',
    '[]',
    'null',
    { ...VALID, name: 'A' },
    { ...VALID, name: 'x'.repeat(81) },
    { ...VALID, email: '' },
    { ...VALID, email: 'ana@example' },
    { ...VALID, email: `${'a'.repeat(250)}@x.com` },
    { ...VALID, phone: '16 9912' },
    { ...VALID, phone: '123456789012' },
    { ...VALID, services: [] },
    { ...VALID, services: ['hacker'] },
    { ...VALID, services: 'web-system' },
    { ...VALID, message: 'curto demais' },
    { ...VALID, message: 'x'.repeat(2001) },
    { ...VALID, name: String.fromCharCode(0x200b).repeat(5) },
  ];
  for (const body of invalid) {
    const relay = loadRelay();
    assert.deepEqual(relay.post(body), { ok: false, code: 'invalid' }, JSON.stringify(body).slice(0, 60));
    assert.equal(relay.sent.length, 0);
  }

  const relay = loadRelay();
  const hostile = {
    ...VALID,
    name: `Ana <script>x</script>\r\nBcc: evil@x.com${String.fromCharCode(0x202e)}`,
    company: `Hana${String.fromCharCode(0)}\nStudio`,
    budget: 'free',
    deadline: 42,
    message: `Linha um <b>negrito</b>\r\n\r\n\r\n\r\n\r\nLinha dois${String.fromCharCode(0x200b)} final ok`,
  };
  assert.deepEqual(relay.post(hostile), { ok: true });
  const [mail] = relay.sent;
  assert.equal(mail.subject, '[Portfolio] Nova proposta: Ana scriptx/script Bcc: evil@x.com // Hana Studio');
  assert.doesNotMatch(mail.subject, /[\r\n<>]/);
  assert.match(mail.body, /^Orçamento: A combinar$/m);
  assert.match(mail.body, /^Prazo: Flexível$/m);
  assert.ok(mail.body.endsWith('Linha um bnegrito/b\n\n\nLinha dois final ok'));
  assert.doesNotMatch(mail.body, /[<>\u0000​‮]/);
});

test('relay drops honeypot posts silently', () => {
  const relay = loadRelay();
  assert.deepEqual(relay.post({ ...VALID, website: 'https://spam.example' }), { ok: true });
  assert.deepEqual(relay.post({ website: 'x' }), { ok: true });
  assert.equal(relay.sent.length, 0);
});

test('relay rate limits per e-mail and overall', () => {
  const relay = loadRelay();
  relay.setNow(1_000_000);
  for (let i = 0; i < 3; i += 1) assert.deepEqual(relay.post(VALID), { ok: true });
  assert.deepEqual(relay.post({ ...VALID, email: 'ANA@example.com' }), { ok: false, code: 'rate-limited' });
  assert.equal(relay.sent.length, 3);

  relay.setNow(1_000_000 + 3600 * 1000);
  assert.deepEqual(relay.post(VALID), { ok: true }, 'window resets after an hour');

  const overall = loadRelay();
  overall.setNow(5_000_000);
  for (let i = 0; i < 20; i += 1) assert.deepEqual(overall.post({ ...VALID, email: `lead${i}@example.com` }), { ok: true });
  assert.deepEqual(overall.post({ ...VALID, email: 'lead20@example.com' }), { ok: false, code: 'rate-limited' });
  assert.equal(overall.sent.length, 20);
});

test('relay reports a failed send as server-error', () => {
  const throwing = loadRelay({ sendThrows: true });
  assert.deepEqual(throwing.post(VALID), { ok: false, code: 'server-error' });
  assert.deepEqual(throwing.post(VALID), { ok: false, code: 'server-error' }, 'failed sends do not count toward the limit');

  const noRecipient = loadRelay({ recipient: null });
  assert.deepEqual(noRecipient.post(VALID), { ok: false, code: 'server-error' });
  assert.equal(noRecipient.sent.length, 0);
});
