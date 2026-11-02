import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { chromium } from 'playwright';
import { PROFILE, buildPersonJsonLd } from '../src/data/profile.ts';
import { ptBrDict, enDict } from '../src/i18n/dictionaries.ts';
import { localeToOgLocale, resolveTranslationKey } from '../src/i18n/index.ts';

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
  if (browser) {
    await browser.close();
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('C1: CyberDeck.tsx uses explicit named Three.js imports without wildcard namespace import', () => {
  const source = fs.readFileSync(
    path.resolve('src/components/lab/CyberDeck.tsx'),
    'utf8'
  );
  assert.equal(
    source.includes('import * as THREE'),
    false,
    'CyberDeck.tsx must not use wildcard import * as THREE'
  );
  assert.equal(
    source.includes('THREE.'),
    false,
    'CyberDeck.tsx must not reference THREE. namespace'
  );
  for (const symbol of [
    'Scene',
    'PerspectiveCamera',
    'WebGLRenderer',
    'Group',
    'Mesh',
    'PointLight',
    'AmbientLight',
    'DirectionalLight',
    'BoxGeometry',
    'PlaneGeometry',
    'SphereGeometry',
    'EdgesGeometry',
    'MeshStandardMaterial',
    'LineBasicMaterial',
    'LineSegments',
    'SRGBColorSpace',
  ]) {
    assert.ok(
      source.includes(symbol),
      `Expected CyberDeck.tsx to import and use ${symbol}`
    );
  }
});

test('C2: all built JS chunks in dist/_astro/ are under 500 kB with zero chunk warnings', () => {
  const astroDir = path.resolve('dist/_astro');
  assert.equal(fs.existsSync(astroDir), true, 'dist/_astro must exist');

  const jsFiles = fs
    .readdirSync(astroDir)
    .filter((f) => f.endsWith('.js'));
  assert.ok(jsFiles.length > 5, 'Expected multiple split JS chunks in dist/_astro');

  for (const file of jsFiles) {
    const fullPath = path.join(astroDir, file);
    const stat = fs.statSync(fullPath);
    assert.ok(
      stat.size < 500_000,
      `Chunk ${file} (${stat.size} bytes) exceeds 500,000 bytes`
    );
  }
});

test('T2a: buildPersonJsonLd exports canonical Schema.org Person with Franca / SP and official links', () => {
  const jsonLd = buildPersonJsonLd();
  assert.equal(jsonLd['@context'], 'https://schema.org');
  assert.equal(jsonLd['@type'], 'Person');
  assert.equal(jsonLd.name, 'Bruno de Andrade Dinis');
  assert.equal(jsonLd.alternateName, 'Brinu');
  assert.equal(jsonLd.birthDate, '1996');
  assert.equal(jsonLd.email, 'bruno.a.dinis96@gmail.com');
  assert.equal(jsonLd.address['@type'], 'PostalAddress');
  assert.equal(jsonLd.address.addressLocality, 'Franca');
  assert.equal(jsonLd.address.addressRegion, 'SP');
  assert.equal(jsonLd.address.addressCountry, 'BR');
  assert.deepEqual(jsonLd.sameAs, [
    PROFILE.github.url,
    PROFILE.linkedin.url,
  ]);
});

test('T2b: localeToOgLocale and a11y.skipToContent provide bilingual parity', () => {
  assert.equal(localeToOgLocale('pt-br'), 'pt_BR');
  assert.equal(localeToOgLocale('en'), 'en_US');
  assert.equal(
    resolveTranslationKey('pt-br', 'a11y.skipToContent'),
    ptBrDict.a11y.skipToContent
  );
  assert.equal(
    resolveTranslationKey('en', 'a11y.skipToContent'),
    enDict.a11y.skipToContent
  );
  assert.notEqual(ptBrDict.a11y.skipToContent, enDict.a11y.skipToContent);
});

test('C4: BaseLayout renders theme-color #FE0000, OpenGraph, and Twitter Card meta tags', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  assert.equal(
    await page.getAttribute('meta[name="theme-color"]', 'content'),
    '#FE0000'
  );
  assert.equal(
    await page.getAttribute('meta[property="og:type"]', 'content'),
    'website'
  );
  assert.equal(
    await page.getAttribute('meta[property="og:title"]', 'content'),
    ptBrDict.meta.title
  );
  assert.equal(
    await page.getAttribute('meta[property="og:description"]', 'content'),
    ptBrDict.meta.description
  );
  assert.equal(
    await page.getAttribute('meta[property="og:image"]', 'content'),
    '/assets/brinu-avatar.jpg'
  );
  assert.equal(
    await page.getAttribute('meta[property="og:locale"]', 'content'),
    'pt_BR'
  );
  assert.equal(
    await page.getAttribute('meta[name="twitter:card"]', 'content'),
    'summary_large_image'
  );
  assert.equal(
    await page.getAttribute('meta[name="twitter:title"]', 'content'),
    ptBrDict.meta.title
  );
  assert.equal(
    await page.getAttribute('meta[name="twitter:description"]', 'content'),
    ptBrDict.meta.description
  );
  assert.equal(
    await page.getAttribute('meta[name="twitter:image"]', 'content'),
    '/assets/brinu-avatar.jpg'
  );

  await context.close();
});

test('C5: #profile-jsonld exposes valid Schema.org Person JSON-LD with Franca / SP and official links', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });

  const rawJson = await page.locator('#profile-jsonld').textContent();
  assert.ok(rawJson, 'Expected #profile-jsonld script tag in head');

  const parsed = JSON.parse(rawJson);
  assert.equal(parsed['@context'], 'https://schema.org');
  assert.equal(parsed['@type'], 'Person');
  assert.equal(parsed.name, 'Bruno de Andrade Dinis');
  assert.equal(parsed.alternateName, 'Brinu');
  assert.equal(parsed.email, 'bruno.a.dinis96@gmail.com');
  assert.equal(parsed.address.addressLocality, 'Franca');
  assert.equal(parsed.address.addressRegion, 'SP');
  assert.equal(parsed.address.addressCountry, 'BR');
  assert.deepEqual(parsed.sameAs, [
    'https://github.com/BrunoAndradeDinis',
    'https://www.linkedin.com/in/bruno-de-andrade-dinis',
  ]);

  await context.close();
});

test('C6: language toggle reactively updates OpenGraph and Twitter meta tags between pt_BR and en_US', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  assert.equal(
    await page.getAttribute('meta[property="og:locale"]', 'content'),
    'pt_BR'
  );

  await page.click('#nav-lang-toggle-btn');

  assert.equal(
    await page.getAttribute('meta[property="og:locale"]', 'content'),
    'en_US'
  );
  assert.equal(
    await page.getAttribute('meta[property="og:title"]', 'content'),
    enDict.meta.title
  );
  assert.equal(
    await page.getAttribute('meta[property="og:description"]', 'content'),
    enDict.meta.description
  );
  assert.equal(
    await page.getAttribute('meta[name="twitter:title"]', 'content'),
    enDict.meta.title
  );
  assert.equal(
    await page.getAttribute('meta[name="twitter:description"]', 'content'),
    enDict.meta.description
  );

  await page.click('#nav-lang-toggle-btn');
  assert.equal(
    await page.getAttribute('meta[property="og:locale"]', 'content'),
    'pt_BR'
  );
  assert.equal(
    await page.getAttribute('meta[property="og:title"]', 'content'),
    ptBrDict.meta.title
  );

  await context.close();
});

test('C7: #skip-to-content-link is first focusable element targeting #main-content in pt-br and en', async () => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' });
  await dismissIntroIfPresent(page);

  const firstBodyChildId = await page.evaluate(
    () => document.body.firstElementChild?.id
  );
  assert.equal(firstBodyChildId, 'skip-to-content-link');
  assert.equal(
    await page.getAttribute('#skip-to-content-link', 'href'),
    '#main-content'
  );
  assert.equal(
    (await page.locator('#skip-to-content-link').textContent()).trim(),
    ptBrDict.a11y.skipToContent
  );
  assert.equal(await page.locator('main#main-content').count(), 1);

  await page.click('#nav-lang-toggle-btn');
  assert.equal(
    (await page.locator('#skip-to-content-link').textContent()).trim(),
    enDict.a11y.skipToContent
  );

  await page.goto(`${baseUrl}/whoami`, { waitUntil: 'networkidle' });
  assert.equal(await page.locator('#skip-to-content-link').count(), 1);
  assert.equal(await page.locator('main#main-content').count(), 1);

  await context.close();
});
