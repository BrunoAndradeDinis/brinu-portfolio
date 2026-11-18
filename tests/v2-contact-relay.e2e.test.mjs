import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
const { CONTACT_ENDPOINT } = await import('../src/data/contact-brief.ts');
const PT = DICTIONARIES['pt-br'].dispatch;
const EN = DICTIONARIES.en.dispatch;

const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.json': 'application/json; charset=utf-8' };
let server;
let baseUrl = '';
let browser;

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    let pathname = decodeURIComponent(new URL(req.url || '/', 'http://127.0.0.1').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    else if (!path.extname(pathname)) pathname += '/index.html';
    const filePath = path.join(distDir, pathname);
    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    resolve();
  }));
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (fs.existsSync('/usr/bin/google-chrome')) launchOptions.executablePath = '/usr/bin/google-chrome';
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

const json = (body, status = 200) => ({ status, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'application/json', body: JSON.stringify(body) });

async function openForm({ locale = 'pt-br', width = 1440, height = 900, timezoneId, fixedTime, relay = (route) => route.fulfill(json({ ok: true })) } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', timezoneId });
  await context.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
  const requests = [];
  let handler = relay;
  await context.route(CONTACT_ENDPOINT, (route) => {
    requests.push(route.request());
    return handler(route);
  });
  const page = await context.newPage();
  if (fixedTime) await page.clock.setFixedTime(fixedTime);
  await page.goto(`${baseUrl}/`, { waitUntil: 'load' });
  await page.evaluate(() => {
    const intro = document.getElementById('intro-preloader');
    if (intro) {
      intro.click();
      intro.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
  await page.locator('#bounty-dispatch-container').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="BountyDispatch"][ssr]'));
  await page.waitForSelector('[data-dispatch-form]');
  return { context, page, requests, setRelay: (next) => (handler = next) };
}

async function fillValid(page) {
  await page.fill('#dispatch-name', 'Ana Souza');
  await page.fill('#dispatch-company', 'Acme');
  await page.fill('#dispatch-email', 'ana@acme.com');
  await page.locator('#dispatch-phone').pressSequentially('16991234567');
  await page.check('#dispatch-services input[value="web-system"]');
  await page.fill('#dispatch-message', 'Preciso de um painel administrativo completo.');
}

const submit = (page) => page.click('[data-dispatch-submit-btn]');
const toast = (page, type) => page.locator(`[data-sonner-toast][data-type="${type}"]`).last();

async function toastText(page, type) {
  const node = toast(page, type);
  await node.waitFor();
  return {
    title: (await node.locator('[data-title]').textContent()).trim(),
    description: (await node.locator('[data-description]').textContent()).trim(),
  };
}

async function switchLocale(page, lang) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('#nav-lang-toggle-btn');
  await page.waitForFunction((target) => document.documentElement.lang === target, lang);
}

test('submit locks while the brief is in flight', async () => {
  let release;
  const held = new Promise((resolve) => (release = resolve));
  const { context, page, requests } = await openForm({ relay: async (route) => { await held; await route.fulfill(json({ ok: true })); } });
  await fillValid(page);
  await submit(page);
  const button = page.locator('[data-dispatch-submit-btn]');
  await page.waitForFunction(() => document.querySelector('[data-dispatch-submit-btn]').disabled);
  assert.equal((await button.textContent()).trim(), PT.sendingCta);
  assert.equal(await page.getAttribute('[data-dispatch-form]', 'aria-busy'), 'true');
  await page.locator('[data-dispatch-form]').evaluate((form) => form.requestSubmit());
  await page.focus('#dispatch-name');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  assert.equal(requests.length, 1, 'a second submit while in flight sends nothing');
  release();
  await page.waitForSelector('[data-dispatch-receipt]');
  assert.equal(requests.length, 1);
  await context.close();
});

test('honeypot field is hidden from people', async () => {
  const { context, page, requests } = await openForm();
  const input = page.locator('[data-dispatch-honeypot]');
  assert.equal(await input.getAttribute('name'), 'bounty_ref', 'a name browsers do not autofill');
  assert.doesNotMatch(await input.getAttribute('id'), /website|url|email|name|phone|tel|address/i);
  for (const attr of ['data-lpignore', 'data-1p-ignore', 'data-bwignore']) assert.equal(await input.getAttribute(attr), 'true', attr);
  assert.equal(await input.getAttribute('type'), 'text');
  assert.equal(await input.getAttribute('tabindex'), '-1');
  assert.equal(await input.getAttribute('autocomplete'), 'off');
  assert.equal(await input.evaluate((node) => Boolean(node.closest('[aria-hidden="true"]'))), true);
  const box = await input.evaluate((node) => node.getBoundingClientRect().toJSON());
  assert.ok(box.right <= 0, `honeypot is off-screen (right=${box.right})`);
  assert.equal(await page.locator('[data-dispatch-form] [aria-hidden="true"] label').textContent(), PT.honeypotLabel);

  await fillValid(page);
  await input.fill('https://spam.example');
  await submit(page);
  await page.waitForSelector('[data-dispatch-receipt]');
  assert.equal(JSON.parse(requests[0].postData()).website, 'https://spam.example', 'the relay, not the form, judges the honeypot');
  await context.close();
});

test('confirmed send shows the success toast and receipt', async () => {
  const { context, page, requests } = await openForm();
  await fillValid(page);
  await submit(page);
  assert.deepEqual(await toastText(page, 'success'), { title: PT.toastSuccessTitle, description: PT.toastSuccessBody });
  await page.waitForSelector('[data-dispatch-receipt]');
  assert.equal(await page.locator('[data-dispatch-form]').count(), 0);
  assert.equal((await page.locator('[data-dispatch-receipt]').textContent()).includes(PT.receiptSuccess), true);

  assert.equal(requests.length, 1);
  const request = requests[0];
  assert.equal(request.method(), 'POST');
  assert.equal(request.headers()['content-type'], 'text/plain;charset=utf-8');
  assert.deepEqual(JSON.parse(request.postData()), {
    name: 'Ana Souza',
    company: 'Acme',
    email: 'ana@acme.com',
    phone: '16991234567',
    services: ['web-system'],
    budget: 'to-discuss',
    deadline: 'flexible',
    message: 'Preciso de um painel administrativo completo.',
    website: '',
    locale: 'pt-br',
  });
  await context.close();
});

test('receipt has no mail client link after a confirmed send', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await submit(page);
  await page.waitForSelector('[data-dispatch-receipt]');
  assert.equal(await page.locator('[data-bounty-dispatch] a[href^="mailto:"]').count(), 0);
  assert.equal(await page.locator('[data-dispatch-receipt]').getByText(PT.sendEmailCopy).count(), 0);
  assert.equal((await page.locator('[data-new-transmission-btn]').textContent()).trim(), PT.newTransmission);
  await context.close();
});

test('failed sends keep the form and offer the mail backup', async () => {
  const failures = {
    'http 500': (route) => route.fulfill(json({ ok: true }, 500)),
    aborted: (route) => route.abort('failed'),
    'ok false': (route) => route.fulfill(json({ ok: false, code: 'invalid' })),
    'not json': (route) => route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*' }, contentType: 'text/html', body: '<html>quota</html>' }),
  };
  for (const [name, relay] of Object.entries(failures)) {
    const { context, page } = await openForm({ relay });
    await fillValid(page);
    assert.equal(await page.locator('[data-dispatch-fallback]').count(), 0, `${name}: no backup before a failure`);
    await submit(page);
    assert.deepEqual(await toastText(page, 'error'), { title: PT.toastErrorTitle, description: PT.toastErrorBody }, name);
    assert.equal(await page.locator('[data-dispatch-receipt]').count(), 0, name);
    assert.equal(await page.inputValue('#dispatch-name'), 'Ana Souza', name);
    assert.equal(await page.inputValue('#dispatch-company'), 'Acme', name);
    assert.equal(await page.inputValue('#dispatch-email'), 'ana@acme.com', name);
    assert.equal(await page.inputValue('#dispatch-phone'), '(16) 99123-4567', name);
    assert.equal(await page.inputValue('#dispatch-message'), 'Preciso de um painel administrativo completo.', name);
    assert.equal(await page.locator('#dispatch-services input[value="web-system"]').isChecked(), true, name);
    const button = page.locator('[data-dispatch-submit-btn]');
    assert.equal(await button.isDisabled(), false, `${name}: submit re-enabled`);
    assert.equal((await button.textContent()).trim(), PT.submitCta, name);

    const fallback = page.locator('[data-dispatch-fallback]');
    assert.ok((await fallback.textContent()).includes(PT.fallbackLead), name);
    const url = new URL(await fallback.locator('a').getAttribute('href'));
    assert.equal(url.protocol, 'mailto:', name);
    assert.equal(url.pathname, PT.statusValue, name);
    assert.equal(url.searchParams.get('subject'), `${PT.mailSubjectPrefix} Ana Souza // Acme`, name);
    const body = url.searchParams.get('body');
    assert.ok(body.startsWith('Nome: Ana Souza\r\nEmpresa: Acme\r\nE-mail: ana@acme.com\r\nWhatsApp: (16) 99123-4567'), `${name}: ${body}`);
    assert.ok(body.endsWith('Detalhes do projeto:\r\nPreciso de um painel administrativo completo.'), name);
    await context.close();
  }
});

test('rate-limited answer shows the limit toast', async () => {
  const { context, page } = await openForm({ relay: (route) => route.fulfill(json({ ok: false, code: 'rate-limited' })) });
  await fillValid(page);
  await submit(page);
  const text = await toastText(page, 'error');
  assert.deepEqual(text, { title: PT.toastRateLimitedTitle, description: PT.toastRateLimitedBody });
  assert.notEqual(text.title, PT.toastErrorTitle);
  assert.equal(await page.locator('[data-dispatch-fallback]').count(), 1);
  await context.close();
});

function contrastScript(node) {
  const parse = (value) => value.match(/[\d.]+/g).slice(0, 3).map(Number);
  const channel = (c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  const style = getComputedStyle(node);
  const fg = luminance(parse(style.color));
  const bg = luminance(parse(style.backgroundColor));
  const live = node.closest('[aria-live]');
  return { ratio: (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05), live: live?.getAttribute('aria-live') ?? null, bg: style.backgroundColor };
}

test('toasts are announced and readable', async () => {
  for (const [type, relay] of [
    ['success', (route) => route.fulfill(json({ ok: true }))],
    ['error', (route) => route.fulfill(json({ ok: false, code: 'server-error' }))],
  ]) {
    const { context, page } = await openForm({ relay });
    await fillValid(page);
    await submit(page);
    const node = toast(page, type);
    await node.waitFor();
    await page.waitForTimeout(500);
    const result = await node.evaluate(contrastScript);
    assert.equal(result.live, 'polite', `${type} toast sits in an aria-live region`);
    assert.ok(result.ratio >= 4.5, `${type} toast contrast ${result.ratio.toFixed(2)} on ${result.bg}`);
    const allowed = ['rgb(8, 8, 8)', 'rgb(254, 0, 0)'];
    assert.ok(allowed.includes(result.bg), `${type} toast uses a P5 token background (${result.bg})`);
    await context.close();
  }
});

test('receipt stamps the visitor time zone', async () => {
  const { context, page } = await openForm({ timezoneId: 'America/Sao_Paulo', fixedTime: new Date('2026-11-17T23:57:05Z') });
  await fillValid(page);
  await submit(page);
  await page.waitForSelector('[data-dispatch-receipt]');
  const stamp = (await page.locator('[data-dispatch-time]').textContent()).trim();
  assert.equal(stamp, '17 de nov. de 2026, 20:57:05 BRT');
  assert.ok(!stamp.includes('23:57'), 'not the UTC hour');
  await context.close();

  let release;
  const held = new Promise((resolve) => (release = resolve));
  const slow = await openForm({
    timezoneId: 'America/Sao_Paulo',
    fixedTime: new Date('2026-11-17T23:57:05Z'),
    relay: async (route) => {
      await held;
      await route.fulfill(json({ ok: true }));
    },
  });
  await fillValid(slow.page);
  await submit(slow.page);
  await slow.page.waitForFunction(() => document.querySelector('[data-dispatch-submit-btn]').disabled);
  await slow.page.clock.setFixedTime(new Date('2026-11-17T23:57:19Z'));
  release();
  await slow.page.waitForSelector('[data-dispatch-receipt]');
  assert.equal((await slow.page.locator('[data-dispatch-time]').textContent()).trim(), '17 de nov. de 2026, 20:57:05 BRT', 'stamped at send, not at reply');
  await slow.context.close();

  const tokyo = await openForm({ timezoneId: 'Asia/Tokyo', fixedTime: new Date('2026-11-17T23:57:05Z') });
  await fillValid(tokyo.page);
  await submit(tokyo.page);
  await tokyo.page.waitForSelector('[data-dispatch-receipt]');
  assert.match((await tokyo.page.locator('[data-dispatch-time]').textContent()).trim(), /^18 de nov\. de 2026, 08:57:05 /);
  await tokyo.context.close();
});

test('receipt timestamp follows the locale', async () => {
  const { context, page } = await openForm({ timezoneId: 'America/Sao_Paulo', fixedTime: new Date('2026-11-17T23:57:05Z') });
  await fillValid(page);
  await submit(page);
  await page.waitForSelector('[data-dispatch-receipt]');
  assert.equal((await page.locator('[data-dispatch-time]').textContent()).trim(), '17 de nov. de 2026, 20:57:05 BRT');
  await switchLocale(page, 'en');
  await page.waitForFunction(() => document.querySelector('[data-dispatch-time]')?.textContent.trim().startsWith('Nov'));
  assert.equal((await page.locator('[data-dispatch-time]').textContent()).trim(), 'Nov 17, 2026, 20:57:05 GMT-3');
  assert.ok((await page.locator('[data-dispatch-receipt]').textContent()).includes(EN.receiptSuccess));
  await context.close();
});

test('relay states keep the layout inside the viewport', async () => {
  const metrics = (page) =>
    page.evaluate(() => {
      const contact = document.getElementById('contact');
      const card = document.querySelector('[data-bounty-dispatch]');
      const toastBoxes = [...document.querySelectorAll('[data-sonner-toast]')].map((node) => node.getBoundingClientRect().toJSON());
      return {
        doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
        contact: [contact.scrollWidth, contact.clientWidth],
        card: [card.scrollWidth, card.clientWidth],
        toasts: toastBoxes.map((box) => [box.left, box.right]),
        viewport: window.innerWidth,
      };
    });
  const check = (m, label) => {
    for (const name of ['doc', 'contact', 'card']) assert.ok(m[name][0] <= m[name][1], `${label} ${name}: ${m[name][0]} > ${m[name][1]}`);
    assert.ok(m.toasts.length > 0, `${label}: toast rendered`);
    for (const [left, right] of m.toasts) assert.ok(left >= 0 && right <= m.viewport, `${label} toast ${left}..${right} outside ${m.viewport}`);
  };

  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 768, 1440, 2560]) {
      const { context, page, requests, setRelay } = await openForm({ locale, width, relay: (route) => route.fulfill(json({ ok: false, code: 'rate-limited' })) });
      await fillValid(page);
      await page.check('#dispatch-budget input[value="over-15k"]');
      await page.check('#dispatch-deadline input[value="urgent"]');
      await page.locator('[data-dispatch-honeypot]').fill('bot');
      await submit(page);
      await toast(page, 'error').waitFor();
      await page.waitForSelector('[data-dispatch-fallback]');
      await page.waitForTimeout(400);
      check(await metrics(page), `${locale} @${width}px failure`);

      setRelay((route) => route.fulfill(json({ ok: true })));
      await submit(page);
      await page.waitForSelector('[data-dispatch-receipt]');
      await toast(page, 'success').waitFor();
      await page.waitForTimeout(400);
      check(await metrics(page), `${locale} @${width}px receipt`);

      await page.click('[data-new-transmission-btn]');
      await page.waitForSelector('[data-dispatch-form]');
      assert.equal(await page.locator('[data-dispatch-fallback]').count(), 0, 'reset clears the backup link');
      for (const id of ['dispatch-name', 'dispatch-company', 'dispatch-email', 'dispatch-phone', 'dispatch-message']) {
        assert.equal(await page.inputValue(`#${id}`), '', `${id} empty after reset`);
      }
      assert.equal(await page.inputValue('[data-dispatch-honeypot]'), '', 'honeypot empty after reset');
      assert.equal(await page.locator('#dispatch-services input:checked').count(), 0);
      assert.equal(await page.locator('#dispatch-budget input:checked').getAttribute('value'), 'to-discuss');
      assert.equal(await page.locator('#dispatch-deadline input:checked').getAttribute('value'), 'flexible');
      await fillValid(page);
      await submit(page);
      await page.waitForSelector('[data-dispatch-receipt]');
      assert.equal(requests.length, 3, 'the next brief after a reset is sent again');
      assert.equal(JSON.parse(requests[2].postData()).website, '', 'the reset brief carries an empty honeypot');
      await context.close();
    }
  }
});

test('relay copy renders in english', async () => {
  const { context, page, setRelay } = await openForm({ locale: 'en', relay: (route) => route.fulfill(json({ ok: false, code: 'server-error' })) });
  await fillValid(page);
  await submit(page);
  assert.deepEqual(await toastText(page, 'error'), { title: EN.toastErrorTitle, description: EN.toastErrorBody });
  assert.ok((await page.locator('[data-dispatch-fallback]').textContent()).includes(EN.fallbackLead));
  assert.equal((await page.locator('[data-dispatch-fallback] a').textContent()).trim(), EN.sendEmailCopy);

  setRelay((route) => route.fulfill(json({ ok: false, code: 'rate-limited' })));
  await submit(page);
  await page.locator(`[data-sonner-toast][data-type="error"] [data-title]:text-is("${EN.toastRateLimitedTitle}")`).waitFor();

  setRelay((route) => route.fulfill(json({ ok: true })));
  await submit(page);
  assert.deepEqual(await toastText(page, 'success'), { title: EN.toastSuccessTitle, description: EN.toastSuccessBody });
  assert.ok((await page.locator('[data-dispatch-receipt]').textContent()).includes(EN.receiptSuccess));
  await context.close();
});
