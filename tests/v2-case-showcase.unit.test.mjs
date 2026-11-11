import { test } from 'node:test';
import assert from 'node:assert/strict';

const IDS = ['magalu-cloud', 'uriana', 'efood', 'aurastream'];
const showcaseNav = () => import('../src/utils/showcase-nav.ts');

test('SHOW-02: position label follows MAIN_CASES order, zero-padded', async () => {
  const { showcasePosition } = await showcaseNav();
  assert.deepEqual(IDS.map(showcasePosition), ['01 / 04', '02 / 04', '03 / 04', '04 / 04']);
});

test('SHOW-02: previous and next wrap at the ends', async () => {
  const { showcaseNeighbors } = await showcaseNav();
  assert.deepEqual(showcaseNeighbors('magalu-cloud'), { prev: 'aurastream', next: 'uriana' });
  assert.deepEqual(showcaseNeighbors('efood'), { prev: 'uriana', next: 'aurastream' });
  assert.deepEqual(showcaseNeighbors('aurastream'), { prev: 'efood', next: 'magalu-cloud' });
});

test('SHOW-03: tiles keep MAIN_CASES order and mark only the current case', async () => {
  const { showcaseTiles } = await showcaseNav();
  const tiles = showcaseTiles('efood');
  assert.deepEqual(tiles.map((tile) => tile.id), IDS);
  assert.deepEqual(tiles.map((tile) => tile.index), [1, 2, 3, 4]);
  assert.deepEqual(tiles.map((tile) => tile.current), [false, false, true, false]);
  assert.deepEqual(tiles.map((tile) => tile.href), IDS.map((id) => `/cases/${id}`));
});

test('SHOW-02: unknown id yields no showcase navigation', async () => {
  const { showcasePosition, showcaseNeighbors, showcaseTiles } = await showcaseNav();
  assert.equal(showcasePosition('nope'), null);
  assert.equal(showcaseNeighbors('nope'), null);
  assert.deepEqual(showcaseTiles('nope'), []);
});

const showcaseData = () => import('../src/data/showcase.ts');
const publicFile = (src) => new URL(`../public${src}`, import.meta.url);

test('SHOW-10: every main case has a media record with existing files and bilingual alt', async () => {
  const { SHOWCASE_MEDIA } = await showcaseData();
  const { existsSync } = await import('node:fs');
  assert.deepEqual(Object.keys(SHOWCASE_MEDIA).sort(), [...IDS].sort());
  for (const id of IDS) {
    const media = SHOWCASE_MEDIA[id];
    assert.ok(existsSync(publicFile(media.screenshot.src)), `${id} screenshot file`);
    assert.ok(existsSync(publicFile(media.sticker.src)), `${id} sticker file`);
    for (const locale of ['pt-br', 'en']) {
      assert.ok(media.screenshot.alt[locale].trim().length > 0, `${id} screenshot alt ${locale}`);
    }
  }
});

test('SHOW-10: video and poster come together, only on the cases that have a video', async () => {
  const { SHOWCASE_MEDIA } = await showcaseData();
  const { existsSync } = await import('node:fs');
  const withVideo = IDS.filter((id) => SHOWCASE_MEDIA[id].video);
  assert.deepEqual(withVideo, ['magalu-cloud', 'uriana', 'efood']);
  for (const id of withVideo) {
    const { video } = SHOWCASE_MEDIA[id];
    for (const src of [video.mp4, video.webm, video.poster.src]) {
      assert.ok(existsSync(publicFile(src)), `${id} ${src}`);
    }
    for (const locale of ['pt-br', 'en']) {
      assert.ok(video.tag[locale].trim().length > 0, `${id} tag ${locale}`);
      assert.ok(video.poster.alt[locale].trim().length > 0, `${id} poster alt ${locale}`);
    }
  }
  assert.equal(SHOWCASE_MEDIA.aurastream.video, undefined);
});
