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
