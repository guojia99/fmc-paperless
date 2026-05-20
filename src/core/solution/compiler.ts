import type { Move } from '@/core/moves/types';
import {
  inverseSequence,
  parseMoves,
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
 *   final = simplify( [ all naked nodes, in order ]
 *                   ++ [ inverse of each bracketed node, in REVERSE order ] )
 *
 * Insertions are substituted into each node's raw move text before parsing.
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

    let parsed: Move[];
    try {
      parsed = parseMoves(resolved);
    } catch (err) {
      if (!firstError) {
        const msg = err instanceof Error ? err.message : '解析失败';
        firstError = `${node.label || node.id}: ${msg}`;
      }
      parsed = [];
    }

    if (node.bracketed) {
      bracketedSegments.push(parsed);
    } else {
      naked.push(...parsed);
    }

    cumulative += parsed.length;
    nodeInfos.push({
      id: node.id,
      moves: node.moves,
      bracketed: node.bracketed,
      label: node.label,
      stepCount: parsed.length,
      cumulativeCount: cumulative,
    });
  }

  const inverted: Move[] = [];
  for (let i = bracketedSegments.length - 1; i >= 0; i--) {
    inverted.push(...inverseSequence(bracketedSegments[i]).moves);
  }

  const combined: Move[] = [...naked, ...inverted];
  const simplified = simplify(combined);

  return {
    text: serializeMoves(simplified.moves),
    moveCount: simplified.moves.length,
    nodes: nodeInfos,
    error: firstError,
  };
}
