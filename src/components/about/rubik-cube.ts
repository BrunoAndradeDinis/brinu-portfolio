export type Axis = 'x' | 'y' | 'z';
export type Layer = -1 | 0 | 1;
export type Facing = '+x' | '-x' | '+y' | '-y' | '+z' | '-z';
export type Vector = readonly [number, number, number];

export interface Move {
  readonly axis: Axis;
  readonly layer: Layer;
  /** Quarter turns: 1 turns the layer as CSS `rotateX/Y/Z(90deg)` does, -1 turns it back. */
  readonly turns: 1 | -1;
}

export interface Sticker {
  readonly facing: Facing;
  /** The face the sticker belongs to when the cube is solved, which fixes its colour. */
  readonly home: Facing;
}

export interface Piece {
  readonly id: string;
  readonly at: Vector;
  readonly stickers: readonly Sticker[];
}

/** CSS axes: x to the right, y down, z towards the viewer; `+z` is the face the visitor sees. */
export const FACINGS: readonly Facing[] = ['+x', '-x', '+y', '-y', '+z', '-z'];

export const FACE_COLOURS: Readonly<Record<Facing, string>> = {
  '+z': '#FE0000',
  '-z': '#A30000',
  '+x': '#080808',
  '-x': '#2B2B2B',
  '+y': '#FBFAF4',
  '-y': '#D9D5C7',
};

export const SCRAMBLE: readonly Move[] = [
  { axis: 'y', layer: -1, turns: 1 },
  { axis: 'x', layer: 1, turns: -1 },
  { axis: 'z', layer: 1, turns: 1 },
  { axis: 'y', layer: 1, turns: -1 },
  { axis: 'x', layer: -1, turns: 1 },
  { axis: 'z', layer: 0, turns: -1 },
];

const AXIS_INDEX: Readonly<Record<Axis, number>> = { x: 0, y: 1, z: 2 };

function facingVector(facing: Facing): Vector {
  const sign = facing[0] === '+' ? 1 : -1;
  const index = AXIS_INDEX[facing[1] as Axis];
  return [index === 0 ? sign : 0, index === 1 ? sign : 0, index === 2 ? sign : 0];
}

function vectorFacing([x, y, z]: Vector): Facing {
  if (x !== 0) return x > 0 ? '+x' : '-x';
  if (y !== 0) return y > 0 ? '+y' : '-y';
  return z > 0 ? '+z' : '-z';
}

/** Rotates a vector a quarter turn about `axis`, with the sense of CSS `rotateX/Y/Z(90deg)` when `turns` is 1. */
export function rotate([x, y, z]: Vector, axis: Axis, turns: 1 | -1): Vector {
  const once = (v: Vector): Vector => {
    const [a, b, c] = v;
    if (axis === 'x') return [a, -c, b];
    if (axis === 'y') return [c, b, -a];
    return [-b, a, c];
  };
  const [a, b, c] = turns === 1 ? once([x, y, z]) : once(once(once([x, y, z])));
  return [a || 0, b || 0, c || 0];
}

export function solvedCube(): Piece[] {
  const pieces: Piece[] = [];
  for (const x of [-1, 0, 1]) {
    for (const y of [-1, 0, 1]) {
      for (const z of [-1, 0, 1]) {
        const stickers = FACINGS.filter((facing) => {
          const [fx, fy, fz] = facingVector(facing);
          return (fx !== 0 && fx === x) || (fy !== 0 && fy === y) || (fz !== 0 && fz === z);
        }).map((facing) => ({ facing, home: facing }));
        pieces.push({ id: `${x},${y},${z}`, at: [x, y, z], stickers });
      }
    }
  }
  return pieces;
}

export function inLayer(piece: Piece, move: Pick<Move, 'axis' | 'layer'>): boolean {
  return piece.at[AXIS_INDEX[move.axis]] === move.layer;
}

export function applyMove(pieces: readonly Piece[], move: Move): Piece[] {
  return pieces.map((piece) =>
    inLayer(piece, move)
      ? {
          id: piece.id,
          at: rotate(piece.at, move.axis, move.turns),
          stickers: piece.stickers.map((sticker) => ({ home: sticker.home, facing: vectorFacing(rotate(facingVector(sticker.facing), move.axis, move.turns)) })),
        }
      : piece
  );
}

export function applyMoves(pieces: readonly Piece[], moves: readonly Move[]): Piece[] {
  return moves.reduce<Piece[]>((state, move) => applyMove(state, move), [...pieces]);
}

export function inverse(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map((move) => ({ axis: move.axis, layer: move.layer, turns: move.turns === 1 ? -1 : 1 }));
}

/** The colour homes of the nine stickers that face `facing`. */
export function face(pieces: readonly Piece[], facing: Facing): Facing[] {
  return pieces.flatMap((piece) => piece.stickers.filter((sticker) => sticker.facing === facing).map((sticker) => sticker.home));
}

export function isSolved(pieces: readonly Piece[]): boolean {
  return FACINGS.every((facing) => {
    const homes = face(pieces, facing);
    return homes.length === 9 && homes.every((home) => home === homes[0]);
  });
}
