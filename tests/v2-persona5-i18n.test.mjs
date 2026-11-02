import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE } from '../src/data/profile.ts';
import {
  PROJECT_CASES,
  getLocalizedCases,
  getLocalizedSkillCategories,
} from '../src/data/cases.ts';

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

test('T2: getLocalizedCases and getLocalizedSkillCategories provide matching pt-br and en structures', () => {
  const ptCases = getLocalizedCases('pt-br');
  const enCases = getLocalizedCases('en');

  assert.equal(ptCases.length, 4);
  assert.equal(enCases.length, 4);
  assert.deepEqual(
    ptCases.map((c) => c.id),
    enCases.map((c) => c.id)
  );
  assert.equal(PROJECT_CASES.length, 4);
  assert.notEqual(ptCases[0].description, enCases[0].description);

  const ptSkills = getLocalizedSkillCategories('pt-br');
  const enSkills = getLocalizedSkillCategories('en');
  assert.equal(ptSkills.length, 4);
  assert.equal(enSkills.length, 4);
  assert.deepEqual(
    ptSkills.map((s) => s.id),
    enSkills.map((s) => s.id)
  );
  assert.notEqual(ptSkills[0].subtitle, enSkills[0].subtitle);
});
