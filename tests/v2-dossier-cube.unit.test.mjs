import { test } from 'node:test';
import assert from 'node:assert/strict';

const cube = await import('../src/components/about/rubik-cube.ts');

const stickerCount = (pieces) => pieces.reduce((sum, piece) => sum + piece.stickers.length, 0);

test('the cube has 27 pieces and 54 stickers, nine on each face', () => {
  const solved = cube.solvedCube();
  assert.equal(solved.length, 27);
  assert.equal(stickerCount(solved), 54);
  for (const facing of cube.FACINGS) assert.equal(cube.face(solved, facing).length, 9, `${facing} has nine stickers`);
  assert.equal(cube.isSolved(solved), true);
});

test('a layer turn moves its nine pieces and keeps the cube whole', () => {
  const solved = cube.solvedCube();
  for (const axis of ['x', 'y', 'z']) {
    for (const layer of [-1, 0, 1]) {
      for (const turns of [1, -1]) {
        const move = { axis, layer, turns };
        const turned = cube.applyMove(solved, move);
        const moved = turned.filter((piece, index) => piece.at.join() !== solved[index].at.join());
        assert.equal(moved.length, 8, `${axis}${layer}${turns}: the eight off-centre pieces of the layer move`);
        assert.deepEqual(new Set(turned.map((piece) => piece.at.join())), new Set(solved.map((piece) => piece.at.join())), 'every place stays filled once');
        assert.equal(stickerCount(turned), 54);
        for (const facing of cube.FACINGS) assert.equal(cube.face(turned, facing).length, 9, `${facing} keeps nine stickers`);
        assert.equal(cube.isSolved(turned), false, `${axis}${layer}${turns} unsolves the cube`);
        assert.equal(cube.isSolved(cube.applyMove(turned, { axis, layer, turns: -turns })), true, 'the opposite turn solves it again');
      }
    }
  }
});

test('turns follow the sense of CSS rotations', () => {
  assert.deepEqual(cube.rotate([1, 0, 0], 'z', 1), [0, 1, 0], 'rotateZ(90deg) sends +x down (+y)');
  assert.deepEqual(cube.rotate([0, 1, 0], 'x', 1), [0, 0, 1], 'rotateX(90deg) sends +y towards the viewer');
  assert.deepEqual(cube.rotate([1, 0, 0], 'y', 1), [0, 0, -1], 'rotateY(90deg) sends +x away from the viewer');
  for (const axis of ['x', 'y', 'z']) assert.deepEqual(cube.rotate(cube.rotate([1, 2, 3], axis, 1), axis, -1), [1, 2, 3]);
});

test('the scramble mixes the cube and its inverse solves it', () => {
  const scrambled = cube.applyMoves(cube.solvedCube(), cube.SCRAMBLE);
  assert.equal(cube.SCRAMBLE.length, 6);
  assert.equal(cube.isSolved(scrambled), false);
  const mixedFaces = cube.FACINGS.filter((facing) => new Set(cube.face(scrambled, facing)).size > 1);
  assert.ok(mixedFaces.length >= 4, `most faces are mixed (${mixedFaces.join(', ')})`);
  assert.equal(cube.isSolved(cube.applyMoves(scrambled, cube.inverse(cube.SCRAMBLE))), true);
  assert.deepEqual(cube.inverse(cube.inverse(cube.SCRAMBLE)), [...cube.SCRAMBLE]);
});

test('the six faces use only brand tones', () => {
  const brand = /^#(FE0000|A30000|080808|2B2B2B|FBFAF4|D9D5C7)$/;
  const colours = cube.FACINGS.map((facing) => cube.FACE_COLOURS[facing]);
  assert.equal(new Set(colours).size, 6, 'each face has its own tone');
  for (const colour of colours) assert.match(colour, brand);
});
