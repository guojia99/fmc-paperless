import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { ChevronsUp } from 'lucide-react';
import { IconPlus } from '@/components/common/Icons';
import { ChainView } from './ChainView';

export function ChainList() {
  const session = useSessionStore(selectActiveSession);
  const newChain = useSessionStore((s) => s.newChain);
  const collapseAllChains = useSessionStore((s) => s.collapseAllChains);
  const toggleDrawer = useUIStore((s) => s.toggleDrawer);

  if (!session) return null;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-primary-100 px-3 py-2">
        <h1 className="text-sm font-semibold text-primary-700">
          最少步链
          <span className="ml-2 text-xs font-normal text-slate-500">
            共 {session.chains.length} 条
          </span>
        </h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn text-xs"
            onClick={() => collapseAllChains()}
            disabled={session.chains.every((c) => !c.isExpanded)}
            title="收起全部解法链"
          >
            <ChevronsUp size={14} /> 全部收起
          </button>
          <button
            type="button"
            className="btn text-xs"
            onClick={() => newChain()}
            title="新建一条解法链"
          >
            <IconPlus size={14} /> 新解法
          </button>
          <button
            type="button"
            className="btn text-xs"
            onClick={() => toggleDrawer('arrangement')}
            title="手动整理板"
          >
            整理板
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {session.chains.map((chain, index) => (
          <ChainView
            key={chain.id}
            chain={chain}
            isActive={chain.id === session.activeChainId}
            activeNodeId={session.activeNodeId}
            index={index}
            totalChains={session.chains.length}
          />
        ))}

        <div className="mt-2 flex justify-center">
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => newChain()}
          >
            <IconPlus size={14} /> 添加一条新解法链
          </button>
        </div>
      </div>
    </div>
  );
}
