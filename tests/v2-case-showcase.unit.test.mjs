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

test('SHOW-10: every case has media files and bilingual alt texts', async () => {
  const { SHOWCASE_MEDIA } = await showcaseData();
  const { existsSync } = await import('node:fs');
  assert.deepEqual(Object.keys(SHOWCASE_MEDIA).sort(), [...IDS].sort());
  for (const id of IDS) {
    const media = SHOWCASE_MEDIA[id];
    assert.ok(existsSync(publicFile(media.screenshot.src)), `${id} screenshot file`);
    for (const candidate of media.screenshot.srcset.split(',')) assert.ok(existsSync(publicFile(candidate.trim().split(' ')[0])), `${id} srcset file`);
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
  assert.deepEqual(withVideo, ['magalu-cloud', 'uriana', 'efood', 'aurastream']);
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
});

const SHOWCASE_KEYS = [
  'caseLabel', 'prevAria', 'nextAria', 'controlsAria',
  'play', 'pause', 'tilesAria', 'stackAria', 'stageAria',
  'fullscreenOpenAria', 'hintDoubleClick', 'hintRotate', 'hintTitle', 'fullscreenPrev', 'fullscreenNext', 'fullscreenHint',
];

test('SHOW-09: showcase dictionary has the same non-empty keys in pt-br and en', async () => {
  const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');
  for (const locale of ['pt-br', 'en']) {
    const block = DICTIONARIES[locale].showcase;
    assert.ok(block, `${locale} showcase block`);
    assert.deepEqual(Object.keys(block).sort(), [...SHOWCASE_KEYS].sort(), `${locale} keys`);
    for (const key of SHOWCASE_KEYS) assert.ok(block[key].trim().length > 0, `${locale}.${key}`);
  }
});

test('SHOW-09: every case carries the prototype copy in both locales', async () => {
  const { SHOWCASE_MEDIA } = await import('../src/data/showcase.ts');
  const { SHOWCASE_LAYOUT: layout } = await import('../src/data/showcase-layout.ts');
  for (const [id, media] of Object.entries(SHOWCASE_MEDIA)) {
    const { copy } = media;
    assert.ok(layout[id].name.length > 0 && layout[id].nameEm > 0, `${id} name`);
    assert.equal(layout[id].barStack.length, 3, `${id} bar stack`);
    for (const key of ['cta', 'lead', 'note']) {
      for (const locale of ['pt-br', 'en']) assert.ok(copy[key][locale].trim().length > 0, `${id} ${key} ${locale}`);
    }
  }
  assert.equal(SHOWCASE_MEDIA.aurastream.copy.kicker.en, 'Personal project · Magalu Cloud Object Storage');
  assert.equal(SHOWCASE_MEDIA['magalu-cloud'].copy.cta['pt-br'], 'SITE NO AR');
  assert.equal(SHOWCASE_MEDIA['magalu-cloud'].copy.cta.en, 'LIVE SITE');
  assert.equal(SHOWCASE_MEDIA.aurastream.copy.cta['pt-br'], 'DEMO DO PAINEL');
});

const videoRules = () => import('../src/utils/showcase-video.ts');

test('SHOW-06: autoplay is allowed only without reduced motion and without Save-Data', async () => {
  const { shouldAutoplay } = await videoRules();
  assert.equal(shouldAutoplay({ reducedMotion: false, saveData: false }), true);
  assert.equal(shouldAutoplay({ reducedMotion: true, saveData: false }), false);
  assert.equal(shouldAutoplay({ reducedMotion: false, saveData: true }), false);
  assert.equal(shouldAutoplay({ reducedMotion: true, saveData: true }), false);
});

test('SHOW-05: the toggle alternates between playing and paused', async () => {
  const { initialVideoState, nextVideoState } = await videoRules();
  let state = initialVideoState(false);
  assert.equal(state.status, 'idle');
  state = nextVideoState(state, 'toggle');
  assert.equal(state.status, 'playing');
  state = nextVideoState(state, 'toggle');
  assert.equal(state.status, 'paused');
  state = nextVideoState(state, 'toggle');
  assert.equal(state.status, 'playing');
  assert.equal(initialVideoState(true).status, 'playing');
});

test('SHOW-07: leaving the viewport pauses and resumes only a video that was playing', async () => {
  const { initialVideoState, nextVideoState } = await videoRules();
  let state = nextVideoState(initialVideoState(true), 'hidden');
  assert.equal(state.status, 'paused');
  state = nextVideoState(state, 'visible');
  assert.equal(state.status, 'playing');

  state = nextVideoState(nextVideoState(initialVideoState(true), 'toggle'), 'hidden');
  assert.equal(state.status, 'paused');
  assert.equal(nextVideoState(state, 'visible').status, 'paused');

  const idle = initialVideoState(false);
  assert.equal(nextVideoState(nextVideoState(idle, 'hidden'), 'visible').status, 'idle');
});

test('SHOW-08: a failed play returns to idle and never resumes by itself', async () => {
  const { initialVideoState, nextVideoState } = await videoRules();
  let state = nextVideoState(initialVideoState(true), 'hidden');
  state = nextVideoState(state, 'failed');
  assert.equal(state.status, 'idle');
  assert.equal(nextVideoState(state, 'visible').status, 'idle');
});

test('STK-01: the library lists 56 stickers and the logo swap pool uses all of them', async () => {
  const { STICKERS } = await import('../src/data/stickers.ts');
  const { STICKER_COUNT, STICKER_FILES } = await import('../src/data/sticker-files.ts');
  assert.equal(STICKERS.length, 56);
  assert.equal(STICKER_COUNT, 56);
  assert.deepEqual(STICKERS.map((sticker) => sticker.file), STICKER_FILES);
});

test('STK-04: every sticker has a unique id, a small svg and bilingual alt', async () => {
  const { STICKERS } = await import('../src/data/stickers.ts');
  const { existsSync, statSync } = await import('node:fs');
  assert.equal(new Set(STICKERS.map((sticker) => sticker.id)).size, STICKERS.length, 'unique ids');
  assert.equal(new Set(STICKERS.map((sticker) => sticker.file)).size, STICKERS.length, 'unique files');
  for (const sticker of STICKERS) {
    const file = publicFile(sticker.file);
    assert.ok(existsSync(file), `${sticker.id} file ${sticker.file}`);
    assert.ok(statSync(file).size <= 20 * 1024, `${sticker.id} is ${statSync(file).size} bytes`);
    for (const locale of ['pt-br', 'en']) assert.ok(sticker.alt[locale].trim().length > 0, `${sticker.id} alt ${locale}`);
  }
});

test('MOB-04: save-data disables autoplay', async () => {
  const { shouldAutoplay, initialVideoState } = await videoRules();
  assert.equal(shouldAutoplay({ reducedMotion: false, saveData: true }), false);
  assert.equal(initialVideoState(shouldAutoplay({ reducedMotion: false, saveData: true })).status, 'idle');
  assert.equal(shouldAutoplay({ reducedMotion: false, saveData: false }), true);
});
