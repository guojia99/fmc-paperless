export type Face =
  | 'R' | 'L' | 'U' | 'D' | 'F' | 'B'
  | 'x' | 'y' | 'z'
  | 'M' | 'E' | 'S';

export type Modifier = 'none' | 'prime' | 'double';

export interface Move {
  face: Face;
  modifier: Modifier;
  wide: boolean;
}

export interface MoveSequence {
  moves: Move[];
}

export const FACE_MOVES: Face[] = ['R', 'L', 'U', 'D', 'F', 'B'];

export const AXIS_MOVES: Face[] = ['x', 'y', 'z'];

export const SLICE_MOVES: Face[] = ['M', 'E', 'S'];

export const OPPOSITE_FACES: Record<Face, Face> = {
  R: 'L', L: 'R', U: 'D', D: 'U', F: 'B', B: 'F',
  x: 'x', y: 'y', z: 'z',
  M: 'M', E: 'E', S: 'S',
};

const VALID_FACES = new Set<string>([
  ...FACE_MOVES,
  ...AXIS_MOVES,
  ...SLICE_MOVES,
]);

export function isValidFace(s: string): s is Face {
  return VALID_FACES.has(s);
}

export function parseModifier(suffix: string): Modifier {
  if (suffix.includes('2')) return 'double';
  if (suffix.includes("'")) return 'prime';
  return 'none';
}
