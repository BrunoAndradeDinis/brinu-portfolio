import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE } from '../src/data/profile.ts';

test('C1: profile.ts exports canonical Franca / SP and official contact metadata', () => {
  assert.equal(PROFILE.fullName, 'Bruno de Andrade Dinis');
  assert.equal(PROFILE.handle, 'Brinu');
  assert.equal(PROFILE.birthYear, 1996);
  assert.equal(PROFILE.location.city, 'Franca');
  assert.equal(PROFILE.location.state, 'SP');
  assert.equal(PROFILE.location.label, 'Franca / SP');
  assert.equal(PROFILE.location.remoteLabel['pt-br'], 'Franca / SP • Remoto');
  assert.equal(PROFILE.location.remoteLabel.en, 'Franca / SP • Remote');
  assert.equal(PROFILE.email, 'bruno.a.dinis96@gmail.com');
  assert.equal(PROFILE.linkedin.handle, '/in/bruno-de-andrade-dinis');
  assert.equal(
    PROFILE.linkedin.url,
    'https://www.linkedin.com/in/bruno-de-andrade-dinis'
  );
  assert.equal(PROFILE.github.handle, '@BrunoAndradeDinis');
  assert.equal(PROFILE.github.url, 'https://github.com/BrunoAndradeDinis');
});
