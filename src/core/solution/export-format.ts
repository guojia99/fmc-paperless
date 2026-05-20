import type { CompiledNodeInfo, SolutionNode } from './types';

/** Display moves as stored (inline `( ... )` supported). Legacy whole-node bracket. */
export function formatMovesExport(moves: string, bracketed: boolean): string {
  const m = moves.trim();
  if (!m) return '';
  if (m.includes('(') || m.includes(')')) return m;
  return bracketed ? `(${m})` : m;
}

/** Suffix after moves: ` // annotation` when annotation is non-empty. */
export function formatAnnotationSuffix(annotation: string): string {
  const text = annotation.trim();
  return text ? ` // ${text}` : '';
}

/** One export line segment: moves + optional annotation comment. */
export function formatNodeExportLine(
  moves: string,
  bracketed: boolean,
  annotation: string,
): string {
  const part = formatMovesExport(moves, bracketed);
  return `${part}${formatAnnotationSuffix(annotation)}`;
}

/** Preview of the first step in a chain (first root child). */
export function formatFirstNodePreview(tree: SolutionNode): string | null {
  const first = tree.children[0];
  if (!first) return null;
  const moves = formatMovesExport(first.moves, first.bracketed);
  if (!moves && !first.annotation.trim() && !first.label.trim()) {
    return null;
  }
  const suffix =
    formatAnnotationSuffix(first.annotation) ||
    (first.label.trim() ? ` // ${first.label.trim()}` : '');
  return moves ? `${moves}${suffix}` : suffix.trim() || null;
}

/** Full arrangement-board line for one compiled step. */
export function formatCompiledNodeLine(n: CompiledNodeInfo): string {
  const body = formatNodeExportLine(n.moves, n.bracketed, n.annotation);
  return `${body}  ${n.stepCount}/${n.cumulativeCount}`;
}
