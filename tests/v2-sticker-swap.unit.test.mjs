import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';

const COUNT = 32;
const FILES = Array.from({ length: COUNT }, (_, i) => `public/stickers/sticker-${String(i + 1).padStart(2, '0')}.svg`);

test('C1: thirty-two distinct sticker files match the manifest with localized alt text', async () => {
  const { STICKERS, getLocalizedStickers } = await import('../src/data/stickers.ts');
  assert.deepEqual(fs.readdirSync('public/stickers').sort(), FILES.map((f) => f.split('/').pop()), 'the folder holds exactly the stickers');
  const hashes = new Set(FILES.map((f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')));
  assert.equal(hashes.size, COUNT, 'stickers must have pairwise different content');
  assert.deepEqual(STICKERS.map((s) => `public${s.file}`), FILES, 'the manifest lists exactly the files in order');
  assert.equal(new Set(STICKERS.map((s) => s.id)).size, COUNT, 'ids are unique');
  for (const locale of ['pt-br', 'en']) {
    const list = getLocalizedStickers(locale);
    assert.equal(list.length, COUNT);
    for (const item of list) assert.ok(item.alt.trim().length > 8, `${locale} ${item.id} alt`);
  }
  for (const s of STICKERS) assert.notEqual(s.alt['pt-br'], s.alt.en, `${s.id} alt must be translated`);
});

test('C2: stickers are small, text-free and self-contained', () => {
  for (const file of FILES) {
    const body = fs.readFileSync(file, 'utf8');
    assert.ok(fs.statSync(file).size < 40 * 1024, `${file} must be under 40 kB`);
    assert.doesNotMatch(body, /<text[\s>]|<tspan|<foreignObject/i, `${file} must not contain live text`);
    const refs = [...body.matchAll(/(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
    for (const ref of refs) assert.match(ref, /^data:image\/png;base64,/, `${file} references an external resource: ${ref.slice(0, 40)}`);
    assert.doesNotMatch(body, /url\(\s*['"]?https?:|@import|<link|<script/i, `${file} must not load external resources`);
    assert.match(body, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  }
});
