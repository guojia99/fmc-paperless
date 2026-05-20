import type { Face, Move, Modifier } from './types';
import { AXIS_MOVES, SLICE_MOVES, isValidFace } from './types';

const FACE_LOWER_MAP: Record<string, Face> = {
  r: 'R', l: 'L', u: 'U', d: 'D', f: 'F', b: 'B',
  R: 'R', L: 'L', U: 'U', D: 'D', F: 'F', B: 'B',
  x: 'x', y: 'y', z: 'z',
  M: 'M', E: 'E', S: 'S',
};

function parseModifierFromSuffix(suffix: string): Modifier {
  const hasDouble = suffix.includes('2');
  const hasPrime = suffix.includes("'");
  if (hasDouble) return 'double';
  if (hasPrime) return 'prime';
  return 'none';
}

function parseToken(token: string): Move {
  if (!token) throw new Error(`Empty move token`);

  const faceChar = token[0];
  const faceUpper = faceChar.toUpperCase();

  if (AXIS_MOVES.includes(faceChar as Face)) {
    const suffix = token.slice(1).replace(/w/gi, '');
    const modifier = parseModifierFromSuffix(suffix);
    return { face: faceChar as Face, modifier, wide: false };
  }

  if (SLICE_MOVES.includes(faceChar as Face)) {
    const suffix = token.slice(1);
    const modifier = parseModifierFromSuffix(suffix);
    return { face: faceChar as Face, modifier, wide: false };
  }

  const isLowercaseFace = faceChar !== faceUpper && !!FACE_LOWER_MAP[faceChar];
  const face = (FACE_LOWER_MAP[faceChar] ?? FACE_LOWER_MAP[faceUpper]) as Face;
  if (!face) throw new Error(`Unrecognized move: "${token}"`);

  let wide = isLowercaseFace;
  let rest = token.slice(1);

  if (!wide && rest.includes('w')) {
    wide = true;
    rest = rest.replace('w', '');
  }

  const modifier = parseModifierFromSuffix(rest);
  return { face, modifier, wide };
}

export function parseMoves(input: string): Move[] {
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  return tokens.map(parseToken);
}

export function isValidMoveString(input: string): boolean {
  try {
    parseMoves(input);
    return true;
  } catch {
    return false;
  }
}

export { isValidFace };
