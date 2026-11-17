import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const { HOBBIES, getLocalizedHobbies } = await import('../src/data/hobbies.ts');
const { DICTIONARIES } = await import('../src/i18n/dictionaries.ts');

test('six hobbies in the approved order with their stickers, stats and copy', () => {
  assert.deepEqual(getLocalizedHobbies('pt-br').map((hobby) => hobby.name), ['ANIMES', 'MÚSICA', 'VIOLÃO & LUAUS', 'SKATE', 'JOGOS DE CELULAR', 'NATUREZA']);
  assert.deepEqual(getLocalizedHobbies('en').map((hobby) => hobby.name), ['ANIME', 'MUSIC', 'GUITAR & LUAUS', 'SKATEBOARDING', 'MOBILE GAMES', 'NATURE']);
  assert.deepEqual(
    getLocalizedHobbies('pt-br').map((hobby) => hobby.sticker),
    ['/stickers/sticker-03.svg', '/stickers/sticker-31.svg', '/stickers/sticker-24.svg', '/stickers/sticker-23.svg', '/stickers/sticker-29.svg', '/stickers/sticker-51.svg']
  );
  for (const locale of ['pt-br', 'en']) {
    for (const hobby of getLocalizedHobbies(locale)) {
      assert.ok(fs.existsSync(`public${hobby.sticker}`), `${hobby.sticker} ships`);
      assert.ok(hobby.text.length > 40, `${locale} ${hobby.id} has its text`);
    }
  }
  const music = getLocalizedHobbies('pt-br')[1].text;
  for (const name of ['Medulla', 'Keops e Raony', 'Tinariwen', 'Tissilawen', 'Boubacar Traoré (Mali)', 'Lokua Kanza', 'Richard Bona']) assert.ok(music.includes(name), `music names ${name}`);
  assert.match(getLocalizedHobbies('pt-br')[0].text, /Studio Ghibli.*Cowboy Bebop.*Dragon Ball.*One Piece.*Akira.*Persona 5/);
  assert.match(getLocalizedHobbies('pt-br')[4].text, /Duolingo, Clash Royale, Brawl Stars e League of Legends: Wild Rift/);
  assert.match(getLocalizedHobbies('pt-br')[5].text, /Franca.*Minas Gerais.*cachoeiras/);
  assert.ok(HOBBIES.every((hobby) => hobby.source === 'author'));
  const cards = Object.fromEntries(getLocalizedHobbies('pt-br').map((hobby) => [hobby.id, `${hobby.rating} ${hobby.position.code} | ${hobby.stats.map((entry) => `${entry.code} ${entry.value}`).join('  ')}`]));
  assert.deepEqual(cards, {
    animes: '96 OTK | GHI 97  BEB 99  DBZ 92  OPC 90  AKI 88  P5R 95',
    musica: '94 OUV | HIP 98  MED 97  DES 93  AFR 90  LET 89  CUL 95',
    violao: '82 LUA | ACO 72  DES 95  FOG 90  LUA 99  SAU 97  ANI 94',
    skate: '70 SKT | OLL 68  EQU 72  NOS 99  TOM 85  MAN 60  RUA 88',
    jogos: '88 MOB | DUO 99  CLR 91  BRW 86  WRF 84  TIL 75  RNK 80',
    natureza: '97 MAT | CAC 98  PAS 95  VER 99  CAL 96  MIN 90  REN 97',
  });
  for (const locale of ['pt-br', 'en']) {
    for (const hobby of getLocalizedHobbies(locale)) {
      assert.ok(Number.isInteger(hobby.rating) && hobby.rating >= 0 && hobby.rating <= 99);
      assert.equal(hobby.stats.length, 6, `${hobby.id} has six stats`);
      for (const entry of [hobby.position, ...hobby.stats]) {
        assert.match(entry.code, /^[A-Z0-9]{3}$/, `${locale} ${hobby.id} code ${entry.code}`);
        assert.ok(entry.label.length > 0);
      }
      for (const entry of hobby.stats) assert.ok(Number.isInteger(entry.value) && entry.value >= 0 && entry.value <= 99);
    }
  }
  assert.deepEqual(DICTIONARIES['pt-br'].hobbies, { title: 'HOBBIES', listAria: 'Hobbies', closeLabel: 'Fechar' });
  assert.equal(DICTIONARIES.en.hobbies.closeLabel, 'Close');
});
