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
