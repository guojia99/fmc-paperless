import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { nanoid } from 'nanoid';

import type { CyclingState } from '@/core/keyboard';
import { resetCycling, resolveCycling } from '@/core/keyboard';
import type { Face, Modifier } from '@/core/moves/types';
import { AXIS_MOVES } from '@/core/moves/types';
import { hasInlineBrackets, parseMoves, serializeMove } from '@/core/moves';
import type {
  Insertion,
  NodeColor,
  Priority,
  SolutionNode,
} from '@/core/solution';
import {
  addChild as addChildOp,
  addSibling as addSiblingOp,
  buildShadowNode,
  createInsertion,
  createNode,
  createRoot,
  ensureExpandedToNode,
  findNode,
  isPlaceholderTaken,
  mapTree,
  nextAvailablePlaceholder,
  removeNode as removeNodeOp,
  sanitizePlaceholder,
  toggleExpand as toggleExpandOp,
  updateNode as updateNodeOp,
} from '@/core/solution';
import type {
  ExportedSession,
  SolutionChain,
  SolveSession,
  TimerMode,
} from '@/types';
import { useUIStore } from '@/store/uiStore';
import { useKeyboardStore } from '@/store/keyboardStore';

const STORAGE_KEY = 'fmc.sessions';
const STORAGE_VERSION = 2;
const MAX_SESSIONS = 50;
const DEFAULT_TIMER_SECONDS = 60 * 60;

const ROOT_ID_PREFIX = 'root-';

function makeRoot(): SolutionNode {
  const root = createRoot();
  return { ...root, id: `${ROOT_ID_PREFIX}${nanoid(6)}` };
}

function makeBlankChain(): SolutionChain {
  const root = makeRoot();
  const first = createNode();
  root.children = [first];
  return {
    id: nanoid(8),
    name: '',
    tree: root,
    insertions: [],
    priority: 'none',
    color: 'none',
    isExpanded: true,
  };
}

function makeBlankSession(): SolveSession {
  const now = Date.now();
  const chain = makeBlankChain();
  const firstNodeId = chain.tree.children[0].id;
  return {
    id: nanoid(8),
    createdAt: now,
    updatedAt: now,
    scramble: { text: '', image: null, imageHidden: false },
    chains: [chain],
    activeChainId: chain.id,
    activeNodeId: firstNodeId,
    arrangementBoard: '',
    timer: {
      mode: 'countup',
      initialSeconds: DEFAULT_TIMER_SECONDS,
      startedAt: null,
      elapsedAtPause: 0,
      isRunning: false,
    },
  };
}

function trimToCap(sessions: SolveSession[]): SolveSession[] {
  if (sessions.length <= MAX_SESSIONS) return sessions;
  return [...sessions]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_SESSIONS);
}

function backspaceMoves(moves: string): string {
  const trimmed = moves.trimEnd();
  if (!trimmed) return '';
  const idx = trimmed.lastIndexOf(' ');
  return idx < 0 ? '' : trimmed.slice(0, idx);
}

function applyModifierToLastToken(
  moves: string,
  modifier: "'" | '2' | 'w',
): string {
  const trimmed = moves.trimEnd();
  if (!trimmed) return moves;
  const idx = trimmed.lastIndexOf(' ');
  const lastToken = idx >= 0 ? trimmed.slice(idx + 1) : trimmed;
  const head = idx >= 0 ? trimmed.slice(0, idx + 1) : '';

  let parsed;
  try {
    parsed = parseMoves(lastToken);
  } catch {
    return moves;
  }
  if (parsed.length === 0) return moves;
  let move = parsed[0];

  if (modifier === 'w') {
    if ((AXIS_MOVES as readonly Face[]).includes(move.face)) return moves;
    if (move.wide) return moves;
    move = { ...move, wide: true };
  } else if (modifier === "'") {
    const next: Modifier = move.modifier === 'prime' ? 'none' : 'prime';
    move = { ...move, modifier: next };
  } else if (modifier === '2') {
    const next: Modifier = move.modifier === 'double' ? 'none' : 'double';
    if (next === 'none') {
      return head.trimEnd() === '' ? '' : head.trimEnd();
    }
    move = { ...move, modifier: next };
  }
  return head + serializeMove(move);
}

function applyAppend(moves: string, action: string): string {
  const trimmed = moves.trimEnd();
  return trimmed ? `${trimmed} ${action}` : action;
}

function applyReplace(moves: string, fromIndex: number, action: string): string {
  const before = moves.slice(0, fromIndex).trimEnd();
  return before ? `${before} ${action}` : action;
}

function applyClear(moves: string, fromIndex: number): string {
  return moves.slice(0, fromIndex).trimEnd();
}

function findChainContaining(
  session: SolveSession,
  nodeId: string,
): SolutionChain | undefined {
  return session.chains.find((c) => findNode(c.tree, nodeId));
}

export interface SessionState {
  sessions: SolveSession[];
  activeSessionId: string;
  cycling: { nodeId: string | null; state: CyclingState };

  bootstrap: () => void;
  newSession: () => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;

  setScrambleText: (text: string, image?: string | null) => void;
  setScrambleImage: (image: string | null) => void;
  toggleScrambleImageHidden: () => void;

  newChain: () => string | null;
  deleteChain: (chainId: string) => void;
  setActiveChain: (chainId: string) => void;
  setChainName: (chainId: string, name: string) => void;
  setChainPriority: (chainId: string, priority: Priority) => void;
  setChainColor: (chainId: string, color: NodeColor) => void;
  toggleChainExpand: (chainId: string) => void;
  collapseAllChains: () => void;

  setActiveNode: (id: string) => void;
  setNodeMoves: (id: string, moves: string) => void;
  setNodeLabel: (id: string, label: string) => void;
  setNodeAnnotation: (id: string, annotation: string) => void;
  toggleBracket: (id: string) => void;
  setNodeColor: (id: string, color: NodeColor) => void;
  toggleExpand: (id: string) => void;

  addChildNode: (parentId: string) => string | null;
  addSiblingNode: (siblingId: string) => string | null;
  addShadowNode: (sourceId: string) => string | null;
  deleteNode: (id: string) => void;

  appendKey: (action: string) => void;
  insertPlaceholder: (nodeId: string, placeholder: string) => void;

  addInsertion: (chainId: string, partial?: Partial<Insertion>) => string | null;
  removeInsertion: (chainId: string, insertionId: string) => void;
  updateInsertion: (
    chainId: string,
    insertionId: string,
    patch: Partial<Insertion>,
  ) => void;

  setArrangement: (text: string) => void;

  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  setTimerMode: (mode: TimerMode) => void;
  setTimerInitial: (seconds: number) => void;

  importSession: (payload: ExportedSession | string) => string;
}

function patchActive(
  state: SessionState,
  mutate: (session: SolveSession) => SolveSession,
): Pick<SessionState, 'sessions'> {
  return {
    sessions: state.sessions.map((s) =>
      s.id === state.activeSessionId ? mutate(s) : s,
    ),
  };
}

function patchChainInSession(
  session: SolveSession,
  chainId: string,
  fn: (chain: SolutionChain) => SolutionChain,
): SolveSession {
  return {
    ...session,
    chains: session.chains.map((c) => (c.id === chainId ? fn(c) : c)),
    updatedAt: Date.now(),
  };
}

function patchNodeChain(
  session: SolveSession,
  nodeId: string,
  fn: (tree: SolutionNode) => SolutionNode,
): SolveSession {
  const chain = findChainContaining(session, nodeId);
  if (!chain) return session;
  return patchChainInSession(session, chain.id, (c) => ({
    ...c,
    tree: fn(c.tree),
  }));
}

// --------------------------------------------------------------------
// Migration: v1 stored `tree` + `insertions` directly on SolveSession.
// v2 nests them under `chains[]`.
// --------------------------------------------------------------------
type LegacyV1Session = SolveSession & {
  tree?: SolutionNode;
  insertions?: Insertion[];
};

function migrateLegacySession(raw: LegacyV1Session): SolveSession {
  if (Array.isArray(raw.chains) && raw.chains.length > 0) {
    return {
      ...raw,
      chains: raw.chains.map((c) => ({
        id: c.id ?? nanoid(8),
        name: c.name ?? '',
        tree: c.tree ?? makeRoot(),
        insertions: c.insertions ?? [],
        priority: c.priority ?? 'none',
        color: c.color ?? 'none',
        isExpanded: c.isExpanded ?? true,
      })),
    };
  }
  const legacyTree = raw.tree ?? makeRoot();
  const chain: SolutionChain = {
    id: nanoid(8),
    name: '',
    tree: legacyTree,
    insertions: raw.insertions ?? [],
    priority: 'none',
    color: 'none',
    isExpanded: true,
  };
  const next: SolveSession = {
    id: raw.id ?? nanoid(8),
    createdAt: raw.createdAt ?? Date.now(),
    updatedAt: raw.updatedAt ?? Date.now(),
    scramble: raw.scramble ?? { text: '', image: null, imageHidden: false },
    chains: [chain],
    activeChainId: chain.id,
    activeNodeId: raw.activeNodeId && findNode(legacyTree, raw.activeNodeId)
      ? raw.activeNodeId
      : (legacyTree.children[0]?.id ?? legacyTree.id),
    arrangementBoard: raw.arrangementBoard ?? '',
    timer: raw.timer ?? {
      mode: 'countup',
      initialSeconds: DEFAULT_TIMER_SECONDS,
      startedAt: null,
      elapsedAtPause: 0,
      isRunning: false,
    },
  };
  return next;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: '',
      cycling: { nodeId: null, state: resetCycling() },

      bootstrap: () => {
        const { sessions, activeSessionId } = get();
        if (sessions.length === 0) {
          const fresh = makeBlankSession();
          set({ sessions: [fresh], activeSessionId: fresh.id });
          return;
        }
        const stillValid = sessions.some((s) => s.id === activeSessionId);
        if (!stillValid) {
          const latest = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt)[0];
          set({ activeSessionId: latest.id });
        }
        set((state) => ({
          sessions: state.sessions.map((s) => ({
            ...s,
            timer: { ...s.timer, isRunning: false, startedAt: null },
          })),
        }));
      },

      newSession: () => {
        const fresh = makeBlankSession();
        set((state) => ({
          sessions: trimToCap([...state.sessions, fresh]),
          activeSessionId: fresh.id,
          cycling: { nodeId: null, state: resetCycling() },
        }));
        return fresh.id;
      },

      switchSession: (id) => {
        if (!get().sessions.some((s) => s.id === id)) return;
        set({
          activeSessionId: id,
          cycling: { nodeId: null, state: resetCycling() },
        });
      },

      deleteSession: (id) => {
        set((state) => {
          const next = state.sessions.filter((s) => s.id !== id);
          if (next.length === 0) {
            const fresh = makeBlankSession();
            return {
              sessions: [fresh],
              activeSessionId: fresh.id,
              cycling: { nodeId: null, state: resetCycling() },
            };
          }
          const nextActive =
            state.activeSessionId === id
              ? [...next].sort((a, b) => b.updatedAt - a.updatedAt)[0].id
              : state.activeSessionId;
          return { sessions: next, activeSessionId: nextActive };
        });
      },

      setScrambleText: (text, image) => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            scramble: {
              ...s.scramble,
              text,
              image: image === undefined ? s.scramble.image : image,
            },
            updatedAt: Date.now(),
          })),
        );
      },
      setScrambleImage: (image) => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            scramble: { ...s.scramble, image },
            updatedAt: Date.now(),
          })),
        );
      },
      toggleScrambleImageHidden: () => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            scramble: { ...s.scramble, imageHidden: !s.scramble.imageHidden },
            updatedAt: Date.now(),
          })),
        );
      },

      newChain: () => {
        const chain = makeBlankChain();
        const firstId = chain.tree.children[0].id;
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            chains: [...s.chains, chain],
            activeChainId: chain.id,
            activeNodeId: firstId,
            updatedAt: Date.now(),
          })),
        );
        useKeyboardStore.getState().showForInput();
        set({ cycling: { nodeId: null, state: resetCycling() } });
        return chain.id;
      },

      deleteChain: (chainId) => {
        set((state) =>
          patchActive(state, (s) => {
            if (s.chains.length <= 1) {
              // Replace the single chain with a fresh blank one rather than
              // leaving the session chain-less.
              const fresh = makeBlankChain();
              return {
                ...s,
                chains: [fresh],
                activeChainId: fresh.id,
                activeNodeId: fresh.tree.children[0].id,
                updatedAt: Date.now(),
              };
            }
            const idx = s.chains.findIndex((c) => c.id === chainId);
            if (idx < 0) return s;
            const nextChains = s.chains.filter((c) => c.id !== chainId);
            const nextChain = nextChains[Math.max(0, idx - 1)] ?? nextChains[0];
            const nextNodeId =
              nextChain.tree.children[0]?.id ?? nextChain.tree.id;
            return {
              ...s,
              chains: nextChains,
              activeChainId: nextChain.id,
              activeNodeId: nextNodeId,
              updatedAt: Date.now(),
            };
          }),
        );
        set({ cycling: { nodeId: null, state: resetCycling() } });
      },

      setActiveChain: (chainId) => {
        set((state) =>
          patchActive(state, (s) => {
            const chain = s.chains.find((c) => c.id === chainId);
            if (!chain) return s;
            const inChain = findNode(chain.tree, s.activeNodeId);
            const nextNodeId = inChain
              ? s.activeNodeId
              : chain.tree.children[0]?.id ?? chain.tree.id;
            return {
              ...s,
              chains: s.chains.map((c) =>
                c.id === chainId
                  ? {
                      ...c,
                      isExpanded: true,
                      tree: ensureExpandedToNode(c.tree, nextNodeId),
                    }
                  : c,
              ),
              activeChainId: chainId,
              activeNodeId: nextNodeId,
              updatedAt: Date.now(),
            };
          }),
        );
        useKeyboardStore.getState().showForInput();
        set({ cycling: { nodeId: null, state: resetCycling() } });
      },

      setChainName: (chainId, name) => {
        set((state) =>
          patchActive(state, (s) =>
            patchChainInSession(s, chainId, (c) => ({ ...c, name })),
          ),
        );
      },
      setChainPriority: (chainId, priority) => {
        set((state) =>
          patchActive(state, (s) =>
            patchChainInSession(s, chainId, (c) => ({ ...c, priority })),
          ),
        );
      },
      setChainColor: (chainId, color) => {
        set((state) =>
          patchActive(state, (s) =>
            patchChainInSession(s, chainId, (c) => ({ ...c, color })),
          ),
        );
      },
      toggleChainExpand: (chainId) => {
        set((state) =>
          patchActive(state, (s) =>
            patchChainInSession(s, chainId, (c) => ({
              ...c,
              isExpanded: !c.isExpanded,
            })),
          ),
        );
      },
      collapseAllChains: () => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            chains: s.chains.map((c) => ({ ...c, isExpanded: false })),
            updatedAt: Date.now(),
          })),
        );
      },

      setActiveNode: (id) => {
        set((state) =>
          patchActive(state, (s) => {
            const chain = findChainContaining(s, id);
            if (!chain) return s;
            return {
              ...s,
              chains: s.chains.map((c) =>
                c.id === chain.id
                  ? {
                      ...c,
                      isExpanded: true,
                      tree: ensureExpandedToNode(c.tree, id),
                    }
                  : c,
              ),
              activeChainId: chain.id,
              activeNodeId: id,
              updatedAt: Date.now(),
            };
          }),
        );
        useKeyboardStore.getState().showForInput();
        set({ cycling: { nodeId: null, state: resetCycling() } });
      },

      setNodeMoves: (id, moves) => {
        set((state) =>
          patchActive(state, (s) =>
            patchNodeChain(s, id, (t) => updateNodeOp(t, id, { moves })),
          ),
        );
      },
      setNodeLabel: (id, label) => {
        set((state) =>
          patchActive(state, (s) =>
            patchNodeChain(s, id, (t) => updateNodeOp(t, id, { label })),
          ),
        );
      },
      setNodeAnnotation: (id, annotation) => {
        set((state) =>
          patchActive(state, (s) =>
            patchNodeChain(s, id, (t) => updateNodeOp(t, id, { annotation })),
          ),
        );
      },
      toggleBracket: (id) => {
        set((state) =>
          patchActive(state, (s) => {
            const chain = findChainContaining(s, id);
            if (!chain) return s;
            const node = findNode(chain.tree, id);
            if (!node) return s;
            const m = node.moves.trim();
            if (m && !hasInlineBrackets(m)) {
              if (node.bracketed) {
                return patchChainInSession(s, chain.id, (c) => ({
                  ...c,
                  tree: updateNodeOp(c.tree, id, { bracketed: false }),
                }));
              }
              return patchChainInSession(s, chain.id, (c) => ({
                ...c,
                tree: updateNodeOp(c.tree, id, {
                  moves: `(${m})`,
                  bracketed: false,
                }),
              }));
            }
            return patchChainInSession(s, chain.id, (c) => ({
              ...c,
              tree: updateNodeOp(c.tree, id, { bracketed: !node.bracketed }),
            }));
          }),
        );
      },
      setNodeColor: (id, color) => {
        set((state) =>
          patchActive(state, (s) =>
            patchNodeChain(s, id, (t) => updateNodeOp(t, id, { color })),
          ),
        );
      },
      toggleExpand: (id) => {
        set((state) =>
          patchActive(state, (s) =>
            patchNodeChain(s, id, (t) => toggleExpandOp(t, id)),
          ),
        );
      },

      addChildNode: (parentId) => {
        const state = get();
        const session = state.sessions.find((x) => x.id === state.activeSessionId);
        if (!session) return null;
        const chain = findChainContaining(session, parentId);
        if (!chain) return null;
        const parent = findNode(chain.tree, parentId);
        if (!parent) return null;
        const { root, node } = addChildOp(chain.tree, parentId);
        set((s) =>
          patchActive(s, (sess) => ({
            ...patchChainInSession(sess, chain.id, (c) => ({ ...c, tree: root })),
            activeChainId: chain.id,
            activeNodeId: node.id,
          })),
        );
        useKeyboardStore.getState().showForInput();
        set({ cycling: { nodeId: null, state: resetCycling() } });
        return node.id;
      },

      addSiblingNode: (siblingId) => {
        const state = get();
        const session = state.sessions.find((x) => x.id === state.activeSessionId);
        if (!session) return null;
        const chain = findChainContaining(session, siblingId);
        if (!chain) return null;
        const { root, node } = addSiblingOp(chain.tree, siblingId);
        set((s) =>
          patchActive(s, (sess) => ({
            ...patchChainInSession(sess, chain.id, (c) => ({ ...c, tree: root })),
            activeChainId: chain.id,
            activeNodeId: node.id,
          })),
        );
        useKeyboardStore.getState().showForInput();
        set({ cycling: { nodeId: null, state: resetCycling() } });
        return node.id;
      },

      addShadowNode: (sourceId) => {
        const state = get();
        const session = state.sessions.find((x) => x.id === state.activeSessionId);
        if (!session) return null;
        const chain = findChainContaining(session, sourceId);
        if (!chain) return null;
        const source = findNode(chain.tree, sourceId);
        if (!source) return null;
        const shadow = buildShadowNode(source);
        const { root } = addSiblingOp(chain.tree, sourceId, shadow);
        set((s) =>
          patchActive(s, (sess) => ({
            ...patchChainInSession(sess, chain.id, (c) => ({ ...c, tree: root })),
            activeChainId: chain.id,
            activeNodeId: shadow.id,
          })),
        );
        useKeyboardStore.getState().showForInput();
        set({ cycling: { nodeId: null, state: resetCycling() } });
        return shadow.id;
      },

      deleteNode: (id) => {
        const state = get();
        const session = state.sessions.find((x) => x.id === state.activeSessionId);
        if (!session) return;
        const chain = findChainContaining(session, id);
        if (!chain) return;
        if (id === chain.tree.id) return;
        // If this is the only top-level child of the only chain and it has no
        // descendants, reset its fields instead of removing it entirely (so the
        // chain always has at least one editable node).
        if (
          chain.tree.children.length === 1 &&
          chain.tree.children[0].id === id &&
          chain.tree.children[0].children.length === 0
        ) {
          set((s) =>
            patchActive(s, (sess) =>
              patchChainInSession(sess, chain.id, (c) => ({
                ...c,
                tree: updateNodeOp(c.tree, id, {
                  moves: '',
                  label: '',
                  annotation: '',
                  bracketed: false,
                  color: 'none',
                }),
              })),
            ),
          );
          return;
        }
        const { root, nextActiveId } = removeNodeOp(chain.tree, id);
        set((s) =>
          patchActive(s, (sess) =>
            patchChainInSession(sess, chain.id, (c) => ({
              ...c,
              tree: root,
            })),
          ),
        );
        // Update active node to nextActiveId only if we deleted within active chain.
        const newActive =
          nextActiveId === chain.tree.id
            ? root.children[0]?.id ?? root.id
            : nextActiveId;
        set((s) =>
          patchActive(s, (sess) => ({
            ...sess,
            activeChainId: chain.id,
            activeNodeId: newActive,
            updatedAt: Date.now(),
          })),
        );
        set({ cycling: { nodeId: null, state: resetCycling() } });
      },

      appendKey: (action) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === state.activeSessionId);
        if (!session) return;
        const nodeId = session.activeNodeId;
        const chain = findChainContaining(session, nodeId);
        if (!chain) return;
        const node = findNode(chain.tree, nodeId);
        if (!node) return;

        if (action === 'backspace') {
          state.setNodeMoves(nodeId, backspaceMoves(node.moves));
          set({ cycling: { nodeId: null, state: resetCycling() } });
          return;
        }
        if (action === '(' || action === ')') {
          const trimmed = node.moves.trimEnd();
          const paren = action;
          const next =
            trimmed.length === 0
              ? paren
              : paren === '('
                ? `${trimmed} (`
                : `${trimmed})`;
          state.setNodeMoves(nodeId, next);
          set({ cycling: { nodeId: null, state: resetCycling() } });
          return;
        }
        if (action === '#insert' || action === '#') {
          if (chain.insertions.length === 0) {
            const ph = '#';
            state.insertPlaceholder(nodeId, ph);
            state.addInsertion(chain.id, { placeholder: ph });
          } else {
            useUIStore.getState().openInsertionPicker({
              nodeId,
              chainId: chain.id,
            });
          }
          set({ cycling: { nodeId: null, state: resetCycling() } });
          return;
        }
        if (action === '2' || action === "'" || action === 'w') {
          state.setNodeMoves(nodeId, applyModifierToLastToken(node.moves, action));
          set({ cycling: { nodeId: null, state: resetCycling() } });
          return;
        }

        const cycling =
          state.cycling.nodeId === nodeId ? state.cycling.state : resetCycling();
        const { result, newState } = resolveCycling(action, cycling, node.moves);
        let nextMoves: string;
        if (result.type === 'append') {
          nextMoves = applyAppend(node.moves, result.action);
        } else if (result.type === 'replace') {
          nextMoves = applyReplace(node.moves, result.fromIndex, result.action);
        } else {
          nextMoves = applyClear(node.moves, result.fromIndex);
        }
        state.setNodeMoves(nodeId, nextMoves);
        set({ cycling: { nodeId, state: newState } });
      },

      insertPlaceholder: (nodeId, placeholder) => {
        const state = get();
        const session = state.sessions.find((s) => s.id === state.activeSessionId);
        if (!session) return;
        const chain = findChainContaining(session, nodeId);
        if (!chain) return;
        const node = findNode(chain.tree, nodeId);
        if (!node) return;
        const ph = placeholder || '#';
        const next = node.moves.trim()
          ? `${node.moves.trimEnd()} ${ph}`
          : ph;
        state.setNodeMoves(nodeId, next);
        set({ cycling: { nodeId: null, state: resetCycling() } });
      },

      addInsertion: (chainId, partial) => {
        const state = get();
        const session = state.sessions.find((x) => x.id === state.activeSessionId);
        const chain = session?.chains.find((c) => c.id === chainId);
        const placeholder =
          partial?.placeholder ??
          nextAvailablePlaceholder(chain?.insertions ?? []);
        const ins = createInsertion({ ...partial, placeholder });
        set((s) =>
          patchActive(s, (sess) =>
            patchChainInSession(sess, chainId, (c) => ({
              ...c,
              insertions: [...c.insertions, ins],
            })),
          ),
        );
        return ins.id;
      },
      removeInsertion: (chainId, insertionId) => {
        set((state) =>
          patchActive(state, (s) =>
            patchChainInSession(s, chainId, (c) => ({
              ...c,
              insertions: c.insertions.filter((i) => i.id !== insertionId),
            })),
          ),
        );
      },
      updateInsertion: (chainId, insertionId, patch) => {
        set((state) =>
          patchActive(state, (s) =>
            patchChainInSession(s, chainId, (c) => {
              const target = c.insertions.find((i) => i.id === insertionId);
              if (!target) return c;

              let tree = c.tree;
              const merged = { ...target, ...patch };

              if (patch.placeholder !== undefined) {
                const newPh = sanitizePlaceholder(patch.placeholder);
                if (isPlaceholderTaken(c.insertions, newPh, insertionId)) {
                  return c;
                }
                merged.placeholder = newPh;
                const oldPh = target.placeholder;
                if (oldPh !== newPh && oldPh) {
                  tree = mapTree(tree, (node) => ({
                    ...node,
                    moves: node.moves.split(oldPh).join(newPh),
                  }));
                }
              }

              return {
                ...c,
                tree,
                insertions: c.insertions.map((i) =>
                  i.id === insertionId ? merged : i,
                ),
              };
            }),
          ),
        );
      },

      setArrangement: (text) => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            arrangementBoard: text,
            updatedAt: Date.now(),
          })),
        );
      },

      startTimer: () => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            timer: {
              ...s.timer,
              startedAt: Date.now(),
              isRunning: true,
            },
            updatedAt: Date.now(),
          })),
        );
      },
      pauseTimer: () => {
        set((state) =>
          patchActive(state, (s) => {
            if (!s.timer.isRunning || s.timer.startedAt === null) return s;
            const delta = (Date.now() - s.timer.startedAt) / 1000;
            return {
              ...s,
              timer: {
                ...s.timer,
                isRunning: false,
                startedAt: null,
                elapsedAtPause: s.timer.elapsedAtPause + delta,
              },
              updatedAt: Date.now(),
            };
          }),
        );
      },
      resetTimer: () => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            timer: {
              ...s.timer,
              startedAt: null,
              elapsedAtPause: 0,
              isRunning: false,
            },
            updatedAt: Date.now(),
          })),
        );
      },
      setTimerMode: (mode) => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            timer: { ...s.timer, mode },
            updatedAt: Date.now(),
          })),
        );
      },
      setTimerInitial: (seconds) => {
        set((state) =>
          patchActive(state, (s) => ({
            ...s,
            timer: { ...s.timer, initialSeconds: Math.max(1, Math.floor(seconds)) },
            updatedAt: Date.now(),
          })),
        );
      },

      importSession: (payload) => {
        const data: ExportedSession =
          typeof payload === 'string' ? JSON.parse(payload) : payload;
        if (!data || (data.version !== 1 && data.version !== 2) || !data.session) {
          throw new Error('文件格式无效或版本不匹配');
        }
        const migrated = migrateLegacySession(data.session as LegacyV1Session);
        const incoming: SolveSession = {
          ...migrated,
          id: nanoid(8),
          updatedAt: Date.now(),
          timer: {
            ...migrated.timer,
            isRunning: false,
            startedAt: null,
          },
        };
        set((state) => ({
          sessions: trimToCap([...state.sessions, incoming]),
          activeSessionId: incoming.id,
          cycling: { nodeId: null, state: resetCycling() },
        }));
        return incoming.id;
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
      migrate: (persisted: unknown, version: number) => {
        const obj = persisted as { sessions?: LegacyV1Session[]; activeSessionId?: string };
        if (!obj || !Array.isArray(obj.sessions)) {
          return { sessions: [], activeSessionId: '' };
        }
        if (version < STORAGE_VERSION) {
          obj.sessions = obj.sessions.map((s) => migrateLegacySession(s));
        }
        return { sessions: obj.sessions, activeSessionId: obj.activeSessionId ?? '' };
      },
    },
  ),
);

export function selectActiveSession(state: SessionState): SolveSession | undefined {
  return state.sessions.find((s) => s.id === state.activeSessionId);
}

export function selectActiveChain(state: SessionState): SolutionChain | undefined {
  const session = selectActiveSession(state);
  return session?.chains.find((c) => c.id === session.activeChainId);
}
