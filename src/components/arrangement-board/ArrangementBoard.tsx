import { useMemo } from 'react';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import {
  compileBranch,
  findNode,
  formatCompiledNodeLine,
  getAllLeafPaths,
  getPath,
  leafFromNode,
} from '@/core/solution';
import type { Insertion, SolutionNode } from '@/core/solution';
import type { SolutionChain } from '@/types';

function nodesToLines(nodes: SolutionNode[], insertions: Insertion[]): string {
  const compiled = compileBranch(nodes, insertions);
  const lines = compiled.nodes.map((n) => formatCompiledNodeLine(n));
  lines.push('');
  lines.push(`${compiled.text}  (${compiled.moveCount})`);
  return lines.join('\n');
}

interface BranchEntry {
  chain: SolutionChain;
  chainIndex: number;
  path: SolutionNode[];
  branchIndex: number;
}

export function ArrangementBoard() {
  const session = useSessionStore(selectActiveSession);
  const setArrangement = useSessionStore((s) => s.setArrangement);

  const allBranches = useMemo<BranchEntry[]>(() => {
    if (!session) return [];
    const out: BranchEntry[] = [];
    session.chains.forEach((chain, chainIndex) => {
      getAllLeafPaths(chain.tree).forEach((path, branchIndex) => {
        out.push({ chain, chainIndex, path, branchIndex });
      });
    });
    return out;
  }, [session]);

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

  const pullBranchAt = (entry: BranchEntry) => {
    setArrangement(nodesToLines(entry.path, entry.chain.insertions));
  };

  return (
    <div className="flex h-full flex-col gap-2">
      <p className="text-xs text-slate-500">
        手动整理板。可自由编辑文字，或从下方按钮一键导入某条分支的全部内容。
      </p>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          className="btn btn-primary text-xs"
          onClick={pullActive}
          disabled={!activeChain}
        >
          推送当前分支
        </button>
        {allBranches.map((entry) => {
          const last = entry.path[entry.path.length - 1];
          return (
            <button
              key={`${entry.chain.id}-${last.id}-${entry.branchIndex}`}
              type="button"
              className="btn text-xs"
              onClick={() => pullBranchAt(entry)}
              title={entry.path.map((n) => n.label || n.moves || '?').join(' › ')}
            >
              解法{entry.chainIndex + 1}·分支{entry.branchIndex + 1}
            </button>
          );
        })}
      </div>
      <textarea
        className="textarea h-full flex-1 font-mono text-sm"
        value={session.arrangementBoard}
        onChange={(e) => setArrangement(e.target.value)}
        placeholder="(B2 U F' L)//EO&#10;(F D' U2 F B R2 F2 U)//DR&#10;F R2 F D2 R2 F U2 F' //HTR&#10;..."
      />
    </div>
  );
}
