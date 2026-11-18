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

test('endpoint is a deployed apps script exec url', async () => {
  const { CONTACT_ENDPOINT } = await import('../src/data/contact-brief.ts');
  assert.match(CONTACT_ENDPOINT, /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/);
});

const BRIEF = {
  name: 'Ana Souza',
  company: null,
  email: 'ana@example.com',
  phone: '16991234567',
  services: ['site'],
  budget: 'to-discuss',
  deadline: 'flexible',
  message: 'Preciso de uma landing page para o estúdio.',
};

function fakeFetch(respond) {
  const calls = [];
  const impl = async (url, init) => {
    calls.push({ url, init });
    return respond(init);
  };
  return { calls, impl };
}

const reply = (body, status = 200) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

test('sendBrief posts the brief as text/plain JSON', async () => {
  const { sendBrief } = await import('../src/utils/contact-relay.ts');
  const fetcher = fakeFetch(() => reply({ ok: true }));
  const result = await sendBrief({ endpoint: 'https://relay.test/exec', brief: BRIEF, honeypot: '', locale: 'en', fetchImpl: fetcher.impl });
  assert.deepEqual(result, { ok: true });
  assert.equal(fetcher.calls.length, 1);
  const [{ url, init }] = fetcher.calls;
  assert.equal(url, 'https://relay.test/exec');
  assert.equal(init.method, 'POST');
  assert.deepEqual(init.headers, { 'Content-Type': 'text/plain;charset=utf-8' });
  assert.equal(init.redirect, 'follow');
  assert.ok(init.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(init.body), { ...BRIEF, website: '', locale: 'en' });

  const trap = fakeFetch(() => reply({ ok: true }));
  await sendBrief({ endpoint: 'https://relay.test/exec', brief: BRIEF, honeypot: 'bot', locale: 'pt-br', fetchImpl: trap.impl });
  assert.equal(JSON.parse(trap.calls[0].init.body).website, 'bot');
});

test('sendBrief maps every failure to its code', async () => {
  const { sendBrief } = await import('../src/utils/contact-relay.ts');
  const run = (respond, extra = {}) =>
    sendBrief({ endpoint: 'https://relay.test/exec', brief: BRIEF, honeypot: '', locale: 'pt-br', fetchImpl: fakeFetch(respond).impl, ...extra });

  assert.deepEqual(await run(() => reply({ ok: true }, 500)), { ok: false, code: 'http' });
  assert.deepEqual(await run(() => reply('<html>quota</html>')), { ok: false, code: 'bad-response' });
  assert.deepEqual(await run(() => reply('null')), { ok: false, code: 'bad-response' });
  assert.deepEqual(await run(() => reply({ ok: 'true' })), { ok: false, code: 'bad-response' });
  assert.deepEqual(await run(() => reply({ ok: false, code: 'weird' })), { ok: false, code: 'bad-response' });
  assert.deepEqual(await run(() => reply({ ok: false, code: 'invalid' })), { ok: false, code: 'invalid' });
  assert.deepEqual(await run(() => reply({ ok: false, code: 'rate-limited' })), { ok: false, code: 'rate-limited' });
  assert.deepEqual(await run(() => reply({ ok: false, code: 'server-error' })), { ok: false, code: 'server-error' });
  assert.deepEqual(await run(() => Promise.reject(new TypeError('Failed to fetch'))), { ok: false, code: 'network' });

  const hang = (init) =>
    new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  assert.deepEqual(await run(hang, { timeoutMs: 20 }), { ok: false, code: 'timeout' });

  const never = fakeFetch(() => reply({ ok: true }));
  assert.deepEqual(await sendBrief({ endpoint: '', brief: BRIEF, honeypot: '', locale: 'pt-br', fetchImpl: never.impl }), {
    ok: false,
    code: 'no-endpoint',
  });
  assert.equal(never.calls.length, 0);
});

test('dispatch time is formatted in the given time zone and locale', async () => {
  const { formatDispatchTime } = await import('../src/utils/dispatch-time.ts');
  const instant = new Date(Date.UTC(2026, 10, 17, 23, 57, 5));
  assert.equal(formatDispatchTime(instant, 'pt-br', 'America/Sao_Paulo'), '17 de nov. de 2026, 20:57:05 BRT');
  assert.equal(formatDispatchTime(instant, 'en', 'America/Sao_Paulo'), 'Nov 17, 2026, 20:57:05 GMT-3');
  assert.equal(formatDispatchTime(instant, 'en', 'Asia/Tokyo'), 'Nov 18, 2026, 08:57:05 GMT+9');
});

test('relay copy exists in both locales', async () => {
  const { DICTIONARIES: dictionaries } = await import('../src/i18n/dictionaries.ts');
  const keys = [
    'sendingCta',
    'honeypotLabel',
    'fallbackLead',
    'toastSuccessTitle',
    'toastSuccessBody',
    'toastErrorTitle',
    'toastErrorBody',
    'toastRateLimitedTitle',
    'toastRateLimitedBody',
  ];
  for (const locale of ['pt-br', 'en']) {
    for (const key of keys) {
      const value = dictionaries[locale].dispatch[key];
      assert.equal(typeof value, 'string', `${locale}.${key}`);
      assert.ok(value.trim().length > 0, `${locale}.${key}`);
    }
  }
  assert.equal(dictionaries['pt-br'].dispatch.toastSuccessTitle, 'PROPOSTA ENVIADA!');
  assert.equal(dictionaries.en.dispatch.toastSuccessTitle, 'BRIEF SENT!');
  assert.equal(dictionaries.en.dispatch.toastRateLimitedTitle, 'SEND LIMIT REACHED');
  assert.notEqual(dictionaries['pt-br'].dispatch.toastRateLimitedTitle, dictionaries['pt-br'].dispatch.toastErrorTitle);
});
