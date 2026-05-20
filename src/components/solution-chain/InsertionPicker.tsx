import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { selectActiveSession, useSessionStore } from '@/store/sessionStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/cn';
import { IconClose, IconHash, IconPlus } from '@/components/common/Icons';
import type { Insertion, InsertionType } from '@/core/solution';

const TYPE_LABEL: Record<InsertionType, string> = {
  normal: '普通',
  wide: 'Wide',
  commutator: '交换子',
};

function previewMoves(ins: Insertion): string {
  if (ins.type === 'wide') return `wide → ${ins.moves || 'w'}`;
  if (ins.type === 'commutator') return ins.moves || '（未填写）';
  return ins.moves || '（未填写）';
}

export function InsertionPicker() {
  const target = useUIStore((s) => s.insertionPicker);
  const close = useUIStore((s) => s.closeInsertionPicker);
  const session = useSessionStore(selectActiveSession);
  const insertPlaceholder = useSessionStore((s) => s.insertPlaceholder);
  const addInsertion = useSessionStore((s) => s.addInsertion);
  const setActiveNode = useSessionStore((s) => s.setActiveNode);

  const chain = session?.chains.find((c) => c.id === target?.chainId);
  const insertions = chain?.insertions ?? [];

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [target, close]);

  if (!target || !chain || insertions.length === 0) return null;
  if (typeof document === 'undefined') return null;

  const pick = (placeholder: string) => {
    setActiveNode(target.nodeId);
    insertPlaceholder(target.nodeId, placeholder);
    close();
  };

  const handleNew = () => {
    const id = addInsertion(chain.id);
    if (!id) return;
    const created = useSessionStore
      .getState()
      .sessions.find((s) => s.id === useSessionStore.getState().activeSessionId)
      ?.chains.find((c) => c.id === chain.id)
      ?.insertions.find((i) => i.id === id);
    if (created) pick(created.placeholder);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        data-insertion-picker
        className="card w-full max-w-sm p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-semibold text-primary-700">
            <IconHash size={18} />
            选择插入符号
          </h2>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            onClick={close}
            aria-label="取消"
          >
            <IconClose size={16} />
          </button>
        </div>

        <p className="mb-3 text-xs text-slate-500">
          当前有 {insertions.length} 个插入定义，请选择要插入到步骤中的符号。
        </p>

        <ul className="flex flex-col gap-2">
          {insertions.map((ins) => (
            <li key={ins.id}>
              <button
                type="button"
                className={cn(
                  'flex w-full items-start gap-3 rounded-xl border border-primary-100',
                  'bg-white p-3 text-left transition-colors hover:border-primary-300 hover:bg-primary-50',
                )}
                onClick={() => pick(ins.placeholder)}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500 font-mono text-lg font-bold text-white">
                  {ins.placeholder}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-primary-700">
                    {TYPE_LABEL[ins.type]}
                  </span>
                  <code className="mt-0.5 block truncate font-mono text-xs text-slate-600">
                    {previewMoves(ins)}
                  </code>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            className="btn btn-ghost flex-1 text-xs"
            onClick={close}
          >
            取消
          </button>
          <button
            type="button"
            className="btn flex-1 text-xs"
            onClick={handleNew}
          >
            <IconPlus size={14} /> 新建并插入
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
