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
const CHANNEL_LABELS = { email: 'E-mail', whatsapp: 'WhatsApp' };
const LOCALE_LABELS = { 'pt-br': 'Português (pt-br)', en: 'Inglês (en) — responder em inglês' };
const DEFAULT_BUDGET = 'to-discuss';
const DEFAULT_DEADLINE = 'flexible';
const JOB_SERVICE = 'job';

const BOUNDS = { nameMin: 2, nameMax: 80, companyMax: 80, emailMax: 254, messageMin: 20, messageMax: 2000, phoneMin: 10, phoneMax: 11 };
const RATE_LIMIT = { windowSeconds: 3600, perEmail: 3, overall: 20 };
const LOCK_WAIT_MS = 5000;
const SUBJECT = 'Nova proposta:';
const FLAGGED_SUBJECT = '[Portfolio][Possível spam] Nova proposta:';
const FLAGGED_NOTE = 'Atenção: o campo anti-bot veio preenchido (bot ou preenchimento automático do navegador). Confira antes de responder.';

const SITE_URL = 'https://brinu.xyz';
const SENDER_NAME = 'Brinu // Bruno Dinis';
const CONFIRMATION_COPY = {
  'pt-br': {
    htmlLang: 'pt-BR',
    subject: '[Brinu] Transmissão confirmada: recebi sua proposta',
    preheader: 'Recebi sua proposta. Retorno o quanto antes, com mais informações.',
    tag: '// BOUNTY RECEIPT',
    title: 'TRANSMISSÃO CONFIRMADA',
    greeting: 'Olá, {name}!',
    received: 'Sua proposta chegou certinho aqui. Vou analisar os detalhes e retorno o quanto antes, com mais informações.',
    replyEmail: 'O retorno vai por e-mail, para {email}.',
    replyWhatsapp: 'Como você preferiu, o retorno vai pelo WhatsApp: {phone}.',
    copyNote: 'Abaixo está uma cópia dos dados que você enviou. Se algo estiver errado, é só responder este e-mail.',
    summaryTitle: 'RESUMO DA TRANSMISSÃO',
    detailsTitle: 'DETALHES DO PROJETO',
    signature: 'Bruno de Andrade Dinis (Brinu)',
    role: 'Desenvolvedor Frontend & Full Stack',
    footer: 'Você recebeu este e-mail porque enviou o formulário de contato em brinu.xyz.',
    labels: {
      name: 'Nome',
      company: 'Empresa',
      email: 'E-mail',
      phone: 'WhatsApp',
      channel: 'Preferência de contato',
      services: 'Serviços',
      budget: 'Orçamento',
      deadline: 'Prazo',
    },
    channels: CHANNEL_LABELS,
    services: SERVICE_LABELS,
    budgets: BUDGET_LABELS,
    deadlines: DEADLINE_LABELS,
  },
  en: {
    htmlLang: 'en',
    subject: '[Brinu] Transmission confirmed: I got your brief',
    preheader: 'I got your brief. I will reply as soon as I can, with more details.',
    tag: '// BOUNTY RECEIPT',
    title: 'TRANSMISSION CONFIRMED',
    greeting: 'Hi, {name}!',
    received: 'Your brief came through. I will go over the details and reply as soon as I can, with more information.',
    replyEmail: 'The reply goes by email, to {email}.',
    replyWhatsapp: 'As you asked, the reply goes on WhatsApp: {phone}.',
    copyNote: 'Below is a copy of what you sent. If anything is wrong, just reply to this email.',
    summaryTitle: 'TRANSMISSION SUMMARY',
    detailsTitle: 'PROJECT DETAILS',
    signature: 'Bruno de Andrade Dinis (Brinu)',
    role: 'Frontend & Full Stack Developer',
    footer: 'You got this email because you sent the contact form at brinu.xyz.',
    labels: {
      name: 'Name',
      company: 'Company',
      email: 'Email',
      phone: 'WhatsApp',
      channel: 'Contact preference',
      services: 'Services',
      budget: 'Budget',
      deadline: 'Timeline',
    },
    channels: { email: 'Email', whatsapp: 'WhatsApp' },
    services: {
      'web-system': 'Web system / dashboard',
      site: 'Website / landing page',
      integration: 'Integration / API / maintenance',
      job: 'Job opportunity',
    },
    budgets: {
      'up-to-3k': 'Up to R$ 3,000',
      '3k-8k': 'R$ 3,000 – R$ 8,000',
      '8k-15k': 'R$ 8,000 – R$ 15,000',
      'over-15k': 'Over R$ 15,000',
      'to-discuss': 'To be discussed',
    },
    deadlines: {
      urgent: 'Urgent (within 1 month)',
      '1-3-months': '1 to 3 months',
      flexible: 'Flexible',
    },
  },
};
const PALETTE = { space: '#0b0c10', ink: '#080808', panel: '#12131a', paper: '#fbfaf4', red: '#fe0000', muted: '#9a9a9a' };
const MONO = "'Courier New', Courier, monospace";
const DISPLAY = "Impact, 'Arial Black', 'Helvetica Neue', Arial, sans-serif";

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
    if (trapped) return finish({ ok: true }, 'sent-flagged', '');
    const confirmation = sendConfirmation(brief, recipient);
    return finish({ ok: true }, confirmation ? 'sent-unconfirmed' : 'sent', confirmation);
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
  const preferWhatsapp = raw.preferWhatsapp === true;
  const services = Array.isArray(raw.services) ? Object.keys(SERVICE_LABELS).filter((id) => raw.services.includes(id)) : [];
  const message = sanitizeMultiline(text(raw.message));
  const jobOnly = services.length === 1 && services[0] === JOB_SERVICE;

  const checks = {
    name: name.length >= BOUNDS.nameMin && name.length <= BOUNDS.nameMax,
    email: email.length <= BOUNDS.emailMax && EMAIL_PATTERN.test(email),
    phone: phone ? phone.length >= BOUNDS.phoneMin && phone.length <= BOUNDS.phoneMax : !preferWhatsapp,
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
    preferWhatsapp,
    services,
    budget: jobOnly ? null : pick(raw.budget, BUDGET_LABELS, DEFAULT_BUDGET),
    deadline: jobOnly ? null : pick(raw.deadline, DEADLINE_LABELS, DEFAULT_DEADLINE),
    message,
    locale: raw.locale === 'en' ? 'en' : 'pt-br',
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
    ['Retorno preferido', CHANNEL_LABELS[channelOf(brief)]],
    ['Idioma do visitante', LOCALE_LABELS[brief.locale]],
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

function channelOf(brief) {
  return brief.preferWhatsapp ? 'whatsapp' : 'email';
}

function sendConfirmation(brief, recipient) {
  try {
    const copy = CONFIRMATION_COPY[brief.locale] || CONFIRMATION_COPY['pt-br'];
    MailApp.sendEmail({
      to: brief.email,
      replyTo: recipient,
      name: SENDER_NAME,
      subject: copy.subject,
      body: confirmationText(brief, copy),
      htmlBody: confirmationHtml(brief, copy),
    });
    return '';
  } catch (error) {
    return String(error);
  }
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (match, key) => (Object.prototype.hasOwnProperty.call(values, key) ? values[key] : match));
}

function confirmationRows(brief, copy) {
  const labels = copy.labels;
  return [
    [labels.name, brief.name],
    [labels.company, brief.company],
    [labels.email, brief.email],
    [labels.phone, brief.phone && formatPhone(brief.phone)],
    [labels.channel, copy.channels[channelOf(brief)]],
    [labels.services, brief.services.map((id) => copy.services[id]).join(', ')],
    [labels.budget, brief.budget && copy.budgets[brief.budget]],
    [labels.deadline, brief.deadline && copy.deadlines[brief.deadline]],
  ].filter((row) => row[1]);
}

function replyLine(brief, copy) {
  const values = { email: brief.email, phone: brief.phone ? formatPhone(brief.phone) : '' };
  return fill(brief.preferWhatsapp ? copy.replyWhatsapp : copy.replyEmail, values);
}

function confirmationText(brief, copy) {
  return [
    copy.title,
    '',
    fill(copy.greeting, { name: brief.name }),
    '',
    copy.received,
    replyLine(brief, copy),
    '',
    copy.copyNote,
    '',
    '== ' + copy.summaryTitle + ' ==',
  ]
    .concat(confirmationRows(brief, copy).map((row) => row[0] + ': ' + row[1]))
    .concat(['', '== ' + copy.detailsTitle + ' ==', brief.message, '', '-- ', copy.signature, copy.role, SITE_URL, '', copy.footer])
    .join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlLines(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function confirmationHtml(brief, copy) {
  const p = PALETTE;
  const rows = confirmationRows(brief, copy)
    .map(
      (row, index) =>
        '<tr><td style="padding:10px 12px;border-top:' + (index ? '1px dashed ' + p.ink : '0') + ';font-family:' + MONO + ';font-size:11px;line-height:16px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:' + p.ink + ';width:38%;vertical-align:top;">' +
        escapeHtml(row[0]) +
        '</td><td style="padding:10px 12px;border-top:' + (index ? '1px dashed ' + p.ink : '0') + ';font-family:' + MONO + ';font-size:13px;line-height:18px;color:' + p.ink + ';vertical-align:top;word-break:break-word;">' +
        escapeHtml(row[1]) +
        '</td></tr>',
    )
    .join('');

  return (
    '<!DOCTYPE html><html lang="' + copy.htmlLang + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>' + escapeHtml(copy.title) + '</title></head>' +
    '<body style="margin:0;padding:0;background-color:' + p.space + ';">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:' + p.space + ';">' + escapeHtml(copy.preheader) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="' + p.space + '" style="background-color:' + p.space + ';"><tr><td align="center" style="padding:32px 12px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">' +

    '<tr><td style="padding:0 0 12px 0;font-family:' + MONO + ';font-size:11px;letter-spacing:3px;color:' + p.red + ';font-weight:bold;">' + escapeHtml(copy.tag) + ' &#9632; BRINU.XYZ</td></tr>' +

    '<tr><td bgcolor="' + p.red + '" style="background-color:' + p.red + ';border:3px solid ' + p.ink + ';border-right-width:9px;border-bottom-width:9px;border-right-color:' + p.paper + ';border-bottom-color:' + p.paper + ';padding:22px 24px;">' +
    '<div style="font-family:' + MONO + ';font-size:11px;letter-spacing:2px;color:' + p.ink + ';font-weight:bold;">&#9632; STATUS: 100% OK</div>' +
    '<div style="font-family:' + DISPLAY + ';font-size:34px;line-height:38px;letter-spacing:1px;color:' + p.ink + ';text-transform:uppercase;padding-top:6px;">' + escapeHtml(copy.title) + '</div>' +
    '</td></tr>' +

    '<tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>' +

    '<tr><td bgcolor="' + p.paper + '" style="background-color:' + p.paper + ';border:3px solid ' + p.ink + ';border-right-width:9px;border-bottom-width:9px;border-right-color:' + p.red + ';border-bottom-color:' + p.red + ';padding:24px;">' +
    '<div style="font-family:' + DISPLAY + ';font-size:22px;line-height:28px;color:' + p.ink + ';">' + escapeHtml(fill(copy.greeting, { name: brief.name })) + '</div>' +
    '<p style="margin:12px 0 0 0;font-family:' + MONO + ';font-size:14px;line-height:21px;color:' + p.ink + ';">' + escapeHtml(copy.received) + '</p>' +
    '<p style="margin:12px 0 0 0;padding:10px 12px;border-left:6px solid ' + p.red + ';background-color:' + p.ink + ';font-family:' + MONO + ';font-size:13px;line-height:19px;font-weight:bold;color:' + p.paper + ';">' + escapeHtml(replyLine(brief, copy)) + '</p>' +
    '<p style="margin:12px 0 0 0;font-family:' + MONO + ';font-size:12px;line-height:18px;color:' + p.ink + ';">' + escapeHtml(copy.copyNote) + '</p>' +
    '</td></tr>' +

    '<tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>' +

    '<tr><td bgcolor="' + p.paper + '" style="background-color:' + p.paper + ';border:3px solid ' + p.ink + ';border-right-width:9px;border-bottom-width:9px;border-right-color:' + p.red + ';border-bottom-color:' + p.red + ';padding:0;">' +
    '<div style="background-color:' + p.ink + ';padding:10px 12px;font-family:' + MONO + ';font-size:12px;letter-spacing:2px;font-weight:bold;color:' + p.paper + ';">&#9632; <span style="color:' + p.red + ';">//</span> ' + escapeHtml(copy.summaryTitle) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' + rows + '</table>' +
    '<div style="background-color:' + p.ink + ';padding:10px 12px;font-family:' + MONO + ';font-size:12px;letter-spacing:2px;font-weight:bold;color:' + p.paper + ';">&#9632; <span style="color:' + p.red + ';">//</span> ' + escapeHtml(copy.detailsTitle) + '</div>' +
    '<div style="padding:14px 12px;font-family:' + MONO + ';font-size:13px;line-height:19px;color:' + p.ink + ';word-break:break-word;">' + htmlLines(brief.message) + '</div>' +
    '</td></tr>' +

    '<tr><td style="height:20px;line-height:20px;font-size:0;">&nbsp;</td></tr>' +

    '<tr><td bgcolor="' + p.panel + '" style="background-color:' + p.panel + ';border-top:4px solid ' + p.red + ';padding:18px 24px;">' +
    '<div style="font-family:' + DISPLAY + ';font-size:16px;line-height:22px;color:' + p.paper + ';">' + escapeHtml(copy.signature) + '</div>' +
    '<div style="font-family:' + MONO + ';font-size:12px;line-height:18px;color:' + p.paper + ';">' + escapeHtml(copy.role) + '</div>' +
    '<div style="padding-top:8px;font-family:' + MONO + ';font-size:12px;line-height:18px;"><a href="' + SITE_URL + '" style="color:' + p.red + ';font-weight:bold;text-decoration:underline;">brinu.xyz</a></div>' +
    '</td></tr>' +

    '<tr><td style="padding:16px 4px 0 4px;font-family:' + MONO + ';font-size:11px;line-height:16px;color:' + p.muted + ';">' + escapeHtml(copy.footer) + '</td></tr>' +

    '</table></td></tr></table></body></html>'
  );
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
