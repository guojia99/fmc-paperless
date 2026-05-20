import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import {
  compileBranch,
  cumulativeCountsForPath,
  findNode,
  formatFirstNodePreview,
  getPath,
  leafFromNode,
  stepCount,
} from '@/core/solution';
import type { SolutionNode } from '@/core/solution';
import type { SolutionChain } from '@/types';
import { useSessionStore } from '@/store/sessionStore';
import { TreeNodeRow } from './TreeNode';
import { BranchFooter } from './BranchFooter';
import { ChainHeader } from './ChainHeader';
import { ChainInsertions } from './ChainInsertions';

interface ChainViewProps {
  chain: SolutionChain;
  isActive: boolean;
  activeNodeId: string;
  index: number;
  totalChains: number;
}

export function ChainView({
  chain,
  isActive,
  activeNodeId,
  index,
  totalChains,
}: ChainViewProps) {
  const rootRef = useRef<HTMLElement>(null);
  const setActiveChain = useSessionStore((s) => s.setActiveChain);
  const [showCompiled, setShowCompiled] = useState(false);

  // When this chain becomes the active one, scroll it to the top of the
  // scrollable list so the user can immediately work on it.
  useEffect(() => {
    if (!isActive || !rootRef.current) return;
    rootRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [isActive]);

  const branch = useMemo(() => {
    const containsActive = !!findNode(chain.tree, activeNodeId);
    const startId = containsActive
      ? activeNodeId
      : chain.tree.children[0]?.id ?? chain.tree.id;
    const headPath = getPath(chain.tree, startId) ?? [];
    const headNodes = headPath.filter((n) => n.id !== chain.tree.id);
    const head = headNodes[headNodes.length - 1];
    if (!head) {
      return { branchNodes: [] as SolutionNode[], activeIds: new Set<string>() };
    }
    const leaf = leafFromNode(head, startId);
    const tailPath = head.id === leaf.id
      ? []
      : (getPath(head, leaf.id) ?? []).slice(1);
    const branchNodes = [...headNodes, ...tailPath];
    return {
      branchNodes,
      activeIds: new Set(branchNodes.map((n) => n.id)),
    };
  }, [chain.tree, activeNodeId]);

  const compiled = useMemo(
    () => compileBranch(branch.branchNodes, chain.insertions),
    [branch.branchNodes, chain.insertions],
  );

  const cumulative = useMemo(() => {
    if (branch.branchNodes.length === 0) return new Map<string, number>();
    return cumulativeCountsForPath(
      chain.tree,
      branch.branchNodes[branch.branchNodes.length - 1].id,
    );
  }, [chain.tree, branch.branchNodes]);

  const colorClass =
    chain.color !== 'none'
      ? `chain-color-${chain.color}`
      : `chain-priority-${chain.priority}`;

  const showInsertions = chain.insertions.length > 0;
  const collapsedPreview = useMemo(
    () => formatFirstNodePreview(chain.tree),
    [chain.tree],
  );

  return (
    <section
      ref={rootRef}
      className={cn(
        'mb-3 rounded-2xl border-2 p-3 shadow-sm transition-colors',
        colorClass,
        isActive ? 'ring-2 ring-primary-400' : 'opacity-95',
      )}
    >
      <ChainHeader
        chain={chain}
        isActive={isActive}
        index={index}
        totalChains={totalChains}
        showCompiled={showCompiled}
        onToggleCompiled={() => setShowCompiled((v) => !v)}
        onActivate={() => setActiveChain(chain.id)}
      />

      {!chain.isExpanded && (
        <p
          className="mt-2 break-all rounded-lg border border-primary-100 bg-white/70 px-2 py-1.5 font-mono text-sm text-slate-700"
          title="首步预览"
        >
          {collapsedPreview ?? (
            <span className="italic text-slate-400">尚无步骤</span>
          )}
        </p>
      )}

      {chain.isExpanded && (
        <div className="mt-3">
          <NodesView
            nodes={chain.tree.children}
            activeId={activeNodeId}
            activePathIds={branch.activeIds}
            cumulative={cumulative}
            isOnlyTopLevel={
              chain.tree.children.length === 1 &&
              chain.tree.children[0].children.length === 0
            }
            isChainActive={isActive}
          />

          {showInsertions && (
            <div className="mt-3">
              <ChainInsertions
                chainId={chain.id}
                insertions={chain.insertions}
              />
            </div>
          )}

          {showCompiled && <BranchFooter compiled={compiled} />}
        </div>
      )}
    </section>
  );
}

interface NodesViewProps {
  nodes: SolutionNode[];
  activeId: string;
  activePathIds: Set<string>;
  cumulative: Map<string, number>;
  isOnlyTopLevel: boolean;
  isChainActive: boolean;
}

function NodesView({
  nodes,
  activeId,
  activePathIds,
  cumulative,
  isOnlyTopLevel,
  isChainActive,
}: NodesViewProps) {
  if (nodes.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {nodes.map((node) => (
        <li key={node.id}>
          <TreeNodeRow
            node={node}
            isActive={node.id === activeId}
            isOnActivePath={activePathIds.has(node.id)}
            isChainActive={isChainActive}
            stepCount={stepCount(node)}
            cumulativeCount={cumulative.get(node.id) ?? 0}
            isOnlyTopLevel={isOnlyTopLevel}
          />
          {node.children.length > 0 && node.isExpanded && (
            <div
              className={cn(
                'ml-3 mt-2 border-l-2 pl-3',
                activePathIds.has(node.id)
                  ? 'border-primary-300'
                  : 'border-slate-200',
              )}
            >
              <NodesView
                nodes={node.children}
                activeId={activeId}
                activePathIds={activePathIds}
                cumulative={cumulative}
                isOnlyTopLevel={false}
                isChainActive={isChainActive}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
