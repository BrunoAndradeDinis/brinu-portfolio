import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { execFileSync } from 'node:child_process';
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
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

let server;
let baseUrl = '';
let browser;

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

test('C6: package.json declares engines.node >=22.22.0', () => {
  assert.equal(pkg.engines?.node, '>=22.22.0');
});

test('C7: only package-lock.json is tracked', () => {
  const tracked = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
  assert.ok(tracked.includes('package-lock.json'), 'package-lock.json must be tracked');
  assert.ok(!tracked.includes('yarn.lock'), 'yarn.lock must not be tracked');
});

function majorOf(range) {
  const match = String(range ?? '').match(/(\d+)\./);
  return match ? Number(match[1]) : NaN;
}

test('C1: astro and @astrojs/react are declared with major version 7', () => {
  assert.equal(majorOf(pkg.dependencies.astro), 7);
  assert.equal(majorOf(pkg.dependencies['@astrojs/react']), 7);
  const installedAstro = JSON.parse(
    fs.readFileSync('node_modules/astro/package.json', 'utf8')
  ).version;
  assert.equal(majorOf(installedAstro), 7);
});

test('C2: build emits index.html and whoami/index.html', () => {
  assert.ok(fs.existsSync('dist/index.html'), 'dist/index.html must exist');
  assert.ok(fs.existsSync('dist/whoami/index.html'), 'dist/whoami/index.html must exist');
});

test('C5: every built js chunk is under 500 kB', () => {
  const chunks = fs.readdirSync('dist/_astro').filter((f) => f.endsWith('.js'));
  assert.ok(chunks.length > 0, 'build must emit js chunks');
  for (const file of chunks) {
    const size = fs.statSync(path.join('dist/_astro', file)).size;
    assert.ok(size < 500 * 1000, `${file} is ${size} bytes`);
  }
});

const FONT_VARIABLES = [
  { cssVariable: '--font-syne', weight: 800 },
  { cssVariable: '--font-archivo', weight: 400 },
  { cssVariable: '--font-space-mono', weight: 700 },
  { cssVariable: '--font-permanent-marker', weight: 400 },
];

const FONT_FILE = /\.(woff2?|ttf|otf|eot)(\?|$)/i;

test('C8: built html has no google fonts references', () => {
  for (const file of ['dist/index.html', 'dist/whoami/index.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.ok(!html.includes('fonts.googleapis.com'), `${file} references fonts.googleapis.com`);
    assert.ok(!html.includes('fonts.gstatic.com'), `${file} references fonts.gstatic.com`);
  }
});

test('C9: syne archivo space mono and permanent marker are loaded', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/?freeze`, { waitUntil: 'load' });
    const results = await page.evaluate(async (fonts) => {
      const unquote = (name) => name.trim().replace(/^["']|["']$/g, '');
      const covers = (range, weight) => {
        const [min, max = min] = String(range).split(/\s+/).map(Number);
        return weight >= min && weight <= max;
      };
      const rootStyle = getComputedStyle(document.documentElement);
      const out = [];
      for (const { cssVariable, weight } of fonts) {
        const firstFamily = rootStyle.getPropertyValue(cssVariable).split(',')[0].trim();
        const family = unquote(firstFamily);
        if (family) await document.fonts.load(`${weight} 1em ${firstFamily}`);
        const face = [...document.fonts].find(
          (f) => unquote(f.family) === family && covers(f.weight, weight) && f.status === 'loaded'
        );
        out.push({ cssVariable, family, weight, loaded: Boolean(family) && Boolean(face) });
      }
      return out;
    }, FONT_VARIABLES);
    for (const r of results) {
      assert.ok(r.loaded, `${r.cssVariable} (${r.family}) has no loaded face at weight ${r.weight}`);
    }
  } finally {
    await page.close();
  }
});

test('C10: every font request targets the site origin', async () => {
  const page = await browser.newPage();
  const fontRequests = [];
  page.on('request', (req) => {
    if (req.resourceType() === 'font' || FONT_FILE.test(req.url())) {
      fontRequests.push(req.url());
    }
  });
  try {
    await page.goto(`${baseUrl}/?freeze`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    assert.ok(fontRequests.length > 0, 'page must request font files');
    for (const url of fontRequests) {
      assert.equal(new URL(url).origin, baseUrl, `font requested from another origin: ${url}`);
    }
  } finally {
    await page.close();
  }
});

test('C12: generated font faces use font-display swap', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/?freeze`, { waitUntil: 'load' });
    const faces = await page.evaluate(() => [...document.fonts].map((f) => ({ family: f.family, display: f.display })));
    assert.ok(faces.length > 0, 'page must declare font faces');
    for (const face of faces) {
      assert.equal(face.display, 'swap', `${face.family} uses font-display ${face.display}`);
    }
  } finally {
    await page.close();
  }
});

test('C11: font-display token lists only loaded families', async () => {
  const tokens = fs.readFileSync('src/styles/tokens.css', 'utf8');
  const declarations = tokens.match(/--font-display\s*:[^;]+;/g) ?? [];
  assert.equal(declarations.length, 1, '--font-display must be declared exactly once');
  assert.ok(!/Heavitas/i.test(tokens), 'tokens.css must not name Heavitas');

  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/?freeze`, { waitUntil: 'load' });
    const result = await page.evaluate(async () => {
      const GENERIC = new Set([
        'serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui',
        'ui-serif', 'ui-sans-serif', 'ui-monospace', 'ui-rounded', 'emoji', 'math', 'fangsong',
      ]);
      const unquote = (name) => name.trim().replace(/^["']|["']$/g, '');
      const probe = document.createElement('span');
      probe.className = 'font-display';
      probe.textContent = 'BRINU';
      document.body.appendChild(probe);
      const stack = getComputedStyle(probe).fontFamily.split(',').map(unquote);
      probe.remove();
      await document.fonts.load(`800 1em "${stack[0]}"`);
      const faces = [...document.fonts];
      const withoutSource = stack.filter(
        (family) => !GENERIC.has(family.toLowerCase()) && !faces.some((f) => unquote(f.family) === family)
      );
      const firstLoaded = faces.some((f) => unquote(f.family) === stack[0] && f.status === 'loaded');
      return { stack, withoutSource, firstLoaded };
    });
    assert.ok(result.stack.length > 0, '.font-display must resolve a font-family');
    assert.deepEqual(result.withoutSource, [], `families without a font source: ${result.withoutSource.join(', ')}`);
    assert.ok(result.firstLoaded, `first family of .font-display (${result.stack[0]}) has no loaded face`);
  } finally {
    await page.close();
  }
});

function listSourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listSourceFiles(full) : [full];
  });
}

test('C13: src files resolve fonts through tokens instead of literal family names', async () => {
  const literalFamily = /["'`](Syne|Archivo|Space Mono|Permanent Marker)["'`]/;
  const offenders = listSourceFiles('src')
    .filter((file) => /\.(astro|tsx?|css|mjs|js)$/.test(file))
    .filter((file) => literalFamily.test(fs.readFileSync(file, 'utf8')));
  assert.deepEqual(offenders, [], `literal font family names in: ${offenders.join(', ')}`);

  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/?freeze`, { waitUntil: 'load' });
    const monoStack = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
    );
    const firstFamily = monoStack.split(',')[0].trim().replace(/^["']|["']$/g, '');
    assert.notEqual(firstFamily, 'Space Mono', '--font-mono must resolve to the Fonts API family');
    assert.match(firstFamily, /^Space Mono-/, '--font-mono must start with the self-hosted Space Mono face');
  } finally {
    await page.close();
  }
});

test('C14: font-black display text matches the loaded syne 800 face', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(`${baseUrl}/?freeze`, { waitUntil: 'load' });
    const matched = await page.evaluate(async () => {
      const unquote = (name) => name.trim().replace(/^["']|["']$/g, '');
      const probe = document.createElement('span');
      probe.className = 'font-display font-black';
      probe.textContent = 'BRINU';
      document.body.appendChild(probe);
      const style = getComputedStyle(probe);
      const firstFamily = style.fontFamily.split(',')[0].trim();
      const weight = style.fontWeight;
      probe.remove();
      const faces = await document.fonts.load(`${weight} 1em ${firstFamily}`);
      return {
        weight,
        family: unquote(firstFamily),
        faces: faces.map((f) => ({ family: unquote(f.family), weight: f.weight, status: f.status })),
      };
    });
    assert.equal(matched.weight, '900');
    assert.match(matched.family, /^Syne-/, `display family is ${matched.family}`);
    assert.ok(
      matched.faces.some((f) => f.family === matched.family && f.weight === '800' && f.status === 'loaded'),
      `900 text must resolve to the loaded Syne 800 face, got ${JSON.stringify(matched.faces)}`
    );
  } finally {
    await page.close();
  }
});
