import { describe, expect, it } from 'vitest';
import {
  PLACEHOLDER_CHARS,
  addChild,
  addSibling,
  buildShadowMoves,
  buildShadowNode,
  compileBranch,
  createInsertion,
  createNode,
  createRoot,
  cumulativeCountsForPath,
  findNode,
  findParent,
  getMainPath,
  getPath,
  nextAvailablePlaceholder,
  removeNode,
  resolveInsertions,
  toggleExpand,
  updateNode,
} from '@/core/solution';
import type { SolutionNode } from '@/core/solution';
import { expand as expandCommutator } from '@/lib/commutator';

function makeTree(): SolutionNode {
  let root = createRoot();
  const a = createNode({ id: 'a', moves: 'R' });
  const b = createNode({ id: 'b', moves: 'U' });
  root = updateNode(root, root.id, { children: [a, b] });
  return root;
}

describe('createNode / createRoot', () => {
  it('createNode has defaults', () => {
    const n = createNode();
    expect(n.id).toBeDefined();
    expect(n.moves).toBe('');
    expect(n.bracketed).toBe(false);
    expect(n.priority).toBe('none');
    expect(n.color).toBe('none');
    expect(n.children).toEqual([]);
  });

  it('createNode respects overrides', () => {
    const n = createNode({ moves: 'R U', label: 'EO', bracketed: true });
    expect(n.moves).toBe('R U');
    expect(n.label).toBe('EO');
    expect(n.bracketed).toBe(true);
  });
});

describe('findNode / findParent / getPath', () => {
  const tree = makeTree();

  it('findNode finds root and children', () => {
    expect(findNode(tree, tree.id)?.id).toBe(tree.id);
    expect(findNode(tree, 'a')?.id).toBe('a');
  });

  it('findParent returns null for root', () => {
    expect(findParent(tree, tree.id)).toBeNull();
  });

  it('findParent returns root for top child', () => {
    expect(findParent(tree, 'a')?.id).toBe(tree.id);
  });

  it('getPath returns root → ... → node', () => {
    const path = getPath(tree, 'b');
    expect(path?.map((n) => n.id)).toEqual([tree.id, 'b']);
  });
});

describe('addChild / addSibling / removeNode', () => {
  it('addChild appends under parent and returns new node', () => {
    let tree = createRoot();
    const { root, node } = addChild(tree, tree.id, { moves: 'R' });
    expect(root.children.map((c) => c.id)).toContain(node.id);
    expect(findNode(root, node.id)?.moves).toBe('R');
    tree = root;
    expect(findNode(tree, node.id)).toBeTruthy();
  });

  it('addSibling at root falls back to add-child', () => {
    let tree = createRoot();
    const { root, node } = addSibling(tree, tree.id, { moves: 'X' });
    expect(root.children).toHaveLength(1);
    expect(root.children[0].id).toBe(node.id);
    tree = root;
    expect(tree.id).toBe(root.id);
  });

  it('addSibling places sibling immediately after target', () => {
    const tree = makeTree();
    const { root } = addSibling(tree, 'a', { id: 's', moves: 'F' });
    expect(root.children.map((c) => c.id)).toEqual(['a', 's', 'b']);
  });

  it('removeNode returns new root and a sensible nextActiveId', () => {
    const tree = makeTree();
    const { root, nextActiveId } = removeNode(tree, 'b');
    expect(root.children.map((c) => c.id)).toEqual(['a']);
    // After removing b (idx 1), prev sibling 'a' should be selected.
    expect(nextActiveId).toBe('a');
  });
});

describe('toggleExpand bug fix (used to spread a function)', () => {
  it('flips the isExpanded boolean', () => {
    let tree = createRoot();
    const child = createNode({ id: 'c1', isExpanded: true });
    tree = updateNode(tree, tree.id, { children: [child] });
    const after = toggleExpand(tree, 'c1');
    expect(findNode(after, 'c1')?.isExpanded).toBe(false);
    const back = toggleExpand(after, 'c1');
    expect(findNode(back, 'c1')?.isExpanded).toBe(true);
  });
});

describe('cumulativeCountsForPath', () => {
  it('sums step counts along the path', () => {
    let tree = createRoot();
    const a = createNode({ id: 'a', moves: 'R U' }); // 2
    const b = createNode({ id: 'b', moves: "R' F D" }); // 3
    a.children = [b];
    tree = updateNode(tree, tree.id, { children: [a] });

    const cum = cumulativeCountsForPath(tree, 'b');
    expect(cum.get('a')).toBe(2);
    expect(cum.get('b')).toBe(5);
  });
});

describe('getMainPath', () => {
  it('follows first child each level', () => {
    let tree = createRoot();
    const a = createNode({ id: 'a' });
    const b = createNode({ id: 'b' });
    a.children = [
      createNode({ id: 'a-a' }),
      createNode({ id: 'a-b' }),
    ];
    tree = updateNode(tree, tree.id, { children: [a, b] });
    expect(getMainPath(tree).map((n) => n.id)).toEqual(['a', 'a-a']);
  });
});

describe('buildShadowMoves (spec §5: only last move flips)', () => {
  it("R U R' → R U R", () => {
    expect(buildShadowMoves("R U R'")).toBe('R U R');
  });
  it('R U R → R U R\'', () => {
    expect(buildShadowMoves('R U R')).toBe("R U R'");
  });
  it('R U R2 → R U R2 (double unchanged)', () => {
    expect(buildShadowMoves('R U R2')).toBe('R U R2');
  });
  it('single move R → R\'', () => {
    expect(buildShadowMoves('R')).toBe("R'");
  });
  it('empty input → empty', () => {
    expect(buildShadowMoves('')).toBe('');
  });
});

describe('buildShadowNode', () => {
  it('produces sibling-shaped node with new id and shadow moves', () => {
    const source = createNode({ id: 'src', moves: "R U R'", label: 'EO' });
    const shadow = buildShadowNode(source);
    expect(shadow.id).not.toBe(source.id);
    expect(shadow.moves).toBe('R U R');
    expect(shadow.label).toBe('EO (shadow)');
    expect(shadow.children).toEqual([]);
  });
});

describe('resolveInsertions', () => {
  it('substitutes a normal insertion at # placeholder', () => {
    const ins = createInsertion({
      placeholder: '#',
      moves: 'U2 B2 U2 L2 B2 U2 B2 L2',
      type: 'normal',
    });
    const r = resolveInsertions('U2 # L2 B2 U R2 D', [ins]);
    expect(r.error).toBeUndefined();
    expect(r.resolved).toBe('U2 U2 B2 U2 L2 B2 U2 B2 L2 L2 B2 U R2 D');
  });

  it("wide insertion w turns F#' into Fw'", () => {
    const ins = createInsertion({ placeholder: '#', moves: 'w', type: 'wide' });
    const r = resolveInsertions("U2 F#' U2 F' U2 F#'", [ins]);
    expect(r.error).toBeUndefined();
    expect(r.resolved).toBe("U2 Fw' U2 F' U2 Fw'");
  });

  it("wide insertion ' (apostrophe) turns F# into F'", () => {
    const ins = createInsertion({ placeholder: '#', moves: "'", type: 'wide' });
    const r = resolveInsertions('F#', [ins]);
    expect(r.resolved).toBe("F'");
  });

  it('flags an error if a # remains unresolved', () => {
    const r = resolveInsertions('R # U', []);
    expect(r.error).toBeDefined();
  });

  it('flags an error for other unresolved placeholders (@, ^, …)', () => {
    const r = resolveInsertions('R @ U', []);
    expect(r.error).toBeDefined();
    expect(r.error).toContain('@');
  });

  it('handles per-insertion placeholders independently', () => {
    const a = createInsertion({ placeholder: '#', moves: 'U2', type: 'normal' });
    const b = createInsertion({ placeholder: '@', moves: "F'", type: 'normal' });
    const r = resolveInsertions('R # U @ D', [a, b]);
    expect(r.error).toBeUndefined();
    expect(r.resolved).toBe("R U2 U F' D");
  });

  it('expands a commutator insertion via the commutator library', () => {
    const c = createInsertion({
      placeholder: '#',
      moves: '[R, U]',
      type: 'commutator',
    });
    const r = resolveInsertions('# F', [c]);
    expect(r.error).toBeUndefined();
    // [R, U] = R U R' U' (library may simplify trivially); the F at the end
    // should survive.
    expect(r.resolved.endsWith('F')).toBe(true);
  });
});

describe('nextAvailablePlaceholder', () => {
  it('returns "#" when there are no existing insertions', () => {
    expect(nextAvailablePlaceholder([])).toBe(PLACEHOLDER_CHARS[0]);
  });

  it('skips already-used placeholders', () => {
    const ins = [
      createInsertion({ placeholder: '#' }),
      createInsertion({ placeholder: '@' }),
    ];
    expect(nextAvailablePlaceholder(ins)).toBe('^');
  });
});

describe('commutator.expand', () => {
  it('expands [R, U] to R U R\' U\'', () => {
    expect(expandCommutator({ algorithm: '[R, U]' })).toBe("R U R' U'");
  });

  it('expands U:[R, F] to a conjugate', () => {
    const out = expandCommutator({ algorithm: 'U:[R, F]' });
    expect(out).toBe("U R F R' F' U'");
  });

  it('reports missing brackets', () => {
    expect(expandCommutator({ algorithm: '[R, U' })).toBe(
      'Lack right parenthesis.',
    );
  });
});

describe('compileBranch — spec §7 worked example', () => {
  // NOTE: spec §7's printed sequence ends with "... F U' B" but EO is `B2 U F' L`,
  // so the inverse must end with B2. We expect the mathematically correct B2.
  const expectedFinal =
    "F R2 F D2 R2 F U2 F D2 R2 U2 R2 U' F2 R2 B' F' U2 D F' L' F U' B2";

  it('produces the expected final solution', () => {
    const nodes: SolutionNode[] = [
      createNode({ moves: 'B2 U F\' L', label: 'EO', bracketed: true }),
      createNode({ moves: "F D' U2 F B R2 F2 U", label: 'DR', bracketed: true }),
      createNode({ moves: "F R2 F D2 R2 F U2 F'", label: 'HTR', bracketed: false }),
      createNode({ moves: 'R2 U2 R2 D2 F2', label: 'FINISH', bracketed: true }),
    ];
    const result = compileBranch(nodes, []);
    expect(result.error).toBeUndefined();
    expect(result.text).toBe(expectedFinal);
  });

  it('count drops by 1 due to F\' F2 → F simplification', () => {
    const nodes: SolutionNode[] = [
      createNode({ moves: 'B2 U F\' L', bracketed: true }),
      createNode({ moves: "F D' U2 F B R2 F2 U", bracketed: true }),
      createNode({ moves: "F R2 F D2 R2 F U2 F'", bracketed: false }),
      createNode({ moves: 'R2 U2 R2 D2 F2', bracketed: true }),
    ];
    const result = compileBranch(nodes, []);
    // Pre-simplify: 4+8+8+5 = 25 moves; after F' F2 → F merge: 24
    expect(result.moveCount).toBe(24);
  });

  it('cumulative per-node counts use raw (pre-simplify) step counts', () => {
    const nodes: SolutionNode[] = [
      createNode({ moves: 'D L B\' U B\' L\'', bracketed: false }),
      createNode({ moves: "B F' L' B' L'", bracketed: false }),
      createNode({ moves: 'R2 U2 L2 U2 L2 F', bracketed: false }),
      createNode({ moves: "D2 L2 U2 B' F' U2 F B'", bracketed: false }),
    ];
    const result = compileBranch(nodes, []);
    expect(result.nodes.map((n) => n.stepCount)).toEqual([6, 5, 6, 8]);
    expect(result.nodes.map((n) => n.cumulativeCount)).toEqual([6, 11, 17, 25]);
  });

  it('resolves a wide insertion inside a bracketed node', () => {
    const wideIns = createInsertion({ placeholder: '#', moves: 'w', type: 'wide' });
    const nodes: SolutionNode[] = [
      createNode({ moves: "U2 F#' U2 F' U2 F#'", bracketed: true }),
    ];
    const result = compileBranch(nodes, [wideIns]);
    expect(result.error).toBeUndefined();
    // inverse of "U2 Fw' U2 F' U2 Fw'" = "Fw U2 F U2 Fw U2"
    expect(result.text).toBe('Fw U2 F U2 Fw U2');
  });

  it('compiles inline mixed forward and inverse in one node', () => {
    const nodes: SolutionNode[] = [
      createNode({ moves: "(U D') R (D2 B' R) R2", bracketed: false }),
    ];
    const result = compileBranch(nodes, []);
    expect(result.error).toBeUndefined();
    expect(result.nodes[0].stepCount).toBe(7);
    expect(result.moveCount).toBeGreaterThan(0);
  });
});
