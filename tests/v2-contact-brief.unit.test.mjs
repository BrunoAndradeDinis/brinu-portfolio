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

const { validateContactBrief, isJobOnly } = await import('../src/utils/contact-brief.ts');

const VALID_RAW = Object.freeze({
  name: 'Ana Souza',
  company: 'Acme',
  email: 'ana@acme.com',
  phone: '(16) 99123-4567',
  services: ['web-system'],
  budget: '3k-8k',
  deadline: 'urgent',
  message: 'Preciso de um painel administrativo.',
});
const raw = (overrides) => ({ ...VALID_RAW, ...overrides });
const errorsOf = (overrides) => {
  const result = validateContactBrief(raw(overrides));
  return result.ok ? {} : result.errors;
};

test('validator runs in node and returns a brief or errors', () => {
  assert.equal(typeof document, 'undefined');
  assert.deepEqual(validateContactBrief(raw({ name: '  <b>Ana</b>  Souza ', company: '   ' })), {
    ok: true,
    brief: {
      name: 'bAna/b Souza',
      company: null,
      email: 'ana@acme.com',
      phone: '16991234567',
      services: ['web-system'],
      budget: '3k-8k',
      deadline: 'urgent',
      message: 'Preciso de um painel administrativo.',
    },
  });
  assert.deepEqual(validateContactBrief({ name: '', company: '', email: '', phone: '', services: [], budget: '', deadline: '', message: '' }), {
    ok: false,
    errors: { name: 'name-length', email: 'email-required', services: 'services-required', message: 'message-length' },
  });
});

test('field bounds return their error codes at each boundary', () => {
  assert.deepEqual(errorsOf({ name: 'A' }), { name: 'name-length' });
  assert.deepEqual(errorsOf({ name: 'Al' }), {});
  assert.deepEqual(errorsOf({ name: 'a'.repeat(80) }), {});
  assert.deepEqual(errorsOf({ name: 'a'.repeat(81) }), { name: 'name-length' });
  assert.deepEqual(errorsOf({ message: 'a'.repeat(19) }), { message: 'message-length' });
  assert.deepEqual(errorsOf({ message: 'a'.repeat(20) }), {});
  assert.deepEqual(errorsOf({ message: 'a'.repeat(2000) }), {});
  assert.deepEqual(errorsOf({ message: 'a'.repeat(2001) }), { message: 'message-length' });
  assert.deepEqual(errorsOf({ message: '   ' + 'a'.repeat(19) + '\u200B\u200B   ' }), { message: 'message-length' });
  assert.deepEqual(errorsOf({ services: [] }), { services: 'services-required' });
  const result = validateContactBrief(raw({ company: 'c'.repeat(200) }));
  assert.equal(result.ok && result.brief.company.length, 80);
});

test('email is lower-cased and validated up to 254 characters', () => {
  const ok = validateContactBrief(raw({ email: '  Ana.Souza@ACME.com.BR ' }));
  assert.equal(ok.ok && ok.brief.email, 'ana.souza@acme.com.br');
  assert.deepEqual(errorsOf({ email: '' }), { email: 'email-required' });
  assert.deepEqual(errorsOf({ email: '  \u200B ' }), { email: 'email-required' });
  for (const bad of ['ana', 'ana@acme', '@acme.com', 'ana@.com.', 'ana souza@acme.com', 'ana@acme .com', 'a@b@c.com']) {
    assert.deepEqual(errorsOf({ email: bad }), { email: 'email-invalid' }, bad);
  }
  const local = 'a'.repeat(64);
  const at254 = `${local}@${'b'.repeat(254 - 64 - 1 - 4)}.com`;
  assert.equal(at254.length, 254);
  assert.deepEqual(errorsOf({ email: at254 }), {});
  assert.deepEqual(errorsOf({ email: `a${at254}` }), { email: 'email-invalid' });
});

test('whatsapp keeps digits and accepts empty or 10 to 11 digits', () => {
  const empty = validateContactBrief(raw({ phone: '' }));
  assert.equal(empty.ok && empty.brief.phone, null);
  const landline = validateContactBrief(raw({ phone: '(16) 3333-4444' }));
  assert.equal(landline.ok && landline.brief.phone, '1633334444');
  const mobile = validateContactBrief(raw({ phone: '16 9 9123 4567' }));
  assert.equal(mobile.ok && mobile.brief.phone, '16991234567');
  assert.deepEqual(errorsOf({ phone: '169912345' }), { phone: 'phone-invalid' });
  assert.deepEqual(errorsOf({ phone: '169912345678' }), { phone: 'phone-invalid' });
});

test('unknown option ids are dropped', () => {
  const result = validateContactBrief(raw({ services: ['site', 'hack', 'site', 'web-system', '<x>'], budget: 'one-million', deadline: 'yesterday' }));
  assert.ok(result.ok);
  assert.deepEqual(result.brief.services, ['web-system', 'site']);
  assert.equal(result.brief.budget, 'to-discuss');
  assert.equal(result.brief.deadline, 'flexible');
  assert.deepEqual(errorsOf({ services: ['hack'] }), { services: 'services-required' });
});

test('job-only brief omits budget and deadline', () => {
  assert.equal(isJobOnly(['job']), true);
  assert.equal(isJobOnly(['job', 'site']), false);
  assert.equal(isJobOnly([]), false);
  const job = validateContactBrief(raw({ services: ['job'] }));
  assert.ok(job.ok);
  assert.equal(job.brief.budget, null);
  assert.equal(job.brief.deadline, null);
  const mixed = validateContactBrief(raw({ services: ['job', 'site'] }));
  assert.equal(mixed.ok && mixed.brief.budget, '3k-8k');
});

const { buildMailtoHref } = await import('../src/utils/contact-mailto.ts');

const MAILTO_COPY = {
  subjectPrefix: '[Bounty Contract]',
  labels: { name: 'Nome', company: 'Empresa', email: 'E-mail', phone: 'WhatsApp', services: 'Serviços', budget: 'Orçamento', deadline: 'Prazo', message: 'Detalhes' },
  services: { 'web-system': 'Sistema web / painel', site: 'Site / landing page', integration: 'Integração / API / manutenção', job: 'Oportunidade de vaga' },
  budgets: { 'up-to-3k': 'Até R$ 3.000', '3k-8k': 'R$ 3.000 – R$ 8.000', '8k-15k': 'R$ 8.000 – R$ 15.000', 'over-15k': 'Acima de R$ 15.000', 'to-discuss': 'A combinar' },
  deadlines: { urgent: 'Urgente (até 1 mês)', '1-3-months': '1 a 3 meses', flexible: 'Flexível' },
};

function parseMailto(href) {
  const url = new URL(href);
  return { protocol: url.protocol, to: url.pathname, subject: url.searchParams.get('subject'), body: url.searchParams.get('body'), rawSearch: url.search };
}

test('mailto href is built from the payload and url-encoded', () => {
  const full = validateContactBrief(raw({ name: 'Ana <b>Souza</b>', services: ['web-system', 'integration'], message: 'Linha 1\r\n\r\nLinha 2 & 50% ?' }));
  assert.ok(full.ok);
  const href = buildMailtoHref(full.brief, MAILTO_COPY, 'bruno@example.com');
  assert.ok(href.startsWith('mailto:bruno@example.com?subject='));
  assert.doesNotMatch(href.slice('mailto:bruno@example.com?'.length), /[ <>\r\n&](?!body=)/);
  const parsed = parseMailto(href);
  assert.equal(parsed.to, 'bruno@example.com');
  assert.equal(parsed.subject, '[Bounty Contract] Ana bSouza/b // Acme');
  assert.equal(
    parsed.body,
    [
      'Nome: Ana bSouza/b',
      'Empresa: Acme',
      'E-mail: ana@acme.com',
      'WhatsApp: (16) 99123-4567',
      'Serviços: Sistema web / painel, Integração / API / manutenção',
      'Orçamento: R$ 3.000 – R$ 8.000',
      'Prazo: Urgente (até 1 mês)',
      '',
      'Detalhes:',
      'Linha 1',
      '',
      'Linha 2 & 50% ?',
    ].join('\r\n')
  );

  const minimal = validateContactBrief(raw({ company: '', phone: '', services: ['job'] }));
  assert.ok(minimal.ok);
  const minimalParsed = parseMailto(buildMailtoHref(minimal.brief, MAILTO_COPY, 'bruno@example.com'));
  assert.equal(minimalParsed.subject, '[Bounty Contract] Ana Souza');
  assert.equal(
    minimalParsed.body,
    ['Nome: Ana Souza', 'E-mail: ana@acme.com', 'Serviços: Oportunidade de vaga', '', 'Detalhes:', 'Preciso de um painel administrativo.'].join('\r\n')
  );
});

test('mailto subject carries no CR or LF for hostile names', () => {
  const hostile = validateContactBrief(raw({ name: 'Ana\r\nBcc: x@y.z', company: 'Acme\nCc: z@y.x' }));
  assert.ok(hostile.ok);
  const href = buildMailtoHref(hostile.brief, MAILTO_COPY, 'bruno@example.com');
  const parsed = parseMailto(href);
  assert.doesNotMatch(parsed.subject, /[\r\n]/);
  assert.equal(parsed.subject, '[Bounty Contract] Ana Bcc: x@y.z // Acme Cc: z@y.x');
  assert.doesNotMatch(href, /%0[AD].*subject|subject=[^&]*%0[AD]/i);
  assert.equal([...new URL(href).searchParams.keys()].join(','), 'subject,body');
});
