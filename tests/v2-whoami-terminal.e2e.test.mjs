import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};
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

const { runCommand } = await import('../src/utils/terminal/commands.ts');
const { getLocalizedCases } = await import('../src/data/cases.ts');

async function openTerminal({ viewport = { width: 1440, height: 900 }, locale, ...options } = {}) {
  const context = await browser.newContext({ viewport, acceptDownloads: true, ...options });
  if (locale) await context.addInitScript((value) => window.localStorage.setItem('brinu_locale', value), locale);
  const page = await context.newPage();
  const requests = [];
  const dialogs = [];
  page.on('dialog', (dialog) => {
    dialogs.push(dialog.message());
    void dialog.dismiss();
  });
  await page.goto(`${baseUrl}/whoami`, { waitUntil: 'networkidle' });
  page.on('request', (request) => requests.push(request.url()));
  return { context, page, requests, dialogs };
}

const input = (page) => page.locator('#terminal-input');
const ready = (page) => page.waitForFunction(() => document.activeElement?.id === 'terminal-input', null, { timeout: 6000 });
const submit = async (page, value) => {
  await input(page).fill(value);
  await input(page).press('Enter');
};
const echoes = (page) => page.locator('#terminal-output [data-terminal-echo]').allTextContents();
const outputText = (page) => page.locator('#terminal-output').innerText();
const linesAfterLastEcho = (page) =>
  page.evaluate(() => {
    const rows = [...document.querySelectorAll('#terminal-output > div')];
    const last = rows.findLastIndex((row) => row.querySelector('[data-terminal-echo]'));
    return rows.slice(last + 1).map((row) => row.textContent);
  });

test('the opening types whoami and help and hands over the prompt', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    window.__typed = [];
    document.addEventListener('DOMContentLoaded', () => {
      new MutationObserver(() => {
        const echo = document.querySelector('[data-terminal-echo]');
        if (echo) window.__typed.push(echo.textContent);
      }).observe(document.getElementById('terminal-output'), { childList: true, subtree: true, characterData: true });
    });
  });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}/whoami`);
    await ready(page);
    const typed = await page.evaluate(() => window.__typed);
    assert.ok(typed.includes('who') && typed.includes('whoa') && typed.includes('whoami'), `the first command is typed letter by letter (${typed.slice(0, 8)})`);
    assert.deepEqual(await echoes(page), ['whoami', 'help']);
    const text = await outputText(page);
    for (const line of runCommand('whoami', 'pt-br').lines) assert.ok(text.includes(line.text), line.text);
    assert.match(text, /COMANDOS DISPONÍVEIS/);
  } finally {
    await context.close();
  }
  const skipped = await openTerminal();
  try {
    await skipped.page.keyboard.press('x');
    await ready(skipped.page);
    assert.deepEqual(await echoes(skipped.page), ['whoami', 'help'], 'a key prints the opening at once');
  } finally {
    await skipped.context.close();
  }
  const still = await openTerminal({ reducedMotion: 'reduce' });
  try {
    assert.deepEqual(await echoes(still.page), ['whoami', 'help'], 'reduced motion prints at once');
    assert.equal(await still.page.evaluate(() => document.activeElement?.id), 'terminal-input');
  } finally {
    await still.context.close();
  }
});

test('typed commands print their output and unknown ones are refused', async () => {
  const { context, page } = await openTerminal({ reducedMotion: 'reduce' });
  try {
    for (const command of ['career', 'education', 'skills', 'hobbies musica', 'projects', 'status', 'ls', 'cat curriculo.pdf']) {
      await submit(page, command);
      assert.equal((await echoes(page)).at(-1), command);
      const expected = runCommand(command, 'pt-br').lines.map((line) => line.term ? `${line.term}${line.detail}` : line.text);
      assert.deepEqual(await linesAfterLastEcho(page), expected, command);
    }
    await submit(page, 'TRAJETORIA');
    assert.deepEqual(await linesAfterLastEcho(page), runCommand('career', 'pt-br').lines.map((line) => line.text), 'aliases and case-insensitive');
    await submit(page, 'rm -rf /');
    assert.deepEqual(await linesAfterLastEcho(page), ['rm: comando não encontrado. Digite help.']);
    await submit(page, 'limpar');
    assert.equal(await page.locator('#terminal-output > *').count(), 0, 'clear empties the screen');
    assert.equal(await input(page).inputValue(), '');
  } finally {
    await context.close();
  }
});

test('download curriculo saves the PDF résumé served by the site', async () => {
  const { context, page } = await openTerminal({ reducedMotion: 'reduce' });
  try {
    const [download] = await Promise.all([page.waitForEvent('download'), submit(page, 'download curriculo')]);
    assert.equal(download.suggestedFilename(), 'curriculo-bruno-dinis.pdf');
    assert.equal(new URL(download.url()).pathname, '/curriculo-bruno-dinis.pdf');
    const pdf = await fs.promises.readFile(await download.path());
    assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
  } finally {
    await context.close();
  }
});

test('lang switches the locale and exit returns home', async () => {
  const { context, page } = await openTerminal({ reducedMotion: 'reduce' });
  try {
    await submit(page, 'lang en');
    await page.waitForFunction(() => document.documentElement.lang === 'en');
    assert.equal(await page.evaluate(() => window.localStorage.getItem('brinu_locale')), 'en');
    await submit(page, 'education');
    assert.match((await linesAfterLastEcho(page)).join('\n'), /Completed/);
    assert.equal(await input(page).getAttribute('placeholder'), 'type help');
    await submit(page, 'nope');
    assert.deepEqual(await linesAfterLastEcho(page), ['nope: command not found. Type help.']);
    await submit(page, 'exit');
    await page.waitForURL(`${baseUrl}/`);
  } finally {
    await context.close();
  }
});

test('arrow keys recall history and tab completes', async () => {
  const { context, page } = await openTerminal({ reducedMotion: 'reduce' });
  try {
    await submit(page, 'whoami');
    await submit(page, 'skills');
    await input(page).press('ArrowUp');
    assert.equal(await input(page).inputValue(), 'skills');
    await input(page).press('ArrowUp');
    assert.equal(await input(page).inputValue(), 'whoami');
    await input(page).press('ArrowDown');
    assert.equal(await input(page).inputValue(), 'skills');
    await input(page).press('ArrowDown');
    assert.equal(await input(page).inputValue(), '');
    await input(page).fill('hobbies vi');
    await input(page).press('Tab');
    assert.equal(await input(page).inputValue(), 'hobbies violao');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'terminal-input', 'Tab stays in the prompt');
    await input(page).fill('c');
    await input(page).press('Tab');
    assert.equal((await linesAfterLastEcho(page)).at(-1), 'clear  career  cat  contact  cilada');
  } finally {
    await context.close();
  }
});

test('hostile input stays plain text', async () => {
  const { context, page, requests, dialogs } = await openTerminal({ reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => {
      window.__pwned = 0;
      window.__nodes = 0;
      new MutationObserver((records) => {
        for (const record of records) for (const node of record.addedNodes) if (node.nodeType === 1 && node.matches('img, script, iframe, svg, a, b, object, embed, style')) window.__nodes += 1;
      }).observe(document.getElementById('terminal-output'), { childList: true, subtree: true });
    });
    const before = requests.length;
    const attempts = [
      '<img src=x onerror="window.__pwned=1">',
      '<script>window.__pwned=1</script>',
      '<svg onload="window.__pwned=1">',
      '&lt;b&gt;bold&lt;/b&gt;',
      'javascript:window.__pwned=1',
      '"><iframe src=javascript:window.__pwned=1>',
      '${window.__pwned=1}',
      'constructor',
      '__proto__',
    ];
    for (const attempt of attempts) {
      await submit(page, attempt);
      const echo = (await echoes(page)).at(-1);
      assert.equal(echo, attempt.toLowerCase().slice(0, 120), `the echo is the literal text of ${attempt}`);
      assert.match((await linesAfterLastEcho(page))[0], /comando não encontrado/);
    }
    await submit(page, 'he​lp‮');
    assert.equal((await echoes(page)).at(-1), 'help', 'invisible characters are dropped before matching');
    assert.equal(await input(page).getAttribute('maxlength'), '120');
    await page.evaluate(() => {
      const field = document.getElementById('terminal-input');
      field.removeAttribute('maxlength');
      field.value = 'x'.repeat(300);
      field.form.requestSubmit();
    });
    assert.equal((await echoes(page)).at(-1).length, 120, 'input past the maxlength is cut to 120 characters by the script too');
    assert.equal(await page.evaluate(() => window.__pwned), 0, 'no script ran');
    assert.equal(await page.evaluate(() => window.__nodes), 0, 'no element was created from input');
    assert.equal(await page.locator('#terminal-output img, #terminal-output script, #terminal-output iframe, #terminal-output svg').count(), 0);
    assert.deepEqual(dialogs, []);
    assert.deepEqual(requests.slice(before), [], 'no request was made');
  } finally {
    await context.close();
  }
});

test('the console and the terminal share their commands', async () => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const logs = [];
  page.on('console', (message) => logs.push(message.text()));
  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
    const receipt = logs.join('\n');
    for (const name of ['whoami', 'projects', 'contact', 'status', 'cilada']) assert.match(receipt, new RegExp(`> ${name}\\s+-> `), `${name} listed`);
    assert.match(receipt, /\/whoami {3}-> terminal interativo/);
    const table = await page.evaluate(() => {
      const rows = [];
      const original = console.table;
      console.table = (data) => rows.push(...data);
      void window.projects;
      console.table = original;
      return rows;
    });
    assert.deepEqual(table.map((row) => row.URL), getLocalizedCases('pt-br').map((project) => `/cases/${project.id}`));
    logs.length = 0;
    await page.evaluate(() => void window.whoami);
    assert.ok(logs.some((entry) => entry.includes('Bruno de Andrade Dinis (@Brinu)')), 'console whoami prints the terminal whoami output');
  } finally {
    await context.close();
  }
});

test('the terminal is accessible and never widens the page', async () => {
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 390, 768, 1440, 2560]) {
      const { context, page } = await openTerminal({ viewport: { width, height: 900 }, locale, reducedMotion: 'reduce' });
      try {
        const output = page.locator('#terminal-output');
        assert.equal(await output.getAttribute('role'), 'log');
        assert.equal(await output.getAttribute('aria-live'), 'polite');
        const label = await page.evaluate(() => document.querySelector('label[for="terminal-input"]').textContent.replace(/\s+/g, ' ').trim());
        assert.match(label, locale === 'en' ? /Terminal command/ : /Comando do terminal/);
        await submit(page, 'cat curriculo.pdf');
        await submit(page, 'hobbies natureza');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(overflow <= 0, `${locale} ${width}px overflow ${overflow}`);
        const outputOverflow = await output.evaluate((node) => node.scrollWidth - node.clientWidth);
        assert.ok(outputOverflow <= 0, `${locale} ${width}px output wraps (${outputOverflow})`);
      } finally {
        await context.close();
      }
    }
  }
});
