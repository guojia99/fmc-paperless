import type { Move, MoveSequence } from './types';

export function inverseMove(move: Move): Move {
  return {
    face: move.face,
    modifier: move.modifier === 'double' ? 'double' : move.modifier === 'prime' ? 'none' : 'prime',
    wide: move.wide,
  };
}

export function inverseSequence(moves: Move[]): MoveSequence {
  return { moves: moves.slice().reverse().map(inverseMove) };
}
