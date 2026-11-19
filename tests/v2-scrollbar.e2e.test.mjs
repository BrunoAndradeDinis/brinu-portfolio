import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2' };
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
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreDefaultArgs: ['--hide-scrollbars'] };
  if (fs.existsSync('/usr/bin/google-chrome')) launchOptions.executablePath = '/usr/bin/google-chrome';
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});


const RED = [254, 0, 0];
const BLACK = [8, 8, 8];
const PAPER = [251, 250, 244];
const SIZE = 14;

async function openPage(route, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  return { context, page };
}

function near(pixel, color) {
  return pixel.every((channel, index) => Math.abs(channel - color[index]) <= 6);
}

async function sampleColumn(page, x, top, height) {
  const png = await page.screenshot({ clip: { x, y: top, width: 1, height } });
  return page.evaluate(async (data) => {
    const image = await createImageBitmap(await (await fetch(`data:image/png;base64,${data}`)).blob());
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
    const column = [];
    for (let y = 0; y < image.height; y += 1) column.push([pixels[y * 4 * image.width], pixels[y * 4 * image.width + 1], pixels[y * 4 * image.width + 2]]);
    return column;
  }, png.toString('base64'));
}

function scrollbarVars(page, selector) {
  return page.evaluate((target) => {
    const style = getComputedStyle(document.querySelector(target));
    return ['--scrollbar-thumb', '--scrollbar-track', '--scrollbar-size'].map((name) => style.getPropertyValue(name).trim().toLowerCase());
  }, selector);
}

test('SCR-01: the page scrollbar is a squared red thumb on a black track with no arrow buttons', async () => {
  const { context, page } = await openPage('/');
  try {
    assert.deepEqual(await scrollbarVars(page, 'html'), ['#fe0000', '#080808', '14px']);
    await page.waitForFunction(() => document.documentElement.classList.contains('intro-completed'));
    await page.waitForTimeout(200);
    const gutter = await page.evaluate(() => window.innerWidth - document.documentElement.clientWidth);
    assert.equal(gutter, SIZE, 'page scrollbar keeps a 14px stable gutter');
    const column = await sampleColumn(page, 1440 - SIZE / 2, 0, 900);
    assert.ok(near(column[1], BLACK), 'the track edge sits at the very top');
    assert.ok(near(column[6], RED), 'the thumb starts right under the edge, so there is no arrow button');
    assert.ok(near(column[899], BLACK), 'the track reaches the bottom without an arrow button');
    assert.ok(column.filter((pixel) => near(pixel, RED)).length >= 48, 'the red thumb is visible');
  } finally {
    await context.close();
  }
});

test('SCR-02: the /whoami terminal uses the same identity scrollbar', async () => {
  const { context, page } = await openPage('/whoami');
  try {
    assert.deepEqual(await scrollbarVars(page, '#terminal-output'), ['#fe0000', '#080808', '14px']);
    await page.waitForFunction(() => !document.querySelector('#terminal-input')?.disabled);
    for (let index = 0; index < 3; index += 1) {
      await page.fill('#terminal-input', 'help');
      await page.press('#terminal-input', 'Enter');
    }
    const box = await page.evaluate(() => {
      const output = document.querySelector('#terminal-output');
      output.scrollTop = 0;
      output.scrollIntoView({ block: 'center' });
      const rect = output.getBoundingClientRect();
      return { overflow: output.scrollHeight > output.clientHeight, gutter: output.offsetWidth - output.clientWidth, right: rect.right, top: rect.top, height: rect.height };
    });
    assert.ok(box.overflow, 'terminal output overflows');
    assert.equal(box.gutter, SIZE);
    await page.waitForTimeout(200);
    const column = await sampleColumn(page, Math.floor(box.right - SIZE / 2), Math.ceil(box.top), Math.floor(box.height));
    assert.ok(near(column[6], RED), 'terminal thumb is red with no arrow button above it');
    assert.ok(near(column.at(-2), BLACK), 'terminal track is black at the bottom');
  } finally {
    await context.close();
  }
});

test('SCR-03: paper panels switch to a black thumb on a paper track', async () => {
  const { context, page } = await openPage('/');
  try {
    for (const selector of ['[data-skill-panel-body]', '[data-hobby-panel-body]']) {
      assert.deepEqual(await scrollbarVars(page, selector), ['#080808', '#fbfaf4', '14px'], selector);
    }
  } finally {
    await context.close();
  }
});

test('SCR-04: Firefox gets the same colors through scrollbar-color', () => {
  const files = fs.readdirSync('dist/_astro').filter((file) => file.endsWith('.css')).map((file) => fs.readFileSync(path.join('dist/_astro', file), 'utf8'));
  const inline = [...fs.readFileSync('dist/index.html', 'utf8').matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]);
  const css = [...files, ...inline].join('\n');
  assert.match(css, /@supports not selector\(::-webkit-scrollbar\)/);
  assert.match(css, /scrollbar-color:\s*var\(--scrollbar-thumb-paint\)\s+var\(--scrollbar-track\)/);
  assert.match(css, /::-webkit-scrollbar-button\{[^}]*display:none/);
});

test('SCR-05: the scrollbar adds no horizontal overflow from 320 to 2560px', async () => {
  for (const width of [320, 768, 1440, 2560]) {
    for (const route of ['/', '/whoami']) {
      const { context, page } = await openPage(route, { width, height: 900 });
      try {
        const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
        assert.ok(sizes.scroll <= sizes.client, `${route} at ${width}px: ${sizes.scroll} > ${sizes.client}`);
      } finally {
        await context.close();
      }
    }
  }
});

function paintAt(page, selector, delays) {
  return page.evaluate(async ({ target, waits }) => {
    const element = document.querySelector(target);
    const samples = [];
    const started = performance.now();
    for (const wait of waits) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, wait - (performance.now() - started))));
      samples.push(getComputedStyle(element).getPropertyValue('--scrollbar-thumb-paint').trim());
    }
    return samples;
  }, { target: selector, waits: delays });
}

function channels(color) {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (match) return match[1].split(/[ ,]+/).slice(0, 3).map(Number);
  const hex = color.replace('#', '');
  return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16));
}

test('SCR-06: hovering a scrollbar fades the thumb with a 0.4s ease-in-out', async () => {
  const { context, page } = await openPage('/stickers');
  try {
    const timing = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return style.transitionProperty;
    });
    assert.equal(timing, 'none', 'reduced motion switches the colour without a fade');
  } finally {
    await context.close();
  }

  const context2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await context2.newPage();
  try {
    await page2.goto(`${baseUrl}/stickers`, { waitUntil: 'networkidle' });
    await page2.waitForTimeout(1500);
    assert.deepEqual(await page2.evaluate(() => { const style = getComputedStyle(document.documentElement); return [style.transitionProperty, style.transitionDuration, style.transitionTimingFunction]; }), ['--scrollbar-thumb-paint', '0.4s', 'ease-in-out']);
    await page2.mouse.move(1440 - SIZE / 2, 20);
    const [early, middle, done] = (await paintAt(page2, 'html', [60, 200, 650])).map(channels);
    assert.ok(early[1] < 200, `starts close to red, got ${early}`);
    assert.ok(middle[1] > 20 && middle[1] < 240, `passes through an in-between colour, got ${middle}`);
    assert.ok(near(done, PAPER), `ends on paper white, got ${done}`);
    const column = await sampleColumn(page2, 1440 - SIZE / 2, 0, 60);
    assert.ok(near(column[10], PAPER), 'the painted thumb is paper white while hovered');
    await page2.mouse.move(700, 400);
    const [back] = (await paintAt(page2, 'html', [650])).map(channels);
    assert.ok(near(back, RED), `fades back to red, got ${back}`);

    await page2.goto(`${baseUrl}/whoami`, { waitUntil: 'networkidle' });
    await page2.waitForFunction(() => !document.querySelector('#terminal-input')?.disabled);
    for (let index = 0; index < 3; index += 1) {
      await page2.fill('#terminal-input', 'help');
      await page2.press('#terminal-input', 'Enter');
    }
    const box = await page2.evaluate(() => {
      const rect = document.querySelector('#terminal-output').getBoundingClientRect();
      return { x: rect.right - 7, y: rect.top + rect.height / 2 };
    });
    await page2.mouse.move(box.x, box.y);
    const [terminalDone] = (await paintAt(page2, '#terminal-output', [650])).map(channels);
    assert.ok(near(terminalDone, PAPER), `terminal thumb fades to paper white, got ${terminalDone}`);
    assert.ok(!(await page2.evaluate(() => document.documentElement.hasAttribute('data-scrollbar-hot'))), 'only the hovered scroller lights up');
  } finally {
    await context2.close();
  }
});

test('SCR-07: the /whoami terminal keeps its size while commands fill it', async () => {
  for (const width of [320, 768, 1440]) {
    const { context, page } = await openPage('/whoami', { width, height: 900 });
    try {
      await page.waitForFunction(() => !document.querySelector('#terminal-input')?.disabled);
      await page.evaluate(() => document.fonts.ready);
      const measure = () => page.evaluate(() => {
        const rect = document.querySelector('[data-terminal-window]').getBoundingClientRect();
        const output = document.querySelector('#terminal-output');
        return { top: Math.round(rect.top + window.scrollY), height: Math.round(rect.height), overflow: output.scrollHeight > output.clientHeight, pinned: output.scrollHeight - output.scrollTop - output.clientHeight <= 2 };
      });
      const start = await measure();
      for (const command of ['help', 'skills', 'career', 'education', 'hobbies']) {
        await page.fill('#terminal-input', command);
        await page.press('#terminal-input', 'Enter');
        await page.waitForTimeout(50);
        const now = await measure();
        assert.equal(now.height, start.height, `${width}px height after ${command}`);
        assert.equal(now.top, start.top, `${width}px top after ${command}`);
        if (now.overflow) assert.ok(now.pinned, `${width}px output stays pinned to the bottom after ${command}`);
      }
      assert.ok((await measure()).overflow, `${width}px output scrolls inside the window`);
    } finally {
      await context.close();
    }
  }
});
