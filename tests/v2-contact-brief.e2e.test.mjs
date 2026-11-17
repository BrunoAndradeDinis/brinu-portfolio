import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
const PT = DICTIONARIES['pt-br'].dispatch;
const EN = DICTIONARIES.en.dispatch;
const ZERO_WIDTH = String.fromCharCode(0x200b);

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

async function openForm({ locale = 'pt-br', width = 1440, height = 900 } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  await context.addInitScript((loc) => window.localStorage.setItem('brinu_locale', loc), locale);
  const page = await context.newPage();
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
  return { context, page };
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
const groupLabels = (page, id) => page.locator(`#${id} label`).allInnerTexts().then((list) => list.map((text) => text.trim()));
const checkedValue = (page, id) => page.locator(`#${id} input:checked`).evaluateAll((inputs) => inputs.map((input) => input.value));

async function assertErrorWithoutReceipt(page, field, message) {
  const error = page.locator(`[data-error-${field}]`);
  assert.equal((await error.innerText()).replace('■', '').trim(), message);
  assert.equal(await page.locator('[data-dispatch-receipt]').count(), 0);
  assert.equal(await page.locator('[data-dispatch-form]').count(), 1);
  assert.equal(await page.locator('[data-dispatch-submit-btn]').isDisabled(), true);
}

const leave = (page, id) => page.locator(`#${id}`).blur();

async function touchEveryField(page) {
  for (const id of ['dispatch-name', 'dispatch-email', 'dispatch-phone', 'dispatch-message']) {
    await page.focus(`#${id}`);
    await leave(page, id);
  }
  await page.check('#dispatch-services input[value="web-system"]');
  await page.uncheck('#dispatch-services input[value="web-system"]');
}

test('form fields render in the approved order', async () => {
  const { context, page } = await openForm();
  const order = await page.locator('[data-dispatch-form]').evaluate((form) =>
    [...form.children].map((child) => (child.tagName === 'FIELDSET' ? child.id : child.tagName === 'BUTTON' ? 'submit' : child.matches('[data-dispatch-submit-hint]') ? 'hint' : child.querySelector('input, textarea')?.id))
  );
  assert.deepEqual(order, ['dispatch-name', 'dispatch-company', 'dispatch-email', 'dispatch-phone', 'dispatch-services', 'dispatch-budget', 'dispatch-deadline', 'dispatch-message', 'submit', 'hint']);
  const labels = await page.locator('[data-dispatch-form] > div > label').allInnerTexts();
  assert.equal(labels.length, 5);
  assert.equal(labels[0].trim(), PT.nameLabel);
  assert.match(labels[1], /^02 \/\/ EMPRESA\s*\(OPCIONAL\)$/);
  assert.equal(labels[2].trim(), PT.emailLabel);
  assert.match(labels[3], /^04 \/\/ WHATSAPP\s*\(OPCIONAL\)$/);
  assert.equal(labels[4].trim(), PT.messageLabel);
  assert.equal((await page.locator('#dispatch-services legend').innerText()).trim(), PT.servicesLegend);
  assert.equal((await page.locator('#dispatch-budget legend').innerText()).trim(), PT.budgetLegend);
  assert.equal((await page.locator('#dispatch-deadline legend').innerText()).trim(), PT.deadlineLegend);
  assert.deepEqual(await groupLabels(page, 'dispatch-services'), ['Sistema web / painel', 'Site / landing page', 'Integração / API / manutenção', 'Oportunidade de vaga']);
  assert.equal(await page.locator('#dispatch-services input:checked').count(), 0);
  await context.close();
});

test('budget offers five options with A combinar checked', async () => {
  const { context, page } = await openForm();
  assert.deepEqual(await groupLabels(page, 'dispatch-budget'), ['Até R$ 3.000', 'R$ 3.000 – R$ 8.000', 'R$ 8.000 – R$ 15.000', 'Acima de R$ 15.000', 'A combinar']);
  assert.equal(await page.locator('#dispatch-budget input[type="radio"]').count(), 5);
  assert.deepEqual(await checkedValue(page, 'dispatch-budget'), ['to-discuss']);
  assert.equal((await page.locator('#dispatch-budget label:has(input:checked)').innerText()).trim(), 'A combinar');
  await context.close();
});

test('deadline offers three options with Flexível checked', async () => {
  const { context, page } = await openForm();
  assert.deepEqual(await groupLabels(page, 'dispatch-deadline'), ['Urgente (até 1 mês)', '1 a 3 meses', 'Flexível']);
  assert.equal(await page.locator('#dispatch-deadline input[type="radio"]').count(), 3);
  assert.deepEqual(await checkedValue(page, 'dispatch-deadline'), ['flexible']);
  assert.equal((await page.locator('#dispatch-deadline label:has(input:checked)').innerText()).trim(), 'Flexível');
  await context.close();
});

test('job-only hides budget and deadline', async () => {
  const { context, page } = await openForm();
  await page.check('#dispatch-services input[value="job"]');
  assert.equal(await page.locator('#dispatch-budget').count(), 0);
  assert.equal(await page.locator('#dispatch-deadline').count(), 0);
  assert.ok(await page.locator('#dispatch-services').isVisible());
  await page.check('#dispatch-services input[value="site"]');
  assert.ok(await page.locator('#dispatch-budget').isVisible());
  assert.ok(await page.locator('#dispatch-deadline').isVisible());
  await context.close();
});

test('unchecking job-only restores budget and deadline', async () => {
  const { context, page } = await openForm();
  await page.check('#dispatch-services input[value="job"]');
  assert.equal(await page.locator('#dispatch-budget').count(), 0);
  await page.uncheck('#dispatch-services input[value="job"]');
  assert.ok(await page.locator('#dispatch-budget').isVisible());
  assert.ok(await page.locator('#dispatch-deadline').isVisible());
  assert.deepEqual(await checkedValue(page, 'dispatch-budget'), ['to-discuss']);
  await context.close();
});

test('locale switch translates the form and keeps typed values', async () => {
  const { context, page } = await openForm();
  await page.fill('#dispatch-name', 'Ana Souza');
  await page.fill('#dispatch-company', 'Acme');
  await page.locator('#dispatch-phone').pressSequentially('16991234567');
  await page.check('#dispatch-services input[value="site"]');
  await page.check('#dispatch-budget input[value="over-15k"]');
  await page.check('#dispatch-deadline input[value="urgent"]');
  await page.fill('#dispatch-message', 'Mensagem curta');
  await page.focus('#dispatch-email');
  await leave(page, 'dispatch-email');
  await leave(page, 'dispatch-message');
  assert.equal((await page.locator('[data-error-email]').innerText()).replace('■', '').trim(), PT.errors['email-required']);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('#nav-lang-toggle-btn');
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  await page.locator('#bounty-dispatch-container').scrollIntoViewIfNeeded();
  await page.waitForFunction((label) => document.querySelector('label[for="dispatch-name"]')?.textContent?.trim() === label, EN.nameLabel);

  assert.equal(await page.inputValue('#dispatch-name'), 'Ana Souza');
  assert.equal(await page.inputValue('#dispatch-message'), 'Mensagem curta');
  assert.equal(await page.inputValue('#dispatch-company'), 'Acme');
  assert.equal(await page.inputValue('#dispatch-phone'), '(16) 99123-4567');
  assert.deepEqual(await checkedValue(page, 'dispatch-services'), ['site']);
  assert.deepEqual(await checkedValue(page, 'dispatch-budget'), ['over-15k']);
  assert.deepEqual(await checkedValue(page, 'dispatch-deadline'), ['urgent']);
  const labelTexts = (await page.locator('[data-dispatch-form] > div > label').allInnerTexts()).map((text) => text.replace(/\s+/g, ' ').trim());
  assert.deepEqual(labelTexts, [
    EN.nameLabel,
    `${EN.companyLabel} ${EN.optionalTag}`,
    EN.emailLabel,
    `${EN.phoneLabel} ${EN.optionalTag}`,
    EN.messageLabel,
  ]);
  const placeholders = {};
  for (const id of ['name', 'company', 'email', 'phone', 'message']) placeholders[id] = await page.getAttribute(`#dispatch-${id}`, 'placeholder');
  assert.deepEqual(placeholders, {
    name: EN.namePlaceholder,
    company: EN.companyPlaceholder,
    email: EN.emailPlaceholder,
    phone: EN.phonePlaceholder,
    message: EN.messagePlaceholder,
  });
  assert.equal((await page.locator('#dispatch-services legend').innerText()).trim(), EN.servicesLegend);
  assert.equal((await page.locator('#dispatch-budget legend').innerText()).trim(), EN.budgetLegend);
  assert.equal((await page.locator('#dispatch-deadline legend').innerText()).trim(), EN.deadlineLegend);
  assert.deepEqual(await groupLabels(page, 'dispatch-services'), ['Web system / dashboard', 'Website / landing page', 'Integration / API / maintenance', 'Job opportunity']);
  assert.deepEqual(await groupLabels(page, 'dispatch-budget'), ['Up to R$ 3,000', 'R$ 3,000 – R$ 8,000', 'R$ 8,000 – R$ 15,000', 'Over R$ 15,000', 'To be discussed']);
  assert.deepEqual(await groupLabels(page, 'dispatch-deadline'), ['Urgent (within 1 month)', '1 to 3 months', 'Flexible']);
  assert.equal((await page.locator('[data-error-email]').innerText()).replace('■', '').trim(), EN.errors['email-required']);
  assert.equal((await page.locator('[data-error-message]').innerText()).replace('■', '').trim(), EN.errors['message-length']);
  assert.ok((await page.locator('[data-dispatch-submit-btn]').innerText()).includes(EN.submitCta));
  await context.close();
});

test('groups are fieldsets with legends and inputs have labels', async () => {
  const { context, page } = await openForm();
  const groups = await page.locator('[data-dispatch-form] fieldset').evaluateAll((sets) =>
    sets.map((set) => ({ id: set.id, legend: set.firstElementChild?.tagName, inputs: set.querySelectorAll('input').length }))
  );
  assert.deepEqual(groups, [
    { id: 'dispatch-services', legend: 'LEGEND', inputs: 4 },
    { id: 'dispatch-budget', legend: 'LEGEND', inputs: 5 },
    { id: 'dispatch-deadline', legend: 'LEGEND', inputs: 3 },
  ]);
  for (const id of ['dispatch-name', 'dispatch-company', 'dispatch-email', 'dispatch-phone', 'dispatch-message']) {
    const labelText = await page.locator(`label[for="${id}"]`).innerText();
    assert.ok(labelText.trim().length > 0, `${id} has a label`);
    const accessibleName = await page.getByLabel(labelText.trim(), { exact: true }).getAttribute('id');
    assert.equal(accessibleName, id);
  }
  const unlabeledChoices = await page.locator('[data-dispatch-form] fieldset input').evaluateAll((inputs) => inputs.filter((input) => !input.closest('label')).length);
  assert.equal(unlabeledChoices, 0);
  await context.close();
});

test('invalid name shows the name error and disables submit', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.fill('#dispatch-name', `  A${ZERO_WIDTH}  `);
  await leave(page, 'dispatch-name');
  await assertErrorWithoutReceipt(page, 'name', PT.errors['name-length']);
  await page.evaluate(() => document.getElementById('dispatch-name').removeAttribute('maxlength'));
  await page.fill('#dispatch-name', 'a'.repeat(81));
  await assertErrorWithoutReceipt(page, 'name', PT.errors['name-length']);
  await context.close();
});

test('invalid email shows the matching error and disables submit', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.fill('#dispatch-email', '');
  await leave(page, 'dispatch-email');
  await assertErrorWithoutReceipt(page, 'email', PT.errors['email-required']);
  await page.fill('#dispatch-email', 'ana@acme');
  await assertErrorWithoutReceipt(page, 'email', PT.errors['email-invalid']);
  await context.close();
});

test('invalid whatsapp shows the whatsapp error and disables submit', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.fill('#dispatch-phone', '');
  await page.locator('#dispatch-phone').pressSequentially('169912345');
  await leave(page, 'dispatch-phone');
  await assertErrorWithoutReceipt(page, 'phone', PT.errors['phone-invalid']);
  await context.close();
});

test('no service shows the service error and disables submit', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.uncheck('#dispatch-services input[value="web-system"]');
  await assertErrorWithoutReceipt(page, 'services', PT.errors['services-required']);
  await context.close();
});

test('leaving the service group untouched shows the service error', async () => {
  const { context, page } = await openForm();
  await page.focus('#dispatch-phone');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.closest('fieldset')?.id), 'dispatch-services');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('[data-error-services]').count(), 0, 'no error while focus stays in the group');
  }
  await page.keyboard.press('Tab');
  assert.notEqual(await page.evaluate(() => document.activeElement?.closest('fieldset')?.id), 'dispatch-services');
  assert.equal((await page.locator('[data-error-services]').innerText()).replace('■', '').trim(), PT.errors['services-required']);
  assert.equal(await page.locator('#dispatch-services input:checked').count(), 0);
  await context.close();
});

test('short message shows the message error and disables submit', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.fill('#dispatch-message', 'a'.repeat(19));
  await leave(page, 'dispatch-message');
  await assertErrorWithoutReceipt(page, 'message', PT.errors['message-length']);
  await context.close();
});

test('typing whatsapp digits shows the BR mask', async () => {
  const { context, page } = await openForm();
  const phone = page.locator('#dispatch-phone');
  await phone.pressSequentially('16991234567');
  assert.equal(await phone.inputValue(), '(16) 99123-4567');
  await phone.fill('');
  await phone.pressSequentially('1633334444');
  assert.equal(await phone.inputValue(), '(16) 3333-4444');
  await phone.fill('');
  await phone.pressSequentially('16a9b9123x4567999');
  assert.equal(await phone.inputValue(), '(16) 99123-4567');
  for (const pasted of ['+55 16 99123-4567', '+55 (16) 99123-4567', '55 16 9 9123 4567']) {
    await phone.fill('');
    await phone.focus();
    await page.keyboard.insertText(pasted);
    assert.equal(await phone.inputValue(), '(16) 99123-4567', pasted);
  }
  await context.close();
});

test('text inputs carry maxlength at their bounds', async () => {
  const { context, page } = await openForm();
  const lengths = {};
  for (const id of ['dispatch-name', 'dispatch-company', 'dispatch-email', 'dispatch-message']) lengths[id] = await page.getAttribute(`#${id}`, 'maxlength');
  assert.deepEqual(lengths, { 'dispatch-name': '80', 'dispatch-company': '80', 'dispatch-email': '254', 'dispatch-message': '2000' });
  await context.close();
});

test('shown errors wire aria to the field for every field type', async () => {
  const cases = [
    { field: 'name', code: 'name-length', target: '#dispatch-name', breakField: async (page) => { await page.fill('#dispatch-name', 'A'); await leave(page, 'dispatch-name'); } },
    { field: 'email', code: 'email-invalid', target: '#dispatch-email', breakField: async (page) => { await page.fill('#dispatch-email', 'ana@acme'); await leave(page, 'dispatch-email'); } },
    { field: 'phone', code: 'phone-invalid', target: '#dispatch-phone', breakField: async (page) => { await page.fill('#dispatch-phone', '(16) 9912'); await leave(page, 'dispatch-phone'); } },
    { field: 'services', code: 'services-required', target: '#dispatch-services input', breakField: (page) => page.uncheck('#dispatch-services input[value="web-system"]') },
    { field: 'message', code: 'message-length', target: '#dispatch-message', breakField: async (page) => { await page.fill('#dispatch-message', 'curta'); await leave(page, 'dispatch-message'); } },
  ];
  for (const { field, code, target, breakField } of cases) {
    const { context, page } = await openForm();
    await fillValid(page);
    assert.equal(await page.locator('[data-dispatch-form] [aria-invalid="true"]').count(), 0, `${field} starts clean`);
    await breakField(page);
    const errorId = `dispatch-${field}-error`;
    assert.equal((await page.locator(`#${errorId}`).innerText()).replace('■', '').trim(), PT.errors[code]);
    const wiring = await page.locator(target).evaluateAll((elements) =>
      elements.map((element) => [element.getAttribute('aria-invalid'), element.getAttribute('aria-describedby')])
    );
    assert.equal(wiring.length, field === 'services' ? 4 : 1);
    for (const pair of wiring) assert.deepEqual(pair, ['true', errorId], field);
    assert.equal(await page.locator('[data-dispatch-form] [aria-invalid="true"]').count(), wiring.length, `${field} only`);
    await context.close();
  }
});

test('message textarea holds at most 2000 characters', async () => {
  const { context, page } = await openForm();
  await page.focus('#dispatch-message');
  await page.keyboard.insertText('x'.repeat(2500));
  assert.equal((await page.inputValue('#dispatch-message')).length, 2000);
  await context.close();
});

test('form has no horizontal overflow from 320 to 2560 px in both locales', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 768, 1440, 2560]) {
      const { context, page } = await openForm({ locale, width });
      await touchEveryField(page);
      await page.waitForSelector('[data-error-message]');
      const metrics = await page.evaluate(() => {
        const contact = document.getElementById('contact');
        const form = document.querySelector('[data-bounty-dispatch]');
        return {
          doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
          contact: [contact.scrollWidth, contact.clientWidth],
          form: [form.scrollWidth, form.clientWidth],
        };
      });
      for (const [name, [scroll, client]] of Object.entries(metrics)) {
        assert.ok(scroll <= client, `${locale} @${width}px ${name}: ${scroll} > ${client}`);
      }
      await page.fill('#dispatch-name', 'N'.repeat(80));
      await page.fill('#dispatch-company', 'C'.repeat(80));
      await page.fill('#dispatch-email', `${'e'.repeat(64)}@${'d'.repeat(185)}.com`);
      await page.locator('#dispatch-phone').pressSequentially('16991234567');
      await page.check('#dispatch-services input[value="web-system"]');
      await page.check('#dispatch-services input[value="site"]');
      await page.check('#dispatch-services input[value="integration"]');
      await page.fill('#dispatch-message', 'W'.repeat(2000));
      await submit(page);
      await page.waitForSelector('[data-dispatch-receipt]');
      const receiptMetrics = await page.evaluate(() => {
        const contact = document.getElementById('contact');
        const card = document.querySelector('[data-bounty-dispatch]');
        return {
          doc: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
          contact: [contact.scrollWidth, contact.clientWidth],
          receipt: [card.scrollWidth, card.clientWidth],
        };
      });
      for (const [name, [scroll, client]] of Object.entries(receiptMetrics)) {
        assert.ok(scroll <= client, `${locale} @${width}px receipt ${name}: ${scroll} > ${client}`);
      }
      await context.close();
    }
  }
});

const receiptRows = (page) =>
  page.locator('[data-receipt-row]').evaluateAll((rows) =>
    Object.fromEntries(rows.map((row) => [row.dataset.receiptRow, row.querySelector('dd').textContent.trim()]))
  );

test('valid submit shows the receipt from sanitized values', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.fill('#dispatch-name', `  <b>Ana</b>${ZERO_WIDTH}   Souza  `);
  await page.check('#dispatch-services input[value="integration"]');
  await page.check('#dispatch-budget input[value="8k-15k"]');
  await page.check('#dispatch-deadline input[value="1-3-months"]');
  await page.fill('#dispatch-message', 'Linha <script>um</script>\n\n\n\n\nLinha dois com detalhes.');
  await submit(page);
  await page.waitForSelector('[data-dispatch-receipt]');
  assert.equal(await page.locator('[data-dispatch-form]').count(), 0);
  assert.deepEqual(await receiptRows(page), {
    name: 'bAna/b Souza',
    company: 'Acme',
    email: 'ana@acme.com',
    phone: '(16) 99123-4567',
    services: 'Sistema web / painel, Integração / API / manutenção',
    budget: 'R$ 8.000 – R$ 15.000',
    deadline: '1 a 3 meses',
    target: PT.statusValue,
  });
  const receiptHtml = await page.locator('[data-dispatch-receipt]').innerHTML();
  assert.doesNotMatch(receiptHtml, /<b>|<script>/);

  const href = await page.getAttribute('[data-dispatch-mailto]', 'href');
  const url = new URL(href);
  assert.equal(url.protocol, 'mailto:');
  assert.equal(url.pathname, PT.statusValue);
  assert.equal(url.searchParams.get('subject'), '[Bounty Contract] bAna/b Souza // Acme');
  const body = url.searchParams.get('body');
  assert.ok(body.includes('Nome: bAna/b Souza'));
  assert.ok(body.includes('Orçamento: R$ 8.000 – R$ 15.000'));
  assert.ok(body.endsWith('Detalhes do projeto:\r\nLinha scriptum/script\r\n\r\n\r\nLinha dois com detalhes.'));
  await context.close();
});

test('job-only receipt omits budget and deadline and optional blanks', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.fill('#dispatch-company', '   ');
  await page.fill('#dispatch-phone', '');
  await page.uncheck('#dispatch-services input[value="web-system"]');
  await page.check('#dispatch-services input[value="job"]');
  await submit(page);
  await page.waitForSelector('[data-dispatch-receipt]');
  assert.deepEqual(Object.keys(await receiptRows(page)), ['name', 'email', 'services', 'target']);
  await context.close();
});

test('new message restores the first-render state', async () => {
  const { context, page } = await openForm();
  await fillValid(page);
  await page.check('#dispatch-budget input[value="over-15k"]');
  await page.check('#dispatch-deadline input[value="urgent"]');
  await submit(page);
  await page.waitForSelector('[data-dispatch-receipt]');
  await page.click('[data-new-transmission-btn]');
  await page.waitForSelector('[data-dispatch-form]');
  assert.equal(await page.locator('[data-dispatch-receipt]').count(), 0);
  for (const id of ['dispatch-name', 'dispatch-company', 'dispatch-email', 'dispatch-phone', 'dispatch-message']) {
    assert.equal(await page.inputValue(`#${id}`), '', `${id} is empty`);
  }
  assert.equal(await page.locator('#dispatch-services input:checked').count(), 0);
  assert.deepEqual(await checkedValue(page, 'dispatch-budget'), ['to-discuss']);
  assert.deepEqual(await checkedValue(page, 'dispatch-deadline'), ['flexible']);
  assert.equal(await page.locator('[data-dispatch-form] [aria-invalid="true"]').count(), 0);
  assert.equal(await page.locator('[id$="-error"]').count(), 0);
  assert.equal(await page.locator('[data-dispatch-submit-btn]').isDisabled(), true);
  await leave(page, 'dispatch-name');
  assert.equal(await page.locator('[data-error-name]').count(), 0, 'touched state resets with the form');
  await context.close();
});

test('errors stay hidden until the visitor leaves the field', async () => {
  const { context, page } = await openForm();
  for (const [id, text] of [['dispatch-name', 'A'], ['dispatch-email', 'ana@'], ['dispatch-phone', '1699'], ['dispatch-message', 'curta']]) {
    await page.focus(`#${id}`);
    await page.keyboard.type(text);
    assert.equal(await page.locator('[id$="-error"]').count(), 0, `${id} shows no error while focused`);
    await page.reload();
    await page.evaluate(() => document.getElementById('intro-preloader')?.remove());
    await page.locator('#bounty-dispatch-container').scrollIntoViewIfNeeded();
    await page.waitForFunction(() => !document.querySelector('astro-island[component-url*="BountyDispatch"][ssr]'));
  }
  await page.focus('#dispatch-name');
  await page.keyboard.type('A');
  assert.equal(await page.locator('[data-dispatch-form] [aria-invalid="true"]').count(), 0);
  await leave(page, 'dispatch-name');
  assert.deepEqual(await page.locator('[id$="-error"]').evaluateAll((list) => list.map((el) => el.id)), ['dispatch-name-error']);
  assert.equal((await page.locator('[data-error-name]').innerText()).replace('■', '').trim(), PT.errors['name-length']);
  await context.close();
});

test('errors update live after the field was left', async () => {
  const { context, page } = await openForm();
  const name = page.locator('#dispatch-name');
  await name.fill('A');
  await leave(page, 'dispatch-name');
  assert.equal(await page.locator('[data-error-name]').count(), 1);
  await name.focus();
  await page.keyboard.type('na');
  assert.equal(await page.locator('[data-error-name]').count(), 0, 'error hides while typing');
  await page.keyboard.press('Backspace');
  await page.keyboard.press('Backspace');
  assert.equal(await page.locator('[data-error-name]').count(), 1, 'error returns while typing');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'dispatch-name', 'no blur happened');

  const email = page.locator('#dispatch-email');
  await email.fill('ana@acme.com');
  await leave(page, 'dispatch-email');
  await email.focus();
  await page.keyboard.press('End');
  for (let i = 0; i < 4; i++) await page.keyboard.press('Backspace');
  assert.equal((await page.locator('[data-error-email]').innerText()).replace('■', '').trim(), PT.errors['email-invalid']);
  await page.keyboard.type('.br');
  assert.equal(await page.locator('[data-error-email]').count(), 0);
  await context.close();
});

test('submit stays disabled until every field is valid', async () => {
  const { context, page } = await openForm();
  const button = page.locator('[data-dispatch-submit-btn]');
  assert.equal(await button.isDisabled(), true, 'disabled on first render');
  await page.fill('#dispatch-name', 'Ana Souza');
  await page.fill('#dispatch-email', 'ana@acme.com');
  await page.check('#dispatch-services input[value="site"]');
  assert.equal(await button.isDisabled(), true, 'message still missing');
  await page.fill('#dispatch-message', 'Preciso de um site institucional.');
  assert.equal(await button.isDisabled(), false, 'enabled once required fields are valid');
  await page.locator('#dispatch-phone').pressSequentially('1699');
  assert.equal(await button.isDisabled(), true, 'partial whatsapp disables');
  await page.locator('#dispatch-phone').pressSequentially('1234567');
  assert.equal(await button.isDisabled(), false);
  await page.uncheck('#dispatch-services input[value="site"]');
  assert.equal(await button.isDisabled(), true);
  await page.check('#dispatch-services input[value="job"]');
  assert.equal(await button.isDisabled(), false);
  await page.focus('#dispatch-name');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-dispatch-receipt]').count(), 1, 'enabled submit works by keyboard');
  await context.close();
});

test('enter in a field does not submit an invalid brief', async () => {
  const { context, page } = await openForm();
  await page.fill('#dispatch-name', 'Ana Souza');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('[data-dispatch-receipt]').count(), 0);
  assert.equal(await page.locator('[data-dispatch-form]').count(), 1);
  await context.close();
});

test('disabled submit explains which fields are missing', async () => {
  const { context, page } = await openForm();
  const hint = page.locator('[data-dispatch-submit-hint]');
  const button = page.locator('[data-dispatch-submit-btn]');
  assert.equal((await hint.textContent()).trim(), 'PARA ENVIAR, AJUSTE: Nome, E-mail, Serviços, Detalhes do projeto');
  assert.equal(await button.getAttribute('aria-describedby'), 'dispatch-submit-hint');
  assert.equal(await hint.getAttribute('id'), 'dispatch-submit-hint');
  await page.fill('#dispatch-name', 'Ana Souza');
  await page.fill('#dispatch-email', 'ana@acme.com');
  await page.fill('#dispatch-message', 'Preciso de um painel administrativo.');
  assert.equal(await page.locator('[id$="-error"]').count(), 0, 'no field error shown for the untouched group');
  assert.equal((await hint.textContent()).trim(), 'PARA ENVIAR, AJUSTE: Serviços');
  assert.equal(await button.isDisabled(), true);
  await page.locator('#dispatch-phone').pressSequentially('1699');
  assert.equal((await hint.textContent()).trim(), 'PARA ENVIAR, AJUSTE: WhatsApp, Serviços');
  await page.fill('#dispatch-phone', '');
  await page.check('#dispatch-services input[value="site"]');
  assert.equal(await hint.count(), 0);
  assert.equal(await button.getAttribute('aria-describedby'), null);
  assert.equal(await button.isDisabled(), false);
  await page.uncheck('#dispatch-services input[value="site"]');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('#nav-lang-toggle-btn');
  await page.waitForFunction(() => document.documentElement.lang === 'en');
  await page.locator('#bounty-dispatch-container').scrollIntoViewIfNeeded();
  assert.equal((await hint.textContent()).trim(), 'TO SEND, FIX: Services');
  await context.close();
});
