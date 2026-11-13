import fs from 'node:fs';
import zlib from 'node:zlib';

export const INITIAL_JS_BUDGET = 200 * 1000;
export const CHUNK_BUDGET = 500 * 1000;

const gzipSize = (file) => zlib.gzipSync(fs.readFileSync(file)).length;

export async function initialClientJs(browser, baseUrl, route) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requested = new Set();
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (pathname.startsWith('/_astro/') && pathname.endsWith('.js')) requested.add(pathname);
  });
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => new Promise((resolve) => requestIdleCallback(() => resolve(), { timeout: 2000 })));
    await page.waitForLoadState('networkidle');
    const files = [...requested].sort();
    const total = files.reduce((sum, pathname) => sum + gzipSize(`dist${pathname}`), 0);
    return { files, total };
  } finally {
    await context.close();
  }
}

export function oversizedChunks() {
  return fs
    .readdirSync('dist/_astro')
    .filter((name) => name.endsWith('.js'))
    .map((name) => ({ name, size: fs.statSync(`dist/_astro/${name}`).size }))
    .filter(({ size }) => size >= CHUNK_BUDGET);
}

export async function assertClientJsBudget(assert, browser, baseUrl, routes) {
  for (const route of routes) {
    const { files, total } = await initialClientJs(browser, baseUrl, route);
    assert.ok(files.length > 0, `${route} requests its client js`);
    assert.ok(total <= INITIAL_JS_BUDGET, `${route} requests ${(total / 1000).toFixed(1)} kB gzip of client js on first load, budget is 200 kB`);
  }
  assert.deepEqual(oversizedChunks(), [], 'every client js chunk stays under 500 kB');
}
