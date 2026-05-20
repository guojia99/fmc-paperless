import { nanoid } from 'nanoid';
import type { NodeColor, Priority, SolutionNode } from './types';
import { parseMoves } from '@/core/moves';

export function createNode(partial: Partial<SolutionNode> = {}): SolutionNode {
  return {
    id: partial.id ?? nanoid(8),
    moves: partial.moves ?? '',
    label: partial.label ?? '',
    annotation: partial.annotation ?? '',
    bracketed: partial.bracketed ?? false,
    priority: (partial.priority ?? 'none') satisfies Priority,
    color: (partial.color ?? 'none') satisfies NodeColor,
    children: partial.children ?? [],
    isExpanded: partial.isExpanded ?? true,
  };
}

export function createRoot(): SolutionNode {
  return createNode({ label: '', moves: '' });
}

export function findNode(root: SolutionNode, id: string): SolutionNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}

export function findParent(
  root: SolutionNode,
  id: string,
): SolutionNode | null {
  for (const child of root.children) {
    if (child.id === id) return root;
    const deeper = findParent(child, id);
    if (deeper) return deeper;
  }
  return null;
}

export function getPath(root: SolutionNode, id: string): SolutionNode[] | null {
  if (root.id === id) return [root];
  for (const child of root.children) {
    const sub = getPath(child, id);
    if (sub) return [root, ...sub];
  }
  return null;
}

/** A path is the main path = always first child of root, recursively. */
export function getMainPath(root: SolutionNode): SolutionNode[] {
  const path: SolutionNode[] = [];
  let cur: SolutionNode | undefined = root.children[0];
  while (cur) {
    path.push(cur);
    cur = cur.children[0];
  }
  return path;
}

/** Returns every leaf-to-root path beneath the root (excluding the synthetic root node itself). */
export function getAllLeafPaths(root: SolutionNode): SolutionNode[][] {
  const paths: SolutionNode[][] = [];
  function walk(node: SolutionNode, acc: SolutionNode[]) {
    if (node.children.length === 0) {
      paths.push([...acc, node]);
      return;
    }
    for (const child of node.children) walk(child, [...acc, node]);
  }
  for (const child of root.children) walk(child, []);
  return paths;
}

function countMovesInString(moves: string): number {
  if (!moves || !moves.trim()) return 0;
  try {
    return parseMoves(moves).length;
  } catch {
    return 0;
  }
}

export function stepCount(node: SolutionNode): number {
  return countMovesInString(node.moves);
}

export function mapTree(
  root: SolutionNode,
  fn: (node: SolutionNode) => SolutionNode,
): SolutionNode {
  const next = fn(root);
  if (next.children === root.children) {
    if (next.children.length === 0) return next;
    const mapped = next.children.map((c) => mapTree(c, fn));
    const changed = mapped.some((c, i) => c !== next.children[i]);
    return changed ? { ...next, children: mapped } : next;
  }
  return { ...next, children: next.children.map((c) => mapTree(c, fn)) };
}

export function updateNode(
  root: SolutionNode,
  id: string,
  patch: Partial<SolutionNode>,
): SolutionNode {
  return mapTree(root, (node) => (node.id === id ? { ...node, ...patch } : node));
}

export function toggleExpand(root: SolutionNode, id: string): SolutionNode {
  return mapTree(root, (node) =>
    node.id === id ? { ...node, isExpanded: !node.isExpanded } : node,
  );
}

/** Expand the chain tree so `id` and all its ancestors are visible. */
export function ensureExpandedToNode(
  root: SolutionNode,
  id: string,
): SolutionNode {
  const path = getPath(root, id);
  if (!path) return root;
  const pathIds = new Set(path.map((n) => n.id));
  return mapTree(root, (node) => {
    if (!pathIds.has(node.id)) return node;
    const isLeaf = node.id === id;
    if (isLeaf) return node;
    return node.isExpanded ? node : { ...node, isExpanded: true };
  });
}

/**
 * Append a new child under `parentId`. If the new child's `moves` is omitted
 * an empty node is created. Returns the new root and the new node id.
 */
export function addChild(
  root: SolutionNode,
  parentId: string,
  child: Partial<SolutionNode> = {},
): { root: SolutionNode; node: SolutionNode } {
  const node = createNode(child);
  const nextRoot = mapTree(root, (n) =>
    n.id === parentId ? { ...n, children: [...n.children, node], isExpanded: true } : n,
  );
  return { root: nextRoot, node };
}

/**
 * Add a sibling AFTER `siblingId`. The synthetic root is never a sibling
 * target; if `siblingId` is the root id, fall back to adding a child of root.
 */
export function addSibling(
  root: SolutionNode,
  siblingId: string,
  sibling: Partial<SolutionNode> = {},
): { root: SolutionNode; node: SolutionNode } {
  if (root.id === siblingId) {
    return addChild(root, root.id, sibling);
  }
  const node = createNode(sibling);
  const parent = findParent(root, siblingId);
  if (!parent) return { root, node };
  const nextRoot = mapTree(root, (n) => {
    if (n.id !== parent.id) return n;
    const idx = n.children.findIndex((c) => c.id === siblingId);
    if (idx < 0) return n;
    const children = [...n.children];
    children.splice(idx + 1, 0, node);
    return { ...n, children, isExpanded: true };
  });
  return { root: nextRoot, node };
}

/**
 * Remove the node `id` from the tree. The synthetic root cannot be removed.
 * Returns the next root and the id of a sensible new "active" node — its
 * previous sibling, then parent, then root id.
 */
export function removeNode(
  root: SolutionNode,
  id: string,
): { root: SolutionNode; nextActiveId: string } {
  if (root.id === id) return { root, nextActiveId: root.id };
  const parent = findParent(root, id);
  if (!parent) return { root, nextActiveId: root.id };
  const idx = parent.children.findIndex((c) => c.id === id);
  const newActive =
    parent.children[idx - 1]?.id ?? parent.children[idx + 1]?.id ?? parent.id;
  const nextRoot = mapTree(root, (n) =>
    n.id === parent.id ? { ...n, children: n.children.filter((c) => c.id !== id) } : n,
  );
  return { root: nextRoot, nextActiveId: newActive };
}

/**
 * Compute cumulative move counts along the path containing `targetId`.
 * Returns a map of nodeId → cumulative count.
 */
export function cumulativeCountsForPath(
  root: SolutionNode,
  targetId: string,
): Map<string, number> {
  const map = new Map<string, number>();
  const path = getPath(root, targetId);
  if (!path) return map;
  let running = 0;
  for (const n of path) {
    if (n.id === root.id) continue;
    running += stepCount(n);
    map.set(n.id, running);
  }
  return map;
}

/** True if `ancestor` is a strict ancestor of `descendant` in the tree. */
export function isAncestor(
  root: SolutionNode,
  ancestor: string,
  descendant: string,
): boolean {
  const path = getPath(root, descendant);
  if (!path) return false;
  return path.some((n) => n.id === ancestor) && ancestor !== descendant;
}

/**
 * Get the leaf descended through the "preferred branch" from `node`. The
 * preferred branch follows the active path if any of `node`'s descendants is
 * `activeId`; otherwise it follows the first child each step.
 */
export function leafFromNode(node: SolutionNode, activeId: string): SolutionNode {
  if (node.children.length === 0) return node;
  if (findNode(node, activeId)) {
    for (const child of node.children) {
      if (findNode(child, activeId)) return leafFromNode(child, activeId);
    }
  }
  return leafFromNode(node.children[0], activeId);
}
