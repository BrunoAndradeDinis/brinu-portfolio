const SERVICE_LABELS = {
  'web-system': 'Sistema web / painel',
  site: 'Site / landing page',
  integration: 'Integração / API / manutenção',
  job: 'Oportunidade de vaga',
};
const BUDGET_LABELS = {
  'up-to-3k': 'Até R$ 3.000',
  '3k-8k': 'R$ 3.000 – R$ 8.000',
  '8k-15k': 'R$ 8.000 – R$ 15.000',
  'over-15k': 'Acima de R$ 15.000',
  'to-discuss': 'A combinar',
};
const DEADLINE_LABELS = {
  urgent: 'Urgente (até 1 mês)',
  '1-3-months': '1 a 3 meses',
  flexible: 'Flexível',
};
const DEFAULT_BUDGET = 'to-discuss';
const DEFAULT_DEADLINE = 'flexible';
const JOB_SERVICE = 'job';

const BOUNDS = { nameMin: 2, nameMax: 80, companyMax: 80, emailMax: 254, messageMin: 20, messageMax: 2000, phoneMin: 10, phoneMax: 11 };
const RATE_LIMIT = { windowSeconds: 3600, perEmail: 3, overall: 20 };
const LOCK_WAIT_MS = 5000;
const SUBJECT = '[Portfolio] Nova proposta:';
const FLAGGED_SUBJECT = '[Portfolio][Possível spam] Nova proposta:';
const FLAGGED_NOTE = 'Atenção: o campo anti-bot veio preenchido (bot ou preenchimento automático do navegador). Confira antes de responder.';

const LINE_BREAKS = /\r\n|[\r\u2028\u2029]/g;
const LONE_SURROGATES = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g;
const INVISIBLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u00AD\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\uFFF9-\uFFFB]|[\u{E0000}-\u{E007F}]/gu;
const ANGLE_BRACKETS = /[<>]/g;
const ORPHAN_MARKS = /(^|\s)\p{M}+/gu;
const EMAIL_PATTERN =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;

function doPost(e) {
  const raw = parseBody(e);
  if (!raw) return finish({ ok: false, code: 'invalid' }, 'invalid', 'body');
  const trapped = raw.website !== undefined && raw.website !== null && raw.website !== '';

  const checked = validateBrief(raw);
  if (!checked.brief) {
    if (trapped) return finish({ ok: true }, 'dropped-honeypot', checked.failed.join(','));
    return finish({ ok: false, code: 'invalid' }, 'invalid', checked.failed.join(','));
  }
  const brief = checked.brief;

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_WAIT_MS);
  } catch (error) {
    return finish({ ok: false, code: 'server-error' }, 'lock-timeout', String(error));
  }
  try {
    const cache = CacheService.getScriptCache();
    const now = Date.now();
    const keys = [rateKey('overall'), rateKey('mail:' + brief.email)];
    const [overall, perEmail] = keys.map((key) => recentSends(cache, key, now));
    if (overall.length >= RATE_LIMIT.overall || perEmail.length >= RATE_LIMIT.perEmail) {
      return finish({ ok: false, code: 'rate-limited' }, 'rate-limited', 'overall=' + overall.length + ' email=' + perEmail.length);
    }

    const recipient = PropertiesService.getScriptProperties().getProperty('RECIPIENT');
    if (!recipient) return finish({ ok: false, code: 'server-error' }, 'no-recipient', 'RECIPIENT script property is empty');
    MailApp.sendEmail({ to: recipient, replyTo: brief.email, subject: mailSubject(brief, trapped), body: mailBody(brief, trapped) });

    recordSend(cache, keys[0], overall, now);
    recordSend(cache, keys[1], perEmail, now);
    return finish({ ok: true }, trapped ? 'sent-flagged' : 'sent', '');
  } catch (error) {
    return finish({ ok: false, code: 'server-error' }, 'mail-error', String(error));
  } finally {
    lock.releaseLock();
  }
}

function finish(payload, outcome, detail) {
  console.info(JSON.stringify({ outcome: outcome, detail: detail }));
  return reply(payload);
}

function parseBody(e) {
  try {
    const value = JSON.parse(e && e.postData ? e.postData.contents : '');
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch (error) {
    return null;
  }
}

function reply(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function text(value) {
  return typeof value === 'string' ? value : '';
}

function clean(raw) {
  return raw
    .replace(LONE_SURROGATES, '')
    .replace(LINE_BREAKS, '\n')
    .replace(/\t/g, ' ')
    .replace(INVISIBLE, '')
    .replace(ANGLE_BRACKETS, '')
    .normalize('NFC');
}

function sanitizeLine(raw) {
  return clean(raw).replace(/\s+/g, ' ').replace(ORPHAN_MARKS, '$1').trim();
}

function sanitizeMultiline(raw) {
  return clean(raw)
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').replace(ORPHAN_MARKS, '$1').trim())
    .join('\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function truncate(value, max) {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  return /[\uD800-\uDBFF]$/.test(cut) ? cut.slice(0, -1) : cut;
}

function phoneDigits(raw) {
  let digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+')) digits = stripCountryCode(digits, true);
  else if (digits.startsWith('00')) digits = stripCountryCode(digits.slice(2), true);
  digits = digits.replace(/^0+/, '');
  return digits.length > BOUNDS.phoneMax ? stripCountryCode(digits, false) : digits;
}

function stripCountryCode(digits, explicit) {
  return digits.startsWith('55') && (explicit || digits.length > BOUNDS.phoneMax) ? digits.slice(2) : digits;
}

function pick(value, labels, fallback) {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(labels, value) ? value : fallback;
}

function validateBrief(raw) {
  const name = sanitizeLine(text(raw.name));
  const company = truncate(sanitizeLine(text(raw.company)), BOUNDS.companyMax) || null;
  const email = sanitizeLine(text(raw.email)).toLowerCase();
  const phone = phoneDigits(text(raw.phone));
  const services = Array.isArray(raw.services) ? Object.keys(SERVICE_LABELS).filter((id) => raw.services.includes(id)) : [];
  const message = sanitizeMultiline(text(raw.message));
  const jobOnly = services.length === 1 && services[0] === JOB_SERVICE;

  const checks = {
    name: name.length >= BOUNDS.nameMin && name.length <= BOUNDS.nameMax,
    email: email.length <= BOUNDS.emailMax && EMAIL_PATTERN.test(email),
    phone: !phone || (phone.length >= BOUNDS.phoneMin && phone.length <= BOUNDS.phoneMax),
    services: services.length > 0,
    message: message.length >= BOUNDS.messageMin && message.length <= BOUNDS.messageMax,
  };
  const failed = Object.keys(checks).filter((field) => !checks[field]);
  if (failed.length) return { brief: null, failed };

  const brief = {
    name,
    company,
    email,
    phone: phone || null,
    services,
    budget: jobOnly ? null : pick(raw.budget, BUDGET_LABELS, DEFAULT_BUDGET),
    deadline: jobOnly ? null : pick(raw.deadline, DEADLINE_LABELS, DEFAULT_DEADLINE),
    message,
  };
  return { brief, failed };
}

function formatPhone(digits) {
  const split = digits.length === 11 ? 7 : 6;
  return '(' + digits.slice(0, 2) + ') ' + digits.slice(2, split) + '-' + digits.slice(split);
}

function mailSubject(brief, flagged) {
  return sanitizeLine((flagged ? FLAGGED_SUBJECT : SUBJECT) + ' ' + brief.name + (brief.company ? ' // ' + brief.company : ''));
}

function mailBody(brief, flagged) {
  const rows = [
    ['Nome', brief.name],
    ['Empresa', brief.company],
    ['E-mail', brief.email],
    ['WhatsApp', brief.phone && formatPhone(brief.phone)],
    ['Serviços', brief.services.map((id) => SERVICE_LABELS[id]).join(', ')],
    ['Orçamento', brief.budget && BUDGET_LABELS[brief.budget]],
    ['Prazo', brief.deadline && DEADLINE_LABELS[brief.deadline]],
  ];
  return rows
    .filter((row) => row[1])
    .map((row) => row[0] + ': ' + row[1])
    .concat(['', 'Detalhes do projeto:', brief.message])
    .concat(flagged ? ['', FLAGGED_NOTE] : [])
    .join('\n');
}

function rateKey(scope) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, scope, Utilities.Charset.UTF_8);
  return 'rate:' + Utilities.base64EncodeWebSafe(digest);
}

function recentSends(cache, key, now) {
  try {
    const stored = JSON.parse(cache.get(key) || '[]');
    const windowStart = now - RATE_LIMIT.windowSeconds * 1000;
    return Array.isArray(stored) ? stored.filter((time) => typeof time === 'number' && time > windowStart && time <= now) : [];
  } catch (error) {
    return [];
  }
}

function recordSend(cache, key, sends, now) {
  try {
    cache.put(key, JSON.stringify(sends.concat(now)), RATE_LIMIT.windowSeconds);
  } catch (error) {}
}
