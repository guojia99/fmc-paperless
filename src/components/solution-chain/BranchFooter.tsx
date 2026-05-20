import type { CompiledResult } from '@/core/solution';
import { useSessionStore, selectActiveSession } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/cn';
import { IconCopy } from '@/components/common/Icons';

interface BranchFooterProps {
  compiled: CompiledResult;
}

export function BranchFooter({ compiled }: BranchFooterProps) {
  const setArrangement = useSessionStore((s) => s.setArrangement);
  const session = useSessionStore(selectActiveSession);
  const openDrawer = useUIStore((s) => s.openDrawer);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(compiled.text);
    } catch {
      /* ignore */
    }
  };

  const handlePullToBoard = () => {
    if (!session) return;
    const lines = compiled.nodes.map((n) => {
      const moves = n.bracketed ? `(${n.moves})` : n.moves;
      const label = n.label ? ` // ${n.label}` : '';
      return `${moves}${label}  ${n.stepCount}/${n.cumulativeCount}`;
    });
    const finalLine = `\n${compiled.text}  (${compiled.moveCount})`;
    setArrangement([...lines, finalLine].join('\n'));
    openDrawer('arrangement');
  };

  return (
    <div className="mt-3 rounded-xl border border-primary-200 bg-primary-50/60 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary-700">
          编译结果
        </span>
        <span
          className={cn(
            'rounded-md bg-primary-500 px-2 py-0.5 font-mono text-xs font-bold text-white',
          )}
          title="移动数 (消步后)"
        >
          {compiled.moveCount} moves
        </span>
      </div>
      {compiled.error ? (
        <div className="rounded-md bg-rose-50 px-2 py-1 text-xs text-rose-700">
          {compiled.error}
        </div>
      ) : (
        <code className="block break-all font-mono text-sm text-slate-800">
          {compiled.text || (
            <span className="italic text-slate-400">尚无内容</span>
          )}
        </code>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost text-xs"
          onClick={handleCopy}
          disabled={!compiled.text}
        >
          <IconCopy size={12} /> 复制
        </button>
        <button
          type="button"
          className="btn btn-ghost text-xs"
          onClick={handlePullToBoard}
          disabled={compiled.nodes.length === 0}
        >
          推送到整理板
        </button>
      </div>
    </div>
  );
}
