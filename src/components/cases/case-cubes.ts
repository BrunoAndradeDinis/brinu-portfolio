export interface CubeGrid {
  readonly cols: number;
  readonly rows: number;
  readonly width: number;
  readonly height: number;
}

export interface Cube {
  readonly col: number;
  readonly row: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  /** Offset, from the cube's place on the card, where it starts on entry and ends on exit. */
  readonly fromX: number;
  readonly fromY: number;
  readonly fromRotation: number;
  /** 0..1: where in the turn phase this cube starts turning, so the card is revealed in a wave. */
  readonly turnAt: number;
}

export const MAX_CUBES = 120;
export const CUBE_TARGET_PX = 56;

export function cubeGrid(width: number, height: number, target = CUBE_TARGET_PX): CubeGrid {
  if (width <= 0 || height <= 0) return { cols: 0, rows: 0, width: 0, height: 0 };
  let size = Math.max(1, target);
  let cols = Math.max(1, Math.round(width / size));
  let rows = Math.max(1, Math.round(height / size));
  while (cols * rows > MAX_CUBES) {
    size *= 1.1;
    cols = Math.max(1, Math.round(width / size));
    rows = Math.max(1, Math.round(height / size));
  }
  return { cols, rows, width: width / cols, height: height / rows };
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Lays the cubes over a card of `width` x `height` and sends each one to the corner of its own quadrant,
 * `reachX` / `reachY` beyond the card, so cubes arrive from (and leave to) all four corners.
 */
export function layoutCubes(width: number, height: number, reachX: number, reachY: number, seed = 1): Cube[] {
  const grid = cubeGrid(width, height);
  const random = seeded(seed);
  const cubes: Cube[] = [];
  for (let row = 0; row < grid.rows; row += 1) {
    for (let col = 0; col < grid.cols; col += 1) {
      const centreX = (col + 0.5) * grid.width;
      const centreY = (row + 0.5) * grid.height;
      const signX = 2 * col + 1 < grid.cols ? -1 : 1;
      const signY = 2 * row + 1 < grid.rows ? -1 : 1;
      const cornerX = signX < 0 ? -reachX : width + reachX;
      const cornerY = signY < 0 ? -reachY : height + reachY;
      const spread = 0.55 + random() * 0.45;
      cubes.push({
        col,
        row,
        left: col * grid.width,
        top: row * grid.height,
        width: grid.width,
        height: grid.height,
        fromX: (cornerX - centreX) * spread,
        fromY: (cornerY - centreY) * spread,
        fromRotation: signX * signY * (90 + random() * 270),
        turnAt: (col + row) / Math.max(1, grid.cols + grid.rows - 2),
      });
    }
  }
  return cubes;
}
