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
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

let server;
let baseUrl = '';
let browser;

async function dismissIntroIfPresent(page) {
  await page.evaluate(() => {
    const el = document.getElementById('intro-preloader');
    if (el) {
      el.click();
      el.remove();
    }
  });
  await page.waitForFunction(
    () => !document.querySelector('astro-island[component-url*="CockpitMenu"][ssr]')
  );
}

before(async () => {
  const distDir = path.resolve('dist');
  server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let pathname = decodeURIComponent(reqUrl.pathname);
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    } else if (!path.extname(pathname)) {
      pathname += '/index.html';
    }
    const filePath = path.join(distDir, pathname);
    if (!filePath.startsWith(distDir) || !fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });

  const launchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
  if (fs.existsSync('/usr/bin/google-chrome')) {
    launchOptions.executablePath = '/usr/bin/google-chrome';
  }
  browser = await chromium.launch(launchOptions);
});

after(async () => {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('C1: cockpit menu overlay occupies full screen 100vw by 100dvh with z-index 9990', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  await page.click('#cockpit-trigger-btn');
  await page.waitForSelector('#cockpit-menu-overlay:not(.hidden)');

  const metrics = await page.evaluate(() => {
    const el = document.getElementById('cockpit-menu-overlay');
    if (!el) return null;
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return {
      position: style.position,
      zIndex: style.zIndex,
      width: rect.width,
      height: rect.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      hasRedSlash: Boolean(el.querySelector('[data-slash-red]')),
    };
  });

  assert.ok(metrics, 'Expected #cockpit-menu-overlay in DOM');
  assert.equal(metrics.position, 'fixed');
  assert.equal(metrics.zIndex, '9990');
  assert.equal(metrics.width, metrics.windowWidth);
  assert.ok(metrics.height >= metrics.windowHeight);
  assert.equal(metrics.hasRedSlash, true);

  await context.close();
});

test('C2: top controls comic-nav-logo and cockpit-trigger-btn remain visible at z-index 9999', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  await page.click('#cockpit-trigger-btn');
  await page.waitForSelector('#cockpit-menu-overlay:not(.hidden)');

  const headerInfo = await page.evaluate(() => {
    const header = document.getElementById('comic-nav-header');
    const logo = document.getElementById('comic-nav-logo');
    const trigger = document.getElementById('cockpit-trigger-btn');
    if (!header || !logo || !trigger) return null;
    const headerStyle = window.getComputedStyle(header);
    return {
      headerZIndex: headerStyle.zIndex,
      headerPosition: headerStyle.position,
      triggerAriaExpanded: trigger.getAttribute('aria-expanded'),
      headerCockpitOpen: header.dataset.cockpitOpen,
    };
  });

  assert.ok(headerInfo, 'Expected header elements');
  assert.equal(headerInfo.headerZIndex, '9999');
  assert.equal(headerInfo.headerPosition, 'sticky');
  assert.equal(headerInfo.triggerAriaExpanded, 'true');
  assert.equal(headerInfo.headerCockpitOpen, 'true');

  await context.close();
});

test('C3: clicking burger trigger or logo while open closes the menu', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  // 1. Open with burger button
  await page.click('#cockpit-trigger-btn');
  await page.waitForSelector('#cockpit-menu-overlay:not(.hidden)');

  // 2. Click burger button to close
  await page.click('#cockpit-trigger-btn');
  await page.waitForSelector('#cockpit-menu-overlay', { state: 'hidden' });

  // 3. Open with burger button again
  await page.click('#cockpit-trigger-btn');
  await page.waitForSelector('#cockpit-menu-overlay:not(.hidden)');

  // 4. Click logo to close
  await page.click('#comic-nav-logo');
  await page.waitForSelector('#cockpit-menu-overlay', { state: 'hidden' });

  // 5. Open and test Escape key
  await page.click('#cockpit-trigger-btn');
  await page.waitForSelector('#cockpit-menu-overlay:not(.hidden)');
  await page.keyboard.press('Escape');
  await page.waitForSelector('#cockpit-menu-overlay', { state: 'hidden' });

  await context.close();
});

test('C4: menu executes kinetic transitions and respects prefers-reduced-motion', async () => {
  // 1. Standard motion context: verify dynamic GSAP animation execution
  const stdContext = await browser.newContext({
    reducedMotion: 'no-preference',
  });
  const stdPage = await stdContext.newPage();
  await stdPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(stdPage);

  await stdPage.click('#cockpit-trigger-btn');
  await stdPage.waitForSelector('#cockpit-menu-overlay:not(.hidden)');
  // Wait for entrance timeline (~800ms total stagger duration) to finish
  await stdPage.waitForTimeout(850);

  const kineticStyles = await stdPage.evaluate(() => {
    const redSlash = document.querySelector(
      '#cockpit-menu-overlay [data-slash-red]'
    );
    const blades = Array.from(
      document.querySelectorAll('#cockpit-menu-overlay a[data-cockpit-link]')
    );
    return {
      slashStyle: redSlash?.getAttribute('style') || '',
      blades: blades.map((b) => ({
        inlineStyle: b.getAttribute('style') || '',
        opacity: window.getComputedStyle(b).opacity,
        transform: window.getComputedStyle(b).transform,
      })),
    };
  });

  assert.ok(
    kineticStyles.slashStyle.includes('transform'),
    'Backdrop red slash received dynamic GSAP transform style'
  );
  assert.equal(kineticStyles.blades.length, 6);
  for (const blade of kineticStyles.blades) {
    assert.ok(
      blade.inlineStyle.includes('transform') || blade.transform !== 'none',
      'Blade received kinetic transform styling'
    );
    assert.equal(blade.opacity, '1', 'Blade animated to full opacity');
  }

  // Verify graceful exit timeline execution
  const closeStart = Date.now();
  await stdPage.click('#cockpit-trigger-btn');
  await stdPage.waitForSelector('#cockpit-menu-overlay', { state: 'hidden' });
  const closeDuration = Date.now() - closeStart;
  assert.ok(
    closeDuration >= 150,
    `Close animation took ${closeDuration}ms, confirming graceful exit transition`
  );

  await stdContext.close();

  // 2. Reduced motion context: verify tweens are bypassed immediately
  const redContext = await browser.newContext({
    reducedMotion: 'reduce',
  });
  const redPage = await redContext.newPage();
  await redPage.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(redPage);

  await redPage.click('#cockpit-trigger-btn');
  await redPage.waitForSelector('#cockpit-menu-overlay:not(.hidden)');

  const redSlashStyle = await redPage.$eval(
    '#cockpit-menu-overlay [data-slash-red]',
    (el) => el.getAttribute('style') || ''
  );
  assert.ok(
    !redSlashStyle.includes('transform'),
    'GSAP timeline bypassed when prefers-reduced-motion is active'
  );

  const redCloseStart = Date.now();
  await redPage.click('#cockpit-trigger-btn');
  await redPage.waitForSelector('#cockpit-menu-overlay', { state: 'hidden' });
  const redCloseDuration = Date.now() - redCloseStart;
  assert.ok(
    redCloseDuration < 150,
    `Reduced-motion close was immediate without timeline delay (${redCloseDuration}ms)`
  );

  await redContext.close();
});

test('C5: all 6 navigation blades render with index codes and active blade tracking', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  await page.click('#cockpit-trigger-btn');
  await page.waitForSelector('#cockpit-menu-overlay:not(.hidden)');

  const expectedBladesPt = [
    { id: 'hero', code: '00', label: '01 // INÍCIO & MANIFESTO' },
    { id: 'works', code: '01', label: '02 // ARQUIVO DE PROJETOS' },
    { id: 'about', code: '02', label: '03 // DOSSIÊ CONFIDANT & SKILLS' },
    { id: 'lab', code: '03', label: '04 // CREATIVE LAB' },
    { id: 'contact', code: '04', label: '05 // ENVIAR PROPOSTA' },
    { id: 'whoami', code: '05', label: '06 // TERMINAL /WHOAMI' },
  ];

  const bladesPt = await page.$$eval(
    '#cockpit-menu-overlay a[data-cockpit-link]',
    (els) =>
      els.map((el) => {
        const labelSpan = el.querySelector('span.truncate');
        const codeSpan = el.querySelector('span.font-mono');
        return {
          id: el.getAttribute('data-cockpit-link'),
          code: codeSpan?.textContent?.trim() || '',
          label: labelSpan?.textContent?.trim() || '',
          active: el.getAttribute('data-active-blade'),
          ariaCurrent: el.getAttribute('aria-current'),
        };
      })
  );

  assert.equal(bladesPt.length, 6, 'Exactly 6 navigation blades rendered');
  for (let i = 0; i < expectedBladesPt.length; i++) {
    const exp = expectedBladesPt[i];
    const actual = bladesPt[i];
    assert.equal(actual.id, exp.id, `Blade ${i} has expected id ${exp.id}`);
    assert.equal(actual.code, exp.code, `Blade ${exp.id} has index code ${exp.code}`);
    assert.equal(actual.label, exp.label, `Blade ${exp.id} has localized label '${exp.label}'`);
  }

  const heroBlade = bladesPt.find((b) => b.id === 'hero');
  assert.equal(heroBlade.active, 'true');
  assert.equal(heroBlade.ariaCurrent, 'true');

  const worksBlade = bladesPt.find((b) => b.id === 'works');
  assert.equal(worksBlade.active, 'false');
  assert.equal(worksBlade.ariaCurrent, null);

  await page.click('button[data-cockpit-lang="en"]');
  await page.waitForTimeout(100);

  const expectedBladesEn = [
    { id: 'hero', code: '00', label: '01 // HOME & MANIFESTO' },
    { id: 'works', code: '01', label: '02 // BOUNTY ARCHIVE (WORKS)' },
    { id: 'about', code: '02', label: '03 // CONFIDANT DOSSIER & SKILLS' },
    { id: 'lab', code: '03', label: '04 // CREATIVE LAB' },
    { id: 'contact', code: '04', label: '05 // TRANSMIT A BOUNTY' },
    { id: 'whoami', code: '05', label: '06 // TERMINAL /WHOAMI' },
  ];

  const bladesEn = await page.$$eval(
    '#cockpit-menu-overlay a[data-cockpit-link]',
    (els) =>
      els.map((el) => {
        const labelSpan = el.querySelector('span.truncate');
        const codeSpan = el.querySelector('span.font-mono');
        return {
          id: el.getAttribute('data-cockpit-link'),
          code: codeSpan?.textContent?.trim() || '',
          label: labelSpan?.textContent?.trim() || '',
        };
      })
  );

  for (let i = 0; i < expectedBladesEn.length; i++) {
    const exp = expectedBladesEn[i];
    const actual = bladesEn[i];
    assert.equal(actual.id, exp.id, `[EN] Blade ${i} has expected id ${exp.id}`);
    assert.equal(actual.code, exp.code, `[EN] Blade ${exp.id} has index code ${exp.code}`);
    assert.equal(actual.label, exp.label, `[EN] Blade ${exp.id} has localized label '${exp.label}'`);
  }

  await context.close();
});

test('C6: zero horizontal overflow while fullscreen menu is open across viewports and locales', async () => {
  const viewports = [
    { width: 320, height: 640 },
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ];
  const locales = ['pt-br', 'en'];

  const context = await browser.newContext();
  const page = await context.newPage();

  for (const locale of locales) {
    await page.addInitScript((loc) => {
      window.localStorage.setItem('brinu_locale', loc);
    }, locale);

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
      await dismissIntroIfPresent(page);

      await page.click('#cockpit-trigger-btn');
      await page.waitForSelector('#cockpit-menu-overlay:not(.hidden)');

      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      assert.ok(
        metrics.scrollWidth <= metrics.clientWidth,
        `Horizontal overflow (${locale}) at ${vp.width}px: scrollWidth=${metrics.scrollWidth} > clientWidth=${metrics.clientWidth}`
      );

      await page.click('#cockpit-trigger-btn');
      await page.waitForSelector('#cockpit-menu-overlay', { state: 'hidden' });
    }
  }

  await context.close();
});
