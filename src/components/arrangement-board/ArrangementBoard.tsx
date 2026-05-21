import { useMemo, useState } from 'react';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import {
  compileBranch,
  findNode,
  formatCompiledNodeLine,
  getAllLeafPaths,
  getPath,
  leafFromNode,
} from '@/core/solution';
import type { Insertion, Priority, SolutionNode } from '@/core/solution';
import type { SolutionChain } from '@/types';

const PRIORITY_RANK: Record<Priority, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
};

function nodesToLines(nodes: SolutionNode[], insertions: Insertion[]): string {
  const compiled = compileBranch(nodes, insertions);
  const lines = compiled.nodes.map((n) => formatCompiledNodeLine(n));
  lines.push('');
  lines.push(`${compiled.text}  (${compiled.moveCount})`);
  return lines.join('\n');
}

function maxPathPriority(path: SolutionNode[]): Priority {
  let best: Priority = 'none';
  for (const node of path) {
    if (PRIORITY_RANK[node.priority] > PRIORITY_RANK[best]) {
      best = node.priority;
    }
  }
  return best;
}

function branchLabel(entry: BranchEntry): string {
  const chainName = entry.chain.name || `解法 ${entry.chainIndex + 1}`;
  const steps = entry.path
    .map((n) => n.label || n.moves || '?')
    .join(' › ');
  return `${chainName} · 分支 ${entry.branchIndex + 1}${steps ? ` (${steps})` : ''}`;
}

interface BranchEntry {
  chain: SolutionChain;
  chainIndex: number;
  path: SolutionNode[];
  branchIndex: number;
  chainPriority: Priority;
  pathPriority: Priority;
}

export function ArrangementBoard() {
  const session = useSessionStore(selectActiveSession);
  const setArrangement = useSessionStore((s) => s.setArrangement);
  const [filter, setFilter] = useState('');
  const [selectedKey, setSelectedKey] = useState('');

  const allBranches = useMemo<BranchEntry[]>(() => {
    if (!session) return [];
    const out: BranchEntry[] = [];
    session.chains.forEach((chain, chainIndex) => {
      getAllLeafPaths(chain.tree).forEach((path, branchIndex) => {
        out.push({
          chain,
          chainIndex,
          path,
          branchIndex,
          chainPriority: chain.priority,
          pathPriority: maxPathPriority(path),
        });
      });
    });
    return out.sort((a, b) => {
      const chainDiff =
        PRIORITY_RANK[b.chainPriority] - PRIORITY_RANK[a.chainPriority];
      if (chainDiff !== 0) return chainDiff;
      const pathDiff =
        PRIORITY_RANK[b.pathPriority] - PRIORITY_RANK[a.pathPriority];
      if (pathDiff !== 0) return pathDiff;
      if (a.chainIndex !== b.chainIndex) return a.chainIndex - b.chainIndex;
      return a.branchIndex - b.branchIndex;
    });
  }, [session]);

  const filteredBranches = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allBranches;
    return allBranches.filter((entry) =>
      branchLabel(entry).toLowerCase().includes(q),
    );
  }, [allBranches, filter]);

  if (!session) return null;

  const activeChain = session.chains.find((c) => c.id === session.activeChainId);

  const pullActive = () => {
    if (!activeChain) return;
    const active = findNode(activeChain.tree, session.activeNodeId);
    if (!active) return;
    const path = getPath(activeChain.tree, session.activeNodeId) ?? [];
    const leaf = leafFromNode(active, session.activeNodeId);
    const descend = getPath(active, leaf.id) ?? [];
    const branch = path
      .filter((n) => n.id !== activeChain.tree.id)
      .concat(descend.slice(1));
    setArrangement(nodesToLines(branch, activeChain.insertions));
  };

  const pullBranch = (entry: BranchEntry) => {
    setArrangement(nodesToLines(entry.path, entry.chain.insertions));
  };

  const handleSelectBranch = (key: string) => {
    setSelectedKey(key);
    const entry = filteredBranches.find(
      (e) => `${e.chain.id}-${e.path[e.path.length - 1].id}-${e.branchIndex}` === key,
    );
    if (entry) pullBranch(entry);
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-xs text-slate-500">
        手动整理板。可自由编辑文字，或从下方选择分支一键导入（按优先级排序）。
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-primary text-xs"
          onClick={pullActive}
          disabled={!activeChain}
        >
          推送当前分支
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center">
          <input
            type="search"
            className="input text-xs sm:max-w-36"
            placeholder="过滤分支…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            aria-label="过滤分支"
          />
          <select
            className="input min-w-0 flex-1 text-xs"
            value={selectedKey}
            onChange={(e) => handleSelectBranch(e.target.value)}
            aria-label="选择分支导入"
          >
            <option value="">选择分支导入…</option>
            {filteredBranches.map((entry) => {
              const last = entry.path[entry.path.length - 1];
              const key = `${entry.chain.id}-${last.id}-${entry.branchIndex}`;
              return (
                <option key={key} value={key}>
                  {branchLabel(entry)}
                </option>
              );
            })}
          </select>
        </div>
      </div>
      {filter && filteredBranches.length === 0 && (
        <p className="text-xs text-slate-400">没有匹配的分支</p>
      )}
      <textarea
        className="textarea h-full flex-1 font-mono text-sm"
        value={session.arrangementBoard}
        onChange={(e) => setArrangement(e.target.value)}
        placeholder="(B2 U F' L)//EO&#10;(F D' U2 F B R2 F2 U)//DR&#10;F R2 F D2 R2 F U2 F' //HTR&#10;..."
      />
    </div>
  );
}
