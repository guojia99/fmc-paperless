import type { Face, Modifier, Move, MoveSequence } from './types';

/**
 * Maps a face to its "axis pair" identifier. Moves on the same pair commute
 * (e.g. R-L, U-D, F-B), so they can be reordered and merged. Axis rotations
 * (x/y/z) each form their own group — they do NOT merge with face moves
 * even on the same physical axis (R cannot cancel with x).
 */
const AXIS_PAIR: Record<Face, string> = {
  U: 'UD', D: 'UD', E: 'UD',
  F: 'FB', B: 'FB', S: 'FB',
  L: 'LR', R: 'LR', M: 'LR',
  x: 'x', y: 'y', z: 'z',
};

const PAIR_ORDER: Record<string, Face[]> = {
  UD: ['U', 'E', 'D'],
  FB: ['F', 'S', 'B'],
  LR: ['L', 'M', 'R'],
  x: ['x'],
  y: ['y'],
  z: ['z'],
};

function modifierValue(m: Modifier): number {
  if (m === 'none') return 1;
  if (m === 'prime') return 3;
  return 2;
}

function valueToModifier(v: number): Modifier | null {
  const mod = ((v % 4) + 4) % 4;
  if (mod === 0) return null;
  if (mod === 1) return 'none';
  if (mod === 2) return 'double';
  return 'prime';
}

function runKey(m: Move): string {
  return `${AXIS_PAIR[m.face]}|${m.wide ? 'w' : ''}`;
}

function moveKey(m: Move): string {
  return `${m.face}|${m.modifier}|${m.wide ? 'w' : ''}`;
}

/**
 * If the simplified output is just a reordering of the input (same move
 * multiset), preserve the user's original ordering. Only emit the canonical
 * order when modifiers were actually merged.
 */
function sameMultiset(a: Move[], b: Move[]): boolean {
  if (a.length !== b.length) return false;
  const counts = new Map<string, number>();
  for (const m of a) counts.set(moveKey(m), (counts.get(moveKey(m)) ?? 0) + 1);
  for (const m of b) {
    const k = moveKey(m);
    const c = counts.get(k);
    if (!c) return false;
    counts.set(k, c - 1);
  }
  for (const c of counts.values()) if (c !== 0) return false;
  return true;
}

function simplifyRun(run: Move[]): Move[] {
  if (run.length === 0) return [];
  const sample = run[0];
  const pair = AXIS_PAIR[sample.face];
  const wide = sample.wide;

  const sums: Partial<Record<Face, number>> = {};
  for (const m of run) {
    sums[m.face] = (sums[m.face] ?? 0) + modifierValue(m.modifier);
  }

  const result: Move[] = [];
  for (const face of PAIR_ORDER[pair]) {
    const total = sums[face];
    if (total == null) continue;
    const mod = valueToModifier(total);
    if (mod) result.push({ face, modifier: mod, wide });
  }

  if (sameMultiset(result, run)) return run.slice();
  return result;
}

function sameSequence(a: Move[], b: Move[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].face !== b[i].face) return false;
    if (a[i].modifier !== b[i].modifier) return false;
    if (a[i].wide !== b[i].wide) return false;
  }
  return true;
}

/**
 * Simplify a move sequence following FMC cancellation rules:
 *   1. Within a maximal contiguous run of commuting moves (same axis pair,
 *      same wide flag), group by face and sum modifiers mod 4.
 *   2. Emit one move per face in canonical order (U before D, F before B,
 *      L before R), skipping faces whose total is 0.
 *   3. Iterate to a fixed point — removing moves may merge new neighbors.
 *
 * Examples:
 *   F' F2       → F
 *   U' D2 U'    → U2 D2
 *   R R R R     → (empty)
 *   Uw D        → Uw D       (wide/non-wide do NOT merge)
 *   R U U' R'   → (empty)
 */
export function simplify(moves: Move[]): MoveSequence {
  let cur = moves.slice();
  let safety = cur.length * 4 + 8;

  while (safety-- > 0) {
    if (cur.length === 0) break;

    const runs: Move[][] = [];
    let buf: Move[] = [cur[0]];
    let key = runKey(cur[0]);
    for (let i = 1; i < cur.length; i++) {
      const k = runKey(cur[i]);
      if (k === key) {
        buf.push(cur[i]);
      } else {
        runs.push(buf);
        buf = [cur[i]];
        key = k;
      }
    }
    runs.push(buf);

    const next = runs.flatMap(simplifyRun);
    if (sameSequence(next, cur)) {
      cur = next;
      break;
    }
    cur = next;
  }

  return { moves: cur };
}

export function countMoves(moves: Move[]): number {
  return moves.length;
}
