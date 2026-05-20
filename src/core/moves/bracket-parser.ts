import type { Move } from './types';
import { inverseSequence } from './inverse';
import { parseMoves } from './parser';

export interface ParsedMoveSegments {
  naked: Move[];
  bracketedGroups: Move[][];
  moveCount: number;
}

/**
 * Parse a move string that may mix naked and parenthesized (inverse) segments.
 * Example: `(U D') R (D2 B' R) R2` → naked [R, R2], bracketed [[U,D'], [D2,B',R]]
 */
export function parseMovesWithBrackets(input: string): ParsedMoveSegments {
  const s = input.trim();
  if (!s) {
    return { naked: [], bracketedGroups: [], moveCount: 0 };
  }

  const naked: Move[] = [];
  const bracketedGroups: Move[][] = [];
  let i = 0;

  while (i < s.length) {
    const ch = s[i];
    if (ch === '(') {
      let depth = 1;
      let j = i + 1;
      while (j < s.length && depth > 0) {
        if (s[j] === '(') depth += 1;
        else if (s[j] === ')') depth -= 1;
        j += 1;
      }
      if (depth !== 0) {
        throw new Error('括号不匹配：缺少 )');
      }
      const inner = s.slice(i + 1, j - 1).trim();
      if (inner) {
        bracketedGroups.push(parseMoves(inner));
      }
      i = j;
      continue;
    }
    if (ch === ')') {
      throw new Error('括号不匹配：多余的 )');
    }

    let j = i;
    while (j < s.length && s[j] !== '(') j += 1;
    const chunk = s.slice(i, j).trim();
    if (chunk) {
      naked.push(...parseMoves(chunk));
    }
    i = j;
  }

  const moveCount =
    naked.length + bracketedGroups.reduce((sum, g) => sum + g.length, 0);

  return { naked, bracketedGroups, moveCount };
}

/** True when the string contains at least one `(...)` group. */
export function hasInlineBrackets(input: string): boolean {
  return /\([^)]*\)/.test(input);
}

/** Apply FMC rules: naked forward, then bracketed groups inverted in reverse order. */
export function combineSegmentMoves(
  naked: Move[],
  bracketedGroups: Move[][],
): Move[] {
  const inverted: Move[] = [];
  for (let i = bracketedGroups.length - 1; i >= 0; i--) {
    inverted.push(...inverseSequence(bracketedGroups[i]).moves);
  }
  return [...naked, ...inverted];
}
