import { test } from 'node:test';
import assert from 'node:assert/strict';

const { SERVICE_IDS, BUDGET_IDS, DEADLINE_IDS, CONTACT_BOUNDS, CONTACT_DEFAULTS } = await import('../src/data/contact-brief.ts');

test('contact brief ids, bounds and defaults match the design', () => {
  assert.deepEqual([...SERVICE_IDS], ['web-system', 'site', 'integration', 'job']);
  assert.deepEqual([...BUDGET_IDS], ['up-to-3k', '3k-8k', '8k-15k', 'over-15k', 'to-discuss']);
  assert.deepEqual([...DEADLINE_IDS], ['urgent', '1-3-months', 'flexible']);
  assert.deepEqual(CONTACT_BOUNDS, {
    name: { min: 2, max: 80 },
    company: { max: 80 },
    email: { max: 254 },
    message: { min: 20, max: 2000 },
    phoneDigits: { min: 10, max: 11 },
  });
  assert.deepEqual(CONTACT_DEFAULTS, { budget: 'to-discuss', deadline: 'flexible' });
});
