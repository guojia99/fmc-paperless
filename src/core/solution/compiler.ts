import type { Move } from '@/core/moves/types';
import {
  combineSegmentMoves,
  hasInlineBrackets,
  parseMoves,
  parseMovesWithBrackets,
  serializeMoves,
  simplify,
} from '@/core/moves';
import type {
  CompiledNodeInfo,
  CompiledResult,
  Insertion,
  SolutionNode,
} from './types';
import { resolveInsertions } from './insertions';

/**
 * Compile an ordered list of nodes (a single branch from root through leaf)
 * into a final solution string, following FMC bracket conventions:
 *
 *   final = simplify( [ all naked segments, in order ]
 *                   ++ [ inverse of each parenthesized group, in REVERSE order ] )
 *
 * Each node may use inline `( ... )` groups mixed with naked moves, e.g.
 * `(U D') R (D2 B' R) R2`. Legacy `node.bracketed` without inline parens
 * treats the whole node as one inverse group.
 */
export function compileBranch(
  nodes: SolutionNode[],
  insertions: Insertion[],
): CompiledResult {
  const nodeInfos: CompiledNodeInfo[] = [];
  const naked: Move[] = [];
  const bracketedSegments: Move[][] = [];
  let cumulative = 0;
  let firstError: string | undefined;

  for (const node of nodes) {
    const { resolved, error: resErr } = resolveInsertions(node.moves, insertions);
    if (resErr && !firstError) {
      firstError = `${node.label || node.id}: ${resErr}`;
    }

    let stepCount = 0;

    try {
      if (hasInlineBrackets(resolved)) {
        const segments = parseMovesWithBrackets(resolved);
        naked.push(...segments.naked);
        for (const group of segments.bracketedGroups) {
          bracketedSegments.push(group);
        }
        stepCount = segments.moveCount;
      } else if (node.bracketed && resolved.trim()) {
        const parsed = parseMoves(resolved);
        bracketedSegments.push(parsed);
        stepCount = parsed.length;
      } else if (resolved.trim()) {
        const parsed = parseMoves(resolved);
        naked.push(...parsed);
        stepCount = parsed.length;
      }
    } catch (err) {
      if (!firstError) {
        const msg = err instanceof Error ? err.message : '解析失败';
        firstError = `${node.label || node.id}: ${msg}`;
      }
    }

    cumulative += stepCount;
    nodeInfos.push({
      id: node.id,
      moves: node.moves,
      bracketed: node.bracketed,
      label: node.label,
      annotation: node.annotation,
      stepCount,
      cumulativeCount: cumulative,
    });
  }

  const combined = combineSegmentMoves(naked, bracketedSegments);
  const simplified = simplify(combined);

  return {
    text: serializeMoves(simplified.moves),
    moveCount: simplified.moves.length,
    nodes: nodeInfos,
    error: firstError,
  };
}
