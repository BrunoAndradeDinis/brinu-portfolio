import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};


let server;
let baseUrl = '';
let browser;

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(reqUrl.pathname);
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
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      baseUrl = `http://127.0.0.1:${server.address().port}`;
      resolve();
    });
  });
  const launchOptions = { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  if (fs.existsSync('/usr/bin/google-chrome')) launchOptions.executablePath = '/usr/bin/google-chrome';
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

async function openPath(route, { locale = 'pt-br', viewport = { width: 1440, height: 900 }, ...contextOptions } = {}) {
  const context = await browser.newContext({ viewport, ...contextOptions });
  const page = await context.newPage();
  await page.addInitScript((loc) => {
    window.localStorage.setItem('brinu_locale', loc);
  }, locale);
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
    window.dispatchEvent(new CustomEvent('intro-complete'));
  });
  return { context, page };
}



const BLADES = ['hero', 'works', 'about', 'contact', 'whoami'];
const overlayOpen = (page) =>
  page.evaluate(() => {
    const overlay = document.getElementById('cockpit-menu-overlay');
    const trigger = document.getElementById('cockpit-trigger-btn');
    return {
      hidden: overlay.getAttribute('aria-hidden'),
      display: getComputedStyle(overlay).display,
      expanded: trigger.getAttribute('aria-expanded'),
      locked: document.documentElement.classList.contains('cockpit-menu-open'),
      overflow: getComputedStyle(document.documentElement).overflow,
    };
  });
const waitClosed = (page) =>
  page.waitForFunction(() => {
    const overlay = document.getElementById('cockpit-menu-overlay');
    return overlay !== null && overlay.getAttribute('aria-hidden') === 'true' && !document.documentElement.classList.contains('cockpit-menu-open');
  });
const openCockpit = async (page) => {
  await page.locator('#cockpit-trigger-btn').click();
  await page.waitForFunction(() => document.getElementById('cockpit-menu-overlay').getAttribute('aria-hidden') === 'false');
};

test('CKP-01: the trigger opens the modal menu and locks scroll', async () => {
  const { context, page } = await openPath('/');
  try {
    const dialog = page.locator('#cockpit-menu-overlay');
    assert.equal(await dialog.getAttribute('role'), 'dialog');
    assert.equal(await dialog.getAttribute('aria-modal'), 'true');
    assert.equal((await overlayOpen(page)).expanded, 'false');
    await openCockpit(page);
    const state = await overlayOpen(page);
    assert.equal(state.expanded, 'true');
    assert.equal(state.display, 'block');
    assert.equal(state.locked, true);
    assert.equal(state.overflow, 'hidden');
  } finally {
    await context.close();
  }
});

test('CKP-02: Escape or the trigger closes the menu and returns focus', async () => {
  const { context, page } = await openPath('/');
  try {
    for (const closeWith of ['escape', 'trigger']) {
      await openCockpit(page);
      if (closeWith === 'escape') await page.keyboard.press('Escape');
      else await page.locator('#cockpit-trigger-btn').click();
      await waitClosed(page);
      const state = await overlayOpen(page);
      assert.equal(state.expanded, 'false', `${closeWith} expanded`);
      assert.equal(state.locked, false, `${closeWith} scroll released`);
      assert.equal(state.overflow === 'hidden', false, `${closeWith} overflow`);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'cockpit-trigger-btn', `${closeWith} focus`);
    }
  } finally {
    await context.close();
  }
});

test('CKP-03: the menu lists five blades and closes on activation', async () => {
  const { context, page } = await openPath('/');
  try {
    await openCockpit(page);
    const readBlades = () => page.locator('#cockpit-menu-overlay [data-cockpit-link]').evaluateAll((nodes) =>
      nodes.map((node) => ({ id: node.getAttribute('data-cockpit-link'), href: node.getAttribute('href'), current: node.getAttribute('aria-current') }))
    );
    const blades = await readBlades();
    assert.deepEqual(blades.map((blade) => blade.id), BLADES);
    assert.deepEqual(blades.map((blade) => blade.href), ['#hero', '#works', '#about', '#contact', '/whoami']);
    assert.deepEqual(blades.map((blade) => blade.current), ['true', null, null, null, null]);
    await page.locator('#cockpit-menu-overlay [data-cockpit-link="works"]').click();
    await waitClosed(page);
    assert.equal(new URL(page.url()).hash, '#works');
    await openCockpit(page);
    const afterClick = await readBlades();
    assert.deepEqual(afterClick.filter((blade) => blade.current).map((blade) => [blade.id, blade.current]), [['works', 'true']]);
    await page.locator('#cockpit-menu-overlay [data-cockpit-link="whoami"]').click();
    await page.waitForFunction(() => location.pathname === '/whoami');
    await waitClosed(page);
    await openCockpit(page);
    const onWhoami = await readBlades();
    assert.deepEqual(onWhoami.filter((blade) => blade.current).map((blade) => [blade.id, blade.current]), [['whoami', 'page']]);
  } finally {
    await context.close();
  }
});

test('CKP-06: reduced motion opens and closes the menu without a tween', async () => {
  const run = async (reducedMotion) => {
    const { context, page } = await openPath('/', { reducedMotion });
    try {
      await page.locator('#cockpit-trigger-btn').click();
      await page.waitForTimeout(40);
      const opened = await page.evaluate(() => ({
        hidden: document.getElementById('cockpit-menu-overlay').getAttribute('aria-hidden'),
        opacities: [...document.querySelectorAll('#cockpit-menu-overlay [data-cockpit-link]')].map((node) => Number(getComputedStyle(node).opacity)),
      }));
      await page.waitForTimeout(700);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(60);
      const lockedAfterEscape = (await overlayOpen(page)).locked;
      await page.waitForTimeout(700);
      await page.locator('#cockpit-trigger-btn').click();
      await page.waitForTimeout(700);
      await page.locator('#cockpit-trigger-btn').click();
      await page.waitForTimeout(60);
      const lockedAfterTrigger = (await overlayOpen(page)).locked;
      return { opened, lockedAfterEscape, lockedAfterTrigger };
    } finally {
      await context.close();
    }
  };
  const reduced = await run('reduce');
  assert.equal(reduced.opened.hidden, 'false');
  assert.ok(reduced.opened.opacities.every((opacity) => opacity === 1), `blades are at full opacity at once: ${reduced.opened.opacities}`);
  assert.equal(reduced.lockedAfterEscape, false, 'Escape closes at once');
  assert.equal(reduced.lockedAfterTrigger, false, 'the trigger closes at once');
  const full = await run('no-preference');
  assert.equal(full.lockedAfterEscape, true, 'full motion still tweens on Escape');
  assert.equal(full.lockedAfterTrigger, true, 'full motion still tweens on the trigger');
});

test('CKP-04: the open menu shows socials, language toggle and cases link', async () => {
  const { PROFILE } = await import('../src/data/profile.ts');
  const { context, page } = await openPath('/');
  try {
    await openCockpit(page);
    const overlay = page.locator('#cockpit-menu-overlay');
    for (const [name, url] of [['linkedin', PROFILE.linkedin.url], ['github', PROFILE.github.url]]) {
      const link = overlay.locator(`[data-cockpit-social="${name}"]`);
      assert.equal(await link.getAttribute('href'), url, `${name} url`);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.equal(await link.getAttribute('rel'), 'noopener noreferrer');
      assert.ok((await link.getAttribute('aria-label')).trim().length > 0, `${name} label`);
    }
    const pressed = () => overlay.locator('[data-cockpit-lang]').evaluateAll((nodes) => nodes.map((node) => [node.getAttribute('data-cockpit-lang'), node.getAttribute('aria-pressed')]));
    assert.deepEqual(await pressed(), [['pt-br', 'true'], ['en', 'false']]);
    const cases = overlay.locator('[data-cockpit-cases]');
    assert.equal((await cases.textContent()).trim(), 'CASES →');
    assert.equal(await cases.getAttribute('href'), '/cases/magalu-cloud');
    await overlay.locator('[data-cockpit-lang="en"]').click();
    await page.waitForFunction(() => document.querySelector('[data-cockpit-lang="en"]').getAttribute('aria-pressed') === 'true');
    assert.deepEqual(await pressed(), [['pt-br', 'false'], ['en', 'true']]);
    assert.ok((await overlay.locator('[data-cockpit-social="github"]').getAttribute('aria-label')).includes('GitHub'));
    assert.equal((await cases.textContent()).trim(), 'CASES →');
    await cases.click();
    await page.waitForURL(/\/cases\/magalu-cloud\/?$/);
  } finally {
    await context.close();
  }
});

test('CKP-05: the open menu columns and overflow match each breakpoint', async () => {
  const columns = (page, selector) =>
    page.locator(selector).evaluateAll((nodes) => {
      const tops = nodes.map((node) => Math.round(node.getBoundingClientRect().top));
      return tops.filter((top) => top === tops[0]).length;
    });
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 390, 768, 1024, 1440, 2560]) {
      const label = `${locale} ${width}px`;
      const { context, page } = await openPath('/', { locale, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        await openCockpit(page);
        const m = await page.evaluate(() => {
          const overlay = document.getElementById('cockpit-menu-overlay');
          return { sw: overlay.scrollWidth, cw: overlay.clientWidth, dw: document.documentElement.scrollWidth, dcw: document.documentElement.clientWidth };
        });
        assert.ok(m.sw <= m.cw && m.dw <= m.dcw, `${label} overflow ${JSON.stringify(m)}`);
        const bladeColumns = await columns(page, '#cockpit-menu-overlay [data-cockpit-link]');
        const barColumns = await columns(page, '#cockpit-menu-overlay [data-cockpit-lang="pt-br"], #cockpit-menu-overlay [data-cockpit-cases], #cockpit-menu-overlay [data-cockpit-cv]');
        if (width >= 768) {
          assert.equal(bladeColumns, 2, `${label} blades in two columns`);
        } else {
          assert.equal(bladeColumns, 1, `${label} blades in one column`);
        }
        const barRow = await page.evaluate(() => {
          const cells = [document.querySelector('#cockpit-menu-overlay [data-cockpit-lang="pt-br"]').closest('div.border-3'), document.querySelector('#cockpit-menu-overlay [data-cockpit-cases]'), document.querySelector('#cockpit-menu-overlay [data-cockpit-cv]')];
          const tops = cells.map((cell) => Math.round(cell.getBoundingClientRect().top));
          return tops.filter((top) => top === tops[0]).length;
        });
        assert.equal(barRow, width >= 768 ? 3 : 1, `${label} bottom bar columns (${barColumns})`);
        const small = await page.evaluate(() =>
          [...document.querySelectorAll('#cockpit-menu-overlay a, #cockpit-menu-overlay button, #cockpit-trigger-btn')]
            .map((node) => ({ name: node.getAttribute('data-cockpit-link') ?? node.getAttribute('data-cockpit-lang') ?? node.getAttribute('data-cockpit-social') ?? node.id ?? node.tagName, h: Math.round(node.getBoundingClientRect().height), w: Math.round(node.getBoundingClientRect().width) }))
            .filter((box) => box.h < 44 || box.w < 44)
        );
        assert.deepEqual(small, [], `${label} controls under 44px`);
      } finally {
        await context.close();
      }
    }
  }
});

const stickerData = async () => {
  const { STICKERS } = await import('../src/data/stickers.ts');
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  return { STICKERS, DICTIONARIES };
};

test('STK-01: the library shows 56 downloads in 2, 3 and 4 columns', async () => {
  const { STICKERS } = await stickerData();
  for (const [width, expectedColumns] of [[390, 2], [768, 3], [1440, 4]]) {
    const { context, page } = await openPath('/stickers', { viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    try {
      const links = await page.locator('a[data-sticker-download]').evaluateAll((nodes) =>
        nodes.map((node) => ({ href: node.getAttribute('href'), download: node.getAttribute('download'), top: Math.round(node.getBoundingClientRect().top) }))
      );
      assert.equal(links.length, 56, `${width}px count`);
      assert.deepEqual(links.map((link) => link.href), STICKERS.map((sticker) => sticker.file), `${width}px order`);
      assert.deepEqual(links.map((link) => link.download), STICKERS.map((_, index) => `brinu-sticker-${String(index + 1).padStart(2, '0')}.svg`), `${width}px file names`);
      assert.equal(links.filter((link) => link.top === links[0].top).length, expectedColumns, `${width}px columns`);
    } finally {
      await context.close();
    }
  }
});

test('STK-02: stickers have no overflow and follow the locale', async () => {
  const { STICKERS, DICTIONARIES } = await stickerData();
  for (const locale of ['pt-br', 'en']) {
    for (const width of [320, 390, 768, 1024, 1440, 2560]) {
      const { context, page } = await openPath('/stickers', { locale, viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      try {
        const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, bw: document.body.scrollWidth }));
        assert.ok(m.sw <= m.cw && m.bw <= m.cw, `${locale} ${width}px overflow ${m.sw}/${m.bw} > ${m.cw}`);
        if (width === 390) {
          const prefix = DICTIONARIES[locale].stickers.downloadAria;
          for (let index = 0; index < STICKERS.length; index++) {
            const link = page.locator('a[data-sticker-download]').nth(index);
            const alt = STICKERS[index].alt[locale];
            assert.equal(await link.getAttribute('aria-label'), `${prefix} ${alt}`, `${locale} aria-label ${index}`);
            assert.equal(await link.locator('img').getAttribute('alt'), alt, `${locale} alt ${index}`);
          }
        }
      } finally {
        await context.close();
      }
    }
  }
  const { context, page } = await openPath('/stickers', { locale: 'pt-br', reducedMotion: 'reduce' });
  try {
    await page.evaluate(() => { window.__marker = 'kept'; });
    await page.locator('[data-lang-toggle]').first().click();
    await page.waitForFunction((alt) => document.querySelector('a[data-sticker-download] img').getAttribute('alt') === alt, STICKERS[0].alt.en);
    assert.equal(await page.evaluate(() => window.__marker), 'kept');
    const live = await page.locator('a[data-sticker-download]').evaluateAll((nodes) => nodes.map((node) => [node.getAttribute('aria-label'), node.querySelector('img').getAttribute('alt')]));
    assert.deepEqual(live, STICKERS.map((sticker) => [`${DICTIONARIES.en.stickers.downloadAria} ${sticker.alt.en}`, sticker.alt.en]));
  } finally {
    await context.close();
  }
});

test('STK-03: a focused sticker shows an outline and lifts', async () => {
  const { context, page } = await openPath('/stickers', { reducedMotion: 'no-preference' });
  try {
    const panelOf = (index) => page.locator('a[data-sticker-download]').nth(index).locator('.p5-panel');
    assert.equal(await panelOf(0).evaluate((node) => getComputedStyle(node).translate), 'none');
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press('Tab');
      if (await page.evaluate(() => document.activeElement?.hasAttribute('data-sticker-download'))) break;
    }
    assert.equal(await page.evaluate(() => document.activeElement?.hasAttribute('data-sticker-download')), true, 'Tab reaches a sticker');
    await page.waitForTimeout(300);
    const focused = await page.evaluate(() => {
      const link = document.activeElement;
      const style = getComputedStyle(link);
      return { outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth), panel: getComputedStyle(link.querySelector('.p5-panel')).translate };
    });
    assert.notEqual(focused.outlineStyle, 'none');
    assert.ok(focused.outlineWidth >= 2, `outline ${focused.outlineWidth}px`);
    assert.match(focused.panel, /^0(px)? -[1-9]/, `panel lifted: ${focused.panel}`);
  } finally {
    await context.close();
  }
});

test('CKP-PROTO: the open menu keeps the prototype structure at 1440, 768 and 390px', async () => {
  const { PROFILE } = await import('../src/data/profile.ts');
  for (const width of [1440, 768, 390]) {
    const { context, page } = await openPath('/', { viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    try {
      await openCockpit(page);
      const overlay = page.locator('#cockpit-menu-overlay');
      assert.equal(await overlay.locator('h2').count(), 0, `${width}px no big title`);
      assert.equal(await overlay.locator('nav').getAttribute('aria-label'), 'TAKE YOUR TIME');
      const socials = await overlay.locator('[data-cockpit-social]').evaluateAll((nodes) =>
        nodes.map((node) => ({ id: node.dataset.cockpitSocial, text: node.textContent.trim(), icon: node.querySelectorAll('span[aria-hidden]').length, w: Math.round(node.getBoundingClientRect().width), h: Math.round(node.getBoundingClientRect().height) }))
      );
      assert.deepEqual(socials, [{ id: 'linkedin', text: '', icon: 1, w: 44, h: 44 }, { id: 'github', text: '', icon: 1, w: 44, h: 44 }], `${width}px icon-only socials`);
      assert.deepEqual(await overlay.locator('[data-cockpit-social]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))), [PROFILE.linkedin.url, PROFILE.github.url]);
      const cv = overlay.locator('[data-cockpit-cv]');
      assert.equal(await cv.getAttribute('href'), '/curriculo-bruno-dinis.pdf');
      assert.equal(await cv.getAttribute('download'), '');
      assert.equal((await cv.innerText()).trim(), '↓ BAIXAR CURRÍCULO');
      assert.equal(await overlay.locator('#cockpit-audio-toggle').count(), 0, `${width}px no audio control`);
      const colors = await page.evaluate(() => ({
        active: getComputedStyle(document.querySelector('[data-cockpit-link][data-active-blade="true"]')).color,
        cases: getComputedStyle(document.querySelector('[data-cockpit-cases]')).color,
        lang: getComputedStyle(document.querySelector('[data-cockpit-lang][aria-pressed="true"]')).color,
      }));
      assert.deepEqual(colors, { active: 'rgb(251, 250, 244)', cases: 'rgb(251, 250, 244)', lang: 'rgb(251, 250, 244)' }, `${width}px prototype text colors`);
    } finally {
      await context.close();
    }
  }
});
