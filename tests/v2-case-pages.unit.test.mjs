import { test } from 'node:test';
import assert from 'node:assert/strict';

const IDS = ['magalu-cloud', 'uriana', 'efood', 'aurastream'];

test('C1: case routes are exactly the four main cases', async () => {
  const { casePath, caseStaticPaths } = await import('../src/utils/case-pages.ts');
  assert.deepEqual(IDS.map(casePath), IDS.map((id) => `/cases/${id}`));
  assert.deepEqual(caseStaticPaths().map((entry) => entry.params.id), IDS);
});

test('C4: next case follows MAIN_CASES order and wraps', async () => {
  const { nextCaseId } = await import('../src/utils/case-pages.ts');
  assert.equal(nextCaseId('magalu-cloud'), 'uriana');
  assert.equal(nextCaseId('uriana'), 'efood');
  assert.equal(nextCaseId('efood'), 'aurastream');
  assert.equal(nextCaseId('aurastream'), 'magalu-cloud');
  assert.equal(nextCaseId('unknown'), null);
});
