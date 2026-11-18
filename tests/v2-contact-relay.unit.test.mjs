import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const RELAY_SOURCE = readFileSync(new URL('../apps-script/contact-relay.js', import.meta.url), 'utf8');
const RECIPIENT = 'owner@example.com';

function loadRelay({ sendThrows = false, recipient = RECIPIENT } = {}) {
  const sent = [];
  const logs = [];
  const store = new Map();
  const context = vm.createContext({
    console: { info: (line) => logs.push(JSON.parse(line)) },
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
  return { post, sent, setNow, logs };
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

test('relay delivers a valid brief with a filled honeypot flagged instead of dropping it', () => {
  const relay = loadRelay();
  assert.deepEqual(relay.post({ ...VALID, website: 'https://autofill.example' }), { ok: true });
  assert.equal(relay.sent.length, 1, 'a person whose browser autofilled the trap still reaches the inbox');
  const [mail] = relay.sent;
  assert.equal(mail.subject, '[Portfolio][Possível spam] Nova proposta: Ana Souza // Hana Studio');
  assert.match(mail.body, /campo anti-bot veio preenchido/);
  assert.ok(mail.body.startsWith('Nome: Ana Souza\n'), 'the brief itself is intact');
  assert.equal(relay.logs.at(-1).outcome, 'sent-flagged');

  [1, 0, true, false, ['x'], {}, ' '].forEach((website, i) => {
    assert.deepEqual(relay.post({ ...VALID, email: `trap${i}@example.com`, website }), { ok: true }, JSON.stringify(website));
    assert.match(relay.sent.at(-1).subject, /Possível spam/, JSON.stringify(website));
  });

  relay.post({ ...VALID, email: 'clean@example.com', website: null });
  relay.post({ ...VALID, email: 'clean2@example.com', website: '' });
  assert.ok(relay.sent.slice(-2).every((m) => m.subject.startsWith('[Portfolio] Nova proposta:')), 'a null or empty honeypot is a person');
  assert.doesNotMatch(relay.sent.at(-1).body, /anti-bot/);
});

test('relay drops a filled honeypot with an invalid brief silently', () => {
  const relay = loadRelay();
  assert.deepEqual(relay.post({ website: 'x' }), { ok: true });
  assert.deepEqual(relay.post({ ...VALID, email: 'nope', website: 'x' }), { ok: true });
  assert.equal(relay.sent.length, 0);
  assert.equal(relay.logs.at(-1).outcome, 'dropped-honeypot');
  assert.equal(relay.logs.at(-1).detail, 'email');
});

test('relay logs every outcome with the reason', () => {
  const relay = loadRelay();
  relay.post(VALID);
  assert.deepEqual(relay.logs.at(-1), { outcome: 'sent', detail: '' });
  relay.post('not json');
  assert.deepEqual(relay.logs.at(-1), { outcome: 'invalid', detail: 'body' });
  relay.post({ ...VALID, name: 'A', message: 'curta' });
  assert.deepEqual(relay.logs.at(-1), { outcome: 'invalid', detail: 'name,message' });
  relay.post(VALID);
  relay.post(VALID);
  relay.post(VALID);
  assert.deepEqual(relay.logs.at(-1), { outcome: 'rate-limited', detail: 'overall=3 email=3' });

  const throwing = loadRelay({ sendThrows: true });
  throwing.post(VALID);
  assert.deepEqual(throwing.logs.at(-1), { outcome: 'mail-error', detail: 'Error: quota' });
  const noRecipient = loadRelay({ recipient: null });
  noRecipient.post(VALID);
  assert.equal(noRecipient.logs.at(-1).outcome, 'no-recipient');
  for (const entry of [...relay.logs, ...throwing.logs]) assert.doesNotMatch(JSON.stringify(entry), /ana@example|Ana Souza/i, 'logs carry no personal data');
});

test('relay rate limits per e-mail and overall', () => {
  const relay = loadRelay();
  relay.setNow(1_000_000);
  for (let i = 0; i < 3; i += 1) assert.deepEqual(relay.post(VALID), { ok: true });
  assert.deepEqual(relay.post({ ...VALID, email: 'ANA@example.com' }), { ok: false, code: 'rate-limited' });
  assert.equal(relay.sent.length, 3);

  relay.setNow(1_000_000 + 3600 * 1000);
  assert.deepEqual(relay.post(VALID), { ok: true }, 'the oldest brief leaves the window after an hour');

  const sliding = loadRelay();
  const start = 50_000_000;
  sliding.setNow(start);
  assert.deepEqual(sliding.post(VALID), { ok: true });
  sliding.setNow(start + 59 * 60_000);
  assert.deepEqual(sliding.post(VALID), { ok: true });
  assert.deepEqual(sliding.post(VALID), { ok: true });
  sliding.setNow(start + 60 * 60_000 + 1);
  assert.deepEqual(sliding.post(VALID), { ok: true }, 'only the first brief has left the last hour');
  assert.deepEqual(sliding.post(VALID), { ok: false, code: 'rate-limited' }, 'three briefs already in the last hour');
  sliding.setNow(start + 119 * 60_000 + 1);
  assert.deepEqual(sliding.post(VALID), { ok: true });
  assert.equal(sliding.sent.length, 5);

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

test('sendBrief gives up after 15 seconds by default', async (t) => {
  const { sendBrief, RELAY_TIMEOUT_MS } = await import('../src/utils/contact-relay.ts');
  assert.equal(RELAY_TIMEOUT_MS, 15_000);
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let settled = null;
  const hang = (url, init) =>
    new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
  const pending = sendBrief({ endpoint: 'https://relay.test/exec', brief: BRIEF, honeypot: '', locale: 'pt-br', fetchImpl: hang }).then((r) => (settled = r));
  t.mock.timers.tick(14_999);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(settled, null, 'still waiting at 14.999 s');
  t.mock.timers.tick(1);
  await pending;
  assert.deepEqual(settled, { ok: false, code: 'timeout' });
});

test('relay accepts every brief the client accepts with the same phone', async () => {
  const { validateContactBrief } = await import('../src/utils/contact-brief.ts');
  const { phoneDigits } = await import('../src/utils/contact-sanitize.ts');
  const phones = [
    '',
    '16 99123-4567',
    '(16) 3333-4444',
    '+55 16 99123-4567',
    '+55 0 16 9912-3456',
    '+55 0 16 9912-345',
    '+55 00 16 99123456',
    '0055 0 16 99123-456',
    '0055 16 99123-4567',
    '016 99123-4567',
    '00 16 99123 4567',
    '5516991234567',
    '55 16 3333 4444',
    '+5516991234567',
    '016991234567',
  ];
  for (const raw of phones) {
    assert.equal(phoneDigits(phoneDigits(raw)), phoneDigits(raw), `phoneDigits is idempotent for ${raw}`);
    const checked = validateContactBrief({ ...VALID, phone: raw });
    if (!checked.ok) continue;
    const relay = loadRelay();
    assert.deepEqual(relay.post({ ...checked.brief, website: '', locale: 'pt-br' }), { ok: true }, `relay accepts ${raw}`);
    const digits = checked.brief.phone;
    const expected = digits ? `WhatsApp: (${digits.slice(0, 2)}) ${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}` : null;
    if (expected) assert.match(relay.sent[0].body, new RegExp(`^${expected.replace(/[()]/g, '\\$&')}$`, 'm'), raw);
    else assert.doesNotMatch(relay.sent[0].body, /WhatsApp/, raw);
  }
});
