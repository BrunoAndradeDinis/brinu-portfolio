import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMPTY_SCORE, JOKENPO_CHOICES, addResult, decideWinner, randomChoice } from '../src/utils/jokenpo.ts';

test('JK-U1: the nine plays follow the repo rules (pedra > tesoura > papel > pedra, equal is a draw)', () => {
  const table = Object.fromEntries(JOKENPO_CHOICES.flatMap((player) => JOKENPO_CHOICES.map((cpu) => [`${player}-${cpu}`, decideWinner(player, cpu)])));
  assert.deepEqual(table, {
    'pedra-pedra': 'empate',
    'pedra-papel': 'derrota',
    'pedra-tesoura': 'vitoria',
    'papel-pedra': 'vitoria',
    'papel-papel': 'empate',
    'papel-tesoura': 'derrota',
    'tesoura-pedra': 'derrota',
    'tesoura-papel': 'vitoria',
    'tesoura-tesoura': 'empate',
  });
});

test('JK-U2: the score counts wins, losses and draws from zero', () => {
  const score = ['vitoria', 'vitoria', 'derrota', 'empate'].reduce(addResult, EMPTY_SCORE);
  assert.deepEqual(score, { win: 2, lose: 1, draw: 1 });
  assert.deepEqual(EMPTY_SCORE, { win: 0, lose: 0, draw: 0 });
});

test('JK-U3: the CPU maps the whole random range onto the three choices', () => {
  assert.equal(randomChoice(() => 0), 'pedra');
  assert.equal(randomChoice(() => 0.34), 'papel');
  assert.equal(randomChoice(() => 0.99), 'tesoura');
  assert.equal(randomChoice(() => 1), 'tesoura');
  const seen = new Set(Array.from({ length: 300 }, () => randomChoice()));
  assert.deepEqual([...seen].sort(), ['papel', 'pedra', 'tesoura']);
});
