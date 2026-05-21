import type { SolutionNode } from './types';
import { createNode } from './tree-utils';
import { inverseMove, parseMoves, serializeMove } from '@/core/moves';

/**
 * Build the "shadow" version of a solution node — only the LAST move of the
 * sequence is flipped (A ↔ A'; A2 stays A2). All other moves are unchanged.
 *
 * Per spec §5: a shadow is added as a sibling of the source node.
 */
export function buildShadowMoves(moves: string): string {
  const tokens = moves.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '';

  // Walk backwards to find the last move token, stripping trailing parens
  let moveToken = tokens[tokens.length - 1];
  let trailingClose = '';
  while (moveToken.endsWith(')')) {
    trailingClose = ')' + trailingClose;
    moveToken = moveToken.slice(0, -1);
  }

  try {
    const parsed = parseMoves(moveToken);
    if (parsed.length === 0) return moves;
    const flipped = serializeMove(inverseMove(parsed[0]));
    tokens[tokens.length - 1] = flipped + trailingClose;
    return tokens.join(' ');
  } catch {
    return moves;
  }
}

/**
 * Build a fresh sibling-shaped shadow node based on `source`. The returned
 * node has a new id and no children — the caller (tree mutation) is
 * responsible for inserting it as a sibling.
 */
export function buildShadowNode(source: SolutionNode): SolutionNode {
  return createNode({
    moves: buildShadowMoves(source.moves),
    label: source.label ? `${source.label} (shadow)` : 'shadow',
    annotation: '',
    bracketed: source.bracketed,
    priority: source.priority,
    color: source.color,
    children: [],
  });
}
