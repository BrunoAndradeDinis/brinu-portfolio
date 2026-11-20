import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const DIST = path.resolve('dist');

function htmlPages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return htmlPages(full);
    return entry.name.endsWith('.html') ? [full] : [];
  });
}

function cspOf(html) {
  const match = html.match(/<meta http-equiv="content-security-policy" content="([^"]+)"/);
  return match ? match[1] : null;
}

function directive(csp, name) {
  const found = csp.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name} `));
  return found ? found.split(/\s+/).slice(1) : [];
}

const sha256 = (source) => `'sha256-${createHash('sha256').update(source).digest('base64')}'`;

test('every page ships the same CSP so soft navigations keep working', () => {
  const policies = new Set(htmlPages(DIST).map((page) => cspOf(fs.readFileSync(page, 'utf8'))));
  assert.equal(policies.size, 1);
});

for (const page of htmlPages(DIST)) {
  const name = path.relative(DIST, page);

  test(`${name} ships a CSP that allows only its own inline scripts`, () => {
    const html = fs.readFileSync(page, 'utf8');
    const csp = cspOf(html);
    assert.ok(csp, 'missing CSP meta tag');

    const scriptSrc = directive(csp, 'script-src');
    assert.ok(!scriptSrc.includes("'unsafe-inline'"), "script-src must not allow 'unsafe-inline'");
    assert.ok(!scriptSrc.includes("'unsafe-eval'"), "script-src must not allow 'unsafe-eval'");
    assert.deepEqual(directive(csp, 'object-src'), ["'none'"]);
    assert.deepEqual(directive(csp, 'base-uri'), ["'self'"]);

    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(([, attrs]) => !/type="application\/(ld\+)?json"/.test(attrs))
      .map(([, , body]) => body);
    for (const body of inline) {
      assert.ok(scriptSrc.includes(sha256(body)), `inline script not hashed: ${body.slice(0, 80)}`);
    }

    const styleSrc = directive(csp, 'style-src');
    assert.ok(!styleSrc.includes("'unsafe-inline'"), "style-src must not allow 'unsafe-inline' for elements");
    for (const [, body] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      assert.ok(styleSrc.includes(sha256(body)), `inline style not hashed: ${body.slice(0, 80)}`);
    }
  });
}

test('style-src allows the <style> sonner injects at runtime, empty and filled', async () => {
  const { RUNTIME_STYLES } = await import('../src/utils/runtime-styles.mjs');
  const bundle = fs.readdirSync(path.join(DIST, '_astro')).filter((file) => file.endsWith('.js'))
    .map((file) => fs.readFileSync(path.join(DIST, '_astro', file), 'utf8'))
    .find((source) => source.includes('[data-sonner-toaster]'));
  assert.ok(bundle, 'sonner CSS not found in the client bundle');
  const styleSrc = directive(cspOf(fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')), 'style-src');
  assert.ok(RUNTIME_STYLES.some((css) => css.includes('[data-sonner-toaster]') && bundle.includes(css)), 'shipped sonner CSS differs from the hashed one');
  for (const css of RUNTIME_STYLES) {
    assert.ok(styleSrc.includes(sha256(css)), `runtime style not hashed: ${css.slice(0, 40)}`);
  }
});
