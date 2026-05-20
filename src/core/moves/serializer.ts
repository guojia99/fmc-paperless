import type { Move } from './types';

export function serializeMove(move: Move): string {
  let result = move.face;
  if (move.wide) result += 'w';
  if (move.modifier === 'prime') result += "'";
  if (move.modifier === 'double') result += '2';
  return result;
}

export function serializeMoves(moves: Move[]): string {
  return moves.map(serializeMove).join(' ');
}
