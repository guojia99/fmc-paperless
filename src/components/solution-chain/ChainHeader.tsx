import { useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { cn } from '@/lib/cn';
import type { NodeColor, Priority } from '@/core/solution';
import type { SolutionChain } from '@/types';
import {
  IconChevronDown,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconFlag,
  IconPalette,
  IconTrash,
} from '@/components/common/Icons';

interface ChainHeaderProps {
  chain: SolutionChain;
  isActive: boolean;
  index: number;
  totalChains: number;
  showCompiled: boolean;
  onToggleCompiled: () => void;
  onActivate: () => void;
}

const PRIORITIES: Priority[] = ['none', 'low', 'medium', 'high'];
const PRIORITY_LABEL: Record<Priority, string> = {
  none: '无',
  low: '低',
  medium: '中',
  high: '高',
};
const PRIORITY_DOT: Record<Priority, string> = {
  none: 'bg-slate-300',
  low: 'bg-sky-400',
  medium: 'bg-amber-400',
  high: 'bg-orange-500',
};

const COLORS: NodeColor[] = ['none', 'sky', 'mint', 'lemon', 'rose', 'lilac'];
const COLOR_BTN: Record<NodeColor, string> = {
  none: 'bg-white border-slate-200',
  sky: 'bg-sky-200 border-sky-300',
  mint: 'bg-emerald-200 border-emerald-300',
  lemon: 'bg-amber-200 border-amber-300',
  rose: 'bg-rose-200 border-rose-300',
  lilac: 'bg-violet-200 border-violet-300',
};

export function ChainHeader({
  chain,
  isActive,
  index,
  totalChains,
  showCompiled,
  onToggleCompiled,
  onActivate,
}: ChainHeaderProps) {
  const setChainName = useSessionStore((s) => s.setChainName);
  const setChainPriority = useSessionStore((s) => s.setChainPriority);
  const setChainColor = useSessionStore((s) => s.setChainColor);
  const toggleChainExpand = useSessionStore((s) => s.toggleChainExpand);
  const deleteChain = useSessionStore((s) => s.deleteChain);
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(chain.name);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={() => toggleChainExpand(chain.id)}
        aria-label={chain.isExpanded ? '折叠' : '展开'}
      >
        {chain.isExpanded ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
      </button>

      <div
        data-chain-header
        role="button"
        tabIndex={0}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-primary-50/80"
        onClick={onActivate}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onActivate();
          }
        }}
        title="选中并展开该解法"
      >
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold',
            isActive ? 'bg-primary-500 text-white' : 'bg-primary-100 text-primary-700',
          )}
        >
          #{index + 1}
        </span>
        <span className={cn('h-2 w-2 shrink-0 rounded-full', PRIORITY_DOT[chain.priority])} />

        {editingName ? (
          <input
            autoFocus
            className="input max-w-44 py-0.5 text-sm"
            value={draftName}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={() => {
              setChainName(chain.id, draftName.trim());
              setEditingName(false);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                setChainName(chain.id, draftName.trim());
                setEditingName(false);
              }
              if (e.key === 'Escape') {
                setDraftName(chain.name);
                setEditingName(false);
              }
            }}
          />
        ) : (
          <button
            type="button"
            className="rounded-md px-2 py-0.5 text-sm font-semibold text-slate-800 hover:bg-white/60"
            onClick={(e) => {
              e.stopPropagation();
              setDraftName(chain.name);
              setEditingName(true);
            }}
            title="点击命名该解法链"
          >
            {chain.name || (
              <span className="italic text-slate-400">解法 {index + 1}</span>
            )}
          </button>
        )}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1">
        <button
          type="button"
          className={cn('btn btn-ghost text-xs', showCompiled && 'btn-primary')}
          onClick={onToggleCompiled}
          title={showCompiled ? '隐藏编译结果' : '查看编译结果'}
        >
          {showCompiled ? <IconEyeOff size={12} /> : <IconEye size={12} />}
          <span className="hidden sm:inline">编译</span>
        </button>

        <details className="relative">
          <summary className="btn text-xs">
            <IconFlag size={12} className={cn(
              chain.priority === 'high' ? 'text-orange-600' :
              chain.priority === 'medium' ? 'text-amber-600' :
              chain.priority === 'low' ? 'text-sky-600' : 'text-slate-400'
            )} />
            <span>{PRIORITY_LABEL[chain.priority]}</span>
          </summary>
          <div className="absolute right-0 z-20 mt-1 flex gap-1 rounded-lg border border-primary-100 bg-white p-1 shadow-lg">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                className={cn(
                  'btn btn-ghost text-xs',
                  chain.priority === p && 'btn-primary',
                )}
                onClick={(e) => {
                  setChainPriority(chain.id, p);
                  (e.target as HTMLElement).closest('details')?.removeAttribute('open');
                }}
              >
                <span className={cn('h-2 w-2 rounded-full', PRIORITY_DOT[p])} />
                {PRIORITY_LABEL[p]}
              </button>
            ))}
          </div>
        </details>

        <details className="relative">
          <summary className="btn btn-ghost btn-icon">
            <IconPalette size={14} />
          </summary>
          <div className="absolute right-0 z-20 mt-1 flex gap-1 rounded-lg border border-primary-100 bg-white p-1 shadow-lg">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  'h-6 w-6 rounded-md border',
                  COLOR_BTN[c],
                  chain.color === c && 'ring-2 ring-primary-400',
                )}
                aria-label={`color ${c}`}
                onClick={(e) => {
                  setChainColor(chain.id, c);
                  (e.target as HTMLElement).closest('details')?.removeAttribute('open');
                }}
              />
            ))}
          </div>
        </details>

        <button
          type="button"
          className="btn btn-danger btn-icon"
          onClick={() => deleteChain(chain.id)}
          title={totalChains <= 1 ? '清空当前解法' : '删除该解法'}
          aria-label="删除解法"
        >
          <IconTrash size={14} />
        </button>
      </div>
    </div>
  );
}
